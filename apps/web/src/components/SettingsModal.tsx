import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/settings.css';

const COMPANY_STORAGE_KEY = 'omp_company_settings';

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  logoDataUrl: string;
}

const defaultCompany: CompanySettings = {
  name: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  taxId: '',
  logoDataUrl: '',
};

export function loadCompanySettings(): CompanySettings {
  try {
    const raw = localStorage.getItem(COMPANY_STORAGE_KEY);
    if (raw) return { ...defaultCompany, ...JSON.parse(raw) as Partial<CompanySettings> };
  } catch {
    // ignore
  }
  return { ...defaultCompany };
}

function saveCompanySettings(settings: CompanySettings): void {
  localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(settings));
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
}

export default function SettingsModal({ isOpen, onClose, currency, onCurrencyChange }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [company, setCompany] = useState<CompanySettings>(loadCompanySettings);
  const [companySaved, setCompanySaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedLanguage(i18n.language);
  }, [i18n.language]);

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    void i18n.changeLanguage(lang);
  };

  const handleCompanyField = (field: keyof CompanySettings, value: string) => {
    setCompany((prev) => ({ ...prev, [field]: value }));
    setCompanySaved(false);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) return; // 2 MB limit
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCompany((prev) => ({ ...prev, logoDataUrl: dataUrl }));
      setCompanySaved(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCompany = () => {
    saveCompanySettings(company);
    setCompanySaved(true);
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal settings-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2>{t('settings.title')}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-modal-content">
          {/* Preferences */}
          <div className="settings-section">
            <h3>{t('settings.preferences')}</h3>

            <div className="settings-group">
              <label>{t('settings.language')}</label>
              <div className="language-buttons">
                <button
                  className={`language-btn ${selectedLanguage.startsWith('de') ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('de')}
                >
                  🇩🇪 {t('settings.german')}
                </button>
                <button
                  className={`language-btn ${selectedLanguage.startsWith('en') ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('en')}
                >
                  🇬🇧 {t('settings.english')}
                </button>
              </div>
            </div>

            <div className="settings-group">
              <label htmlFor="currency-select">{t('settings.currency')}</label>
              <select
                id="currency-select"
                className="input-field"
                value={currency}
                onChange={(event) => onCurrencyChange(event.target.value)}
              >
                <option value="EUR">EUR - {t('settings.euro')}</option>
                <option value="USD">USD - {t('settings.usDollar')}</option>
                <option value="GBP">GBP - {t('settings.pound')}</option>
                <option value="CHF">CHF - {t('settings.franc')}</option>
              </select>
            </div>
          </div>

          {/* Production Company */}
          <div className="settings-section">
            <h3>{t('settings.company')}</h3>

            {/* Logo */}
            <div className="settings-group">
              <label>{t('settings.companyLogo')}</label>
              <div className="logo-upload-row">
                {company.logoDataUrl
                  ? <img src={company.logoDataUrl} alt="Logo" className="logo-preview" />
                  : <div className="logo-placeholder">{t('settings.noLogo')}</div>
                }
                <div className="logo-actions">
                  <button className="language-btn" onClick={() => logoInputRef.current?.click()}>
                    {t('settings.uploadLogo')}
                  </button>
                  {company.logoDataUrl && (
                    <button className="language-btn" onClick={() => handleCompanyField('logoDataUrl', '')}>
                      {t('settings.removeLogo')}
                    </button>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleLogoUpload}
                />
              </div>
            </div>

            <div className="settings-group">
              <label htmlFor="company-name">{t('settings.companyName')}</label>
              <input
                id="company-name"
                className="input-field"
                placeholder={t('settings.companyName')}
                value={company.name}
                onChange={(e) => handleCompanyField('name', e.target.value)}
              />
            </div>

            <div className="settings-group">
              <label htmlFor="company-address">{t('settings.companyAddress')}</label>
              <textarea
                id="company-address"
                className="input-field"
                rows={3}
                placeholder={t('settings.companyAddressHint')}
                value={company.address}
                onChange={(e) => handleCompanyField('address', e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="settings-group-row">
              <div className="settings-group settings-group-half">
                <label htmlFor="company-phone">{t('settings.companyPhone')}</label>
                <input
                  id="company-phone"
                  className="input-field"
                  placeholder="+49 89 123456"
                  value={company.phone}
                  onChange={(e) => handleCompanyField('phone', e.target.value)}
                />
              </div>
              <div className="settings-group settings-group-half">
                <label htmlFor="company-email">{t('settings.companyEmail')}</label>
                <input
                  id="company-email"
                  className="input-field"
                  type="email"
                  placeholder="info@firma.de"
                  value={company.email}
                  onChange={(e) => handleCompanyField('email', e.target.value)}
                />
              </div>
            </div>

            <div className="settings-group-row">
              <div className="settings-group settings-group-half">
                <label htmlFor="company-website">{t('settings.companyWebsite')}</label>
                <input
                  id="company-website"
                  className="input-field"
                  placeholder="https://firma.de"
                  value={company.website}
                  onChange={(e) => handleCompanyField('website', e.target.value)}
                />
              </div>
              <div className="settings-group settings-group-half">
                <label htmlFor="company-tax">{t('settings.companyTaxId')}</label>
                <input
                  id="company-tax"
                  className="input-field"
                  placeholder="DE123456789"
                  value={company.taxId}
                  onChange={(e) => handleCompanyField('taxId', e.target.value)}
                />
              </div>
            </div>

            <div className="settings-save-row">
              <button className="btn-primary" onClick={handleSaveCompany}>
                {t('settings.saveCompany')}
              </button>
              {companySaved && <span className="save-confirm">{t('settings.companySaved')}</span>}
            </div>
          </div>
        </div>

        <div className="settings-modal-footer">
          <button className="btn-primary" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
