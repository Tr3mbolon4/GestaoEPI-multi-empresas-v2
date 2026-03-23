import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Building2, Plus, Edit, Ban, CheckCircle, Users, Package, RefreshCw, Eye, UserPlus } from 'lucide-react';
import axios from 'axios';
import { getAuthHeader, useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
  const [showDialog, setShowDialog] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [empresaStats, setEmpresaStats] = useState(null);
  
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

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchEmpresas();
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
            <p className="text-slate-600 mt-1">Gerenciamento de empresas do sistema</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchEmpresas} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
            <Button onClick={() => { resetForm(); setShowDialog(true); }} className="gap-2 bg-violet-600 hover:bg-violet-700">
              <Plus className="w-4 h-4" />
              Nova Empresa
            </Button>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <p className="text-sm text-slate-600">Total de Empresas</p>
            <p className="text-3xl font-bold text-violet-600">{empresas.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <p className="text-sm text-slate-600">Empresas Ativas</p>
            <p className="text-3xl font-bold text-emerald-600">
              {empresas.filter(e => e.status === 'ativo').length}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <p className="text-sm text-slate-600">Empresas Bloqueadas</p>
            <p className="text-3xl font-bold text-red-600">
              {empresas.filter(e => e.status === 'bloqueado').length}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <p className="text-sm text-slate-600">Total Colaboradores</p>
            <p className="text-3xl font-bold text-slate-900">
              {empresas.reduce((acc, e) => acc + (e.colaboradores_cadastrados || 0), 0)}
            </p>
          </div>
        </div>

        {/* Lista de Empresas */}
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
                  empresas.map((empresa) => (
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
                          <span className="font-medium">{empresa.colaboradores_cadastrados || 0}</span>
                          <span className="text-slate-400">/ {empresa.limite_colaboradores}</span>
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
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleViewStats(empresa)}
                            title="Ver estatísticas"
                          >
                            <Eye className="w-4 h-4" />
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
                            onClick={() => handleBloquear(empresa)}
                            className={empresa.status === 'ativo' ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'}
                            title={empresa.status === 'ativo' ? 'Bloquear' : 'Ativar'}
                          >
                            {empresa.status === 'ativo' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

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

        {/* Dialog Estatísticas */}
        <Dialog open={!!empresaStats} onOpenChange={() => setEmpresaStats(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Estatísticas - {empresaStats?.empresa_nome}
              </DialogTitle>
            </DialogHeader>
            
            {empresaStats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Colaboradores</p>
                  <p className="text-2xl font-bold">{empresaStats.colaboradores}</p>
                  <p className="text-xs text-slate-500">de {empresaStats.limite_colaboradores}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Uso do Plano</p>
                  <p className="text-2xl font-bold">{empresaStats.uso_percentual}%</p>
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-violet-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(empresaStats.uso_percentual, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Usuários</p>
                  <p className="text-2xl font-bold">{empresaStats.usuarios}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">EPIs</p>
                  <p className="text-2xl font-bold">{empresaStats.epis}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Kits</p>
                  <p className="text-2xl font-bold">{empresaStats.kits}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Entregas</p>
                  <p className="text-2xl font-bold">{empresaStats.entregas}</p>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEmpresaStats(null)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
