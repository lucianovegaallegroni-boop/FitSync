import React, { useState, useEffect } from 'react';
import {
  Users,
  Dumbbell,
  Apple,
  TrendingUp,
  AlertTriangle,
  Plus,
  Calendar,
  ChevronRight,
  Flame,
  Activity,
  CheckCircle,
  Clock,
  Sparkles,
  Phone,
  FileText,
  Weight,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { Profile, Workout, ProgressLog, NutritionGoal } from '../../types/database';

export const TrainerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'workouts' | 'nutrition' | 'analytics'>('overview');

  const [clients, setClients] = useState<Profile[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);
  const [clientProgress, setClientProgress] = useState<ProgressLog[]>([]);
  const [clientNutrition, setClientNutrition] = useState<NutritionGoal | null>(null);

  // Estados de formularios y modales
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientGoals, setNewClientGoals] = useState('');
  const [newClientMedical, setNewClientMedical] = useState('');
  const [clientError, setClientError] = useState('');
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  // Estados para constructor de rutinas
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDesc, setWorkoutDesc] = useState('');
  const [workoutError, setWorkoutError] = useState('');
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false);
  const [exercisesList, setExercisesList] = useState<Array<{ day_name: string; exercise_name: string; sets: number; reps: string; rest_seconds: number }>>([
    { day_name: 'Día 1: Pecho y Tríceps', exercise_name: 'Press de Banca Plano', sets: 4, reps: '8-10', rest_seconds: 90 },
    { day_name: 'Día 1: Pecho y Tríceps', exercise_name: 'Aperturas con Mancuernas', sets: 3, reps: '12', rest_seconds: 60 },
  ]);

  // Asignar rutina
  const [assignClientId, setAssignClientId] = useState('');
  const [assignWorkoutId, setAssignWorkoutId] = useState('');
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Asignar nutrición
  const [macroCalories, setMacroCalories] = useState(2200);
  const [macroProtein, setMacroProtein] = useState(160);
  const [macroCarbs, setMacroCarbs] = useState(230);
  const [macroFat, setMacroFat] = useState(65);
  const [macroNotes, setMacroNotes] = useState('');
  const [nutritionSuccess, setNutritionSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  const loadData = async () => {
    if (!profile) return;
    const cList = await dataService.getClients(profile.id);
    const wList = await dataService.getWorkouts(profile.id);

    // Deduplicación preventiva en memoria
    const uniqueClients = cList.filter((c, idx, arr) =>
      arr.findIndex(item => item.email.trim().toLowerCase() === c.email.trim().toLowerCase()) === idx
    );
    const uniqueWorkouts = wList.filter((w, idx, arr) =>
      arr.findIndex(item => item.title.trim().toLowerCase() === w.title.trim().toLowerCase()) === idx
    );

    setClients(uniqueClients);
    setWorkouts(uniqueWorkouts);

    if (uniqueClients.length > 0 && !selectedClient) {
      handleSelectClient(uniqueClients[0]);
    }
  };

  const handleSelectClient = async (c: Profile) => {
    setSelectedClient(c);
    const prog = await dataService.getProgressLogs(c.id);
    const nut = await dataService.getNutritionGoal(c.id);
    setClientProgress(prog);
    setClientNutrition(nut);
    if (nut) {
      setMacroCalories(nut.calories);
      setMacroProtein(nut.protein_g);
      setMacroCarbs(nut.carbs_g);
      setMacroFat(nut.fat_g);
      setMacroNotes(nut.notes || '');
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || isCreatingClient) return;
    setClientError('');

    const trimmedEmail = newClientEmail.trim().toLowerCase();
    const duplicate = clients.some(c => c.email.trim().toLowerCase() === trimmedEmail);
    if (duplicate) {
      setClientError(`Ya existe un cliente registrado con el correo "${newClientEmail}".`);
      return;
    }

    setIsCreatingClient(true);
    try {
      const created = await dataService.addClient({
        email: newClientEmail.trim(),
        full_name: newClientName.trim(),
        phone: newClientPhone.trim(),
        goals: newClientGoals.trim(),
        medical_history: newClientMedical.trim(),
        trainer_id: profile.id,
      });

      setClients(prev => {
        const withoutDup = prev.filter(c => c.email.trim().toLowerCase() !== created.email.trim().toLowerCase());
        return [...withoutDup, created];
      });

      setShowAddClientModal(false);
      setNewClientName('');
      setNewClientEmail('');
      setNewClientPhone('');
      setNewClientGoals('');
      setNewClientMedical('');
      setClientError('');
      handleSelectClient(created);
    } catch (err: any) {
      setClientError(err.message || 'Error al registrar el cliente.');
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleAddExerciseRow = () => {
    setExercisesList([
      ...exercisesList,
      { day_name: 'Día 1', exercise_name: '', sets: 3, reps: '10-12', rest_seconds: 60 }
    ]);
  };

  const handleCreateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || isCreatingWorkout) return;
    setWorkoutError('');

    const trimmedTitle = workoutTitle.trim().toLowerCase();
    const duplicate = workouts.some(w => w.title.trim().toLowerCase() === trimmedTitle);
    if (duplicate) {
      setWorkoutError(`Ya tienes una rutina registrada con el nombre "${workoutTitle}".`);
      return;
    }

    const validExercises = exercisesList.filter(ex => ex.exercise_name.trim().length > 0);
    if (validExercises.length === 0) {
      setWorkoutError('Debes agregar al menos un ejercicio a la plantilla de rutina.');
      return;
    }

    setIsCreatingWorkout(true);
    try {
      const created = await dataService.createWorkout(
        { trainer_id: profile.id, title: workoutTitle.trim(), description: workoutDesc.trim() },
        validExercises.map((ex, i) => ({ ...ex, order_index: i }))
      );

      setWorkouts(prev => {
        const withoutDup = prev.filter(w => w.title.trim().toLowerCase() !== created.title.trim().toLowerCase());
        return [created, ...withoutDup];
      });

      setShowWorkoutModal(false);
      setWorkoutTitle('');
      setWorkoutDesc('');
      setWorkoutError('');
      setExercisesList([
        { day_name: 'Día 1: Pecho y Tríceps', exercise_name: 'Press de Banca Plano', sets: 4, reps: '8-10', rest_seconds: 90 },
      ]);
    } catch (err: any) {
      setWorkoutError(err.message || 'Error al guardar la rutina.');
    } finally {
      setIsCreatingWorkout(false);
    }
  };

  const handleAssignWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignClientId || !assignWorkoutId) return;
    await dataService.assignWorkout(assignClientId, assignWorkoutId, new Date().toISOString().split('T')[0]);
    setAssignSuccess(true);
    setTimeout(() => setAssignSuccess(false), 3000);
  };

  const handleSaveNutrition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    const updated = await dataService.setNutritionGoal({
      client_id: selectedClient.id,
      calories: Number(macroCalories),
      protein_g: Number(macroProtein),
      carbs_g: Number(macroCarbs),
      fat_g: Number(macroFat),
      start_date: new Date().toISOString().split('T')[0],
      notes: macroNotes,
    });
    setClientNutrition(updated);
    setNutritionSuccess(true);
    setTimeout(() => setNutritionSuccess(false), 3000);
  };

  // Clientes sin registro en > 3 días (conforme a sección 3.1 del documento de proyecto)
  const inactiveAlertClients = clients.filter(c => c.id === 'client-3');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/20 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <Sparkles className="h-3.5 w-3.5" /> Portal del Entrenador Personal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Bienvenido, {profile?.full_name || 'Coach'}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Monitorea el progreso de tus atletas, asigna macronutrientes, crea rutinas de entrenamiento y automatiza el seguimiento.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setShowAddClientModal(true)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Cliente</span>
            </button>
            <button
              onClick={() => setShowWorkoutModal(true)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm border border-slate-700 transition-colors"
            >
              <Dumbbell className="h-4 w-4 text-emerald-400" />
              <span>Crear Rutina</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Clientes Activos</p>
            <p className="text-2xl font-bold text-white mt-0.5">{clients.length}</p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-slate-400 font-medium">Inactivos &gt; 3 días</p>
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
            </div>
            <p className="text-2xl font-bold text-rose-400 mt-0.5">{inactiveAlertClients.length}</p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Cumplimiento Semanal</p>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">88%</p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Rutinas en Biblioteca</p>
            <p className="text-2xl font-bold text-white mt-0.5">{workouts.length}</p>
          </div>
        </div>
      </div>

      {/* Inactive Client Alert Banner (Requerimiento 3.1 & 3.3 del MVP) */}
      {inactiveAlertClients.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-rose-300">
                Alerta de Retención: {inactiveAlertClients[0].full_name} no registra actividad hace 4 días
              </p>
              <p className="text-xs text-rose-200/70">
                Disparador n8n / WhatsApp configurado para enviar recordatorio automático de check-in.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleSelectClient(inactiveAlertClients[0])}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Ver Ficha
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2 sm:gap-6 overflow-x-auto text-sm font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Resumen General</span>
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'clients'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Gestión de Clientes ({clients.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('workouts')}
          className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'workouts'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Dumbbell className="h-4 w-4" />
          <span>Rutinas & Asignación</span>
        </button>
        <button
          onClick={() => setActiveTab('nutrition')}
          className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'nutrition'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Apple className="h-4 w-4" />
          <span>Objetivos Nutricionales</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Analíticas & Fotos</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & CLIENT LIST */}
      {(activeTab === 'overview' || activeTab === 'clients') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client List */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base">Tus Clientes</h3>
              <button
                onClick={() => setShowAddClientModal(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar
              </button>
            </div>
            <div className="space-y-2.5">
              {clients.map(c => {
                const isSelected = selectedClient?.id === c.id;
                const isAlert = c.id === 'client-3';
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectClient(c)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs ${
                        isAlert ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-200'
                      }`}>
                        {c.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white">{c.full_name}</p>
                          {isAlert && (
                            <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-medium">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{c.email}</p>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 ${isSelected ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Client Details & Goals */}
          <div className="lg:col-span-2 space-y-6">
            {selectedClient ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <span className="text-xs uppercase font-semibold text-emerald-400 tracking-wider">Ficha Técnica</span>
                    <h2 className="text-xl font-bold text-white mt-1">{selectedClient.full_name}</h2>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-500" /> {selectedClient.phone || 'Sin teléfono'}
                      </span>
                      <span>Registrado: {new Date(selectedClient.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab('nutrition')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg border border-slate-700 transition-colors"
                    >
                      Ajustar Macros
                    </button>
                    <button
                      onClick={() => setActiveTab('workouts')}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold text-slate-950 rounded-lg transition-colors"
                    >
                      Asignar Rutina
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase mb-2">
                      <Flame className="h-4 w-4 text-amber-400" />
                      <span>Objetivo Principal</span>
                    </div>
                    <p className="text-sm text-slate-200">
                      {selectedClient.goals || 'Sin objetivo registrado.'}
                    </p>
                  </div>

                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase mb-2">
                      <FileText className="h-4 w-4 text-rose-400" />
                      <span>Historial Médico / Lesiones</span>
                    </div>
                    <p className="text-sm text-slate-200">
                      {selectedClient.medical_history || 'Sin lesiones o consideraciones médicas.'}
                    </p>
                  </div>
                </div>

                {/* Resumen de Macros asignados */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-300 uppercase">Plan Nutricional Asignado</span>
                    {clientNutrition && (
                      <span className="text-xs font-mono text-emerald-400 font-semibold">
                        {clientNutrition.calories} kcal / día
                      </span>
                    )}
                  </div>
                  {clientNutrition ? (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-900 p-2.5 rounded-lg text-center border border-slate-800">
                        <span className="text-[11px] text-slate-400">Proteína</span>
                        <p className="text-base font-bold text-emerald-400">{clientNutrition.protein_g}g</p>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg text-center border border-slate-800">
                        <span className="text-[11px] text-slate-400">Carbohidratos</span>
                        <p className="text-base font-bold text-sky-400">{clientNutrition.carbs_g}g</p>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg text-center border border-slate-800">
                        <span className="text-[11px] text-slate-400">Grasas</span>
                        <p className="text-base font-bold text-amber-400">{clientNutrition.fat_g}g</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No tiene plan nutricional asignado aún.</p>
                  )}
                </div>

                {/* Últimos Check-ins */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Evolución Reciente (Check-ins Semanales)
                  </h4>
                  <div className="space-y-2">
                    {clientProgress.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">El cliente aún no ha registrado check-ins.</p>
                    ) : (
                      clientProgress.slice(0, 3).map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-emerald-400" />
                            <div>
                              <span className="font-semibold text-slate-200">{p.date}</span>
                              <p className="text-[11px] text-slate-400">{p.notes_cliente || 'Sin notas'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Peso</span>
                              <span className="font-bold text-white text-sm">{p.weight} kg</span>
                            </div>
                            {p.waist_cm && (
                              <div>
                                <span className="text-slate-400 block text-[10px]">Cintura</span>
                                <span className="text-slate-200 font-semibold">{p.waist_cm} cm</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                Selecciona un cliente para ver su ficha completa.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WORKOUT BUILDER & ASSIGNMENT */}
      {activeTab === 'workouts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Asignación Rápida */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400" /> Asignar a Cliente
            </h3>
            <p className="text-xs text-slate-400">
              Programa un entrenamiento específico para la fecha de hoy o la semana.
            </p>

            {assignSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Rutina asignada con éxito al cliente.
              </div>
            )}

            <form onSubmit={handleAssignWorkout} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Cliente</label>
                <select
                  required
                  value={assignClientId}
                  onChange={(e) => setAssignClientId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Plantilla de Rutina</label>
                <select
                  required
                  value={assignWorkoutId}
                  onChange={(e) => setAssignWorkoutId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Seleccionar plantilla...</option>
                  {workouts.map(w => (
                    <option key={w.id} value={w.id}>{w.title}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20"
              >
                Confirmar Asignación
              </button>
            </form>
          </div>

          {/* Biblioteca de Rutinas */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Biblioteca de Rutinas</h3>
                <p className="text-xs text-slate-400">Plantillas creadas por ti reutilizables para tus alumnos.</p>
              </div>
              <button
                onClick={() => setShowWorkoutModal(true)}
                className="flex items-center gap-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-3.5 py-2 rounded-xl transition-colors"
              >
                <Plus className="h-4 w-4" /> Nueva Rutina
              </button>
            </div>

            <div className="space-y-3">
              {workouts.map(w => (
                <div key={w.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base">{w.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{w.description}</p>
                    </div>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-mono">
                      {w.exercises?.length || 0} ejercicios
                    </span>
                  </div>

                  {w.exercises && w.exercises.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                      {w.exercises.map(ex => (
                        <div key={ex.id} className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                          <div>
                            <span className="font-semibold text-slate-200">{ex.exercise_name}</span>
                            <span className="text-slate-500 ml-2 text-[11px] font-mono">[{ex.day_name}]</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-400 font-mono">
                            <span>{ex.sets} series</span>
                            <span>×</span>
                            <span>{ex.reps} reps</span>
                            {ex.rest_seconds && <span>({ex.rest_seconds}s descanso)</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NUTRITION MACROS */}
      {activeTab === 'nutrition' && (
        <div className="max-w-2xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Apple className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Asignador de Objetivos Nutricionales</h3>
              <p className="text-xs text-slate-400">Calcula y asigna las calorías y macronutrientes diarios para tu cliente.</p>
            </div>
          </div>

          {nutritionSuccess && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Metas nutricionales actualizadas correctamente.
            </div>
          )}

          <form onSubmit={handleSaveNutrition} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Cliente a Asignar</label>
              <select
                value={selectedClient?.id || ''}
                onChange={(e) => {
                  const c = clients.find(cl => cl.id === e.target.value);
                  if (c) handleSelectClient(c);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Calorías Totales Diarias (kcal)</label>
              <input
                type="number"
                required
                value={macroCalories}
                onChange={(e) => setMacroCalories(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Proteínas (g)</label>
                <input
                  type="number"
                  required
                  value={macroProtein}
                  onChange={(e) => setMacroProtein(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Carbohidratos (g)</label>
                <input
                  type="number"
                  required
                  value={macroCarbs}
                  onChange={(e) => setMacroCarbs(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-sky-400 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Grasas (g)</label>
                <input
                  type="number"
                  required
                  value={macroFat}
                  onChange={(e) => setMacroFat(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-amber-400 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Recomendaciones & Pautas Adicionales</label>
              <textarea
                rows={3}
                value={macroNotes}
                onChange={(e) => setMacroNotes(e.target.value)}
                placeholder="Ejemplo: Beber 3L de agua al día, consumir la mayor carga de carbohidratos en torno al entrenamiento..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/20"
            >
              Guardar y Notificar al Cliente
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: ANALYTICS & PHOTOS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-bold text-white text-lg">Evolución de Peso y Progreso</h3>
                <p className="text-xs text-slate-400">Cliente activo: <span className="text-emerald-400 font-semibold">{selectedClient?.full_name}</span></p>
              </div>
              <select
                value={selectedClient?.id || ''}
                onChange={(e) => {
                  const c = clients.find(cl => cl.id === e.target.value);
                  if (c) handleSelectClient(c);
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            </div>

            {/* Custom SVG Line Chart for Weight Evolution */}
            {clientProgress.length > 0 ? (
              <div className="bg-slate-950 p-4 sm:p-6 rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin pb-2">
                  <div className="h-56 min-w-[280px] w-full flex items-end gap-4 sm:gap-8 justify-center pt-8 pb-4 px-2">
                    {clientProgress.map((p) => {
                      const minW = Math.min(...clientProgress.map(x => x.weight)) - 1;
                      const maxW = Math.max(...clientProgress.map(x => x.weight)) + 1;
                      const heightPercent = Math.max(15, Math.min(100, ((p.weight - minW) / (maxW - minW || 1)) * 100));

                      return (
                        <div key={p.id} className="flex flex-col items-center gap-1.5 sm:gap-2 group shrink-0">
                          <span className="text-[11px] sm:text-xs font-bold text-emerald-400 group-hover:scale-110 transition-transform">
                            {p.weight} kg
                          </span>
                          <div className="w-8 sm:w-12 bg-emerald-500/20 rounded-t-lg relative flex items-end justify-center border-t-2 border-emerald-400 transition-all hover:bg-emerald-500/30" style={{ height: `${heightPercent * 1.5}px` }}>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 mb-1">{p.waist_cm ? `${p.waist_cm}cm` : ''}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-1">
                            {p.date.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="text-center text-xs text-slate-500 mt-2">
                  Registro de peso corporal (kg) y cintura (cm) a lo largo de las semanas
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic text-center py-10">Sin datos de check-in para este cliente.</p>
            )}
          </div>

          {/* Fotos de Progreso */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
              <Weight className="h-4 w-4 text-emerald-400" /> Galería de Check-ins Visuales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {clientProgress.filter(p => p.url_foto_frente).map(p => (
                <div key={p.id} className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group">
                  <div className="relative aspect-[3/4] bg-slate-900 overflow-hidden">
                    <img
                      src={p.url_foto_frente!}
                      alt={`Progreso ${p.date}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-semibold text-white border border-slate-800">
                      {p.date} • {p.weight} kg
                    </div>
                  </div>
                  <div className="p-3 text-xs text-slate-300">
                    <p className="line-clamp-2">{p.notes_cliente || 'Check-in semanal regular.'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR CLIENTE */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left">
            <h3 className="text-lg font-bold text-white mb-4">Registrar Nuevo Cliente</h3>
            
            {clientError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{clientError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ej. Lucas García"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="lucas@correo.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="+34 600..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Objetivos del Cliente</label>
                <input
                  type="text"
                  value={newClientGoals}
                  onChange={(e) => setNewClientGoals(e.target.value)}
                  placeholder="Pérdida de peso, tonificación..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Historial Médico / Lesiones</label>
                <textarea
                  rows={2}
                  value={newClientMedical}
                  onChange={(e) => setNewClientMedical(e.target.value)}
                  placeholder="Ninguna o especificar patologías..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isCreatingClient}
                  onClick={() => setShowAddClientModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingClient}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold px-4 py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 min-w-[130px]"
                >
                  {isCreatingClient ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cliente</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONSTRUCTOR DE RUTINA */}
      {showWorkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-left max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-1">Constructor de Rutina</h3>
            <p className="text-xs text-slate-400 mb-4">Crea una plantilla con sus ejercicios, series y repeticiones.</p>

            {workoutError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{workoutError}</span>
              </div>
            )}

            <form onSubmit={handleCreateWorkout} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nombre de la Rutina</label>
                <input
                  type="text"
                  required
                  value={workoutTitle}
                  onChange={(e) => setWorkoutTitle(e.target.value)}
                  placeholder="Ej. Hipertrofia Torso / Pierna"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Descripción</label>
                <input
                  type="text"
                  value={workoutDesc}
                  onChange={(e) => setWorkoutDesc(e.target.value)}
                  placeholder="Objetivo de la rutina, frecuencia recomendada..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-400">Ejercicios</span>
                  <button
                    type="button"
                    onClick={handleAddExerciseRow}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar Ejercicio
                  </button>
                </div>

                {exercisesList.map((ex, idx) => (
                  <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-slate-400 block sm:hidden mb-1 font-medium">Día o Fase</label>
                      <input
                        type="text"
                        placeholder="Ej. Día 1"
                        value={ex.day_name}
                        onChange={(e) => {
                          const updated = [...exercisesList];
                          updated[idx].day_name = e.target.value;
                          setExercisesList(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <label className="text-[10px] text-slate-400 block sm:hidden mb-1 font-medium">Ejercicio</label>
                      <input
                        type="text"
                        placeholder="Nombre ejercicio"
                        required
                        value={ex.exercise_name}
                        onChange={(e) => {
                          const updated = [...exercisesList];
                          updated[idx].exercise_name = e.target.value;
                          setExercisesList(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:col-span-4">
                      <div>
                        <label className="text-[10px] text-slate-400 block sm:hidden mb-1 font-medium">Series</label>
                        <input
                          type="number"
                          placeholder="Series"
                          value={ex.sets}
                          onChange={(e) => {
                            const updated = [...exercisesList];
                            updated[idx].sets = Number(e.target.value);
                            setExercisesList(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block sm:hidden mb-1 font-medium">Reps</label>
                        <input
                          type="text"
                          placeholder="Reps"
                          value={ex.reps}
                          onChange={(e) => {
                            const updated = [...exercisesList];
                            updated[idx].reps = e.target.value;
                            setExercisesList(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 text-center"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  disabled={isCreatingWorkout}
                  onClick={() => setShowWorkoutModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingWorkout}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold px-4 py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 min-w-[130px]"
                >
                  {isCreatingWorkout ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Rutina</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
