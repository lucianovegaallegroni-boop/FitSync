import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Search,
  Filter,
  Edit2,
  Power,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  Clock,
  Mail,
  Phone,
  BarChart3,
  Award,
  Shield
} from 'lucide-react';
import { Profile, MonthlyLoginStat, UserRole } from '../../types/database';
import { dataService } from '../../services/dataService';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loginStats, setLoginStats] = useState<MonthlyLoginStat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'trainer' | 'client' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');

  // Modal de edición
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState<{
    full_name: string;
    email: string;
    role: UserRole;
    phone: string;
    goals: string;
  }>({
    full_name: '',
    email: '',
    role: 'client',
    phone: '',
    goals: '',
  });

  // Modal de desactivación
  const [deactivatingUser, setDeactivatingUser] = useState<Profile | null>(null);
  const [reasonPreset, setReasonPreset] = useState<string>('Falta de pago de suscripción mensual');
  const [customReason, setCustomReason] = useState<string>('');

  // Modal de reactivación
  const [reactivatingUser, setReactivatingUser] = useState<Profile | null>(null);

  // Mensaje de éxito / notificación
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estadísticas del gráfico mes seleccionado (para tooltip / detalle)
  const [selectedMonth, setSelectedMonth] = useState<MonthlyLoginStat | null>(null);

  const PRESET_REASONS = [
    'Falta de pago de suscripción mensual',
    'Incumplimiento de términos y condiciones de la comunidad',
    'Solicitud expresa del titular de la cuenta',
    'Inactividad prolongada (más de 90 días sin acceso)',
    'Uso indebido de la plataforma o spam',
    'Otro (especificar abajo)',
  ];

  const isPendingUser = (u: Profile) =>
    u.is_active === false &&
    Boolean(u.deactivation_reason && u.deactivation_reason.toLowerCase().includes('pendiente'));

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, stats] = await Promise.all([
        dataService.getAllUsers(),
        dataService.getMonthlyLoginStats(),
      ]);
      setUsers(allUsers);
      setLoginStats(stats);
      if (stats.length > 0) {
        setSelectedMonth(stats[stats.length - 1]);
      }
    } catch (e) {
      console.error('Error al cargar datos administrativos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Filtrado de usuarios
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.is_active !== false) ||
      (statusFilter === 'pending' && isPendingUser(u)) ||
      (statusFilter === 'inactive' && u.is_active === false && !isPendingUser(u));

    return matchesSearch && matchesRole && matchesStatus;
  });

  // KPIs
  const totalUsersCount = users.length;
  const activeCoachesCount = users.filter((u) => u.role === 'trainer' && u.is_active !== false).length;
  const activeClientsCount = users.filter((u) => u.role === 'client' && u.is_active !== false).length;
  const pendingActivationCount = users.filter((u) => isPendingUser(u)).length;
  const inactiveUsersCount = users.filter((u) => u.is_active === false && !isPendingUser(u)).length;
  const totalLoginsThisMonth = loginStats.length > 0 ? loginStats[loginStats.length - 1].logins : 0;

  // Apertura modal de edición
  const handleOpenEdit = (user: Profile) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      goals: user.goals || '',
    });
  };

  // Guardar edición
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const updated = await dataService.updateUserProfile(editingUser.id, {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim().toLowerCase(),
        role: editForm.role,
        phone: editForm.phone.trim() || null,
        goals: editForm.goals.trim() || null,
      });

      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setEditingUser(null);
      showNotification('success', `Usuario "${updated.full_name}" actualizado exitosamente.`);
    } catch {
      showNotification('error', 'Error al guardar los cambios del usuario.');
    }
  };

  // Apertura modal desactivación
  const handleOpenDeactivate = (user: Profile) => {
    setDeactivatingUser(user);
    setReasonPreset(PRESET_REASONS[0]);
    setCustomReason('');
  };

  // Confirmar desactivación
  const handleConfirmDeactivate = async () => {
    if (!deactivatingUser) return;

    const finalReason = reasonPreset === 'Otro (especificar abajo)' ? customReason.trim() : reasonPreset;

    if (!finalReason) {
      showNotification('error', 'Debes ingresar un motivo para desactivar la cuenta.');
      return;
    }

    try {
      const updated = await dataService.setUserActiveStatus(deactivatingUser.id, false, finalReason);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setDeactivatingUser(null);
      showNotification('success', `Cuenta de "${updated.full_name}" desactivada. No podrá iniciar sesión.`);
    } catch {
      showNotification('error', 'Error al desactivar el usuario.');
    }
  };

  // Confirmar reactivación
  const handleConfirmReactivate = async () => {
    if (!reactivatingUser) return;

    try {
      const updated = await dataService.setUserActiveStatus(reactivatingUser.id, true);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setReactivatingUser(null);
      showNotification('success', `Cuenta de "${updated.full_name}" reactivada con éxito. Ya tiene acceso a la plataforma.`);
    } catch {
      showNotification('error', 'Error al reactivar la cuenta.');
    }
  };

  // Confirmar activación directa de usuario pendiente
  const handleConfirmActivate = async (user: Profile) => {
    try {
      const updated = await dataService.setUserActiveStatus(user.id, true);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showNotification('success', `¡Cuenta de "${updated.full_name}" activada y autorizada con éxito! El usuario ya puede iniciar sesión.`);
    } catch {
      showNotification('error', 'Error al activar la cuenta del usuario.');
    }
  };

  // Valor máximo para la escala del gráfico
  const peakLogins = Math.max(...loginStats.map((s) => s.logins), 100);
  const maxLogins = Math.ceil(peakLogins / 100) * 100;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Shield className="h-3.5 w-3.5 text-purple-400" />
              <span>Panel Maestro de Administración</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Control de Usuarios & Analítica Global
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Supervisa todos los entrenadores y atletas de FitSync, gestiona sus roles, activa o bloquea cuentas
              especificando el motivo y analiza el crecimiento del tráfico de usuarios mes a mes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sincronizar Datos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notificación flotante */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xl transition-all animate-bounce-short border ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5 text-sm font-medium">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Alerta de usuarios pendientes de activación */}
      {pendingActivationCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 text-xs shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-amber-400 shrink-0 animate-pulse" />
            <span>
              Hay <strong className="text-white font-bold">{pendingActivationCount}</strong> {pendingActivationCount === 1 ? 'nuevo usuario registrado' : 'nuevos usuarios registrados'} que requiere{pendingActivationCount === 1 ? '' : 'n'} aprobación y activación del administrador para poder acceder.
            </span>
          </div>
          <button
            onClick={() => setStatusFilter('pending')}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs whitespace-nowrap self-start sm:self-auto transition-colors shadow-md shadow-amber-500/20"
          >
            Ver Pendientes ({pendingActivationCount})
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Total Usuarios</span>
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{totalUsersCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Registrados en la plataforma</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Coaches Activos</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">{activeCoachesCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Entrenadores impartiendo rutinas</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Atletas Activos</span>
            <div className="h-8 w-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-400">{activeClientsCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Clientes con acceso activo</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Pendientes / Inactivos</span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">{pendingActivationCount + inactiveUsersCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {pendingActivationCount} pendientes • {inactiveUsersCount} desactivados
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Inicios de Sesión</span>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-400">{totalLoginsThisMonth}</div>
          <p className="text-[11px] text-slate-500 mt-1">Logins en el mes en curso</p>
        </div>
      </div>

      {/* Gráfico de Logins Mes a Mes */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Evolución de Logins Mensuales en FitSync
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Registro acumulado de accesos por mes con desglose entre entrenadores y atletas
            </p>
          </div>

          {selectedMonth && (
            <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mes seleccionado</span>
                <span className="font-bold text-white text-sm">
                  {selectedMonth.month} {selectedMonth.year}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Logins</span>
                <span className="font-extrabold text-purple-400 text-sm">{selectedMonth.logins}</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Usuarios Únicos</span>
                <span className="font-bold text-emerald-400 text-sm">{selectedMonth.unique_users}</span>
              </div>
            </div>
          )}
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-6 pb-2">
          {/* Main Chart Container with Y-Axis and Plot Area */}
          <div className="flex gap-2 sm:gap-4 items-stretch">
            {/* Y-Axis Labels */}
            <div className="h-64 sm:h-72 flex flex-col justify-between text-[10px] text-slate-500 font-mono pr-1 select-none text-right w-8 sm:w-10 pb-1">
              <span>{maxLogins}</span>
              <span>{Math.round(maxLogins * 0.75)}</span>
              <span>{Math.round(maxLogins * 0.5)}</span>
              <span>{Math.round(maxLogins * 0.25)}</span>
              <span>0</span>
            </div>

            {/* Plot Area with Grid Lines and Proportional Bars */}
            <div className="flex-1 relative h-64 sm:h-72 border-b border-l border-slate-800 rounded-bl-lg">
              {/* Background Horizontal Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-slate-800/40 w-full" />
                <div className="border-t border-slate-800/40 w-full" />
                <div className="border-t border-slate-800/40 w-full" />
                <div className="border-t border-slate-800/40 w-full" />
                <div className="w-full" />
              </div>

              {/* Columns & Proportional Bars */}
              <div className="absolute inset-0 flex items-end justify-around px-2 sm:px-4">
                {loginStats.map((stat) => {
                  const heightPercentage = Math.round((stat.logins / maxLogins) * 100);
                  const isSelected = selectedMonth?.month === stat.month && selectedMonth?.year === stat.year;

                  return (
                    <div
                      key={`${stat.year}-${stat.month}`}
                      onClick={() => setSelectedMonth(stat)}
                      className="flex-1 h-full max-w-[56px] flex flex-col justify-end items-center group cursor-pointer relative z-10 px-1 sm:px-1.5"
                    >
                      {/* Floating Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-purple-500/40 text-slate-200 text-[10px] rounded-xl px-3 py-2 shadow-2xl pointer-events-none whitespace-nowrap text-center z-30 backdrop-blur-md">
                        <p className="font-bold text-white text-xs">{stat.month} {stat.year}</p>
                        <p className="text-purple-400 font-black text-sm">{stat.logins} accesos</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">
                          {stat.trainers} coaches • {stat.clients} atletas
                        </p>
                      </div>

                      {/* Value label directly above bar */}
                      <span
                        className={`text-[10px] sm:text-xs font-bold mb-1.5 transition-all select-none ${
                          isSelected
                            ? 'text-purple-300 scale-110'
                            : 'text-slate-400 group-hover:text-white'
                        }`}
                      >
                        {stat.logins}
                      </span>

                      {/* Bar Track & Fill with Relative Height */}
                      <div
                        style={{ height: `${Math.max(heightPercentage, 5)}%` }}
                        className={`w-full rounded-t-xl transition-all duration-500 relative flex flex-col justify-between overflow-hidden shadow-lg ${
                          isSelected
                            ? 'bg-gradient-to-t from-purple-700 via-purple-500 to-emerald-400 shadow-purple-500/40 ring-2 ring-purple-400/60'
                            : 'bg-gradient-to-t from-purple-900/80 via-purple-600/90 to-emerald-400/90 group-hover:from-purple-600 group-hover:via-purple-500 group-hover:to-teal-300 group-hover:shadow-purple-500/30'
                        }`}
                      >
                        {/* Top highlight bar cap */}
                        <div className="w-full h-1 bg-white/50" />

                        {/* Shimmer overlay on hover */}
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* X-Axis Month Labels */}
          <div className="flex gap-2 sm:gap-4 pl-8 sm:pl-10 pt-2.5">
            <div className="flex-1 flex justify-around px-2 sm:px-4">
              {loginStats.map((stat) => {
                const isSelected = selectedMonth?.month === stat.month && selectedMonth?.year === stat.year;
                return (
                  <div
                    key={`label-${stat.year}-${stat.month}`}
                    onClick={() => setSelectedMonth(stat)}
                    className="flex-1 max-w-[56px] text-center cursor-pointer"
                  >
                    <span
                      className={`text-[11px] sm:text-xs font-semibold transition-colors block ${
                        isSelected
                          ? 'text-purple-400 font-bold underline underline-offset-4'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {stat.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart footer legend */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
                <span>Volumen de Inicios de Sesión</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                <span>Pico de actividad (Sep 2026)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Haz clic en cualquier barra para ver el desglose detallado de ese mes.
            </p>
          </div>
        </div>
      </div>

      {/* User Directory & Control Table */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Directorio Global de Usuarios ({filteredUsers.length})
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Control total: edita información de los perfiles y bloquea o activa accesos en tiempo real
            </p>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[240px] sm:min-w-[300px]">
            <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium mr-1">
              <Filter className="h-3 w-3" />
              Rol:
            </span>
            {(['all', 'trainer', 'client', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                  roleFilter === r
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {r === 'all'
                  ? 'Todos'
                  : r === 'trainer'
                  ? 'Entrenadores'
                  : r === 'client'
                  ? 'Clientes'
                  : 'Admins'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-medium mr-1">Estado:</span>
            {(['all', 'active', 'pending', 'inactive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                  statusFilter === s
                    ? s === 'pending'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {s === 'all'
                  ? 'Todos'
                  : s === 'active'
                  ? 'Activos'
                  : s === 'pending'
                  ? `Pendientes (${pendingActivationCount})`
                  : 'Desactivados'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Usuario</th>
                <th className="py-3.5 px-3">Rol</th>
                <th className="py-3.5 px-3">Estado de Cuenta</th>
                <th className="py-3.5 px-3">Motivo Desactivación</th>
                <th className="py-3.5 px-3">Último Login</th>
                <th className="py-3.5 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No se encontraron usuarios que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isActive = user.is_active !== false;
                  const isPending = isPendingUser(user);

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-900/60 transition-colors ${
                        isPending ? 'bg-amber-950/15' : !isActive ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Usuario */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                              user.role === 'admin'
                                ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                                : user.role === 'trainer'
                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                                : 'bg-teal-500/20 border-teal-500/30 text-teal-300'
                            }`}
                          >
                            {user.full_name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-white block truncate">
                              {user.full_name}
                            </span>
                            <span className="text-slate-400 block truncate text-[11px]">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            user.role === 'admin'
                              ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                              : user.role === 'trainer'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                              : 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                          }`}
                        >
                          {user.role === 'admin' ? (
                            <>
                              <Shield className="h-3 w-3" /> Admin
                            </>
                          ) : user.role === 'trainer' ? (
                            <>
                              <Award className="h-3 w-3" /> Entrenador
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3 w-3" /> Cliente
                            </>
                          )}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-3">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Activa
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Clock className="h-3 w-3 text-amber-400 animate-pulse" />
                            Pendiente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <UserX className="h-3 w-3" />
                            Desactivada
                          </span>
                        )}
                      </td>

                      {/* Motivo de desactivación */}
                      <td className="py-3.5 px-3">
                        {!isActive ? (
                          <div className="max-w-[220px]">
                            <span
                              className={`font-medium block truncate text-[11px] ${
                                isPending ? 'text-amber-300' : 'text-rose-300'
                              }`}
                              title={user.deactivation_reason || ''}
                            >
                              {user.deactivation_reason || 'Sin motivo especificado'}
                            </span>
                            {user.deactivated_at && (
                              <span className="text-[10px] text-slate-500 block">
                                Desde: {new Date(user.deactivated_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Último Login */}
                      <td className="py-3.5 px-3 text-slate-400">
                        {user.last_login_at ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-slate-500 shrink-0" />
                            <span>{new Date(user.last_login_at).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Editar */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700/60"
                            title="Editar datos del usuario"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Botón Activar / Desactivar */}
                          {isActive ? (
                            <button
                              onClick={() => handleOpenDeactivate(user)}
                              disabled={user.role === 'admin'}
                              className={`p-1.5 rounded-lg transition-colors border ${
                                user.role === 'admin'
                                  ? 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
                                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                              }`}
                              title={
                                user.role === 'admin'
                                  ? 'No puedes desactivar a un administrador'
                                  : 'Desactivar cuenta y bloquear acceso'
                              }
                            >
                              <Power className="h-3.5 w-3.5" />
                            </button>
                          ) : isPending ? (
                            <button
                              onClick={() => handleConfirmActivate(user)}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                              title="Aprobar y activar acceso a la plataforma"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>Activar Cuenta</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setReactivatingUser(user)}
                              className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                              title="Reactivar acceso a la plataforma"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>Reactivar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: EDITAR USUARIO */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Edit2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Editar Perfil de Usuario</h3>
                <p className="text-xs text-slate-400">Modifica los datos globales en la base de datos</p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Rol en la Plataforma</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="client">Cliente / Atleta</option>
                  <option value="trainer">Entrenador / Coach</option>
                  <option value="admin">Super Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono (opcional)</label>
                <div className="relative">
                  <Phone className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+34 600 000 000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Objetivos o Notas (opcional)</label>
                <textarea
                  rows={2}
                  value={editForm.goals}
                  onChange={(e) => setEditForm({ ...editForm, goals: e.target.value })}
                  placeholder="Metas físicas, observaciones o historial..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-500/20 transition-all"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DESACTIVAR CUENTA (CON MOTIVO OBLIGATORIO) */}
      {deactivatingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setDeactivatingUser(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Desactivar Cuenta de Usuario</h3>
                <p className="text-xs text-rose-300">
                  Esta acción bloqueará de inmediato el inicio de sesión para el usuario.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 mb-5">
              <span className="text-[11px] text-slate-400 block font-medium">Usuario afectado:</span>
              <p className="font-bold text-white text-sm">{deactivatingUser.full_name}</p>
              <p className="text-xs text-slate-400">{deactivatingUser.email}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Motivo de la Desactivación <span className="text-rose-400">*</span>
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  El usuario verá esta razón en pantalla si intenta iniciar sesión.
                </p>
                <select
                  value={reasonPreset}
                  onChange={(e) => setReasonPreset(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                >
                  {PRESET_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {reasonPreset === 'Otro (especificar abajo)' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Describe el motivo específico:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Ej. Incumplimiento reiterado de pagos tras recordatorio del día..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDeactivatingUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeactivate}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all"
                >
                  <Power className="h-3.5 w-3.5" />
                  <span>Confirmar Bloqueo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REACTIVAR CUENTA */}
      {reactivatingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setReactivatingUser(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <RotateCcw className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Reactivar Acceso</h3>
                <p className="text-xs text-slate-400">Restaurar permisos de ingreso al usuario</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              ¿Confirmas que deseas reactivar la cuenta de{' '}
              <strong className="text-white">{reactivatingUser.full_name}</strong> ({reactivatingUser.email})?
              Se eliminará el bloqueo y el usuario podrá iniciar sesión normalmente.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReactivatingUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReactivate}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Reactivar Usuario</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
