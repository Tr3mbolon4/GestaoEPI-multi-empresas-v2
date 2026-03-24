#!/usr/bin/env python3
"""
Backend API Testing for GestorEPI System
Tests Master Panel endpoints for SUPER_ADMIN functionality
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class GestorEPITester:
    def __init__(self, base_url="https://epi-manager-12.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.test_epi_id = None
        self.test_kit_id = None
        self.test_employee_id = None
        self.test_empresa_id = None
        self.test_backup_id = None

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
        
        # Try SUPER_ADMIN credentials first
        success, response = self.make_request(
            "POST", 
            "auth/login",
            {"username": "superadmin", "password": "Super@2026!"}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log_test("Login with superadmin", True)
            print(f"   Role: {response.get('role', 'unknown')}")
            return True
        else:
            # Fallback to old credentials
            success, response = self.make_request(
                "POST", 
                "auth/login",
                {"username": "administrador", "password": "LR1a2b3c4567@"}
            )
            
            if success and 'access_token' in response:
                self.token = response['access_token']
                self.log_test("Login with administrador (fallback)", True)
                print(f"   Role: {response.get('role', 'unknown')}")
                return True
            else:
                self.log_test("Login failed", False, f"Response: {response}")
                return False

    def test_health_check(self):
        """Test API health endpoint"""
        print("\n🏥 Testing Health Check...")
        
        success, response = self.make_request("GET", "health")
        
        if success:
            self.log_test("Health check endpoint", True)
            print(f"   Database: {response.get('database', 'unknown')}")
            print(f"   Backend URL: {response.get('backend_url', 'not_set')}")
        else:
            self.log_test("Health check endpoint", False, str(response))

    def test_master_dashboard(self):
        """Test Master Dashboard endpoint"""
        print("\n📊 Testing Master Dashboard...")
        
        success, response = self.make_request("GET", "master/dashboard")
        
        if success:
            required_fields = [
                'total_empresas', 'empresas_ativas', 'total_colaboradores_sistema',
                'empresas_por_plano', 'media_uso_plano'
            ]
            
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                self.log_test("Master Dashboard - all required fields", True)
                print(f"   Total empresas: {response.get('total_empresas', 0)}")
                print(f"   Empresas ativas: {response.get('empresas_ativas', 0)}")
                print(f"   Total colaboradores: {response.get('total_colaboradores_sistema', 0)}")
                print(f"   Média uso plano: {response.get('media_uso_plano', 0)}%")
            else:
                self.log_test("Master Dashboard - all required fields", False, f"Missing: {missing_fields}")
        else:
            self.log_test("Master Dashboard endpoint", False, str(response))

    def test_alertas_limite(self):
        """Test Alertas de Limite endpoint"""
        print("\n🚨 Testing Alertas de Limite...")
        
        success, response = self.make_request("GET", "master/alertas-limite")
        
        if success:
            required_fields = ['alertas', 'total_warning', 'total_critical', 'total_blocked']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                self.log_test("Alertas de Limite - structure correct", True)
                alertas = response.get('alertas', [])
                print(f"   Total alertas: {len(alertas)}")
                print(f"   Warning: {response.get('total_warning', 0)}")
                print(f"   Critical: {response.get('total_critical', 0)}")
                print(f"   Blocked: {response.get('total_blocked', 0)}")
                
                # Check alert structure if any exist
                if alertas:
                    alert = alertas[0]
                    alert_fields = ['empresa_id', 'empresa_nome', 'colaboradores_atual', 'limite', 'uso_percentual', 'nivel_alerta']
                    missing_alert_fields = [field for field in alert_fields if field not in alert]
                    
                    if not missing_alert_fields:
                        self.log_test("Alert structure complete", True)
                    else:
                        self.log_test("Alert structure complete", False, f"Missing: {missing_alert_fields}")
                else:
                    self.log_test("Alert structure complete", True, "No alerts to check (acceptable)")
            else:
                self.log_test("Alertas de Limite - structure correct", False, f"Missing: {missing_fields}")
        else:
            self.log_test("Alertas de Limite endpoint", False, str(response))

    def test_get_empresas_for_reports(self):
        """Get empresas list to use in other tests"""
        print("\n🏢 Getting Empresas for Report Tests...")
        
        success, response = self.make_request("GET", "empresas")
        
        if success and response:
            empresas = response if isinstance(response, list) else []
            if empresas:
                self.test_empresa_id = empresas[0].get('id')
                self.log_test("Get empresas list", True)
                print(f"   Found {len(empresas)} empresas")
                print(f"   Using empresa_id: {self.test_empresa_id}")
                return True
            else:
                self.log_test("Get empresas list", False, "No empresas found")
                return False
        else:
            self.log_test("Get empresas list", False, str(response))
            return False

    def test_empresa_relatorio(self):
        """Test Empresa Relatório endpoint"""
        print("\n📋 Testing Empresa Relatório...")
        
        if not self.test_empresa_id:
            self.log_test("Empresa Relatório test", False, "No empresa_id available")
            return
        
        success, response = self.make_request("GET", f"master/empresas/{self.test_empresa_id}/relatorio?periodo=30")
        
        if success:
            required_fields = [
                'empresa_id', 'empresa_nome', 'total_colaboradores', 'colaboradores_ativos',
                'limite_colaboradores', 'uso_percentual', 'total_epis', 'total_entregas',
                'entregas_periodo', 'devolucoes_periodo', 'top_epis_entregues', 'top_colaboradores_entregas'
            ]
            
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                self.log_test("Empresa Relatório - all fields present", True)
                print(f"   Empresa: {response.get('empresa_nome', 'N/A')}")
                print(f"   Colaboradores: {response.get('total_colaboradores', 0)}/{response.get('limite_colaboradores', 0)}")
                print(f"   Uso: {response.get('uso_percentual', 0)}%")
                print(f"   EPIs: {response.get('total_epis', 0)}")
                print(f"   Entregas período: {response.get('entregas_periodo', 0)}")
            else:
                self.log_test("Empresa Relatório - all fields present", False, f"Missing: {missing_fields}")
        else:
            self.log_test("Empresa Relatório endpoint", False, str(response))

    def test_historico_planos(self):
        """Test Histórico de Planos endpoint"""
        print("\n📜 Testing Histórico de Planos...")
        
        if not self.test_empresa_id:
            self.log_test("Histórico Planos test", False, "No empresa_id available")
            return
        
        success, response = self.make_request("GET", f"master/empresas/{self.test_empresa_id}/historico-planos")
        
        if success:
            historico = response if isinstance(response, list) else []
            self.log_test("Histórico de Planos endpoint", True)
            print(f"   Found {len(historico)} histórico entries")
            
            # Check structure if any entries exist
            if historico:
                entry = historico[0]
                required_fields = ['plano_anterior', 'plano_novo', 'limite_anterior', 'limite_novo', 'alterado_por', 'alterado_em']
                missing_fields = [field for field in required_fields if field not in entry]
                
                if not missing_fields:
                    self.log_test("Histórico entry structure", True)
                else:
                    self.log_test("Histórico entry structure", False, f"Missing: {missing_fields}")
            else:
                self.log_test("Histórico entry structure", True, "No entries to check (acceptable)")
        else:
            self.log_test("Histórico de Planos endpoint", False, str(response))

    def test_atualizar_plano(self):
        """Test Atualizar Plano endpoint"""
        print("\n✏️ Testing Atualizar Plano...")
        
        if not self.test_empresa_id:
            self.log_test("Atualizar Plano test", False, "No empresa_id available")
            return
        
        # Test plan update
        success, response = self.make_request(
            "PATCH", 
            f"master/empresas/{self.test_empresa_id}/plano?plano=250&limite=250&motivo=Teste automatizado"
        )
        
        if success:
            self.log_test("Atualizar Plano endpoint", True)
            print(f"   Response: {response.get('message', 'No message')}")
            
            # Verify the change was recorded in history
            success_hist, hist_response = self.make_request("GET", f"master/empresas/{self.test_empresa_id}/historico-planos")
            
            if success_hist and hist_response:
                recent_entry = hist_response[0] if hist_response else None
                if recent_entry and recent_entry.get('motivo') == 'Teste automatizado':
                    self.log_test("Plan update recorded in history", True)
                else:
                    self.log_test("Plan update recorded in history", False, "Recent entry not found or incorrect")
            else:
                self.log_test("Plan update recorded in history", False, "Could not verify history")
        else:
            self.log_test("Atualizar Plano endpoint", False, str(response))

    def test_vigencia_plano(self):
        """Test Vigência do Plano endpoint"""
        print("\n📅 Testing Vigência do Plano...")
        
        if not self.test_empresa_id:
            self.log_test("Vigência Plano test", False, "No empresa_id available")
            return
        
        success, response = self.make_request("GET", f"master/empresas/{self.test_empresa_id}/vigencia")
        
        if success:
            required_fields = ['empresa_id', 'plano', 'status_vigencia']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                self.log_test("Vigência do Plano - structure correct", True)
                print(f"   Plano: {response.get('plano', 'N/A')}")
                print(f"   Status: {response.get('status_vigencia', 'N/A')}")
                print(f"   Dias restantes: {response.get('dias_restantes', 'N/A')}")
            else:
                self.log_test("Vigência do Plano - structure correct", False, f"Missing: {missing_fields}")
        else:
            self.log_test("Vigência do Plano endpoint", False, str(response))

    def test_criar_backup(self):
        """Test Criar Backup endpoint"""
        print("\n💾 Testing Criar Backup...")
        
        success, response = self.make_request(
            "POST", 
            "master/backup",
            {"descricao": "Backup de teste automatizado"}
        )
        
        if success:
            required_fields = ['id', 'nome_arquivo', 'tamanho_bytes', 'colecoes_incluidas', 'status']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                self.test_backup_id = response.get('id')
                self.log_test("Criar Backup - structure correct", True)
                print(f"   Arquivo: {response.get('nome_arquivo', 'N/A')}")
                print(f"   Tamanho: {response.get('tamanho_formatado', 'N/A')}")
                print(f"   Coleções: {len(response.get('colecoes_incluidas', []))}")
                print(f"   Status: {response.get('status', 'N/A')}")
            else:
                self.log_test("Criar Backup - structure correct", False, f"Missing: {missing_fields}")
        else:
            self.log_test("Criar Backup endpoint", False, str(response))

    def test_listar_backups(self):
        """Test Listar Backups endpoint"""
        print("\n📂 Testing Listar Backups...")
        
        success, response = self.make_request("GET", "master/backups")
        
        if success:
            required_fields = ['backups', 'total', 'espaco_total_usado']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                backups = response.get('backups', [])
                self.log_test("Listar Backups - structure correct", True)
                print(f"   Total backups: {response.get('total', 0)}")
                print(f"   Espaço usado: {response.get('espaco_total_usado', 'N/A')}")
                
                # Check backup entry structure if any exist
                if backups:
                    backup = backups[0]
                    backup_fields = ['id', 'nome_arquivo', 'tamanho_formatado', 'criado_por', 'criado_em']
                    missing_backup_fields = [field for field in backup_fields if field not in backup]
                    
                    if not missing_backup_fields:
                        self.log_test("Backup entry structure", True)
                    else:
                        self.log_test("Backup entry structure", False, f"Missing: {missing_backup_fields}")
                else:
                    self.log_test("Backup entry structure", True, "No backups to check")
            else:
                self.log_test("Listar Backups - structure correct", False, f"Missing: {missing_fields}")
        else:
            self.log_test("Listar Backups endpoint", False, str(response))

    def test_export_endpoints(self):
        """Test Export PDF and Excel endpoints"""
        print("\n📄 Testing Export Endpoints...")
        
        if not self.test_empresa_id:
            self.log_test("Export endpoints test", False, "No empresa_id available")
            return
        
        # Test PDF export
        success, response = self.make_request(
            "GET", 
            f"master/empresas/{self.test_empresa_id}/export/pdf?periodo=30",
            expected_status=200
        )
        
        if success:
            self.log_test("Export PDF endpoint", True)
        else:
            self.log_test("Export PDF endpoint", False, str(response))
        
        # Test Excel export
        success, response = self.make_request(
            "GET", 
            f"master/empresas/{self.test_empresa_id}/export/excel?periodo=30",
            expected_status=200
        )
        
        if success:
            self.log_test("Export Excel endpoint", True)
        else:
            self.log_test("Export Excel endpoint", False, str(response))

    def test_backup_management(self):
        """Test Backup Download and Delete endpoints"""
        print("\n🗂️ Testing Backup Management...")
        
        if not self.test_backup_id:
            self.log_test("Backup management test", False, "No backup_id available")
            return
        
        # Test download backup (should return file)
        success, response = self.make_request(
            "GET", 
            f"master/backups/{self.test_backup_id}/download",
            expected_status=200
        )
        
        if success:
            self.log_test("Download Backup endpoint", True)
        else:
            self.log_test("Download Backup endpoint", False, str(response))
        
        # Test delete backup
        success, response = self.make_request(
            "DELETE", 
            f"master/backups/{self.test_backup_id}",
            expected_status=200
        )
        
        if success:
            self.log_test("Delete Backup endpoint", True)
            print(f"   Response: {response.get('message', 'No message')}")
        else:
            self.log_test("Delete Backup endpoint", False, str(response))

    def test_epi_with_nbr_field(self):
        """Test EPI creation with NBR field (new feature)"""
        print("\n📦 Testing EPI with NBR Field...")
        
        # Test 1: EPI with only NBR (no CA)
        epi_data = {
            "name": "Capacete NBR Test",
            "type_category": "Cabeça",
            "nbr_number": "NBR-15175",
            "brand": "Test Brand",
            "current_stock": 10,
            "min_stock": 2
        }
        
        success, response = self.make_request("POST", "epis", epi_data, 201)
        
        if success:
            self.test_epi_id = response.get('id')
            self.log_test("Create EPI with NBR field only", True)
            
            # Verify NBR field is returned
            if response.get('nbr_number') == "NBR-15175":
                self.log_test("NBR field correctly stored and returned", True)
            else:
                self.log_test("NBR field correctly stored and returned", False, f"Expected NBR-15175, got {response.get('nbr_number')}")
        else:
            self.log_test("Create EPI with NBR field only", False, str(response))
        
        # Test 2: EPI with both CA and NBR
        epi_data_both = {
            "name": "Luva CA+NBR Test",
            "type_category": "Mãos/Braços",
            "ca_number": "12345",
            "nbr_number": "NBR-13698",
            "current_stock": 5,
            "min_stock": 1
        }
        
        success, response = self.make_request("POST", "epis", epi_data_both, 201)
        
        if success:
            has_ca = response.get('ca_number') == "12345"
            has_nbr = response.get('nbr_number') == "NBR-13698"
            self.log_test("Create EPI with both CA and NBR", has_ca and has_nbr)
        else:
            self.log_test("Create EPI with both CA and NBR", False, str(response))
        
        # Test 3: EPI with neither CA nor NBR (should fail)
        epi_data_invalid = {
            "name": "Invalid EPI",
            "type_category": "Corpo",
            "current_stock": 1
        }
        
        success, response = self.make_request("POST", "epis", epi_data_invalid, 400)
        
        if success:  # Success means it correctly returned 400
            self.log_test("Reject EPI without CA or NBR", True)
        else:
            self.log_test("Reject EPI without CA or NBR", False, "Should have returned 400 error")

    def test_epi_replacement_periodicity(self):
        """Test EPI replacement periodicity feature"""
        print("\n⏰ Testing EPI Replacement Periodicity...")
        
        if not self.test_epi_id:
            self.log_test("EPI replacement periodicity test", False, "No test EPI available")
            return
        
        # Test weekly periodicity
        update_data = {
            "replacement_period": "weekly"
        }
        
        success, response = self.make_request("PATCH", f"epis/{self.test_epi_id}", update_data)
        
        if success and response.get('replacement_period') == 'weekly':
            self.log_test("Set EPI replacement period to weekly", True)
        else:
            self.log_test("Set EPI replacement period to weekly", False, str(response))
        
        # Test custom periodicity
        update_data_custom = {
            "replacement_period": "custom",
            "replacement_days": 45
        }
        
        success, response = self.make_request("PATCH", f"epis/{self.test_epi_id}", update_data_custom)
        
        if success:
            period_ok = response.get('replacement_period') == 'custom'
            days_ok = response.get('replacement_days') == 45
            self.log_test("Set EPI custom replacement period (45 days)", period_ok and days_ok)
        else:
            self.log_test("Set EPI custom replacement period (45 days)", False, str(response))

    def test_mandatory_kit_with_sector(self):
        """Test kit creation with mandatory sector field"""
        print("\n🎒 Testing Mandatory Kit with Sector...")
        
        if not self.test_epi_id:
            self.log_test("Kit creation test", False, "No test EPI available")
            return
        
        kit_data = {
            "name": "Kit Marcenaria Obrigatório",
            "description": "Kit obrigatório para colaboradores da marcenaria",
            "sector": "Marcenaria",
            "is_mandatory": True,
            "items": [
                {
                    "epi_id": self.test_epi_id,
                    "quantity": 1
                }
            ]
        }
        
        success, response = self.make_request("POST", "kits", kit_data, 201)
        
        if success:
            self.test_kit_id = response.get('id')
            sector_ok = response.get('sector') == "Marcenaria"
            mandatory_ok = response.get('is_mandatory') == True
            items_ok = len(response.get('items', [])) > 0
            
            if sector_ok and mandatory_ok and items_ok:
                self.log_test("Create mandatory kit with sector", True)
            else:
                self.log_test("Create mandatory kit with sector", False, f"Sector: {sector_ok}, Mandatory: {mandatory_ok}, Items: {items_ok}")
        else:
            self.log_test("Create mandatory kit with sector", False, str(response))
        
        # Test kit without sector (should fail or require sector)
        kit_data_no_sector = {
            "name": "Kit Sem Setor",
            "is_mandatory": True,
            "items": []
        }
        
        success, response = self.make_request("POST", "kits", kit_data_no_sector, 400)
        
        # If it returns 400, that's good (validation working)
        # If it returns 201, check if sector is required in response
        if success:  # Got expected 400
            self.log_test("Reject kit without sector", True)
        else:
            # Check if it was created but with validation
            success_created, response_created = self.make_request("POST", "kits", kit_data_no_sector, 201)
            if success_created:
                self.log_test("Reject kit without sector", False, "Kit created without sector validation")
            else:
                self.log_test("Reject kit without sector", True, "Properly rejected")

    def test_alerts_endpoints(self):
        """Test new alerts endpoints"""
        print("\n🚨 Testing Alerts Endpoints...")
        
        # Test all alerts endpoint
        success, response = self.make_request("GET", "alerts/all")
        
        if success:
            has_pending = 'pending_epis' in response
            has_replacement = 'replacement_due' in response
            has_total = 'total_alerts' in response
            
            if has_pending and has_replacement:
                self.log_test("Get all alerts endpoint", True)
                print(f"   Total alerts: {response.get('total_alerts', 0)}")
                print(f"   Pending EPIs: {len(response.get('pending_epis', []))}")
                print(f"   Replacement due: {len(response.get('replacement_due', []))}")
            else:
                self.log_test("Get all alerts endpoint", False, f"Missing fields: pending_epis={has_pending}, replacement_due={has_replacement}")
        else:
            self.log_test("Get all alerts endpoint", False, str(response))
        
        # Test pending EPIs endpoint
        success, response = self.make_request("GET", "alerts/pending-epis")
        
        if success:
            self.log_test("Get pending EPIs alerts", True)
        else:
            self.log_test("Get pending EPIs alerts", False, str(response))
        
        # Test replacement due endpoint
        success, response = self.make_request("GET", "alerts/replacement-due")
        
        if success:
            self.log_test("Get replacement due alerts", True)
        else:
            self.log_test("Get replacement due alerts", False, str(response))

    def test_dashboard_with_alerts(self):
        """Test dashboard shows alerts card"""
        print("\n📊 Testing Dashboard with Alerts...")
        
        success, response = self.make_request("GET", "dashboard/stats")
        
        if success:
            # Check if dashboard includes alert counts
            has_alerts = any(key in response for key in ['total_alerts', 'pending_epi_alerts', 'replacement_due_alerts'])
            
            if has_alerts:
                self.log_test("Dashboard includes alert statistics", True)
                print(f"   Dashboard stats keys: {list(response.keys())}")
            else:
                self.log_test("Dashboard includes alert statistics", False, f"No alert fields found in: {list(response.keys())}")
        else:
            self.log_test("Dashboard includes alert statistics", False, str(response))

    def test_delivery_history_responsible(self):
        """Test that delivery history shows responsible person"""
        print("\n📋 Testing Delivery History with Responsible...")
        
        # Get deliveries to check if delivered_by_name field exists
        success, response = self.make_request("GET", "deliveries")
        
        if success:
            deliveries = response if isinstance(response, list) else response.get('deliveries', [])
            
            if deliveries:
                # Check if any delivery has delivered_by_name field
                has_responsible = any('delivered_by_name' in delivery for delivery in deliveries)
                
                if has_responsible:
                    self.log_test("Delivery history shows responsible person", True)
                else:
                    self.log_test("Delivery history shows responsible person", False, "No delivered_by_name field found")
            else:
                self.log_test("Delivery history shows responsible person", True, "No deliveries to test (acceptable)")
        else:
            self.log_test("Delivery history shows responsible person", False, str(response))

    def test_employee_alerts(self):
        """Test employee-specific alerts"""
        print("\n👤 Testing Employee-Specific Alerts...")
        
        # Get employees first
        success, response = self.make_request("GET", "employees")
        
        if success and response:
            employees = response if isinstance(response, list) else []
            
            if employees:
                employee_id = employees[0].get('id')
                self.test_employee_id = employee_id
                
                # Test employee alerts endpoint
                success, alert_response = self.make_request("GET", f"alerts/employee/{employee_id}")
                
                if success:
                    has_pending = 'pending_epis' in alert_response
                    has_replacement = 'replacement_due' in alert_response
                    has_total = 'total_alerts' in alert_response
                    
                    if has_pending and has_replacement and has_total:
                        self.log_test("Get employee-specific alerts", True)
                    else:
                        self.log_test("Get employee-specific alerts", False, f"Missing alert fields")
                else:
                    self.log_test("Get employee-specific alerts", False, str(alert_response))
            else:
                self.log_test("Get employee-specific alerts", True, "No employees to test (acceptable)")
        else:
            self.log_test("Get employee-specific alerts", False, "Could not fetch employees")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🧪 Starting GestorEPI Master Panel Backend Tests...")
        print(f"🌐 Testing API: {self.api_url}")
        print("=" * 60)
        
        # Authentication first
        if not self.test_login():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Health check
        self.test_health_check()
        
        # Master Panel Tests (Priority)
        print("\n🎯 MASTER PANEL TESTS (HIGH PRIORITY)")
        print("-" * 40)
        
        self.test_master_dashboard()
        self.test_alertas_limite()
        
        # Get empresas for other tests
        if self.test_get_empresas_for_reports():
            self.test_empresa_relatorio()
            self.test_historico_planos()
            self.test_atualizar_plano()
            self.test_vigencia_plano()
            self.test_export_endpoints()
        
        # Backup tests
        self.test_criar_backup()
        self.test_listar_backups()
        self.test_backup_management()
        
        # Legacy tests (if time permits)
        print("\n📋 LEGACY FEATURE TESTS")
        print("-" * 40)
        
        self.test_epi_with_nbr_field()
        self.test_epi_replacement_periodicity()
        self.test_mandatory_kit_with_sector()
        self.test_alerts_endpoints()
        self.test_dashboard_with_alerts()
        self.test_employee_alerts()
        self.test_delivery_history_responsible()
        
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
    tester = GestorEPITester()
    
    try:
        success = tester.run_all_tests()
        
        # Save detailed results
        summary = tester.get_test_summary()
        
        # Create test reports directory if it doesn't exist
        import os
        os.makedirs('/app/test_reports', exist_ok=True)
        
        with open('/app/test_reports/backend_test_results.json', 'w') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 Detailed results saved to: /app/test_reports/backend_test_results.json")
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())