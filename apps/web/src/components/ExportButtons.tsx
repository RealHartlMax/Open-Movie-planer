import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  exportToPDF,
  generateKalkulationHTML,
  generateDrehplanHTML,
  generateCostAccountingHTML,
  generateCompleteReportHTML,
  openPrintPreview,
} from '../utils/exportUtils';

interface ExportButtonsProps {
  projectTitle: string;
  projectDescription?: string;
  costAccountingData: any[];
  shootDays: any[];
  currency: string;
  locale: string;
  activeModule?: 'kalkulation' | 'drehplan' | 'kostenrechnung' | 'all';
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  projectTitle,
  projectDescription,
  costAccountingData,
  shootDays,
  currency,
  locale,
  activeModule = 'all',
}) => {
  const { t } = useTranslation();
  const sanitizedFilename = projectTitle.replace(/[^a-z0-9äöü\s-]/gi, '').replace(/\s+/g, '-').toLowerCase();
  const timestamp = new Date().toISOString().slice(0, 10);

  const handleExportKalkulation = async () => {
    const html = generateKalkulationHTML(projectTitle, costAccountingData, {
      locale,
      currency,
      labels: {
        costCenter: t('columns.costCenter'),
        budget: t('columns.budget'),
        spent: t('columns.spent'),
        remaining: t('columns.remaining'),
        totalBudget: t('export.totalBudget'),
        totalSpent: t('export.totalSpent'),
        totalRemaining: t('export.totalRemaining'),
        reportTitle: t('navigation.budget')
      }
    });
    const element = document.createElement('div');
    element.innerHTML = html;
    element.id = 'temp-kalkulation';
    document.body.appendChild(element);
    
    try {
      await exportToPDF('temp-kalkulation', {
        filename: `${sanitizedFilename}_kalkulation_${timestamp}`,
        title: `${projectTitle} - Kalkulation`,
      });
    } finally {
      document.body.removeChild(element);
    }
  };

  const handlePrintKalkulation = () => {
    const html = generateKalkulationHTML(projectTitle, costAccountingData, {
      locale,
      currency,
      labels: {
        costCenter: t('columns.costCenter'),
        budget: t('columns.budget'),
        spent: t('columns.spent'),
        remaining: t('columns.remaining'),
        totalBudget: t('export.totalBudget'),
        totalSpent: t('export.totalSpent'),
        totalRemaining: t('export.totalRemaining'),
        reportTitle: t('navigation.budget')
      }
    });
    openPrintPreview(html);
  };

  const handleExportDrehplan = async () => {
    const html = generateDrehplanHTML(projectTitle, shootDays, {
      locale,
      labels: {
        date: t('columns.date'),
        location: t('columns.location'),
        notes: t('columns.notes'),
        reportTitle: t('navigation.shootPlan')
      }
    });
    const element = document.createElement('div');
    element.innerHTML = html;
    element.id = 'temp-drehplan';
    document.body.appendChild(element);
    
    try {
      await exportToPDF('temp-drehplan', {
        filename: `${sanitizedFilename}_drehplan_${timestamp}`,
        title: `${projectTitle} - Drehplan`,
      });
    } finally {
      document.body.removeChild(element);
    }
  };

  const handlePrintDrehplan = () => {
    const html = generateDrehplanHTML(projectTitle, shootDays, {
      locale,
      labels: {
        date: t('columns.date'),
        location: t('columns.location'),
        notes: t('columns.notes'),
        reportTitle: t('navigation.shootPlan')
      }
    });
    openPrintPreview(html);
  };

  const handleExportCostAccounting = async () => {
    const html = generateCostAccountingHTML(projectTitle, costAccountingData, {
      locale,
      currency,
      labels: {
        costCenter: t('columns.costCenter'),
        shouldAmount: t('columns.shouldAmount'),
        isAmount: t('columns.isAmount'),
        forecast: t('columns.forecast'),
        endCosts: t('columns.endCosts'),
        variance: t('columns.variance'),
        totalSoll: t('export.totalSoll'),
        totalIst: t('export.totalIst'),
        totalForecast: t('export.totalForecast'),
        totalVariance: t('export.totalVariance'),
        reportTitle: t('export.externalCostAccounting')
      }
    });
    const element = document.createElement('div');
    element.innerHTML = html;
    element.id = 'temp-costaccounting';
    document.body.appendChild(element);
    
    try {
      await exportToPDF('temp-costaccounting', {
        filename: `${sanitizedFilename}_kostenrechnung_${timestamp}`,
        title: `${projectTitle} - Externe Kostenrechnung`,
      });
    } finally {
      document.body.removeChild(element);
    }
  };

  const handlePrintCostAccounting = () => {
    const html = generateCostAccountingHTML(projectTitle, costAccountingData, {
      locale,
      currency,
      labels: {
        costCenter: t('columns.costCenter'),
        shouldAmount: t('columns.shouldAmount'),
        isAmount: t('columns.isAmount'),
        forecast: t('columns.forecast'),
        endCosts: t('columns.endCosts'),
        variance: t('columns.variance'),
        totalSoll: t('export.totalSoll'),
        totalIst: t('export.totalIst'),
        totalForecast: t('export.totalForecast'),
        totalVariance: t('export.totalVariance'),
        reportTitle: t('export.externalCostAccounting')
      }
    });
    openPrintPreview(html);
  };

  const handleExportComplete = async () => {
    const html = generateCompleteReportHTML(
      projectTitle,
      projectDescription || '',
      costAccountingData,
      shootDays,
      new Date(),
      {
        locale,
        currency,
        labels: {
          projectReport: t('export.projectReport'),
          createdAt: t('export.createdAt'),
          tableOfContents: t('export.tableOfContents'),
          externalCostAccounting: t('export.externalCostAccounting'),
          budgeting: t('export.budgeting'),
          shootSchedule: t('export.shootSchedule'),
          costCenter: t('columns.costCenter'),
          budget: t('columns.budget'),
          spent: t('columns.spent'),
          remaining: t('columns.remaining'),
          shouldAmount: t('columns.shouldAmount'),
          isAmount: t('columns.isAmount'),
          forecast: t('columns.forecast'),
          endCosts: t('columns.endCosts'),
          variance: t('columns.variance'),
          date: t('columns.date'),
          location: t('columns.location'),
          notes: t('columns.notes'),
          totalSoll: t('export.totalSoll'),
          totalIst: t('export.totalIst'),
          totalVariance: t('export.totalVariance')
        }
      }
    );
    const element = document.createElement('div');
    element.innerHTML = html;
    element.id = 'temp-complete';
    document.body.appendChild(element);
    
    try {
      await exportToPDF('temp-complete', {
        filename: `${sanitizedFilename}_report_${timestamp}`,
        title: `${projectTitle} - Gesamtbericht`,
      });
    } finally {
      document.body.removeChild(element);
    }
  };

  const handlePrintComplete = () => {
    const html = generateCompleteReportHTML(
      projectTitle,
      projectDescription || '',
      costAccountingData,
      shootDays,
      new Date(),
      {
        locale,
        currency,
        labels: {
          projectReport: t('export.projectReport'),
          createdAt: t('export.createdAt'),
          tableOfContents: t('export.tableOfContents'),
          externalCostAccounting: t('export.externalCostAccounting'),
          budgeting: t('export.budgeting'),
          shootSchedule: t('export.shootSchedule'),
          costCenter: t('columns.costCenter'),
          budget: t('columns.budget'),
          spent: t('columns.spent'),
          remaining: t('columns.remaining'),
          shouldAmount: t('columns.shouldAmount'),
          isAmount: t('columns.isAmount'),
          forecast: t('columns.forecast'),
          endCosts: t('columns.endCosts'),
          variance: t('columns.variance'),
          date: t('columns.date'),
          location: t('columns.location'),
          notes: t('columns.notes'),
          totalSoll: t('export.totalSoll'),
          totalIst: t('export.totalIst'),
          totalVariance: t('export.totalVariance')
        }
      }
    );
    openPrintPreview(html);
  };

  return (
    <div className="export-buttons">
      {(activeModule === 'kalkulation' || activeModule === 'all') && (
        <>
          <button className="export-btn" onClick={handleExportKalkulation}>
            {t('export.kalkulationPDF')}
          </button>
          <button className="export-btn secondary" onClick={handlePrintKalkulation}>
            {t('export.kalkulationPreview')}
          </button>
        </>
      )}

      {(activeModule === 'drehplan' || activeModule === 'all') && (
        <>
          <button className="export-btn" onClick={handleExportDrehplan}>
            {t('export.shootPlanPDF')}
          </button>
          <button className="export-btn secondary" onClick={handlePrintDrehplan}>
            {t('export.shootPlanPreview')}
          </button>
        </>
      )}

      {(activeModule === 'kostenrechnung' || activeModule === 'all') && (
        <>
          <button className="export-btn" onClick={handleExportCostAccounting}>
            {t('export.costAccountingPDF')}
          </button>
          <button className="export-btn secondary" onClick={handlePrintCostAccounting}>
            {t('export.costAccountingPreview')}
          </button>
        </>
      )}

      {activeModule === 'all' && (
        <>
          <button 
            className="export-btn" 
            onClick={handleExportComplete} 
            style={{ backgroundColor: '#1b5e20' }}
          >
            {t('export.completeReportPDF')}
          </button>
          <button 
            className="export-btn secondary" 
            onClick={handlePrintComplete} 
            style={{ backgroundColor: '#2e7d32' }}
          >
            {t('export.completeReportPreview')}
          </button>
        </>
      )}
    </div>
  );
};

export default ExportButtons;
