import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Database, 
  Camera, 
  MessageSquare, 
  FileSpreadsheet, 
  Users, 
  Mail, 
  Copy, 
  Check, 
  Calendar,
  Languages
} from 'lucide-react';

interface PrivacyModalProps {
  onClose: () => void;
  translations: Record<string, string>;
  isRtl: boolean;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  onClose,
  translations: t,
  isRtl: initialIsRtl,
}) => {
  const [langMode, setLangMode] = useState<'ur' | 'en'>(initialIsRtl ? 'ur' : 'en');
  const [copied, setCopied] = useState(false);

  const activeRtl = langMode === 'ur';

  const fullTextEnglish = `Privacy Policy for Azad Master

Effective Date: September 25, 2026
App Name: Azad Master (آزاد ماسٹر)
Developer Contact Email: abunaseeb.apps@gmail.com

1. Introduction
Azad Master is committed to protecting your privacy. This application is designed specifically for tailors and garment professionals to manage customer measurements, orders, stitching rates, and delivery statuses efficiently.

2. Information Collection and Storage
- Customer Data & Measurements: Customer names, phone numbers, garment measurements (kameez, shalwar, collar, chest, etc.), suit prices, advance payments, and remaining balances are collected solely for record-keeping purposes.
- Offline & Local Storage: All customer records, measurement slips, and pricing information are stored locally on your device (LocalStorage / IndexedDB). We do not sell, rent, or transfer your tailoring data to third parties.

3. Camera and Storage Permissions
- Camera & Gallery: Used solely if you choose to scan physical measurement slips using OCR (Optical Character Recognition) or attach reference images to orders. We do not access or collect unrelated personal photos from your device.

4. Communication (WhatsApp / SMS)
- Azad Master provides quick shortcuts to open WhatsApp or SMS to send order updates and measurement slips directly to your customers. Messages are sent through your own messaging apps; we do not read or store private chats.

5. Data Security & Export
- You maintain complete ownership of your data. You can back up or export your records (e.g., via Excel or JSON backup) at any time.

6. Children’s Privacy
Azad Master is a professional tailoring business tool and is not directed to children under the age of 13.

7. Contact Us
If you have any questions or suggestions regarding this Privacy Policy, please contact us at:
Email: abunaseeb.apps@gmail.com`;

  const fullTextUrdu = `آزاد ماسٹر پرائیویسی پالیسی (Privacy Policy)

نافذ العمل تاریخ: 25 ستمبر 2026
ایپ کا نام: آزاد ماسٹر (Azad Master)
ڈویلپر رابطہ ای میل: abunaseeb.apps@gmail.com

1. تعارف (Introduction)
آزاد ماسٹر آپ کی پرائیویسی کے تحفظ کے لیے پرعزم ہے۔ یہ ایپلی کیشن خاص طور پر درزیوں اور ٹیلرنگ ماہرین کے لیے بنائی گئی ہے تاکہ وہ گاہکوں کے ناپ، آرڈرز، سلائی ریٹس اور ڈیلیوری اسٹیٹس کا مؤثر طریقے سے انتظام کر سکیں۔

2. معلومات کا حصول اور اسٹوریج (Information Collection and Storage)
- کسٹمر ڈیٹا اور ناپ: گاہکوں کے نام، موبائل فون نمبرز، کپڑوں کے ناپ (قمیض، شلوار، کالر، چھاتی، گھیر وغیرہ)، سوٹ کی قیمت، ایڈوانس ادائیگی اور بقایا رقم صرف آپ کے ذاتی ریکارڈ رکھنے کے لیے محفوظ کی جاتی ہے۔
- آف لائن اور لوکل اسٹوریج: تمام کسٹمر ریکارڈز، ناپ کی پرچیاں اور قیمتیں آپ کے اپنے آلے (LocalStorage / IndexedDB) پر محفوظ رہتی ہیں۔ ہم آپ کا ٹیلرنگ ڈیٹا کسی تیسرے فریق کو کبھی فروخت یا منتقل نہیں کرتے۔

3. کیمرہ اور اسٹوریج کی اجازتیں (Camera & Storage Permissions)
- کیمرہ اور گیلری: یہ اجازتیں صرف اس وقت استعمال ہوتی ہیں جب آپ ہاتھ سے لکھی ہوئی ناپ کی پرچی کو OCR کے ذریعے اسکین کریں یا آرڈر کے ساتھ حوالہ تصویر منسلک کریں۔ ہم آپ کے آلے کی غیر متعلقہ ذاتی تصاویر تک رسائی حاصل نہیں کرتے۔

4. رابطہ کاری (WhatsApp / SMS)
- آزاد ماسٹر آپ کو واٹس ایپ یا ایس ایم ایس کے ذریعے گاہکوں کو آرڈر اپ ڈیٹس اور ناپ کی سلپ بھیجنے کے آسان شارٹ کٹس فراہم کرتا ہے۔ پیغامات آپ کی اپنی میسجنگ ایپ کے ذریعے بھیجے جاتے ہیں؛ ہم آپ کے ذاتی پیغامات کو کبھی نہیں پڑھتے اور نہ محفوظ کرتے ہیں۔

5. ڈیٹا کی حفاظت اور ایکسپورٹ (Data Security & Export)
- آپ اپنے تمام ڈیٹا کے مکمل اور خود مختار مالک ہیں۔ آپ کسی بھی وقت اپنے ریکارڈز کا ایکسل (Excel) یا بیک اپ (JSON) ایکسپورٹ کر سکتے ہیں۔

6. بچوں کی پرائیویسی (Children’s Privacy)
- آزاد ماسٹر ایک پیشہ ورانہ ٹیلرنگ بزنس ٹول ہے اور یہ 13 سال سے کم عمر بچوں کے لیے مخصوص نہیں ہے۔

7. ہم سے رابطہ کریں (Contact Us)
اگر اس پرائیویسی پالیسی کے متعلق آپ کا کوئی سوال یا تجویز ہے، تو برائے مہربانی ہم سے رابطہ کریں:
ای میل: abunaseeb.apps@gmail.com`;

  const handleCopy = () => {
    const textToCopy = langMode === 'ur' ? fullTextUrdu : fullTextEnglish;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      dir={activeRtl ? 'rtl' : 'ltr'}
    >
      <div 
        id="privacy-policy-modal"
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-[#075e54]/30 animate-in zoom-in-95 duration-200"
      >
        {/* Header - Signature WhatsApp Dark Green */}
        <div className="bg-[#075e54] text-white px-4 py-3.5 flex justify-between items-center shadow-md relative shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#25d366]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[15px] sm:text-base text-white tracking-wide leading-tight">
                  {activeRtl ? 'رازداری کی پالیسی (Privacy Policy)' : 'Privacy Policy for Azad Master'}
                </h3>
              </div>
              <p className="text-[11px] text-emerald-200 font-medium">
                Azad Master (آزاد ماسٹر) • {activeRtl ? 'آفیشل پالیسی' : 'Official Policy'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language Switch Button */}
            <button
              type="button"
              onClick={() => setLangMode(prev => prev === 'ur' ? 'en' : 'ur')}
              className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-white/20"
              title="Toggle Language"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-300" />
              <span>{langMode === 'ur' ? 'English' : 'اردو'}</span>
            </button>

            {/* Close Button */}
            <button 
              id="close-privacy-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metadata Banner: Effective Date & Contact */}
        <div className="bg-emerald-50/80 border-b border-emerald-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0 text-[11px] text-emerald-950 font-medium">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#075e54]" />
            <span className="font-bold">{activeRtl ? 'نافذ العمل تاریخ:' : 'Effective Date:'}</span>
            <span className="font-semibold text-emerald-800">September 25, 2026</span>
          </div>

          <a 
            href="mailto:abunaseeb.apps@gmail.com"
            className="flex items-center gap-1 text-[#075e54] hover:text-[#128c7e] font-bold hover:underline"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>abunaseeb.apps@gmail.com</span>
          </a>
        </div>

        {/* Scrollable Policy Content Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3.5 text-xs text-slate-700 leading-relaxed bg-[#f8fafc] flex-1">
          
          {/* Section 1: Introduction */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#075e54] font-black text-xs flex items-center justify-center">
                1
              </span>
              <h4 className="font-bold text-slate-900 text-[13px]">
                {activeRtl ? '1. تعارف (Introduction)' : '1. Introduction'}
              </h4>
            </div>
            <p className="text-slate-600 text-[11.5px] leading-relaxed">
              {activeRtl 
                ? 'آزاد ماسٹر آپ کی پرائیویسی کے تحفظ کے لیے پرعزم ہے۔ یہ ایپلی کیشن خاص طور پر درزیوں اور ٹیلرنگ ماہرین کے لیے بنائی گئی ہے تاکہ وہ گاہکوں کے ناپ، آرڈرز، سلائی ریٹس اور ڈیلیوری اسٹیٹس کا مؤثر طریقے سے انتظام کر سکیں بغیر کسی غیر ضروری مداخلت کے۔'
                : 'Azad Master is committed to protecting your privacy. This application is designed specifically for tailors and garment professionals to manage customer measurements, orders, stitching rates, and delivery statuses efficiently.'}
            </p>
          </div>

          {/* Section 2: Information Collection and Storage */}
          <div className="p-3.5 bg-white rounded-xl border border-emerald-200/80 shadow-2xs hover:border-emerald-400 transition-colors bg-gradient-to-br from-white to-emerald-50/20">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#075e54] font-black text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="font-bold text-slate-900 text-[13px] flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#075e54]" />
                  <span>{activeRtl ? '2. معلومات کا حصول اور اسٹوریج' : '2. Information Collection and Storage'}</span>
                </h4>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                100% Private
              </span>
            </div>
            
            <div className="space-y-2 text-slate-600 text-[11.5px] leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="text-[#075e54] font-bold mt-0.5">•</span>
                <p>
                  <strong className="text-slate-800 font-semibold">
                    {activeRtl ? 'کسٹمر ڈیٹا اور ناپ: ' : 'Customer Data & Measurements: '}
                  </strong>
                  {activeRtl
                    ? 'گاہکوں کے نام، فون نمبرز، کپڑوں کے ناپ (قمیض، شلوار، کالر، چھاتی وغیرہ)، سوٹ کی قیمت، ایڈوانس ادائیگی اور بقایا رقم صرف آپ کے دفتری ریکارڈ کے لیے محفوظ کیے جاتے ہیں۔'
                    : 'Customer names, phone numbers, garment measurements (kameez, shalwar, collar, chest, etc.), suit prices, advance payments, and remaining balances are collected solely for record-keeping purposes.'}
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-[#075e54] font-bold mt-0.5">•</span>
                <p>
                  <strong className="text-slate-800 font-semibold">
                    {activeRtl ? 'آف لائن اور لوکل اسٹوریج: ' : 'Offline & Local Storage: '}
                  </strong>
                  {activeRtl
                    ? 'تمام کسٹمر ریکارڈز، ناپ کی پرچیاں اور قیمتوں کی معلومات آپ کے اپنے آلے (LocalStorage / IndexedDB) پر محفوظ رہتی ہیں۔ ہم آپ کا ٹیلرنگ ڈیٹا کسی تیسرے فریق کو کبھی فروخت، کرایہ یا منتقل نہیں کرتے۔'
                    : 'All customer records, measurement slips, and pricing information are stored locally on your device (LocalStorage / IndexedDB). We do not sell, rent, or transfer your tailoring data to third parties.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Camera and Storage Permissions */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#075e54] font-black text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="font-bold text-slate-900 text-[13px] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#075e54]" />
                  <span>{activeRtl ? '3. کیمرہ اور اسٹوریج کی اجازتیں' : '3. Camera and Storage Permissions'}</span>
                </h4>
              </div>
              <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                OCR Only
              </span>
            </div>
            <p className="text-slate-600 text-[11.5px] leading-relaxed">
              <strong className="text-slate-800 font-semibold">
                {activeRtl ? 'کیمرہ اور گیلری: ' : 'Camera & Gallery: '}
              </strong>
              {activeRtl
                ? 'یہ اجازتیں صرف اس صورت میں استعمال ہوتی ہیں اگر آپ ہاتھ سے لکھی ہوئی ناپ کی پرچی کو OCR (آپٹیکل کریکٹر ریکوگنیشن) کے ذریعے اسکین کریں یا آرڈر کے ساتھ کپڑے کا نمونہ تصویر منسلک کریں۔ ہم آپ کے آلے کی غیر متعلقہ ذاتی تصاویر تک ہرگز رسائی حاصل نہیں کرتے۔'
                : 'Used solely if you choose to scan physical measurement slips using OCR (Optical Character Recognition) or attach reference images to orders. We do not access or collect unrelated personal photos from your device.'}
            </p>
          </div>

          {/* Section 4: Communication (WhatsApp / SMS) */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-[#25d366]/50 transition-colors">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#075e54] font-black text-xs flex items-center justify-center">
                  4
                </span>
                <h4 className="font-bold text-slate-900 text-[13px] flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#25d366]" />
                  <span>{activeRtl ? '4. رابطہ کاری (WhatsApp / SMS)' : '4. Communication (WhatsApp / SMS)'}</span>
                </h4>
              </div>
              <span className="bg-green-100 text-green-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                Direct
              </span>
            </div>
            <p className="text-slate-600 text-[11.5px] leading-relaxed">
              {activeRtl
                ? 'آزاد ماسٹر آپ کو واٹس ایپ یا ایس ایم ایس کے ذریعے گاہکوں کو آرڈر اپ ڈیٹس اور ناپ کی سلپ بھیجنے کے لیے کوئیک شارٹ کٹس فراہم کرتا ہے۔ پیغامات آپ کی اپنی میسجنگ ایپس کے ذریعے بھیجے جاتے ہیں؛ ہم آپ کی نجی چیٹس یا پیغامات کو کبھی نہیں پڑھتے اور نہ محفوظ کرتے ہیں۔'
                : 'Azad Master provides quick shortcuts to open WhatsApp or SMS to send order updates and measurement slips directly to your customers. Messages are sent through your own messaging apps; we do not read or store private chats.'}
            </p>
          </div>

          {/* Section 5: Data Security & Export */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#075e54] font-black text-xs flex items-center justify-center">
                  5
                </span>
                <h4 className="font-bold text-slate-900 text-[13px] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-[#075e54]" />
                  <span>{activeRtl ? '5. ڈیٹا کی حفاظت اور ایکسپورٹ' : '5. Data Security & Export'}</span>
                </h4>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                Your Data
              </span>
            </div>
            <p className="text-slate-600 text-[11.5px] leading-relaxed">
              {activeRtl
                ? 'آپ اپنے تمام ڈیٹا کی مکمل ملکیت برقرار رکھتے ہیں۔ آپ کسی بھی وقت اپنے ریکارڈز کا ایکسل (Excel) یا بیک اپ (JSON) کے ذریعے بیک اپ یا ایکسپورٹ حاصل کر سکتے ہیں۔'
                : 'You maintain complete ownership of your data. You can back up or export your records (e.g., via Excel or JSON backup) at any time.'}
            </p>
          </div>

          {/* Section 6: Children’s Privacy */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#075e54] font-black text-xs flex items-center justify-center">
                6
              </span>
              <h4 className="font-bold text-slate-900 text-[13px] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#075e54]" />
                <span>{activeRtl ? '6. بچوں کی پرائیویسی' : '6. Children’s Privacy'}</span>
              </h4>
            </div>
            <p className="text-slate-600 text-[11.5px] leading-relaxed">
              {activeRtl
                ? 'آزاد ماسٹر پیشہ ورانہ ٹیلرنگ بزنس کا ایک انتظامی ٹول ہے اور یہ 13 سال سے کم عمر بچوں کے لیے مخصوص نہیں ہے۔'
                : 'Azad Master is a professional tailoring business tool and is not directed to children under the age of 13.'}
            </p>
          </div>

          {/* Section 7: Contact Us */}
          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/90 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                7
              </span>
              <h4 className="font-bold text-[#075e54] text-[13px] flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-[#075e54]" />
                <span>{activeRtl ? '7. ہم سے رابطہ کریں (Contact Us)' : '7. Contact Us'}</span>
              </h4>
            </div>
            <p className="text-slate-700 text-[11.5px] leading-relaxed mb-2.5">
              {activeRtl
                ? 'اگر اس پرائیویسی پالیسی کے متعلق آپ کا کوئی سوال یا تجویز ہے، تو آپ ڈویلپر سے بلا جھجھک رابطہ کر سکتے ہیں:'
                : 'If you have any questions or suggestions regarding this Privacy Policy, please contact us at:'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="mailto:abunaseeb.apps@gmail.com"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#075e54] text-white font-bold text-xs hover:bg-[#128c7e] transition-colors shadow-2xs cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>abunaseeb.apps@gmail.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions: Copy Policy & Close */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            id="copy-privacy-policy-btn"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">{activeRtl ? 'کاپی ہو گیا!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>{activeRtl ? 'مکمل پالیسی کاپی کریں' : 'Copy Policy'}</span>
              </>
            )}
          </button>

          <button 
            id="privacy-close-btn"
            onClick={onClose}
            className="bg-[#075e54] hover:bg-[#064e46] active:scale-[0.98] text-white py-2 px-5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-[#25d366]" />
            <span>{activeRtl ? 'ٹھیک ہے / بند کریں' : 'Close'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyModal;
