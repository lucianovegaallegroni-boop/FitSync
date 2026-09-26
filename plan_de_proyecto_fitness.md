# Documento de Proyecto: Plataforma SaaS para Entrenadores Personales

## 1. Visión General
Una plataforma web diseñada para que entrenadores personales gestionen a sus clientes, asignen rutinas/dietas y visualicen el progreso en tiempo real. El objetivo es reemplazar las hojas de cálculo y WhatsApp por un ecosistema profesional que permita al entrenador escalar su negocio y justificar sus tarifas.

## 2. Tipos de Usuarios
*   **Entrenador (Admin):** Gestiona múltiples clientes, crea plantillas de rutinas, asigna macros y revisa analíticas.
*   **Cliente (Usuario final):** Visualiza su plan diario, registra sus comidas/entrenamientos, sube fotos de progreso y actualiza su peso.

## 3. Funcionalidades del Producto Mínimo Viable (MVP)

### 3.1 Portal del Entrenador
*   **Dashboard General:** Vista rápida de clientes activos, alertas de clientes que no han registrado datos en más de 3 días.
*   **Gestión de Clientes:** Crear perfiles de clientes, historial médico básico, y objetivos.
*   **Asignación de Programas:** Constructor sencillo de rutinas (días, ejercicios, series, repeticiones) y objetivos nutricionales (calorías y macronutrientes diarios).
*   **Analíticas:** Gráficos de línea mostrando la evolución de peso y cumplimiento de cada cliente.

### 3.2 Portal del Cliente (Optimizada para Móviles)
*   **Vista Diaria:** "Qué tengo que hacer hoy" (Entrenamiento asignado y macros a cumplir).
*   **Check-in Semanal:** Formulario para ingresar peso actual, medidas y subir fotos de progreso frontal/perfil.
*   **Registro de Nutrición:** Checkbox para confirmar si cumplió con la ingesta calórica/proteica del día.

### 3.3 Automatizaciones (Vía n8n o Cron Jobs)
*   Recordatorio automático por email/WhatsApp al cliente: *"Es hora de tu check-in semanal"*.
*   Alerta al entrenador: *"Juan Pérez no ha registrado actividad en 4 días"*.

## 4. Stack Tecnológico Sugerido
*   **Frontend:** React o Vue.js (Idealmente con TailwindCSS para un diseño rápido y responsivo).
*   **Backend:** Node.js (Express) o Python (Django/FastAPI).
*   **Base de Datos:** PostgreSQL.
*   **Automatizaciones:** n8n (para conectar la base de datos con servicios de mensajería).
*   **Hosting/Despliegue:** Vercel/Netlify para frontend, Render/Railway para backend y base de datos.

## 5. Arquitectura de Base de Datos (Tablas Principales)
1.  **`users`:** id, nombre, email, password_hash, rol (trainer/client), trainer_id (si es cliente).
2.  **`workouts`:** id, trainer_id, nombre_plantilla, descripcion.
3.  **`workout_assignments`:** id, client_id, workout_id, fecha_asignada, completado (boolean).
4.  **`nutrition_goals`:** id, client_id, calorias, proteinas, carbohidratos, grasas, fecha_inicio.
5.  **`progress_logs`:** id, client_id, fecha, peso, notas_cliente, url_foto_frente, url_foto_perfil.

## 6. Hoja de Ruta de Desarrollo (Roadmap)

*   **Fase 1: Estructura y Base de Datos (Semanas 1-2)**
    *   Configurar repositorios.
    *   Diseñar y crear la base de datos PostgreSQL.
    *   Implementar autenticación (Login/Registro para entrenadores).

*   **Fase 2: Core del Entrenador (Semanas 3-4)**
    *   Desarrollar panel del entrenador.
    *   CRUD (Crear, Leer, Actualizar, Borrar) de clientes.
    *   Módulo para asignar macros y rutinas básicas.

*   **Fase 3: Experiencia del Cliente (Semanas 5-6)**
    *   Desarrollar vistas responsivas para el cliente.
    *   Formularios de check-in y subida de imágenes (usando un servicio como AWS S3 o Cloudinary).

*   **Fase 4: Pruebas y Lanzamiento Beta (Semana 7)**
    *   Conseguir 2 entrenadores reales para que usen la plataforma gratis durante 1 mes.
    *   Corregir bugs y recolectar feedback.