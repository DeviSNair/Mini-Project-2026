import requests
import sys
import json
from typing import List, Dict

class TrivandumAPITester:
    def __init__(self, base_url="http://127.0.0.1:8000"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.content:
                    try:
                        response_data = response.json()
                        self.test_results.append({
                            'test': name,
                            'status': 'PASSED',
                            'response_sample': str(response_data)[:200] + '...' if len(str(response_data)) > 200 else response_data
                        })
                        return True, response_data
                    except:
                        return True, {}
                return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_response = response.json() if response.content else {}
                except:
                    error_response = response.text
                self.test_results.append({
                    'test': name,
                    'status': 'FAILED',
                    'error': f"Expected {expected_status}, got {response.status_code}",
                    'response': error_response
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                'test': name,
                'status': 'ERROR',
                'error': str(e)
            })
            return False, {}

    def test_api_health(self):
        """Test API root endpoint"""
        return self.run_test("API Health Check", "GET", "api/", 200)

    def test_get_all_places(self):
        """Test getting all places"""
        success, data = self.run_test("Get All Places", "GET", "api/places", 200)
        if success and data:
            print(f"   📊 Found {len(data)} places")
            return len(data)
        return 0

    def test_category_filters(self):
        """Test category filtering"""
        categories = ['temple', 'beach', 'heritage', 'food', 'nature', 'market', 'culture', 'street']
        
        for category in categories:
            success, data = self.run_test(
                f"Filter by Category: {category.title()}", 
                "GET", 
                "api/places", 
                200, 
                params={'category': category}
            )
            if success and data:
                print(f"   📊 Found {len(data)} {category} places")

    def test_type_filters(self):
        """Test type filtering"""
        types = ['budget', 'local', 'premium', 'cafe']
        
        for type_filter in types:
            success, data = self.run_test(
                f"Filter by Type: {type_filter.title()}", 
                "GET", 
                "api/places", 
                200, 
                params={'type': type_filter}
            )
            if success and data:
                print(f"   📊 Found {len(data)} {type_filter} places")

    def test_special_filters(self):
        """Test top picks and hidden gems filters"""
        # Test top picks
        success, data = self.run_test(
            "Filter Top Picks", 
            "GET", 
            "api/places", 
            200, 
            params={'top': True}
        )
        if success and data:
            print(f"   📊 Found {len(data)} top picks")

        # Test hidden gems
        success, data = self.run_test(
            "Filter Hidden Gems", 
            "GET", 
            "api/places", 
            200, 
            params={'hidden': True}
        )
        if success and data:
            print(f"   📊 Found {len(data)} hidden gems")

    def test_search_functionality(self):
        """Test search functionality"""
        search_terms = ['Kovalam', 'temple', 'beach']
        
        for term in search_terms:
            success, data = self.run_test(
                f"Search for: {term}", 
                "GET", 
                "api/places", 
                200, 
                params={'search': term}
            )
            if success and data:
                print(f"   📊 Found {len(data)} places matching '{term}'")

    def test_get_single_place(self, place_id: str):
        """Test getting a single place by ID"""
        return self.run_test(f"Get Place by ID", "GET", f"api/places/{place_id}", 200)

    def test_generate_itinerary(self, place_ids: List[str]):
        """Test itinerary generation"""
        if not place_ids:
            print("⚠️  No place IDs available for itinerary test")
            return False, {}
            
        # Test with valid parameters
        success, data = self.run_test(
            "Generate Itinerary - Valid", 
            "POST", 
            "api/generate-itinerary",
            200,
            data={
                "place_ids": place_ids[:5],  # Use first 5 places
                "days": 3,
                "budget": 5000,
                "preference": "balanced"
            }
        )
        
        if success and data:
            print(f"   📊 Generated {len(data.get('days', []))} day itinerary")
            print(f"   💰 Total cost: ₹{data.get('total_cost', 0)}")
            print(f"   ⏱️  Total duration: {data.get('total_duration', 0)}h")
            print(f"   🎯 Recommendations: {len(data.get('recommendations', []))}")

        # Test edge cases
        self.run_test(
            "Generate Itinerary - Empty Places", 
            "POST", 
            "api/generate-itinerary",
            400,
            data={"place_ids": [], "days": 3, "budget": 5000, "preference": "balanced"}
        )

        self.run_test(
            "Generate Itinerary - Low Budget", 
            "POST", 
            "api/generate-itinerary",
            200,
            data={"place_ids": place_ids[:3], "days": 2, "budget": 100, "preference": "balanced"}
        )

        return success, data

def main():
    tester = TrivandumAPITester()
    
    print("🚀 Starting Trivandrum Travel Planner API Tests")
    print("=" * 60)

    # Test API health
    tester.test_api_health()
    
    # Test basic functionality
    total_places = tester.test_get_all_places()
    
    if total_places == 0:
        print("❌ No places found. Database might not be seeded.")
        return 1

    # Test filtering
    tester.test_category_filters()
    tester.test_type_filters()
    tester.test_special_filters()
    tester.test_search_functionality()
    
    # Get some place IDs for further testing
    success, places_data = tester.run_test("Get Places for ID Testing", "GET", "api/places", 200, params={'category': 'temple'})
    
    if success and places_data and len(places_data) > 0:
        # Test single place retrieval
        first_place_id = places_data[0]['id']
        tester.test_get_single_place(first_place_id)
        
        # Test itinerary generation
        place_ids = [place['id'] for place in places_data[:8]]  # Get first 8 places
        tester.test_generate_itinerary(place_ids)

    # Print summary
    print("\n" + "=" * 60)
    print(f"📊 Test Summary: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
