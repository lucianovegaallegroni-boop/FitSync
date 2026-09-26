export type UserRole = 'trainer' | 'client';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  trainer_id?: string | null;
  phone?: string | null;
  medical_history?: string | null;
  goals?: string | null;
  avatar_url?: string | null;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  day_name: string;
  exercise_name: string;
  sets: number;
  reps: string;
  rest_seconds?: number;
  notes?: string;
  order_index: number;
}

export interface Workout {
  id: string;
  trainer_id: string;
  title: string;
  description: string;
  created_at: string;
  exercises?: WorkoutExercise[];
}

export interface WorkoutAssignment {
  id: string;
  client_id: string;
  workout_id: string;
  assigned_date: string;
  completed: boolean;
  completed_at?: string | null;
  feedback?: string | null;
  workout?: Workout;
}

export interface NutritionGoal {
  id: string;
  client_id: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  start_date: string;
  notes?: string;
  created_at: string;
}

export interface ProgressLog {
  id: string;
  client_id: string;
  date: string;
  weight: number;
  waist_cm?: number | null;
  chest_cm?: number | null;
  hips_cm?: number | null;
  notes_cliente?: string | null;
  url_foto_frente?: string | null;
  url_foto_perfil?: string | null;
  created_at: string;
}

export interface DailyNutritionLog {
  id: string;
  client_id: string;
  date: string;
  calories_met: boolean;
  protein_met: boolean;
  water_liters: number;
  notes?: string;
}
