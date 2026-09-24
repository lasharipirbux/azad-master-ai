import React, { useState, memo } from 'react';
import { Megaphone, Info, X } from 'lucide-react';

interface AdMobBannerPlaceholderProps {
  isRtl?: boolean;
  adUnitId?: string; // Optional AdMob Ad Unit ID prop for ready integration
  enabled?: boolean; // Set to true when AdMob ads are active, false to cleanly disable
}

export const AdMobBannerPlaceholder: React.FC<AdMobBannerPlaceholderProps> = memo(({ 
  isRtl = true,
  adUnitId = 'ca-app-pub-3940256099942544/6300978111', // Default AdMob Test Banner ID
  enabled = false // Disabled by default for full clean space
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!enabled || isDismissed) return null;

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="w-full bg-slate-100/90 border-t border-slate-200/80 py-1 px-2 flex flex-col items-center justify-center shrink-0 select-none z-30 relative shadow-2xs backdrop-blur-xs"
    >
      {/* Small Header Label for AdMob Container */}
      <div className="w-full max-w-[320px] sm:max-w-[468px] flex items-center justify-between px-1 mb-0.5 text-[9.5px] font-bold text-slate-400">
        <span className="flex items-center gap-1">
          <span className="bg-amber-100 text-amber-800 text-[8.5px] px-1 py-0.2 rounded font-black border border-amber-300/60 uppercase tracking-wider">
            {isRtl ? 'اشتہار' : 'Ad'}
          </span>
          <span className="text-slate-400 font-normal hidden sm:inline">Google AdMob Reserved Space</span>
        </span>
        <span className="text-[8.5px] text-slate-400 font-mono tracking-tighter">
          ID: {adUnitId ? `${adUnitId.substring(0, 15)}...` : 'Ready'}
        </span>
      </div>

      {/* Standard 320x50 Banner Slot */}
      <div 
        className="w-full max-w-[320px] sm:max-w-[468px] h-[50px] bg-white border border-dashed border-slate-300 rounded-lg flex items-center justify-between px-3 shadow-2xs overflow-hidden transition-all hover:border-emerald-500/50"
        id="admob-banner-container"
        data-admob-unit-id={adUnitId}
      >
        <div className="flex items-center gap-2 text-slate-600">
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
            <Megaphone className="w-4 h-4 text-[#075e54]" />
          </div>
          <div className="flex flex-col text-right rtl:text-right ltr:text-left">
            <span className="text-[11px] font-bold text-[#075e54] truncate">
              {isRtl ? 'آزاد ماسٹر ڈیجیٹل رجسٹر' : 'Azad Master Digital Register'}
            </span>
            <span className="text-[9.5px] font-medium text-slate-500 truncate">
              {isRtl ? 'گوگل ایڈموب بینر ایڈ اسپیس (320x50)' : 'Google AdMob Banner Space (320x50)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-2 py-1 rounded border border-slate-200 transition-colors">
            {isRtl ? 'انسٹال' : 'Install'}
          </span>
        </div>
      </div>
    </div>
  );
});
