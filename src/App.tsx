import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Header, NavTab } from './components/Header';
import { LoginView } from './components/LoginView';
import { GeoAiStudio } from './components/GeoAiStudio';
import { AreaSelectionView } from './components/AreaSelectionView';
import { MapExplorerView } from './components/MapExplorerView';
import { TimeSeriesView } from './components/TimeSeriesView';
import { ModelZooView } from './components/ModelZooView';
import { DriftObservabilityView } from './components/DriftObservabilityView';
import { ApiWorkbenchView } from './components/ApiWorkbenchView';
import { AuditGovernanceView } from './components/AuditGovernanceView';
import { ReportsManagementView } from './components/ReportsManagementView';
import { Satellite, Github, ShieldCheck } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, authConfig } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('studio');

  // If authentication is enabled and user is not logged in, show Login Screen
  if (authConfig.enabled && !user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#1F1F1D] flex flex-col selection:bg-[#EEE9DF] selection:text-[#1F1F1D] font-sans">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 pb-16">
        {activeTab === 'studio' && <GeoAiStudio onOpenMapSelector={() => setActiveTab('areaAnalysis')} />}
        {activeTab === 'areaAnalysis' && <AreaSelectionView />}
        {activeTab === 'explorer' && <MapExplorerView onOpenMapSelector={() => setActiveTab('areaAnalysis')} />}
        {activeTab === 'timeseries' && <TimeSeriesView />}
        {activeTab === 'models' && <ModelZooView />}
        {activeTab === 'drift' && <DriftObservabilityView />}
        {activeTab === 'api' && <ApiWorkbenchView />}
        {activeTab === 'audit' && <AuditGovernanceView />}
        {activeTab === 'reports' && <ReportsManagementView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-6 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Satellite className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">Trimindslabs Geo-AI V4</span>
            <span>•</span>
            <span>Google Satellite Embedding V1 (64 Bands) & Sentinel-2 L2A</span>
          </div>

          <div className="flex items-center space-x-6">
            <a
              href="https://github.com/RodrigoDiasDeOliveira/Trimindslabs-Geo-AI-V4"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-slate-300 hover:text-emerald-400 transition-colors font-medium"
            >
              <Github className="w-4 h-4" />
              <span>RodrigoDiasDeOliveira/Triminds-Geo-AI</span>
            </a>
            <span>•</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Production Ready v2.4.0
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
