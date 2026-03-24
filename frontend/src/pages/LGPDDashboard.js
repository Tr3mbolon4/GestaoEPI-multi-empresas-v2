import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  Shield, Users, FileText, Download, Trash2, AlertTriangle, CheckCircle, 
  Eye, RefreshCw, Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { getAuthHeader } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LGPDDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [consentimentos, setConsentimentos] = useState([]);
  const [totalConsentimentos, setTotalConsentimentos] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Dialogs
  const [showExclusaoDialog, setShowExclusaoDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDashboard();
    fetchConsentimentos();
  }, [page]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/lgpd/dashboard`, { headers: getAuthHeader() });
      setDashboard(response.data);
    } catch (error) {
      console.error('Erro ao buscar dashboard LGPD:', error);
      if (error.response?.status !== 403) {
        toast.error('Erro ao carregar dados de LGPD');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchConsentimentos = async () => {
    try {
      const response = await axios.get(`${API}/lgpd/consentimentos?page=${page}&limit=20`, { headers: getAuthHeader() });
      setConsentimentos(response.data.consentimentos || []);
      setTotalConsentimentos(response.data.total);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      console.error('Erro ao buscar consentimentos:', error);
    }
  };

  const handleExportDados = async (employeeId, employeeName) => {
    try {
      const response = await axios.get(`${API}/lgpd/export-dados/${employeeId}`, {
        headers: getAuthHeader(),
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dados_${employeeName}_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar dados');
    }
  };

  const handleSolicitarExclusao = (employee) => {
    setSelectedEmployee(employee);
    setConfirmText('');
    setShowExclusaoDialog(true);
  };

  const handleExecutarExclusao = async () => {
    if (confirmText !== 'EXCLUIR') {
      toast.error('Digite EXCLUIR para confirmar');
      return;
    }
    
    try {
      await axios.post(
        `${API}/lgpd/executar-exclusao/${selectedEmployee.id}?confirmar=true`,
        {},
        { headers: getAuthHeader() }
      );
      
      toast.success('Dados biométricos excluídos com sucesso!');
      setShowExclusaoDialog(false);
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao excluir dados');
    }
  };

  const getConsentTypeLabel = (type) => {
    const labels = {
      'granted': 'Concedido',
      'initial': 'Inicial',
      'revoked': 'Revogado',
      'updated': 'Atualizado'
    };
    return labels[type] || type;
  };

  const getConsentTypeColor = (type) => {
    const colors = {
      'granted': 'bg-emerald-100 text-emerald-700',
      'initial': 'bg-blue-100 text-blue-700',
      'revoked': 'bg-red-100 text-red-700',
      'updated': 'bg-amber-100 text-amber-700'
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  if (loading && !dashboard) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-violet-600" />
              Conformidade LGPD
            </h1>
            <p className="text-slate-600 mt-1">Proteção de dados e consentimentos biométricos</p>
          </div>
          <Button onClick={() => { fetchDashboard(); fetchConsentimentos(); }} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Status de Conformidade */}
        {dashboard && (
          <div className={`p-6 rounded-lg border ${
            dashboard.status_conformidade === 'conforme' 
              ? 'bg-emerald-50 border-emerald-200' 
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center gap-3">
              {dashboard.status_conformidade === 'conforme' ? (
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              )}
              <div>
                <h2 className={`text-xl font-semibold ${
                  dashboard.status_conformidade === 'conforme' ? 'text-emerald-800' : 'text-amber-800'
                }`}>
                  {dashboard.status_conformidade === 'conforme' 
                    ? 'Em conformidade com a LGPD' 
                    : 'Pendências de conformidade'}
                </h2>
                <p className={`${
                  dashboard.status_conformidade === 'conforme' ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {dashboard.status_conformidade === 'conforme'
                    ? 'Todos os colaboradores com biometria possuem consentimento registrado.'
                    : `${dashboard.total_sem_consentimento} colaborador(es) com biometria sem consentimento registrado.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cards de Métricas */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-violet-500" />
                <div>
                  <p className="text-sm text-slate-600">Com Biometria</p>
                  <p className="text-2xl font-bold text-slate-900">{dashboard.colaboradores_com_biometria}</p>
                  <p className="text-xs text-slate-500">{dashboard.percentual_biometria}% do total</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="text-sm text-slate-600">Consentimentos</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {dashboard.consentimentos_por_tipo?.concedidos || 0}
                  </p>
                  <p className="text-xs text-slate-500">concedidos</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-sm text-slate-600">Sem Consentimento</p>
                  <p className="text-2xl font-bold text-amber-600">{dashboard.total_sem_consentimento}</p>
                  <p className="text-xs text-slate-500">pendentes</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <Trash2 className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-sm text-slate-600">Revogados</p>
                  <p className="text-2xl font-bold text-red-600">
                    {dashboard.consentimentos_por_tipo?.revogados || 0}
                  </p>
                  <p className="text-xs text-slate-500">consentimentos</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Colaboradores sem consentimento */}
        {dashboard && dashboard.colaboradores_sem_consentimento?.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Colaboradores com Biometria sem Consentimento Registrado
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">CPF</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Departamento</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dashboard.colaboradores_sem_consentimento.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{emp.nome}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-sm">{emp.cpf}</td>
                      <td className="px-4 py-3 text-slate-600">{emp.departamento || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportDados(emp.id, emp.nome)}
                            title="Exportar dados"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleSolicitarExclusao(emp)}
                            title="Excluir biometria"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lista de Consentimentos */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-500" />
              Histórico de Consentimentos
            </h3>
            <span className="text-sm text-slate-500">{totalConsentimentos} registros</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Colaborador</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {consentimentos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                      Nenhum consentimento registrado
                    </td>
                  </tr>
                ) : (
                  consentimentos.map((consent) => (
                    <tr key={consent.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{consent.employee_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getConsentTypeColor(consent.consent_type)}`}>
                          {getConsentTypeLabel(consent.consent_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-sm">
                        {new Date(consent.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-sm">{consent.ip_address}</td>
                      <td className="px-4 py-3 text-slate-600">{consent.granted_by || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Dialog Exclusão */}
        <Dialog open={showExclusaoDialog} onOpenChange={setShowExclusaoDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Excluir Dados Biométricos
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">⚠️ Atenção: Esta ação é irreversível!</p>
                <p className="text-red-600 text-sm mt-1">
                  Você está prestes a excluir todos os dados biométricos de <strong>{selectedEmployee?.nome}</strong>.
                </p>
              </div>
              
              <div className="text-sm text-slate-600">
                <p className="font-medium mb-2">Serão excluídos:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Template facial (biometria)</li>
                  <li>Foto do colaborador</li>
                  <li>Dados de consentimento serão anonimizados</li>
                </ul>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Digite <strong>EXCLUIR</strong> para confirmar:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="EXCLUIR"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExclusaoDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleExecutarExclusao}
                className="bg-red-600 hover:bg-red-700"
                disabled={confirmText !== 'EXCLUIR'}
              >
                Excluir Dados
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
