import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check, Share2, PlusSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'compact' | 'banner' | 'login' | 'drawer';
  isRtl?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  className = '',
  variant = 'header',
  isRtl: isRtlProp
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const { currentLang } = useLanguage();
  const isUrdu = isRtlProp !== undefined ? isRtlProp : (currentLang === 'ur' || currentLang === 'sd');

  // If already installed into standalone mode, hide the install prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 3000);
      }
    } else {
      // In browsers where beforeinstallprompt hasn't fired yet or desktop Safari/Firefox
      setShowIOSGuide(true);
    }
  };

  if (installSuccess) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold shadow-xs">
        <Check className="w-3.5 h-3.5 text-[#25d366]" />
        <span>{isUrdu ? 'ایپ انسٹال ہو گئی!' : 'App Installed!'}</span>
      </div>
    );
  }

  return (
    <>
      {variant === 'banner' ? (
        <div className={`flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gradient-to-r from-[#075e54] to-[#128c7e] text-white border border-[#25d366]/30 shadow-md ${className}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center shrink-0 border border-white/20">
              <Smartphone className="w-4 h-4 text-[#25d366]" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold leading-tight">
                {isUrdu ? 'آزاد ماسٹر موبائل ایپ انسٹال کریں' : 'Install Azad Master App'}
              </p>
              <p className="text-[10px] text-emerald-100/90 leading-tight">
                {isUrdu ? '100% بغیر انٹرنیٹ، تیز ترین اسپیڈ' : '100% offline, native mobile speed'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-lg bg-[#25d366] hover:bg-[#20ba59] active:scale-95 text-slate-900 text-xs font-extrabold shadow-sm shrink-0 flex items-center gap-1 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'انسٹال' : 'Install'}</span>
          </button>
        </div>
      ) : variant === 'login' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 active:scale-[0.99] border border-emerald-200/80 text-emerald-900 transition-all shadow-xs cursor-pointer ${className}`}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#075e54] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Smartphone className="w-4 h-4 text-[#25d366]" />
            </div>
            <div className="text-left rtl:text-right">
              <p className="text-xs font-extrabold text-[#075e54] leading-tight">
                {isUrdu ? 'موبائل ایپ انسٹال کریں' : 'Install Mobile App'}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                {isUrdu ? 'ہوم اسکرین پر 1-کلک شارٹ کٹ' : '1-click home screen shortcut'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold bg-[#075e54] text-white px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0">
            <Download className="w-3 h-3 text-[#25d366]" />
            <span>{isUrdu ? 'انسٹال' : 'Install'}</span>
          </span>
        </button>
      ) : variant === 'drawer' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-950 font-bold text-xs border border-emerald-200/70 transition-all cursor-pointer shadow-2xs ${className}`}
        >
          <span className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#075e54]" />
            <span>{isUrdu ? 'موبائل ایپ انسٹال کریں (PWA)' : 'Install Mobile App (PWA)'}</span>
          </span>
          <Download className="w-3.5 h-3.5 text-[#075e54]" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/25 text-xs font-bold transition-all shadow-2xs cursor-pointer ${className}`}
          title={isUrdu ? 'موبائل ہوم اسکرین پر انسٹال کریں' : 'Install to Home Screen'}
        >
          <Download className="w-3.5 h-3.5 text-[#25d366]" />
          <span className="hidden sm:inline">{isUrdu ? 'ایپ انسٹال کریں' : 'Install App'}</span>
          <span className="sm:hidden">{isUrdu ? 'انسٹال' : 'Install'}</span>
        </button>
      )}

      {/* iOS & Browser Installation Modal Guide */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl text-slate-800 border border-slate-200 animate-in zoom-in-95 duration-150"
            dir={isUrdu ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <img src="/pwa-192x192.png" alt="Azad Master" className="w-8 h-8 rounded-lg shadow-xs" />
                <h3 className="text-sm font-bold text-slate-900">
                  {isUrdu ? 'موبائل میں ایپ انسٹال کرنے کا طریقہ' : 'How to Install Azad Master App'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">
                {isUrdu 
                  ? 'آزاد ماسٹر ایپ کو سیدھا اپنے فون کی ہوم اسکرین پر لانے کے لیے:' 
                  : 'To add Azad Master directly to your phone home screen:'}
              </p>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <p className="font-medium text-slate-800 flex items-center gap-1">
                    <span>{isUrdu ? 'شیئر بٹن (Share) پر ٹیپ کریں' : 'Tap the Share or Menu button'}</span>
                    <Share2 className="w-3.5 h-3.5 text-blue-600 inline" />
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isUrdu ? 'سفاری براؤزر میں نیچے یا کروم میں اوپر تین نقطوں پر کلک کریں۔' : 'In Safari (bottom bar) or Chrome (top menu).'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <p className="font-medium text-slate-800 flex items-center gap-1">
                    <span>{isUrdu ? '"Add to Home Screen" منتخب کریں' : 'Select "Add to Home Screen"'}</span>
                    <PlusSquare className="w-3.5 h-3.5 text-emerald-600 inline" />
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isUrdu ? 'اس پر کلک کرنے سے آزاد ماسٹر کا آئیکن آپ کے موبائل میں آ جائے گا۔' : 'The app icon will be installed onto your home screen.'}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#075e54] hover:bg-[#054840] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {isUrdu ? 'سمجھ گیا' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
