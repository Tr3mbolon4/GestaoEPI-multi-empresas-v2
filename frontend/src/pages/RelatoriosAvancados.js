import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  BarChart3, TrendingUp, Package, AlertTriangle, Calendar, RefreshCw,
  ArrowUp, ArrowDown, Clock, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { getAuthHeader } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function RelatoriosAvancados() {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState(30);
  
  // Dados
  const [entregasPeriodo, setEntregasPeriodo] = useState(null);
  const [consumoEpis, setConsumoEpis] = useState(null);
  const [estoqueCritico, setEstoqueCritico] = useState(null);
  const [vencimentos, setVencimentos] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, [periodo]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEntregasPeriodo(),
        fetchConsumoEpis(),
        fetchEstoqueCritico(),
        fetchVencimentos()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntregasPeriodo = async () => {
    try {
      const response = await axios.get(`${API}/relatorios/entregas-por-periodo?periodo=${periodo}`, { headers: getAuthHeader() });
      setEntregasPeriodo(response.data);
    } catch (error) {
      console.error('Erro ao buscar entregas:', error);
    }
  };

  const fetchConsumoEpis = async () => {
    try {
      const response = await axios.get(`${API}/relatorios/consumo-epis?periodo=${periodo}`, { headers: getAuthHeader() });
      setConsumoEpis(response.data);
    } catch (error) {
      console.error('Erro ao buscar consumo:', error);
    }
  };

  const fetchEstoqueCritico = async () => {
    try {
      const response = await axios.get(`${API}/relatorios/estoque-critico`, { headers: getAuthHeader() });
      setEstoqueCritico(response.data);
    } catch (error) {
      console.error('Erro ao buscar estoque crítico:', error);
    }
  };

  const fetchVencimentos = async () => {
    try {
      const response = await axios.get(`${API}/relatorios/vencimentos?dias=${periodo}`, { headers: getAuthHeader() });
      setVencimentos(response.data);
    } catch (error) {
      console.error('Erro ao buscar vencimentos:', error);
    }
  };

  const getMaxValue = (data, key) => {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map(d => d[key] || 0));
  };

  const getNivelColor = (nivel) => {
    const colors = {
      'zerado': 'bg-red-500',
      'critico': 'bg-red-400',
      'baixo': 'bg-amber-400',
      'atencao': 'bg-yellow-400'
    };
    return colors[nivel] || 'bg-slate-400';
  };

  const getStatusColor = (status) => {
    const colors = {
      'vencido': 'text-red-600 bg-red-100',
      'critico': 'text-red-600 bg-red-100',
      'urgente': 'text-amber-600 bg-amber-100',
      'atencao': 'text-yellow-600 bg-yellow-100'
    };
    return colors[status] || 'text-slate-600 bg-slate-100';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-violet-600" />
              Relatórios Avançados
            </h1>
            <p className="text-slate-600 mt-1">Análises e tendências de uso de EPIs</p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={periodo}
              onChange={(e) => setPeriodo(parseInt(e.target.value))}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value={7}>Últimos 7 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={60}>Últimos 60 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
            <Button onClick={fetchAllData} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
          </div>
        ) : (
          <Tabs defaultValue="entregas" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="entregas" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Entregas
              </TabsTrigger>
              <TabsTrigger value="consumo" className="gap-2">
                <Package className="w-4 h-4" />
                Consumo EPIs
              </TabsTrigger>
              <TabsTrigger value="estoque" className="gap-2">
                <AlertTriangle className="w-4 h-4" />
                Estoque Crítico
              </TabsTrigger>
              <TabsTrigger value="vencimentos" className="gap-2">
                <Calendar className="w-4 h-4" />
                Vencimentos
              </TabsTrigger>
            </TabsList>

            {/* Tab: Entregas por Período */}
            <TabsContent value="entregas" className="mt-4 space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Entregas nos Últimos {periodo} Dias</h3>
                
                {entregasPeriodo?.dados?.length > 0 ? (
                  <div className="space-y-2">
                    {entregasPeriodo.dados.map((item, index) => {
                      const maxEntregas = getMaxValue(entregasPeriodo.dados, 'entregas');
                      const percentual = (item.entregas / maxEntregas) * 100;
                      
                      return (
                        <div key={index} className="flex items-center gap-4">
                          <span className="w-24 text-sm text-slate-600 font-mono">
                            {item.periodo.split('-').reverse().slice(0, 2).join('/')}
                          </span>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                              <div 
                                className="h-full bg-violet-500 rounded-full flex items-center justify-end px-2"
                                style={{ width: `${Math.max(percentual, 5)}%` }}
                              >
                                <span className="text-xs text-white font-medium">{item.entregas}</span>
                              </div>
                            </div>
                            {item.devolucoes > 0 && (
                              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                                {item.devolucoes} dev.
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">Nenhuma entrega no período</p>
                )}

                {/* Resumo */}
                {entregasPeriodo?.dados?.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-violet-600">
                        {entregasPeriodo.dados.reduce((acc, d) => acc + d.entregas, 0)}
                      </p>
                      <p className="text-sm text-slate-600">Total de Entregas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {entregasPeriodo.dados.reduce((acc, d) => acc + d.itens, 0)}
                      </p>
                      <p className="text-sm text-slate-600">Total de Itens</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-600">
                        {entregasPeriodo.dados.reduce((acc, d) => acc + d.devolucoes, 0)}
                      </p>
                      <p className="text-sm text-slate-600">Devoluções</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab: Consumo de EPIs */}
            <TabsContent value="consumo" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top EPIs */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Top 10 EPIs Mais Consumidos</h3>
                  
                  {consumoEpis?.top_epis?.length > 0 ? (
                    <div className="space-y-3">
                      {consumoEpis.top_epis.map((epi, index) => {
                        const maxQtd = getMaxValue(consumoEpis.top_epis, 'quantidade');
                        const percentual = (epi.quantidade / maxQtd) * 100;
                        
                        return (
                          <div key={index}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-700 truncate flex-1 pr-2">{epi.epi_name}</span>
                              <span className="font-medium text-violet-600">{epi.quantidade} un.</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div 
                                className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full"
                                style={{ width: `${percentual}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 py-8">Nenhum consumo no período</p>
                  )}
                </div>

                {/* Consumo por Departamento */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Consumo por Departamento</h3>
                  
                  {consumoEpis?.consumo_por_departamento?.length > 0 ? (
                    <div className="space-y-3">
                      {consumoEpis.consumo_por_departamento.map((dept, index) => {
                        const maxItens = getMaxValue(consumoEpis.consumo_por_departamento, 'itens');
                        const percentual = (dept.itens / maxItens) * 100;
                        
                        return (
                          <div key={index}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-700">{dept.departamento}</span>
                              <span className="font-medium">
                                <span className="text-emerald-600">{dept.entregas}</span> entregas • 
                                <span className="text-violet-600 ml-1">{dept.itens}</span> itens
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                                style={{ width: `${percentual}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 py-8">Nenhum dado de departamento</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab: Estoque Crítico */}
            <TabsContent value="estoque" className="mt-4 space-y-4">
              {/* Cards de resumo */}
              {estoqueCritico && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-red-600">{estoqueCritico.zerados}</p>
                    <p className="text-sm text-red-700">Zerados</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-red-500">{estoqueCritico.criticos}</p>
                    <p className="text-sm text-red-600">Críticos (≤25%)</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-amber-600">{estoqueCritico.baixos}</p>
                    <p className="text-sm text-amber-700">Baixos (≤50%)</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-slate-600">{estoqueCritico.total_criticos}</p>
                    <p className="text-sm text-slate-700">Total Alertas</p>
                  </div>
                </div>
              )}

              {/* Lista de EPIs */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900">EPIs com Estoque Crítico</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">EPI</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">CA</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Estoque</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Mínimo</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {estoqueCritico?.epis?.length > 0 ? (
                        estoqueCritico.epis.map((epi) => (
                          <tr key={epi.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-900">{epi.nome}</td>
                            <td className="px-4 py-3 text-slate-600 font-mono text-sm">{epi.ca_number || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`font-bold ${epi.estoque_atual === 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                {epi.estoque_atual}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{epi.estoque_minimo}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${getNivelColor(epi.nivel_criticidade)}`}></div>
                                <span className="text-sm capitalize">{epi.nivel_criticidade}</span>
                                <span className="text-xs text-slate-500">({epi.percentual_estoque}%)</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                            <AlertCircle className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                            Nenhum EPI com estoque crítico
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Vencimentos */}
            <TabsContent value="vencimentos" className="mt-4 space-y-4">
              {/* Cards de resumo */}
              {vencimentos && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-red-600">{vencimentos.vencidos}</p>
                    <p className="text-sm text-red-700">Vencidos</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-red-500">{vencimentos.criticos}</p>
                    <p className="text-sm text-red-600">Críticos (≤7 dias)</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-amber-600">{vencimentos.urgentes}</p>
                    <p className="text-sm text-amber-700">Urgentes (≤30 dias)</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-slate-600">{vencimentos.total}</p>
                    <p className="text-sm text-slate-700">Total Alertas</p>
                  </div>
                </div>
              )}

              {/* Lista de EPIs */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900">EPIs Próximos do Vencimento</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">EPI</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">CA</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Vencimento</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {vencimentos?.epis?.length > 0 ? (
                        vencimentos.epis.map((epi) => (
                          <tr key={epi.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-900">{epi.nome}</td>
                            <td className="px-4 py-3 text-slate-600 font-mono text-sm">{epi.ca_number || '-'}</td>
                            <td className="px-4 py-3 text-slate-600">
                              {new Date(epi.data_vencimento).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-sm capitalize">{epi.tipo_validade}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(epi.status)}`}>
                                {epi.dias_restantes < 0 
                                  ? `Vencido há ${Math.abs(epi.dias_restantes)} dias`
                                  : epi.dias_restantes === 0
                                    ? 'Vence hoje'
                                    : `${epi.dias_restantes} dias`}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                            <Clock className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                            Nenhum EPI próximo do vencimento
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
