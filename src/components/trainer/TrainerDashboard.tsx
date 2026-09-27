import React, { useState, useEffect, useMemo } from 'react';
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
  Loader2,
  Search,
  Target,
  CheckCircle2,
  ArrowUpRight,
  Trash2,
  Utensils,
  Copy,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService, INITIAL_DEMO_PROGRESS } from '../../services/dataService';
import { Profile, Workout, ProgressLog, NutritionGoal, DayDietPlan, MealSlot, MealFoodItem } from '../../types/database';
import { exportNutritionPlanToPDF } from '../../utils/pdfExport';

function createDefaultMeals(count: number): MealSlot[] {
  const defaultNamesMap: Record<number, string[]> = {
    2: ['Comida 1: Desayuno / Almuerzo', 'Comida 2: Cena'],
    3: ['Comida 1: Desayuno', 'Comida 2: Almuerzo', 'Comida 3: Cena'],
    4: ['Comida 1: Desayuno', 'Comida 2: Almuerzo', 'Comida 3: Merienda', 'Comida 4: Cena'],
    5: ['Comida 1: Desayuno', 'Comida 2: Media Mañana', 'Comida 3: Almuerzo', 'Comida 4: Merienda', 'Comida 5: Cena'],
    6: ['Comida 1: Desayuno', 'Comida 2: Media Mañana', 'Comida 3: Almuerzo', 'Comida 4: Merienda', 'Comida 5: Cena', 'Comida 6: Post-Entreno']
  };

  const timesMap: Record<number, string[]> = {
    2: ['11:00', '20:30'],
    3: ['08:30', '14:00', '21:00'],
    4: ['08:30', '13:30', '17:30', '21:00'],
    5: ['08:00', '11:00', '14:00', '17:30', '21:00'],
    6: ['08:00', '11:00', '14:00', '17:00', '19:30', '21:30']
  };

  const names = defaultNamesMap[count] || Array.from({ length: count }, (_, i) => `Comida ${i + 1}`);
  const times = timesMap[count] || Array.from({ length: count }, () => '12:00');

  return names.map((name, i) => ({
    id: `meal-${Date.now()}-${i + 1}-${Math.random().toString(36).substring(2, 6)}`,
    meal_number: i + 1,
    name: name,
    time_suggested: times[i] || '12:00',
    foods: []
  }));
}

