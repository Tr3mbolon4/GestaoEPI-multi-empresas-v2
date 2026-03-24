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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 to-blue-900/90"></div>
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white max-w-md">
            <div className="w-20 h-20 mb-6 rounded-xl bg-slate-800 border border-slate-600 p-3 flex items-center justify-center shadow-2xl">
              <span className="text-3xl font-bold">
                <span className="text-slate-300">G</span>
                <span className="text-blue-400">E</span>
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-2 tracking-tight">GESTÃO EPI</h1>
            <p className="text-xl text-blue-200">Sistema Multi-Empresa</p>
            <p className="mt-4 text-slate-300">Controle completo de equipamentos de proteção individual com rastreamento e reconhecimento facial.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-slate-100">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center">
                <span className="text-lg font-bold">
                  <span className="text-slate-300">G</span>
                  <span className="text-blue-400">E</span>
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Entrar</h2>
                <p className="text-sm text-slate-600">Gestão EPI</p>
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
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                  E-mail ou Usuário
                </label>
                <input
                  id="username"
                  type="text"
                  data-testid="login-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Digite seu e-mail ou usuário"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  data-testid="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Digite sua senha"
                  required
                />
              </div>

              <button
                type="submit"
                data-testid="login-submit"
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium shadow-sm rounded-md px-4 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                className="text-sm text-blue-600 hover:underline"
              >
                Esqueci minha senha
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Gestão EPI © 2026 - Sistema Multi-Empresa
          </p>
        </div>
      </div>
    </div>
  );
}
