import React, { useState } from 'react';
import { X, Lock, Mail, User, Dumbbell, AlertCircle, CheckCircle2, ShieldCheck, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/database';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup, switchDemoRole } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('trainer');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await login(email, password);
        if (error) throw error;
        onClose();
      } else {
        const { error } = await signup(email, password, fullName, role);
        if (error) throw error;
        setSuccessMsg('¡Cuenta registrada! Tu acceso está pendiente de activación por un administrador antes de ingresar.');
        setTimeout(() => {
          setIsLogin(true);
          setSuccessMsg('');
        }, 3500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {isLogin ? 'Iniciar Sesión en FitSync' : 'Crear Cuenta'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Plataforma de Entrenamiento & Nutrición
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nombre Completo</label>
                <div className="relative">
                  <User className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Rodrigo Paz"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Rol</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('trainer')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      role === 'trainer'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Entrenador
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      role === 'client'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Cliente
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold py-2.5 rounded-xl text-sm transition-colors mt-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : isLogin ? 'Entrar a FitSync' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>

        {/* Espacio con las Sesiones de Demo (Debajo del formulario de login) */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Sesiones de Demostración
            </span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-medium">
              1-clic
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { switchDemoRole('trainer'); onClose(); }}
              className="p-2 bg-slate-950/70 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1 group"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium text-slate-200 group-hover:text-emerald-300">Coach</span>
            </button>
            <button
              type="button"
              onClick={() => { switchDemoRole('client'); onClose(); }}
              className="p-2 bg-slate-950/70 hover:bg-teal-500/10 border border-slate-800 hover:border-teal-500/40 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1 group"
            >
              <User className="h-4 w-4 text-teal-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium text-slate-200 group-hover:text-teal-300">Cliente</span>
            </button>
            <button
              type="button"
              onClick={() => { switchDemoRole('admin'); onClose(); }}
              className="p-2 bg-slate-950/70 hover:bg-purple-500/10 border border-slate-800 hover:border-purple-500/40 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1 group"
            >
              <Shield className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium text-slate-200 group-hover:text-purple-300">Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
