import { DayDietPlan } from '../types/database';

interface ExportPDFOptions {
  clientName: string;
  clientEmail?: string;
  coachName?: string;
  nutrition: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    meals_per_day?: number;
    notes?: string;
    start_date?: string;
    diet_days?: DayDietPlan[];
  };
}

export function exportNutritionPlanToPDF({
  clientName,
  clientEmail,
  coachName = 'Entrenador FitSync',
  nutrition,
}: ExportPDFOptions) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite las ventanas emergentes en tu navegador para generar el PDF.');
    return;
  }

  const dateStr = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const dietDays = nutrition.diet_days && nutrition.diet_days.length > 0
    ? nutrition.diet_days
    : [
        {
          id: 'std',
          day_name: 'Plan Estándar Diario',
          meals: [],
        },
      ];

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Plan Nutricional - ${clientName} - FitSync</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

    @page {
      size: A4;
      margin: 14mm 12mm 14mm 12mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      line-height: 1.45;
      font-size: 12px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .no-print-bar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #090d16;
      color: #f8fafc;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #10b981;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .no-print-btn {
      background: #10b981;
      color: #022c22;
      border: none;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }

    .no-print-btn:hover {
      background: #059669;
      color: #ffffff;
    }

    .no-print-close {
      background: transparent;
      color: #94a3b8;
      border: 1px solid #334155;
      padding: 6px 14px;
      font-size: 12px;
      border-radius: 6px;
      cursor: pointer;
    }

    .no-print-close:hover {
      color: #ffffff;
      border-color: #64748b;
    }

    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        background: transparent;
      }
      .page-break {
        page-break-before: always;
      }
    }

    .document-container {
      max-width: 820px;
      margin: 0 auto;
      padding: 24px 20px;
    }

    /* Header */
    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-badge {
      background: #10b981;
      color: #ffffff;
      font-weight: 900;
      font-size: 18px;
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-name {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }

    .brand-name span {
      color: #10b981;
    }

    .doc-meta {
      text-align: right;
    }

    .doc-meta .doc-title {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .doc-meta .doc-date {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }

    /* Client & Coach Info Box */
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .info-item .info-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 2px;
    }

    .info-item .info-value {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }

    .info-item .info-sub {
      font-size: 11px;
      color: #64748b;
    }

    /* Daily Target Macros Grid */
    .section-heading {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .section-heading::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 14px;
      background: #10b981;
      border-radius: 2px;
    }

    .macros-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }

    .macro-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 12px;
      background: #ffffff;
      text-align: center;
    }

    .macro-card.primary {
      background: #ecfdf5;
      border-color: #a7f3d0;
    }

    .macro-card .macro-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #64748b;
      margin-bottom: 4px;
    }

    .macro-card .macro-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
    }

    .macro-card.primary .macro-val {
      color: #059669;
    }

    .macro-card.protein .macro-val {
      color: #059669;
    }

    .macro-card.carbs .macro-val {
      color: #0284c7;
    }

    .macro-card.fat .macro-val {
      color: #d97706;
    }

    /* Coach Recommendations Note */
    .notes-box {
      background: #f0fdf4;
      border-left: 3px solid #10b981;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 22px;
      font-size: 11px;
      color: #166534;
    }

    .notes-box strong {
      display: block;
      margin-bottom: 3px;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
      color: #15803d;
    }

    /* Diet Days & Meals */
    .day-block {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }

    .day-title {
      background: #0f172a;
      color: #ffffff;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding: 7px 14px;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .meal-card {
      border: 1px solid #cbd5e1;
      border-top: none;
      padding: 12px 14px;
      background: #ffffff;
      page-break-inside: avoid;
    }

    .meal-card:last-child {
      border-radius: 0 0 8px 8px;
    }

    .meal-card:not(:last-child) {
      border-bottom: 1px dashed #cbd5e1;
    }

    .meal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .meal-name-badge {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .meal-num {
      background: #ecfdf5;
      color: #059669;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 6px;
      border: 1px solid #a7f3d0;
      font-family: 'JetBrains Mono', monospace;
    }

    .meal-name {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }

    .meal-time {
      font-size: 10px;
      color: #64748b;
      font-family: 'JetBrains Mono', monospace;
    }

    .meal-subtotal {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #475569;
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 5px;
      font-weight: 600;
    }

    /* Food Items Table */
    .food-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }

    .food-table th {
      text-align: left;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      padding: 5px 8px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .food-table th.right, .food-table td.right {
      text-align: right;
    }

    .food-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }

    .food-table tr:last-child td {
      border-bottom: none;
    }

    .food-table .food-name {
      font-weight: 600;
      color: #0f172a;
    }

    .food-table .food-portion {
      color: #64748b;
      font-size: 10px;
    }

    .food-table .num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
    }

    /* Footer */
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      margin-top: 24px;
      text-align: center;
      color: #94a3b8;
      font-size: 10px;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <!-- Floating Top Bar for browser print view -->
  <div class="no-print-bar">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-weight: 800; color: #10b981; font-size: 15px;">FitSync</span>
      <span style="font-size: 13px; color: #cbd5e1;">| Vista de Impresión & Exportación PDF</span>
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="no-print-btn" onclick="window.print()">
        🖨️ Guardar o Imprimir PDF
      </button>
      <button class="no-print-close" onclick="window.close()">
        Cerrar
      </button>
    </div>
  </div>

  <div class="document-container">
    <!-- Header -->
    <div class="header">
      <div class="brand">
        <div class="brand-badge">FS</div>
        <div class="brand-name">Fit<span>Sync</span></div>
      </div>
      <div class="doc-meta">
        <div class="doc-title">Plan de Nutrición Personalizado</div>
        <div class="doc-date">Fecha de emisión: ${dateStr}</div>
      </div>
    </div>

    <!-- Client & Coach Info -->
    <div class="info-card">
      <div class="info-item">
        <div class="info-label">Atleta / Cliente</div>
        <div class="info-value">${clientName}</div>
        ${clientEmail ? `<div class="info-sub">${clientEmail}</div>` : ''}
      </div>
      <div class="info-item">
        <div class="info-label">Entrenador Responsable</div>
        <div class="info-value">${coachName}</div>
        <div class="info-sub">Plataforma FitSync Coaching</div>
      </div>
    </div>

    <!-- Daily Target Macros -->
    <div class="section-heading">Objetivos Diarios Asignados</div>
    <div class="macros-grid">
      <div class="macro-card primary">
        <div class="macro-title">Calorías Totales</div>
        <div class="macro-val">${nutrition.calories} <span style="font-size: 11px; font-weight: 500;">kcal</span></div>
      </div>
      <div class="macro-card protein">
        <div class="macro-title">Proteínas</div>
        <div class="macro-val">${nutrition.protein_g}g</div>
      </div>
      <div class="macro-card carbs">
        <div class="macro-title">Carbohidratos</div>
        <div class="macro-val">${nutrition.carbs_g}g</div>
      </div>
      <div class="macro-card fat">
        <div class="macro-title">Grasas</div>
        <div class="macro-val">${nutrition.fat_g}g</div>
      </div>
    </div>

    <!-- Coach Notes -->
    ${
      nutrition.notes
        ? `
    <div class="notes-box">
      <strong>Instrucciones y Pautas del Coach</strong>
      ${nutrition.notes}
    </div>
    `
        : ''
    }

    <!-- Diet Days & Meals Breakdown -->
    <div class="section-heading" style="margin-top: 22px;">Distribución y Menú de Comidas</div>

    ${dietDays
      .map(
        (day) => `
      <div class="day-block">
        <div class="day-title">
          <span>${day.day_name}</span>
          <span style="font-size: 10px; font-weight: 600; opacity: 0.85;">
            ${day.meals?.length || 0} comidas programadas
          </span>
        </div>

        ${
          day.meals && day.meals.length > 0
            ? day.meals
                .map((meal) => {
                  const mealKcal = meal.foods?.reduce((sum, f) => sum + (Number(f.calories) || 0), 0) || 0;
                  const mealProt = meal.foods?.reduce((sum, f) => sum + (Number(f.protein_g) || 0), 0) || 0;
                  const mealCarb = meal.foods?.reduce((sum, f) => sum + (Number(f.carbs_g) || 0), 0) || 0;
                  const mealFat = meal.foods?.reduce((sum, f) => sum + (Number(f.fat_g) || 0), 0) || 0;

                  return `
            <div class="meal-card">
              <div class="meal-header">
                <div class="meal-name-badge">
                  <span class="meal-num">Comida ${meal.meal_number}</span>
                  <span class="meal-name">${meal.name || `Comida ${meal.meal_number}`}</span>
                  ${meal.time_suggested ? `<span class="meal-time">🕒 ${meal.time_suggested}</span>` : ''}
                </div>
                <div class="meal-subtotal">
                  ${mealKcal} kcal | ${mealProt}g P | ${mealCarb}g C | ${mealFat}g G
                </div>
              </div>

              ${
                meal.foods && meal.foods.length > 0
                  ? `
                <table class="food-table">
                  <thead>
                    <tr>
                      <th style="width: 45%;">Alimento</th>
                      <th style="width: 20%;">Porción</th>
                      <th class="right" style="width: 12%;">Calorías</th>
                      <th class="right" style="width: 7%;">P</th>
                      <th class="right" style="width: 7%;">C</th>
                      <th class="right" style="width: 7%;">G</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${meal.foods
                      .map(
                        (food) => `
                      <tr>
                        <td><span class="food-name">${food.name}</span></td>
                        <td><span class="food-portion">${food.portion || '-'}</span></td>
                        <td class="right num"><strong>${food.calories}</strong></td>
                        <td class="right num" style="color: #059669;">${food.protein_g}g</td>
                        <td class="right num" style="color: #0284c7;">${food.carbs_g}g</td>
                        <td class="right num" style="color: #d97706;">${food.fat_g}g</td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              `
                  : `
                <p style="font-size: 10.5px; color: #94a3b8; font-style: italic; padding: 4px 0;">
                  Sin alimentos específicos registrados para esta comida.
                </p>
              `
              }
            </div>
          `;
                })
                .join('')
            : `
          <div class="meal-card" style="border-radius: 0 0 8px 8px; text-align: center; color: #94a3b8; padding: 18px;">
            No se han configurado comidas para este día.
          </div>
        `
        }
      </div>
    `
      )
      .join('')}

    <!-- Footer -->
    <div class="footer">
      FitSync • Sistema Integral de Entrenamiento y Nutrición Deportiva • Documento confidencial para ${clientName}
    </div>
  </div>

  <script>
    // Iniciar automáticamente el diálogo de impresión/guardado a PDF
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
}
