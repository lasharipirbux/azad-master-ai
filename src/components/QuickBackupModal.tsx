import React, { useState, useRef } from 'react';
import { Customer } from '../types';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  FileCode, 
  Upload, 
  CheckCircle2, 
  ShieldCheck, 
  Database,
  AlertCircle
} from 'lucide-react';
import { exportCustomersToJson, exportCustomersToExcelCsv, parseBackupFile } from '../utils/backupExport';

interface QuickBackupModalProps {
  visible: boolean;
  onClose: () => void;
  customers: Customer[];
  onImportCustomers: (customers: Customer[]) => void;
  isRtl?: boolean;
}

export const QuickBackupModal: React.FC<QuickBackupModalProps> = ({
  visible,
  onClose,
  customers,
  onImportCustomers,
  isRtl = true,
}) => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!visible) return null;

  const handleJsonDownload = () => {
    setErrorMsg(null);
    if (!customers || customers.length === 0) {
      setErrorMsg(isRtl ? 'بیک اپ بنانے کے لیے کوئی کسٹمر ریکارڈ موجود نہیں ہے۔' : 'No customer records to backup.');
      return;
    }
    const ok = exportCustomersToJson(customers);
    if (ok) {
      setSuccessMsg(isRtl ? '✅ مکمل کسٹمر بیک اپ (JSON) کامیابی سے ڈاؤن لوڈ ہو گیا ہے!' : '✅ Full JSON backup downloaded successfully!');
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  const handleExcelDownload = () => {
    setErrorMsg(null);
    if (!customers || customers.length === 0) {
      setErrorMsg(isRtl ? 'ڈاؤن لوڈ کے لیے کوئی کسٹمر ریکارڈ موجود نہیں ہے۔' : 'No customer records to export.');
      return;
    }
    const ok = exportCustomersToExcelCsv(customers, isRtl);
    if (ok) {
      setSuccessMsg(isRtl ? '✅ ایکسل شیٹ (Excel / CSV) کامیابی سے ڈاؤن لوڈ ہو گئی ہے!' : '✅ Excel/CSV spreadsheet downloaded successfully!');
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    try {
      const importedList = await parseBackupFile(file);
      if (importedList.length > 0) {
        onImportCustomers(importedList);
        setSuccessMsg(
          isRtl 
            ? `✅ ${importedList.length} کسٹمر ریکارڈز کامیابی سے بحال ہو گئے ہیں!` 
            : `✅ ${importedList.length} customer records restored successfully!`
        );
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1500);
      } else {
        setErrorMsg(isRtl ? 'فائل میں کوئی درست کسٹمر ڈیٹا نہیں ملا۔' : 'No valid customer data found in file.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (isRtl ? 'فائل پڑھنے میں خرابی پیش آئی۔' : 'Error reading backup file.'));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs transition-opacity"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div 
        id="quick-backup-modal"
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden border border-[#128c7e]/25 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-[#075e54] text-white px-4 py-3.5 flex justify-between items-center shadow-md shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white">
              <Database className="w-4 h-4 text-[#25d366]" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white tracking-wide">
                {isRtl ? 'ڈیٹا بیک اپ و ایکسل ڈاؤنلوڈ' : 'Data Backup & Excel Export'}
              </h3>
              <p className="text-[10.5px] text-[#dcf8c6]">
                {isRtl ? `کل محفوظ ریکارڈز: ${customers.length}` : `Total Saved Records: ${customers.length}`}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white text-xs cursor-pointer transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5">
          {/* Notifications */}
          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-bold">{errorMsg}</span>
            </div>
          )}

          {/* Option 1: Excel / CSV Export */}
          <button
            type="button"
            id="btn-export-excel"
            onClick={handleExcelDownload}
            className="w-full p-3 rounded-xl border border-emerald-300/80 bg-emerald-50/60 hover:bg-emerald-100/70 active:scale-[0.98] transition-all flex items-center justify-between text-left rtl:text-right cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-800">
                  {isRtl ? 'ایکسل شیٹ ڈاؤن لوڈ کریں (Excel / CSV)' : 'Download Excel / CSV Sheet'}
                </h4>
                <p className="text-[10.5px] text-slate-500 font-medium">
                  {isRtl ? 'موبائل نمبر، مکمل ناپ اور کھاتہ ایکسل میں کھولیں' : 'Open customer measurements & balance in MS Excel'}
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-emerald-700 shrink-0 group-hover:translate-y-0.5 transition-transform" />
          </button>

          {/* Option 2: JSON Backup */}
          <button
            type="button"
            id="btn-export-json"
            onClick={handleJsonDownload}
            className="w-full p-3 rounded-xl border border-teal-300/80 bg-teal-50/60 hover:bg-teal-100/70 active:scale-[0.98] transition-all flex items-center justify-between text-left rtl:text-right cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#075e54] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-800">
                  {isRtl ? 'مکمل ڈیٹا بیک اپ (JSON Backup)' : 'Full System Backup (JSON)'}
                </h4>
                <p className="text-[10.5px] text-slate-500 font-medium">
                  {isRtl ? 'پرچوں اور ناپ کا 100% محفوظ بیک اپ فائل ڈاؤنلوڈ کریں' : 'Complete snapshot for instant restore anytime'}
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-[#075e54] shrink-0 group-hover:translate-y-0.5 transition-transform" />
          </button>

          {/* Option 3: Restore / Import Backup */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              id="btn-import-backup-file"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-[#128c7e] bg-slate-50 hover:bg-[#e7f7ef] text-slate-700 hover:text-[#075e54] active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-bold text-xs cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#075e54]" />
              <span>{isRtl ? 'پرانا بیک اپ بحال کریں (Restore Backup)' : 'Restore Backup File'}</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".json" 
              onChange={handleFileChange} 
              className="hidden" 
            />
          </div>

          {/* Security Notice */}
          <div className="p-2 bg-slate-50 rounded-lg text-[10.5px] text-slate-500 flex items-center gap-1.5 border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-[#075e54] shrink-0" />
            <span>
              {isRtl 
                ? 'آپ کا تمام ڈیٹا لوکل اسٹوریج میں ہر وقت محفوظ رہتا ہے۔' 
                : 'All customer data is permanently mirrored in your local device storage.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
