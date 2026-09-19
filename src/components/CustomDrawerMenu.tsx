import React, { useState } from 'react';
import { SupportedLanguage } from '../types';
import { languageList } from '../data/translations';
import { Scissors } from 'lucide-react';

export interface CustomDrawerMenuProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (route: 'Profile' | 'Language' | 'Backup' | 'Help') => void;
  onLogout: () => void;
  currentLang?: SupportedLanguage;
  onChangeLanguage?: (lang: SupportedLanguage) => void;
  masterName?: string;
  userPhone?: string;
  isRtl?: boolean;
}

const menuTranslations: Record<SupportedLanguage, {
  menuTitle: string;
  profileSettings: string;
  changeLanguage: string;
  dataBackup: string;
  helpSupport: string;
  logout: string;
  close: string;
}> = {
  ur: {
    menuTitle: "آزاد ماسٹر مینو",
    profileSettings: "پروفائل اور سیٹنگز",
    changeLanguage: "زبان تبدیل کریں",
    dataBackup: "ڈیٹا کلاؤڈ سنک اور بیک اپ",
    helpSupport: "مدد اور صارف گائیڈ",
    logout: "لاگ آؤٹ کریں",
    close: "بند کریں"
  },
  sd: {
    menuTitle: "آزاد ماسٽر مينيو",
    profileSettings: "پروفائل ۽ سيٽنگون",
    changeLanguage: "ٻولي تبديل ڪريو",
    dataBackup: "ڊيٽا ڪلائوڊ بيڪ اپ ۽ سنڪ",
    helpSupport: "مدد ۽ يوزر گائيڊ",
    logout: "لاگ آئوٽ",
    close: "بند ڪريو"
  },
  ps: {
    menuTitle: "آزاد ماسټر مینو",
    profileSettings: "پروفایل او ترتیبات",
    changeLanguage: "ژبه بدله کړئ",
    dataBackup: "د ډیټا بیک اپ او سنک",
    helpSupport: "مرسته او لارښود",
    logout: "وتل (لاګ آوټ)",
    close: "بندول"
  },
  ar: {
    menuTitle: "قائمة أزاد ماستر",
    profileSettings: "الملف الشخصي والإعدادات",
    changeLanguage: "تغيير اللغة",
    dataBackup: "النسخ الاحتياطي والمزامنة",
    helpSupport: "المساعدة ودليل المستخدم",
    logout: "تسجيل الخروج",
    close: "إغلاق"
  },
  fa: {
    menuTitle: "منوی آزاد مستر",
    profileSettings: "پروفایل و تنظیمات",
    changeLanguage: "تغییر زبان",
    dataBackup: "پشتیبان‌گیری و همگام‌سازی",
    helpSupport: "راهنما و پشتیبانی",
    logout: "خروج از حساب",
    close: "بستن"
  },
  hi: {
    menuTitle: "आज़ाद मास्टर मेन्यू",
    profileSettings: "प्रोफ़ाइल और सेटिंग्स",
    changeLanguage: "भाषा बदलें",
    dataBackup: "डेटा बैकअप और क्लाउड सिंक",
    helpSupport: "मदद और यूज़र गाइड",
    logout: "लॉग आउट करें",
    close: "बंद करें"
  },
  pa: {
    menuTitle: "ਆਜ਼ਾਦ ਮਾਸਟਰ ਮੇਨੂ",
    profileSettings: "ਪ੍ਰੋਫਾਈਲ ਅਤੇ ਸੈਟਿੰਗਜ਼",
    changeLanguage: "ਭਾਸ਼ਾ ਬਦਲੋ",
    dataBackup: "ਡੇਟਾ ਬੈਕਅੱਪ ਅਤੇ ਸਿੰਕ",
    helpSupport: "ਮਦਦ ਅਤੇ ਯੂਜ਼ਰ ਗਾਈਡ",
    logout: "ਲੌਗ ਆਉਟ",
    close: "ਬੰਦ ਕਰੋ"
  },
  bn: {
    menuTitle: "আজাদ মাস্টার মেনু",
    profileSettings: "প্রোফাইল ও সেটিংস",
    changeLanguage: "ভাষা পরিবর্তন করুন",
    dataBackup: "ডাটা ব্যাকআপ ও সিঙ্ক",
    helpSupport: "সাহায্য ও গাইড",
    logout: "লগ আউট",
    close: "বন্ধ করুন"
  },
  tr: {
    menuTitle: "Azad Master Menü",
    profileSettings: "Profil ve Ayarlar",
    changeLanguage: "Dili Değiştir",
    dataBackup: "Veri Yedekleme ve Senkron",
    helpSupport: "Yardım ve Rehber",
    logout: "Çıkış Yap",
    close: "Kapat"
  },
  es: {
    menuTitle: "Menú Azad Master",
    profileSettings: "Perfil y Configuración",
    changeLanguage: "Cambiar Idioma",
    dataBackup: "Copia de Seguridad y Sincronización",
    helpSupport: "Ayuda y Soporte",
    logout: "Cerrar Sesión",
    close: "Cerrar"
  },
  fr: {
    menuTitle: "Menu Azad Master",
    profileSettings: "Profil et Paramètres",
    changeLanguage: "Changer de Langue",
    dataBackup: "Sauvegarde et Synchronisation",
    helpSupport: "Aide et Support",
    logout: "Déconnexion",
    close: "Fermer"
  },
  de: {
    menuTitle: "Azad Master Menü",
    profileSettings: "Profil und Einstellungen",
    changeLanguage: "Sprache Ändern",
    dataBackup: "Datensicherung & Synchronisation",
    helpSupport: "Hilfe und Support",
    logout: "Abmelden",
    close: "Schließen"
  },
  it: {
    menuTitle: "Menu Azad Master",
    profileSettings: "Profilo e Impostazioni",
    changeLanguage: "Cambia Lingua",
    dataBackup: "Backup Dati e Sincronizzazione",
    helpSupport: "Aiuto e Supporto",
    logout: "Disconnetti",
    close: "Chiudi"
  },
  ru: {
    menuTitle: "Меню Азад Мастер",
    profileSettings: "Профиль и настройки",
    changeLanguage: "Сменить язык",
    dataBackup: "Резервное копирование",
    helpSupport: "Помощь и руководство",
    logout: "Выйти",
    close: "Закрыть"
  },
  zh: {
    menuTitle: "Azad Master 菜单",
    profileSettings: "个人资料与设置",
    changeLanguage: "更改语言",
    dataBackup: "数据备份与同步",
    helpSupport: "帮助与支持",
    logout: "退出登录",
    close: "关闭"
  },
  ja: {
    menuTitle: "Azad Master メニュー",
    profileSettings: "プロフィールと設定",
    changeLanguage: "言語を変更",
    dataBackup: "データバックアップと同期",
    helpSupport: "ヘルプとサポート",
    logout: "ログアウト",
    close: "閉じる"
  },
  ko: {
    menuTitle: "Azad Master 메뉴",
    profileSettings: "프로필 및 설정",
    changeLanguage: "언어 변경",
    dataBackup: "데이터 백업 및 동기화",
    helpSupport: "도움말 및 지원",
    logout: "로그아웃",
    close: "닫기"
  },
  ms: {
    menuTitle: "Menu Azad Master",
    profileSettings: "Profil & Tetapan",
    changeLanguage: "Tukar Bahasa",
    dataBackup: "Sandaran Data & Segerak",
    helpSupport: "Bantuan & Sokongan",
    logout: "Log Keluar",
    close: "Tutup"
  },
  id: {
    menuTitle: "Menu Azad Master",
    profileSettings: "Profil & Pengaturan",
    changeLanguage: "Ubah Bahasa",
    dataBackup: "Cadangkan Data & Sinkronisasi",
    helpSupport: "Bantuan & Dukungan",
    logout: "Keluar",
    close: "Tutup"
  },
  en: {
    menuTitle: "Azad Master Menu",
    profileSettings: "Profile & Settings",
    changeLanguage: "Change Language",
    dataBackup: "Data Backup & Cloud Sync",
    helpSupport: "Help & User Guide",
    logout: "Logout",
    close: "Close"
  }
};

