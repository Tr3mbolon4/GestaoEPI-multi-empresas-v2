import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const { must_change_password } = await login(username, password);
      
      if (must_change_password) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      
      let message = 'Erro ao fazer login. Tente novamente.';
      
      if (error.response?.status === 403) {
        message = 'Licença expirada. Contate o administrador.';
      } else if (error.response?.status === 401) {
        message = 'E-mail/usuário ou senha incorretos. Verifique suas credenciais.';
      } else if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
        message = 'Erro de conexão com o servidor. Verifique sua internet.';
      } else if (error.message) {
        message = error.message;
      }
      
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div 
        className="hidden lg:block lg:w-1/2 bg-cover bg-center relative"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1764154739233-659b2681d162?crop=entropy&cs=srgb&fm=jpg&q=85)` }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(26,26,26,0.97) 0%, rgba(45,58,79,0.95) 100%)' }}></div>
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white max-w-md">
            <div className="w-24 h-24 mb-6 rounded-xl overflow-hidden shadow-2xl">
              <img 
                src="/logo-gestao-epi.jpg" 
                alt="Gestão EPI Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-4xl font-bold mb-2 tracking-tight" style={{ color: '#e0e0e0' }}>GESTÃO EPI</h1>
            <p className="text-xl" style={{ color: '#6b9bd1' }}>Sistema Multi-Empresa</p>
            <p className="mt-4" style={{ color: '#9ca3af' }}>Controle completo de equipamentos de proteção individual com rastreamento e reconhecimento facial.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: '#f3f4f6' }}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-8" style={{ border: '1px solid #d1d5db' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-lg overflow-hidden shadow-md">
                <img 
                  src="/logo-gestao-epi.jpg" 
                  alt="Gestão EPI Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#1a1a1a' }}>Entrar</h2>
                <p className="text-sm" style={{ color: '#6b7280' }}>Gestão EPI</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Mensagem de erro visível */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg" data-testid="login-error">
                  <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
                </div>
              )}
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                  E-mail ou Usuário
                </label>
                <input
                  id="username"
                  type="text"
                  data-testid="login-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex h-10 w-full rounded-md bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ border: '1px solid #d1d5db' }}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #2d3a4f40'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                  placeholder="Digite seu e-mail ou usuário"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  data-testid="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-10 w-full rounded-md bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ border: '1px solid #d1d5db' }}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #2d3a4f40'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                  placeholder="Digite sua senha"
                  required
                />
              </div>

              <button
                type="submit"
                data-testid="login-submit"
                disabled={loading}
                className="w-full text-white font-medium shadow-sm rounded-md px-4 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: '#2d3a4f' }}
                onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#3d4a5f')}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2d3a4f'}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button 
                type="button"
                onClick={() => toast.info('Contate o administrador para redefinir sua senha.')}
                className="text-sm hover:underline"
                style={{ color: '#2d3a4f' }}
              >
                Esqueci minha senha
              </button>
            </div>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: '#6b7280' }}>
            Gestão EPI © 2026 - Sistema Multi-Empresa
          </p>
        </div>
      </div>
    </div>
  );
}
