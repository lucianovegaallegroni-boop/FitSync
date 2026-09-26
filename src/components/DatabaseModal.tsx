import React, { useState } from 'react';
import { X, Check, Copy, ExternalLink, Terminal, ShieldAlert } from 'lucide-react';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_SCHEMA_SUMMARY = `-- FitSync Supabase Schema
-- Copia y pega esto en tu Supabase SQL Editor (Dashboard > SQL Editor)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tablas creadas:
-- 1. profiles (id, email, full_name, role, trainer_id, medical_history, goals)
-- 2. workouts (id, trainer_id, title, description)
-- 3. workout_exercises (id, workout_id, day_name, exercise_name, sets, reps, rest_seconds)
-- 4. workout_assignments (id, client_id, workout_id, assigned_date, completed)
-- 5. nutrition_goals (id, client_id, calories, protein_g, carbs_g, fat_g)
-- 6. progress_logs (id, client_id, date, weight, waist_cm, chest_cm, notes_cliente, url_foto_frente)
-- 7. daily_nutrition_logs (id, client_id, date, calories_met, protein_met, water_liters)

-- Incluye políticas RLS completas, Triggers de auth y bucket 'progress-photos'.
-- Archivo completo en: /supabase/schema.sql`;

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SUMMARY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Conexión Supabase Backend</h3>
            <p className="text-xs text-slate-400 font-mono">webrizefhxccighruoem.supabase.co</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-300">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Estado de conexión:</span>
              <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                API Key configurada en .env
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Project Ref:</span>
              <span className="font-mono text-slate-200">webrizefhxccighruoem</span>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <p className="font-semibold text-amber-300 mb-1">Para habilitar la persistencia remota completa:</p>
              Abre el SQL Editor de tu Supabase Dashboard y ejecuta el script que generamos en <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-200">supabase/schema.sql</code>. Esto creará automáticamente las 7 tablas del MVP, las políticas RLS y el bucket de fotos de progreso.
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Script SQL preparado</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg border border-slate-700 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar esquema'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-emerald-400/90 font-mono overflow-x-auto max-h-48 scrollbar-thin">
              {SQL_SCHEMA_SUMMARY}
            </pre>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <a
              href="https://supabase.com/dashboard/project/webrizefhxccighruoem/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-4 py-2 rounded-xl text-xs transition-colors"
            >
              <span>Abrir SQL Editor en Supabase</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
