import { supabase } from '../lib/supabase';
import {
  Profile,
  Workout,
  WorkoutExercise,
  WorkoutAssignment,
  NutritionGoal,
  ProgressLog,
  DailyNutritionLog,
  MonthlyLoginStat,
} from '../types/database';

// Datos de demostración iniciales
const INITIAL_DEMO_USERS: Profile[] = [
  {
    id: 'admin-1',
    email: 'admin@fitsync.com',
    full_name: 'Super Administrador FitSync',
    role: 'admin',
    is_active: true,
    created_at: new Date(Date.now() - 150 * 86400000).toISOString(),
    last_login_at: new Date().toISOString(),
  },
  {
    id: 'trainer-1',
    email: 'entrenador@fitsync.com',
    full_name: 'Coach Rodrigo Paz',
    role: 'trainer',
    phone: '+34 600 111 222',
    is_active: true,
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    last_login_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'trainer-2',
    email: 'laura.coach@fitsync.com',
    full_name: 'Coach Laura Giménez',
    role: 'trainer',
    phone: '+34 622 333 444',
    is_active: true,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    last_login_at: new Date(Date.now() - 18 * 3600000).toISOString(),
  },
  {
    id: 'client-1',
    email: 'carlos.m@example.com',
    full_name: 'Carlos Mendoza',
    role: 'client',
    trainer_id: 'trainer-1',
    phone: '+34 612 345 678',
    goals: 'Pérdida de grasa corporal (-5kg) y aumento de masa muscular',
    medical_history: 'Molestia leve en rodilla izquierda (evitar sentadillas muy profundas)',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    last_login_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'client-2',
    email: 'sofia.r@example.com',
    full_name: 'Sofía Rodríguez',
    role: 'client',
    trainer_id: 'trainer-1',
    phone: '+34 699 876 543',
    goals: 'Tonificación general y mejora de resistencia cardiovascular',
    medical_history: 'Ninguna lesión reportada',
    is_active: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    last_login_at: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: 'client-3',
    email: 'juan.p@example.com',
    full_name: 'Juan Pérez',
    role: 'client',
    trainer_id: 'trainer-1',
    phone: '+34 633 112 233',
    goals: 'Hipertrofia torso y hombros',
    medical_history: 'Asma inducida por ejercicio de alta intensidad',
    is_active: false,
    deactivation_reason: 'Falta de pago de suscripción mensual',
    deactivated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    last_login_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'client-4',
    email: 'marta.s@example.com',
    full_name: 'Marta Sánchez',
    role: 'client',
    trainer_id: 'trainer-2',
    phone: '+34 655 444 333',
    goals: 'Preparación carrera 10k y fuerza funcional',
    medical_history: 'Tendinitis rotuliana recuperada',
    is_active: true,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    last_login_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'client-5',
    email: 'diego.m@example.com',
    full_name: 'Diego Morales',
    role: 'client',
    trainer_id: 'trainer-2',
    phone: '+34 677 888 999',
    goals: 'Rehabilitación postural y fortalecimiento lumbar',
    medical_history: 'Protrusión L4-L5',
    is_active: false,
    deactivation_reason: 'Incumplimiento de términos y condiciones de la comunidad',
    deactivated_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
    last_login_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
];

const INITIAL_DEMO_LOGIN_STATS: MonthlyLoginStat[] = [
  { month: 'Mar', year: 2026, logins: 180, unique_users: 18, trainers: 4, clients: 14 },
  { month: 'Abr', year: 2026, logins: 265, unique_users: 26, trainers: 6, clients: 20 },
  { month: 'May', year: 2026, logins: 380, unique_users: 35, trainers: 8, clients: 27 },
  { month: 'Jun', year: 2026, logins: 495, unique_users: 48, trainers: 11, clients: 37 },
  { month: 'Jul', year: 2026, logins: 620, unique_users: 59, trainers: 14, clients: 45 },
  { month: 'Ago', year: 2026, logins: 790, unique_users: 73, trainers: 17, clients: 56 },
  { month: 'Sep', year: 2026, logins: 960, unique_users: 88, trainers: 21, clients: 67 },
];

const INITIAL_DEMO_WORKOUTS: Workout[] = [
  {
    id: 'workout-1',
    trainer_id: 'trainer-1',
    title: 'Fuerza & Hipertrofia (Push / Pull / Legs)',
    description: 'Rutina dividida de 3 días para progresión de cargas y masa magra.',
    created_at: new Date().toISOString(),
    exercises: [
      { id: 'ex-1', workout_id: 'workout-1', day_name: 'Día 1: Empuje (Push)', exercise_name: 'Press de Banca Plano con Barra', sets: 4, reps: '8-10', rest_seconds: 90, order_index: 1 },
      { id: 'ex-2', workout_id: 'workout-1', day_name: 'Día 1: Empuje (Push)', exercise_name: 'Press Militar con Mancuernas', sets: 3, reps: '10-12', rest_seconds: 75, order_index: 2 },
      { id: 'ex-3', workout_id: 'workout-1', day_name: 'Día 1: Empuje (Push)', exercise_name: 'Fondos en Paralelas / Tríceps Polea', sets: 3, reps: '12-15', rest_seconds: 60, order_index: 3 },
      { id: 'ex-4', workout_id: 'workout-1', day_name: 'Día 2: Tracción (Pull)', exercise_name: 'Jalón al Pecho / Dominadas', sets: 4, reps: '8-10', rest_seconds: 90, order_index: 4 },
      { id: 'ex-5', workout_id: 'workout-1', day_name: 'Día 2: Tracción (Pull)', exercise_name: 'Remo con Barra', sets: 3, reps: '10-12', rest_seconds: 90, order_index: 5 },
      { id: 'ex-6', workout_id: 'workout-1', day_name: 'Día 3: Pierna (Legs)', exercise_name: 'Sentadilla Goblet / Prensa 45°', sets: 4, reps: '10-12', rest_seconds: 90, order_index: 6 },
    ],
  },
  {
    id: 'workout-2',
    trainer_id: 'trainer-1',
    title: 'Acondicionamiento y Quema de Grasa Fullbody',
    description: 'Circuito dinámico para activar metabolismo y tonificar.',
    created_at: new Date().toISOString(),
    exercises: [
      { id: 'ex-7', workout_id: 'workout-2', day_name: 'Día 1', exercise_name: 'Kettlebell Swings', sets: 4, reps: '15', rest_seconds: 45, order_index: 1 },
      { id: 'ex-8', workout_id: 'workout-2', day_name: 'Día 1', exercise_name: 'Zancadas Alternadas', sets: 3, reps: '12 por pierna', rest_seconds: 60, order_index: 2 },
      { id: 'ex-9', workout_id: 'workout-2', day_name: 'Día 1', exercise_name: 'Plancha Abdominal', sets: 3, reps: '45 seg', rest_seconds: 45, order_index: 3 },
    ],
  },
];

const INITIAL_DEMO_NUTRITION: Record<string, NutritionGoal> = {
  'client-1': {
    id: 'nut-1',
    client_id: 'client-1',
    calories: 2200,
    protein_g: 165,
    carbs_g: 220,
    fat_g: 65,
    meals_per_day: 4,
    diet_days: [
      {
        id: 'day-1',
        day_name: 'Todos los días (Estándar)',
        meals: [
          {
            id: 'm-1',
            meal_number: 1,
            name: 'Desayuno Energético',
            time_suggested: '08:30',
            foods: [
              { id: 'f-1', name: 'Huevos revueltos (3 huevos) con espinacas y 2 tostadas integrales', portion: '1 plato', calories: 420, protein_g: 28, carbs_g: 32, fat_g: 20 },
              { id: 'f-2', name: 'Bowl de avena cocida con leche vegetal y frutos rojos', portion: '1 bowl (60g avena)', calories: 280, protein_g: 14, carbs_g: 48, fat_g: 4 }
            ]
          },
          {
            id: 'm-2',
            meal_number: 2,
            name: 'Almuerzo / Comida Principal',
            time_suggested: '13:30',
            foods: [
              { id: 'f-3', name: 'Pechuga de pollo a la plancha con arroz basmati y brócoli', portion: '200g pollo + 150g arroz', calories: 610, protein_g: 54, carbs_g: 68, fat_g: 10 },
              { id: 'f-4', name: 'Aceite de oliva virgen extra para aderezar', portion: '1 cucharada sopera', calories: 110, protein_g: 0, carbs_g: 0, fat_g: 12 }
            ]
          },
          {
            id: 'm-3',
            meal_number: 3,
            name: 'Merienda Pre-Entreno',
            time_suggested: '17:30',
            foods: [
              { id: 'f-5', name: 'Yogur griego natural sin azúcar con nueces y 1 manzana', portion: '200g yogur + 20g nueces', calories: 330, protein_g: 21, carbs_g: 22, fat_g: 14 }
            ]
          },
          {
            id: 'm-4',
            meal_number: 4,
            name: 'Cena Recuperadora',
            time_suggested: '21:00',
            foods: [
              { id: 'f-6', name: 'Filete de salmón al horno con patata asada y ensalada verde', portion: '180g salmón + 150g patata', calories: 450, protein_g: 48, carbs_g: 50, fat_g: 5 }
            ]
          }
        ]
      }
    ],
    start_date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    notes: 'Priorizar proteína magra en almuerzo y cena. 2.5L de agua al día.',
    created_at: new Date().toISOString(),
  },
  'client-2': {
    id: 'nut-2',
    client_id: 'client-2',
    calories: 1800,
    protein_g: 130,
    carbs_g: 180,
    fat_g: 55,
    meals_per_day: 3,
    diet_days: [
      {
        id: 'day-2',
        day_name: 'Todos los días (Déficit)',
        meals: [
          {
            id: 'm-201',
            meal_number: 1,
            name: 'Desayuno Proteico',
            time_suggested: '08:30',
            foods: [
              { id: 'f-201', name: 'Tortilla francesa (2 huevos) con pavo y tostada', portion: '1 plato', calories: 380, protein_g: 30, carbs_g: 25, fat_g: 15 }
            ]
          },
          {
            id: 'm-202',
            meal_number: 2,
            name: 'Almuerzo Equilibrado',
            time_suggested: '14:00',
            foods: [
              { id: 'f-202', name: 'Lomo de merluza con quinoa y verduras salteadas', portion: '200g merluza + 80g quinoa', calories: 550, protein_g: 48, carbs_g: 65, fat_g: 12 }
            ]
          },
          {
            id: 'm-203',
            meal_number: 3,
            name: 'Cena Ligera',
            time_suggested: '21:00',
            foods: [
              { id: 'f-203', name: 'Ensalada completa con atún al natural, huevo cocido y aguacate', portion: '1 ensaladera', calories: 450, protein_g: 40, carbs_g: 30, fat_g: 18 }
            ]
          }
        ]
      }
    ],
    start_date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    notes: 'Déficit calórico suave de 300 kcal. Frutas en snacks.',
    created_at: new Date().toISOString(),
  },
};

export const INITIAL_DEMO_PROGRESS: ProgressLog[] = [
  {
    id: 'prog-1',
    client_id: 'client-1',
    date: new Date(Date.now() - 21 * 86400000).toISOString().split('T')[0],
    weight: 84.5,
    waist_cm: 88,
    chest_cm: 102,
    notes_cliente: 'Semana de inicio. Con energía y adaptándome a las comidas.',
    url_foto_frente: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80',
    created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
  },
  {
    id: 'prog-2',
    client_id: 'client-1',
    date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    weight: 83.8,
    waist_cm: 87,
    chest_cm: 102,
    notes_cliente: 'Menos hinchazón abdominal. Cumplí 5 de 6 días con las proteínas.',
    url_foto_frente: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'prog-3',
    client_id: 'client-1',
    date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    weight: 83.0,
    waist_cm: 85.5,
    chest_cm: 102.5,
    notes_cliente: 'Excelente semana de entrenamientos, subí peso en sentadillas.',
    url_foto_frente: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'prog-4',
    client_id: 'client-1',
    date: new Date().toISOString().split('T')[0],
    weight: 82.2,
    waist_cm: 84.5,
    chest_cm: 103,
    notes_cliente: '¡Muy motivado! La ropa me queda más holgada en la cintura.',
    created_at: new Date().toISOString(),
  },
  // Cliente inactivo (Juan Pérez no registra en 4 días para disparar la alerta del MVP)
  {
    id: 'prog-5',
    client_id: 'client-3',
    date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    weight: 79.0,
    waist_cm: 82,
    notes_cliente: 'Último registro hace 4 días.',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

const INITIAL_DEMO_ASSIGNMENTS: WorkoutAssignment[] = [
  {
    id: 'assign-1',
    client_id: 'client-1',
    workout_id: 'workout-1',
    assigned_date: new Date().toISOString().split('T')[0],
    completed: false,
    workout: INITIAL_DEMO_WORKOUTS[0],
  },
];

// Helper para persistencia local en demo
class LocalDataStore {
  users = [...INITIAL_DEMO_USERS];

  get clients(): Profile[] {
    return this.users.filter(u => u.role === 'client');
  }

  set clients(newClients: Profile[]) {
    const nonClients = this.users.filter(u => u.role !== 'client');
    this.users = [...nonClients, ...newClients];
  }

  loginStats = [...INITIAL_DEMO_LOGIN_STATS];
  workouts = [...INITIAL_DEMO_WORKOUTS];
  nutrition = { ...INITIAL_DEMO_NUTRITION };
  progress = [...INITIAL_DEMO_PROGRESS];
  assignments = [...INITIAL_DEMO_ASSIGNMENTS];
  dailyLogs: Record<string, DailyNutritionLog> = {
    [`client-1_${new Date().toISOString().split('T')[0]}`]: {
      id: 'daily-1',
      client_id: 'client-1',
      date: new Date().toISOString().split('T')[0],
      calories_met: true,
      protein_met: true,
      water_liters: 2.5,
      notes: 'Desayuno alto en huevos y avena.',
    },
  };
}

const localStore = new LocalDataStore();

export const dataService = {
  // Obtener clientes del entrenador
  async getClients(trainerId: string): Promise<Profile[]> {
    // Limpiar duplicados previos en memoria si existiesen
    const uniqueLocal = localStore.clients.filter((c, idx, arr) =>
      arr.findIndex(item => item.email.trim().toLowerCase() === c.email.trim().toLowerCase()) === idx
    );
    localStore.clients = uniqueLocal;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('trainer_id', trainerId);

      if (error || !data || data.length === 0) {
        return uniqueLocal;
      }
      // Deduplicar datos remotos por email
      return data.filter((c, idx, arr) =>
        arr.findIndex(item => item.email.trim().toLowerCase() === c.email.trim().toLowerCase()) === idx
      );
    } catch {
      return uniqueLocal;
    }
  },

  // Crear o invitar cliente
  async addClient(clientData: Partial<Profile>): Promise<Profile> {
    const emailNorm = (clientData.email || '').trim().toLowerCase();
    
    // Validar duplicado en store local
    if (emailNorm) {
      const exists = localStore.clients.some(c => c.email.trim().toLowerCase() === emailNorm);
      if (exists) {
        throw new Error(`Ya existe un cliente registrado con el correo: ${clientData.email}`);
      }
    }

    const newClient: Profile = {
      id: `client-${Date.now()}`,
      email: clientData.email || '',
      full_name: clientData.full_name || 'Nuevo Cliente',
      role: 'client',
      trainer_id: clientData.trainer_id || 'trainer-1',
      phone: clientData.phone,
      medical_history: clientData.medical_history,
      goals: clientData.goals,
      created_at: new Date().toISOString(),
    };

    try {
      // Validar si existe en Supabase
      if (emailNorm) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', emailNorm)
          .maybeSingle();

        if (existingUser) {
          throw new Error(`Ya existe un usuario en el sistema con el correo: ${clientData.email}`);
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert([newClient])
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    } catch (e: any) {
      if (e.message && e.message.includes('Ya existe')) {
        throw e;
      }
      console.warn('Fallback a store local para agregar cliente:', e);
    }

    localStore.clients.push(newClient);
    return newClient;
  },

  // Obtener rutinas creadas por el entrenador
  async getWorkouts(trainerId: string): Promise<Workout[]> {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*, exercises:workout_exercises(*)')
        .eq('trainer_id', trainerId)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return localStore.workouts;
      }
      return data;
    } catch {
      return localStore.workouts;
    }
  },

  // Crear rutina con ejercicios
  async createWorkout(workout: Omit<Workout, 'id' | 'created_at'>, exercises: Omit<WorkoutExercise, 'id' | 'workout_id'>[]): Promise<Workout> {
    const titleNorm = workout.title.trim().toLowerCase();

    // Validar duplicado en store local
    const exists = localStore.workouts.some(
      w => w.trainer_id === workout.trainer_id && w.title.trim().toLowerCase() === titleNorm
    );
    if (exists) {
      throw new Error(`Ya existe una rutina con el nombre "${workout.title}". Elige un nombre diferente.`);
    }

    const workoutId = `workout-${Date.now()}`;
    const newWorkout: Workout = {
      id: workoutId,
      trainer_id: workout.trainer_id,
      title: workout.title,
      description: workout.description,
      created_at: new Date().toISOString(),
      exercises: exercises.map((ex, idx) => ({
        ...ex,
        id: `ex-${Date.now()}-${idx}`,
        workout_id: workoutId,
      })),
    };

    try {
      // Validar si existe en Supabase
      const { data: existingWk } = await supabase
        .from('workouts')
        .select('id')
        .eq('trainer_id', workout.trainer_id)
        .ilike('title', workout.title.trim())
        .maybeSingle();

      if (existingWk) {
        throw new Error(`Ya existe una rutina con el nombre "${workout.title}". Elige un nombre diferente.`);
      }

      const { data, error } = await supabase
        .from('workouts')
        .insert([{
          trainer_id: workout.trainer_id,
          title: workout.title,
          description: workout.description,
        }])
        .select()
        .single();

      if (!error && data) {
        const exercisesToInsert = exercises.map(ex => ({
          ...ex,
          workout_id: data.id,
        }));
        await supabase.from('workout_exercises').insert(exercisesToInsert);
        return { ...data, exercises: exercisesToInsert as WorkoutExercise[] };
      }
    } catch (e) {
      console.warn('Fallback a store local para crear rutina:', e);
    }

    localStore.workouts.unshift(newWorkout);
    return newWorkout;
  },

  // Asignar rutina a cliente
  async assignWorkout(clientId: string, workoutId: string, assignedDate: string): Promise<WorkoutAssignment> {
    const matchedWorkout = localStore.workouts.find(w => w.id === workoutId);
    const newAssignment: WorkoutAssignment = {
      id: `assign-${Date.now()}`,
      client_id: clientId,
      workout_id: workoutId,
      assigned_date: assignedDate,
      completed: false,
      workout: matchedWorkout,
    };

    try {
      const { data, error } = await supabase
        .from('workout_assignments')
        .insert([{
          client_id: clientId,
          workout_id: workoutId,
          assigned_date: assignedDate,
        }])
        .select('*, workout:workouts(*)')
        .single();

      if (!error && data) return data;
    } catch (e) {
      console.warn('Fallback a store local para asignar rutina:', e);
    }

    localStore.assignments.push(newAssignment);
    return newAssignment;
  },

  // Obtener asignación de hoy para cliente
  async getTodayAssignment(clientId: string, date: string): Promise<WorkoutAssignment | null> {
    try {
      const { data, error } = await supabase
        .from('workout_assignments')
        .select('*, workout:workouts(*, workout_exercises(*))')
        .eq('client_id', clientId)
        .eq('assigned_date', date)
        .maybeSingle();

      if (!error && data) return data;
    } catch {
      // Ignorar y caer a fallback
    }

    const found = localStore.assignments.find(a => a.client_id === clientId);
    return found || null;
  },

  // Marcar rutina como completada
  async toggleWorkoutCompletion(assignmentId: string, completed: boolean): Promise<void> {
    try {
      await supabase
        .from('workout_assignments')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', assignmentId);
    } catch {
      // noop
    }

    const item = localStore.assignments.find(a => a.id === assignmentId);
    if (item) {
      item.completed = completed;
      item.completed_at = completed ? new Date().toISOString() : null;
    }
  },

  // Guardar / Actualizar objetivo nutricional
  async setNutritionGoal(goal: Omit<NutritionGoal, 'id' | 'created_at'>): Promise<NutritionGoal> {
    const newGoal: NutritionGoal = {
      ...goal,
      id: `nut-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('nutrition_goals')
        .upsert([goal])
        .select()
        .single();

      if (!error && data) return data;
    } catch (e) {
      console.warn('Fallback local para metas de nutrición:', e);
    }

    localStore.nutrition[goal.client_id] = newGoal;
    return newGoal;
  },

  // Obtener objetivo nutricional de cliente
  async getNutritionGoal(clientId: string): Promise<NutritionGoal | null> {
    try {
      const { data, error } = await supabase
        .from('nutrition_goals')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) return data;
    } catch {
      // noop
    }

    return localStore.nutrition[clientId] || null;
  },

  // Guardar check-in de progreso semanal
  async logProgress(log: Omit<ProgressLog, 'id' | 'created_at'>): Promise<ProgressLog> {
    const newLog: ProgressLog = {
      ...log,
      id: `prog-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('progress_logs')
        .insert([log])
        .select()
        .single();

      if (!error && data) return data;
    } catch (e) {
      console.warn('Fallback local para check-in de progreso:', e);
    }

    localStore.progress.unshift(newLog);
    return newLog;
  },

  // Obtener historial de progreso de un cliente
  async getProgressLogs(clientId: string): Promise<ProgressLog[]> {
    try {
      const { data, error } = await supabase
        .from('progress_logs')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: true });

      if (!error && data && data.length > 0) return data;
    } catch {
      // noop
    }

    return localStore.progress
      .filter(p => p.client_id === clientId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  // Obtener o registrar nutrición diaria
  async getDailyLog(clientId: string, date: string): Promise<DailyNutritionLog> {
    const key = `${clientId}_${date}`;
    try {
      const { data, error } = await supabase
        .from('daily_nutrition_logs')
        .select('*')
        .eq('client_id', clientId)
        .eq('date', date)
        .maybeSingle();

      if (!error && data) return data;
    } catch {
      // noop
    }

    if (!localStore.dailyLogs[key]) {
      localStore.dailyLogs[key] = {
        id: `daily-${Date.now()}`,
        client_id: clientId,
        date,
        calories_met: false,
        protein_met: false,
        water_liters: 0,
      };
    }
    return localStore.dailyLogs[key];
  },

  async updateDailyLog(log: DailyNutritionLog): Promise<void> {
    const key = `${log.client_id}_${log.date}`;
    localStore.dailyLogs[key] = { ...log };

    try {
      await supabase
        .from('daily_nutrition_logs')
        .upsert([log], { onConflict: 'client_id,date' });
    } catch {
      // noop
    }
  },

  // Subir foto a Supabase Storage (bucket: 'progress-photos')
  async uploadProgressPhoto(file: File, clientId: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (e) {
      console.warn('Storage upload error (usando blob preview):', e);
      return URL.createObjectURL(file);
    }
  },

  // --- MÉTODOS DE ADMINISTRADOR Y CONTROL DE USUARIOS ---

  // Obtener todos los usuarios del sistema (entrenadores, clientes, administradores)
  async getAllUsers(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const map = new Map<string, Profile>();
        localStore.users.forEach(u => map.set(u.id, u));
        data.forEach(u => map.set(u.id, u));
        return Array.from(map.values());
      }
    } catch {
      // noop
    }
    return [...localStore.users];
  },

  // Modificar perfil de usuario por el Admin
  async updateUserProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const idx = localStore.users.findIndex(u => u.id === userId);
    let updatedUser: Profile;
    if (idx >= 0) {
      localStore.users[idx] = { ...localStore.users[idx], ...updates };
      updatedUser = localStore.users[idx];
    } else {
      updatedUser = { id: userId, ...updates } as Profile;
      localStore.users.push(updatedUser);
    }

    try {
      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
    } catch (e) {
      console.warn('Error actualizando usuario en Supabase:', e);
    }

    return updatedUser;
  },

  // Activar o desactivar cuenta de usuario con motivo
  async setUserActiveStatus(userId: string, isActive: boolean, reason?: string): Promise<Profile> {
    const updates: Partial<Profile> = {
      is_active: isActive,
      deactivation_reason: isActive ? null : (reason || 'Desactivado por el administrador'),
      deactivated_at: isActive ? null : new Date().toISOString(),
    };

    return this.updateUserProfile(userId, updates);
  },

  // Obtener estadísticas de logins mes a mes
  async getMonthlyLoginStats(): Promise<MonthlyLoginStat[]> {
    try {
      const { data, error } = await supabase
        .from('login_history')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const groupMap: Record<string, { month: string; year: number; logins: number; userIds: Set<string>; trainers: Set<string>; clients: Set<string> }> = {};

        data.forEach(item => {
          const d = new Date(item.created_at);
          const monthStr = months[d.getMonth()];
          const year = d.getFullYear();
          const key = `${year}-${d.getMonth()}`;

          if (!groupMap[key]) {
            groupMap[key] = {
              month: monthStr,
              year,
              logins: 0,
              userIds: new Set(),
              trainers: new Set(),
              clients: new Set(),
            };
          }
          groupMap[key].logins += 1;
          groupMap[key].userIds.add(item.user_id);
          if (item.role === 'trainer') groupMap[key].trainers.add(item.user_id);
          if (item.role === 'client') groupMap[key].clients.add(item.user_id);
        });

        const aggregated = Object.values(groupMap).map(g => ({
          month: g.month,
          year: g.year,
          logins: g.logins,
          unique_users: g.userIds.size,
          trainers: g.trainers.size,
          clients: g.clients.size,
        }));

        if (aggregated.length > 0) return aggregated;
      }
    } catch {
      // noop
    }

    return [...localStore.loginStats];
  },

  // Registrar login de usuario
  async recordLogin(userId: string, email: string, role: string): Promise<void> {
    const now = new Date().toISOString();

    const u = localStore.users.find(x => x.id === userId || x.email.toLowerCase() === email.toLowerCase());
    if (u) {
      u.last_login_at = now;
    }

    try {
      await supabase.from('profiles').update({ last_login_at: now }).eq('id', userId);
    } catch {
      // noop
    }

    try {
      await supabase.from('login_history').insert([{
        user_id: userId,
        email,
        role,
        created_at: now,
      }]);
    } catch {
      // noop
    }
  },

  // Verificar si un usuario está activo antes de permitir login
  async checkUserStatus(email: string): Promise<{ allowed: boolean; reason?: string; profile?: Profile }> {
    const norm = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', norm)
        .maybeSingle();

      if (!error && data) {
        if (data.is_active === false) {
          return {
            allowed: false,
            reason: data.deactivation_reason || 'Esta cuenta ha sido desactivada por un administrador.',
            profile: data,
          };
        }
        return { allowed: true, profile: data };
      }
    } catch {
      // noop
    }

    const localUser = localStore.users.find(u => u.email.trim().toLowerCase() === norm);
    if (localUser) {
      if (localUser.is_active === false) {
        return {
          allowed: false,
          reason: localUser.deactivation_reason || 'Esta cuenta ha sido desactivada por un administrador.',
          profile: localUser,
        };
      }
      return { allowed: true, profile: localUser };
    }

    return { allowed: true };
  },
};
