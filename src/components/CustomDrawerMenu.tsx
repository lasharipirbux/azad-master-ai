import React, { useState } from 'react';
import { SupportedLanguage } from '../types';
import { languageList } from '../data/translations';
import { Scissors } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export interface CustomDrawerMenuProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (route: 'Profile' | 'Analytics' | 'BulkMessaging' | 'Language' | 'Backup' | 'Help' | 'Privacy') => void;
  onLogout: () => void;
  onOpenMeasurementModal?: () => void;
  onOpenSlipModal?: () => void;
  onOpenBulkMsg?: () => void;
  onTriggerBackup?: () => void;
  onExportExcel?: () => void;
  onExportJson?: () => void;
  todayCount?: number;
  lateCount?: number;
  onFilterToday?: () => void;
  onFilterLate?: () => void;
  sortOption?: 'newest' | 'urgent' | 'alphabetical';
  onChangeSort?: (option: 'newest' | 'urgent' | 'alphabetical') => void;
  currentLang?: SupportedLanguage;
  onChangeLanguage?: (lang: SupportedLanguage) => void;
  masterName?: string;
  userPhone?: string;
  userEmail?: string;
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
  addMeasurement: string;
  slipCamera: string;
  bulkMsg: string;
  backupData: string;
}> = {
  ur: {
    menuTitle: "آزاد ماسٹر مینو",
    profileSettings: "پروفائل اور سیٹنگز",
    changeLanguage: "زبان تبدیل کریں",
    dataBackup: "ڈیٹا کلاؤڈ سنک اور بیک اپ",
    helpSupport: "مدد اور صارف گائیڈ",
    logout: "لاگ آؤٹ کریں",
    close: "بند کریں",
    addMeasurement: "+ نیا ناپ درج کریں",
    slipCamera: "📸 پرچی / کیمرہ اسکین",
    bulkMsg: "💬 تمام گاہکوں کو میسج",
    backupData: "💾 ڈیٹا بیک اپ لیں"
  },
  sd: {
    menuTitle: "آزاد ماسٽر مينيو",
    profileSettings: "پروفائل ۽ سيٽنگون",
    changeLanguage: "ٻولي تبديل ڪريو",
    dataBackup: "ڊيٽا ڪلائوڊ بيڪ اپ ۽ سنڪ",
    helpSupport: "مدد ۽ يوزر گائيڊ",
    logout: "لاگ آئوٽ",
    close: "بند ڪريو",
    addMeasurement: "+ نئين ماپ داخل ڪريو",
    slipCamera: "📸 پرچي / ڪئميرا اسڪين",
    bulkMsg: "💬 سڀني گراهڪن کي ميسيج",
    backupData: "💾 ڊيٽا بيڪ اپ وٺو"
  },
  ps: {
    menuTitle: "آزاد ماسټر مینو",
    profileSettings: "پروفایل او ترتیبات",
    changeLanguage: "ژبه بدله کړئ",
    dataBackup: "د ډیټا بیک اپ او سنک",
    helpSupport: "مرسته او لارښود",
    logout: "وتل (لاګ آوټ)",
    close: "بندول",
    addMeasurement: "+ نوې اندازه ثبت کړئ",
    slipCamera: "📸 پرچی / کیمره سکین",
    bulkMsg: "💬 ټولو پیرودونکو ته پیغام",
    backupData: "💾 د ډیټا بیک اپ"
  },
  ar: {
    menuTitle: "قائمة أزاد ماستر",
    profileSettings: "الملف الشخصي والإعدادات",
    changeLanguage: "تغيير اللغة",
    dataBackup: "النسخ الاحتياطي والمزامنة",
    helpSupport: "المساعدة ودليل المستخدم",
    logout: "تسجيل الخروج",
    close: "إغلاق",
    addMeasurement: "+ إضافة قياس جديد",
    slipCamera: "📸 مسح الورقة / الكاميرا",
    bulkMsg: "💬 رسالة لجميع الزبائن",
    backupData: "💾 نسخ البيانات احتياطياً"
  },
  fa: {
    menuTitle: "منوی آزاد مستر",
    profileSettings: "پروفایل و تنظیمات",
    changeLanguage: "تغییر زبان",
    dataBackup: "پشتیبان‌گیری و همگام‌سازی",
    helpSupport: "راهنما و پشتیبانی",
    logout: "خروج از حساب",
    close: "بستن",
    addMeasurement: "+ افزودن اندازه جدید",
    slipCamera: "📸 اسکن رسید / دوربین",
    bulkMsg: "💬 پیام به تمام مشتریان",
    backupData: "💾 پشتیبان‌گیری از داده‌ها"
  },
  hi: {
    menuTitle: "آज़ाद मास्टर मेन्यू",
    profileSettings: "प्रोफ़ाइल और सेटिंग्स",
    changeLanguage: "भाषा बदलें",
    dataBackup: "डेटा बैकअप और क्लाउड सिंक",
    helpSupport: "मदद और यूज़र गाइड",
    logout: "लॉग आउट करें",
    close: "बंद करें",
    addMeasurement: "+ नया नाप दर्ज करें",
    slipCamera: "📸 पर्ची / कैमरा स्कैन",
    bulkMsg: "💬 सभी ग्राहकों को संदेश",
    backupData: "💾 डेटा बैकअप लें"
  },
  pa: {
    menuTitle: "ਆਜ਼ਾਦ ਮਾਸਟਰ ਮੇਨੂ",
    profileSettings: "ਪ੍ਰੋਫਾਈਲ ਅਤੇ ਸੈਟਿੰਗਜ਼",
    changeLanguage: "ਭਾਸ਼ਾ ਬਦਲੋ",
    dataBackup: "ਡੇਟਾ ਬੈਕਅੱਪ ਅਤੇ ਸਿੰਕ",
    helpSupport: "ਮਦਦ ਅਤੇ ਯੂਜ਼ਰ ਗਾਈਡ",
    logout: "ਲੌਗ ਆਉਟ",
    close: "ਬੰਦ ਕਰੋ",
    addMeasurement: "+ ਨਵਾਂ ਨਾਪ ਦਰਜ ਕਰੋ",
    slipCamera: "📸 ਪਰਚੀ / ਕੈਮਰਾ ਸਕੈਨ",
    bulkMsg: "💬 ਸਾਰੇ ਗਾਹਕਾਂ ਨੂੰ ਸੁਨੇਹਾ",
    backupData: "💾 ਡੇਟਾ ਬੈਕਅੱਪ ਲਵੋ"
  },
  bn: {
    menuTitle: "আজাদ মাস্টার মেনু",
    profileSettings: "প্রোফাইল ও সেটিংস",
    changeLanguage: "ভাষা পরিবর্তন করুন",
    dataBackup: "ডাটা ব্যাকআপ ও সিঙ্ক",
    helpSupport: "সাহায্য ও গাইড",
    logout: "লগ আউট",
    close: "বন্ধ করুন",
    addMeasurement: "+ নতুন মাপ যোগ করুন",
    slipCamera: "📸 রসিদ / ক্যামেরা স্ক্যান",
    bulkMsg: "💬 সকল গ্রাহককে বার্তা",
    backupData: "💾 ডাটা ব্যাকআপ নিন"
  },
  tr: {
    menuTitle: "Azad Master Menü",
    profileSettings: "Profil ve Ayarlar",
    changeLanguage: "Dili Değiştir",
    dataBackup: "Veri Yedekleme ve Senkron",
    helpSupport: "Yardım ve Rehber",
    logout: "Çıkış Yap",
    close: "Kapat",
    addMeasurement: "+ Yeni Ölçü Ekle",
    slipCamera: "📸 Fiş / Kamera Tara",
    bulkMsg: "💬 Tüm Müşterilere Mesaj",
    backupData: "💾 Veriyi Yedekle"
  },
  es: {
    menuTitle: "Menú Azad Master",
    profileSettings: "Perfil y Configuración",
    changeLanguage: "Cambiar Idioma",
    dataBackup: "Copia de Seguridad y Sincronización",
    helpSupport: "Ayuda y Soporte",
    logout: "Cerrar Sesión",
    close: "Cerrar",
    addMeasurement: "+ Agregar Medida",
    slipCamera: "📸 Escanear Ficha / Cámara",
    bulkMsg: "💬 Mensaje a Todos",
    backupData: "💾 Copia de Seguridad"
  },
  fr: {
    menuTitle: "Menu Azad Master",
    profileSettings: "Profil et Paramètres",
    changeLanguage: "Changer de Langue",
    dataBackup: "Sauvegarde et Synchronisation",
    helpSupport: "Aide et Support",
    logout: "Déconnexion",
    close: "Fermer",
    addMeasurement: "+ Ajouter une mesure",
    slipCamera: "📸 Scanner la fiche / Caméra",
    bulkMsg: "💬 Message à tous",
    backupData: "💾 Sauvegarder les données"
  },
  de: {
    menuTitle: "Azad Master Menü",
    profileSettings: "Profil und Einstellungen",
    changeLanguage: "Sprache Ändern",
    dataBackup: "Datensicherung & Synchronisation",
    helpSupport: "Hilfe und Support",
    logout: "Abmelden",
    close: "Schließen",
    addMeasurement: "+ Neues Maß hinzufügen",
    slipCamera: "📸 Zettel / Kamera scannen",
    bulkMsg: "💬 Nachricht an alle",
    backupData: "💾 Daten sichern"
  },
  it: {
    menuTitle: "Menu Azad Master",
    profileSettings: "Profilo e Impostazioni",
    changeLanguage: "Cambia Lingua",
    dataBackup: "Backup Dati e Sincronizzazione",
    helpSupport: "Aiuto e Supporto",
    logout: "Disconnetti",
    close: "Chiudi",
    addMeasurement: "+ Aggiungi Misura",
    slipCamera: "📸 Scansiona Ricevuta / Fotocamera",
    bulkMsg: "💬 Messaggio a Tutti",
    backupData: "💾 Backup Dati"
  },
  ru: {
    menuTitle: "Меню Азад Мастер",
    profileSettings: "Профиль и настройки",
    changeLanguage: "Сменить язык",
    dataBackup: "Резервное копирование",
    helpSupport: "Помощь и руководство",
    logout: "Выйти",
    close: "Закрыть",
    addMeasurement: "+ Добавить мерку",
    slipCamera: "📸 Бланк / Камера",
    bulkMsg: "💬 Рассылка всем",
    backupData: "💾 Резервная копия"
  },
  zh: {
    menuTitle: "Azad Master 菜单",
    profileSettings: "个人资料与设置",
    changeLanguage: "更改语言",
    dataBackup: "数据备份与同步",
    helpSupport: "帮助与支持",
    logout: "退出登录",
    close: "关闭",
    addMeasurement: "+ 添加新尺寸",
    slipCamera: "📸 纸条 / 相机扫描",
    bulkMsg: "💬 群发消息给客户",
    backupData: "💾 备份数据"
  },
  ja: {
    menuTitle: "Azad Master メニュー",
    profileSettings: "プロフィールと設定",
    changeLanguage: "言語を変更",
    dataBackup: "データバックアップと同期",
    helpSupport: "ヘルプとサポート",
    logout: "ログアウト",
    close: "閉じる",
    addMeasurement: "+ 新規採寸を追加",
    slipCamera: "📸 伝票 / カメラ スキャン",
    bulkMsg: "💬 全顧客にメッセージ",
    backupData: "💾 データ バックアップ"
  },
  ko: {
    menuTitle: "Azad Master 메뉴",
    profileSettings: "프로필 및 설정",
    changeLanguage: "언어 변경",
    dataBackup: "데이터 백업 및 동기화",
    helpSupport: "도움말 및 지원",
    logout: "로그아웃",
    close: "닫기",
    addMeasurement: "+ 새 치수 추가",
    slipCamera: "📸 전표 / 카메라 스캔",
    bulkMsg: "💬 전체 고객 메시지",
    backupData: "💾 데이터 백업"
  },
  ms: {
    menuTitle: "Menu Azad Master",
    profileSettings: "Profil & Tetapan",
    changeLanguage: "Tukar Bahasa",
    dataBackup: "Sandaran Data & Segerak",
    helpSupport: "Bantuan & Sokongan",
    logout: "Log Keluar",
    close: "Tutup",
    addMeasurement: "+ Tambah Ukuran",
    slipCamera: "📸 Imbas Resit / Kamera",
    bulkMsg: "💬 Mesej Semua Pelanggan",
    backupData: "💾 Sandarkan Data"
  },
  id: {
    menuTitle: "Menu Azad Master",
    profileSettings: "Profil & Pengaturan",
    changeLanguage: "Ubah Bahasa",
    dataBackup: "Cadangkan Data & Sinkronisasi",
    helpSupport: "Bantuan & Dukungan",
    logout: "Keluar",
    close: "Tutup",
    addMeasurement: "+ Tambah Ukuran Baru",
    slipCamera: "📸 Pindai Kertas / Kamera",
    bulkMsg: "💬 Pesan Massal Pelanggan",
    backupData: "💾 Cadangkan Data"
  },
  en: {
    menuTitle: "Azad Master Menu",
    profileSettings: "Profile & Settings",
    changeLanguage: "Change Language",
    dataBackup: "Data Backup & Cloud Sync",
    helpSupport: "Help & User Guide",
    logout: "Logout",
    close: "Close",
    addMeasurement: "+ Add Measurement",
    slipCamera: "📸 Slip / Camera",
    bulkMsg: "💬 Bulk Message",
    backupData: "💾 Backup Data"
  },
  pt: {
    menuTitle: "Menu Azad Master",
    profileSettings: "Perfil e Configurações",
    changeLanguage: "Mudar Idioma",
    dataBackup: "Backup e Sincronização",
    helpSupport: "Ajuda e Guia do Usuário",
    logout: "Sair",
    close: "Fechar",
    addMeasurement: "+ Adicionar Medida",
    slipCamera: "📸 Escanear Ficha / Câmera",
    bulkMsg: "💬 Mensagem em Massa",
    backupData: "💾 Fazer Backup"
  },
  th: {
    menuTitle: "เมนู Azad Master",
    profileSettings: "โปรไฟล์และการตั้งค่า",
    changeLanguage: "เปลี่ยนภาษา",
    dataBackup: "สำรองและซิงค์ข้อมูล",
    helpSupport: "ความช่วยเหลือและคู่มือ",
    logout: "ออกจากระบบ",
    close: "ปิด",
    addMeasurement: "+ เพิ่มการวัดใหม่",
    slipCamera: "📸 สแกนใบเสร็จ / กล้อง",
    bulkMsg: "💬 ส่งข้อความถึงลูกค้าทุกคน",
    backupData: "💾 สำรองข้อมูล"
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
  onOpenMeasurementModal,
  onOpenSlipModal,
  onOpenBulkMsg,
  onTriggerBackup,
  onExportExcel,
  onExportJson,
  todayCount,
  lateCount,
  onFilterToday,
  onFilterLate,
  sortOption = 'newest',
  onChangeSort,
  currentLang = 'ur',
  onChangeLanguage,
  masterName,
  userPhone,
  userEmail,
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
        className="absolute top-full mt-2 left-2 sm:left-3 z-50 w-[310px] max-w-[calc(100vw-1.25rem)] sm:max-w-[350px] max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-[#128c7e]/25 text-slate-800 select-none animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Header with WhatsApp Green Theme & Master Info */}
        <div className="p-3.5 bg-gradient-to-r from-[#075e54] via-[#128c7e] to-[#075e54] text-white flex items-center justify-between shadow-xs sticky top-0 z-10">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 border border-amber-300/40 shadow-xs shrink-0">
              <img src="/azad-master-logo.svg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-black text-white truncate tracking-wide">
                {t.menuTitle}
              </h3>
              {masterName ? (
                <div className="mt-0.5">
                  <p className="text-[11px] text-[#dcf8c6] truncate font-bold">
                    {masterName}
                  </p>
                  {userEmail && (
                    <p className="text-[9.5px] text-emerald-200 truncate font-mono" dir="ltr">
                      {userEmail}
                    </p>
                  )}
                </div>
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

        {/* سائیڈ بار یا مینو کے اندر ایکشن لسٹ */}
        <div className="flex flex-col space-y-1.5 p-3 text-right">
          <button 
            type="button"
            id="drawer-action-measurement"
            onClick={() => {
              if (onOpenMeasurementModal) {
                onOpenMeasurementModal();
              }
              onClose();
            }}
            className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-emerald-50 active:bg-emerald-100 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <span>{t.addMeasurement}</span>
            <span className="text-[#075e54] font-bold">
              {currentLang === 'en' ? '📏 Measure' : '📏 + Add Measurement'}
            </span>
          </button>

          <button 
            type="button"
            id="drawer-action-slip"
            onClick={() => {
              if (onOpenSlipModal) {
                onOpenSlipModal();
              }
              onClose();
            }}
            className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-emerald-50 active:bg-emerald-100 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <span>{t.slipCamera}</span>
            <span className="text-[#128c7e] font-bold">
              {currentLang === 'en' ? '📸 OCR Scan' : '📸 Slip / Camera'}
            </span>
          </button>

          <button 
            type="button"
            id="drawer-action-bulk-msg"
            onClick={() => {
              if (onOpenBulkMsg) {
                onOpenBulkMsg();
              } else {
                onNavigate('BulkMessaging');
              }
              onClose();
            }}
            className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-emerald-50 active:bg-emerald-100 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <span>{t.bulkMsg}</span>
            <span className="text-emerald-600 font-bold">
              {currentLang === 'en' ? '💬 WhatsApp/SMS' : '💬 Bulk Message'}
            </span>
          </button>
        </div>

        {/* Secondary Administrative Tools: Excel Export, JSON Backup, Today Delivery & Sorting */}
        <div className="px-3 pb-2 space-y-2">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/90 space-y-2">
            <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
              <span>{isRtl ? '🛠 ڈیٹا و آرڈر ٹولز' : '🛠 Data & Order Tools'}</span>
              {(todayCount !== undefined && todayCount > 0) && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                  {todayCount} {isRtl ? 'آج کی ڈیلیوری' : 'Today'}
                </span>
              )}
            </div>

            {/* Excel & Backup 1-Click Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                id="drawer-export-excel-btn"
                onClick={() => {
                  if (onExportExcel) onExportExcel();
                  onClose();
                }}
                className="p-2 bg-white hover:bg-emerald-50 active:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <span>📊</span>
                <span>{isRtl ? 'ایکسل شیٹ (Excel)' : 'Export Excel'}</span>
              </button>

              <button
                type="button"
                id="drawer-backup-btn"
                onClick={() => {
                  if (onExportJson) onExportJson();
                  else if (onTriggerBackup) onTriggerBackup();
                  onClose();
                }}
                className="p-2 bg-white hover:bg-blue-50 active:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <span>💾</span>
                <span>{isRtl ? 'بیک اپ (JSON)' : 'Backup JSON'}</span>
              </button>
            </div>

            {/* Today & Late Orders Filter Toggles */}
            {(todayCount !== undefined || lateCount !== undefined) && (
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  id="drawer-today-filter-btn"
                  onClick={() => {
                    if (onFilterToday) onFilterToday();
                    onClose();
                  }}
                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer"
                >
                  <span>📅 {isRtl ? 'آج کی ڈیلیوری' : 'Today Delivery'}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black">
                    {todayCount || 0}
                  </span>
                </button>

                <button
                  type="button"
                  id="drawer-late-filter-btn"
                  onClick={() => {
                    if (onFilterLate) onFilterLate();
                    onClose();
                  }}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer"
                >
                  <span>⚠️ {isRtl ? 'لیٹ آرڈرز' : 'Late Orders'}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-900 text-[10px] font-black">
                    {lateCount || 0}
                  </span>
                </button>
              </div>
            )}

            {/* Sort Selector in Drawer */}
            {onChangeSort && (
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200 text-xs">
                <span className="font-bold text-slate-600 text-[11px]">{isRtl ? 'ترتیب:' : 'Sort:'}</span>
                <select
                  value={sortOption}
                  onChange={(e) => {
                    onChangeSort(e.target.value as 'newest' | 'urgent' | 'alphabetical');
                  }}
                  className="p-1 bg-white rounded-md border border-slate-300 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="newest">{isRtl ? 'تازہ ترین آرڈرز' : 'Newest First'}</option>
                  <option value="urgent">{isRtl ? 'ارجنٹ ڈیلیوری پہلے' : 'Urgent First'}</option>
                  <option value="alphabetical">{isRtl ? 'نام (A تا Z)' : 'Name (A-Z)'}</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 mx-3 my-0.5" />

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

          {/* 1.5 Business & Customer Analytics */}
          <button
            type="button"
            id="drawer-item-analytics"
            className="w-full text-left rtl:text-right px-3 py-2.5 hover:bg-emerald-50 active:bg-emerald-100 rounded-xl transition-colors flex items-center justify-between cursor-pointer border border-emerald-200/60 bg-emerald-50/40 text-[13px] text-emerald-900 font-bold"
            onClick={() => {
              onClose();
              onNavigate('Analytics');
            }}
          >
            <span className="flex items-center gap-2.5 truncate">
              <span className="text-base shrink-0">📊</span>
              <span className="truncate">{isRtl ? 'دکان کی بزنس رپورٹ و تجزیہ' : 'Business & Customer Analytics'}</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-black">
              NEW
            </span>
          </button>

          {/* 1.6 Bulk WhatsApp / SMS Messaging */}
          <button
            type="button"
            id="drawer-item-bulk-message"
            className="w-full text-left rtl:text-right px-3 py-2.5 hover:bg-[#e7f7ef] active:bg-[#dcf8c6] rounded-xl transition-colors flex items-center justify-between cursor-pointer border border-[#25d366]/30 bg-[#f0faf4] text-[13px] text-[#075e54] font-bold"
            onClick={() => {
              onClose();
              onNavigate('BulkMessaging');
            }}
          >
            <span className="flex items-center gap-2.5 truncate">
              <span className="text-base shrink-0">📢</span>
              <span className="truncate">{isRtl ? 'بلک واٹس ایپ / ایس ایم ایس' : 'Bulk WhatsApp / SMS'}</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#25d366] text-white font-black shadow-2xs">
              SAFE
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
            <div className="px-2.5 py-2 bg-[#f0faf4] rounded-xl border border-[#128c7e]/25 space-y-2 my-1 animate-in fade-in duration-100">
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

              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pt-1 pr-1 custom-scrollbar">
                {languageList.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      if (onChangeLanguage) {
                        onChangeLanguage(l.code as SupportedLanguage);
                      }
                      setShowLangPicker(false);
                      onClose();
                    }}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold text-left rtl:text-right flex items-center justify-between border transition-all cursor-pointer ${
                      currentLang === l.code
                        ? 'bg-[#075e54] text-white border-[#075e54] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-[#e7f7ef]'
                    }`}
                  >
                    <span className="truncate">{l.nativeName}</span>
                    <span className="text-xs shrink-0">{l.flag}</span>
                  </button>
                ))}
              </div>
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

          {/* 4.5 Privacy Policy */}
          <button
            type="button"
            id="drawer-item-privacy"
            className="w-full text-left rtl:text-right px-3 py-2.5 hover:bg-[#e7f7ef] active:bg-[#dcf8c6] rounded-xl transition-colors flex items-center justify-between cursor-pointer border border-emerald-200/60 bg-emerald-50/40 text-[13px] text-emerald-900 font-bold shadow-2xs"
            onClick={() => {
              onClose();
              onNavigate('Privacy');
            }}
          >
            <span className="flex items-center gap-2.5 truncate">
              <span className="text-base shrink-0">🛡️</span>
              <span className="truncate">{isRtl ? 'پرائیویسی پالیسی (Privacy Policy)' : 'Privacy Policy'}</span>
            </span>
            <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
              Official
            </span>
          </button>

          {/* 5. Mobile App PWA Install Button */}
          <div className="pt-1">
            <PWAInstallButton isRtl={isRtl} variant="drawer" />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 mx-2 my-0.5" />

        {/* 6. Logout Button */}
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

        {/* App Version Tag */}
        <div className="px-3 pb-2 pt-0.5 text-center text-[10.5px] text-slate-400 font-medium">
          Azad Master v1.0
        </div>
      </div>
    </>
  );
};

export default CustomDrawerMenu;
