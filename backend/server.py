from collections import Counter
import math
import os
from pathlib import Path
import re
from typing import Dict, List, Optional
import uuid

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# --- Database Connection ---
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'trivandrum_trails')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

app = FastAPI()
api_router = APIRouter()

INTEREST_CATEGORY_MAP = {
    'Beaches & Nature': {'beach': 2.4, 'nature': 2.2},
    'Historical Sites & Temples': {'temple': 2.3, 'heritage': 1.7, 'church': 1.1, 'mosque': 1.1, 'culture': 1.0},
    'Cafes & Restaurants': {'food': 2.1},
    'Shopping & Local Markets': {'market': 1.9, 'street': 1.2},
    'Parks & Museums': {'heritage': 1.5, 'culture': 1.5, 'nature': 0.8},
    'Adventure & Outdoor Activities': {'nature': 1.7, 'beach': 1.1, 'street': 0.6},
}

GENERIC_SURVEY_WORDS = {'no', 'nil', 'none', 'na', 'nothing', 'nope'}
FOOD_CATEGORY = 'food'


# --- Data Models ---

class PlaceResponse(BaseModel):
    id: str
    name: str
    category: str
    area: str
    description: str
    top: bool
    hidden: bool
    type: Optional[str] = None
    cost: int
    duration: float
    coordinates: List[float]
    image_url: str


class ItineraryRequest(BaseModel):
    place_ids: List[str]
    days: int
    budget: int
    preference: str = "balanced"
    is_auto_generated: Optional[bool] = False


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


def normalize_text(value: Optional[str]) -> str:
    return re.sub(r'[^a-z0-9]+', ' ', (value or '').lower()).strip()


def parse_hidden_gem_value(value: Optional[str]) -> int:
    if not value:
        return 3
    match = re.search(r'(\d+)', str(value))
    if not match:
        return 3
    return int(match.group(1))


def calculate_distance(first: Optional[List[float]], second: Optional[List[float]]) -> float:
    if not first or not second or len(first) < 2 or len(second) < 2:
        return 0.0

    lat1, lon1 = first
    lat2, lon2 = second
    radius = 6371

    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(delta_lon / 2) ** 2
    )
    return radius * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))


def travel_settings(preference: str, survey_profile: Dict[str, object]) -> Dict[str, float]:
    quality_bias = float(survey_profile.get('quality_bias', 0.6))
    experience_bias = float(survey_profile.get('experience_bias', 0.6))

    if preference == 'relaxed':
        hours_per_day = 6.5
        target_stops = 2 if quality_bias >= 0.45 else 3
    elif preference == 'discovery':
        hours_per_day = 8.5
        target_stops = 3 if quality_bias >= 0.45 else 4
    else:
        hours_per_day = 7.5
        target_stops = 3

    return {
        'hours_per_day': hours_per_day,
        'target_stops': target_stops,
        'hard_stop_limit': target_stops + (1 if preference == 'discovery' else 0),
        'soft_stop_hours': hours_per_day * 0.75,
        'seed_penalty': 0.08 if experience_bias >= 0.55 else 0.14,
        'hop_penalty': 0.1 if experience_bias >= 0.55 else 0.16,
    }


async def get_survey_profile() -> Dict[str, object]:
    responses = await db.responses.find({}, {'_id': 0}).to_list(500)
    if not responses:
        return {
            'category_weights': {},
            'hidden_gem_bias': 0.6,
            'quality_bias': 0.6,
            'experience_bias': 0.6,
            'suggestion_terms': Counter(),
            'tourist_trap_terms': Counter(),
        }

    category_votes: Counter = Counter()
    suggestion_terms: Counter = Counter()
    tourist_trap_terms: Counter = Counter()
    hidden_gem_votes: List[int] = []
    itinerary_style_counter: Counter = Counter()
    route_priority_counter: Counter = Counter()

    for response in responses:
        preferences = response.get('preferences', {})
        behavior = response.get('behavior', {})
        feedback = response.get('feedback', {})

        for interest in preferences.get('interests', []) or []:
            for category, weight in INTEREST_CATEGORY_MAP.get(interest, {}).items():
                category_votes[category] += weight

        hidden_gem_votes.append(parse_hidden_gem_value(preferences.get('hiddenGemPreference')))

        itinerary_style = behavior.get('itineraryStyle')
        if itinerary_style:
            itinerary_style_counter[itinerary_style] += 1

        route_priority = behavior.get('routePriority')
        if route_priority:
            route_priority_counter[route_priority] += 1

        for suggestion in (feedback.get('suggestions') or '').replace(';', ',').split(','):
            normalized = normalize_text(suggestion)
            if normalized and normalized not in GENERIC_SURVEY_WORDS:
                suggestion_terms[normalized] += 1

        tourist_trap = normalize_text(feedback.get('touristTrap'))
        if tourist_trap and tourist_trap not in GENERIC_SURVEY_WORDS:
            tourist_trap_terms[tourist_trap] += 1

    max_category_vote = max(category_votes.values(), default=1)
    category_weights = {
        category: 1.0 + (vote / max_category_vote) * 2.25
        for category, vote in category_votes.items()
    }

    quality_preference_votes = itinerary_style_counter.get(
        'Visit 3 high-quality locations far apart (Quality over Distance)',
        0,
    )
    experience_priority_votes = route_priority_counter.get(
        'Best Experience (Visit the most highly-rated places regardless of distance)',
        0,
    )

    return {
        'category_weights': category_weights,
        'hidden_gem_bias': sum(hidden_gem_votes) / max(len(hidden_gem_votes), 1) / 5,
        'quality_bias': quality_preference_votes / max(sum(itinerary_style_counter.values()), 1),
        'experience_bias': experience_priority_votes / max(sum(route_priority_counter.values()), 1),
        'suggestion_terms': suggestion_terms,
        'tourist_trap_terms': tourist_trap_terms,
    }


