import React, { useEffect, useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const { currentLang } = useLanguage();
  const isUrdu = currentLang === 'ur' || currentLang === 'sd';

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-20 left-3 sm:left-6 z-40 max-w-xs animate-in slide-in-from-bottom duration-200"
      dir={isUrdu ? 'rtl' : 'ltr'}
    >
      {!isOnline ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/95 text-amber-300 border border-amber-500/40 shadow-xl backdrop-blur-xs text-xs">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <div>
            <p className="font-bold leading-tight">
              {isUrdu ? 'آف لائن موڈ فعال ہے' : '100% Offline Mode Active'}
            </p>
            <p className="text-[10.5px] text-slate-300 leading-tight">
              {isUrdu ? 'تمام ناپ، آرڈرز اور پرچے بغیر انٹرنیٹ محفوظ ہیں' : 'All measurements & slips work offline'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/95 text-emerald-200 border border-emerald-500/50 shadow-xl backdrop-blur-xs text-xs">
          <CheckCircle2 className="w-4 h-4 text-[#25d366] shrink-0" />
          <div>
            <p className="font-bold leading-tight">
              {isUrdu ? 'انٹرنیٹ بحال - کلاؤڈ سنک مکمل' : 'Back Online - Cloud Synced'}
            </p>
            <p className="text-[10.5px] text-emerald-300 leading-tight">
              {isUrdu ? 'آف لائن درج کردہ تمام ناپ خودبخود کلاؤڈ پر محفوظ ہو گئے' : 'All offline measurements auto-synced to cloud'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
