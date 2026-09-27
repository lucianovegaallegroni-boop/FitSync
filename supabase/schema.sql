-- ==========================================================
-- FitSync: Esquema de Base de Datos para Supabase
-- SaaS para Entrenadores Personales y Clientes
-- ==========================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Perfiles (Administradores, Entrenadores y Clientes)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('trainer', 'client', 'admin')),
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  phone TEXT,
  medical_history TEXT,
  goals TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  deactivation_reason TEXT DEFAULT 'Cuenta pendiente de activación por un administrador',
  deactivated_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ DEFAULT now(),
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

-- 8. Historial de Inicios de Sesión (Analíticas Mensuales)
CREATE TABLE IF NOT EXISTS public.login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Función auxiliar para verificar si el usuario actual es administrador (evita recursión RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Políticas de Perfiles
CREATE POLICY "Admins pueden ver todos los perfiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins pueden actualizar cualquier perfil"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Usuarios pueden ver su propio perfil" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Entrenadores pueden ver a sus clientes" 
  ON public.profiles FOR SELECT 
  USING (trainer_id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Entrenadores pueden actualizar datos de sus clientes"
  ON public.profiles FOR UPDATE
  USING (trainer_id = auth.uid() OR auth.uid() = id OR public.is_admin());

CREATE POLICY "Inserción pública de perfiles al registrarse" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id OR trainer_id = auth.uid() OR public.is_admin());

-- Políticas de Login History
CREATE POLICY "Admins pueden ver todo el historial de login"
  ON public.login_history FOR SELECT
  USING (true);

CREATE POLICY "Insercion publica de logs de inicio de sesion"
  ON public.login_history FOR INSERT
  WITH CHECK (true);

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
DECLARE
  v_role text;
  v_trainer_id uuid;
  v_is_active boolean;
  v_deactivation_reason text;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'trainer');
  
  -- Las cuentas de cliente se crean activas de manera predeterminada
  IF v_role = 'client' THEN
    v_is_active := true;
    v_deactivation_reason := NULL;
  ELSE
    -- Entrenadores u otros roles autoregistrados requieren activación de administrador
    v_is_active := false;
    v_deactivation_reason := 'Cuenta pendiente de activación por un administrador';
  END IF;

  BEGIN
    v_trainer_id := (new.raw_user_meta_data->>'trainer_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_trainer_id := NULL;
  END;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    trainer_id,
    phone,
    medical_history,
    goals,
    is_active,
    deactivation_reason
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_role,
    v_trainer_id,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'medical_history',
    new.raw_user_meta_data->>'goals',
    v_is_active,
    v_deactivation_reason
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    trainer_id = COALESCE(EXCLUDED.trainer_id, public.profiles.trainer_id),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    goals = COALESCE(EXCLUDED.goals, public.profiles.goals),
    medical_history = COALESCE(EXCLUDED.medical_history, public.profiles.medical_history),
    is_active = CASE 
      WHEN EXCLUDED.role = 'client' THEN true 
      ELSE public.profiles.is_active 
    END,
    deactivation_reason = CASE 
      WHEN EXCLUDED.role = 'client' THEN NULL 
      ELSE public.profiles.deactivation_reason 
    END;

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

-- ==========================================================
-- RPC: Verificar estado de cuenta de usuario antes de login
-- ==========================================================
CREATE OR REPLACE FUNCTION public.check_user_status(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_exists_in_auth boolean;
BEGIN
  -- 1. Buscar en perfiles
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE LOWER(email) = LOWER(TRIM(user_email))
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'exists', true,
      'is_active', v_profile.is_active,
      'deactivation_reason', v_profile.deactivation_reason,
      'full_name', v_profile.full_name,
      'role', v_profile.role
    );
  END IF;

  -- 2. Si no está en profiles, verificar si existe en auth.users
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(TRIM(user_email))
  ) INTO v_exists_in_auth;

  IF v_exists_in_auth THEN
    RETURN jsonb_build_object(
      'exists', true,
      'is_active', false,
      'deactivation_reason', 'Cuenta pendiente de activación por un administrador'
    );
  END IF;

  RETURN jsonb_build_object(
    'exists', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_user_status(text) TO anon, authenticated, service_role;

