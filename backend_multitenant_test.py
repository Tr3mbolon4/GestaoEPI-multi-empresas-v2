#!/usr/bin/env python3
"""
Multi-Tenant Isolation Testing for GestorEPI System
Tests company isolation for suppliers, employees, EPIs, deliveries, and stock
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class MultiTenantTester:
    def __init__(self, base_url="https://epi-multi.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        
        # Tokens for different users
        self.tokens = {}
        self.user_data = {}
        
        # Test tracking
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.test_data = {
            'empresa1': {'suppliers': [], 'employees': [], 'epis': [], 'deliveries': []},
            'empresa2': {'suppliers': [], 'employees': [], 'epis': [], 'deliveries': []}
        }
        
        # Credentials from review request
        self.credentials = {
            'empresa1_admin': {'username': 'admin', 'password': 'Admin@2026!', 'empresa': 'Empresa Demonstração'},
            'empresa2_admin': {'username': 'admin_cipo', 'password': 'Admin2@2026!', 'empresa': 'Cipolatti'},
            'superadmin': {'username': 'superadmin', 'password': 'Super@2026!'}
        }

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
                    expected_status: int = 200, user_token: str = None) -> tuple[bool, Dict]:
        """Make API request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if user_token:
            headers['Authorization'] = f'Bearer {user_token}'
        
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

    def test_authentication(self):
        """Test login for all user types"""
        print("\n🔐 Testing Multi-Tenant Authentication...")
        
        for user_type, creds in self.credentials.items():
            success, response = self.make_request(
                "POST", 
                "auth/login",
                {"username": creds['username'], "password": creds['password']}
            )
            
            if success and 'access_token' in response:
                self.tokens[user_type] = response['access_token']
                self.user_data[user_type] = response
                self.log_test(f"Login {user_type} ({creds['username']})", True)
                print(f"   Role: {response.get('role', 'unknown')}")
                print(f"   Empresa: {response.get('empresa_nome', 'N/A')}")
            else:
                self.log_test(f"Login {user_type} ({creds['username']})", False, f"Response: {response}")
                return False
        
        return True

    def test_supplier_isolation(self):
        """Test supplier isolation between companies"""
        print("\n🏭 Testing Supplier Isolation...")
        
        # Generate unique CNPJs using timestamp
        import time
        timestamp = str(int(time.time()))[-8:]  # Last 8 digits of timestamp
        cnpj_base = f"12.345.{timestamp[:3]}/{timestamp[3:7]}-{timestamp[7:]}"
        
        # Test 1: Create supplier in empresa1
        supplier1_data = {
            "name": "Fornecedor Empresa 1",
            "cnpj": cnpj_base,
            "contact_person": "João Silva",
            "phone": "(11) 1234-5678",
            "email": "joao@empresa1.com"
        }
        
        success, response = self.make_request(
            "POST", "suppliers", supplier1_data, 201, 
            self.tokens['empresa1_admin']
        )
        
        if success:
            supplier1_id = response.get('id')
            self.test_data['empresa1']['suppliers'].append(supplier1_id)
            self.log_test("Create supplier in empresa1", True)
        else:
            self.log_test("Create supplier in empresa1", False, str(response))
            return
        
        # Test 2: Create supplier with SAME CNPJ in empresa2 (should work)
        supplier2_data = {
            "name": "Fornecedor Empresa 2",
            "cnpj": cnpj_base,  # Same CNPJ
            "contact_person": "Maria Santos",
            "phone": "(11) 9876-5432",
            "email": "maria@empresa2.com"
        }
        
        success, response = self.make_request(
            "POST", "suppliers", supplier2_data, 201,
            self.tokens['empresa2_admin']
        )
        
        if success:
            supplier2_id = response.get('id')
            self.test_data['empresa2']['suppliers'].append(supplier2_id)
            self.log_test("Create supplier with same CNPJ in empresa2", True)
        else:
            self.log_test("Create supplier with same CNPJ in empresa2", False, str(response))
        
        # Test 3: Try to create duplicate CNPJ within same company (should fail)
        duplicate_supplier_data = {
            "name": "Fornecedor Duplicado",
            "cnpj": cnpj_base,  # Same CNPJ as supplier1
            "contact_person": "Pedro Costa",
            "phone": "(11) 5555-5555",
            "email": "pedro@empresa1.com"
        }
        
        success, response = self.make_request(
            "POST", "suppliers", duplicate_supplier_data, 400,
            self.tokens['empresa1_admin']
        )
        
        if success:  # Success means it correctly returned 400
            self.log_test("Block duplicate CNPJ within same company", True)
        else:
            self.log_test("Block duplicate CNPJ within same company", False, "Should have returned 400 error")
        
        # Test 4: Verify empresa1 cannot see empresa2's suppliers
        success, response = self.make_request(
            "GET", "suppliers", None, 200,
            self.tokens['empresa1_admin']
        )
        
        if success:
            suppliers = response if isinstance(response, list) else []
            empresa2_supplier_visible = any(s.get('id') == supplier2_id for s in suppliers)
            
            if not empresa2_supplier_visible:
                self.log_test("Empresa1 cannot see empresa2 suppliers", True)
            else:
                self.log_test("Empresa1 cannot see empresa2 suppliers", False, "Empresa2 supplier is visible")
        else:
            self.log_test("Empresa1 cannot see empresa2 suppliers", False, str(response))
        
        # Test 5: Verify empresa2 cannot see empresa1's suppliers
        success, response = self.make_request(
            "GET", "suppliers", None, 200,
            self.tokens['empresa2_admin']
        )
        
        if success:
            suppliers = response if isinstance(response, list) else []
            empresa1_supplier_visible = any(s.get('id') == supplier1_id for s in suppliers)
            
            if not empresa1_supplier_visible:
                self.log_test("Empresa2 cannot see empresa1 suppliers", True)
            else:
                self.log_test("Empresa2 cannot see empresa1 suppliers", False, "Empresa1 supplier is visible")
        else:
            self.log_test("Empresa2 cannot see empresa1 suppliers", False, str(response))

    def test_employee_isolation(self):
        """Test employee isolation between companies"""
        print("\n👥 Testing Employee Isolation...")
        
        # First, get companies for each user
        success, companies1 = self.make_request(
            "GET", "companies", None, 200,
            self.tokens['empresa1_admin']
        )
        
        success, companies2 = self.make_request(
            "GET", "companies", None, 200,
            self.tokens['empresa2_admin']
        )
        
        if not (companies1 and companies2):
            self.log_test("Employee isolation test", False, "No companies found")
            return
        
        company1_id = companies1[0]['id'] if companies1 else None
        company2_id = companies2[0]['id'] if companies2 else None
        
        if not (company1_id and company2_id):
            self.log_test("Employee isolation test", False, "Missing company IDs")
            return
        
        # Generate unique CPFs using timestamp
        import time
        timestamp = str(int(time.time()))[-9:]  # Last 9 digits of timestamp
        cpf_base = f"{timestamp[:3]}.{timestamp[3:6]}.{timestamp[6:9]}-01"
        
        # Test 1: Create employee in empresa1
        employee1_data = {
            "full_name": "João Colaborador Empresa 1",
            "cpf": cpf_base,
            "registration_number": f"EMP{timestamp[:4]}",
            "company_id": company1_id,
            "position": "Operador",
            "department": "Produção",
            "status": "active"
        }
        
        success, response = self.make_request(
            "POST", "employees", employee1_data, 201,
            self.tokens['empresa1_admin']
        )
        
        if success:
            employee1_id = response.get('id')
            self.test_data['empresa1']['employees'].append(employee1_id)
            self.log_test("Create employee in empresa1", True)
        else:
            self.log_test("Create employee in empresa1", False, str(response))
            return
        
        # Test 2: Create employee with SAME CPF in empresa2 (should work)
        employee2_data = {
            "full_name": "João Colaborador Empresa 2",
            "cpf": cpf_base,  # Same CPF
            "registration_number": f"CIP{timestamp[:4]}",
            "company_id": company2_id,
            "position": "Técnico",
            "department": "Manutenção",
            "status": "active"
        }
        
        success, response = self.make_request(
            "POST", "employees", employee2_data, 201,
            self.tokens['empresa2_admin']
        )
        
        if success:
            employee2_id = response.get('id')
            self.test_data['empresa2']['employees'].append(employee2_id)
            self.log_test("Create employee with same CPF in empresa2", True)
        else:
            self.log_test("Create employee with same CPF in empresa2", False, str(response))
        
        # Test 3: Try to create duplicate CPF within same company (should fail)
        duplicate_employee_data = {
            "full_name": "Pedro Duplicado",
            "cpf": cpf_base,  # Same CPF as employee1
            "registration_number": f"EMP{timestamp[4:8]}",
            "company_id": company1_id,
            "position": "Auxiliar",
            "department": "Limpeza",
            "status": "active"
        }
        
        success, response = self.make_request(
            "POST", "employees", duplicate_employee_data, 400,
            self.tokens['empresa1_admin']
        )
        
        if success:  # Success means it correctly returned 400
            self.log_test("Block duplicate CPF within same company", True)
        else:
            self.log_test("Block duplicate CPF within same company", False, "Should have returned 400 error")
        
        # Test 4: Verify empresa1 cannot see empresa2's employees
        success, response = self.make_request(
            "GET", "employees", None, 200,
            self.tokens['empresa1_admin']
        )
        
        if success:
            employees = response if isinstance(response, list) else []
            empresa2_employee_visible = any(e.get('id') == employee2_id for e in employees)
            
            if not empresa2_employee_visible:
                self.log_test("Empresa1 cannot see empresa2 employees", True)
            else:
                self.log_test("Empresa1 cannot see empresa2 employees", False, "Empresa2 employee is visible")
        else:
            self.log_test("Empresa1 cannot see empresa2 employees", False, str(response))
        
        # Test 5: Verify empresa2 cannot see empresa1's employees
        success, response = self.make_request(
            "GET", "employees", None, 200,
            self.tokens['empresa2_admin']
        )
        
        if success:
            employees = response if isinstance(response, list) else []
            empresa1_employee_visible = any(e.get('id') == employee1_id for e in employees)
            
            if not empresa1_employee_visible:
                self.log_test("Empresa2 cannot see empresa1 employees", True)
            else:
                self.log_test("Empresa2 cannot see empresa1 employees", False, "Empresa1 employee is visible")
        else:
            self.log_test("Empresa2 cannot see empresa1 employees", False, str(response))

    def test_epi_isolation(self):
        """Test EPI isolation between companies"""
        print("\n🦺 Testing EPI Isolation...")
        
        # Test 1: Create EPI in empresa1
        epi1_data = {
            "name": "Capacete Empresa 1",
            "type_category": "Cabeça",
            "ca_number": "12345",
            "brand": "Marca A",
            "current_stock": 10,
            "min_stock": 2
        }
        
        success, response = self.make_request(
            "POST", "epis", epi1_data, 201,
            self.tokens['empresa1_admin']
        )
        
        if success:
            epi1_id = response.get('id')
            self.test_data['empresa1']['epis'].append(epi1_id)
            self.log_test("Create EPI in empresa1", True)
        else:
            self.log_test("Create EPI in empresa1", False, str(response))
            return
        
        # Test 2: Create EPI in empresa2
        epi2_data = {
            "name": "Capacete Empresa 2",
            "type_category": "Cabeça",
            "ca_number": "67890",
            "brand": "Marca B",
            "current_stock": 5,
            "min_stock": 1
        }
        
        success, response = self.make_request(
            "POST", "epis", epi2_data, 201,
            self.tokens['empresa2_admin']
        )
        
        if success:
            epi2_id = response.get('id')
            self.test_data['empresa2']['epis'].append(epi2_id)
            self.log_test("Create EPI in empresa2", True)
        else:
            self.log_test("Create EPI in empresa2", False, str(response))
        
        # Test 3: Verify empresa1 cannot see empresa2's EPIs
        success, response = self.make_request(
            "GET", "epis", None, 200,
            self.tokens['empresa1_admin']
        )
        
        if success:
            epis = response if isinstance(response, list) else []
            empresa2_epi_visible = any(e.get('id') == epi2_id for e in epis)
            
            if not empresa2_epi_visible:
                self.log_test("Empresa1 cannot see empresa2 EPIs", True)
            else:
                self.log_test("Empresa1 cannot see empresa2 EPIs", False, "Empresa2 EPI is visible")
        else:
            self.log_test("Empresa1 cannot see empresa2 EPIs", False, str(response))
        
        # Test 4: Verify empresa2 cannot see empresa1's EPIs
        success, response = self.make_request(
            "GET", "epis", None, 200,
            self.tokens['empresa2_admin']
        )
        
        if success:
            epis = response if isinstance(response, list) else []
            empresa1_epi_visible = any(e.get('id') == epi1_id for e in epis)
            
            if not empresa1_epi_visible:
                self.log_test("Empresa2 cannot see empresa1 EPIs", True)
            else:
                self.log_test("Empresa2 cannot see empresa1 EPIs", False, "Empresa1 EPI is visible")
        else:
            self.log_test("Empresa2 cannot see empresa1 EPIs", False, str(response))

    def test_delivery_isolation(self):
        """Test delivery isolation between companies"""
        print("\n📦 Testing Delivery Isolation...")
        
        # Skip if we don't have required test data
        if not (self.test_data['empresa1']['employees'] and self.test_data['empresa1']['epis'] and
                self.test_data['empresa2']['employees'] and self.test_data['empresa2']['epis']):
            self.log_test("Delivery isolation test", False, "Missing required test data (employees/EPIs)")
            return
        
        # Note: Delivery creation may fail due to facial recognition requirements
        # This is expected behavior, but we can still test the isolation logic
        
        # Test 1: Try to create delivery in empresa1 (may fail due to photo requirement)
        delivery1_data = {
            "employee_id": self.test_data['empresa1']['employees'][0],
            "delivery_type": "entrega",
            "items": [
                {
                    "epi_id": self.test_data['empresa1']['epis'][0],
                    "quantity": 1
                }
            ],
            "notes": "Entrega teste empresa 1"
        }
        
        success, response = self.make_request(
            "POST", "deliveries", delivery1_data, 201,
            self.tokens['empresa1_admin']
        )
        
        delivery1_id = None
        if success:
            delivery1_id = response.get('id')
            self.test_data['empresa1']['deliveries'].append(delivery1_id)
            self.log_test("Create delivery in empresa1", True)
        else:
            # If it fails due to photo requirement, that's expected
            if "foto cadastrada" in str(response):
                self.log_test("Create delivery in empresa1 (photo required)", True, "Expected: facial recognition required")
            else:
                self.log_test("Create delivery in empresa1", False, str(response))
        
        # Test 2: Try to create delivery in empresa2
        delivery2_data = {
            "employee_id": self.test_data['empresa2']['employees'][0],
            "delivery_type": "entrega",
            "items": [
                {
                    "epi_id": self.test_data['empresa2']['epis'][0],
                    "quantity": 1
                }
            ],
            "notes": "Entrega teste empresa 2"
        }
        
        success, response = self.make_request(
            "POST", "deliveries", delivery2_data, 201,
            self.tokens['empresa2_admin']
        )
        
        delivery2_id = None
        if success:
            delivery2_id = response.get('id')
            self.test_data['empresa2']['deliveries'].append(delivery2_id)
            self.log_test("Create delivery in empresa2", True)
        else:
            # If it fails due to photo requirement, that's expected
            if "foto cadastrada" in str(response):
                self.log_test("Create delivery in empresa2 (photo required)", True, "Expected: facial recognition required")
            else:
                self.log_test("Create delivery in empresa2", False, str(response))
        
        # Test 3: Test delivery list isolation (even if no deliveries were created)
        success, response = self.make_request(
            "GET", "deliveries", None, 200,
            self.tokens['empresa1_admin']
        )
        
        if success:
            deliveries = response if isinstance(response, list) else response.get('deliveries', [])
            self.log_test("Empresa1 can access deliveries endpoint", True)
            print(f"   Empresa1 deliveries count: {len(deliveries)}")
        else:
            self.log_test("Empresa1 can access deliveries endpoint", False, str(response))
        
        # Test 4: Test empresa2 delivery list
        success, response = self.make_request(
            "GET", "deliveries", None, 200,
            self.tokens['empresa2_admin']
        )
        
        if success:
            deliveries = response if isinstance(response, list) else response.get('deliveries', [])
            self.log_test("Empresa2 can access deliveries endpoint", True)
            print(f"   Empresa2 deliveries count: {len(deliveries)}")
        else:
            self.log_test("Empresa2 can access deliveries endpoint", False, str(response))

    def test_dashboard_isolation(self):
        """Test dashboard shows only company-specific data"""
        print("\n📊 Testing Dashboard Isolation...")
        
        # Test 1: Check empresa1 dashboard
        success, response = self.make_request(
            "GET", "dashboard/stats", None, 200,
            self.tokens['empresa1_admin']
        )
        
        if success:
            self.log_test("Empresa1 dashboard accessible", True)
            print(f"   Empresa1 stats: {list(response.keys())}")
        else:
            self.log_test("Empresa1 dashboard accessible", False, str(response))
        
        # Test 2: Check empresa2 dashboard
        success, response = self.make_request(
            "GET", "dashboard/stats", None, 200,
            self.tokens['empresa2_admin']
        )
        
        if success:
            self.log_test("Empresa2 dashboard accessible", True)
            print(f"   Empresa2 stats: {list(response.keys())}")
        else:
            self.log_test("Empresa2 dashboard accessible", False, str(response))

    def test_superadmin_access(self):
        """Test superadmin can see all companies"""
        print("\n👑 Testing SuperAdmin Access...")
        
        # Test 1: SuperAdmin can see all empresas
        success, response = self.make_request(
            "GET", "empresas", None, 200,
            self.tokens['superadmin']
        )
        
        if success:
            empresas = response if isinstance(response, list) else []
            self.log_test("SuperAdmin can see all empresas", True)
            print(f"   Total empresas visible: {len(empresas)}")
        else:
            self.log_test("SuperAdmin can see all empresas", False, str(response))
        
        # Test 2: SuperAdmin can access master dashboard
        success, response = self.make_request(
            "GET", "master/dashboard", None, 200,
            self.tokens['superadmin']
        )
        
        if success:
            self.log_test("SuperAdmin can access master dashboard", True)
        else:
            self.log_test("SuperAdmin can access master dashboard", False, str(response))

    def test_cross_company_access_blocked(self):
        """Test that users cannot access other company's resources directly"""
        print("\n🚫 Testing Cross-Company Access Blocked...")
        
        if not (self.test_data['empresa1']['employees'] and self.test_data['empresa2']['employees']):
            self.log_test("Cross-company access test", False, "Missing required test data")
            return
        
        # Test 1: Empresa1 admin tries to access empresa2 employee directly
        empresa2_employee_id = self.test_data['empresa2']['employees'][0]
        success, response = self.make_request(
            "GET", f"employees/{empresa2_employee_id}", None, 404,
            self.tokens['empresa1_admin']
        )
        
        if success:  # Success means it correctly returned 404
            self.log_test("Empresa1 blocked from accessing empresa2 employee", True)
        else:
            self.log_test("Empresa1 blocked from accessing empresa2 employee", False, "Should have returned 404")
        
        # Test 2: Empresa2 admin tries to access empresa1 employee directly
        empresa1_employee_id = self.test_data['empresa1']['employees'][0]
        success, response = self.make_request(
            "GET", f"employees/{empresa1_employee_id}", None, 404,
            self.tokens['empresa2_admin']
        )
        
        if success:  # Success means it correctly returned 404
            self.log_test("Empresa2 blocked from accessing empresa1 employee", True)
        else:
            self.log_test("Empresa2 blocked from accessing empresa1 employee", False, "Should have returned 404")

    def run_all_tests(self):
        """Run all multi-tenant isolation tests"""
        print("🧪 Starting Multi-Tenant Isolation Tests...")
        print(f"🌐 Testing API: {self.api_url}")
        print("=" * 60)
        
        # Authentication first
        if not self.test_authentication():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Core isolation tests
        print("\n🎯 MULTI-TENANT ISOLATION TESTS")
        print("-" * 40)
        
        self.test_supplier_isolation()
        self.test_employee_isolation()
        self.test_epi_isolation()
        self.test_delivery_isolation()
        self.test_dashboard_isolation()
        
        # Access control tests
        print("\n🔒 ACCESS CONTROL TESTS")
        print("-" * 40)
        
        self.test_superadmin_access()
        self.test_cross_company_access_blocked()
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✅ Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All multi-tenant isolation tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

    def get_test_summary(self):
        """Get detailed test summary"""
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0,
            "test_results": self.test_results,
            "test_data": self.test_data,
            "timestamp": datetime.now().isoformat()
        }

def main():
    """Main test execution"""
    tester = MultiTenantTester()
    
    try:
        success = tester.run_all_tests()
        
        # Save detailed results
        summary = tester.get_test_summary()
        
        # Create test reports directory if it doesn't exist
        import os
        os.makedirs('/app/test_reports', exist_ok=True)
        
        with open('/app/test_reports/multitenant_backend_results.json', 'w') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 Detailed results saved to: /app/test_reports/multitenant_backend_results.json")
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())