import React, { useState, useEffect } from 'react';
import { Scissors, Bot, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, duration = 3200 }) => {
  const { t, isRtl } = useLanguage();
  const [fadingOut, setFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress increment
    const intervalTime = 30;
    const totalSteps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const nextProgress = Math.min(100, Math.round((currentStep / totalSteps) * 100));
      setProgress(nextProgress);

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        setFadingOut(true);
        setTimeout(() => {
          onFinish();
        }, 350);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration, onFinish]);

  return (
    <div
      id="azad-splash-screen"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-6 select-none transition-all duration-350 ease-out ${
        fadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(circle at 50% 35%, #0d7063 0%, #075e54 38%, #05423b 72%, #032722 100%)',
      }}
    >
      {/* Background Soft Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-[#25d366]/20 rounded-full blur-[90px]" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[280px] h-[280px] bg-amber-400/15 rounded-full blur-[80px]" />
      </div>

      {/* Top Brand Badges (AI Robot & Tailor Scissors) */}
      <div className="relative z-10 w-full flex items-center justify-between max-w-sm pt-3 px-2 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#dcf8c6] text-xs font-semibold shadow-xs">
          <Bot className="w-3.5 h-3.5 text-[#25d366]" />
          <span>{t.azadAssistant || 'AI Assistant'}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-amber-300/30 text-amber-200 text-xs font-semibold shadow-xs">
          <Scissors className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.appTitle || 'Master Tailoring'}</span>
        </div>
      </div>

      {/* Center Main Stage - Existing Azad Master Circular Logo & Branding */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center px-4 max-w-sm">
        {/* Animated Glow Ring around Existing Azad Master Logo */}
        <div className="relative mb-5 group">
          <div className="absolute -inset-2 bg-gradient-to-tr from-amber-400/50 via-[#25d366]/60 to-[#128c7e]/50 rounded-full blur-md opacity-75 animate-pulse" />
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-[#25d366] to-[#128c7e] shadow-2xl relative">
            <img
              src="/azad-master-logo.svg"
              alt="Azad Master"
              className="w-full h-full object-contain rounded-full bg-[#075e54]"
            />
          </div>
        </div>

        {/* Brand Text */}
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider drop-shadow-md mb-1 flex items-center justify-center gap-2">
          <span>آزاد ماسٹر</span>
          <span className="text-amber-400">•</span>
          <span className="tracking-widest">AZAD MASTER</span>
        </h1>

        <p className="text-xs sm:text-sm font-semibold text-[#dcf8c6] tracking-wide mb-6">
          {t.appSubTitle || (isRtl ? 'پیشہ ورانہ درزی ڈیجیٹل کسٹمر ناپ اور ریکارڈ سسٹم' : 'Professional Tailoring Digital Customer Measurement & Records')}
        </p>

        {/* Elegant Progress Loading Bar */}
        <div className="w-48 sm:w-56 bg-black/30 backdrop-blur-xs rounded-full h-1.5 p-0.5 border border-white/15 overflow-hidden shadow-inner mb-2">
          <div
            className="h-full bg-gradient-to-r from-amber-300 via-[#25d366] to-emerald-400 rounded-full transition-all duration-75 ease-out shadow-[0_0_8px_#25d366]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-200/80">
          <Sparkles className="w-3 h-3 text-[#25d366] animate-spin" />
          <span>{t.loading || 'Loading...'} {progress}%</span>
        </div>
      </div>

      {/* Mandatory Bottom Signature: By Naseeb SEO */}
      <div className="relative z-10 w-full text-center pb-2 animate-in fade-in duration-700">
        <div className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-xs font-bold shadow-xs">
          <span>By</span>
          <span className="text-amber-300 font-extrabold tracking-wide">Naseeb SEO</span>
        </div>
      </div>
    </div>
  );
};