export const TrainerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'workouts' | 'nutrition' | 'analytics'>('overview');

  const [clients, setClients] = useState<Profile[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);
  const [clientProgress, setClientProgress] = useState<ProgressLog[]>([]);
  const [clientNutrition, setClientNutrition] = useState<NutritionGoal | null>(null);
  const [clientSearch, setClientSearch] = useState('');

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

  // Asignar nutrición y dietas
  const [macroCalories, setMacroCalories] = useState(2200);
  const [macroProtein, setMacroProtein] = useState(160);
  const [macroCarbs, setMacroCarbs] = useState(230);
  const [macroFat, setMacroFat] = useState(65);
  const [macroNotes, setMacroNotes] = useState('');
  const [nutritionSuccess, setNutritionSuccess] = useState(false);
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [dietDays, setDietDays] = useState<DayDietPlan[]>([
    {
      id: 'day-std',
      day_name: 'Todos los días (Estándar)',
      meals: createDefaultMeals(4)
    }
  ]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [newDayName, setNewDayName] = useState('Lunes');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

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
      const count = nut.meals_per_day || 4;
      setMealsPerDay(count);
      if (nut.diet_days && nut.diet_days.length > 0) {
        setDietDays(nut.diet_days);
      } else {
        setDietDays([
          {
            id: `day-${Date.now()}`,
            day_name: 'Todos los días (Estándar)',
            meals: createDefaultMeals(count)
          }
        ]);
      }
      setActiveDayIndex(0);
    } else {
      setMacroCalories(2200);
      setMacroProtein(160);
      setMacroCarbs(230);
      setMacroFat(65);
      setMacroNotes('');
      setMealsPerDay(4);
      setDietDays([
        {
          id: `day-${Date.now()}`,
          day_name: 'Todos los días (Estándar)',
          meals: createDefaultMeals(4)
        }
      ]);
      setActiveDayIndex(0);
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

  const handleChangeMealsPerDay = (newCount: number) => {
    setMealsPerDay(newCount);
    setDietDays(prevDays => {
      return prevDays.map((day, idx) => {
        if (idx !== activeDayIndex) return day;
        let newMeals = [...day.meals];
        if (newMeals.length < newCount) {
          const extraDefaults = createDefaultMeals(newCount);
          for (let i = newMeals.length; i < newCount; i++) {
            newMeals.push({
              ...extraDefaults[i],
              id: `meal-${Date.now()}-${i + 1}-${Math.random().toString(36).substring(2, 6)}`,
              meal_number: i + 1,
            });
          }
        } else if (newMeals.length > newCount) {
          newMeals = newMeals.slice(0, newCount);
        }
        return { ...day, meals: newMeals };
      });
    });
  };

  const handleAddDay = (dayName: string) => {
    const trimmed = dayName.trim() || `Día ${dietDays.length + 1}`;
    const newDay: DayDietPlan = {
      id: `day-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      day_name: trimmed,
      meals: createDefaultMeals(mealsPerDay)
    };
    setDietDays(prev => [...prev, newDay]);
    setActiveDayIndex(dietDays.length);
  };

  const handleDuplicateCurrentDay = () => {
    const current = dietDays[activeDayIndex];
    if (!current) return;
    const duplicated: DayDietPlan = {
      id: `day-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      day_name: `${current.day_name} (Copia)`,
      meals: current.meals.map((m, mIdx) => ({
        ...m,
        id: `meal-${Date.now()}-${mIdx + 1}-${Math.random().toString(36).substring(2, 6)}`,
        foods: m.foods.map(f => ({
          ...f,
          id: `food-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        }))
      }))
    };
    setDietDays(prev => [...prev, duplicated]);
    setActiveDayIndex(dietDays.length);
  };

  const handleRemoveDay = (index: number) => {
    if (dietDays.length <= 1) return;
    setDietDays(prev => prev.filter((_, i) => i !== index));
    if (activeDayIndex >= index && activeDayIndex > 0) {
      setActiveDayIndex(activeDayIndex - 1);
    }
  };

  const handleUpdateMealMeta = (mealIndex: number, field: 'name' | 'time_suggested', value: string) => {
    setDietDays(prev => {
      const updated = [...prev];
      const day = { ...updated[activeDayIndex] };
      const meals = [...day.meals];
      meals[mealIndex] = { ...meals[mealIndex], [field]: value };
      day.meals = meals;
      updated[activeDayIndex] = day;
      return updated;
    });
  };

  const handleAddFoodToMeal = (mealIndex: number) => {
    setDietDays(prev => {
      const updated = [...prev];
      const day = { ...updated[activeDayIndex] };
      const meals = [...day.meals];
      const foods = [...meals[mealIndex].foods];
      foods.push({
        id: `food-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: '',
        portion: '100g',
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0
      });
      meals[mealIndex] = { ...meals[mealIndex], foods };
      day.meals = meals;
      updated[activeDayIndex] = day;
      return updated;
    });
  };

  const handleUpdateFoodItem = (mealIndex: number, foodIndex: number, field: keyof MealFoodItem, value: any) => {
    setDietDays(prev => {
      const updated = [...prev];
      const day = { ...updated[activeDayIndex] };
      const meals = [...day.meals];
      const foods = [...meals[mealIndex].foods];
      foods[foodIndex] = { ...foods[foodIndex], [field]: value };
      meals[mealIndex] = { ...meals[mealIndex], foods };
      day.meals = meals;
      updated[activeDayIndex] = day;
      return updated;
    });
  };

  const handleRemoveFoodItem = (mealIndex: number, foodIndex: number) => {
    setDietDays(prev => {
      const updated = [...prev];
      const day = { ...updated[activeDayIndex] };
      const meals = [...day.meals];
      const foods = meals[mealIndex].foods.filter((_, i) => i !== foodIndex);
      meals[mealIndex] = { ...meals[mealIndex], foods };
      day.meals = meals;
      updated[activeDayIndex] = day;
      return updated;
    });
  };

  const currentDietDay = dietDays[activeDayIndex] || dietDays[0];

  const calculatedDayTotals = useMemo(() => {
    if (!currentDietDay) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    let cal = 0, p = 0, c = 0, f = 0;
    currentDietDay.meals?.forEach(m => {
      m.foods?.forEach(item => {
        cal += Number(item.calories) || 0;
        p += Number(item.protein_g) || 0;
        c += Number(item.carbs_g) || 0;
        f += Number(item.fat_g) || 0;
      });
    });
    return { calories: cal, protein: p, carbs: c, fat: f };
  }, [currentDietDay]);

  const handleSyncCalculatedWithMacros = () => {
    setMacroCalories(calculatedDayTotals.calories);
    setMacroProtein(calculatedDayTotals.protein);
    setMacroCarbs(calculatedDayTotals.carbs);
    setMacroFat(calculatedDayTotals.fat);
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
      meals_per_day: Number(mealsPerDay),
      diet_days: dietDays,
      start_date: new Date().toISOString().split('T')[0],
      notes: macroNotes,
    });
    setClientNutrition(updated);
    setNutritionSuccess(true);
    setTimeout(() => setNutritionSuccess(false), 3000);
  };

  const handleExportPDF = async () => {
    if (!selectedClient || isExportingPDF) return;
    setIsExportingPDF(true);
    try {
      await exportNutritionPlanToPDF({
        clientName: selectedClient.full_name,
        clientEmail: selectedClient.email,
        coachName: profile?.full_name || 'Coach FitSync',
        nutrition: {
          calories: Number(macroCalories),
          protein_g: Number(macroProtein),
          carbs_g: Number(macroCarbs),
          fat_g: Number(macroFat),
          meals_per_day: Number(mealsPerDay),
          notes: macroNotes,
          diet_days: dietDays,
        },
      });
    } finally {
      setIsExportingPDF(false);
    }
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

      {/* TAB 1: RESUMEN GENERAL (EXECUTIVE COACH OVERVIEW) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Action Hub */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  Panel de Control Diario
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Resumen de actividad en tiempo real, estado de adherencia y alertas de tus clientes.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowAddClientModal(true)}
                  className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nuevo Atleta</span>
                </button>
                <button
                  onClick={() => setShowWorkoutModal(true)}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Nueva Rutina</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Live Daily Athlete Activity & Status */}
            <div className="lg:col-span-8 space-y-6">
              {/* Daily Athlete Status Feed */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="font-bold text-white text-base">Estado Diario de Atletas</h4>
                    <p className="text-xs text-slate-400">Cumplimiento de entrenamientos y nutrición de hoy</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('clients')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <span>Ver todos</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {clients.map(c => {
                    const isInactive = c.id === 'client-3';
                    const hasNutrition = c.id === 'client-1' || c.id === 'client-2';

                    return (
                      <div
                        key={c.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isInactive
                            ? 'bg-rose-500/5 border-rose-500/30'
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isInactive ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {c.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-white text-sm">{c.full_name}</h5>
                                {isInactive ? (
                                  <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-semibold border border-rose-500/30 flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Inactivo hace 4 días
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Al día
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                                <strong className="text-slate-300">Meta:</strong> {c.goals || 'Sin objetivo definido'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => {
                                handleSelectClient(c);
                                setActiveTab('clients');
                              }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors border border-slate-700"
                            >
                              Ficha Técnica
                            </button>
                            {isInactive ? (
                              <a
                                href={`https://wa.me/${(c.phone || '').replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(c.full_name.split(' ')[0])},%20¿cómo%20va%20la%20semana?%20Recuerda%20hacer%20tu%20check-in%20en%20FitSync.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1"
                              >
                                <span>Recordar</span>
                              </a>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedClient(c);
                                  setActiveTab('workouts');
                                }}
                                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-bold text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors"
                              >
                                Rutina
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Sub-bar with nutrition & check-in info */}
                        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-500 block">Plan Nutricional:</span>
                            <span className="text-slate-300 font-medium">
                              {hasNutrition ? (c.id === 'client-1' ? '2200 kcal (165g P)' : '1800 kcal (130g P)') : 'Sin asignar'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Entrenamiento:</span>
                            <span className="text-slate-300 font-medium">
                              {isInactive ? 'Pendiente' : 'Completado hoy'}
                            </span>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-slate-500 block">Último Peso:</span>
                            <span className="text-emerald-400 font-bold font-mono">
                              {c.id === 'client-1' ? '82.2 kg (-2.3kg)' : c.id === 'client-3' ? '79.0 kg' : '64.0 kg'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Progress Check-ins Preview */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Weight className="h-4 w-4 text-emerald-400" />
                    <div>
                      <h4 className="font-bold text-white text-base">Últimos Check-ins Recibidos</h4>
                      <p className="text-xs text-slate-400">Pesajes y fotos enviadas por los atletas esta semana</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <span>Ver galería</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {INITIAL_DEMO_PROGRESS.slice(2, 4).map(p => (
                    <div key={p.id} className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex gap-3 p-3">
                      {p.url_foto_frente ? (
                        <img
                          src={p.url_foto_frente}
                          alt="Progreso atleta"
                          className="h-20 w-16 rounded-lg object-cover border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="h-20 w-16 rounded-lg bg-slate-900 flex items-center justify-center text-slate-500 shrink-0">
                          <Weight className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between text-xs">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-sm">{p.weight} kg</span>
                            <span className="text-[10px] text-slate-400 font-mono">{p.date}</span>
                          </div>
                          {p.waist_cm && (
                            <span className="text-[11px] text-slate-400">{p.waist_cm} cm cintura</span>
                          )}
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 italic">
                            "{p.notes_cliente || 'Check-in semanal enviado.'}"
                          </p>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-medium">Carlos Mendoza</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Adherence & Quick Breakdown */}
            <div className="lg:col-span-4 space-y-6">
              {/* Adherence Rate Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Adherencia del Equipo</span>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                    Semana Actual
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">88%</span>
                  <span className="text-xs text-emerald-400 font-medium flex items-center">
                    <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> +4% vs mes anterior
                  </span>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: '88%' }}></div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Entrenamientos realizados:</span>
                    <span className="font-semibold text-white">22 de 25</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Metas de macros cumplidas:</span>
                    <span className="font-semibold text-white">84%</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Check-ins semanales recibidos:</span>
                    <span className="font-semibold text-white">2 de 3</span>
                  </div>
                </div>
              </div>

              {/* Goals Distribution */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Target className="h-4 w-4 text-emerald-400" />
                  <span>Distribución de Objetivos</span>
                </div>

                <div className="space-y-2.5 pt-1 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Pérdida de Grasa & Definición</span>
                      <span className="font-bold text-white">1 atleta</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: '33%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Hipertrofia & Ganancia Muscular</span>
                      <span className="font-bold text-white">1 atleta</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: '33%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Tonificación & Resistencia</span>
                      <span className="font-bold text-white">1 atleta</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-sky-400 h-full rounded-full" style={{ width: '33%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GESTIÓN DE CLIENTES (FICHA TÉCNICA Y CRM) */}
      {activeTab === 'clients' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client List with Search */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Directorio de Clientes</h3>
              <button
                onClick={() => setShowAddClientModal(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar
              </button>
            </div>

            {/* Buscador */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto scrollbar-thin pr-1">
              {clients
                .filter(c => 
                  c.full_name.toLowerCase().includes(clientSearch.toLowerCase()) || 
                  c.email.toLowerCase().includes(clientSearch.toLowerCase())
                )
                .map(c => {
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

      {/* TAB 3: NUTRITION & DIET PLANNER */}
      {activeTab === 'nutrition' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                  <Apple className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    Planificador de Dietas y Objetivos Nutricionales
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Diseña dietas completas por alimentos y macronutrientes, distribuidas por comidas y días para tu cliente.
                  </p>
                </div>
              </div>

              {/* Acciones de Cabecera: Exportar PDF y Selector de Cliente */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  disabled={isExportingPDF}
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Descargar directamente el plan nutricional en formato PDF"
                >
                  {isExportingPDF ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                      <span>Descargando PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Descargar PDF</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium pl-2">Cliente:</span>
                  <select
                    value={selectedClient?.id || ''}
                    onChange={(e) => {
                      const c = clients.find(cl => cl.id === e.target.value);
                      if (c) handleSelectClient(c);
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {nutritionSuccess && (
              <div className="mt-4 p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2.5 animate-fadeIn">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span className="font-semibold">¡Plan de dieta y metas nutricionales guardados correctamente!</span>
              </div>
            )}
          </div>

          {/* Barra de Configuración: Cantidad de Comidas y Selector de Días */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              {/* Selector de cantidad de comidas por día */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="h-3.5 w-3.5 text-emerald-400" />
                  Cantidad de Comidas por Día
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[2, 3, 4, 5, 6].map(count => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => handleChangeMealsPerDay(count)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        mealsPerDay === count
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {count} {count === 1 ? 'comida' : 'comidas'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Acciones de Días */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowAddDayModal(true)}
                  className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Agregar Día</span>
                </button>
                <button
                  type="button"
                  onClick={handleDuplicateCurrentDay}
                  title="Duplicar comidas y alimentos de este día"
                  className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Duplicar Día</span>
                </button>
                {dietDays.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDay(activeDayIndex)}
                    title="Eliminar este día de la dieta"
                    className="flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Pestañas de Días */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {dietDays.map((d, idx) => (
                <button
                  key={d.id || idx}
                  type="button"
                  onClick={() => setActiveDayIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                    activeDayIndex === idx
                      ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{d.day_name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {d.meals?.length || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Constructor de Comidas y Alimentos del Día Activo */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <span>Comidas para:</span>
                  <span className="text-emerald-400 font-extrabold">{currentDietDay?.day_name || 'Día 1'}</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Ingresa cada alimento con sus calorías y macronutrientes para cada comida del día.
                </p>
              </div>

              {/* Botón sincronizar */}
              <button
                type="button"
                onClick={handleSyncCalculatedWithMacros}
                className="flex items-center gap-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold px-3 py-1.5 rounded-xl transition-all"
                title="Copiar las calorías y macros calculadas de los alimentos a los objetivos diarios"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Sincronizar totales con macros</span>
              </button>
            </div>

            {/* Listado de Comidas del Día */}
            <div className="space-y-4">
              {currentDietDay?.meals?.map((meal, mIdx) => {
                // Cálculo de subtotales por comida
                const mealKcal = meal.foods?.reduce((sum, f) => sum + (Number(f.calories) || 0), 0) || 0;
                const mealProt = meal.foods?.reduce((sum, f) => sum + (Number(f.protein_g) || 0), 0) || 0;
                const mealCarbs = meal.foods?.reduce((sum, f) => sum + (Number(f.carbs_g) || 0), 0) || 0;
                const mealFat = meal.foods?.reduce((sum, f) => sum + (Number(f.fat_g) || 0), 0) || 0;

                return (
                  <div key={meal.id || mIdx} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3.5">
                    {/* Cabecera de la Comida */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                          Comida {meal.meal_number}
                        </span>
                        <input
                          type="text"
                          value={meal.name}
                          onChange={(e) => handleUpdateMealMeta(mIdx, 'name', e.target.value)}
                          placeholder="Nombre (ej. Desayuno, Almuerzo...)"
                          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 min-w-[200px]"
                        />
                        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <input
                            type="time"
                            value={meal.time_suggested || '12:00'}
                            onChange={(e) => handleUpdateMealMeta(mIdx, 'time_suggested', e.target.value)}
                            className="bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      {/* Subtotal de la Comida */}
                      <div className="flex items-center gap-1.5 text-[11px] font-mono shrink-0">
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-200 border border-slate-800 font-bold">
                          {mealKcal} kcal
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {mealProt}g P
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          {mealCarbs}g C
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {mealFat}g G
                        </span>
                      </div>
                    </div>

                    {/* Tabla de Alimentos */}
                    <div className="space-y-2">
                      {meal.foods && meal.foods.length > 0 ? (
                        <div className="space-y-2">
                          <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-[10px] uppercase font-bold text-slate-400 px-2">
                            <span className="col-span-4">Nombre del Alimento</span>
                            <span className="col-span-2">Porción / Cantidad</span>
                            <span className="col-span-2">Calorías (kcal)</span>
                            <span className="col-span-1 text-emerald-400">P (g)</span>
                            <span className="col-span-1 text-sky-400">C (g)</span>
                            <span className="col-span-1 text-amber-400">G (g)</span>
                            <span className="col-span-1 text-right">Borrar</span>
                          </div>

                          {meal.foods.map((food, fIdx) => (
                            <div
                              key={food.id || fIdx}
                              className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 sm:p-2 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                            >
                              <div className="sm:col-span-4">
                                <label className="sm:hidden block text-[10px] text-slate-400 mb-0.5">Alimento:</label>
                                <input
                                  type="text"
                                  value={food.name}
                                  onChange={(e) => handleUpdateFoodItem(mIdx, fIdx, 'name', e.target.value)}
                                  placeholder="Ej. Pechuga de pollo / Avena"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="sm:hidden block text-[10px] text-slate-400 mb-0.5">Porción:</label>
                                <input
                                  type="text"
                                  value={food.portion || ''}
                                  onChange={(e) => handleUpdateFoodItem(mIdx, fIdx, 'portion', e.target.value)}
                                  placeholder="Ej. 150g, 2 huevos"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="sm:hidden block text-[10px] text-slate-400 mb-0.5">Calorías (kcal):</label>
                                <input
                                  type="number"
                                  value={food.calories}
                                  onChange={(e) => handleUpdateFoodItem(mIdx, fIdx, 'calories', Number(e.target.value))}
                                  placeholder="Kcal"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div className="grid grid-cols-3 sm:contents gap-2">
                                <div className="sm:col-span-1">
                                  <label className="sm:hidden block text-[10px] text-emerald-400 mb-0.5">Proteína (g):</label>
                                  <input
                                    type="number"
                                    value={food.protein_g}
                                    onChange={(e) => handleUpdateFoodItem(mIdx, fIdx, 'protein_g', Number(e.target.value))}
                                    placeholder="P (g)"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 text-center"
                                  />
                                </div>

                                <div className="sm:col-span-1">
                                  <label className="sm:hidden block text-[10px] text-sky-400 mb-0.5">Carbos (g):</label>
                                  <input
                                    type="number"
                                    value={food.carbs_g}
                                    onChange={(e) => handleUpdateFoodItem(mIdx, fIdx, 'carbs_g', Number(e.target.value))}
                                    placeholder="C (g)"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1.5 text-xs text-sky-400 font-mono focus:outline-none focus:border-emerald-500 text-center"
                                  />
                                </div>

                                <div className="sm:col-span-1">
                                  <label className="sm:hidden block text-[10px] text-amber-400 mb-0.5">Grasas (g):</label>
                                  <input
                                    type="number"
                                    value={food.fat_g}
                                    onChange={(e) => handleUpdateFoodItem(mIdx, fIdx, 'fat_g', Number(e.target.value))}
                                    placeholder="G (g)"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1.5 text-xs text-amber-400 font-mono focus:outline-none focus:border-emerald-500 text-center"
                                  />
                                </div>
                              </div>

                              <div className="sm:col-span-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFoodItem(mIdx, fIdx)}
                                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-900 transition-colors"
                                  title="Eliminar alimento"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                          No hay alimentos agregados a esta comida todavía.
                        </div>
                      )}

                      {/* Botón agregar alimento */}
                      <button
                        type="button"
                        onClick={() => handleAddFoodToMeal(mIdx)}
                        className="w-full py-2 bg-slate-950/80 hover:bg-slate-950 border border-slate-800/80 hover:border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Añadir Alimento a Comida {meal.meal_number}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumen Calculado de la Dieta & Formulario de Objetivos */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
            {/* Banner de Totales Calculados */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  Totales Calculados para {currentDietDay?.day_name}
                </span>
                <div className="flex flex-wrap items-center gap-3 font-mono">
                  <div className="text-white text-base font-extrabold">
                    {calculatedDayTotals.calories} <span className="text-xs text-slate-400 font-normal">kcal</span>
                  </div>
                  <div className="text-emerald-400 text-sm font-bold">
                    {calculatedDayTotals.protein}g <span className="text-xs text-slate-400 font-normal">Proteína</span>
                  </div>
                  <div className="text-sky-400 text-sm font-bold">
                    {calculatedDayTotals.carbs}g <span className="text-xs text-slate-400 font-normal">Carbohidratos</span>
                  </div>
                  <div className="text-amber-400 text-sm font-bold">
                    {calculatedDayTotals.fat}g <span className="text-xs text-slate-400 font-normal">Grasas</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSyncCalculatedWithMacros}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 shrink-0"
              >
                <Sparkles className="h-4 w-4" />
                <span>Aplicar a Objetivos Diarios</span>
              </button>
            </div>

            {/* Formulario de Metas y Recomendaciones */}
            <form onSubmit={handleSaveNutrition} className="space-y-4">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">
                Objetivos Diarios Asignados al Atleta
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Calorías Diarias (kcal)</label>
                  <input
                    type="number"
                    required
                    value={macroCalories}
                    onChange={(e) => setMacroCalories(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
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
                  placeholder="Ejemplo: Tomar 2.5L de agua al día, consumir la comida con mayor carga de carbohidratos después de entrenar..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Guardar Dieta y Notificar al Cliente</span>
              </button>
            </form>
          </div>

          {/* Modal para Agregar Nuevo Día */}
          {showAddDayModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <h4 className="text-base font-bold text-white">Agregar Nuevo Día al Plan</h4>
                <p className="text-xs text-slate-400">
                  Selecciona un día de la semana o escribe un nombre personalizado para este día.
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo', 'Día Alto en Carbos', 'Día de Descanso'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setNewDayName(day)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        newDayName === day
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nombre del Día</label>
                  <input
                    type="text"
                    value={newDayName}
                    onChange={(e) => setNewDayName(e.target.value)}
                    placeholder="Ej. Lunes o Día de Pierna"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddDayModal(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (newDayName.trim()) {
                        handleAddDay(newDayName.trim());
                        setShowAddDayModal(false);
                      }
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
                  >
                    Crear Día
                  </button>
                </div>
              </div>
            </div>
          )}
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
