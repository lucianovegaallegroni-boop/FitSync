# FitSync - Plataforma SaaS para Entrenadores Personales

FitSync es una aplicación web y móvil diseñada para que los entrenadores personales gestionen a sus clientes, creen y asignen rutinas, definan objetivos nutricionales y analicen el progreso en tiempo real mediante check-ins semanales y fotos.

---

## 🚀 Tecnologías

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite.
- **Backend & Database:** [Supabase](https://supabase.com) (PostgreSQL, Auth, Storage, Row Level Security).
- **Despliegue sugerido:** Vercel / Netlify.

---

## ⚡ Conexión Supabase

El proyecto está configurado con tu instancia de Supabase en `.env`:
```env
VITE_SUPABASE_URL=https://webrizefhxccighruoem.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Z6Y7V8oySXifjZTVGzd7Hw_pc64ML_u
```

### 🗄️ Esquema de Base de Datos y Tablas
El archivo [`supabase/schema.sql`](supabase/schema.sql) contiene la definición completa de:
1. `profiles`: Perfiles de usuario (entrenador y clientes vinculados).
2. `workouts`: Plantillas de rutinas creadas por entrenadores.
3. `workout_exercises`: Ejercicios divididos por día, series, repeticiones y descansos.
4. `workout_assignments`: Asignación de rutinas con estado de cumplimiento.
5. `nutrition_goals`: Metas diarias de calorías y macros (proteína, carbohidratos, grasa).
6. `progress_logs`: Check-in semanal con peso, medidas (cintura, pecho) y fotos de progreso.
7. `daily_nutrition_logs`: Registro diario de cumplimiento calórico, proteico e hidratación.
8. Políticas de seguridad **Row Level Security (RLS)** y bucket de storage `progress-photos`.

> **Para aplicar la base de datos remota:**
> Abre tu [Supabase Dashboard > SQL Editor](https://supabase.com/dashboard/project/webrizefhxccighruoem/sql/new) y pega el contenido de `supabase/schema.sql`.

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

---

## 📱 Módulos del MVP Implementados

### 1. Portal del Entrenador
- **Dashboard:** Métricas clave, clientes activos y **alerta de retención** para clientes sin registros en > 3 días.
- **Gestión de Clientes:** Ficha técnica con objetivos y antecedentes médicos.
- **Constructor de Rutinas:** Creación dinámica de ejercicios, series y asignación.
- **Asignador de Nutrición:** Ajuste de macros y recomendaciones.
- **Analíticas:** Gráfica de evolución de peso y galería visual de check-ins.

### 2. Portal del Cliente (Mobile-First)
- **Qué tengo que hacer hoy:** Checklists interactivo de ejercicios de la rutina asignada y objetivos de calorías/proteínas.
- **Registro de Nutrición e Hidratación:** Confirmación de ingesta y contador de agua en litros.
- **Check-in Semanal:** Registro de peso, cintura, pecho, sensaciones y subida de fotos.
