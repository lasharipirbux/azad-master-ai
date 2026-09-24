import React, { useState, useMemo } from 'react';
import { Customer, SupportedLanguage } from '../types';
import { TranslationDictionary } from '../data/translations';
import { getAvatarColorByName, getCustomerInitial } from '../utils/avatarColors';
import {
  X,
  MessageCircle,
  Phone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Users,
  Copy,
  Check,
  ShieldCheck,
  ChevronRight,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';

export interface BulkMessagingModalProps {
  visible: boolean;
  onClose: () => void;
  customers: Customer[];
  masterName?: string;
  isRtl?: boolean;
  currentLang?: SupportedLanguage;
  translations?: TranslationDictionary;
}

type MessageTemplateType = 'ready' | 'eid_season' | 'udhaar' | 'custom';

export const BulkMessagingModal: React.FC<BulkMessagingModalProps> = ({
  visible,
  onClose,
  customers,
  masterName = 'آزاد ماسٹر',
  isRtl = true,
  translations,
}) => {
  // Selection filter
  const [targetCategory, setTargetCategory] = useState<'all' | 'ready' | 'udhaar' | 'pending'>('ready');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [templateType, setTemplateType] = useState<MessageTemplateType>('ready');
  const [customText, setCustomText] = useState('');
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [copiedPhones, setCopiedPhones] = useState(false);
  const [activeStep, setActiveStep] = useState<'select' | 'sendQueue'>('select');
  const [currentSendIndex, setCurrentSendIndex] = useState<number>(0);

  // Filter customers with valid phone numbers
  const customersWithPhone = useMemo(() => {
    return customers.filter((c) => {
      const cleanPhone = (c.phone || '').replace(/[^0-9]/g, '');
      return cleanPhone.length >= 7;
    });
  }, [customers]);

  // Filter customers according to target category
  const filteredCategoryList = useMemo(() => {
    if (targetCategory === 'ready') {
      return customersWithPhone.filter((c) => c.status === 'ready' || c.status === 'delivered');
    }
    if (targetCategory === 'udhaar') {
      return customersWithPhone.filter((c) => {
        const tot = parseFloat(String(c.totalAmount || 0)) || 0;
        const adv = parseFloat(String(c.advanceAmount || 0)) || 0;
        const bal = c.balanceAmount !== undefined && c.balanceAmount !== '' 
          ? (parseFloat(String(c.balanceAmount)) || 0) 
          : Math.max(0, tot - adv);
        return bal > 0;
      });
    }
    if (targetCategory === 'pending') {
      return customersWithPhone.filter((c) => c.status === 'pending' || c.status === 'stitching' || c.status === 'cutting');
    }
    return customersWithPhone;
  }, [customersWithPhone, targetCategory]);

  // Initial selection on category change or modal open
  React.useEffect(() => {
    if (visible) {
      const initialMap: Record<string, boolean> = {};
      filteredCategoryList.forEach((c) => {
        initialMap[c.id] = true;
      });
      setSelectedIds(initialMap);
      setSentMap({});
      setActiveStep('select');
      setCurrentSendIndex(0);
    }
  }, [visible, targetCategory]);

  if (!visible) return null;

  // Selected customers list
  const selectedCustomers = filteredCategoryList.filter((c) => selectedIds[c.id]);

  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCategoryList.length) {
      // Uncheck all
      setSelectedIds({});
    } else {
      // Check all
      const newMap: Record<string, boolean> = {};
      filteredCategoryList.forEach((c) => {
        newMap[c.id] = true;
      });
      setSelectedIds(newMap);
    }
  };

  const toggleCustomerId = (id: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Generate personalized text for a customer
  const getPersonalizedMessage = (customer: Customer): string => {
    const customerName = customer.name?.trim() || (isRtl ? 'گاہک' : 'Customer');
    const tot = parseFloat(String(customer.totalAmount || 0)) || 0;
    const adv = parseFloat(String(customer.advanceAmount || 0)) || 0;
    const bal = customer.balanceAmount !== undefined && customer.balanceAmount !== '' 
      ? (parseFloat(String(customer.balanceAmount)) || 0) 
      : Math.max(0, tot - adv);

    if (templateType === 'ready') {
      return isRtl 
        ? `✨ *${masterName} - سوٹ تیار ہے* ✨\n━━━━━━━━━━━━━━━━━━━━\nمحترم جناب *${customerName}* صاحب،\nالسلام علیکم! آپ کا سوٹ آزاد ماسٹر ٹیلرز پر سلائی ہو کر مکمل تیار ہے۔\n\n💵 *بقایا رقم:* Rs. ${bal}\nبرائے مہربانی تشریف لا کر اپنا سوٹ وصول فرما لیں۔\n━━━━━━━━━━━━━━━━━━━━\nشکریہ!\n*${masterName}*`
        : `✨ *${masterName} - Suit Ready* ✨\nDear ${customerName},\nYour stitched suit is ready for pickup at ${masterName}.\nPending Balance: Rs. ${bal}\nThank you!`;
    }

    if (templateType === 'eid_season') {
      return isRtl 
        ? `🌙 *${masterName} - عید و سیزن مبارک* 🌙\n━━━━━━━━━━━━━━━━━━━━\nمحترم جناب *${customerName}* صاحب،\nالسلام علیکم! آزاد ماسٹر ٹیلرز کی طرف سے آپ کو اور آپ کی فیملی کو دلی مبارکباد۔\n\n✂️ نئے سوٹوں کی سلائی اور سیزن بکنگ جاری ہے۔ رش اور تاخیر سے بچنے کے لیے وقت پر کپڑے تشریف لا کر بک کروا لیں۔\n━━━━━━━━━━━━━━━━━━━━\nدعا گو:\n*${masterName}*`
        : `🌙 *${masterName} - Season Greetings* 🌙\nDear ${customerName},\nGreetings from ${masterName}! Tailoring and seasonal bookings are now open. Visit us early to avoid delays.\nThank you!`;
    }

    if (templateType === 'udhaar') {
      return isRtl 
        ? `💼 *${masterName} - بل و بقایا رقم یاد دہانی* 💼\n━━━━━━━━━━━━━━━━━━━━\nمحترم جناب *${customerName}* صاحب،\nالسلام علیکم! امید ہے آپ خیریت سے ہوں گے۔ آزاد ماسٹر کے پاس آپ کے سوٹ کا حساب:\n\n💵 *کل رقم:* Rs. ${tot}\n✅ *وصول شدہ:* Rs. ${adv}\n⏳ *بقایا ادھار:* Rs. ${bal}\n\nبرائے مہربانی تشریف لا کر بقایا رقم ادا فرما دیجیے۔\n━━━━━━━━━━━━━━━━━━━━\nشکریہ!\n*${masterName}*`
        : `💼 *${masterName} - Payment Reminder* 💼\nDear ${customerName},\nYour pending balance at ${masterName} is Rs. ${bal}. Please visit us to settle the account.\nThank you!`;
    }

    // Custom
    if (!customText.trim()) {
      return isRtl 
        ? `محترم جناب *${customerName}* صاحب،\nالسلام علیکم!\n*${masterName}*` 
        : `Dear ${customerName},\nGreetings from ${masterName}!`;
    }
    return customText.replace(/{name}|{نام}/gi, customerName).replace(/{balance}|{بقایا}/gi, String(bal));
  };

  // Safe WhatsApp sender
  const handleSendWhatsApp = (customer: Customer, index?: number) => {
    const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) return;

    const text = getPersonalizedMessage(customer);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');

    setSentMap((prev) => ({
      ...prev,
      [customer.id]: true,
    }));

    if (index !== undefined && index < selectedCustomers.length - 1) {
      setCurrentSendIndex(index + 1);
    }
  };

  // Copy all phone numbers for SMS Broadcast
  const handleCopyPhoneNumbers = () => {
    const numbers = selectedCustomers
      .map((c) => (c.phone || '').replace(/[^0-9]/g, ''))
      .filter(Boolean)
      .join(', ');

    if (!numbers) return;
    navigator.clipboard.writeText(numbers);
    setCopiedPhones(true);
    setTimeout(() => setCopiedPhones(false), 3000);
  };

  return (
    <div
      id="bulk-messaging-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="bg-white w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#075e54] via-[#128c7e] to-[#075e54] text-white p-3.5 sm:p-4 shrink-0 flex items-center justify-between border-b border-[#00a884]/30 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <MessageCircle className="w-5 h-5 text-[#25d366] fill-[#25d366]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{isRtl ? 'بلک واٹس ایپ و ایس ایم ایس پیغام' : 'Bulk WhatsApp / SMS Messaging'}</span>
              </h2>
              <p className="text-[11px] text-emerald-100 font-medium">
                {isRtl ? 'محفوظ طریقہ: درزی کا نمبر بین ہوئے بغیر کسٹمرز کو میسج بھیجیں' : 'Safe 1-click personalized messaging for tailors'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/35 flex items-center justify-center text-white transition-colors cursor-pointer"
            title={translations?.close || (isRtl ? 'بند کریں' : 'Close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Safety Badge */}
        <div className="bg-emerald-50 px-3.5 py-2 border-b border-emerald-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{isRtl ? '100% آفیشل اور محفوظ واٹس ایپ ری ڈائریکٹ - نو اسپیم / نو بین' : '100% Safe WhatsApp Redirect - No Ban Risk'}</span>
          </div>
          <div className="text-[11px] text-emerald-800 font-extrabold">
            {selectedCustomers.length} {isRtl ? 'منتخب گاہک' : 'Selected'}
          </div>
        </div>

        {/* Steps Tab Switch */}
        <div className="flex bg-slate-100 p-1.5 border-b border-slate-200 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveStep('select')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeStep === 'select' ? 'bg-[#075e54] text-white shadow-xs' : 'text-slate-600 hover:bg-white/80'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>1. {isRtl ? 'میسج اور کسٹمر منتخب کریں' : 'Template & Selection'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep('sendQueue')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeStep === 'sendQueue' ? 'bg-[#075e54] text-white shadow-xs' : 'text-slate-600 hover:bg-white/80'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>2. {isRtl ? 'ارسال لسٹ (Send Queue)' : 'Send Queue'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
              {Object.keys(sentMap).length}/{selectedCustomers.length}
            </span>
          </button>
        </div>

        {/* STEP 1: SELECT TEMPLATE & CUSTOMERS */}
        {activeStep === 'select' && (
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 bg-slate-50/60">
            {/* 1. Choose Message Template */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{isRtl ? 'ریڈی میڈ میسج ٹیمپلیٹ منتخب کریں:' : 'Select Message Template:'}</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setTemplateType('ready')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    templateType === 'ready'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold'
                  }`}
                >
                  <span className="text-base">✨</span>
                  <span className="text-xs">{isRtl ? 'سوٹ تیار ہے' : 'Suit Ready'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateType('eid_season')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    templateType === 'eid_season'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold'
                  }`}
                >
                  <span className="text-base">🌙</span>
                  <span className="text-xs">{isRtl ? 'عید و سیزن بکنگ' : 'Eid / Season'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateType('udhaar')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    templateType === 'udhaar'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold'
                  }`}
                >
                  <span className="text-base">💼</span>
                  <span className="text-xs">{isRtl ? 'بقایا ادھار یاد دہانی' : 'Udhaar Balance'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateType('custom')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    templateType === 'custom'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold'
                  }`}
                >
                  <span className="text-base">✍️</span>
                  <span className="text-xs">{isRtl ? 'کسٹم پیغام' : 'Custom Text'}</span>
                </button>
              </div>

              {/* Custom Textarea if selected */}
              {templateType === 'custom' && (
                <div className="space-y-1 pt-1">
                  <textarea
                    rows={3}
                    placeholder={isRtl ? 'یہاں اپنا پیغام لکھیں... (مثال: محترم جناب {نام}، آپ کے کپڑے موصول ہو چکے ہیں...)' : 'Write your custom message here...'}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#075e54] shadow-2xs"
                  />
                  <p className="text-[10.5px] text-slate-500">
                    💡 {isRtl ? 'ٹپ: {نام} اور {بقایا} لکھنے سے ایپ خود ہر گاہک کا نام اور بقایا رقم درج کرے گی۔' : 'Tip: Use {name} or {balance} tags for personalization.'}
                  </p>
                </div>
              )}

              {/* Message Live Preview */}
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80 text-xs text-slate-800 font-mono whitespace-pre-line shadow-2xs">
                <span className="text-[10.5px] font-bold text-emerald-800 block mb-1 font-sans">
                  👁️ {isRtl ? 'پیغام کا نمونہ (Preview):' : 'Message Preview:'}
                </span>
                {getPersonalizedMessage(selectedCustomers[0] || { name: isRtl ? 'علی خان' : 'Ali Khan', totalAmount: 2500, advanceAmount: 1000, balanceAmount: 1500 } as any)}
              </div>
            </div>

            {/* 2. Choose Customer Category */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#075e54]" />
                  <span>{isRtl ? 'کس گاہکوں کو بھیجنا ہے؟' : 'Target Category:'}</span>
                </label>

                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-bold text-[#075e54] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {selectedCustomers.length === filteredCategoryList.length ? (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'سب ختم کریں' : 'Deselect All'}</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-[#075e54]" />
                      <span>{isRtl ? 'سب منتخب کریں' : 'Select All'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Category Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setTargetCategory('ready')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    targetCategory === 'ready'
                      ? 'bg-[#075e54] text-white border-[#075e54] shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  ✅ {isRtl ? 'تیار شدہ سوٹ (Ready)' : 'Ready Suits'}
                </button>

                <button
                  type="button"
                  onClick={() => setTargetCategory('udhaar')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    targetCategory === 'udhaar'
                      ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  💼 {isRtl ? 'بقایا ادھار والے (Udhaar)' : 'Udhaar Balances'}
                </button>

                <button
                  type="button"
                  onClick={() => setTargetCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    targetCategory === 'all'
                      ? 'bg-[#075e54] text-white border-[#075e54] shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  👥 {isRtl ? 'تمام کسٹمرز (All)' : 'All Clients'}
                </button>

                <button
                  type="button"
                  onClick={() => setTargetCategory('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    targetCategory === 'pending'
                      ? 'bg-[#075e54] text-white border-[#075e54] shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  ⏳ {isRtl ? 'زیرِ سلائی (In Progress)' : 'In Progress'}
                </button>
              </div>

              {/* Customer Checklist */}
              <div className="bg-white border border-slate-200 rounded-xl p-2 max-h-56 overflow-y-auto space-y-1.5 shadow-inner">
                {filteredCategoryList.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    {isRtl ? 'اس کیٹیگری میں کوئی گاہک موجود نہیں ہے' : 'No customers found in this category'}
                  </div>
                ) : (
                  filteredCategoryList.map((c) => {
                    const isChecked = !!selectedIds[c.id];
                    const avatarTheme = getAvatarColorByName(c.name, c.avatarColor);
                    const initial = getCustomerInitial(c.name);

                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleCustomerId(c.id)}
                        className={`p-2 rounded-lg flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                          isChecked ? 'bg-emerald-50/70 border border-emerald-200' : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 text-[#075e54] rounded-md focus:ring-0 cursor-pointer"
                          />

                          <div
                            className={`w-7 h-7 rounded-lg ${
                              c.imageUri ? 'bg-slate-100' : `${avatarTheme.gradientClass} ${avatarTheme.solidTextClass}`
                            } flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden select-none`}
                          >
                            {c.imageUri ? (
                              <img src={c.imageUri} alt={c.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{initial}</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-800 truncate block">
                              {c.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block" dir="ltr">
                              {c.phone}
                            </span>
                          </div>
                        </div>

                        {c.status && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-slate-100 text-slate-700 shrink-0">
                            {c.status}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SEND QUEUE & ACTION */}
        {activeStep === 'sendQueue' && (
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 bg-slate-50/60">
            {/* Queue Summary Header */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">
                  {isRtl ? 'محفوظ واٹس ایپ ارسال کاؤنٹر' : 'Safe WhatsApp Send Counter'}
                </h4>
                <p className="text-[10.5px] text-slate-500">
                  {isRtl ? 'ہر گاہک کو 1-کلک سے بھیجیں تاکہ نمبر محفوظ رہے' : 'Click Send to open WhatsApp for each client'}
                </p>
              </div>

              <div className="text-right rtl:text-left">
                <span className="text-sm font-black text-[#075e54]">
                  {Object.keys(sentMap).length} / {selectedCustomers.length}
                </span>
                <span className="text-[10px] text-slate-500 block">{isRtl ? 'بھیجے گئے' : 'Sent'}</span>
              </div>
            </div>

            {/* Selected Queue List */}
            <div className="space-y-2">
              {selectedCustomers.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                  {isRtl ? 'کوئی گاہک منتخب نہیں کیا گیا، براہِ کرم پہلے مرحلے میں گاہک منتخب کریں۔' : 'No customers selected. Please select from step 1.'}
                </div>
              ) : (
                selectedCustomers.map((customer, index) => {
                  const isSent = !!sentMap[customer.id];
                  const avatarTheme = getAvatarColorByName(customer.name, customer.avatarColor);
                  const initial = getCustomerInitial(customer.name);

                  return (
                    <div
                      key={customer.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs ${
                        isSent
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : index === currentSendIndex
                          ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl ${
                            customer.imageUri ? 'bg-slate-100' : `${avatarTheme.gradientClass} ${avatarTheme.solidTextClass}`
                          } flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden select-none`}
                        >
                          {customer.imageUri ? (
                            <img src={customer.imageUri} alt={customer.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{initial}</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {customer.name}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-mono block" dir="ltr">
                            {customer.phone}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {isSent ? (
                          <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{isRtl ? 'بھیج دیا گیا' : 'Sent'}</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp(customer, index)}
                            className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-2xs cursor-pointer active:scale-95"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-white" />
                            <span>{isRtl ? 'واٹس ایپ پر بھیجیں' : 'Send on WhatsApp'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          {/* SMS Numbers Copy */}
          <button
            type="button"
            onClick={handleCopyPhoneNumbers}
            disabled={selectedCustomers.length === 0}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title={isRtl ? 'تمام منتخب فون نمبر کاپی کریں' : 'Copy All Phone Numbers'}
          >
            {copiedPhones ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedPhones ? (isRtl ? 'نمبرز کاپی ہو گئے!' : 'Copied!') : (isRtl ? 'نمبرز کاپی کریں (SMS)' : 'Copy Numbers (SMS)')}</span>
          </button>

          <div className="flex items-center gap-2">
            {activeStep === 'select' ? (
              <button
                type="button"
                onClick={() => setActiveStep('sendQueue')}
                disabled={selectedCustomers.length === 0}
                className="px-4 py-2 rounded-xl bg-[#075e54] hover:bg-[#064e46] active:scale-98 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <span>{isRtl ? 'اگلا مرحلہ: ارسال کریں' : 'Next: Start Sending'}</span>
                <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveStep('select')}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                {isRtl ? 'واپس' : 'Back'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-98 text-white font-bold text-xs transition-all cursor-pointer shadow-2xs"
            >
              {translations?.close || (isRtl ? 'بند کریں' : 'Close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkMessagingModal;
