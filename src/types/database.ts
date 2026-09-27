export type UserRole = 'trainer' | 'client' | 'admin';

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
  is_active?: boolean;
  deactivation_reason?: string | null;
  deactivated_at?: string | null;
  last_login_at?: string | null;
  created_at: string;
}

export interface MonthlyLoginStat {
  month: string;
  year: number;
  logins: number;
  unique_users: number;
  trainers: number;
  clients: number;
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

export interface MealFoodItem {
  id: string;
  name: string;
  portion?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface MealSlot {
  id: string;
  meal_number: number;
  name: string; // e.g. "Desayuno", "Media mañana", "Almuerzo", "Merienda", "Cena"
  time_suggested?: string;
  foods: MealFoodItem[];
}

export interface DayDietPlan {
  id: string;
  day_name: string; // e.g. "Todos los días", "Lunes", "Martes", etc.
  meals: MealSlot[];
}

export interface NutritionGoal {
  id: string;
  client_id: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meals_per_day?: number;
  diet_days?: DayDietPlan[];
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
  completed_meal_ids?: string[];
  notes?: string;
}