def survey_match_bonus(place: Dict[str, object], term_counter: Counter) -> float:
    if not term_counter:
        return 0.0

    haystack = ' '.join(
        [
            normalize_text(place.get('name')),
            normalize_text(place.get('area')),
            normalize_text(place.get('category')),
            normalize_text(place.get('description')),
        ]
    )

    bonus = 0.0
    for term, count in term_counter.items():
        if term in haystack:
            bonus += min(1.4, 0.35 * count)
    return bonus


def score_place(
    place: Dict[str, object],
    request: ItineraryRequest,
    survey_profile: Dict[str, object],
) -> float:
    settings = travel_settings(request.preference, survey_profile)
    category_weights = survey_profile.get('category_weights', {})
    hidden_gem_bias = float(survey_profile.get('hidden_gem_bias', 0.6))

    score = 0.0
    score += 6.0 if request.is_auto_generated and place.get('top') else 0.0
    score += 2.2 if place.get('top') else 1.0
    score += float(category_weights.get(place.get('category'), 1.0))

    if place.get('hidden'):
        score += 1.0 * hidden_gem_bias
    elif not place.get('top') and hidden_gem_bias >= 0.65:
        score += 0.35

    day_budget = request.budget / max(request.days, 1)
    ideal_place_budget = request.budget / max(request.days * int(settings['target_stops']), 1)
    cost = int(place.get('cost', 0))

    if cost == 0:
        score += 1.6
    elif cost <= ideal_place_budget:
        score += 2.2
    elif cost <= ideal_place_budget * 1.6:
        score += 1.0
    elif cost <= day_budget * 0.85:
        score -= 0.2
    else:
        score -= 2.4

    ideal_stop_hours = float(settings['hours_per_day']) / max(int(settings['target_stops']), 1)
    duration = float(place.get('duration', 0))
    if duration <= ideal_stop_hours * 1.15:
        score += 1.35
    elif duration <= float(settings['hours_per_day']) * 0.8:
        score += 0.55
    else:
        score -= 1.4

    if request.preference == 'relaxed':
        if place.get('category') in {'nature', 'beach', 'heritage', 'temple'}:
            score += 0.7
        if duration >= 2:
            score += 0.4
    elif request.preference == 'discovery':
        if place.get('category') in {'beach', 'temple', 'heritage', 'nature'}:
            score += 0.75
        if place.get('top'):
            score += 0.65

    score += survey_match_bonus(place, survey_profile.get('suggestion_terms', Counter()))
    score -= survey_match_bonus(place, survey_profile.get('tourist_trap_terms', Counter())) * 0.7

    return round(score, 4)


def choose_day_seed(
    remaining_places: List[Dict[str, object]],
    previous_anchor: Optional[List[float]],
    request: ItineraryRequest,
    settings: Dict[str, float],
) -> Optional[Dict[str, object]]:
    if not remaining_places:
        return None

    auto_pool = [place for place in remaining_places if place.get('top')] if request.is_auto_generated else []
    candidate_pool = auto_pool or remaining_places

    def seed_score(place: Dict[str, object]) -> float:
        base_score = float(place['_planner_score'])
        if previous_anchor:
            base_score -= calculate_distance(previous_anchor, place.get('coordinates')) * float(settings['seed_penalty'])
        return base_score

    return max(candidate_pool, key=seed_score)


