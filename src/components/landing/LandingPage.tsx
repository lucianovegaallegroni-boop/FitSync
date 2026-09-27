import React, { useState } from 'react';
import {
  Dumbbell,
  ShieldCheck,
  User,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Apple,
  Camera,
  Activity,
  Clock,
  Sparkles,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/database';

export const LandingPage: React.FC = () => {
  const { login, signup, switchDemoRole } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('trainer');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await login(email, password);
        if (error) throw error;
      } else {
        const { error } = await signup(email, password, fullName, role);
        if (error) throw error;
        setSuccessMsg('¡Cuenta registrada! Tu cuenta ha sido creada y se encuentra pendiente de activación por un administrador para poder ingresar.');
        setTimeout(() => {
          setIsLogin(true);
          setSuccessMsg('');
        }, 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al autenticar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">
                Fit<span className="text-emerald-400">Sync</span>
              </span>
              <span className="ml-2 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SaaS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/80">
              Acceso Seguro
            </span>
          </div>
        </div>
      </header>

      {/* Hero with Embedded Login */}
      <section className="relative overflow-hidden py-10 lg:py-16 flex-1 flex items-center">
        {/* Glow effect in background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>La plataforma SaaS todo en uno para Entrenadores y Clientes</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Escala tu negocio de entrenamiento <span className="text-emerald-400">sin hojas de cálculo</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Reemplaza los grupos de WhatsApp y las plantillas de Excel dispersas por un ecosistema profesional.
                Diseña rutinas, asigna macros calóricos, supervisa el cumplimiento diario y visualiza la evolución con fotos de progreso.
              </p>

              {/* Bullet highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-left max-w-xl mx-auto lg:mx-0">
                <div className="flex items-start gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <Dumbbell className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-white block">Constructor de Rutinas</strong>
                    <span className="text-slate-400">Series, repeticiones y descansos organizados por día.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <Apple className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-white block">Objetivos Nutricionales</strong>
                    <span className="text-slate-400">Control de calorías, proteínas, carbohidratos y grasas.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <Camera className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-white block">Check-ins con Fotos</strong>
                    <span className="text-slate-400">Pesaje semanal, medidas de cintura y galería visual.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <Clock className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-white block">Alerta de Retención</strong>
                    <span className="text-slate-400">Detecta clientes inactivos por más de 3 días.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Integrated Login / Register Card */}
            <div className="lg:col-span-5 w-full max-w-md mx-auto">
              <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
                {/* Header of the Card */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white">
                    {isLogin ? 'Ingresar a FitSync' : 'Comienza Gratis'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {isLogin ? 'Accede a tu panel de entrenador o portal de atleta' : 'Crea tu cuenta de entrenador o cliente'}
                  </p>
                </div>

                {/* Switch between Login and Register */}
                <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-6">
                  <button
                    type="button"
                    onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                      isLogin
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                      !isLogin
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Crear Cuenta
                  </button>
                </div>

                {errorMsg && (
                  <div
                    className={`my-3 p-3.5 rounded-xl border flex items-start gap-2.5 text-xs text-left animate-fadeIn ${
                      errorMsg.toLowerCase().includes('activada') || errorMsg.toLowerCase().includes('pendiente')
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <AlertCircle
                      className={`h-4 w-4 shrink-0 mt-0.5 ${
                        errorMsg.toLowerCase().includes('activada') || errorMsg.toLowerCase().includes('pendiente')
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    />
                    <span className="leading-relaxed font-medium">{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="my-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-300 text-xs text-left">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3.5 mt-3 text-left">
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
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Usuario</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setRole('trainer')}
                            className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                              role === 'trainer'
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold'
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
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold'
                                : 'border-slate-800 bg-slate-950 text-slate-400'
                            }`}
                          >
                            Cliente / Atleta
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
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
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
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl text-xs sm:text-sm transition-all mt-3 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{loading ? 'Procesando...' : isLogin ? 'Ingresar a la Plataforma' : 'Crear Cuenta'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {/* Espacio con las Sesiones de Demo (Debajo del cuadro de login) */}
              <div className="mt-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Sesiones de Demostración
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                    Acceso 1-clic
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3.5">
                  Explora las funcionalidades completas de FitSync sin necesidad de registro previo:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => switchDemoRole('trainer')}
                    className="group p-2.5 bg-slate-950/80 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1.5"
                  >
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 flex items-center justify-center text-emerald-400 transition-transform">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">Coach</p>
                      <p className="text-[10px] text-slate-500">Entrenador</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => switchDemoRole('client')}
                    className="group p-2.5 bg-slate-950/80 hover:bg-teal-500/10 border border-slate-800 hover:border-teal-500/40 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1.5"
                  >
                    <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 group-hover:scale-110 flex items-center justify-center text-teal-400 transition-transform">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-teal-300 transition-colors">Cliente</p>
                      <p className="text-[10px] text-slate-500">Atleta</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => switchDemoRole('admin')}
                    className="group p-2.5 bg-slate-950/80 hover:bg-purple-500/10 border border-slate-800 hover:border-purple-500/40 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1.5"
                  >
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 group-hover:scale-110 flex items-center justify-center text-purple-400 transition-transform">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">Admin</p>
                      <p className="text-[10px] text-slate-500">Super Panel</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-12 border-t border-slate-800/80 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Diseñado para dos mundos perfectamente sincronizados</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Un panel completo para el entrenador y una aplicación fluida para que los atletas no fallen ningún día.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Portal del Entrenador</h3>
                  <span className="text-xs text-emerald-400 font-medium">Gestión y Escalabilidad</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Dashboard con clientes activos y alertas automáticas de retención.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Constructor de rutinas y ejercicios para asignar a múltiples alumnos.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Asignador de objetivos nutricionales (calorías y desglose en gramos de macros).</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Gráficas analíticas de evolución y galería de fotos de progreso de cada cliente.</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Portal del Atleta (Cliente)</h3>
                  <span className="text-xs text-teal-400 font-medium">Claridad y Cumplimiento</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                  <span>Vista "Qué tengo que hacer hoy" con checklist interactivo de ejercicios.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                  <span>Registro de cumplimiento nutricional e hidratación en litros.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                  <span>Check-in semanal: peso corporal, medidas corporales y subida de fotos.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                  <span>Historial de avances y comparativa desde la primera semana.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950">
        <p>© {new Date().getFullYear()} FitSync SaaS • Plataforma para Entrenadores y Clientes</p>
      </footer>
    </div>
  );
};
