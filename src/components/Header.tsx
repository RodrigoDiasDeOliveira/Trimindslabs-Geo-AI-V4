import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../auth/AuthContext';
import { Language } from '../types';
import { 
  Satellite, 
  Map, 
  Clock, 
  Cpu, 
  Activity, 
  Terminal, 
  Globe, 
  Layers, 
  Zap,
  ShieldCheck,
  FileText,
  LogOut,
  User,
  Lock,
  MapPin
} from 'lucide-react';

export type NavTab = 'studio' | 'areaAnalysis' | 'explorer' | 'timeseries' | 'models' | 'drift' | 'api' | 'audit' | 'reports';

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, isAdmin, isOperador } = useAuth();

  const allNavItems: { id: NavTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'studio', label: t.nav.studio, icon: <Satellite className="w-4 h-4" /> },
    { id: 'areaAnalysis', label: (t.nav as any).areaAnalysis || 'Escolher no Mapa & Analisar', icon: <MapPin className="w-4 h-4 text-emerald-400" /> },
    { id: 'explorer', label: t.nav.explorer, icon: <Map className="w-4 h-4" /> },
    { id: 'timeseries', label: t.nav.timeseries, icon: <Clock className="w-4 h-4" /> },
    { id: 'models', label: t.nav.models, icon: <Cpu className="w-4 h-4" /> },
    { id: 'drift', label: t.nav.drift, icon: <Activity className="w-4 h-4" /> },
    { id: 'api', label: t.nav.api, icon: <Terminal className="w-4 h-4" /> },
    { id: 'audit', label: t.nav.audit || 'Auditoria & Governança', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
    { 
      id: 'reports', 
      label: (t.nav as any).reports || 'Relatórios Executivos', 
      icon: <FileText className="w-4 h-4 text-purple-400" />,
      adminOnly: true
    },
  ];

  // If user is operador, they manipulate and search images, but don't generate reports.
  // We can show all tabs or clearly show lock badge on reports
  const navItems = allNavItems;

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Top Banner Status Bar */}
      <div className="bg-slate-950/80 px-4 py-1.5 border-b border-slate-800/60 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {t.common.liveStatus}
          </span>
          <span className="hidden sm:inline-block text-slate-600">•</span>
          <span className="hidden sm:flex items-center gap-1 text-slate-300">
            <Zap className="w-3 h-3 text-amber-400" />
            {t.common.gpuAccelerated}
          </span>
          <span className="hidden md:inline-block text-slate-600">•</span>
          <span className="hidden md:flex items-center gap-1 text-sky-300">
            <Layers className="w-3 h-3 text-sky-400" />
            {t.common.channels64}
          </span>
          <span className="hidden lg:inline-block text-slate-600">•</span>
          {/* Direct Shortcut to Pick Area on Map */}
          <button
            id="btn-quick-pick-map"
            onClick={() => onTabChange('areaAnalysis')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 text-[11px] font-semibold transition-all cursor-pointer shadow-sm"
            title="Escolher região no mapa (Google Maps / Earth Engine)"
          >
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>Escolher Área no Mapa (GEE / Maps)</span>
          </button>
        </div>

        {/* User Session Info & Language Selector */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
              <div className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 ${
                isAdmin 
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' 
                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              }`}>
                {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> : <User className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="capitalize">{user.role}:</span>
                <span className="font-normal opacity-90">{user.name}</span>
              </div>

              <button
                id="btn-logout"
                onClick={logout}
                title="Encerrar sessão"
                className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Language Selector Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/60 rounded-lg p-0.5">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
            {(['pt-BR', 'en', 'es'] as Language[]).map((lang) => {
              const labels: Record<Language, string> = {
                'pt-BR': 'PT',
                'en': 'EN',
                'es': 'ES'
              };
              const isSelected = language === lang;
              return (
                <button
                  key={lang}
                  id={`lang-btn-${lang}`}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-0.5 text-xs font-semibold rounded transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title={`Mudar para ${lang}`}
                >
                  {labels[lang]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Header Brand & Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
              <Satellite className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white font-display">
                  Triminds <span className="text-emerald-400">Geo AI</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full">
                  {t.appBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block truncate max-w-sm">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const isLockedForOperador = item.adminOnly && isOperador;

              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs md:text-sm font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? item.adminOnly 
                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/40 shadow-sm'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.adminOnly && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      isAdmin 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                        : 'bg-slate-800 text-slate-500 border border-slate-700 flex items-center gap-0.5'
                    }`}>
                      {isAdmin ? 'Admin' : <Lock className="w-2.5 h-2.5" />}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
