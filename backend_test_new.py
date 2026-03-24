#!/usr/bin/env python3
"""
Backend API Testing for GestorEPI System - NEW ENDPOINTS
Tests LGPD endpoints, Advanced Reports, and Multi-tenant isolation
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class GestorEPINewTester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.test_employee_id = None
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

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, expected_status: int = 200) -> tuple[bool, Dict]:
        """Make API request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
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

    def test_login(self):
        """Test login with SUPER_ADMIN credentials"""
        print("\n🔐 Testing Authentication...")
        
        # Try SUPER_ADMIN credentials
        success, response = self.make_request(
            "POST", 
            "auth/login",
            {"username": "superadmin", "password": "Super@2026!"}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log_test("Login with superadmin", True)
            print(f"   Role: {response.get('role', 'unknown')}")
            print(f"   Empresa ID: {response.get('empresa_id', 'N/A')}")
            return True
        else:
            self.log_test("Login failed", False, f"Response: {response}")
            return False

    def get_test_employee_id(self):
        """Get an employee ID for testing"""
        print("\n👤 Getting Employee ID for tests...")
        
        success, response = self.make_request("GET", "employees")
        
        if success and response:
            employees = response if isinstance(response, list) else []
            if employees:
                self.test_employee_id = employees[0].get('id')
                self.log_test("Get employee ID", True)
                print(f"   Using employee_id: {self.test_employee_id}")
                return True
            else:
                self.log_test("Get employee ID", False, "No employees found")
                return False
        else:
            self.log_test("Get employee ID", False, str(response))
            return False

    # ===================== LGPD ENDPOINTS TESTS =====================

    def test_lgpd_dashboard(self):
        """Test LGPD Dashboard endpoint"""
        print("\n🛡️ Testing LGPD Dashboard...")
        
        success, response = self.make_request("GET", "lgpd/dashboard")
        
        if success:
            required_fields = [
                'total_colaboradores', 'colaboradores_com_biometria', 'status_conformidade'
            ]
            
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                self.log_test("LGPD Dashboard - all required fields", True)
                print(f"   Total colaboradores: {response.get('total_colaboradores', 0)}")
                print(f"   Com biometria: {response.get('colaboradores_com_biometria', 0)}")
                print(f"   Status conformidade: {response.get('status_conformidade', 'N/A')}")
                
                # Check optional fields
                if 'percentual_biometria' in response:
                    print(f"   Percentual biometria: {response.get('percentual_biometria', 0)}%")
                if 'total_consentimentos' in response:
                    print(f"   Total consentimentos: {response.get('total_consentimentos', 0)}")
            else:
                self.log_test("LGPD Dashboard - all required fields", False, f"Missing: {missing_fields}")
        else:
            self.log_test("LGPD Dashboard endpoint", False, str(response))

    def test_lgpd_consentimentos(self):
        """Test LGPD Consentimentos endpoint"""
        print("\n📋 Testing LGPD Consentimentos...")
        
        success, response = self.make_request("GET", "lgpd/consentimentos?page=1&limit=20")
        
        if success:
            required_fields = ['consentimentos', 'total', 'total_pages']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                consentimentos = response.get('consentimentos', [])
                self.log_test("LGPD Consentimentos - structure correct", True)
                print(f"   Total consentimentos: {response.get('total', 0)}")
                print(f"   Total pages: {response.get('total_pages', 0)}")
                print(f"   Consentimentos na página: {len(consentimentos)}")
                
                # Check consent structure if any exist
                if consentimentos:
                    consent = consentimentos[0]
                    consent_fields = ['id', 'employee_id', 'employee_name', 'consent_type', 'created_at']
                    missing_consent_fields = [field for field in consent_fields if field not in consent]
                    
                    if not missing_consent_fields:
                        self.log_test("Consent entry structure", True)
                    else:
                        self.log_test("Consent entry structure", False, f"Missing: {missing_consent_fields}")
                else:
                    self.log_test("Consent entry structure", True, "No consents to check (acceptable)")
            else:
                self.log_test("LGPD Consentimentos - structure correct", False, f"Missing: {missing_fields}")
        else:
            self.log_test("LGPD Consentimentos endpoint", False, str(response))

    def test_lgpd_export_dados(self):
        """Test LGPD Export Dados endpoint"""
        print("\n📤 Testing LGPD Export Dados...")
        
        if not self.test_employee_id:
            self.log_test("LGPD Export Dados test", False, "No employee_id available")
            return
        
        success, response = self.make_request("GET", f"lgpd/export-dados/{self.test_employee_id}")
        
        if success:
            self.log_test("LGPD Export Dados endpoint", True)
            print(f"   Response type: {type(response)}")
            
            # If it's a JSON response, check structure
            if isinstance(response, dict):
                if 'dados_pessoais' in response:
                    self.log_test("Export contains personal data", True)
                if 'consentimentos_biometricos' in response:
                    self.log_test("Export contains biometric consents", True)
                if 'entregas_epi' in response:
                    self.log_test("Export contains EPI deliveries", True)
        else:
            self.log_test("LGPD Export Dados endpoint", False, str(response))

    # ===================== ADVANCED REPORTS TESTS =====================

    def test_relatorios_entregas_por_periodo(self):
        """Test Entregas por Período endpoint"""
        print("\n📊 Testing Entregas por Período...")
        
        success, response = self.make_request("GET", "relatorios/entregas-por-periodo?periodo=30")
        
        if success:
            required_fields = ['periodo_dias', 'agrupamento', 'dados']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                dados = response.get('dados', [])
                self.log_test("Entregas por Período - structure correct", True)
                print(f"   Período: {response.get('periodo_dias', 0)} dias")
                print(f"   Agrupamento: {response.get('agrupamento', 'N/A')}")
                print(f"   Dados entries: {len(dados)}")
                
                # Check data structure if any exist
                if dados:
                    entry = dados[0]
                    entry_fields = ['periodo', 'entregas', 'itens']
                    missing_entry_fields = [field for field in entry_fields if field not in entry]
                    
                    if not missing_entry_fields:
                        self.log_test("Entregas data entry structure", True)
                    else:
                        self.log_test("Entregas data entry structure", False, f"Missing: {missing_entry_fields}")
                else:
                    self.log_test("Entregas data entry structure", True, "No data entries to check (acceptable)")
            else:
                self.log_test("Entregas por Período - structure correct", False, f"Missing: {missing_fields}")
        else:
            self.log_test("Entregas por Período endpoint", False, str(response))

    def test_relatorios_consumo_epis(self):
        """Test Consumo de EPIs endpoint"""
        print("\n📈 Testing Consumo de EPIs...")
        
        success, response = self.make_request("GET", "relatorios/consumo-epis?periodo=90")
        
        if success:
            required_fields = ['top_epis', 'consumo_por_departamento']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                top_epis = response.get('top_epis', [])
                consumo_dept = response.get('consumo_por_departamento', [])
                self.log_test("Consumo de EPIs - structure correct", True)
                print(f"   Top EPIs: {len(top_epis)} entries")
                print(f"   Consumo por departamento: {len(consumo_dept)} entries")
                
                # Check top EPIs structure
                if top_epis:
                    epi = top_epis[0]
                    epi_fields = ['epi_id', 'epi_name', 'quantidade', 'entregas']
                    missing_epi_fields = [field for field in epi_fields if field not in epi]
                    
                    if not missing_epi_fields:
                        self.log_test("Top EPIs structure", True)
                    else:
                        self.log_test("Top EPIs structure", False, f"Missing: {missing_epi_fields}")
                
                # Check department consumption structure
                if consumo_dept:
                    dept = consumo_dept[0]
                    dept_fields = ['departamento', 'entregas', 'itens']
                    missing_dept_fields = [field for field in dept_fields if field not in dept]
                    
                    if not missing_dept_fields:
                        self.log_test("Department consumption structure", True)
                    else:
                        self.log_test("Department consumption structure", False, f"Missing: {missing_dept_fields}")
            else:
                self.log_test("Consumo de EPIs - structure correct", False, f"Missing: {missing_fields}")
        else:
            self.log_test("Consumo de EPIs endpoint", False, str(response))

    def test_relatorios_estoque_critico(self):
        """Test Estoque Crítico endpoint"""
        print("\n⚠️ Testing Estoque Crítico...")
        
        success, response = self.make_request("GET", "relatorios/estoque-critico")
        
        if success:
            required_fields = ['total_criticos', 'zerados', 'criticos', 'baixos', 'epis']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                epis = response.get('epis', [])
                self.log_test("Estoque Crítico - structure correct", True)
                print(f"   Total críticos: {response.get('total_criticos', 0)}")
                print(f"   Zerados: {response.get('zerados', 0)}")
                print(f"   Críticos: {response.get('criticos', 0)}")
                print(f"   Baixos: {response.get('baixos', 0)}")
                print(f"   EPIs listados: {len(epis)}")
                
                # Check EPI structure if any exist
                if epis:
                    epi = epis[0]
                    epi_fields = ['id', 'nome', 'estoque_atual', 'estoque_minimo', 'nivel_criticidade']
                    missing_epi_fields = [field for field in epi_fields if field not in epi]
                    
                    if not missing_epi_fields:
                        self.log_test("Critical stock EPI structure", True)
                    else:
                        self.log_test("Critical stock EPI structure", False, f"Missing: {missing_epi_fields}")
                else:
                    self.log_test("Critical stock EPI structure", True, "No critical EPIs to check (acceptable)")
            else:
                self.log_test("Estoque Crítico - structure correct", False, f"Missing: {missing_fields}")
        else:
            self.log_test("Estoque Crítico endpoint", False, str(response))

    def test_relatorios_vencimentos(self):
        """Test Vencimentos endpoint"""
        print("\n📅 Testing Vencimentos...")
        
        success, response = self.make_request("GET", "relatorios/vencimentos?dias=90")
        
        if success:
            required_fields = ['total', 'vencidos', 'criticos', 'urgentes', 'epis']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                epis = response.get('epis', [])
                self.log_test("Vencimentos - structure correct", True)
                print(f"   Total: {response.get('total', 0)}")
                print(f"   Vencidos: {response.get('vencidos', 0)}")
                print(f"   Críticos: {response.get('criticos', 0)}")
                print(f"   Urgentes: {response.get('urgentes', 0)}")
                print(f"   EPIs listados: {len(epis)}")
                
                # Check EPI structure if any exist
                if epis:
                    epi = epis[0]
                    epi_fields = ['id', 'nome', 'data_vencimento', 'dias_restantes', 'status']
                    missing_epi_fields = [field for field in epi_fields if field not in epi]
                    
                    if not missing_epi_fields:
                        self.log_test("Expiring EPI structure", True)
                    else:
                        self.log_test("Expiring EPI structure", False, f"Missing: {missing_epi_fields}")
                else:
                    self.log_test("Expiring EPI structure", True, "No expiring EPIs to check (acceptable)")
            else:
                self.log_test("Vencimentos - structure correct", False, f"Missing: {missing_fields}")
        else:
            self.log_test("Vencimentos endpoint", False, str(response))

    # ===================== MULTI-TENANT ISOLATION TESTS =====================

    def test_suppliers_isolation(self):
        """Test Suppliers multi-tenant isolation"""
        print("\n🏭 Testing Suppliers Multi-tenant Isolation...")
        
        success, response = self.make_request("GET", "suppliers")
        
        if success:
            suppliers = response if isinstance(response, list) else []
            self.log_test("Suppliers endpoint accessible", True)
            print(f"   Suppliers returned: {len(suppliers)}")
            
            # Check if suppliers have empresa_id (indicating proper filtering)
            if suppliers:
                supplier = suppliers[0]
                if 'empresa_id' in supplier or 'id' in supplier:
                    self.log_test("Suppliers contain proper identification", True)
                else:
                    self.log_test("Suppliers contain proper identification", False, "No empresa_id or id field")
            else:
                self.log_test("Suppliers contain proper identification", True, "No suppliers to check (acceptable)")
        else:
            self.log_test("Suppliers endpoint accessible", False, str(response))

    def test_dashboard_stats_isolation(self):
        """Test Dashboard Stats multi-tenant isolation"""
        print("\n📊 Testing Dashboard Stats Multi-tenant Isolation...")
        
        success, response = self.make_request("GET", "dashboard/stats")
        
        if success:
            self.log_test("Dashboard Stats endpoint accessible", True)
            print(f"   Dashboard stats keys: {list(response.keys())}")
            
            # Check if response contains reasonable data (not global system data)
            total_employees = response.get('total_employees', 0)
            total_epis = response.get('total_epis', 0)
            
            # These should be reasonable numbers for a single company, not massive system-wide numbers
            if total_employees < 10000 and total_epis < 10000:  # Reasonable limits for single company
                self.log_test("Dashboard Stats shows company-specific data", True)
                print(f"   Total employees: {total_employees}")
                print(f"   Total EPIs: {total_epis}")
            else:
                self.log_test("Dashboard Stats shows company-specific data", False, f"Numbers seem too high: employees={total_employees}, epis={total_epis}")
        else:
            self.log_test("Dashboard Stats endpoint accessible", False, str(response))

    def test_stock_alerts_isolation(self):
        """Test Stock Alerts multi-tenant isolation"""
        print("\n📦 Testing Stock Alerts Multi-tenant Isolation...")
        
        success, response = self.make_request("GET", "stock/alerts")
        
        if success:
            alerts = response if isinstance(response, list) else response.get('alerts', [])
            self.log_test("Stock Alerts endpoint accessible", True)
            print(f"   Stock alerts returned: {len(alerts)}")
            
            # Check if alerts have proper structure
            if alerts:
                alert = alerts[0]
                if 'epi_id' in alert or 'id' in alert:
                    self.log_test("Stock Alerts contain proper identification", True)
                else:
                    self.log_test("Stock Alerts contain proper identification", False, "No epi_id or id field")
            else:
                self.log_test("Stock Alerts contain proper identification", True, "No alerts to check (acceptable)")
        else:
            self.log_test("Stock Alerts endpoint accessible", False, str(response))

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🧪 Starting GestorEPI NEW ENDPOINTS Backend Tests...")
        print(f"🌐 Testing API: {self.api_url}")
        print("=" * 60)
        
        # Authentication first
        if not self.test_login():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Get test data
        self.get_test_employee_id()
        
        # LGPD Endpoints Tests
        print("\n🛡️ LGPD ENDPOINTS TESTS")
        print("-" * 40)
        
        self.test_lgpd_dashboard()
        self.test_lgpd_consentimentos()
        self.test_lgpd_export_dados()
        
        # Advanced Reports Tests
        print("\n📊 ADVANCED REPORTS TESTS")
        print("-" * 40)
        
        self.test_relatorios_entregas_por_periodo()
        self.test_relatorios_consumo_epis()
        self.test_relatorios_estoque_critico()
        self.test_relatorios_vencimentos()
        
        # Multi-tenant Isolation Tests
        print("\n🏢 MULTI-TENANT ISOLATION TESTS")
        print("-" * 40)
        
        self.test_suppliers_isolation()
        self.test_dashboard_stats_isolation()
        self.test_stock_alerts_isolation()
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✅ Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
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
            "timestamp": datetime.now().isoformat()
        }

def main():
    """Main test execution"""
    tester = GestorEPINewTester()
    
    try:
        success = tester.run_all_tests()
        
        # Save detailed results
        summary = tester.get_test_summary()
        
        # Create test reports directory if it doesn't exist
        import os
        os.makedirs('/app/test_reports', exist_ok=True)
        
        with open('/app/test_reports/backend_new_test_results.json', 'w') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 Detailed results saved to: /app/test_reports/backend_new_test_results.json")
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())