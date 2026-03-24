import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  Building2, Plus, Edit, Ban, CheckCircle, Users, Package, RefreshCw, Eye, UserPlus,
  Download, FileText, TrendingUp, AlertTriangle, Database, Calendar, BarChart3,
  HardDrive, Clock, Trash2, FileSpreadsheet
} from 'lucide-react';
import axios from 'axios';
import { getAuthHeader, useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PLANOS = [
  { value: '50', label: 'Starter (50 colaboradores)' },
  { value: '150', label: 'Basic (150 colaboradores)' },
  { value: '250', label: 'Professional (250 colaboradores)' },
  { value: '350', label: 'Enterprise (350 colaboradores)' },
  { value: 'unlimited', label: 'Ilimitado' }
];

export default function PainelMaster() {
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('empresas');
  
  // Dialogs
  const [showDialog, setShowDialog] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [showRelatorioDialog, setShowRelatorioDialog] = useState(false);
  const [showPlanoDialog, setShowPlanoDialog] = useState(false);
  
  // Data
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [empresaStats, setEmpresaStats] = useState(null);
  const [relatorioData, setRelatorioData] = useState(null);
  const [dashboardMaster, setDashboardMaster] = useState(null);
  const [alertasLimite, setAlertasLimite] = useState([]);
  const [backups, setBackups] = useState([]);
  const [historicoPlanos, setHistoricoPlanos] = useState([]);
  
  // Forms
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    status: 'ativo',
    plano: '50',
    limite_colaboradores: 50,
    endereco: '',
    telefone: '',
    email: '',
    responsavel: ''
  });
  
  const [adminForm, setAdminForm] = useState({
    username: '',
    email: '',
    password: ''
  });
  
  const [planoForm, setPlanoForm] = useState({
    plano: '50',
    limite: 50,
    motivo: '',
    data_inicio: '',
    data_fim: ''
  });

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchEmpresas();
      fetchDashboardMaster();
      fetchAlertasLimite();
      fetchBackups();
    }
  }, [user]);

  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/empresas`, { headers: getAuthHeader() });
      setEmpresas(response.data);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      toast.error('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardMaster = async () => {
    try {
      const response = await axios.get(`${API}/master/dashboard`, { headers: getAuthHeader() });
      setDashboardMaster(response.data);
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
    }
  };

  const fetchAlertasLimite = async () => {
    try {
      const response = await axios.get(`${API}/master/alertas-limite`, { headers: getAuthHeader() });
      setAlertasLimite(response.data.alertas || []);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
    }
  };

  const fetchBackups = async () => {
    try {
      const response = await axios.get(`${API}/master/backups`, { headers: getAuthHeader() });
      setBackups(response.data.backups || []);
    } catch (error) {
      console.error('Erro ao buscar backups:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        limite_colaboradores: parseInt(formData.limite_colaboradores)
      };
      
      if (editingEmpresa) {
        await axios.patch(`${API}/empresas/${editingEmpresa.id}`, payload, { headers: getAuthHeader() });
        toast.success('Empresa atualizada com sucesso!');
      } else {
        await axios.post(`${API}/empresas`, payload, { headers: getAuthHeader() });
        toast.success('Empresa criada com sucesso!');
      }
      
      setShowDialog(false);
      resetForm();
      fetchEmpresas();
      fetchDashboardMaster();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar empresa');
    }
  };

  const handleEdit = (empresa) => {
    setEditingEmpresa(empresa);
    setFormData({
      nome: empresa.nome || '',
      cnpj: empresa.cnpj || '',
      status: empresa.status || 'ativo',
      plano: empresa.plano || '50',
      limite_colaboradores: empresa.limite_colaboradores || 50,
      endereco: empresa.endereco || '',
      telefone: empresa.telefone || '',
      email: empresa.email || '',
      responsavel: empresa.responsavel || ''
    });
    setShowDialog(true);
  };

  const handleBloquear = async (empresa) => {
    if (!window.confirm(`Deseja realmente ${empresa.status === 'ativo' ? 'BLOQUEAR' : 'ATIVAR'} a empresa ${empresa.nome}?`)) {
      return;
    }
    
    try {
      const endpoint = empresa.status === 'ativo' ? 'bloquear' : 'ativar';
      await axios.post(`${API}/empresas/${empresa.id}/${endpoint}`, {}, { headers: getAuthHeader() });
      toast.success(`Empresa ${empresa.status === 'ativo' ? 'bloqueada' : 'ativada'} com sucesso!`);
      fetchEmpresas();
      fetchDashboardMaster();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao alterar status');
    }
  };

  const handleViewStats = async (empresa) => {
    try {
      const response = await axios.get(`${API}/empresas/${empresa.id}/stats`, { headers: getAuthHeader() });
      setEmpresaStats(response.data);
      setSelectedEmpresa(empresa);
    } catch (error) {
      toast.error('Erro ao carregar estatísticas');
    }
  };

  const handleViewRelatorio = async (empresa, periodo = 30) => {
    try {
      const response = await axios.get(`${API}/master/empresas/${empresa.id}/relatorio?periodo=${periodo}`, { headers: getAuthHeader() });
      setRelatorioData(response.data);
      setSelectedEmpresa(empresa);
      setShowRelatorioDialog(true);
    } catch (error) {
      toast.error('Erro ao carregar relatório');
    }
  };

  const handleExportPDF = async (empresa) => {
    try {
      const response = await axios.get(`${API}/master/empresas/${empresa.id}/export/pdf`, {
        headers: getAuthHeader(),
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_${empresa.nome}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Relatório PDF exportado!');
    } catch (error) {
      toast.error('Erro ao exportar PDF');
    }
  };

  const handleExportExcel = async (empresa) => {
    try {
      const response = await axios.get(`${API}/master/empresas/${empresa.id}/export/excel`, {
        headers: getAuthHeader(),
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_${empresa.nome}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Relatório Excel exportado!');
    } catch (error) {
      toast.error('Erro ao exportar Excel');
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API}/empresas/${selectedEmpresa.id}/criar-admin`, adminForm, { headers: getAuthHeader() });
      toast.success('Administrador criado com sucesso!');
      setShowAdminDialog(false);
      setAdminForm({ username: '', email: '', password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar administrador');
    }
  };

  const handleOpenPlanoDialog = async (empresa) => {
    setSelectedEmpresa(empresa);
    setPlanoForm({
      plano: empresa.plano || '50',
      limite: empresa.limite_colaboradores || 50,
      motivo: '',
      data_inicio: '',
      data_fim: ''
    });
    
    // Buscar histórico de planos
    try {
      const response = await axios.get(`${API}/master/empresas/${empresa.id}/historico-planos`, { headers: getAuthHeader() });
      setHistoricoPlanos(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    }
    
    setShowPlanoDialog(true);
  };

  const handleUpdatePlano = async (e) => {
    e.preventDefault();
    
    try {
      const params = new URLSearchParams({
        plano: planoForm.plano,
        limite: planoForm.limite.toString()
      });
      
      if (planoForm.motivo) params.append('motivo', planoForm.motivo);
      if (planoForm.data_inicio) params.append('data_inicio', planoForm.data_inicio);
      if (planoForm.data_fim) params.append('data_fim', planoForm.data_fim);
      
      await axios.patch(`${API}/master/empresas/${selectedEmpresa.id}/plano?${params.toString()}`, {}, { headers: getAuthHeader() });
      toast.success('Plano atualizado com sucesso!');
      setShowPlanoDialog(false);
      fetchEmpresas();
      fetchAlertasLimite();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar plano');
    }
  };

  const handleCreateBackup = async () => {
    try {
      toast.info('Criando backup...');
      const response = await axios.post(`${API}/master/backup`, {}, { headers: getAuthHeader() });
      toast.success(`Backup criado: ${response.data.tamanho_formatado}`);
      fetchBackups();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar backup');
    }
  };

  const handleDownloadBackup = async (backup) => {
    try {
      const response = await axios.get(`${API}/master/backups/${backup.id}/download`, {
        headers: getAuthHeader(),
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', backup.nome_arquivo);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Erro ao baixar backup');
    }
  };

  const handleDeleteBackup = async (backup) => {
    if (!window.confirm(`Excluir backup ${backup.nome_arquivo}?`)) return;
    
    try {
      await axios.delete(`${API}/master/backups/${backup.id}`, { headers: getAuthHeader() });
      toast.success('Backup excluído!');
      fetchBackups();
    } catch (error) {
      toast.error('Erro ao excluir backup');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cnpj: '',
      status: 'ativo',
      plano: '50',
      limite_colaboradores: 50,
      endereco: '',
      telefone: '',
      email: '',
      responsavel: ''
    });
    setEditingEmpresa(null);
  };

  // Verificar se é SUPER_ADMIN
  if (user?.role !== 'super_admin') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Ban className="w-16 h-16 text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Acesso Restrito</h2>
          <p className="text-slate-600">Este painel é exclusivo para Super Administradores.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="painel-master">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Building2 className="w-8 h-8 text-violet-600" />
              Painel Master
            </h1>
            <p className="text-slate-600 mt-1">Gerenciamento completo do sistema</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { fetchEmpresas(); fetchDashboardMaster(); fetchAlertasLimite(); fetchBackups(); }} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
            <Button onClick={() => { resetForm(); setShowDialog(true); }} className="gap-2 bg-violet-600 hover:bg-violet-700">
              <Plus className="w-4 h-4" />
              Nova Empresa
            </Button>
          </div>
        </div>

        {/* Dashboard Cards */}
        {dashboardMaster && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">Total de Empresas</p>
              <p className="text-3xl font-bold text-violet-600">{dashboardMaster.total_empresas}</p>
              <p className="text-xs text-slate-500 mt-1">
                {dashboardMaster.empresas_ativas} ativas / {dashboardMaster.empresas_bloqueadas} bloqueadas
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">Colaboradores</p>
              <p className="text-3xl font-bold text-emerald-600">{dashboardMaster.total_colaboradores_sistema}</p>
              <p className="text-xs text-slate-500 mt-1">+{dashboardMaster.novos_colaboradores_mes} este mês</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">Entregas</p>
              <p className="text-3xl font-bold text-blue-600">{dashboardMaster.total_entregas_sistema}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">Uso Médio</p>
              <p className="text-3xl font-bold text-slate-900">{dashboardMaster.media_uso_plano}%</p>
              <p className="text-xs text-slate-500 mt-1">dos planos</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${dashboardMaster.empresas_limite_critical > 0 ? 'text-red-500' : 'text-yellow-500'}`} />
                <p className="text-sm text-slate-600">Alertas</p>
              </div>
              <p className="text-3xl font-bold text-amber-600">
                {dashboardMaster.empresas_limite_warning + dashboardMaster.empresas_limite_critical}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {dashboardMaster.empresas_limite_critical} críticos
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="empresas" className="gap-2">
              <Building2 className="w-4 h-4" />
              Empresas
            </TabsTrigger>
            <TabsTrigger value="alertas" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alertas ({alertasLimite.length})
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-2">
              <Database className="w-4 h-4" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          {/* Tab: Empresas */}
          <TabsContent value="empresas" className="mt-4">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Empresa</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">CNPJ</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Plano</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Colaboradores</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto"></div>
                        </td>
                      </tr>
                    ) : empresas.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                          Nenhuma empresa cadastrada
                        </td>
                      </tr>
                    ) : (
                      empresas.map((empresa) => {
                        const uso = empresa.limite_colaboradores > 0 
                          ? ((empresa.colaboradores_cadastrados || 0) / empresa.limite_colaboradores * 100) 
                          : 0;
                        const usoClass = uso >= 90 ? 'text-red-600' : uso >= 80 ? 'text-amber-600' : 'text-slate-600';
                        
                        return (
                          <tr key={empresa.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-slate-900">{empresa.nome}</p>
                                {empresa.responsavel && (
                                  <p className="text-sm text-slate-500">{empresa.responsavel}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-sm text-slate-600">{empresa.cnpj}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded text-sm font-medium">
                                {PLANOS.find(p => p.value === empresa.plano)?.label || empresa.plano}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                <span className={`font-medium ${usoClass}`}>{empresa.colaboradores_cadastrados || 0}</span>
                                <span className="text-slate-400">/ {empresa.limite_colaboradores}</span>
                                <span className={`text-xs ${usoClass}`}>({uso.toFixed(0)}%)</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {empresa.status === 'ativo' ? (
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-sm font-medium">
                                  Ativo
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-medium">
                                  Bloqueado
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleViewRelatorio(empresa)}
                                  title="Ver relatório"
                                >
                                  <BarChart3 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleOpenPlanoDialog(empresa)}
                                  title="Gerenciar plano"
                                >
                                  <TrendingUp className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEdit(empresa)}
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    setSelectedEmpresa(empresa);
                                    setShowAdminDialog(true);
                                  }}
                                  title="Criar admin"
                                >
                                  <UserPlus className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleExportPDF(empresa)}
                                  title="Exportar PDF"
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleBloquear(empresa)}
                                  className={empresa.status === 'ativo' ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'}
                                  title={empresa.status === 'ativo' ? 'Bloquear' : 'Ativar'}
                                >
                                  {empresa.status === 'ativo' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Alertas */}
          <TabsContent value="alertas" className="mt-4">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Alertas de Limite de Plano
              </h3>
              
              {alertasLimite.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
                  Nenhuma empresa próxima do limite
                </div>
              ) : (
                <div className="space-y-3">
                  {alertasLimite.map((alerta) => (
                    <div 
                      key={alerta.empresa_id}
                      className={`p-4 rounded-lg border ${
                        alerta.nivel_alerta === 'blocked' ? 'bg-red-50 border-red-200' :
                        alerta.nivel_alerta === 'critical' ? 'bg-amber-50 border-amber-200' :
                        'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{alerta.empresa_nome}</p>
                          <p className={`text-sm ${
                            alerta.nivel_alerta === 'blocked' ? 'text-red-600' :
                            alerta.nivel_alerta === 'critical' ? 'text-amber-600' :
                            'text-yellow-600'
                          }`}>
                            {alerta.mensagem}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{alerta.uso_percentual}%</p>
                          <p className="text-sm text-slate-500">{alerta.colaboradores_atual}/{alerta.limite}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              alerta.nivel_alerta === 'blocked' ? 'bg-red-500' :
                              alerta.nivel_alerta === 'critical' ? 'bg-amber-500' :
                              'bg-yellow-500'
                            }`}
                            style={{ width: `${Math.min(alerta.uso_percentual, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const emp = empresas.find(e => e.id === alerta.empresa_id);
                            if (emp) handleOpenPlanoDialog(emp);
                          }}
                        >
                          Upgrade de Plano
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Backup */}
          <TabsContent value="backup" className="mt-4">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Database className="w-5 h-5 text-violet-600" />
                  Backups do Sistema
                </h3>
                <Button onClick={handleCreateBackup} className="gap-2 bg-violet-600 hover:bg-violet-700">
                  <HardDrive className="w-4 h-4" />
                  Criar Backup
                </Button>
              </div>
              
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Política de retenção:</strong> Backups são mantidos por 7 dias automaticamente.
                  Recomendamos criar backups antes de grandes alterações.
                </p>
              </div>
              
              {backups.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Database className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  Nenhum backup encontrado
                </div>
              ) : (
                <div className="space-y-3">
                  {backups.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <HardDrive className="w-8 h-8 text-violet-500" />
                        <div>
                          <p className="font-medium text-slate-900">{backup.nome_arquivo}</p>
                          <p className="text-sm text-slate-500">
                            {backup.tamanho_formatado} • {new Date(backup.criado_em).toLocaleString('pt-BR')}
                          </p>
                          <p className="text-xs text-slate-400">
                            Por: {backup.criado_por} • {backup.colecoes_incluidas?.length || 0} coleções
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadBackup(backup)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteBackup(backup)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Relatórios */}
          <TabsContent value="relatorios" className="mt-4">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-600" />
                Relatórios por Empresa
              </h3>
              
              <p className="text-slate-600 mb-4">
                Selecione uma empresa na aba "Empresas" e clique no ícone de gráfico para ver o relatório detalhado.
              </p>
              
              {dashboardMaster && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(dashboardMaster.empresas_por_plano || {}).map(([plano, count]) => (
                    <div key={plano} className="bg-slate-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-violet-600">{count}</p>
                      <p className="text-sm text-slate-600">
                        {PLANOS.find(p => p.value === plano)?.label || `Plano ${plano}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog Criar/Editar Empresa */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEmpresa ? 'Editar Empresa' : 'Nova Empresa'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Empresa *</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    placeholder="Nome da empresa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CNPJ *</label>
                  <input
                    type="text"
                    required
                    value={formData.cnpj}
                    onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Plano</label>
                  <select
                    value={formData.plano}
                    onChange={(e) => {
                      const plano = e.target.value;
                      const limites = { '50': 50, '150': 150, '250': 250, '350': 350, 'unlimited': 999999 };
                      setFormData({...formData, plano, limite_colaboradores: limites[plano] || 50});
                    }}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {PLANOS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Limite Colaboradores</label>
                  <input
                    type="number"
                    value={formData.limite_colaboradores}
                    onChange={(e) => setFormData({...formData, limite_colaboradores: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Responsável</label>
                  <input
                    type="text"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    placeholder="Nome do responsável"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="bloqueado">Bloqueado</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Endereço</label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    placeholder="Endereço completo"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
                  {editingEmpresa ? 'Salvar' : 'Criar Empresa'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Criar Admin */}
        <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Criar Administrador - {selectedEmpresa?.nome}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Usuário *</label>
                <input
                  type="text"
                  required
                  value={adminForm.username}
                  onChange={(e) => setAdminForm({...adminForm, username: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="nome.usuario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="admin@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Senha *</label>
                <input
                  type="password"
                  required
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="Mínimo 8 caracteres, maiúscula, número e especial"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Requisitos: 8+ caracteres, maiúscula, minúscula, número, especial (!@#$%...)
                </p>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAdminDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
                  Criar Administrador
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Relatório */}
        <Dialog open={showRelatorioDialog} onOpenChange={setShowRelatorioDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-600" />
                Relatório - {selectedEmpresa?.nome}
              </DialogTitle>
            </DialogHeader>
            
            {relatorioData && (
              <div className="space-y-6">
                {/* Uso do Plano */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Uso do Plano</span>
                    <span className="text-2xl font-bold text-violet-600">{relatorioData.uso_percentual}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        relatorioData.uso_percentual >= 90 ? 'bg-red-500' :
                        relatorioData.uso_percentual >= 80 ? 'bg-amber-500' :
                        'bg-violet-500'
                      }`}
                      style={{ width: `${Math.min(relatorioData.uso_percentual, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {relatorioData.total_colaboradores} de {relatorioData.limite_colaboradores} colaboradores
                  </p>
                </div>
                
                {/* Métricas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-emerald-600">{relatorioData.colaboradores_ativos}</p>
                    <p className="text-sm text-slate-600">Colaboradores Ativos</p>
                  </div>
                  <div className="bg-white border p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{relatorioData.total_epis}</p>
                    <p className="text-sm text-slate-600">EPIs Cadastrados</p>
                  </div>
                  <div className="bg-white border p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-violet-600">{relatorioData.entregas_periodo}</p>
                    <p className="text-sm text-slate-600">Entregas ({relatorioData.periodo_dias}d)</p>
                  </div>
                  <div className="bg-white border p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-amber-600">{relatorioData.epis_estoque_baixo}</p>
                    <p className="text-sm text-slate-600">EPIs Estoque Baixo</p>
                  </div>
                </div>
                
                {/* Top EPIs */}
                {relatorioData.top_epis_entregues?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Top EPIs Mais Entregues</h4>
                    <div className="space-y-2">
                      {relatorioData.top_epis_entregues.map((epi, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                          <span>{epi.nome}</span>
                          <span className="font-bold">{epi.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Botões de Exportação */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={() => handleExportPDF(selectedEmpresa)} className="gap-2">
                    <FileText className="w-4 h-4" />
                    Exportar PDF
                  </Button>
                  <Button onClick={() => handleExportExcel(selectedEmpresa)} variant="outline" className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Exportar Excel
                  </Button>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRelatorioDialog(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Gerenciar Plano */}
        <Dialog open={showPlanoDialog} onOpenChange={setShowPlanoDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                Gerenciar Plano - {selectedEmpresa?.nome}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleUpdatePlano} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plano</label>
                  <select
                    value={planoForm.plano}
                    onChange={(e) => {
                      const plano = e.target.value;
                      const limites = { '50': 50, '150': 150, '250': 250, '350': 350, 'unlimited': 999999 };
                      setPlanoForm({...planoForm, plano, limite: limites[plano] || 50});
                    }}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {PLANOS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Limite Personalizado</label>
                  <input
                    type="number"
                    value={planoForm.limite}
                    onChange={(e) => setPlanoForm({...planoForm, limite: parseInt(e.target.value)})}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data Início</label>
                  <input
                    type="date"
                    value={planoForm.data_inicio}
                    onChange={(e) => setPlanoForm({...planoForm, data_inicio: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data Fim (Vigência)</label>
                  <input
                    type="date"
                    value={planoForm.data_fim}
                    onChange={(e) => setPlanoForm({...planoForm, data_fim: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Motivo da Alteração</label>
                  <input
                    type="text"
                    value={planoForm.motivo}
                    onChange={(e) => setPlanoForm({...planoForm, motivo: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    placeholder="Ex: Upgrade solicitado pelo cliente"
                  />
                </div>
              </div>
              
              {/* Histórico de Planos */}
              {historicoPlanos.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Histórico de Alterações
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {historicoPlanos.map((h) => (
                      <div key={h.id} className="text-sm bg-slate-50 p-2 rounded">
                        <div className="flex justify-between">
                          <span>{h.plano_anterior} → <strong>{h.plano_novo}</strong></span>
                          <span className="text-slate-500">
                            {new Date(h.alterado_em).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {h.motivo && <p className="text-slate-500 text-xs">{h.motivo}</p>}
                        <p className="text-xs text-slate-400">Por: {h.alterado_por}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowPlanoDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
                  Atualizar Plano
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