/**
 * CustomDrawerMenu (کسٹم ڈراور مینو - 4 لائن مینو)
 * - Safe layout, width, and positioning: Opens cleanly under the 4-line menu button.
 * - Never gets clipped or pushed off screen in any language (RTL or LTR).
 * - Fixed emerald backdrop with click-outside dismissal.
 */
export const CustomDrawerMenu: React.FC<CustomDrawerMenuProps> = ({
  visible,
  onClose,
  onNavigate,
  onLogout,
  currentLang = 'ur',
  onChangeLanguage,
  masterName,
  userPhone,
  isRtl = false,
}) => {
  const [showLangPicker, setShowLangPicker] = useState(false);

  if (!visible) return null;

  const t = menuTranslations[currentLang] || menuTranslations.en;
  const currentLangMeta = languageList.find((l) => l.code === currentLang);

  return (
    <>
      {/* Click-outside backdrop with luxurious emerald atmosphere */}
      <div 
        id="custom-drawer-backdrop"
        className="fixed inset-0 z-40 bg-[#062c1d]/65 backdrop-blur-[0.5px] transition-opacity"
        onClick={onClose}
      />

      {/* Menu Container: Anchored safely below header with responsive width and padding */}
      <div 
        id="custom-drawer-menu-container"
        onClick={(e) => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
        className="absolute top-full mt-2 left-2 sm:left-3 z-50 w-[295px] max-w-[calc(100vw-1.25rem)] sm:max-w-[340px] bg-white rounded-2xl shadow-2xl border border-[#128c7e]/25 text-slate-800 overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Header with WhatsApp Green Theme & Master Info */}
        <div className="p-3.5 bg-gradient-to-r from-[#075e54] via-[#128c7e] to-[#075e54] text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 border border-amber-300/40 shadow-xs shrink-0">
              <img src="/azad-master-logo.svg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-black text-white truncate tracking-wide">
                {t.menuTitle}
              </h3>
              {masterName ? (
                <p className="text-[11px] text-[#dcf8c6] truncate mt-0.5 font-medium">
                  {masterName} {userPhone ? `• ${userPhone}` : ''}
                </p>
              ) : (
                <p className="text-[10px] text-[#dcf8c6]/90 uppercase tracking-wider font-semibold">
                  By Naseeb SEO
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-xs p-1.5 rounded-full hover:bg-white/15 transition-colors shrink-0 ml-1 cursor-pointer"
            title={t.close}
            aria-label={t.close}
          >
            ✕
          </button>
        </div>

        {/* Menu Options List */}
        <div className="p-1.5 space-y-0.5">
          {/* 1. Profile & Settings */}
          <button
            type="button"
            id="drawer-item-profile"
            className="w-full text-left rtl:text-right px-3 py-2.5 hover:bg-[#e7f7ef] active:bg-[#dcf8c6] rounded-xl transition-colors flex items-center justify-between cursor-pointer border-none bg-transparent text-[13px] text-slate-700 font-semibold"
            onClick={() => {
              onClose();
              onNavigate('Profile');
            }}
          >
            <span className="flex items-center gap-2.5 truncate">
              <span className="text-base shrink-0">⚙️</span>
              <span className="truncate">{t.profileSettings}</span>
            </span>
          </button>

          {/* 2. Change Language Accordion */}
          <button
            type="button"
            id="drawer-item-language"
            className="w-full text-left rtl:text-right px-3 py-2.5 hover:bg-[#e7f7ef] active:bg-[#dcf8c6] rounded-xl transition-colors flex items-center justify-between cursor-pointer border-none bg-transparent text-[13px] text-slate-700 font-semibold"
            onClick={() => {
              setShowLangPicker(!showLangPicker);
            }}
          >
            <span className="flex items-center gap-2.5 truncate">
              <span className="text-base shrink-0">🌐</span>
              <span className="truncate">{t.changeLanguage}</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#dcf8c6] text-[#075e54] font-bold shrink-0 flex items-center gap-1 border border-[#00a884]/30">
              <span>{currentLangMeta?.flag}</span>
              <span>{currentLangMeta?.nativeName}</span>
              <span className="text-[9px] text-[#075e54]">{showLangPicker ? '▲' : '▼'}</span>
            </span>
          </button>

          {/* Language Selector Dropdown List */}
          {showLangPicker && (
            <div className="px-2.5 py-2 bg-[#f0faf4] rounded-xl border border-[#128c7e]/25 space-y-1.5 my-1 animate-in fade-in duration-100">
              <select
                id="drawer-language-select"
                value={currentLang}
                onChange={(e) => {
                  if (onChangeLanguage) {
                    onChangeLanguage(e.target.value as SupportedLanguage);
                  }
                  setShowLangPicker(false);
                  onClose();
                }}
                className="w-full p-2 bg-white rounded-lg border border-[#128c7e]/40 text-xs font-semibold text-slate-800 outline-none shadow-2xs focus:ring-2 focus:ring-[#25d366] cursor-pointer"
              >
                {languageList.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.nativeName} — {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3. Data Backup & Cloud Sync */}
          <button
            type="button"
            id="drawer-item-backup"
            className="w-full text-left rtl:text-right px-3 py-2.5 hover:bg-[#e7f7ef] active:bg-[#dcf8c6] rounded-xl transition-colors flex items-center justify-between cursor-pointer border-none bg-transparent text-[13px] text-slate-700 font-semibold"
            onClick={() => {
              onClose();
              onNavigate('Backup');
            }}
          >
            <span className="flex items-center gap-2.5 truncate">
              <span className="text-base shrink-0">☁️</span>
              <span className="truncate">{t.dataBackup}</span>
            </span>
          </button>

          {/* 4. Help & User Guide */}
          <button
            type="button"
            id="drawer-item-help"
            className="w-full text-left rtl:text-right px-3 py-2.5 hover:bg-[#e7f7ef] active:bg-[#dcf8c6] rounded-xl transition-colors flex items-center justify-between cursor-pointer border-none bg-transparent text-[13px] text-slate-700 font-semibold"
            onClick={() => {
              onClose();
              onNavigate('Help');
            }}
          >
            <span className="flex items-center gap-2.5 truncate">
              <span className="text-base shrink-0">❓</span>
              <span className="truncate">{t.helpSupport}</span>
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 mx-2 my-0.5" />

        {/* 5. Logout Button */}
        <div className="p-1.5">
          <button
            type="button"
            id="drawer-item-logout"
            className="w-full text-left rtl:text-right px-3 py-2.5 bg-rose-50/70 hover:bg-rose-100 active:bg-rose-200 rounded-xl transition-colors flex items-center justify-between cursor-pointer border border-rose-100 text-[13px] font-bold text-rose-700"
            onClick={() => {
              onClose();
              onLogout();
            }}
          >
            <span className="flex items-center gap-2.5">
              <span className="text-base shrink-0">🔒</span>
              <span>{t.logout}</span>
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default CustomDrawerMenu;
