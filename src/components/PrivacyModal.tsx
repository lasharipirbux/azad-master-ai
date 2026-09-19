import React from 'react';
import { X, ShieldCheck, Lock, Database, Smartphone } from 'lucide-react';

interface PrivacyModalProps {
  onClose: () => void;
  translations: Record<string, string>;
  isRtl: boolean;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  onClose,
  translations: t,
  isRtl,
}) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[#062c1d]/85 backdrop-blur-xs transition-opacity"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div 
        id="privacy-policy-modal"
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-[#0d4a2a]/20 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header with Signature Dark Green Color */}
        <div className="bg-[#0d4a2a] text-white px-4 py-3.5 flex justify-between items-center shadow-md relative">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5 text-[#10b981]" />
            </div>
            <div>
              <h3 className="font-bold text-[15px] text-white tracking-wide leading-tight">
                {t.privacy}
              </h3>
              <p className="text-[10px] text-emerald-200">
                {isRtl ? 'رازداری اور ڈیٹا پروٹیکشن' : 'Data Privacy & Security'}
              </p>
            </div>
          </div>
          <button 
            id="close-privacy-btn"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content with Modern Glossy Cards */}
        <div className="p-4 overflow-y-auto space-y-3 text-xs text-slate-700 leading-relaxed bg-[#f8fafc]">
          {/* Card 1: Local & Offline Secure */}
          <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-emerald-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.04)] hover:border-emerald-400 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5 shadow-2xs">
              <Lock className="w-4 h-4 text-[#0d4a2a]" />
            </div>
            <div>
              <h5 className="font-bold text-slate-900 text-xs mb-0.5 flex items-center gap-1.5">
                <span>{isRtl ? '100% محفوظ اسٹوریج' : '100% Local & Offline Secure'}</span>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full">Safe</span>
              </h5>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {isRtl 
                  ? 'آپ کے تمام گاہکوں کے ناپ، کٹنگ سلپس اور تصاویر آپ کے اپنے فون/براؤزر کی لوکل میموری اور محفوظ کلاؤڈ میں محفوظ رہتے ہیں۔'
                  : 'All your customer measurement records, cutting dimensions, and slips remain stored securely in your device and private cloud storage.'}
              </p>
            </div>
          </div>

          {/* Card 2: Zero External Leakage */}
          <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.04)] hover:border-[#0d4a2a]/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 mt-0.5 shadow-2xs">
              <Database className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              <h5 className="font-bold text-slate-900 text-xs mb-0.5 flex items-center gap-1.5">
                <span>{isRtl ? 'کوئی بیرونی رسائی نہیں' : 'Zero External Leakage'}</span>
                <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-1.5 py-0.2 rounded-full">Private</span>
              </h5>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {isRtl 
                  ? 'آپ کے ٹیلرنگ ناپ کسی تیسرے فریق یا غیر متعلقہ سرور کے ساتھ شیئر نہیں کیے جاتے۔'
                  : 'Your customer contact numbers and tailoring proprietary cut measurements are never shared with any 3rd party.'}
              </p>
            </div>
          </div>

          {/* Card 3: Direct WhatsApp Messaging */}
          <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.04)] hover:border-[#25d366]/60 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center text-[#25d366] shrink-0 mt-0.5 shadow-2xs">
              <Smartphone className="w-4 h-4 text-[#25d366]" />
            </div>
            <div>
              <h5 className="font-bold text-slate-900 text-xs mb-0.5 flex items-center gap-1.5">
                <span>{isRtl ? 'واٹس ایپ ڈائریکٹ شیئرنگ' : 'Direct WhatsApp Messaging'}</span>
                <span className="bg-green-100 text-green-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full">Direct</span>
              </h5>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {isRtl 
                  ? 'جب آپ واٹس ایپ کا بٹن دباتے ہیں تو براہ راست آپ کے گاہک کے نمبر پر پیغام کھلتا ہے۔'
                  : 'When you tap Send via WhatsApp, the encrypted communication occurs directly inside WhatsApp app.'}
              </p>
            </div>
          </div>

          {/* VIP Close Button */}
          <div className="pt-2">
            <button 
              id="privacy-close-btn"
              onClick={onClose}
              className="w-full bg-[#0d4a2a] hover:bg-[#09351e] active:scale-[0.98] text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-md border border-[#0d4a2a] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-[#10b981]" />
              <span>{t.close}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
