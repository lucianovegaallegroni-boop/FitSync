import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { TrainerDashboard } from './components/trainer/TrainerDashboard';
import { ClientPortal } from './components/client/ClientPortal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LandingPage } from './components/landing/LandingPage';
import { AuthModal } from './components/AuthModal';
import { Dumbbell } from 'lucide-react';

const MainContent: React.FC = () => {
  const { profile, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse">
          <Dumbbell className="h-6 w-6 text-white" />
        </div>
        <p className="text-xs font-medium tracking-wide">Cargando FitSync...</p>
      </div>
    );
  }

  // Si no hay usuario autenticado o en demo, mostrar la Landing Page con el formulario de login/registro
  if (!profile) {
    return <LandingPage />;
  }

  // Vista autenticada (Admin, Entrenador o Cliente)
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {profile.role === 'admin' ? (
          <AdminDashboard />
        ) : profile.role === 'client' ? (
          <ClientPortal />
        ) : (
          <TrainerDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} FitSync SaaS • Plataforma para Entrenadores y Atletas</p>
          <p className="text-slate-500">Versión 1.0</p>
        </div>
      </footer>

      {/* Modals */}
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
