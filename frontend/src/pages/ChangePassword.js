import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const { changePassword } = useAuth();
  const navigate = useNavigate();

  // Validar senhas em tempo real
  useEffect(() => {
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
    } else if (newPassword && newPassword.length < 8) {
      setPasswordError('A senha deve ter no mínimo 8 caracteres');
    } else if (newPassword && !/[A-Z]/.test(newPassword)) {
      setPasswordError('A senha deve conter pelo menos uma letra maiúscula');
    } else if (newPassword && !/[a-z]/.test(newPassword)) {
      setPasswordError('A senha deve conter pelo menos uma letra minúscula');
    } else if (newPassword && !/\d/.test(newPassword)) {
      setPasswordError('A senha deve conter pelo menos um número');
    } else if (newPassword && !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setPasswordError('A senha deve conter pelo menos um caractere especial (!@#$%^&*)');
    } else {
      setPasswordError('');
    }
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      await changePassword(oldPassword, newPassword);
      toast.success('Senha alterada com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error(error.response?.data?.detail || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = confirmPassword && newPassword === confirmPassword;
  const canSubmit = !passwordError && oldPassword && newPassword && confirmPassword && passwordsMatch;

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: '#f3f4f6' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm p-8" style={{ border: '1px solid #e5e7eb' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-md flex items-center justify-center" style={{ backgroundColor: '#2d3a4f' }}>
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#1a1a1a' }}>Alterar Senha</h2>
          </div>
          <p className="text-sm mb-6" style={{ color: '#6b7280' }}>Por segurança, altere sua senha no primeiro acesso.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Senha Atual
              </label>
              <input
                type="password"
                data-testid="old-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="flex h-10 w-full rounded-md bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ border: '1px solid #d1d5db' }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #2d3a4f40'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Nova Senha
              </label>
              <input
                type="password"
                data-testid="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex h-10 w-full rounded-md bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ border: '1px solid #d1d5db' }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #2d3a4f40'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                data-testid="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="flex h-10 w-full rounded-md bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ 
                  border: confirmPassword && !passwordsMatch 
                    ? '1px solid #ef4444' 
                    : passwordsMatch 
                      ? '1px solid #2d3a4f' 
                      : '1px solid #d1d5db'
                }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #2d3a4f40'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
                required
                minLength={8}
              />
              {/* Indicador visual de erro/sucesso - SEMPRE visível quando há conteúdo */}
              {confirmPassword && (
                <div className="flex items-center gap-1 mt-1.5 text-sm font-medium" style={{ color: passwordsMatch ? '#2d3a4f' : '#ef4444' }}>
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Senhas coincidem</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>As senhas não coincidem!</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mensagem de erro de requisitos da senha */}
            {passwordError && passwordError !== 'As senhas não coincidem' && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <button
              type="submit"
              data-testid="change-password-submit"
              disabled={loading || !canSubmit}
              className="w-full text-white font-medium shadow-sm rounded-md px-4 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: '#2d3a4f' }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#3d4a5f')}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2d3a4f'}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                'Alterar Senha'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
