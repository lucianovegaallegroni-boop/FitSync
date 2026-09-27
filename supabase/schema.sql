-- ==========================================================
-- FitSync: Esquema de Base de Datos para Supabase
-- SaaS para Entrenadores Personales y Clientes
-- ==========================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Perfiles (Entrenadores y Clientes)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('trainer', 'client')),
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  phone TEXT,
  medical_history TEXT,
  goals TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_profile_email UNIQUE (email)
);

-- 2. Tabla de Plantillas de Rutinas (Workouts)
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_trainer_workout_title UNIQUE (trainer_id, title)
);

-- 3. Tabla de Ejercicios por Rutina
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  day_name TEXT NOT NULL DEFAULT 'Día 1',
  exercise_name TEXT NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '10-12',
  rest_seconds INTEGER DEFAULT 90,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Asignaciones de Rutinas a Clientes
CREATE TABLE IF NOT EXISTS public.workout_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Objetivos Nutricionales y Planes de Dieta
CREATE TABLE IF NOT EXISTS public.nutrition_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  calories INTEGER NOT NULL,
  protein_g INTEGER NOT NULL,
  carbs_g INTEGER NOT NULL,
  fat_g INTEGER NOT NULL,
  meals_per_day INTEGER DEFAULT 4,
  diet_days JSONB DEFAULT '[]'::jsonb,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Check-ins y Registros de Progreso Semanal
CREATE TABLE IF NOT EXISTS public.progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight NUMERIC(5,2) NOT NULL,
  waist_cm NUMERIC(5,2),
  chest_cm NUMERIC(5,2),
  hips_cm NUMERIC(5,2),
  notes_cliente TEXT,
  url_foto_frente TEXT,
  url_foto_perfil TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Registro Diario de Nutrición y Hábitos
CREATE TABLE IF NOT EXISTS public.daily_nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  calories_met BOOLEAN NOT NULL DEFAULT false,
  protein_met BOOLEAN NOT NULL DEFAULT false,
  water_liters NUMERIC(3,1) DEFAULT 2.0,
  completed_meal_ids JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, date)
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_nutrition_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de Perfiles
CREATE POLICY "Usuarios pueden ver su propio perfil" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Entrenadores pueden ver a sus clientes" 
  ON public.profiles FOR SELECT 
  USING (trainer_id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Inserción pública de perfiles al registrarse" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Políticas de Workouts
CREATE POLICY "Entrenadores gestionan sus propias rutinas" 
  ON public.workouts FOR ALL 
  USING (trainer_id = auth.uid());

CREATE POLICY "Clientes pueden ver rutinas que tienen asignadas" 
  ON public.workouts FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_assignments 
      WHERE workout_assignments.workout_id = workouts.id 
      AND workout_assignments.client_id = auth.uid()
    )
  );

-- Políticas de Ejercicios
CREATE POLICY "Acceso a ejercicios según acceso a la rutina" 
  ON public.workout_exercises FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts 
      WHERE workouts.id = workout_exercises.workout_id 
      AND (workouts.trainer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.workout_assignments 
        WHERE workout_assignments.workout_id = workouts.id 
        AND workout_assignments.client_id = auth.uid()
      ))
    )
  );

-- Políticas de Asignaciones
CREATE POLICY "Entrenadores ven y crean asignaciones para sus clientes" 
  ON public.workout_assignments FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = workout_assignments.client_id 
      AND profiles.trainer_id = auth.uid()
    )
  );

CREATE POLICY "Clientes ven y actualizan el estado de sus asignaciones" 
  ON public.workout_assignments FOR ALL 
  USING (client_id = auth.uid());

-- Políticas de Objetivos Nutricionales
CREATE POLICY "Entrenador gestiona metas de sus clientes" 
  ON public.nutrition_goals FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = nutrition_goals.client_id 
      AND profiles.trainer_id = auth.uid()
    )
  );

CREATE POLICY "Clientes ven sus propias metas nutricionales" 
  ON public.nutrition_goals FOR SELECT 
  USING (client_id = auth.uid());

-- Políticas de Logs de Progreso
CREATE POLICY "Clientes gestionan sus propios registros de progreso" 
  ON public.progress_logs FOR ALL 
  USING (client_id = auth.uid());

CREATE POLICY "Entrenadores ven el progreso de sus clientes" 
  ON public.progress_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = progress_logs.client_id 
      AND profiles.trainer_id = auth.uid()
    )
  );

-- Políticas de Nutrición Diaria
CREATE POLICY "Clientes gestionan sus registros diarios" 
  ON public.daily_nutrition_logs FOR ALL 
  USING (client_id = auth.uid());

CREATE POLICY "Entrenadores ven los registros diarios de sus clientes" 
  ON public.daily_nutrition_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = daily_nutrition_logs.client_id 
      AND profiles.trainer_id = auth.uid()
    )
  );

-- ==========================================================
-- TRIGGER: Crear perfil automáticamente al registrar usuario
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'trainer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================================
-- STORAGE BUCKET PARA FOTOS DE PROGRESO
-- ==========================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('progress-photos', 'progress-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Subida de fotos de progreso para usuarios autenticados"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'progress-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Lectura pública o autenticada de fotos de progreso"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'progress-photos');
