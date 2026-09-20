import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { SupportedLanguage } from '../types';
import { translations, TranslationDictionary, languageList, LanguageMeta } from '../data/translations';

interface LanguageContextType {
  currentLang: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationDictionary;
  isRtl: boolean;
  languageMeta: LanguageMeta;
  allLanguages: LanguageMeta[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const RTL_LANGUAGES: SupportedLanguage[] = ['ur', 'ar', 'fa', 'sd', 'ps'];
export const isLanguageRtl = (lang: SupportedLanguage): boolean => RTL_LANGUAGES.includes(lang);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLangState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('azad_master_f22_lang') as SupportedLanguage;
      if (saved && translations[saved]) {
        return saved;
      }
    } catch {}
    return 'ur';
  });

  const setLanguage = (newLang: SupportedLanguage) => {
    if (!translations[newLang]) return;
    setCurrentLangState(newLang);
    try {
      localStorage.setItem('azad_master_f22_lang', newLang);
    } catch {}
  };

  const isRtl = useMemo(() => isLanguageRtl(currentLang), [currentLang]);

  const t = useMemo(() => {
    // CRITICAL: Strictly fallback to English (en), never to Urdu or any other language
    const currentDict = translations[currentLang] || translations.en;
    return new Proxy(currentDict, {
      get(target, prop: string) {
        if (prop in target && target[prop]) {
          return target[prop];
        }
        return translations.en[prop] ?? '';
      },
    });
  }, [currentLang]);

  const languageMeta = useMemo(() => {
    return languageList.find((l) => l.code === currentLang) || languageList[0];
  }, [currentLang]);

  // Keep HTML document dir and lang attributes in sync globally
  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [currentLang, isRtl]);

  const value = useMemo(
    () => ({
      currentLang,
      setLanguage,
      t,
      isRtl,
      languageMeta,
      allLanguages: languageList,
    }),
    [currentLang, isRtl, t, languageMeta]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
