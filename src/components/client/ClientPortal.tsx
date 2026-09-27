import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Dumbbell,
  Apple,
  Camera,
  Calendar,
  Flame,
  Droplets,
  ChevronRight,
  TrendingDown,
  Sparkles,
  UploadCloud,
  Check,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { WorkoutAssignment, NutritionGoal, ProgressLog, DailyNutritionLog } from '../../types/database';

export const ClientPortal: React.FC = () => {
  const { profile } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [assignment, setAssignment] = useState<WorkoutAssignment | null>(null);
  const [nutrition, setNutrition] = useState<NutritionGoal | null>(null);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyNutritionLog>({
    id: 'temp',
    client_id: profile?.id || 'client-1',
    date: todayStr,
    calories_met: false,
    protein_met: false,
    water_liters: 2.0,
  });

  // Ejercicios marcados hoy
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});

  // Modal de Check-in Semanal
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentWaist, setCurrentWaist] = useState('');
  const [currentChest, setCurrentChest] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [photoFront, setPhotoFront] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [checkinSuccess, setCheckinSuccess] = useState(false);

  useEffect(() => {
    loadClientData();
  }, [profile?.id]);

  const loadClientData = async () => {
    const cId = profile?.id || 'client-1';
    const assign = await dataService.getTodayAssignment(cId, todayStr);
    const nut = await dataService.getNutritionGoal(cId);
    const prog = await dataService.getProgressLogs(cId);
    const dLog = await dataService.getDailyLog(cId, todayStr);

    setAssignment(assign);
    setNutrition(nut);
    setProgressLogs(prog);
    setDailyLog(dLog);
  };

  const handleToggleExercise = (exerciseId: string) => {
    setCompletedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId],
    }));
  };

  const handleFinishWorkout = async () => {
    if (!assignment) return;
    await dataService.toggleWorkoutCompletion(assignment.id, !assignment.completed);
    setAssignment({ ...assignment, completed: !assignment.completed });
  };

  const handleToggleDailyNut = async (key: 'calories_met' | 'protein_met') => {
    const updated = {
      ...dailyLog,
      [key]: !dailyLog[key],
    };
    setDailyLog(updated);
    await dataService.updateDailyLog(updated);
  };

  const handleAdjustWater = async (delta: number) => {
    const updated = {
      ...dailyLog,
      water_liters: Math.max(0, Math.round((dailyLog.water_liters + delta) * 10) / 10),
    };
    setDailyLog(updated);
    await dataService.updateDailyLog(updated);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFront(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cId = profile?.id || 'client-1';
    let photoUrl = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80';

    if (photoFront) {
      const uploaded = await dataService.uploadProgressPhoto(photoFront, cId);
      if (uploaded) photoUrl = uploaded;
    }

    const newLog = await dataService.logProgress({
      client_id: cId,
      date: todayStr,
      weight: parseFloat(currentWeight),
      waist_cm: currentWaist ? parseFloat(currentWaist) : undefined,
      chest_cm: currentChest ? parseFloat(currentChest) : undefined,
      notes_cliente: clientNotes,
      url_foto_frente: photoUrl,
    });

    setProgressLogs([newLog, ...progressLogs]);
    setCheckinSuccess(true);
    setTimeout(() => {
      setCheckinSuccess(false);
      setShowCheckinModal(false);
      setCurrentWeight('');
      setCurrentWaist('');
      setCurrentChest('');
      setClientNotes('');
      setPhotoPreview(null);
    }, 1500);
  };

  const lastLog = progressLogs[progressLogs.length - 1];
  const firstLog = progressLogs[0];
  const weightDiff = (lastLog && firstLog && lastLog !== firstLog)
    ? (lastLog.weight - firstLog.weight).toFixed(1)
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header adaptable a móvil y escritorio */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold mb-2">
              <Sparkles className="h-3 w-3" /> Plan Personalizado
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              ¡A entrenar, {profile?.full_name?.split(' ')[0] || 'Atleta'}!
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Hoy es {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button
            onClick={() => setShowCheckinModal(true)}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 self-start sm:self-auto"
          >
            <Camera className="h-4 w-4" />
            <span>Realizar Check-in Semanal</span>
          </button>
        </div>

        {/* Quick Progress Badge */}
        {weightDiff && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Progreso acumulado:</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5" /> {weightDiff} kg desde el inicio
            </span>
          </div>
        )}
      </div>

      {/* Grid responsivo: 1 columna en móvil, 2 columnas en pantallas medianas/grandes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Qué hacer hoy & Nutrición */}
        <div className="lg:col-span-7 space-y-6">

      {/* SECCIÓN 1: QUÉ TENGO QUE HACER HOY (REQUERIMIENTO 3.2 DEL PLAN) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            Qué tengo que hacer hoy
          </h2>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
            {assignment?.completed ? '100% Completado' : 'Pendiente'}
          </span>
        </div>

        {/* Tarjeta de Entrenamiento del Día */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                assignment?.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'
              }`}>
                <Dumbbell className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Entrenamiento Asignado</span>
                <h3 className="font-bold text-white text-base">
                  {assignment?.workout?.title || 'Fuerza & Hipertrofia (Push / Pull)'}
                </h3>
              </div>
            </div>
            {assignment?.completed && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
                <Check className="h-3.5 w-3.5" /> ¡Listo!
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400">
            {assignment?.workout?.description || 'Rutina para ganancia de fuerza muscular y resistencia.'}
          </p>

          {/* Lista de Ejercicios Interactiva */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {(assignment?.workout?.exercises || [
              { id: 'ex-1', exercise_name: 'Press de Banca Plano', sets: 4, reps: '8-10', rest_seconds: 90, day_name: 'Día 1' },
              { id: 'ex-2', exercise_name: 'Press Militar Mancuernas', sets: 3, reps: '10-12', rest_seconds: 75, day_name: 'Día 1' },
              { id: 'ex-3', exercise_name: 'Fondos en Paralelas', sets: 3, reps: '12-15', rest_seconds: 60, day_name: 'Día 1' },
            ]).map(ex => {
              const isChecked = Boolean(completedExercises[ex.id]);
              return (
                <button
                  key={ex.id}
                  onClick={() => handleToggleExercise(ex.id)}
                  className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isChecked
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-300'
                      : 'bg-slate-950/70 border-slate-800/80 text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-6 w-6 rounded-lg border flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold'
                        : 'border-slate-700 bg-slate-900'
                    }`}>
                      {isChecked && <Check className="h-4 w-4" />}
                    </div>
                    <div>
                      <span className={`text-xs font-semibold ${isChecked ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                        {ex.exercise_name}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {ex.sets} series × {ex.reps} {ex.rest_seconds ? `(${ex.rest_seconds}s descanso)` : ''}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </button>
              );
            })}
          </div>

          <button
            onClick={handleFinishWorkout}
            className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              assignment?.completed
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20'
            }`}
          >
            {assignment?.completed ? (
              <>
                <Award className="h-4 w-4 text-emerald-400" />
                <span>Entrenamiento Marcado como Completado (Desmarcar)</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Completar Entrenamiento de Hoy</span>
              </>
            )}
          </button>
        </div>

        {/* SECCIÓN 2: REGISTRO DE NUTRICIÓN DIARIO (REQUERIMIENTO 3.2 DEL PLAN) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Apple className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Metas de Nutrición de Hoy</h3>
                <p className="text-xs text-slate-400">Meta: {nutrition?.calories || 2200} kcal</p>
              </div>
            </div>
            <div className="flex gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {nutrition?.protein_g || 160}g P
              </span>
              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {nutrition?.carbs_g || 220}g C
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {nutrition?.fat_g || 65}g G
              </span>
            </div>
          </div>

          {nutrition?.notes && (
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300">
              <span className="font-semibold text-emerald-400">Pauta del coach:</span> {nutrition.notes}
            </div>
          )}

          {/* Checkboxes de Cumplimiento Diario (Requerimiento 3.2: Checkbox para confirmar si cumplió con la ingesta) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={() => handleToggleDailyNut('calories_met')}
              className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                dailyLog.calories_met
                  ? 'bg-emerald-500/10 border-emerald-500/50'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`h-5 w-5 rounded-md border flex items-center justify-center ${
                  dailyLog.calories_met ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700'
                }`}>
                  {dailyLog.calories_met && <Check className="h-3.5 w-3.5" />}
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">Calorías Cumplidas</span>
                  <span className="text-[10px] text-slate-400">Alcance de meta diaria</span>
                </div>
              </div>
              <Flame className={`h-4 w-4 ${dailyLog.calories_met ? 'text-amber-400' : 'text-slate-600'}`} />
            </button>

            <button
              onClick={() => handleToggleDailyNut('protein_met')}
              className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                dailyLog.protein_met
                  ? 'bg-emerald-500/10 border-emerald-500/50'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`h-5 w-5 rounded-md border flex items-center justify-center ${
                  dailyLog.protein_met ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700'
                }`}>
                  {dailyLog.protein_met && <Check className="h-3.5 w-3.5" />}
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">Proteína Cumplida</span>
                  <span className="text-[10px] text-slate-400">Total en gramos del día</span>
                </div>
              </div>
              <Apple className={`h-4 w-4 ${dailyLog.protein_met ? 'text-emerald-400' : 'text-slate-600'}`} />
            </button>
          </div>

          {/* Registro de Agua */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-sky-400" />
              <span className="text-xs text-slate-300">Hidratación diaria:</span>
              <span className="text-xs font-bold text-sky-400 font-mono">{dailyLog.water_liters} Litros</span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => handleAdjustWater(-0.5)}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs rounded text-slate-300"
              >
                -0.5L
              </button>
              <button
                onClick={() => handleAdjustWater(0.5)}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs rounded text-slate-300"
              >
                +0.5L
              </button>
            </div>
          </div>
          </div>
        </div>
        {/* Fin Columna Izquierda */}
        </div>

        {/* Columna Derecha: Historial de Progreso & Check-ins */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Tus Últimos Check-ins Semanales
            </h2>

            <div className="space-y-2.5">
              {progressLogs.map(log => (
                <div key={log.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {log.url_foto_frente ? (
                      <img
                        src={log.url_foto_frente}
                        alt="Foto check-in"
                        className="h-12 w-12 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <Camera className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{log.weight} kg</span>
                        {log.waist_cm && (
                          <span className="text-[11px] text-slate-400 font-mono">({log.waist_cm} cm cintura)</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{log.notes_cliente || 'Check-in registrado.'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono shrink-0 pl-2">{log.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Fin Columna Derecha */}
      </div>
      {/* Fin Grid Responsivo */}

      {/* MODAL CHECK-IN SEMANAL (REQUERIMIENTO 3.2 DEL PLAN) */}
      {showCheckinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative text-left max-h-[90vh] overflow-y-auto scrollbar-thin">
            <h3 className="text-lg font-bold text-white mb-1">Check-in Semanal</h3>
            <p className="text-xs text-slate-400 mb-4">
              Envía tu peso en ayunas, medidas y foto de progreso a tu coach.
            </p>

            {checkinSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                <Check className="h-4 w-4" /> ¡Check-in registrado con éxito! Tu coach lo podrá revisar.
              </div>
            )}

            <form onSubmit={handleSubmitCheckin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Peso Actual (kg)*</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  placeholder="Ej. 82.5"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Cintura (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentWaist}
                    onChange={(e) => setCurrentWaist(e.target.value)}
                    placeholder="Ej. 84"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Pecho / Espalda (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentChest}
                    onChange={(e) => setCurrentChest(e.target.value)}
                    placeholder="Ej. 102"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Subida de Foto */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Foto de Progreso (Frontal / Perfil)</label>
                <div className="relative border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-950/60">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {photoPreview ? (
                    <div className="flex items-center justify-center gap-3">
                      <img src={photoPreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg" />
                      <span className="text-xs text-emerald-400 font-medium">Foto seleccionada</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud className="h-6 w-6 text-slate-500 mb-1" />
                      <span className="text-xs text-slate-400">Toca para subir foto desde tu galería o cámara</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Comentarios / Sensaciones</label>
                <textarea
                  rows={2}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="¿Cómo te sentiste esta semana? ¿Energía, digestión, entrenamientos?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckinModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
                >
                  Enviar Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
