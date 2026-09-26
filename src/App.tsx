import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { TrainerDashboard } from './components/trainer/TrainerDashboard';
import { ClientPortal } from './components/client/ClientPortal';
import { DatabaseModal } from './components/DatabaseModal';
import { AuthModal } from './components/AuthModal';

const MainContent: React.FC = () => {
  const { profile } = useAuth();
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar
        onOpenDbModal={() => setIsDbModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {profile?.role === 'client' ? (
          <ClientPortal />
        ) : (
          <TrainerDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} FitSync SaaS • Plataforma para Entrenadores y Atletas</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Supabase: <strong className="text-emerald-400 font-mono">webrizefhxccighruoem</strong></span>
            <button
              onClick={() => setIsDbModalOpen(true)}
              className="text-emerald-400 hover:underline cursor-pointer"
            >
              Ver Esquema SQL
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DatabaseModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
};

export default App;
