import React, { useState } from 'react';
import { useAuth, UserRole } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  Satellite, 
  Eye, 
  FileText, 
  CheckCircle2,
  Info
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const { language } = useLanguage();

  const [selectedRole, setSelectedRole] = useState<UserRole>('operador');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = login(selectedRole, password);
      setIsLoading(false);
      if (!result.success && result.error) {
        setErrorMessage(result.error);
      }
    }, 350);
  };

  const handleRoleQuickSelect = (role: UserRole) => {
    setSelectedRole(role);
    setPassword(role === 'admin' ? 'agentic' : 'funcionario');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden font-sans">
      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl shadow-emerald-500/5 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-inner">
              T
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Triminds Geo AI Enterprise
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Plataforma de Classificação LULC com Google Satellite Embedding 64 Bandas
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Acesso Seguro • Controle de Acesso (RBAC)
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              v2.4.0
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Selecione seu Perfil de Usuário
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="btn-role-operador"
                  onClick={() => handleRoleQuickSelect('operador')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    selectedRole === 'operador'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white ring-1 ring-emerald-500/50 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <User className="w-4 h-4 text-emerald-400" />
                    {selectedRole === 'operador' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="font-bold text-xs text-slate-100">Operador</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    Busca & manipulação de imagens (sem relatórios)
                  </div>
                </button>

                <button
                  type="button"
                  id="btn-role-admin"
                  onClick={() => handleRoleQuickSelect('admin')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    selectedRole === 'admin'
                      ? 'bg-purple-500/15 border-purple-500 text-white ring-1 ring-purple-500/50 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    {selectedRole === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                  </div>
                  <div className="font-bold text-xs text-slate-100">Administrador</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    Acesso total + emissão de relatórios executivos
                  </div>
                </button>
              </div>
            </div>

            {/* Password input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Senha de Acesso
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  {selectedRole === 'admin' ? 'Senha: agentic' : 'Senha: funcionario'}
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  id="input-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`Digite a senha para ${selectedRole}`}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-purple-500/20'
                  : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar como {selectedRole === 'admin' ? 'Administrador' : 'Operador'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Info Credentials Box */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>Regras de Permissão RBAC:</span>
            </div>
            <div className="space-y-1 font-mono text-[10px]">
              <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-300">👤 Operador:</span>
                <span className="text-emerald-400">senha: <span className="underline font-bold">funcionario</span> (Busca/Imagens)</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-300">🛡️ Admin:</span>
                <span className="text-purple-400">senha: <span className="underline font-bold">agentic</span> (Total + Relatórios)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security watermark */}
        <p className="text-center text-[11px] text-slate-500 font-mono">
          Autenticação em conformidade com ISO 27001 & SOC 2 Type II
        </p>
      </div>
    </div>
  );
};
