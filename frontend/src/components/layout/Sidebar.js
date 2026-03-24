import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Building2, 
  HardHat, 
  Box, 
  UserCog, 
  Settings,
  LogOut,
  Truck,
  X,
  History,
  Bell,
  Crown,
  Shield,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // Perfis: super_admin, admin, gestor, rh, seguranca_trabalho, almoxarifado
  const menuItems = [
    // SUPER_ADMIN: Painel Master (primeiro item para destaque)
    { 
      path: '/painel-master', 
      icon: Crown, 
      label: 'Painel Master', 
      roles: ['super_admin'],
      highlight: true,
      masterOnly: true
    },
    { 
      path: '/dashboard', 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      roles: ['super_admin', 'admin', 'gestor', 'rh', 'seguranca_trabalho', 'almoxarifado'] 
    },
    { 
      path: '/alertas', 
      icon: Bell, 
      label: 'Alertas', 
      roles: ['super_admin', 'admin', 'gestor', 'rh', 'seguranca_trabalho', 'almoxarifado'],
      highlight: true
    },
    { 
      path: '/entrega-epi', 
      icon: HardHat, 
      label: 'Entrega de EPI', 
      roles: ['super_admin', 'admin', 'gestor', 'almoxarifado'] 
    },
    { 
      path: '/historico-entregas', 
      icon: History, 
      label: 'Histórico Entregas', 
      roles: ['super_admin', 'admin', 'gestor', 'seguranca_trabalho', 'almoxarifado'] 
    },
    { 
      path: '/colaboradores', 
      icon: Users, 
      label: 'Colaboradores', 
      roles: ['super_admin', 'admin', 'gestor', 'rh', 'seguranca_trabalho', 'almoxarifado'] 
    },
    { 
      path: '/empresas', 
      icon: Building2, 
      label: 'Empresas', 
      roles: ['super_admin', 'admin', 'gestor', 'rh'] 
    },
    { 
      path: '/epis', 
      icon: Package, 
      label: 'Cadastro EPI', 
      roles: ['super_admin', 'admin', 'gestor', 'seguranca_trabalho'] 
    },
    { 
      path: '/fornecedores', 
      icon: Truck, 
      label: 'Fornecedores', 
      roles: ['super_admin', 'admin', 'gestor', 'seguranca_trabalho'] 
    },
    { 
      path: '/kits', 
      icon: Box, 
      label: 'Kits', 
      roles: ['super_admin', 'admin', 'gestor', 'seguranca_trabalho'] 
    },
    { 
      path: '/relatorios', 
      icon: BarChart3, 
      label: 'Relatórios', 
      roles: ['super_admin', 'admin', 'gestor', 'seguranca_trabalho'] 
    },
    { 
      path: '/lgpd', 
      icon: Shield, 
      label: 'LGPD', 
      roles: ['super_admin', 'admin', 'seguranca_trabalho'] 
    },
    { 
      path: '/usuarios', 
      icon: UserCog, 
      label: 'Usuários', 
      roles: ['super_admin', 'admin', 'rh'] 
    },
    { 
      path: '/configuracoes', 
      icon: Settings, 
      label: 'Configurações', 
      roles: ['super_admin', 'admin'] 
    },
  ];

  const filteredMenu = menuItems.filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );

  const getProfileLabel = (role) => {
    const labels = {
      'admin': 'Administrador',
      'gestor': 'Gestor',
      'rh': 'RH',
      'seguranca_trabalho': 'Seg. Trabalho',
      'almoxarifado': 'Almoxarifado'
    };
    return labels[role] || role;
  };

  return (
    <div className="w-64 min-h-screen flex flex-col" style={{ backgroundColor: '#1a1a1a' }} data-testid="sidebar">
      <div className="p-5 border-b" style={{ borderColor: '#2d3a4f' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 shadow-lg" style={{ border: '1px solid #2d3a4f' }}>
              <img 
                src="/logo-gestao-epi.jpg" 
                alt="Gestão EPI Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight" style={{ color: '#e0e0e0' }}>Gestão EPI</h1>
              <p className="text-xs" style={{ color: '#6b7280' }}>Sistema Multi-Empresa</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{ color: '#9ca3af' }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#2d3a4f'; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          // Cores do tema GE
          const activeStyle = item.masterOnly 
            ? { backgroundColor: '#4c1d95', color: '#fff' }
            : { backgroundColor: '#2d3a4f', color: '#fff' };
          
          const inactiveStyle = item.masterOnly
            ? { color: '#a78bfa' }
            : item.highlight 
              ? { color: '#fbbf24' }
              : { color: '#c0c0c0' };
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              data-testid={`nav-${item.path.replace('/', '')}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all"
              style={isActive ? activeStyle : inactiveStyle}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#2d3a4f40';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = inactiveStyle.color;
                }
              }}
            >
              <Icon className="w-5 h-5" style={!isActive && item.masterOnly ? { color: '#a78bfa' } : !isActive && item.highlight ? { color: '#fbbf24' } : {}} />
              {item.label}
              {item.masterOnly && !isActive && (
                <span className="ml-auto px-1.5 py-0.5 text-[10px] rounded" style={{ backgroundColor: '#7c3aed', color: '#fff' }}>MASTER</span>
              )}
              {item.highlight && !item.masterOnly && !isActive && (
                <span className="ml-auto w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#fbbf24' }}></span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4" style={{ borderTop: '1px solid #2d3a4f' }}>
        <div className="flex items-center gap-3 mb-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm" style={{ backgroundColor: '#2d3a4f' }}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: '#e0e0e0' }}>{user?.username}</p>
            <p className="text-xs truncate" style={{ color: '#6b9bd1' }}>{getProfileLabel(user?.role)}</p>
          </div>
        </div>
        <button
          onClick={logout}
          data-testid="logout-button"
          className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all"
          style={{ color: '#c0c0c0' }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#2d3a4f'; e.currentTarget.style.color = '#fff'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#c0c0c0'; }}
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </div>
  );
};
