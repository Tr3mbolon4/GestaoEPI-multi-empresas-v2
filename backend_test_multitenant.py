#!/usr/bin/env python3
"""
Multi-Tenant GestorEPI Backend Testing
Tests the new multi-tenant features and SUPER_ADMIN functionality
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class MultiTenantGestorEPITester:
    def __init__(self, base_url="https://epi-manager-12.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.super_admin_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.test_empresa_id = None

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    expected_status: int = 200, token: str = None) -> tuple[bool, Dict]:
        """Make API request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text[:200]}
            
            if not success:
                response_data["status_code"] = response.status_code
                
            return success, response_data
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_super_admin_login(self):
        """Test SUPER_ADMIN login"""
        print("\n🔐 Testing SUPER_ADMIN Authentication...")
        
        success, response = self.make_request(
            "POST", 
            "auth/login",
            {"username": "superadmin", "password": "Super@2026!"}
        )
        
        if success and 'access_token' in response:
            self.super_admin_token = response['access_token']
            role = response.get('role')
            if role == 'super_admin':
                self.log_test("SUPER_ADMIN login successful", True)
                print(f"   Role: {role}")
                print(f"   Empresa ID: {response.get('empresa_id', 'None (expected for super_admin)')}")
                return True
            else:
                self.log_test("SUPER_ADMIN login successful", False, f"Expected super_admin role, got {role}")
                return False
        else:
            self.log_test("SUPER_ADMIN login successful", False, f"Response: {response}")
            return False

    def test_admin_login(self):
        """Test regular admin login"""
        print("\n🔐 Testing Admin Authentication...")
        
        success, response = self.make_request(
            "POST", 
            "auth/login",
            {"username": "admin", "password": "Admin@2026!"}
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            role = response.get('role')
            empresa_id = response.get('empresa_id')
            empresa_nome = response.get('empresa_nome')
            
            if role == 'admin' and empresa_id:
                self.log_test("Admin login successful", True)
                print(f"   Role: {role}")
                print(f"   Empresa ID: {empresa_id}")
                print(f"   Empresa Nome: {empresa_nome}")
                return True
            else:
                self.log_test("Admin login successful", False, f"Expected admin role with empresa_id, got role={role}, empresa_id={empresa_id}")
                return False
        else:
            self.log_test("Admin login successful", False, f"Response: {response}")
            return False

    def test_health_check_branding(self):
        """Test API health endpoint and verify GestorEPI branding"""
        print("\n🏥 Testing Health Check and Branding...")
        
        success, response = self.make_request("GET", "health")
        
        if success:
            self.log_test("Health check endpoint responding", True)
            print(f"   Status: {response.get('status', 'unknown')}")
            print(f"   Database: {response.get('database', 'unknown')}")
            
            # Check root endpoint for branding
            success_root, root_response = self.make_request("GET", "")
            if success_root:
                message = root_response.get('message', '')
                if 'GestorEPI' in message:
                    self.log_test("System shows GestorEPI branding", True)
                    print(f"   API Message: {message}")
                else:
                    self.log_test("System shows GestorEPI branding", False, f"Expected 'GestorEPI' in message, got: {message}")
            else:
                self.log_test("System shows GestorEPI branding", False, "Could not fetch root endpoint")
        else:
            self.log_test("Health check endpoint responding", False, str(response))

    def test_empresas_list_super_admin(self):
        """Test that SUPER_ADMIN can list all companies"""
        print("\n🏢 Testing Empresas List (SUPER_ADMIN)...")
        
        if not self.super_admin_token:
            self.log_test("List empresas as SUPER_ADMIN", False, "No SUPER_ADMIN token available")
            return
        
        success, response = self.make_request(
            "GET", 
            "empresas", 
            token=self.super_admin_token
        )
        
        if success:
            empresas = response if isinstance(response, list) else []
            self.log_test("GET /api/empresas returns company list", True)
            print(f"   Found {len(empresas)} empresas")
            
            if empresas:
                # Store first empresa for testing
                self.test_empresa_id = empresas[0].get('id')
                print(f"   Sample empresa: {empresas[0].get('nome')} (ID: {self.test_empresa_id})")
                
                # Check required fields
                required_fields = ['id', 'nome', 'cnpj', 'status', 'plano', 'limite_colaboradores']
                first_empresa = empresas[0]
                missing_fields = [field for field in required_fields if field not in first_empresa]
                
                if not missing_fields:
                    self.log_test("Empresa response contains required fields", True)
                else:
                    self.log_test("Empresa response contains required fields", False, f"Missing: {missing_fields}")
            else:
                self.log_test("GET /api/empresas returns company list", True, "No companies found (acceptable)")
        else:
            self.log_test("GET /api/empresas returns company list", False, str(response))

    def test_empresas_access_admin(self):
        """Test that regular admin cannot access empresas endpoint"""
        print("\n🚫 Testing Empresas Access Restriction (Admin)...")
        
        if not self.admin_token:
            self.log_test("Admin restricted from empresas endpoint", False, "No admin token available")
            return
        
        success, response = self.make_request(
            "GET", 
            "empresas", 
            expected_status=403,
            token=self.admin_token
        )
        
        if success:  # Success means we got the expected 403
            self.log_test("Admin correctly restricted from empresas endpoint", True)
        else:
            self.log_test("Admin correctly restricted from empresas endpoint", False, 
                         f"Expected 403 Forbidden, got {response.get('status_code', 'unknown')}")

    def test_empresa_block_activate(self):
        """Test blocking and activating companies"""
        print("\n🔒 Testing Empresa Block/Activate...")
        
        if not self.super_admin_token or not self.test_empresa_id:
            self.log_test("Test empresa block/activate", False, "Missing SUPER_ADMIN token or empresa ID")
            return
        
        # Test blocking empresa
        success, response = self.make_request(
            "POST", 
            f"empresas/{self.test_empresa_id}/bloquear",
            token=self.super_admin_token
        )
        
        if success:
            self.log_test("POST /api/empresas/{id}/bloquear works", True)
            print(f"   Response: {response.get('message', 'No message')}")
        else:
            self.log_test("POST /api/empresas/{id}/bloquear works", False, str(response))
        
        # Test activating empresa
        success, response = self.make_request(
            "POST", 
            f"empresas/{self.test_empresa_id}/ativar",
            token=self.super_admin_token
        )
        
        if success:
            self.log_test("POST /api/empresas/{id}/ativar works", True)
            print(f"   Response: {response.get('message', 'No message')}")
        else:
            self.log_test("POST /api/empresas/{id}/ativar works", False, str(response))

    def test_empresa_stats(self):
        """Test company statistics endpoint"""
        print("\n📊 Testing Empresa Statistics...")
        
        if not self.super_admin_token or not self.test_empresa_id:
            self.log_test("Test empresa statistics", False, "Missing SUPER_ADMIN token or empresa ID")
            return
        
        success, response = self.make_request(
            "GET", 
            f"empresas/{self.test_empresa_id}/stats",
            token=self.super_admin_token
        )
        
        if success:
            required_stats = ['empresa_id', 'empresa_nome', 'colaboradores', 'usuarios', 'epis', 'entregas', 'kits']
            missing_stats = [stat for stat in required_stats if stat not in response]
            
            if not missing_stats:
                self.log_test("GET /api/empresas/{id}/stats returns statistics", True)
                print(f"   Empresa: {response.get('empresa_nome')}")
                print(f"   Colaboradores: {response.get('colaboradores', 0)}")
                print(f"   Usuários: {response.get('usuarios', 0)}")
                print(f"   EPIs: {response.get('epis', 0)}")
                print(f"   Entregas: {response.get('entregas', 0)}")
                print(f"   Kits: {response.get('kits', 0)}")
            else:
                self.log_test("GET /api/empresas/{id}/stats returns statistics", False, f"Missing stats: {missing_stats}")
        else:
            self.log_test("GET /api/empresas/{id}/stats returns statistics", False, str(response))

    def test_data_isolation(self):
        """Test that admin users only see their company's data"""
        print("\n🔒 Testing Data Isolation...")
        
        if not self.admin_token:
            self.log_test("Test data isolation", False, "No admin token available")
            return
        
        # Test employees endpoint - admin should only see employees from their company
        success, response = self.make_request(
            "GET", 
            "employees",
            token=self.admin_token
        )
        
        if success:
            employees = response if isinstance(response, list) else []
            self.log_test("Admin can access employees endpoint", True)
            print(f"   Admin sees {len(employees)} employees")
            
            # All employees should belong to the same company (admin's company)
            if employees:
                empresa_ids = set(emp.get('empresa_id') for emp in employees if emp.get('empresa_id'))
                if len(empresa_ids) <= 1:
                    self.log_test("Admin only sees employees from their company", True)
                    print(f"   All employees belong to empresa_id: {list(empresa_ids)}")
                else:
                    self.log_test("Admin only sees employees from their company", False, 
                                f"Admin sees employees from multiple companies: {list(empresa_ids)}")
            else:
                self.log_test("Admin only sees employees from their company", True, "No employees found (acceptable)")
        else:
            self.log_test("Admin can access employees endpoint", False, str(response))

    def test_super_admin_vs_admin_access(self):
        """Compare SUPER_ADMIN vs Admin access levels"""
        print("\n⚖️  Testing Access Level Differences...")
        
        if not self.super_admin_token or not self.admin_token:
            self.log_test("Compare access levels", False, "Missing tokens")
            return
        
        # Test users endpoint access
        # SUPER_ADMIN should see all users
        success_super, response_super = self.make_request(
            "GET", 
            "users",
            token=self.super_admin_token
        )
        
        # Admin should see only users from their company
        success_admin, response_admin = self.make_request(
            "GET", 
            "users",
            token=self.admin_token
        )
        
        if success_super and success_admin:
            users_super = response_super if isinstance(response_super, list) else []
            users_admin = response_admin if isinstance(response_admin, list) else []
            
            print(f"   SUPER_ADMIN sees {len(users_super)} users")
            print(f"   Admin sees {len(users_admin)} users")
            
            # SUPER_ADMIN should see same or more users than admin
            if len(users_super) >= len(users_admin):
                self.log_test("SUPER_ADMIN has broader access than Admin", True)
            else:
                self.log_test("SUPER_ADMIN has broader access than Admin", False, 
                            f"SUPER_ADMIN sees fewer users ({len(users_super)}) than Admin ({len(users_admin)})")
        else:
            self.log_test("Compare access levels", False, 
                         f"SUPER_ADMIN success: {success_super}, Admin success: {success_admin}")

    def run_all_tests(self):
        """Run all multi-tenant tests"""
        print("🧪 Starting Multi-Tenant GestorEPI Backend Tests...")
        print(f"🌐 Testing API: {self.api_url}")
        print("=" * 60)
        
        # Authentication tests
        super_admin_ok = self.test_super_admin_login()
        admin_ok = self.test_admin_login()
        
        if not super_admin_ok:
            print("❌ SUPER_ADMIN authentication failed - some tests will be skipped")
        
        if not admin_ok:
            print("❌ Admin authentication failed - some tests will be skipped")
        
        # Health and branding
        self.test_health_check_branding()
        
        # Multi-tenant features
        self.test_empresas_list_super_admin()
        self.test_empresas_access_admin()
        self.test_empresa_block_activate()
        self.test_empresa_stats()
        
        # Data isolation
        self.test_data_isolation()
        self.test_super_admin_vs_admin_access()
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✅ Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All multi-tenant tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

    def get_test_summary(self):
        """Get detailed test summary"""
        return {
            "test_type": "multi_tenant_gestorepi",
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0,
            "test_results": self.test_results,
            "timestamp": datetime.now().isoformat()
        }

def main():
    """Main test execution"""
    tester = MultiTenantGestorEPITester()
    
    try:
        success = tester.run_all_tests()
        
        # Save detailed results
        summary = tester.get_test_summary()
        
        with open('/app/test_reports/multitenant_backend_results.json', 'w') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 Detailed results saved to: /app/test_reports/multitenant_backend_results.json")
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())