def pick_next_place_for_day(
    remaining_places: List[Dict[str, object]],
    day_places: List[Dict[str, object]],
    remaining_budget: int,
    hours_used: float,
    settings: Dict[str, float],
    request: ItineraryRequest,
) -> Optional[Dict[str, object]]:
    if not remaining_places:
        return None

    last_coordinates = day_places[-1].get('coordinates') if day_places else None
    last_area = normalize_text(day_places[-1].get('area')) if day_places else ''
    max_hours = float(settings['hours_per_day']) + (1.4 if not day_places else 0.8)
    candidates = []

    for place in remaining_places:
        cost = int(place.get('cost', 0))
        duration = float(place.get('duration', 0))
        if cost > remaining_budget or hours_used + duration > max_hours:
            continue

        candidate_score = float(place['_planner_score'])
        if last_coordinates:
            distance = calculate_distance(last_coordinates, place.get('coordinates'))
            candidate_score -= distance * float(settings['hop_penalty'])
            if normalize_text(place.get('area')) == last_area:
                candidate_score += 0.8
            if place.get('category') != day_places[-1].get('category'):
                candidate_score += 0.25
        else:
            if request.is_auto_generated and place.get('top'):
                candidate_score += 0.6

        if len(day_places) + 1 >= int(settings['target_stops']) and hours_used + duration > float(settings['hours_per_day']):
            candidate_score -= 0.75

        candidates.append((candidate_score, place))

    if not candidates:
        return None

    candidates.sort(key=lambda item: item[0], reverse=True)
    return candidates[0][1]


def pick_food_place_for_day(
    remaining_food_places: List[Dict[str, object]],
    day_places: List[Dict[str, object]],
    remaining_budget: int,
    hours_used: float,
    settings: Dict[str, float],
) -> Optional[Dict[str, object]]:
    if not remaining_food_places:
        return None

    max_hours = float(settings['hours_per_day']) + 0.5
    day_coordinates = [place.get('coordinates') for place in day_places if place.get('coordinates')]
    day_areas = {normalize_text(place.get('area')) for place in day_places if place.get('area')}
    candidates = []

    for place in remaining_food_places:
        cost = int(place.get('cost', 0))
        duration = float(place.get('duration', 0))
        if cost > remaining_budget or hours_used + duration > max_hours:
            continue

        candidate_score = float(place['_planner_score'])
        candidate_score += 0.95 if place.get('top') else 0.3

        if day_coordinates:
            closest_distance = min(
                calculate_distance(day_coordinate, place.get('coordinates'))
                for day_coordinate in day_coordinates
            )
            candidate_score -= closest_distance * float(settings['hop_penalty']) * 0.7

            if closest_distance <= 2:
                candidate_score += 1.15
            elif closest_distance <= 5:
                candidate_score += 0.7
            elif closest_distance <= 8:
                candidate_score += 0.25

        if normalize_text(place.get('area')) in day_areas:
            candidate_score += 0.85

        candidates.append((candidate_score, place))

    if not candidates:
        return None

    candidates.sort(key=lambda item: item[0], reverse=True)
    return candidates[0][1]


def build_day_itineraries(
    places: List[Dict[str, object]],
    request: ItineraryRequest,
    survey_profile: Dict[str, object],
) -> List[DayItinerary]:
    settings = travel_settings(request.preference, survey_profile)
    remaining_places = sorted(places, key=lambda place: place['_planner_score'], reverse=True)
    remaining_food_places = [place for place in remaining_places if place.get('category') == FOOD_CATEGORY]
    remaining_core_places = [place for place in remaining_places if place.get('category') != FOOD_CATEGORY]
    remaining_budget = request.budget
    previous_anchor = None
    itinerary_days: List[DayItinerary] = []

    for day_number in range(1, request.days + 1):
        if not remaining_core_places and not remaining_food_places:
            break

        day_places: List[Dict[str, object]] = []
        day_cost = 0
        day_duration = 0.0
        food_added = False

        seed_pool = remaining_core_places or remaining_food_places
        seed = choose_day_seed(seed_pool, previous_anchor, request, settings)
        if seed and int(seed.get('cost', 0)) <= remaining_budget:
            day_places.append(seed)
            day_cost += int(seed.get('cost', 0))
            day_duration += float(seed.get('duration', 0))
            remaining_budget -= int(seed.get('cost', 0))
            if seed.get('category') == FOOD_CATEGORY:
                food_added = True
                remaining_food_places = [place for place in remaining_food_places if place['id'] != seed['id']]
            else:
                remaining_core_places = [place for place in remaining_core_places if place['id'] != seed['id']]

        if day_places and not food_added:
            food_place = pick_food_place_for_day(
                remaining_food_places,
                day_places,
                remaining_budget,
                day_duration,
                settings,
            )
            if food_place:
                day_places.append(food_place)
                day_cost += int(food_place.get('cost', 0))
                day_duration += float(food_place.get('duration', 0))
                remaining_budget -= int(food_place.get('cost', 0))
                remaining_food_places = [
                    place for place in remaining_food_places if place['id'] != food_place['id']
                ]
                food_added = True

        while remaining_core_places:
            if len(day_places) >= int(settings['hard_stop_limit']):
                break

            next_place = pick_next_place_for_day(
                remaining_core_places,
                day_places,
                remaining_budget,
                day_duration,
                settings,
                request,
            )
            if not next_place:
                break

            day_places.append(next_place)
            day_cost += int(next_place.get('cost', 0))
            day_duration += float(next_place.get('duration', 0))
            remaining_budget -= int(next_place.get('cost', 0))
            remaining_core_places = [place for place in remaining_core_places if place['id'] != next_place['id']]

            if (
                len(day_places) >= int(settings['target_stops'])
                and day_duration >= float(settings['soft_stop_hours'])
            ):
                break

        if day_places and not food_added:
            food_place = pick_food_place_for_day(
                remaining_food_places,
                day_places,
                remaining_budget,
                day_duration,
                settings,
            )
            if food_place:
                day_places.append(food_place)
                day_cost += int(food_place.get('cost', 0))
                day_duration += float(food_place.get('duration', 0))
                remaining_budget -= int(food_place.get('cost', 0))
                remaining_food_places = [
                    place for place in remaining_food_places if place['id'] != food_place['id']
                ]

        if day_places:
            previous_anchor = day_places[-1].get('coordinates')
            itinerary_days.append(
                DayItinerary(
                    day=day_number,
                    places=day_places,
                    total_cost=day_cost,
                    total_duration=round(day_duration, 1),
                )
            )

    return itinerary_days


