import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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

export async function exportNutritionPlanToPDF({
  clientName,
  clientEmail,
  coachName = 'Entrenador FitSync',
  nutrition,
}: ExportPDFOptions): Promise<void> {
  const dateStr = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const cleanClientName = clientName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const fileName = `Plan_Nutricional_${cleanClientName || 'FitSync'}.pdf`;

  const dietDays = nutrition.diet_days && nutrition.diet_days.length > 0
    ? nutrition.diet_days
    : [
        {
          id: 'std',
          day_name: 'Plan Estándar Diario',
          meals: [],
        },
      ];

  // Contenedor fuera de pantalla para renderizar con estilos nativos
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-99999px';
  container.style.width = '794px'; // Ancho A4 a 96 DPI
  container.style.background = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  container.style.padding = '32px 30px';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-9999';

  container.innerHTML = `
    <!-- Header -->
    <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="background: #10b981; color: #ffffff; font-weight: 900; font-size: 16px; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          FS
        </div>
        <div>
          <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a;">
            Fit<span style="color: #10b981;">Sync</span>
          </div>
          <div style="font-size: 10px; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">
            SISTEMA DE GESTIÓN DE ENTRENAMIENTO & NUTRICIÓN
          </div>
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 15px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
          Plan de Nutrición
        </div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
          Emisión: ${dateStr}
        </div>
      </div>
    </div>

    <!-- Info Card -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div>
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 2px;">
          Atleta / Cliente
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #0f172a;">
          ${clientName}
        </div>
        ${clientEmail ? `<div style="font-size: 11px; color: #64748b;">${clientEmail}</div>` : ''}
      </div>
      <div>
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 2px;">
          Entrenador Asignado
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #0f172a;">
          ${coachName}
        </div>
        <div style="font-size: 11px; color: #64748b;">Asesoramiento Deportivo Personalizado</div>
      </div>
    </div>

    <!-- Daily Target Macros -->
    <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
      <span style="display: inline-block; width: 4px; height: 13px; background: #10b981; border-radius: 2px;"></span>
      Objetivos Diarios Asignados
    </div>

    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px;">
      <div style="border: 1px solid #a7f3d0; background: #ecfdf5; border-radius: 10px; padding: 10px 12px; text-align: center;">
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #065f46; margin-bottom: 3px;">
          Calorías Totales
        </div>
        <div style="font-family: monospace; font-size: 18px; font-weight: 800; color: #059669;">
          ${nutrition.calories} <span style="font-size: 11px; font-weight: 500;">kcal</span>
        </div>
      </div>

      <div style="border: 1px solid #e2e8f0; background: #ffffff; border-radius: 10px; padding: 10px 12px; text-align: center;">
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 3px;">
          Proteínas
        </div>
        <div style="font-family: monospace; font-size: 18px; font-weight: 800; color: #059669;">
          ${nutrition.protein_g}g
        </div>
      </div>

      <div style="border: 1px solid #e2e8f0; background: #ffffff; border-radius: 10px; padding: 10px 12px; text-align: center;">
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 3px;">
          Carbohidratos
        </div>
        <div style="font-family: monospace; font-size: 18px; font-weight: 800; color: #0284c7;">
          ${nutrition.carbs_g}g
        </div>
      </div>

      <div style="border: 1px solid #e2e8f0; background: #ffffff; border-radius: 10px; padding: 10px 12px; text-align: center;">
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 3px;">
          Grasas
        </div>
        <div style="font-family: monospace; font-size: 18px; font-weight: 800; color: #d97706;">
          ${nutrition.fat_g}g
        </div>
      </div>
    </div>

    <!-- Coach Notes -->
    ${
      nutrition.notes
        ? `
      <div style="background: #f0fdf4; border-left: 3px solid #10b981; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px; font-size: 11px; color: #166534; line-height: 1.45;">
        <strong style="display: block; margin-bottom: 3px; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; color: #15803d;">
          Instrucciones y Pautas del Coach
        </strong>
        ${nutrition.notes}
      </div>
    `
        : ''
    }

    <!-- Diet Days & Meals -->
    <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
      <span style="display: inline-block; width: 4px; height: 13px; background: #10b981; border-radius: 2px;"></span>
      Distribución y Menú de Comidas
    </div>

    ${dietDays
      .map(
        (day) => `
      <div style="margin-bottom: 20px;">
        <div style="background: #0f172a; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 7px 12px; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center;">
          <span>${day.day_name}</span>
          <span style="font-size: 10px; opacity: 0.85;">${day.meals?.length || 0} comidas</span>
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
            <div style="border: 1px solid #cbd5e1; border-top: none; padding: 10px 12px; background: #ffffff;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="background: #ecfdf5; color: #059669; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid #a7f3d0; font-family: monospace;">
                    Comida ${meal.meal_number}
                  </span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">
                    ${meal.name || `Comida ${meal.meal_number}`}
                  </span>
                  ${meal.time_suggested ? `<span style="font-size: 10px; color: #64748b; font-family: monospace;">🕒 ${meal.time_suggested}</span>` : ''}
                </div>
                <div style="font-family: monospace; font-size: 10px; color: #475569; background: #f1f5f9; padding: 2px 7px; border-radius: 4px; font-weight: 600;">
                  ${mealKcal} kcal | ${mealProt}g P | ${mealCarb}g C | ${mealFat}g G
                </div>
              </div>

              ${
                meal.foods && meal.foods.length > 0
                  ? `
                <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 4px;">
                  <thead>
                    <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700;">
                      <th style="text-align: left; padding: 4px 6px; width: 45%;">Alimento</th>
                      <th style="text-align: left; padding: 4px 6px; width: 22%;">Porción</th>
                      <th style="text-align: right; padding: 4px 6px; width: 12%;">Calorías</th>
                      <th style="text-align: right; padding: 4px 6px; width: 7%;">P</th>
                      <th style="text-align: right; padding: 4px 6px; width: 7%;">C</th>
                      <th style="text-align: right; padding: 4px 6px; width: 7%;">G</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${meal.foods
                      .map(
                        (food) => `
                      <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 5px 6px; font-weight: 600; color: #0f172a;">${food.name}</td>
                        <td style="padding: 5px 6px; color: #64748b; font-size: 10px;">${food.portion || '-'}</td>
                        <td style="padding: 5px 6px; text-align: right; font-family: monospace; font-weight: 700;">${food.calories}</td>
                        <td style="padding: 5px 6px; text-align: right; font-family: monospace; color: #059669;">${food.protein_g}g</td>
                        <td style="padding: 5px 6px; text-align: right; font-family: monospace; color: #0284c7;">${food.carbs_g}g</td>
                        <td style="padding: 5px 6px; text-align: right; font-family: monospace; color: #d97706;">${food.fat_g}g</td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              `
                  : `
                <div style="font-size: 10px; color: #94a3b8; font-style: italic; padding: 2px 0;">
                  Sin alimentos específicos registrados.
                </div>
              `
              }
            </div>
          `;
                })
                .join('')
            : `
          <div style="border: 1px solid #cbd5e1; border-top: none; border-radius: 0 0 8px 8px; text-align: center; color: #94a3b8; padding: 14px; font-size: 11px;">
            No se han configurado comidas para este día.
          </div>
        `
        }
      </div>
    `
      )
      .join('')}

    <!-- Footer -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 20px; text-align: center; color: #94a3b8; font-size: 10px;">
      FitSync • Sistema Integral de Entrenamiento y Nutrición Deportiva • Documento confidencial para ${clientName}
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    document.body.removeChild(container);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const contentWidth = pageWidth - margin * 2; // 190mm
    const contentHeight = pageHeight - margin * 2; // 277mm

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const mmPerPx = contentWidth / canvasWidth;
    const pageHeightPx = contentHeight / mmPerPx;

    if (canvasHeight <= pageHeightPx) {
      // Entra en 1 sola página
      const imgData = canvas.toDataURL('image/png');
      const imgHeight = canvasHeight * mmPerPx;
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, imgHeight);
    } else {
      // Múltiples páginas divididas limpiamente
      let renderedHeightPx = 0;
      let pageIndex = 0;

      while (renderedHeightPx < canvasHeight) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const chunkHeightPx = Math.min(pageHeightPx, canvasHeight - renderedHeightPx);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvasWidth;
        sliceCanvas.height = chunkHeightPx;
        const ctx = sliceCanvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvasWidth, chunkHeightPx);
          ctx.drawImage(
            canvas,
            0,
            renderedHeightPx,
            canvasWidth,
            chunkHeightPx,
            0,
            0,
            canvasWidth,
            chunkHeightPx
          );

          const sliceData = sliceCanvas.toDataURL('image/png');
          const sliceHeightMm = chunkHeightPx * mmPerPx;
          pdf.addImage(sliceData, 'PNG', margin, margin, contentWidth, sliceHeightMm);
        }

        renderedHeightPx += chunkHeightPx;
        pageIndex++;
      }
    }

    // Descarga directa del archivo PDF en el navegador
    pdf.save(fileName);
  } catch (error) {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    console.error('Error al generar la descarga directa del PDF:', error);
    alert('Hubo un error al generar el PDF. Por favor, intenta de nuevo.');
  }
}
