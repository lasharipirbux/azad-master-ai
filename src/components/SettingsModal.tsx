import React, { useState } from 'react';
import { Customer, SupportedLanguage } from '../types';
import { languageList } from '../data/translations';
import { 
  X, 
  User, 
  Camera, 
  Download, 
  Upload, 
  Trash2, 
  Check, 
  Settings as SettingsIcon,
  ShieldCheck,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Globe,
  Cloud,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface SettingsModalProps {
  masterName: string;
  masterPhoto: string | null;
  onUpdateProfile: (name: string, photo: string | null) => void;
  customers: Customer[];
  onImportCustomers: (customers: Customer[]) => void;
  onClearAllData: () => void;
  onClose: () => void;
  onOpenAppGuide: () => void;
  onOpenAiAssistant?: () => void;
  currentLang: SupportedLanguage;
  onChangeLanguage: (lang: SupportedLanguage) => void;
  translations: Record<string, string>;
  isRtl: boolean;
  onSyncToCloud?: () => Promise<{ success: boolean; count: number }>;
  cloudRecordCount?: number;
  lastCloudSyncTime?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  masterName,
  masterPhoto,
  onUpdateProfile,
  customers,
  onImportCustomers,
  onClearAllData,
  onClose,
  onOpenAppGuide,
  onOpenAiAssistant,
  currentLang,
  onChangeLanguage,
  translations: t,
  isRtl,
  onSyncToCloud,
  cloudRecordCount,
  lastCloudSyncTime,
}) => {
  const [name, setName] = useState(masterName);
  const [photo, setPhoto] = useState<string | null>(masterPhoto);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<string | null>(null);

  const handleCloudSyncClick = async () => {
    if (!onSyncToCloud) return;
    setIsSyncingCloud(true);
    try {
      const res = await onSyncToCloud();
      if (res.success) {
        setCloudSyncMsg(isRtl ? `${res.count} ریکارڈز کلاؤڈ پر کامیابی سے محفوظ ہو گئے!` : `${res.count} records safely synced to Cloud!`);
      } else {
        setCloudSyncMsg(isRtl ? 'کلاؤڈ سنک میں خرابی آئی۔ انٹرنیٹ چیک کریں۔' : 'Cloud sync error. Please check connection.');
      }
    } catch {
      setCloudSyncMsg(isRtl ? 'کلاؤڈ سنک میں خرابی آئی۔' : 'Cloud sync error.');
    } finally {
      setIsSyncingCloud(false);
      setTimeout(() => setCloudSyncMsg(null), 3500);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(name.trim() || (isRtl ? 'ماسٹر صاحب' : 'Master Tailor'), photo);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 400);
  };

  const [backupSuccessMsg, setBackupSuccessMsg] = useState<string | null>(null);

  const handleExportData = () => {
    if (customers.length === 0) {
      alert(isRtl ? 'کوئی کسٹمر ریکارڈ موجود نہیں ہے!' : 'No customer records to backup!');
      return;
    }
    const backupPayload = {
      app: "Azad Master",
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      totalRecords: customers.length,
      customers: customers
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `azad_master_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setBackupSuccessMsg(isRtl ? 'بیک اپ فائل ڈاؤنلوڈ ہو گئی ہے!' : 'Backup file downloaded successfully!');
    setTimeout(() => setBackupSuccessMsg(null), 3000);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          let customerList: Customer[] = [];
          if (Array.isArray(parsed)) {
            customerList = parsed;
          } else if (parsed && Array.isArray(parsed.customers)) {
            customerList = parsed.customers;
          }

          if (customerList.length > 0) {
            onImportCustomers(customerList);
            setBackupSuccessMsg(isRtl ? `${customerList.length} ریکارڈز کامیابی سے بحال ہو گئے!` : `${customerList.length} records restored successfully!`);
            setTimeout(() => setBackupSuccessMsg(null), 3000);
          } else {
            alert(isRtl ? 'فائل میں کوئی درست ریکارڈ نہیں ملا۔' : 'No valid customer records found in file.');
          }
        } catch {
          alert(isRtl ? 'غلط بیک اپ فائل۔ براہ کرم درست JSON فائل منتخب کریں۔' : 'Invalid backup file. Please select a valid JSON backup.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[#062c1d]/85 backdrop-blur-xs transition-opacity"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div 
        id="settings-modal"
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-[#0d4a2a]/20 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Signature Header */}
        <div className="bg-[#0d4a2a] text-white px-4 py-3.5 flex justify-between items-center shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-white">
              <SettingsIcon className="w-4 h-4 text-[#10b981]" />
            </div>
            <div>
              <h3 className="font-bold text-[15px] text-white tracking-wide leading-tight">
                {t.settings}
              </h3>
              <p className="text-[10.5px] text-emerald-200">
                {isRtl ? 'پروفائل اور ایپ کی ترتیبات' : 'Profile & App Settings'}
              </p>
            </div>
          </div>
          <button 
            id="close-settings-btn"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-4 overflow-y-auto space-y-3.5 text-slate-800 bg-[#f8fafc]">
          
          {/* Master Profile Photo & Name */}
          <div className="text-center space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-full border-3 border-[#0d4a2a] overflow-hidden mx-auto bg-slate-100 flex items-center justify-center shadow-sm">
                {photo ? (
                  <img src={photo} alt="Master" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-[#0d4a2a] hover:bg-[#09351e] text-white p-1.5 rounded-full cursor-pointer shadow-md transition-colors border-2 border-white">
                <Camera className="w-3.5 h-3.5" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                />
              </label>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.masterNameLabel}
              </label>
              <input 
                id="input-master-name"
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#0d4a2a] outline-none"
              />
            </div>
          </div>

          {/* Language Switcher Section (English / Urdu & All 20 Languages) */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Globe className="w-4 h-4 text-[#0d4a2a]" />
                {isRtl ? 'زبان کا انتخاب (Language)' : 'App Language / زبان'}
              </span>
              <span className="text-[10.5px] bg-[#0d4a2a]/10 text-[#0d4a2a] font-bold px-2 py-0.5 rounded-full">
                {currentLang === 'ur' ? '🇵🇰 اردو' : currentLang === 'en' ? '🇬🇧 English' : currentLang.toUpperCase()}
              </span>
            </div>

            {/* Quick Toggle: Urdu vs English */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="lang-quick-toggle-ur"
                onClick={() => onChangeLanguage('ur')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  currentLang === 'ur'
                    ? 'bg-[#0d4a2a] text-white border-[#0d4a2a] shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>🇵🇰</span>
                <span>اردو (Urdu)</span>
                {currentLang === 'ur' && <Check className="w-3.5 h-3.5 text-[#10b981]" />}
              </button>

              <button
                type="button"
                id="lang-quick-toggle-en"
                onClick={() => onChangeLanguage('en')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  currentLang === 'en'
                    ? 'bg-[#0d4a2a] text-white border-[#0d4a2a] shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>🇬🇧</span>
                <span>English (US/UK)</span>
                {currentLang === 'en' && <Check className="w-3.5 h-3.5 text-[#10b981]" />}
              </button>
            </div>

            {/* Additional Languages Dropdown */}
            <div>
              <label className="block text-[10.5px] text-slate-500 font-medium mb-1">
                {isRtl ? 'مزید دیگر زبانیں:' : 'All 20 Supported Languages:'}
              </label>
              <select
                id="select-all-languages"
                value={currentLang}
                onChange={(e) => onChangeLanguage(e.target.value as SupportedLanguage)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-[#0d4a2a] outline-none cursor-pointer"
              >
                {languageList.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Azad AI Assistant Button inside Settings */}
          {onOpenAiAssistant && (
            <div 
              id="settings-ai-assistant-row"
              onClick={() => {
                onClose();
                onOpenAiAssistant();
              }}
              className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 rounded-xl cursor-pointer flex items-center justify-between transition-all shadow-2xs group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-amber-400/50 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <img src="/azad-master-logo.svg" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Azad Tailoring Assistant</span>
                  </h4>
                  <p className="text-[10.5px] text-slate-600">
                    {isRtl ? 'ناپ بولیں یا لکھیں، خودکار کٹنگ حساب' : 'Speak or write measurements & smart tailoring'}
                  </p>
                </div>
              </div>
              {isRtl ? (
                <ChevronLeft className="w-4 h-4 text-[#075e54] group-hover:-translate-x-0.5 transition-transform" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#075e54] group-hover:translate-x-0.5 transition-transform" />
              )}
            </div>
          )}

          {/* App Guide / استعمال کا طریقہ Button inside Settings */}
          <div 
            id="settings-app-guide-row"
            onClick={() => {
              onClose();
              onOpenAppGuide();
            }}
            className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 rounded-xl cursor-pointer flex items-center justify-between transition-all shadow-2xs group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0d4a2a] text-white flex items-center justify-center shadow-2xs">
                <BookOpen className="w-4 h-4 text-[#10b981]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{isRtl ? 'استعمال کا طریقہ (App Guide)' : 'App Guide / How to Use'}</span>
                  <span className="bg-[#0d4a2a] text-white text-[8.5px] font-extrabold px-1.5 py-0.2 rounded-full">Guide</span>
                </h4>
                <p className="text-[10.5px] text-slate-600">
                  {isRtl ? 'ناپ درج کرنا، OCR پرچہ، ٹریکنگ اور واٹس ایپ' : 'Measurements, OCR Scan, Tracking & WhatsApp'}
                </p>
              </div>
            </div>
            {isRtl ? (
              <ChevronLeft className="w-4 h-4 text-[#0d4a2a] group-hover:-translate-x-0.5 transition-transform" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#0d4a2a] group-hover:translate-x-0.5 transition-transform" />
            )}
          </div>

          {/* Cloud Auto-Save Section (Feature #3: Firebase Cloud Database) */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50/60 rounded-xl border border-emerald-300/80 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                <Cloud className="w-4 h-4 text-[#0d4a2a]" />
                <span>{isRtl ? 'کلاؤڈ آٹو سیو (Firebase Cloud Auto-Save)' : 'Cloud Auto-Save (Firebase Database)'}</span>
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {isRtl ? 'فعال و محفوظ' : 'Live & Active'}
              </span>
            </div>

            <p className="text-[10.5px] text-slate-600 leading-relaxed">
              {isRtl 
                ? 'تمام گاہکوں کے ریکارڈز، پیمائشیں اور سلائی کھاتہ / بقایا رقم گوگل کلاؤڈ فائر بیس میں خودکار محفوظ ہو رہے ہیں۔'
                : 'All customer records, measurements, and billing/balance accounts are automatically synchronized to Google Cloud Firestore.'}
            </p>

            <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200/80 text-[11px] text-slate-700 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{isRtl ? 'کلاؤڈ ڈیٹا بیس:' : 'Cloud Database:'}</span>
                <span className="font-mono text-[10px] font-bold text-emerald-900 truncate max-w-[170px]" title="azad-master (Firestore)">
                  azad-master (Firestore)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{isRtl ? 'کلاؤڈ ریکارڈز:' : 'Cloud Records:'}</span>
                <span className="font-bold text-slate-900">{cloudRecordCount || customers.length} {isRtl ? 'گاہک' : 'Customers'}</span>
              </div>
              {lastCloudSyncTime && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">{isRtl ? 'آخری سنک:' : 'Last Synced:'}</span>
                  <span className="text-slate-600 text-[10px] font-mono">{lastCloudSyncTime}</span>
                </div>
              )}
            </div>

            {onSyncToCloud && (
              <button
                id="btn-sync-cloud-now"
                type="button"
                disabled={isSyncingCloud}
                onClick={handleCloudSyncClick}
                className="w-full flex items-center justify-center gap-1.5 bg-[#0d4a2a] hover:bg-[#09351e] disabled:opacity-60 text-white py-2 px-3 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#10b981] ${isSyncingCloud ? 'animate-spin' : ''}`} />
                <span>{isSyncingCloud ? (isRtl ? 'کلاؤڈ پر محفوظ ہو رہا ہے...' : 'Syncing to Cloud...') : (isRtl ? 'ابھی تمام ڈیٹا کلاؤڈ پر محفوظ کریں (Sync All Now)' : 'Sync All Data to Cloud Now')}</span>
              </button>
            )}

            {cloudSyncMsg && (
              <div className="p-2 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                <span>{cloudSyncMsg}</span>
              </div>
            )}
          </div>

          {/* Backup / Export Section */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-[#0d4a2a]" />
                {isRtl ? 'ڈیٹا بیک اپ اور بحالی' : 'Data Backup & Restore'}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                {customers.length} {isRtl ? 'ریکارڈز' : 'Records'}
              </span>
            </div>

            <p className="text-[10.5px] text-slate-500 leading-relaxed">
              {isRtl 
                ? 'اپنے تمام گاہکوں کے ناپ، کٹنگ سلپس اور اسٹیٹس کا بیک اپ اپنے فون میں محفوظ کریں یا پرانا ڈیٹا بحال کریں۔'
                : 'Export all customer measurements and orders into a secure JSON file or restore records from an existing backup.'}
            </p>

            {backupSuccessMsg && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                <span>{backupSuccessMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              {/* Backup Data Button */}
              <button 
                id="btn-backup-data"
                type="button"
                onClick={handleExportData}
                className="flex items-center justify-center gap-1.5 bg-[#0d4a2a] hover:bg-[#09351e] text-white py-2 px-2.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-[#10b981]" />
                <span>{isRtl ? 'بیک اپ بنائیں (Backup Data)' : 'Backup Data'}</span>
              </button>

              {/* Restore Data Button */}
              <label 
                id="btn-restore-data"
                className="flex items-center justify-center gap-1.5 bg-[#0d4a2a] hover:bg-[#09351e] text-white py-2 px-2.5 rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95 text-center"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isRtl ? 'بحال کریں (Restore Data)' : 'Restore Data'}</span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportData} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* Need Help / Contact Developer Section */}
          <div 
            id="settings-help-contact-section"
            className="rounded-xl p-3.5 text-center shadow-md space-y-2 border"
            style={{
              backgroundColor: '#0b231b',
              borderColor: '#d4af37'
            }}
          >
            <h3 className="font-bold text-xs" style={{ color: '#d4af37' }}>
              Need Help? / مدد چاہیے؟
            </h3>
            <p className="text-[11px] text-slate-200 leading-tight">
              {isRtl 
                ? 'کسی بھی مسئلے یا سوال کی صورت میں ہم سے بلا جھجھک رابطہ کریں:' 
                : 'If you face any issue using Azad Master, feel free to contact us:'}
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-bold" style={{ color: '#d4af37' }}>WhatsApp:</span>
                <a 
                  href="https://wa.me/?text=Hello%20Azad%20Master%20Support" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-semibold hover:underline"
                  style={{ color: '#00ff80' }}
                >
                  Contact on WhatsApp
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold" style={{ color: '#d4af37' }}>Email:</span>
                <a 
                  href="mailto:naseebseo2626@gmail.com" 
                  className="font-semibold hover:underline"
                  style={{ color: '#00ff80' }}
                >
                  naseebseo2626@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* App Version & Developer Credits Card */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-slate-800 font-bold text-xs">
              <span className="text-[#0d4a2a]">✂️ Azad Master (آزاد ماسٹر)</span>
              <span className="bg-emerald-100 text-[#0d4a2a] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border border-emerald-200">
                v1.0.0
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              {isRtl ? 'ڈویلپر: نسیب ایس ای او (Naseeb SEO)' : 'Developed by Naseeb SEO'}
            </p>
            <p className="text-[9.5px] text-slate-400">
              {isRtl ? 'تمام جملہ حقوق محفوظ ہیں © 2026 آزاد ماسٹر' : 'All Rights Reserved © 2026 Azad Master'}
            </p>
          </div>

          {/* Danger Zone: Clear Data */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(isRtl ? 'کیا آپ تمام گاہکوں کا ریکارڈ ختم کرنا چاہتے ہیں؟' : 'Are you sure you want to clear all customer slips?')) {
                  onClearAllData();
                }
              }}
              className="w-full text-[11px] text-red-600 hover:text-red-700 flex items-center justify-center gap-1 p-1 font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>{isRtl ? 'تمام کٹنگ سلپس صاف کریں' : 'Reset All Measurement Records'}</span>
            </button>
          </div>

          {/* Save Button */}
          <div className="pt-1">
            <button 
              id="save-profile-btn"
              type="submit" 
              className="w-full bg-[#0d4a2a] hover:bg-[#09351e] active:scale-[0.98] text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-[#10b981]" />
                  <span>{isRtl ? 'محفوظ ہو گیا!' : 'Saved!'}</span>
                </>
              ) : (
                <span>{t.saveClose}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