def get_recommendations(
    all_ranked_places: List[Dict[str, object]],
    used_place_ids: set[str],
) -> List[Dict[str, object]]:
    recommendations = []
    for place in all_ranked_places:
        if place['id'] in used_place_ids:
            continue
        recommendations.append(place)
        if len(recommendations) == 4:
            break
    return recommendations


# --- API Routes ---

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

    return await db.places.find(query, {"_id": 0}).to_list(1000)


@api_router.post("/generate-itinerary", response_model=ItineraryResponse)
async def generate_itinerary(request: ItineraryRequest):
    if request.days < 1 or request.days > 30:
        raise HTTPException(status_code=400, detail="Days must be between 1 and 30")
    if request.budget <= 0:
        raise HTTPException(status_code=400, detail="Budget must be greater than 0")

    if request.is_auto_generated or not request.place_ids:
        selected_places = await db.places.find({}, {"_id": 0}).to_list(1000)
    else:
        selected_places = await db.places.find({"id": {"$in": request.place_ids}}, {"_id": 0}).to_list(1000)

    if not selected_places:
        raise HTTPException(status_code=404, detail="No matching places were found in the database")

    survey_profile = await get_survey_profile()
    ranked_places = []
    for place in selected_places:
        ranked_place = dict(place)
        ranked_place['_planner_score'] = score_place(ranked_place, request, survey_profile)
        ranked_places.append(ranked_place)

    ranked_places.sort(key=lambda place: place['_planner_score'], reverse=True)
    day_itineraries = build_day_itineraries(ranked_places, request, survey_profile)

    if not day_itineraries:
        raise HTTPException(
            status_code=400,
            detail="The current budget and day count could not fit a workable itinerary. Try increasing the budget or reducing the days.",
        )

    used_place_ids = {
        place.id
        for day in day_itineraries
        for place in day.places
    }
    recommendations = get_recommendations(ranked_places, used_place_ids)

    return ItineraryResponse(
        days=day_itineraries,
        total_cost=sum(day.total_cost for day in day_itineraries),
        total_duration=round(sum(day.total_duration for day in day_itineraries), 1),
        recommendations=recommendations,
    )


# --- App Setup ---

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def seed_data():
    if await db.places.count_documents({}) == 0:
        sample_data = [
            {
                "id": str(uuid.uuid4()),
                "name": "Padmanabhaswamy Temple",
                "category": "temple",
                "area": "East Fort",
                "description": "Historic temple.",
                "top": True,
                "hidden": False,
                "cost": 0,
                "duration": 2.0,
                "coordinates": [8.48, 76.94],
                "image_url": "",
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Kovalam Beach",
                "category": "beach",
                "area": "Kovalam",
                "description": "Famous beach.",
                "top": True,
                "hidden": False,
                "cost": 0,
                "duration": 3.0,
                "coordinates": [8.40, 76.97],
                "image_url": "",
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Aazhimala Temple",
                "category": "temple",
                "area": "Vizhinjam",
                "description": "Cliff temple.",
                "top": False,
                "hidden": True,
                "cost": 50,
                "duration": 1.5,
                "coordinates": [8.38, 76.98],
                "image_url": "",
            },
        ]
        await db.places.insert_many(sample_data)
