from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class Place(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    area: str
    description: str
    top: bool = False
    hidden: bool = False
    type: Optional[str] = None
    cost: int
    duration: float
    coordinates: List[float]
    image_url: str

class PlaceResponse(BaseModel):
    id: str
    name: str
    category: str
    area: str
    description: str
    top: bool
    hidden: bool
    type: Optional[str]
    cost: int
    duration: float
    coordinates: List[float]
    image_url: str

class ItineraryRequest(BaseModel):
    place_ids: List[str]
    days: int
    budget: int
    preference: str = "balanced"

class DayItinerary(BaseModel):
    day: int
    places: List[PlaceResponse]
    total_cost: int
    total_duration: float

class ItineraryResponse(BaseModel):
    days: List[DayItinerary]
    total_cost: int
    total_duration: float
    recommendations: List[PlaceResponse]

# Routes
@api_router.get("/")
async def root():
    return {"message": "Trivandrum Travel Planner API"}

@api_router.get("/places", response_model=List[PlaceResponse])
async def get_places(
    category: Optional[str] = None,
    type: Optional[str] = None,
    top: Optional[bool] = None,
    hidden: Optional[bool] = None,
    search: Optional[str] = None
):
    query = {}
    
    if category and category != "all":
        query["category"] = category
    if type and type != "all":
        query["type"] = type
    if top is not None:
        query["top"] = top
    if hidden is not None:
        query["hidden"] = hidden
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    places = await db.places.find(query, {"_id": 0}).to_list(1000)
    return places

@api_router.get("/places/{place_id}", response_model=PlaceResponse)
async def get_place(place_id: str):
    place = await db.places.find_one({"id": place_id}, {"_id": 0})
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    return place

@api_router.post("/generate-itinerary", response_model=ItineraryResponse)
async def generate_itinerary(request: ItineraryRequest):
    # Fetch all selected places
    places = await db.places.find(
        {"id": {"$in": request.place_ids}},
        {"_id": 0}
    ).to_list(1000)
    
    if not places:
        raise HTTPException(status_code=400, detail="No valid places found")
    
    # Filter places within budget
    total_cost = sum(p["cost"] for p in places)
    if total_cost > request.budget:
        # Sort by priority (top picks first) and cost
        places.sort(key=lambda x: (not x.get("top", False), x["cost"]))
        
        # Select places within budget
        selected = []
        current_cost = 0
        for place in places:
            if current_cost + place["cost"] <= request.budget:
                selected.append(place)
                current_cost += place["cost"]
        places = selected
    
    if not places:
        raise HTTPException(status_code=400, detail="No places fit within budget")
    
    # Group places by area proximity
    area_groups = {}
    for place in places:
        area = place["area"]
        if area not in area_groups:
            area_groups[area] = []
        area_groups[area].append(place)
    
    # Distribute places across days
    days = request.days
    places_per_day = len(places) / days
    
    # Adjust based on preference
    if request.preference == "relaxed":
        places_per_day = max(1, places_per_day * 0.7)
    elif request.preference == "packed":
        places_per_day = places_per_day * 1.3
    
    day_itineraries = []
    remaining_places = places.copy()
    
    for day_num in range(1, days + 1):
        if not remaining_places:
            break
        
        # Calculate how many places for this day
        num_places = int(places_per_day) if day_num < days else len(remaining_places)
        num_places = min(num_places, len(remaining_places))
        
        # Select places for this day (try to group by area)
        day_places = []
        used_indices = []
        
        # Try to group by area
        if remaining_places:
            first_place = remaining_places[0]
            day_places.append(first_place)
            used_indices.append(0)
            
            # Find nearby places
            for i, place in enumerate(remaining_places[1:], 1):
                if len(day_places) >= num_places:
                    break
                if place["area"] == first_place["area"] or len(day_places) < num_places:
                    day_places.append(place)
                    used_indices.append(i)
        
        # Remove used places
        for idx in sorted(used_indices, reverse=True):
            remaining_places.pop(idx)
        
        day_cost = sum(p["cost"] for p in day_places)
        day_duration = sum(p["duration"] for p in day_places)
        
        day_itineraries.append(DayItinerary(
            day=day_num,
            places=day_places,
            total_cost=day_cost,
            total_duration=day_duration
        ))
    
    total_cost = sum(d.total_cost for d in day_itineraries)
    total_duration = sum(d.total_duration for d in day_itineraries)
    
    # Generate recommendations (nearby places not in cart)
    selected_ids = [p["id"] for p in places]
    recommendations = await db.places.find(
        {"id": {"$nin": selected_ids}, "top": True},
        {"_id": 0}
    ).limit(5).to_list(5)
    
    return ItineraryResponse(
        days=day_itineraries,
        total_cost=total_cost,
        total_duration=total_duration,
        recommendations=recommendations
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.on_event("startup")
async def seed_database():
    """Seed the database with Trivandrum places if empty"""
    count = await db.places.count_documents({})
    if count == 0:
        logger.info("Seeding database with Trivandrum places...")
        places_data = [
            # TEMPLES
            {"id": str(uuid.uuid4()), "name": "Sree Padmanabhaswamy Temple", "category": "temple", "area": "East Fort", "description": "One of the richest temples in the world, dedicated to Lord Vishnu. Built in Dravidian architecture with intricate gopuram and located inside East Fort.", "top": True, "hidden": False, "type": None, "cost": 0, "duration": 1.5, "coordinates": [8.4839, 76.9496], "image_url": "https://images.unsplash.com/photo-1644773182167-0d302480d813"},
            {"id": str(uuid.uuid4()), "name": "Attukal Bhagavathy Temple", "category": "temple", "area": "Attukal", "description": "Famous for the Attukal Pongala festival, which holds the Guinness World Record for largest gathering of women. Dedicated to Goddess Bhagavathy.", "top": True, "hidden": False, "type": None, "cost": 0, "duration": 1.0, "coordinates": [8.5, 76.97], "image_url": "https://images.unsplash.com/photo-1644773182167-0d302480d813"},
            {"id": str(uuid.uuid4()), "name": "Pazhavangadi Ganapathy Temple", "category": "temple", "area": "East Fort", "description": "Ancient Ganesha temple located near the East Fort. Known for its powerful deity and peaceful atmosphere.", "top": False, "hidden": False, "type": None, "cost": 0, "duration": 0.5, "coordinates": [8.486, 76.951], "image_url": "https://images.unsplash.com/photo-1644773182167-0d302480d813"},
            {"id": str(uuid.uuid4()), "name": "Aazhimala Shiva Temple", "category": "temple", "area": "Vizhinjam", "description": "Scenic temple on a cliff overlooking the Arabian Sea. Offers breathtaking ocean views and spiritual tranquility.", "top": True, "hidden": False, "type": None, "cost": 50, "duration": 1.5, "coordinates": [8.38, 76.98], "image_url": "https://images.unsplash.com/photo-1644773182167-0d302480d813"},
            {"id": str(uuid.uuid4()), "name": "Janardhana Swamy Temple", "category": "temple", "area": "Varkala", "description": "2000-year-old temple dedicated to Lord Vishnu, located near Varkala Beach. An important pilgrimage site.", "top": True, "hidden": False, "type": None, "cost": 0, "duration": 1.0, "coordinates": [8.738, 76.716], "image_url": "https://images.unsplash.com/photo-1644773182167-0d302480d813"},
            {"id": str(uuid.uuid4()), "name": "Karikkakom Chamundi Temple", "category": "temple", "area": "Karikkakom", "description": "Historic temple dedicated to Goddess Chamundi. Known for its traditional Kerala architecture and annual festival.", "top": False, "hidden": False, "type": None, "cost": 0, "duration": 0.5, "coordinates": [8.53, 76.94], "image_url": "https://images.unsplash.com/photo-1644773182167-0d302480d813"},
            
            # CHURCHES
            {"id": str(uuid.uuid4()), "name": "St Joseph Cathedral Palayam", "category": "church", "area": "Palayam", "description": "Beautiful neo-Gothic Catholic cathedral built in 1873. Features stunning stained glass windows and peaceful ambiance.", "top": False, "hidden": False, "type": None, "cost": 0, "duration": 0.5, "coordinates": [8.506, 76.956], "image_url": "https://images.pexels.com/photos/32542538/pexels-photo-32542538.jpeg"},
            {"id": str(uuid.uuid4()), "name": "Vettucaud Church", "category": "church", "area": "Vettucaud", "description": "Historic coastal church with serene atmosphere. Popular among locals and offers beautiful views of the sea.", "top": False, "hidden": False, "type": None, "cost": 0, "duration": 0.5, "coordinates": [8.47, 76.95], "image_url": "https://images.pexels.com/photos/32542538/pexels-photo-32542538.jpeg"},
            
            # MOSQUES
            {"id": str(uuid.uuid4()), "name": "Palayam Juma Masjid", "category": "mosque", "area": "Palayam", "description": "Historic mosque in the heart of the city. Known for its traditional architecture and communal harmony.", "top": False, "hidden": False, "type": None, "cost": 0, "duration": 0.5, "coordinates": [8.507, 76.957], "image_url": "https://images.pexels.com/photos/32542538/pexels-photo-32542538.jpeg"},
            {"id": str(uuid.uuid4()), "name": "Beemapally Mosque", "category": "mosque", "area": "Beemapally", "description": "16th-century mosque and dargah. Famous for the annual Beemapally Uroos festival celebrated by people of all faiths.", "top": False, "hidden": False, "type": None, "cost": 0, "duration": 1.0, "coordinates": [8.47, 76.94], "image_url": "https://images.pexels.com/photos/32542538/pexels-photo-32542538.jpeg"},
            
            # BEACHES
            {"id": str(uuid.uuid4()), "name": "Kovalam Beach", "category": "beach", "area": "Kovalam", "description": "Internationally famous crescent-shaped beach with lighthouse, water sports, and stunning sunset views. Perfect for swimming and relaxation.", "top": True, "hidden": False, "type": None, "cost": 0, "duration": 3.0, "coordinates": [8.4, 76.979], "image_url": "https://images.unsplash.com/photo-1695030744519-3f3042b3af26"},
            {"id": str(uuid.uuid4()), "name": "Varkala Cliff Beach", "category": "beach", "area": "Varkala", "description": "Unique beach with dramatic red cliffs, natural springs, and vibrant cafes. Known as Papanasam Beach for its spiritual significance.", "top": True, "hidden": False, "type": None, "cost": 50, "duration": 3.0, "coordinates": [8.738, 76.716], "image_url": "https://images.unsplash.com/photo-1695030744519-3f3042b3af26"},
            {"id": str(uuid.uuid4()), "name": "Shankumugham Beach", "category": "beach", "area": "Shankumugham", "description": "Popular sunset beach near the airport. Features a massive mermaid sculpture and evening food stalls.", "top": False, "hidden": False, "type": None, "cost": 0, "duration": 2.0, "coordinates": [8.475, 76.923], "image_url": "https://images.unsplash.com/photo-1695030744519-3f3042b3af26"},
            {"id": str(uuid.uuid4()), "name": "Poovar Beach", "category": "beach", "area": "Poovar", "description": "Pristine golden sand beach where the Neyyar River meets the Arabian Sea. Known for its tranquil backwaters and boat rides.", "top": True, "hidden": False, "type": None, "cost": 200, "duration": 3.0, "coordinates": [8.315, 77.072], "image_url": "https://images.unsplash.com/photo-1695030744519-3f3042b3af26"},
            {"id": str(uuid.uuid4()), "name": "Chowara Beach", "category": "beach", "area": "Chowara", "description": "Secluded beach perfect for ayurvedic retreats and peaceful relaxation. Less crowded than Kovalam.", "top": False, "hidden": False, "type": None, "cost": 0, "duration": 2.0, "coordinates": [8.365, 76.995], "image_url": "https://images.unsplash.com/photo-1695030744519-3f3042b3af26"},
            {"id": str(uuid.uuid4()), "name": "Veli Beach", "category": "beach", "area": "Veli", "description": "Beach with a scenic lagoon where backwaters meet the sea. Offers boating and water sports facilities.", "top": False, "hidden": False, "type": None, "cost": 100, "duration": 2.0, "coordinates": [8.463, 76.914], "image_url": "https://images.unsplash.com/photo-1695030744519-3f3042b3af26"},
            
            # HERITAGE
            {"id": str(uuid.uuid4()), "name": "Napier Museum", "category": "heritage", "area": "Museum Road", "description": "19th-century museum showcasing Kerala's rich cultural and artistic heritage. Features natural history and archaeological artifacts.", "top": True, "hidden": False, "type": None, "cost": 20, "duration": 1.5, "coordinates": [8.501, 76.956], "image_url": "https://images.pexels.com/photos/19934600/pexels-photo-19934600.jpeg"},
            {"id": str(uuid.uuid4()), "name": "Kuthiramalika Palace", "category": "heritage", "area": "East Fort", "description": "Royal palace built by Maharaja Swathi Thirunal. Features 122 wooden horses and exquisite Kerala architecture.", "top": True, "hidden": False, "type": None, "cost": 50, "duration": 1.0, "coordinates": [8.483, 76.949], "image_url": "https://images.pexels.com/photos/19934600/pexels-photo-19934600.jpeg"},
            {"id": str(uuid.uuid4()), "name": "Sri Chitra Art Gallery", "category": "heritage", "area": "Museum Road", "description": "Premier art gallery displaying works by Raja Ravi Varma and other renowned artists. Houses Mughal, Rajput, and Tanjore paintings.", "top": True, "hidden": False, "type": None, "cost": 20, "duration": 1.0, "coordinates": [8.502, 76.957], "image_url": "https://images.pexels.com/photos/19934600/pexels-photo-19934600.jpeg"},
            {"id": str(uuid.uuid4()), "name": "Kanakakkunnu Palace", "category": "heritage", "area": "Museum Road", "description": "'Palace of Gold' with beautiful gardens. Now used as a venue for cultural events and conferences.", "top": False, "hidden": False, "type": None, "cost": 20, "duration": 1.0, "coordinates": [8.504, 76.954], "image_url": "https://images.pexels.com/photos/19934600/pexels-photo-19934600.jpeg"},
            {"id": str(uuid.uuid4()), "name": "Padmanabhapuram Palace", "category": "heritage", "area": "Near TVM", "description": "Magnificent wooden palace of the Travancore rulers. Features intricate carvings, murals, and traditional Kerala architecture.", "top": True, "hidden": False, "type": None, "cost": 50, "duration": 2.0, "coordinates": [8.244, 77.325], "image_url": "https://images.pexels.com/photos/19934600/pexels-photo-19934600.jpeg"},
            
            # NATURE
            {"id": str(uuid.uuid4()), "name": "Ponmudi Hills", "category": "nature", "area": "Ponmudi", "description": "Hill station at 1100m altitude with tea gardens, winding roads, and cool climate. Perfect for trekking and nature walks.", "top": True, "hidden": False, "type": None, "cost": 0, "duration": 6.0, "coordinates": [8.762, 77.109], "image_url": "https://images.unsplash.com/photo-1642219236097-ac751378a901"},
            {"id": str(uuid.uuid4()), "name": "Neyyar Dam", "category": "nature", "area": "Neyyar", "description": "Scenic dam with boating facilities, surrounded by lush forests. Home to a lion safari park and deer park.", "top": True, "hidden": False, "type": None, "cost": 100, "duration": 3.0, "coordinates": [8.526, 77.176], "image_url": "https://images.unsplash.com/photo-1642219236097-ac751378a901"},
            {"id": str(uuid.uuid4()), "name": "Peppara Wildlife Sanctuary", "category": "nature", "area": "Peppara", "description": "Wildlife sanctuary with diverse flora and fauna. Ideal for wildlife photography and nature enthusiasts.", "top": False, "hidden": False, "type": None, "cost": 50, "duration": 4.0, "coordinates": [8.617, 77.168], "image_url": "https://images.unsplash.com/photo-1642219236097-ac751378a901"},
            {"id": str(uuid.uuid4()), "name": "Akkulam Lake", "category": "nature", "area": "Akkulam", "description": "Serene lake with boating facilities and children's park. Popular picnic spot for families.", "top": False, "hidden": False, "type": None, "cost": 50, "duration": 2.0, "coordinates": [8.518, 76.952], "image_url": "https://images.unsplash.com/photo-1642219236097-ac751378a901"},
            {"id": str(uuid.uuid4()), "name": "Veli Tourist Village", "category": "nature", "area": "Veli", "description": "Tourist village where Veli Lake meets the Arabian Sea. Offers boat rides, floating bridge, and water activities.", "top": False, "hidden": False, "type": None, "cost": 100, "duration": 2.5, "coordinates": [8.464, 76.915], "image_url": "https://images.unsplash.com/photo-1642219236097-ac751378a901"},
            
            # MARKETS
            {"id": str(uuid.uuid4()), "name": "Chalai Market", "category": "market", "area": "East Fort", "description": "Bustling traditional market for local shopping. Find spices, textiles, jewelry, and authentic Kerala products.", "top": True, "hidden": False, "type": None, "cost": 0, "duration": 1.5, "coordinates": [8.489, 76.951], "image_url": "https://images.unsplash.com/photo-1642219236097-ac751378a901"},
            {"id": str(uuid.uuid4()), "name": "Lulu Mall", "category": "market", "area": "Akkulam", "description": "One of India's largest shopping malls. Features international brands, food courts, cinema, and entertainment zones.", "top": True, "hidden": False, "type": None, "cost": 0, "duration": 3.0, "coordinates": [8.519, 76.953], "image_url": "https://images.unsplash.com/photo-1642219236097-ac751378a901"},
            {"id": str(uuid.uuid4()), "name": "Mall of Travancore", "category": "market", "area": "Chackai", "description": "Modern shopping mall with retail outlets, multiplex cinema, and dining options.", "top": False, "hidden": False, "type": None, "cost": 0, "duration": 2.0, "coordinates": [8.52, 76.96], "image_url": "https://images.unsplash.com/photo-1642219236097-ac751378a901"},
            {"id": str(uuid.uuid4()), "name": "MG Road", "category": "market", "area": "Statue", "description": "Main shopping street with clothing stores, electronics, and local businesses. Heart of city's commercial activity.", "top": False, "hidden": False, "type": None, "cost": 0, "duration": 2.0, "coordinates": [8.507, 76.952], "image_url": "https://images.unsplash.com/photo-1642219236097-ac751378a901"},
            
            # FOOD
            {"id": str(uuid.uuid4()), "name": "Zam Zam Restaurant", "category": "food", "area": "Palayam", "description": "Iconic restaurant famous for authentic Malabar biryani and traditional Kerala cuisine. A must-visit for food lovers.", "top": True, "hidden": False, "type": "local", "cost": 300, "duration": 1.0, "coordinates": [8.506, 76.957], "image_url": "https://images.pexels.com/photos/14132112/pexels-photo-14132112.jpeg"},
            {"id": str(uuid.uuid4()), "name": "Paragon Restaurant TVM", "category": "food", "area": "Kesavadasapuram", "description": "Legendary restaurant chain serving delicious seafood and Kerala specialties. Known for fish curry and appam.", "top": True, "hidden": False, "type": "local", "cost": 400, "duration": 1.0, "coordinates": [8.524, 76.939], "image_url": "https://images.pexels.com/photos/14132112/pexels-photo-14132112.jpeg"},
            {"id": str(uuid.uuid4()), "name": "Villa Maya", "category": "food", "area": "East Fort", "description": "Fine dining in a restored 18th-century Dutch manor. Offers fusion Kerala cuisine in an elegant heritage setting.", "top": True, "hidden": False, "type": "premium", "cost": 1000, "duration": 2.0, "coordinates": [8.486, 76.951], "image_url": "https://images.pexels.com/photos/14132112/pexels-photo-14132112.jpeg"},
            {"id": str(uuid.uuid4()), "name": "Azad Restaurant", "category": "food", "area": "Statue", "description": "Popular eatery for North Indian and Mughlai dishes. Famous for butter chicken and naan.", "top": True, "hidden": False, "type": "local", "cost": 350, "duration": 1.0, "coordinates": [8.507, 76.952], "image_url": "https://images.pexels.com/photos/14132112/pexels-photo-14132112.jpeg"},
            {"id": str(uuid.uuid4()), "name": "Indian Coffee House", "category": "food", "area": "Statue", "description": "Iconic coffee house with unique spiral architecture. Serves filter coffee, dosas, and traditional snacks at budget prices.", "top": False, "hidden": False, "type": "budget", "cost": 100, "duration": 0.5, "coordinates": [8.508, 76.952], "image_url": "https://images.pexels.com/photos/14132112/pexels-photo-14132112.jpeg"},
            {"id": str(uuid.uuid4()), "name": "Cafe Mojo", "category": "food", "area": "Vazhuthacaud", "description": "Trendy cafe with modern ambiance. Great for coffee, smoothies, and continental food.", "top": False, "hidden": False, "type": "cafe", "cost": 250, "duration": 1.0, "coordinates": [8.521, 76.954], "image_url": "https://images.pexels.com/photos/14132112/pexels-photo-14132112.jpeg"},
            
            # CULTURE
            {"id": str(uuid.uuid4()), "name": "Nishagandhi Open Air Theatre", "category": "culture", "area": "Kanakakkunnu", "description": "Open-air auditorium hosting classical dance and music performances. Part of the Nishagandhi Dance Festival.", "top": False, "hidden": False, "type": None, "cost": 200, "duration": 2.0, "coordinates": [8.504, 76.954], "image_url": "https://images.pexels.com/photos/32542538/pexels-photo-32542538.jpeg"},
            {"id": str(uuid.uuid4()), "name": "Priyadarsini Planetarium", "category": "culture", "area": "PMG Junction", "description": "Planetarium with astronomy shows and science exhibitions. Educational and entertaining for all ages.", "top": False, "hidden": False, "type": None, "cost": 50, "duration": 1.5, "coordinates": [8.502, 76.958], "image_url": "https://images.pexels.com/photos/32542538/pexels-photo-32542538.jpeg"},
            {"id": str(uuid.uuid4()), "name": "Kerala Science & Technology Museum", "category": "culture", "area": "PMG Junction", "description": "Interactive science museum with hands-on exhibits. Perfect for families and curious minds.", "top": False, "hidden": False, "type": None, "cost": 50, "duration": 2.0, "coordinates": [8.502, 76.958], "image_url": "https://images.pexels.com/photos/32542538/pexels-photo-32542538.jpeg"},
            
            # STREETS
            {"id": str(uuid.uuid4()), "name": "Manaveeyam Veedhi", "category": "street", "area": "Vellayambalam", "description": "Pedestrian-friendly street with cafes, bookstores, and art spaces. Great for evening walks and cultural vibes.", "top": True, "hidden": False, "type": None, "cost": 0, "duration": 1.5, "coordinates": [8.512, 76.956], "image_url": "https://images.unsplash.com/photo-1642219236097-ac751378a901"},
            {"id": str(uuid.uuid4()), "name": "Kovalam Lighthouse Walk", "category": "street", "area": "Kovalam", "description": "Scenic coastal walk from Lighthouse Beach with stunning views, beach shacks, and sunset spots.", "top": True, "hidden": False, "type": None, "cost": 0, "duration": 2.0, "coordinates": [8.401, 76.978], "image_url": "https://images.unsplash.com/photo-1642219236097-ac751378a901"},
            {"id": str(uuid.uuid4()), "name": "Varkala Cliff Walk", "category": "street", "area": "Varkala", "description": "Cliff-top walkway lined with cafes, shops, and viewpoints overlooking the beach. Perfect for sunset strolls.", "top": True, "hidden": False, "type": None, "cost": 0, "duration": 2.0, "coordinates": [8.738, 76.716], "image_url": "https://images.unsplash.com/photo-1642219236097-ac751378a901"},
        ]
        
        await db.places.insert_many(places_data)
        logger.info(f"Seeded {len(places_data)} places to database")
