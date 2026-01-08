import requests
import sys
import json
from datetime import datetime

class SmartDobiAPITester:
    def __init__(self, base_url="https://dobi-alert.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)
        
        if self.session_token:
            default_headers['Authorization'] = f'Bearer {self.session_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=default_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code} - {response.text}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request error: {str(e)}")
            return False, {}

    def test_public_endpoints(self):
        """Test all public endpoints"""
        print("\n🔍 Testing Public Endpoints...")
        
        # Test root endpoint
        self.run_test("API Root", "GET", "", 200)
        
        # Test get all machines
        success, machines_data = self.run_test("Get All Machines", "GET", "machines", 200)
        
        if success and machines_data:
            print(f"   Found {len(machines_data)} machines")
            for machine in machines_data:
                print(f"   Machine {machine.get('machine_id')}: {machine.get('status')}")
        
        # Test get single machine
        self.run_test("Get Machine 1", "GET", "machines/1", 200)
        self.run_test("Get Machine 2", "GET", "machines/2", 200)
        
        # Test non-existent machine
        self.run_test("Get Non-existent Machine", "GET", "machines/999", 404)

    def test_machine_operations(self):
        """Test machine start operations"""
        print("\n🔍 Testing Machine Operations...")
        
        # Test starting machine with valid data
        start_data = {
            "whatsapp_number": "0189892155",
            "amount": 5.00
        }
        
        success, response = self.run_test(
            "Start Machine 2", 
            "POST", 
            "machines/2/start", 
            200, 
            start_data
        )
        
        if success:
            print(f"   Transaction ID: {response.get('transaction_id')}")
        
        # Test starting already busy machine (should fail)
        self.run_test(
            "Start Busy Machine", 
            "POST", 
            "machines/2/start", 
            400, 
            start_data
        )
        
        # Test starting non-existent machine
        self.run_test(
            "Start Non-existent Machine", 
            "POST", 
            "machines/999/start", 
            404, 
            start_data
        )

    def test_whatsapp_validation(self):
        """Test WhatsApp number validation"""
        print("\n🔍 Testing WhatsApp Validation...")
        
        # Test invalid WhatsApp numbers
        invalid_numbers = [
            "123",  # too short
            "abcdefghijk",  # letters
            "01234567890123456",  # too long
        ]
        
        for number in invalid_numbers:
            invalid_data = {
                "whatsapp_number": number,
                "amount": 5.00
            }
            # Note: This might pass if backend doesn't validate - we'll check
            success, response = self.run_test(
                f"Invalid WhatsApp: {number}", 
                "POST", 
                "machines/1/start", 
                400,  # expecting validation error
                invalid_data
            )

    def create_test_session(self):
        """Create a test session for protected endpoints"""
        print("\n🔍 Creating Test Session...")
        
        # This is a mock session creation - in real scenario we'd need OAuth flow
        # For testing, we'll try to use the session endpoint with a dummy session_id
        session_data = {
            "session_id": "test_session_123"
        }
        
        success, response = self.run_test(
            "Create Session (Mock)", 
            "POST", 
            "auth/session", 
            200,  # This might fail if OAuth service is not accessible
            session_data
        )
        
        if success and 'session_token' in response:
            self.session_token = response['session_token']
            print(f"   Session token obtained: {self.session_token[:20]}...")
            return True
        else:
            print("   ⚠️  Session creation failed - will skip protected endpoint tests")
            return False

    def test_protected_endpoints(self):
        """Test protected endpoints (requires authentication)"""
        print("\n🔍 Testing Protected Endpoints...")
        
        if not self.session_token:
            print("   ⚠️  No session token - skipping protected tests")
            return
        
        # Test dashboard stats
        self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)
        
        # Test transactions
        self.run_test("Get Transactions", "GET", "transactions", 200)
        
        # Test get current user
        self.run_test("Get Current User", "GET", "auth/me", 200)
        
        # Test admin machine status control (NEW FEATURE)
        self.test_admin_machine_control()

    def test_admin_machine_control(self):
        """Test admin machine status control (NEW FEATURE)"""
        print("\n🔍 Testing Admin Machine Control...")
        
        if not self.session_token:
            print("   ⚠️  No session token - skipping admin tests")
            return
        
        # Test setting machine to maintenance
        maintenance_data = {"status": "broken"}
        success, response = self.run_test(
            "Set Machine to Maintenance", 
            "PATCH", 
            "machines/1/admin-status", 
            200, 
            maintenance_data
        )
        
        # Test setting machine back to available
        available_data = {"status": "available"}
        self.run_test(
            "Set Machine to Available", 
            "PATCH", 
            "machines/1/admin-status", 
            200, 
            available_data
        )
        
        # Test invalid status
        invalid_data = {"status": "invalid_status"}
        self.run_test(
            "Invalid Admin Status", 
            "PATCH", 
            "machines/1/admin-status", 
            400, 
            invalid_data
        )

    def test_esp32_simulation(self):
        """Test ESP32 simulation endpoints"""
        print("\n🔍 Testing ESP32 Simulation...")
        
        # Test updating machine status (ESP32 calls)
        esp32_url = f"{self.base_url}/api/machines/1/status?status=washing&time_remaining=118"
        
        try:
            response = requests.put(esp32_url, timeout=10)
            success = response.status_code == 200
            self.log_test("ESP32 Status Update", success, 
                         f"Status: {response.status_code}" if success else f"Failed: {response.text}")
            
            if success:
                # Verify the update worked
                success2, machine_data = self.run_test("Verify ESP32 Update", "GET", "machines/1", 200)
                if success2 and machine_data:
                    time_remaining = machine_data.get('time_remaining', 0)
                    print(f"   Machine 1 time remaining: {time_remaining}s")
                    if time_remaining == 118:
                        self.log_test("ESP32 Timer Update Verified", True)
                    else:
                        self.log_test("ESP32 Timer Update Verified", False, f"Expected 118, got {time_remaining}")
        
        except Exception as e:
            self.log_test("ESP32 Status Update", False, f"Request error: {str(e)}")
        
        # Test reminder endpoint
        self.run_test("ESP32 Send Reminder", "POST", "machines/1/reminder", 200)

    def test_unauthorized_access(self):
        """Test accessing protected endpoints without auth"""
        print("\n🔍 Testing Unauthorized Access...")
        
        # Temporarily remove session token
        temp_token = self.session_token
        self.session_token = None
        
        # These should all return 401
        self.run_test("Unauthorized Dashboard Stats", "GET", "dashboard/stats", 401)
        self.run_test("Unauthorized Transactions", "GET", "transactions", 401)
        self.run_test("Unauthorized Get Me", "GET", "auth/me", 401)
        
        # Restore session token
        self.session_token = temp_token

    def test_data_integrity(self):
        """Test data integrity and serialization"""
        print("\n🔍 Testing Data Integrity...")
        
        # Get machines and check for MongoDB ObjectId issues
        success, machines = self.run_test("Check Machine Data", "GET", "machines", 200)
        
        if success:
            for machine in machines:
                if '_id' in machine:
                    self.log_test("No ObjectId in Machine Response", False, "Found _id field in response")
                    break
            else:
                self.log_test("No ObjectId in Machine Response", True)

    def print_summary(self):
        """Print test summary"""
        print(f"\n📊 Test Summary")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['name']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    print("🚀 Starting Smart Dobi API Testing...")
    print(f"Testing against: https://dobi-alert.preview.emergentagent.com")
    
    tester = SmartDobiAPITester()
    
    # Run all test suites
    tester.test_public_endpoints()
    tester.test_machine_operations()
    tester.test_whatsapp_validation()
    tester.test_unauthorized_access()
    tester.test_data_integrity()
    tester.test_esp32_simulation()
    
    # Try to create session for protected tests
    if tester.create_test_session():
        tester.test_protected_endpoints()
    
    # Print final summary
    success = tester.print_summary()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())