import React from 'react';
import { Dumbbell, ShieldCheck, User, LogOut, Database, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenDbModal: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDbModal, onOpenAuthModal }) => {
  const { profile, logout, switchDemoRole, isDemoMode } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Dumbbell className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">Fit<span className="text-emerald-400">Sync</span></span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SaaS MVP
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Plataforma para Entrenadores y Clientes</p>
          </div>
        </div>

        {/* Center: Quick Switcher for Testing */}
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => switchDemoRole('trainer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              profile?.role === 'trainer'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Vista Entrenador</span>
          </button>
          <button
            onClick={() => switchDemoRole('client')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              profile?.role === 'client'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Vista Cliente (Móvil)</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenDbModal}
            className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors"
            title="Conexión Supabase y SQL Schema"
          >
            <Database className="h-3.5 w-3.5" />
            <span className="hidden md:inline font-mono">Supabase DB</span>
          </button>

          {profile ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-medium text-slate-200">{profile.full_name}</span>
                <span className="text-[10px] text-slate-400 capitalize">
                  {profile.role === 'trainer' ? 'Coach' : 'Cliente'} {isDemoMode ? '(Demo)' : ''}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <User className="h-3.5 w-3.5" />
              <span>Ingresar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
