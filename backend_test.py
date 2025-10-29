import requests
import sys
import json
from datetime import datetime

class LinkedInSearchAPITester:
    def __init__(self, base_url="https://linkedin-finder-2.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_profile_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root Endpoint", "GET", "", 200)

    def test_search_profiles(self):
        """Test LinkedIn profile search"""
        search_data = {
            "keywords": "software engineer",
            "location": "San Francisco",
            "job_title": "Senior Developer",
            "company": "Google"
        }
        success, response = self.run_test(
            "Search LinkedIn Profiles",
            "POST",
            "search",
            200,
            data=search_data
        )
        
        if success and response:
            # Validate response structure
            if "results" in response and "total_results" in response:
                print(f"   Found {len(response['results'])} results")
                return True, response
            else:
                print("   ❌ Invalid response structure")
                return False, {}
        return success, response

    def test_search_basic_keywords(self):
        """Test search with basic keywords only"""
        search_data = {
            "keywords": "data scientist"
        }
        return self.run_test(
            "Search with Basic Keywords",
            "POST",
            "search",
            200,
            data=search_data
        )

    def test_search_empty_keywords(self):
        """Test search with empty keywords"""
        search_data = {
            "keywords": ""
        }
        return self.run_test(
            "Search with Empty Keywords",
            "POST",
            "search",
            422,  # Should fail validation
            data=search_data
        )

    def test_save_profile(self):
        """Test saving a LinkedIn profile"""
        profile_data = {
            "title": "John Doe - Software Engineer at Google",
            "link": "https://linkedin.com/in/johndoe-test-profile",
            "snippet": "Experienced software engineer with 5+ years in full-stack development",
            "thumbnail": "https://example.com/thumbnail.jpg"
        }
        success, response = self.run_test(
            "Save Profile",
            "POST",
            "profiles",
            200,
            data=profile_data
        )
        
        if success and response and "id" in response:
            self.test_profile_id = response["id"]
            print(f"   Saved profile with ID: {self.test_profile_id}")
        
        return success, response

    def test_save_duplicate_profile(self):
        """Test saving duplicate profile (should fail)"""
        profile_data = {
            "title": "John Doe - Software Engineer at Google",
            "link": "https://linkedin.com/in/johndoe-test-profile",  # Same link as before
            "snippet": "Experienced software engineer with 5+ years in full-stack development",
            "thumbnail": "https://example.com/thumbnail.jpg"
        }
        return self.run_test(
            "Save Duplicate Profile",
            "POST",
            "profiles",
            400,  # Should fail with 400
            data=profile_data
        )

    def test_get_saved_profiles(self):
        """Test getting all saved profiles"""
        return self.run_test(
            "Get All Saved Profiles",
            "GET",
            "profiles",
            200
        )

    def test_get_profiles_with_search_filter(self):
        """Test getting profiles with search filter"""
        return self.run_test(
            "Get Profiles with Search Filter",
            "GET",
            "profiles",
            200,
            params={"search_term": "software"}
        )

    def test_update_profile_tags(self):
        """Test updating profile tags"""
        if not self.test_profile_id:
            print("   ⚠️  Skipped - No profile ID available")
            return True, {}
        
        tags_data = ["software", "engineer", "google"]
        return self.run_test(
            "Update Profile Tags",
            "PUT",
            f"profiles/{self.test_profile_id}/tags",
            200,
            data=tags_data
        )

    def test_delete_profile(self):
        """Test deleting a saved profile"""
        if not self.test_profile_id:
            print("   ⚠️  Skipped - No profile ID available")
            return True, {}
        
        return self.run_test(
            "Delete Profile",
            "DELETE",
            f"profiles/{self.test_profile_id}",
            200
        )

    def test_delete_nonexistent_profile(self):
        """Test deleting non-existent profile"""
        fake_id = "non-existent-id-12345"
        return self.run_test(
            "Delete Non-existent Profile",
            "DELETE",
            f"profiles/{fake_id}",
            404
        )

def main():
    print("🚀 Starting LinkedIn Search API Tests")
    print("=" * 50)
    
    tester = LinkedInSearchAPITester()
    
    # Test sequence
    test_functions = [
        tester.test_root_endpoint,
        tester.test_search_profiles,
        tester.test_search_basic_keywords,
        tester.test_search_empty_keywords,
        tester.test_save_profile,
        tester.test_save_duplicate_profile,
        tester.test_get_saved_profiles,
        tester.test_get_profiles_with_search_filter,
        tester.test_update_profile_tags,
        tester.test_delete_profile,
        tester.test_delete_nonexistent_profile
    ]
    
    # Run all tests
    for test_func in test_functions:
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test {test_func.__name__} failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())