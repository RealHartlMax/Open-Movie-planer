import html2pdf from 'html2pdf.js';

type ExportLocaleOptions = {
  locale: string;
  currency?: string;
};

function formatCurrency(value: number, options: ExportLocaleOptions): string {
  return new Intl.NumberFormat(options.locale, {
    style: 'currency',
    currency: options.currency ?? 'EUR',
    maximumFractionDigits: 2,
  }).format(value);
}

export interface ExportOptions {
  filename: string;
  title: string;
  format?: 'pdf' | 'html';
}

/**
 * Export HTML element to PDF
 */
export async function exportToPDF(
  elementId: string,
  options: ExportOptions
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  const htmlElement = element.cloneNode(true) as HTMLElement;

  const pdfOptions = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename: `${options.filename}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' },
  };

  try {
    html2pdf().set(pdfOptions).from(htmlElement).save();
  } catch (error) {
    console.error('Error exporting to PDF:', error);
  }
}

/**
 * Generate Kalkulation (Cost Positions) report HTML
 */
export function generateKalkulationHTML(
  projectTitle: string,
  costAccountingData: any[],
  options: ExportLocaleOptions & {
    labels: {
      costCenter: string;
      budget: string;
      spent: string;
      remaining: string;
      totalBudget: string;
      totalSpent: string;
      totalRemaining: string;
      reportTitle: string;
    };
  }
): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h1 style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px;">
        ${projectTitle} - ${options.labels.reportTitle}
      </h1>
      
      <div style="margin-top: 20px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead style="background-color: #f0f0f0;">
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${options.labels.costCenter}</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">${options.labels.budget}</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">${options.labels.spent}</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">${options.labels.remaining}</th>
            </tr>
          </thead>
          <tbody>
            ${costAccountingData.map((row) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${row.costCenterName}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(row.sollAmount, options)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(row.istAmount, options)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; ${row.sollAmount - row.istAmount < 0 ? 'color: red;' : ''}">
                  ${formatCurrency(row.sollAmount - row.istAmount, options)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="border-top: 2px solid #333; padding-top: 10px; margin-top: 20px;">
          <p><strong>${options.labels.totalBudget}</strong> ${formatCurrency(costAccountingData.reduce((sum, row) => sum + row.sollAmount, 0), options)}</p>
          <p><strong>${options.labels.totalSpent}</strong> ${formatCurrency(costAccountingData.reduce((sum, row) => sum + row.istAmount, 0), options)}</p>
          <p><strong>${options.labels.totalRemaining}</strong> ${formatCurrency(costAccountingData.reduce((sum, row) => sum + (row.sollAmount - row.istAmount), 0), options)}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate Drehplan (Shoot Days) report HTML
 */
export function generateDrehplanHTML(
  projectTitle: string,
  shootDays: any[],
  options: ExportLocaleOptions & {
    labels: {
      date: string;
      location: string;
      notes: string;
      reportTitle: string;
    };
  }
): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h1 style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px;">
        ${projectTitle} - ${options.labels.reportTitle}
      </h1>
      
      <div style="margin-top: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="background-color: #f0f0f0;">
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${options.labels.date}</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${options.labels.location}</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${options.labels.notes}</th>
            </tr>
          </thead>
          <tbody>
            ${shootDays.map((day) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">
                  ${new Date(day.date).toLocaleDateString(options.locale)}
                </td>
                <td style="border: 1px solid #ddd; padding: 8px;">${day.location || '—'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${day.notes || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function generateDrehdispoHTML(
  projectTitle: string,
  disposition: {
    date: string;
    location: string | null;
    callTime: string | null;
    weather: string | null;
    notes: string | null;
    activities: Array<{
      id: string;
      title: string;
      time: string | null;
      crew: string | null;
      notes: string | null;
      transport?: string | null;
      equipment?: string | null;
      catering?: string | null;
    }>;
    scenes?: Array<{
      id: string;
      sceneNumber: string;
      title: string;
      synopsis: string | null;
      location: string | null;
      estimatedDuration: number | null;
    }>;
    crewAssignments?: Array<{
      id: string;
      name: string;
      role: string | null;
      callTime: string | null;
      wrapTime: string | null;
      notes: string | null;
    }>;
    castAssignments?: Array<{
      id: string;
      name: string;
      character: string | null;
      callTime: string | null;
      scenes: string | null;
      notes: string | null;
    }>;
  },
  options: ExportLocaleOptions & {
    labels: {
      reportTitle: string;
      date: string;
      location: string;
      callTime: string;
      weather: string;
      generalNotes: string;
      sceneTableTitle: string;
      time: string;
      scene: string;
      crew: string;
      notes: string;
      scenes?: string;
      transport?: string;
      equipment?: string;
      catering?: string;
      crewTitle?: string;
      castTitle?: string;
      sceneNumber?: string;
      sceneTitle?: string;
      synopsis?: string;
      duration?: string;
      role?: string;
      wrapTime?: string;
      character?: string;
    };
  }
): string {
  const scenes = disposition.scenes ?? [];
  const crewAssignments = disposition.crewAssignments ?? [];
  const castAssignments = disposition.castAssignments ?? [];
  const l = options.labels;

  const scenesSection = scenes.length > 0 ? `
    <h2 style="margin-top: 26px; border-bottom: 1px solid #999; padding-bottom: 6px;">${l.scenes ?? "Scenes"}</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 10pt;">
      <thead style="background-color: #f0f0f0;">
        <tr>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">#</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.sceneTitle ?? "Title"}</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.synopsis ?? "Synopsis"}</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.location}</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">${l.duration ?? "min"}</th>
        </tr>
      </thead>
      <tbody>
        ${scenes.map((s) => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>${s.sceneNumber}</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${s.title}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${s.synopsis ?? "-"}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${s.location ?? "-"}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${s.estimatedDuration != null ? s.estimatedDuration : "-"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : "";

  const crewSection = crewAssignments.length > 0 ? `
    <h2 style="margin-top: 26px; border-bottom: 1px solid #999; padding-bottom: 6px;">${l.crewTitle ?? "Crew"}</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 10pt;">
      <thead style="background-color: #f0f0f0;">
        <tr>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.crew}</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.role ?? "Role"}</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.callTime}</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.wrapTime ?? "Wrap"}</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.notes}</th>
        </tr>
      </thead>
      <tbody>
        ${crewAssignments.map((c) => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>${c.name}</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${c.role ?? "-"}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${c.callTime ?? "-"}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${c.wrapTime ?? "-"}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${c.notes ?? "-"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : "";

  const castSection = castAssignments.length > 0 ? `
    <h2 style="margin-top: 26px; border-bottom: 1px solid #999; padding-bottom: 6px;">${l.castTitle ?? "Cast"}</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 10pt;">
      <thead style="background-color: #f0f0f0;">
        <tr>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Name</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.character ?? "Character"}</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.callTime}</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.scene}</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.notes}</th>
        </tr>
      </thead>
      <tbody>
        ${castAssignments.map((c) => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>${c.name}</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${c.character ?? "-"}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${c.callTime ?? "-"}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${c.scenes ?? "-"}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${c.notes ?? "-"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : "";

  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h1 style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px;">
        ${projectTitle} - ${l.reportTitle}
      </h1>

      <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px;">
        <div style="border: 1px solid #ddd; padding: 10px;"><strong>${l.date}:</strong> ${new Date(disposition.date).toLocaleDateString(options.locale)}</div>
        <div style="border: 1px solid #ddd; padding: 10px;"><strong>${l.location}:</strong> ${disposition.location || "-"}</div>
        <div style="border: 1px solid #ddd; padding: 10px;"><strong>${l.callTime}:</strong> ${disposition.callTime || "-"}</div>
        <div style="border: 1px solid #ddd; padding: 10px;"><strong>${l.weather}:</strong> ${disposition.weather || "-"}</div>
      </div>

      <h2 style="margin-top: 26px; border-bottom: 1px solid #999; padding-bottom: 6px;">${l.sceneTableTitle}</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
        <thead style="background-color: #f0f0f0;">
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.time}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.scene}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.crew}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.transport ?? "Transport"}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.equipment ?? "Equipment"}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.catering ?? "Catering"}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${l.notes}</th>
          </tr>
        </thead>
        <tbody>
          ${disposition.activities.length === 0 ? `
            <tr>
              <td colspan="7" style="border: 1px solid #ddd; padding: 8px;">-</td>
            </tr>
          ` : disposition.activities.map((activity) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${activity.time || "-"}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${activity.title}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${activity.crew || "-"}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${activity.transport || "-"}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${activity.equipment || "-"}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${activity.catering || "-"}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${activity.notes || "-"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      ${scenesSection}
      ${crewSection}
      ${castSection}

      <h2 style="margin-top: 26px; border-bottom: 1px solid #999; padding-bottom: 6px;">${l.generalNotes}</h2>
      <div style="border: 1px solid #ddd; padding: 12px; min-height: 60px; margin-top: 10px;">
        ${disposition.notes || "-"}
      </div>
    </div>
  `;
}

/**
 * Generate external cost accounting report HTML
 */
export function generateCostAccountingHTML(
  projectTitle: string,
  costAccountingData: any[],
  options: ExportLocaleOptions & {
    labels: {
      costCenter: string;
      shouldAmount: string;
      isAmount: string;
      forecast: string;
      endCosts: string;
      variance: string;
      totalSoll: string;
      totalIst: string;
      totalForecast: string;
      totalVariance: string;
      reportTitle: string;
    };
  }
): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h1 style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px;">
        ${projectTitle} - ${options.labels.reportTitle}
      </h1>
      
      <div style="margin-top: 20px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt;">
          <thead style="background-color: #f0f0f0;">
            <tr>
              <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">${options.labels.costCenter}</th>
              <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">${options.labels.shouldAmount}</th>
              <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">${options.labels.isAmount}</th>
              <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">${options.labels.forecast}</th>
              <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">${options.labels.endCosts}</th>
              <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">${options.labels.variance}</th>
            </tr>
          </thead>
          <tbody>
            ${costAccountingData.map((row) => {
              const variance = row.sollAmount - row.istAmount;
              const varianceColor = variance < 0 ? '#d32f2f' : variance < row.sollAmount * 0.1 ? '#f57c00' : '#388e3c';
              return `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 6px;">${row.costCenterName}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${formatCurrency(row.sollAmount, options)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${formatCurrency(row.istAmount, options)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${formatCurrency(row.forecastAmount, options)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${formatCurrency(row.endkosten, options)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right; color: ${varianceColor}; font-weight: bold;">
                    ${formatCurrency(variance, options)}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div style="border-top: 2px solid #333; padding-top: 10px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px;"><strong>${options.labels.totalSoll}</strong></td>
              <td style="padding: 5px; text-align: right;">${formatCurrency(costAccountingData.reduce((sum, row) => sum + row.sollAmount, 0), options)}</td>
            </tr>
            <tr>
              <td style="padding: 5px;"><strong>${options.labels.totalIst}</strong></td>
              <td style="padding: 5px; text-align: right;">${formatCurrency(costAccountingData.reduce((sum, row) => sum + row.istAmount, 0), options)}</td>
            </tr>
            <tr>
              <td style="padding: 5px;"><strong>${options.labels.totalForecast}</strong></td>
              <td style="padding: 5px; text-align: right;">${formatCurrency(costAccountingData.reduce((sum, row) => sum + row.forecastAmount, 0), options)}</td>
            </tr>
            <tr style="border-top: 2px solid #333;">
              <td style="padding: 5px;"><strong>${options.labels.totalVariance}</strong></td>
              <td style="padding: 5px; text-align: right; font-weight: bold;">
                ${formatCurrency(costAccountingData.reduce((sum, row) => sum + row.variance, 0), options)}
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate complete report HTML (all modules together)
 */
export function generateCompleteReportHTML(
  projectTitle: string,
  projectDescription: string,
  costAccountingData: any[],
  shootDays: any[],
  exportDate: Date,
  options: ExportLocaleOptions & {
    labels: {
      projectReport: string;
      createdAt: string;
      tableOfContents: string;
      externalCostAccounting: string;
      budgeting: string;
      shootSchedule: string;
      costCenter: string;
      budget: string;
      spent: string;
      remaining: string;
      shouldAmount: string;
      isAmount: string;
      forecast: string;
      endCosts: string;
      variance: string;
      date: string;
      location: string;
      notes: string;
      totalSoll: string;
      totalIst: string;
      totalVariance: string;
    };
  }
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${projectTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        h1 { text-align: center; border-bottom: 3px solid #333; padding-bottom: 15px; page-break-after: avoid; }
        h2 { border-bottom: 2px solid #666; padding-bottom: 10px; page-break-after: avoid; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #f0f0f0; border: 1px solid #ddd; padding: 8px; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; }
        .cover-page { text-align: center; page-break-after: always; padding-top: 100px; }
        .cover-page h1 { border: none; font-size: 36px; margin-bottom: 20px; }
        .toc { page-break-after: always; }
        .toc h2 { border: none; }
        .toc ul { list-style: none; padding-left: 0; }
        .toc li { padding: 5px 0; }
        .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>
      <!-- Cover Page -->
      <div class="cover-page">
        <h1>${projectTitle}</h1>
        <p style="font-size: 14px;">${projectDescription || options.labels.projectReport}</p>
        <p style="margin-top: 40px; font-size: 12px;">${options.labels.createdAt}: ${exportDate.toLocaleDateString(options.locale)} ${exportDate.toLocaleTimeString(options.locale)}</p>
      </div>

      <!-- Table of Contents -->
      <div class="toc">
        <h2>${options.labels.tableOfContents}</h2>
        <ul>
          <li>1. ${options.labels.externalCostAccounting}</li>
          <li>2. ${options.labels.budgeting}</li>
          <li>3. ${options.labels.shootSchedule}</li>
        </ul>
      </div>

      <!-- External Cost Accounting -->
      <div class="page-break">
        <h2>1. ${options.labels.externalCostAccounting}</h2>
        <table style="font-size: 10pt;">
          <thead style="background-color: #f0f0f0;">
            <tr>
              <th>${options.labels.costCenter}</th>
              <th style="text-align: right;">${options.labels.shouldAmount}</th>
              <th style="text-align: right;">${options.labels.isAmount}</th>
              <th style="text-align: right;">${options.labels.forecast}</th>
              <th style="text-align: right;">${options.labels.endCosts}</th>
              <th style="text-align: right;">${options.labels.variance}</th>
            </tr>
          </thead>
          <tbody>
            ${costAccountingData.map((row) => {
              const variance = row.sollAmount - row.istAmount;
              const varianceColor = variance < 0 ? '#d32f2f' : variance < row.sollAmount * 0.1 ? '#f57c00' : '#388e3c';
              return `
                <tr>
                  <td>${row.costCenterName}</td>
                  <td style="text-align: right;">${formatCurrency(row.sollAmount, options)}</td>
                  <td style="text-align: right;">${formatCurrency(row.istAmount, options)}</td>
                  <td style="text-align: right;">${formatCurrency(row.forecastAmount, options)}</td>
                  <td style="text-align: right;">${formatCurrency(row.endkosten, options)}</td>
                  <td style="text-align: right; color: ${varianceColor}; font-weight: bold;">${formatCurrency(variance, options)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <div class="summary">
          <p><strong>${options.labels.totalSoll}</strong> ${formatCurrency(costAccountingData.reduce((sum, row) => sum + row.sollAmount, 0), options)}</p>
          <p><strong>${options.labels.totalIst}</strong> ${formatCurrency(costAccountingData.reduce((sum, row) => sum + row.istAmount, 0), options)}</p>
          <p><strong>${options.labels.totalVariance}</strong> ${formatCurrency(costAccountingData.reduce((sum, row) => sum + row.variance, 0), options)}</p>
        </div>
      </div>

      <!-- Kalkulation -->
      <div class="page-break">
        <h2>2. ${options.labels.budgeting}</h2>
        <table>
          <thead style="background-color: #f0f0f0;">
            <tr>
              <th>${options.labels.costCenter}</th>
              <th style="text-align: right;">${options.labels.budget}</th>
              <th style="text-align: right;">${options.labels.spent}</th>
              <th style="text-align: right;">${options.labels.remaining}</th>
            </tr>
          </thead>
          <tbody>
            ${costAccountingData.map((row) => `
              <tr>
                <td>${row.costCenterName}</td>
                <td style="text-align: right;">${formatCurrency(row.sollAmount, options)}</td>
                <td style="text-align: right;">${formatCurrency(row.istAmount, options)}</td>
                <td style="text-align: right; ${row.sollAmount - row.istAmount < 0 ? 'color: red;' : ''}">
                  ${formatCurrency(row.sollAmount - row.istAmount, options)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Drehplan -->
      <div class="page-break">
        <h2>3. ${options.labels.shootSchedule}</h2>
        <table>
          <thead style="background-color: #f0f0f0;">
            <tr>
              <th>${options.labels.date}</th>
              <th>${options.labels.location}</th>
              <th>${options.labels.notes}</th>
            </tr>
          </thead>
          <tbody>
            ${shootDays.map((day) => `
              <tr>
                <td>${new Date(day.date).toLocaleDateString(options.locale)}</td>
                <td>${day.location || '—'}</td>
                <td>${day.notes || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
}

/**
 * Open print preview
 */
export function openPrintPreview(htmlContent: string): void {
  const printWindow = window.open('', '', 'height=600,width=800');
  if (!printWindow) {
    console.error('Could not open print window');
    return;
  }
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.print();
}
