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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

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
      (statusFilter === 'inactive' && u.is_active === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // KPIs
  const totalUsersCount = users.length;
  const activeCoachesCount = users.filter((u) => u.role === 'trainer' && u.is_active !== false).length;
  const activeClientsCount = users.filter((u) => u.role === 'client' && u.is_active !== false).length;
  const inactiveUsersCount = users.filter((u) => u.is_active === false).length;
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

  // Valor máximo para la escala del gráfico
  const maxLogins = Math.max(...loginStats.map((s) => s.logins), 1000);

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
          <p className="text-[11px] text-slate-500 mt-1">Clientes con suscripción vigente</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Cuentas Inactivas</span>
            <div className="h-8 w-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <UserX className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400">{inactiveUsersCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Acceso revocado por admin</p>
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
        <div className="pt-8 pb-4">
          <div className="h-64 sm:h-72 w-full flex items-end justify-between gap-2 sm:gap-6 border-b border-slate-800 px-2 sm:px-6">
            {loginStats.map((stat) => {
              const heightPercentage = Math.round((stat.logins / maxLogins) * 100);
              const isSelected = selectedMonth?.month === stat.month && selectedMonth?.year === stat.year;

              return (
                <div
                  key={`${stat.year}-${stat.month}`}
                  onClick={() => setSelectedMonth(stat)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  {/* Tooltip visible on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-slate-950 border border-slate-700 text-slate-200 text-[10px] rounded-lg px-2.5 py-1.5 shadow-2xl pointer-events-none whitespace-nowrap text-center z-20">
                    <p className="font-bold text-white">{stat.month} {stat.year}</p>
                    <p className="text-purple-400 font-extrabold">{stat.logins} accesos</p>
                    <p className="text-slate-400">{stat.trainers} coaches • {stat.clients} atletas</p>
                  </div>

                  {/* Value badge over bar */}
                  <span
                    className={`text-[10px] sm:text-xs font-semibold mb-1 transition-all ${
                      isSelected ? 'text-purple-300 font-bold scale-110' : 'text-slate-400 group-hover:text-white'
                    }`}
                  >
                    {stat.logins}
                  </span>

                  {/* Bar Container */}
                  <div className="w-full max-w-[48px] bg-slate-800/40 rounded-t-xl overflow-hidden flex flex-col justify-end p-0.5">
                    {/* The bar element */}
                    <div
                      style={{ height: `${Math.max(heightPercentage, 6)}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 relative ${
                        isSelected
                          ? 'bg-gradient-to-t from-purple-600 via-purple-500 to-emerald-400 shadow-lg shadow-purple-500/30'
                          : 'bg-gradient-to-t from-slate-700 via-purple-600/70 to-emerald-500/80 group-hover:from-purple-600 group-hover:to-teal-400'
                      }`}
                    >
                      {/* Top highlight cap */}
                      <div className="w-full h-1 bg-white/40 rounded-t-lg" />
                    </div>
                  </div>

                  {/* Month Label */}
                  <span
                    className={`mt-3 text-[11px] sm:text-xs font-medium transition-colors ${
                      isSelected ? 'text-purple-400 font-bold' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {stat.month}
                  </span>
                </div>
              );
            })}
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

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium mr-1">Estado:</span>
            {(['all', 'active', 'inactive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                  statusFilter === s
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {s === 'all' ? 'Todos' : s === 'active' ? 'Activos' : 'Desactivados'}
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

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-900/60 transition-colors ${
                        !isActive ? 'bg-rose-950/10' : ''
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
                            <span className="text-rose-300 font-medium block truncate text-[11px]" title={user.deactivation_reason || ''}>
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
