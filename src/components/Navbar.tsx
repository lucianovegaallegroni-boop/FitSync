import React from 'react';
import { Dumbbell, User, LogOut, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuthModal }) => {
  const { profile, logout, switchDemoRole, isDemoMode } = useAuth();

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Dumbbell className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-base sm:text-lg text-white tracking-tight">
                Fit<span className="text-emerald-400">Sync</span>
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SaaS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">Plataforma para Entrenadores y Clientes</p>
          </div>
        </div>

        {/* Right Actions & Account Status */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Demo account switcher */}
          {isDemoMode && profile && (
            <button
              onClick={() => {
                const nextRole = profile.role === 'trainer' ? 'client' : profile.role === 'client' ? 'admin' : 'trainer';
                switchDemoRole(nextRole);
              }}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all"
              title="Cambiar rol de usuario Demo (Entrenador / Cliente / Administrador)"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span className="hidden sm:inline text-slate-400">Rol:</span>
              <span
                className={`font-semibold capitalize ${
                  profile.role === 'admin'
                    ? 'text-purple-400'
                    : profile.role === 'trainer'
                    ? 'text-emerald-400'
                    : 'text-teal-400'
                }`}
              >
                {profile.role === 'admin' ? 'Admin' : profile.role === 'trainer' ? 'Entrenador' : 'Cliente'}
              </span>
            </button>
          )}

          {profile ? (
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-800">
              <div className="flex flex-col items-end hidden lg:flex">
                <span className="text-xs font-medium text-slate-200 truncate max-w-[140px]">{profile.full_name}</span>
                <span className="text-[10px] text-slate-400">
                  {profile.role === 'admin' ? 'Super Administrador' : profile.role === 'trainer' ? 'Coach Entrenador' : 'Cliente'}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl transition-colors"
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
