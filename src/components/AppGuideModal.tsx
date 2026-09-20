import React from 'react';
import { 
  X, 
  BookOpen, 
  PlusCircle, 
  Camera, 
  Clock, 
  MessageCircle, 
  Scissors, 
  Globe, 
  ShieldCheck, 
  CheckCircle2,
  Sparkles 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AppGuideModalProps {
  onClose: () => void;
  isRtl?: boolean;
  translations?: Record<string, string>;
}

export const AppGuideModal: React.FC<AppGuideModalProps> = ({
  onClose,
}) => {
  const { t, isRtl } = useLanguage();

  const guideSteps = [
    {
      step: '1',
      icon: PlusCircle,
      title: t.guideStep1Title || (isRtl ? 'نیا ناپ یا گاہک درج کرنا' : 'Add New Measurement Slip'),
      desc: t.guideStep1Desc || (isRtl ? 'نیچے موجود (+) کے بٹن پر کلک کریں، گاہک کا نام، فون نمبر اور ناپ لکھیں یا بول کر خودکار درج کروائیں۔' : 'Tap the bottom (+) button, enter customer name, phone number, and measurements manually or speak to fill automatically.'),
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    },
    {
      step: '2',
      icon: Sparkles,
      title: t.guideStep2Title || (isRtl ? 'آزاد ماسٹر اسسٹنٹ' : 'Azad Master Tailoring Assistant'),
      desc: t.guideStep2Desc || (isRtl ? 'فارم میں وائس اور آٹو کیلکولیشن کی مدد سے ناپ بولیں، کٹنگ فارمولا یا کپڑے کا گز حساب سیکنڈوں میں معلوم کریں۔' : 'Use voice input and smart calculation tools to speak measurements, get instant fabric yardage, and expert tailoring cutting formulas.'),
      color: 'text-emerald-900 bg-[#e7f7ef] border-[#128c7e]/30'
    },
    {
      step: '3',
      icon: Camera,
      title: t.guideStep3Title || (isRtl ? 'پرچہ اسکیننگ' : 'Scan Paper Slip with AI'),
      desc: t.guideStep3Desc || (isRtl ? 'کیمرے سے پرچے یا کپڑے کی تصویر کھینچیں یا گیلری سے منتخب کریں۔ آزاد AI خودکار طریقے سے تمام ناپ پڑھ کر فارم میں بھر دے گا۔' : 'Snap a photo of handwritten slip from camera or pick from gallery. Azad AI will automatically read and extract the measurements.'),
      color: 'text-blue-700 bg-blue-50 border-blue-200'
    },
    {
      step: '4',
      icon: Clock,
      title: t.guideStep4Title || (isRtl ? 'آرڈرز ٹریکنگ اور اسٹیٹس فلٹرز' : 'Order Tracking & Live Status'),
      desc: t.guideStep4Desc || (isRtl ? 'کسٹمر کارڈ پر موجود ڈراپ ڈاؤن سے اسٹیٹس بدلیں: زیرِ کار، کٹنگ، سلائی، تیار، حوالے' : 'Update order status directly on customer cards (Pending, Cutting, Stitching, Ready, Delivered) and use top chips to filter orders.'),
      color: 'text-amber-700 bg-amber-50 border-amber-200'
    },
    {
      step: '5',
      icon: MessageCircle,
      title: isRtl ? 'واٹس ایپ کٹنگ رسید بھیجنا' : 'Direct WhatsApp Sharing',
      desc: isRtl ? 'ہر کسٹمر کارڈ یا ڈیجیٹل سلپ کے اندر موجود واٹس ایپ بٹن دبائیں؛ ناپ کا مکمل پرچہ براہ راست گاہک کے نمبر پر چلا جائے گا۔' : 'Click the WhatsApp button on any card or slip to send a professionally formatted measurement receipt directly to the customer.',
      color: 'text-green-700 bg-green-50 border-green-200'
    },
    {
      step: '6',
      icon: Scissors,
      title: isRtl ? '✂️ کٹنگ موڈ' : '✂️ Cutting Mode for Tailors',
      desc: isRtl ? 'ڈیجیٹل سلپ کھول کر ✂️ کٹنگ موڈ آن کریں۔ تمام ناپ بڑی اور نمایاں امبر رنگ میں نظر آئیں گی تاکہ کپڑا کاٹتے وقت واضح اور آسانی ہو۔' : 'Open any digital slip and activate ✂️ Cutting Mode. Measurements appear in giant amber font for effortless viewing while cutting fabric.',
      color: 'text-purple-700 bg-purple-50 border-purple-200'
    },
    {
      step: '7',
      icon: Globe,
      title: isRtl ? 'زبان کی تبدیلی اور ڈیٹا بیک اپ' : '22 Languages & Cloud Backup',
      desc: isRtl ? 'مینو سے اردو، سندھی، ہندی، پشتو، پنجابی، عربی، انگریزی سمیت 22 زبانیں منتخب کر سکتے ہیں۔ سیٹنگز سے اپنے تمام ریکارڈ کا بیک اپ ڈاؤنلوڈ اور ری اسٹور کریں۔' : 'Select from 22 supported languages in the menu. Export and restore all customer data backups securely from Settings.',
      color: 'text-teal-700 bg-teal-50 border-teal-200'
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[#062c1d]/85 backdrop-blur-xs transition-opacity"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div 
        id="app-guide-modal"
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[88vh] overflow-hidden border border-[#0d4a2a]/20 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Signature Dark Green Header */}
        <div className="bg-[#0d4a2a] text-white px-4 py-3.5 flex justify-between items-center shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5 text-[#10b981]" />
            </div>
            <div>
              <h3 className="font-bold text-[15px] text-white tracking-wide leading-tight">
                {t.appGuideTitle || (isRtl ? 'استعمال کا طریقہ' : 'App Guide & Instructions')}
              </h3>
              <p className="text-[10.5px] text-emerald-200">
                {t.appGuideSub || (isRtl ? 'آزاد ماسٹر ایپ چلانے کے آسان طریقے' : 'Step-by-step master guide')}
              </p>
            </div>
          </div>
          <button 
            id="close-app-guide-btn"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Guide Content */}
        <div className="p-4 overflow-y-auto space-y-3 bg-[#f8fafc] text-xs">
          {guideSteps.map((item, index) => {
            const IconComp = item.icon;
            return (
              <div 
                key={index}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] hover:border-[#0d4a2a]/40 transition-colors space-y-1.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 ${item.color}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-[13px] flex items-center justify-between">
                      <span>{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-bold">#{item.step}</span>
                    </h4>
                  </div>
                </div>
                <p className="text-slate-600 text-[11.5px] leading-relaxed pr-1 pl-1">
                  {item.desc}
                </p>
              </div>
            );
          })}

          {/* Need Help / Contact Developer Section */}
          <div 
            id="help-contact-section"
            className="rounded-xl p-3.5 text-center shadow-md space-y-2 border"
            style={{
              backgroundColor: '#0b231b',
              borderColor: '#d4af37'
            }}
          >
            <h3 className="font-bold text-sm" style={{ color: '#d4af37' }}>
              {t.needHelpTitle || 'Need Help?'}
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed">
              {t.developerInfo || (isRtl 
                ? 'اگر آپ کو آزاد ماسٹر ایپ استعمال کرنے میں کوئی دشواری ہو، تو ہم سے بلا جھجھک رابطہ کریں:'
                : 'If you face any issue using Azad Master, feel free to contact us:')}
            </p>
            
            {/* WhatsApp Contact */}
            <div className="flex items-center justify-center gap-2 text-xs pt-1">
              <span className="font-bold" style={{ color: '#d4af37' }}>WhatsApp:</span>
              <a 
                href="https://wa.me/?text=Hello%20Azad%20Master%20Support" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold hover:underline flex items-center gap-1 transition-all"
                style={{ color: '#00ff80' }}
              >
                <span>💬 {t.contactWhatsApp || 'Contact on WhatsApp'}</span>
              </a>
            </div>

            {/* Email Address */}
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="font-bold" style={{ color: '#d4af37' }}>Email:</span>
              <a 
                href="mailto:naseebseo2626@gmail.com" 
                className="font-semibold hover:underline transition-all"
                style={{ color: '#00ff80' }}
              >
                naseebseo2626@gmail.com
              </a>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-emerald-900 text-white p-3 rounded-xl shadow-xs space-y-1 border border-emerald-700">
            <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-[#fbbf24]" />
              <span>{isRtl ? 'ضروری مشورہ (Pro Tip):' : 'Pro Tip:'}</span>
            </div>
            <p className="text-[11px] text-emerald-100 leading-relaxed">
              {t.secureStorage100 || (isRtl 
                ? 'کسی بھی ناپ پرچی کو ہمیشہ آف لائن بھی استعمال کر سکتے ہیں۔ انٹرنیٹ آنے پر ڈیٹا خودکار فائر اسٹور کلاؤڈ پر محفوظ ہو جاتا ہے۔'
                : 'All measurement records work offline seamlessly and sync automatically to Firestore cloud storage when connected.')}
            </p>
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="p-3 bg-white border-t border-slate-100 shrink-0">
          <button 
            id="done-app-guide-btn"
            onClick={onClose}
            className="w-full bg-[#0d4a2a] hover:bg-[#09351e] active:scale-[0.98] text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-[#10b981]" />
            <span>{t.closeGuide || (isRtl ? 'ٹھیک ہے / سمجھ گیا' : 'Got it / Close Guide')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
