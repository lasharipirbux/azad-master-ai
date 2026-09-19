import React, { useState, useEffect } from 'react';
import { Customer, CustomerMeasurements, OrderStatus } from '../types';
import { CountrySelectorModal } from './CountrySelectorModal';
import { getCountryByCode, allCountries } from '../data/countries';
import { getStatusMeta, ORDER_STATUS_LIST, ORDER_STATUSES } from '../utils/orderStatus';
import { 
  X, 
  Scissors, 
  Camera, 
  Image as ImageIcon, 
  Check, 
  Sparkles, 
  Trash2,
  Sliders,
  Ruler,
  Bot,
  Mic,
  CheckCircle2,
  ChevronDown,
  Globe,
  Clock,
  Wallet,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { parseMeasurementsFromText } from '../utils/measurementParser';
import { toInputDateFormat, toDisplayDateFormat, getOffsetDateString, getDeliveryStatus } from '../utils/deliveryDate';
import { compressImageForOcr } from '../utils/imageCompressor';

interface AddMeasurementModalProps {
  initialCustomer?: Customer | null;
  onSave: (customerData: Partial<Customer>) => void;
  onClose: () => void;
  onOpenAiAssistant?: () => void;
  translations: Record<string, string>;
  isRtl: boolean;
}

export const AddMeasurementModal: React.FC<AddMeasurementModalProps> = ({
  initialCustomer,
  onSave,
  onClose,
  onOpenAiAssistant,
  translations: t,
  isRtl,
}) => {
  // Parse phone if initial
  let initialCountry = '+92';
  let initialPhoneNumber = '';

  if (initialCustomer?.phone && initialCustomer.phone !== 'No phone number') {
    const raw = initialCustomer.phone.trim();
    if (raw.startsWith('+')) {
      const parts = raw.split(' ');
      if (parts.length > 1) {
        initialCountry = parts[0];
        initialPhoneNumber = parts.slice(1).join(' ');
      } else {
        const found = allCountries.find(c => raw.startsWith(c.code));
        if (found) {
          initialCountry = found.code;
          initialPhoneNumber = raw.slice(found.code.length).trim();
        } else {
          initialPhoneNumber = raw;
        }
      }
    } else {
      initialPhoneNumber = raw;
    }
  }

  const [name, setName] = useState(initialCustomer?.name || '');
  const [selectedCountryCode, setSelectedCountryCode] = useState(initialCountry);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [phone, setPhone] = useState(initialPhoneNumber);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(initialCustomer?.status || 'pending');
  const [isStatusLocked, setIsStatusLocked] = useState<boolean>(initialCustomer?.status === 'delivered');

  const handleStatusClick = (st: OrderStatus) => {
    if (isStatusLocked && st !== 'delivered') {
      const confirmUnlock = window.confirm(
        isRtl 
          ? "⚠️ یہ آرڈر مکمل (Delivered) ہو چکا ہے اور لاک ہے۔ کیا آپ واقعی اسے دوبارہ ان لاک کر کے اسٹیٹس تبدیل کرنا چاہتے ہیں؟"
          : "⚠️ This order is Marked as Delivered and Locked. Do you want to unlock and change status?"
      );
      if (!confirmUnlock) return;
      setIsStatusLocked(false);
    }
    
    setOrderStatus(st);
    if (st === 'delivered') {
      setIsStatusLocked(true);
    }
  };

  // Accounts & Billing
  const [totalAmount, setTotalAmount] = useState<string>(
    initialCustomer?.totalAmount !== undefined && initialCustomer?.totalAmount !== null
      ? String(initialCustomer.totalAmount)
      : ''
  );
  const [advanceAmount, setAdvanceAmount] = useState<string>(
    initialCustomer?.advanceAmount !== undefined && initialCustomer?.advanceAmount !== null
      ? String(initialCustomer.advanceAmount)
      : ''
  );

  // Delivery Date (تاریخ واپسی و ڈیلیوری)
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    if (initialCustomer?.deliveryDate) {
      return toInputDateFormat(initialCustomer.deliveryDate);
    }
    return getOffsetDateString(3); // Default to 3 days from now
  });

  // Measurements
  const m = initialCustomer?.measurementsObj;
  const [dressCategory, setDressCategory] = useState<string>('shalwar_qameez');
  const [isCuttingMode, setIsCuttingMode] = useState<boolean>(false);
  const [length, setLength] = useState(m?.length || '40');
  const [shoulder, setShoulder] = useState(m?.shoulder || '18');
  const [sleeves, setSleeves] = useState(m?.sleeves || '22');
  const [chest, setChest] = useState(m?.chest || '38');
  const [waist, setWaist] = useState(m?.waist || '36');
  const [daaman, setDaaman] = useState(m?.daaman || '26');
  const [collar, setCollar] = useState(m?.collar || '15.5');
  const [shalwar, setShalwar] = useState(m?.shalwar || '37');
  const [pancha, setPancha] = useState(m?.pancha || '8.5');
  const [pocket, setPocket] = useState(m?.pocket || '1 Front, 1 Side');
  const [specialNotes, setSpecialNotes] = useState(m?.specialNotes || '');

  const handleCategoryChange = (category: string) => {
    setDressCategory(category);
    if (category === 'shalwar_qameez') {
      setLength('40');
      setShoulder('18');
      setSleeves('22');
      setChest('38');
      setWaist('36');
      setDaaman('26');
      setCollar('15.5');
      setShalwar('37');
      setPancha('8.5');
    } else if (category === 'saudi_thobe') {
      setLength('56');
      setShoulder('19');
      setSleeves('24.5');
      setChest('42');
      setWaist('40');
      setDaaman('28');
      setCollar('16 (Thobe)');
      setShalwar('N/A');
      setPancha('N/A');
    } else if (category === 'kwadi_thobe') {
      setLength('55');
      setShoulder('18.5');
      setSleeves('24');
      setChest('41');
      setWaist('39');
      setDaaman('27');
      setCollar('15.5');
      setShalwar('N/A');
      setPancha('N/A');
    } else if (category === 'waist_coat') {
      setLength('27');
      setShoulder('17.5');
      setSleeves('N/A');
      setChest('39');
      setWaist('37');
      setDaaman('22');
      setCollar('16 (Ban)');
      setShalwar('N/A');
      setPancha('N/A');
    } else if (category === 'kurta') {
      setLength('41');
      setShoulder('18');
      setSleeves('23');
      setChest('39');
      setWaist('37');
      setDaaman('25');
      setCollar('15.5 (Ban)');
      setShalwar('38 (Pajama)');
      setPancha('7.5');
    } else if (category === 'coat_pant') {
      setLength('30');
      setShoulder('18.5');
      setSleeves('24');
      setChest('40');
      setWaist('34');
      setDaaman('N/A');
      setCollar('16');
      setShalwar('40 (Pant)');
      setPancha('15 (Bottom)');
    } else if (category === 'sherwani') {
      setLength('44');
      setShoulder('19');
      setSleeves('24.5');
      setChest('41');
      setWaist('38');
      setDaaman('26');
      setCollar('16 (Sherwani Ban)');
      setShalwar('39 (Churidar)');
      setPancha('6.5');
    } else if (category === 'jodhpuri') {
      setLength('31');
      setShoulder('18.5');
      setSleeves('24');
      setChest('40');
      setWaist('36');
      setDaaman('24');
      setCollar('16 (Bandhgala)');
      setShalwar('39 (Trouser)');
      setPancha('14');
    } else if (category === 'kurta_pajama') {
      setLength('40');
      setShoulder('18');
      setSleeves('22.5');
      setChest('38');
      setWaist('36');
      setDaaman('24');
      setCollar('15.5');
      setShalwar('38 (Pajama)');
      setPancha('7');
    } else if (category === 'pent_shirt') {
      setLength('30');
      setShoulder('18');
      setSleeves('23.5');
      setChest('39');
      setWaist('33');
      setDaaman('22');
      setCollar('15.5');
      setShalwar('39 (Pant)');
      setPancha('14.5');
    } else if (category === 'kids_suit') {
      setLength('28');
      setShoulder('13');
      setSleeves('16');
      setChest('28');
      setWaist('26');
      setDaaman('18');
      setCollar('12');
      setShalwar('26');
      setPancha('6');
    } else if (category === 'special_dress') {
      setLength('40');
      setShoulder('18');
      setSleeves('22');
      setChest('38');
      setWaist('36');
      setDaaman('26');
      setCollar('15.5');
      setShalwar('37');
      setPancha('8.5');
    }
  };

  const [imageUri, setImageUri] = useState<string | null>(initialCustomer?.imageUri || null);
  const [isOcrScanning, setIsOcrScanning] = useState(false);

  // Single Letter Avatar
  const avatarLetter = name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'P';

  useEffect(() => {
    (window as any).updateAvatarLetter = (newName: string) => {
      setName(newName);
    };
    (window as any).previewAvatar = (event: any) => {
      const file = event.target?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setImageUri(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    return () => {
      delete (window as any).updateAvatarLetter;
      delete (window as any).previewAvatar;
    };
  }, []);

  // Azad AI Voice & Text Naap Assistant state
  const [showAiVoiceBox, setShowAiVoiceBox] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [aiPreviewData, setAiPreviewData] = useState<Partial<CustomerMeasurements> | null>(null);

  const handleVoiceRecordAI = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = isRtl ? 'ur-PK' : 'en-US';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const combined = aiInputText ? `${aiInputText} ${transcript}` : transcript;
        setAiInputText(combined);
        const parsed = parseMeasurementsFromText(combined);
        if (parsed) setAiPreviewData(parsed);
      };
      recognition.start();
    } else {
      alert(isRtl ? "آپ کا براؤزر وائس ان پٹ کو سپورٹ نہیں کرتا۔" : "Your browser does not support voice input.");
    }
  };

  const handleParseAIText = (textToParse?: string) => {
    const text = textToParse || aiInputText;
    if (!text.trim()) return;
    const parsed = parseMeasurementsFromText(text);
    if (parsed && Object.keys(parsed).length > 0) {
      setAiPreviewData(parsed);
    } else {
      alert(isRtl 
        ? "کوئی ناپ نہیں پہچانی گئی۔ براہ کرم واضح بولیں یا لکھیں (مثلاً: لمبائی 42، تیرا 20، بازو 23، سینہ 38، گھیرا 25، کالر 15، شلوار 40، پانچہ 9)۔"
        : "No measurements detected. Please write clearly like: Length 42, Tira 20, Bazo 23, Chest 38, Gheera 25, Collar 15, Shalwar 40, Pancha 9.");
    }
  };

  const handleConfirmAIPreview = () => {
    if (!aiPreviewData) return;
    if (aiPreviewData.length) setLength(aiPreviewData.length);
    if (aiPreviewData.shoulder) setShoulder(aiPreviewData.shoulder);
    if (aiPreviewData.sleeves) setSleeves(aiPreviewData.sleeves);
    if (aiPreviewData.chest) setChest(aiPreviewData.chest);
    if (aiPreviewData.waist) setWaist(aiPreviewData.waist);
    if (aiPreviewData.daaman) setDaaman(aiPreviewData.daaman);
    if (aiPreviewData.collar) setCollar(aiPreviewData.collar);
    if (aiPreviewData.shalwar) setShalwar(aiPreviewData.shalwar);
    if (aiPreviewData.pancha) setPancha(aiPreviewData.pancha);
    setAiPreviewData(null);
    setShowAiVoiceBox(false);
  };

  const applyPreset = (preset: 'standard' | 'slim' | 'thobe') => {
    if (preset === 'standard') {
      setLength('42');
      setShoulder('18');
      setSleeves('23.5');
      setChest('38');
      setWaist('36');
      setDaaman('22');
      setCollar('15.5 (Ban)');
      setShalwar('38');
      setPancha('8.5 inch');
      setPocket('1 Front, 2 Side');
      setSpecialNotes('Standard gents cut, double stitch.');
    } else if (preset === 'slim') {
      setLength('40.5');
      setShoulder('17.5');
      setSleeves('23');
      setChest('36');
      setWaist('33');
      setDaaman('20.5');
      setCollar('15 (Shirt Collar)');
      setShalwar('37');
      setPancha('7.5 inch');
      setPocket('1 Front, 1 Side');
      setSpecialNotes('Slim fit cut with straight daaman.');
    } else if (preset === 'thobe') {
      setLength('56');
      setShoulder('19');
      setSleeves('24.5');
      setChest('42');
      setWaist('40');
      setDaaman('28');
      setCollar('16 (Thobe Collar)');
      setShalwar('N/A');
      setPancha('N/A');
      setPocket('1 Front, 2 Deep Pockets');
      setSpecialNotes('Arabian Jubbah / Thobe cut with stiff collar.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("تصویر منتخب ہو گئی:", file.name);
      try {
        setIsOcrScanning(true);
        // Fast client-side image compression: prevents mobile lag and memory freeze
        const compressedBase64 = await compressImageForOcr(file, 1200, 1600, 0.75);
        setImageUri(compressedBase64);

        // Run automatic OCR extraction in background to auto-suggest measurements
        try {
          const res = await fetch('/api/ocr-slip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: compressedBase64, mimeType: 'image/jpeg' })
          });
          const ocrData = await res.json();
          if (ocrData.success && ocrData.measurements) {
            const m = ocrData.measurements;
            if (m.length && !length) setLength(m.length);
            if (m.shoulder && !shoulder) setShoulder(m.shoulder);
            if (m.sleeves && !sleeves) setSleeves(m.sleeves);
            if (m.chest && !chest) setChest(m.chest);
            if (m.waist && !waist) setWaist(m.waist);
            if (m.daaman && !daaman) setDaaman(m.daaman);
            if (m.collar && !collar) setCollar(m.collar);
            if (m.shalwar && !shalwar) setShalwar(m.shalwar);
            if (m.pancha && !pancha) setPancha(m.pancha);
          }
        } catch (err) {
          console.warn("Auto-OCR background check:", err);
        }
      } catch (err) {
        console.error("Image compression error:", err);
      } finally {
        setIsOcrScanning(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(isRtl ? 'براہ کرم گاہک کا نام درج کریں۔' : 'Please enter customer name.');
      return;
    }

    const fullPhoneNumber = phone.trim() 
      ? `${selectedCountryCode} ${phone.trim()}` 
      : 'No phone number';

    const cleanDetails = [
      length ? `Length (لمبائی) : ${length}` : '',
      shoulder ? `Shoulder (تیرا) : ${shoulder}` : '',
      sleeves ? `Sleeve (بازو) : ${sleeves}` : '',
      chest ? `Chest (چھاتی) : ${chest}` : '',
      waist ? `Waist (کمر) : ${waist}` : '',
      daaman ? `Daaman (دامان) : ${daaman}` : '',
      collar ? `Collar/Ban (کالر/بین) : ${collar}` : '',
      shalwar ? `Shalwar (شلوار) : ${shalwar}` : '',
      pancha ? `Pancha (پائچہ) : ${pancha}` : '',
      pocket ? `Pocket (پکٹ) : ${pocket}` : '',
      specialNotes ? `Notes (ہدایات) : ${specialNotes}` : ''
    ].filter(Boolean).join('\n');

    const measurementsObj: CustomerMeasurements = {
      length,
      shoulder,
      sleeves,
      chest,
      waist,
      daaman,
      collar,
      shalwar,
      pancha,
      pocket,
      specialNotes
    };

    const totalNum = parseFloat(totalAmount) || 0;
    const advanceNum = parseFloat(advanceAmount) || 0;
    const balanceNum = Math.max(0, totalNum - advanceNum);

    onSave({
      ...(initialCustomer?.id ? { id: initialCustomer.id } : {}),
      name: name.trim(),
      phone: fullPhoneNumber,
      details: cleanDetails || 'No measurements recorded',
      measurementsObj,
      imageUri,
      status: orderStatus,
      totalAmount: totalAmount.trim(),
      advanceAmount: advanceAmount.trim(),
      balanceAmount: totalAmount.trim() ? String(balanceNum) : '',
      date: initialCustomer?.date || new Date().toLocaleDateString('en-GB'),
      deliveryDate: deliveryDate ? toDisplayDateFormat(deliveryDate) : ''
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[#062c1d]/85 backdrop-blur-xs transition-opacity"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div 
        id="add-measurement-modal"
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-emerald-900/10 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Green Header */}
        <div className="bg-[#0d4a2a] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md border-b border-emerald-900/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer text-base shrink-0 active:scale-95"
              title={t.back}
            >
              ☰
            </button>
            <div className="flex flex-col min-w-0">
              <h1 className="font-black text-sm sm:text-base tracking-wider text-white uppercase leading-tight truncate">
                AZAD MASTER
              </h1>
              <span className="text-[10px] text-emerald-200/90 font-medium leading-none">
                {isRtl ? 'کسٹمر ناپ و سلپ فارم' : 'Customer Slip Form'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Cutting Mode Toggle Button */}
            <button 
              type="button"
              onClick={() => setIsCuttingMode(!isCuttingMode)} 
              id="cuttingModeBtn" 
              className={`h-8 px-3 rounded-xl font-bold text-xs border flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs ${
                isCuttingMode 
                  ? 'bg-amber-500 hover:bg-amber-600 border-amber-400 text-white ring-2 ring-amber-300/50' 
                  : 'bg-white/15 hover:bg-white/25 border-white/20 text-white'
              }`}
            >
              <span className="text-xs">{isCuttingMode ? '📝' : '✂️'}</span>
              <span className="whitespace-nowrap">
                {isCuttingMode ? (isRtl ? 'نارمل موڈ' : 'Normal') : (isRtl ? 'کٹنگ موڈ' : 'Cutting Mode')}
              </span>
            </button>

            {/* Clean, well-spaced Close Button (Redundant AM badge removed) */}
            <button 
              id="close-add-modal-btn"
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/15 hover:bg-rose-600/90 flex items-center justify-center text-white transition-all cursor-pointer text-sm font-bold active:scale-95 border border-white/15 shadow-2xs"
              title={isRtl ? 'بند کریں' : 'Close'}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Main Content Area */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-3 flex flex-col justify-between space-y-2 bg-slate-50/60">
          
          {/* Azad Master - Customer Single Letter Avatar Section */}
          <div className="bg-white p-3.5 rounded-xl shadow-xs border border-gray-100 mb-1 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-700">
                {isRtl ? 'کسٹمر کی تصویر یا نام کا پہلا حرف' : 'Customer Photo or Initial Letter'}
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAiAssistant) {
                      onOpenAiAssistant();
                    } else {
                      setShowAiVoiceBox(!showAiVoiceBox);
                    }
                  }}
                  className="text-[10.5px] bg-[#075e54] hover:bg-[#054c44] text-white px-2.5 py-1 rounded-lg font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-2xs border border-[#128c7e]/40"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#25d366]" />
                  <span>{isRtl ? 'اسسٹنٹ' : 'Assistant'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAiVoiceBox(!showAiVoiceBox)}
                  className="text-[10px] bg-[#075e54] hover:bg-[#054c44] text-[#dcf8c6] px-2 py-1 rounded-lg cursor-pointer transition-colors border border-[#128c7e]/30 flex items-center gap-1"
                  title="Voice / Text"
                >
                  <Mic className="w-3 h-3 text-[#25d366]" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3.5">
              {/* Avatar Preview / Letter Box */}
              <div 
                id="avatarContainer" 
                className="relative w-16 h-16 rounded-full overflow-hidden bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-700 font-bold text-xl shadow-inner shrink-0"
              >
                {/* تصویر کے لیے */}
                <img 
                  id="avatarPreview" 
                  src={imageUri || ''} 
                  alt="Avatar" 
                  className={`w-full h-full object-cover ${imageUri ? '' : 'hidden'}`} 
                />
                {/* نام کے پہلے حرف کے لیے (مثلاً P یا پ) */}
                <span id="avatarLetter" className={imageUri ? 'hidden' : ''}>
                  {avatarLetter}
                </span>

                {imageUri && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageUri(null);
                    }}
                    title={isRtl ? "تصویر ہٹائیں" : "Remove photo"}
                    className="absolute inset-0 bg-[#062c1d]/60 text-white opacity-0 hover:opacity-100 flex items-center justify-center text-[10px] font-bold transition-opacity cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Upload Buttons & Name Input */}
              <div className="flex-1 space-y-1.5">
                {/* کسٹمر کے نام کا ان پٹ، جس میں نام لکھنے پر پہلا حرف خود بخود آ جائے گا */}
                <input 
                  type="text" 
                  id="customerNameInput" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isRtl ? "کسٹمر کا نام لکھیں" : "Customer name"} 
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
                  required
                />

                {/* فون نمبر مع کنٹری کوڈ */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    id="add-customer-country-btn"
                    onClick={() => setShowCountryModal(true)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-emerald-800 font-bold px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>{getCountryByCode(selectedCountryCode).flag}</span>
                    <span dir="ltr">{selectedCountryCode}</span>
                  </button>
                  <input 
                    id="input-phone-number"
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="03002073445" 
                    className="flex-1 text-[11px] text-slate-800 font-mono font-semibold bg-white px-2 py-1 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left rtl:text-right"
                    dir="ltr"
                  />
                </div>

                <input 
                  type="file" 
                  id="customerPhotoInput" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={handleImageUpload} 
                />
                
                <div className="flex items-center gap-1.5">
                  <button 
                    type="button" 
                    id="btn-customer-photo-upload"
                    onClick={() => document.getElementById('customerPhotoInput')?.click()} 
                    className="glow-button glow-indigo flex-1 py-1.5 px-3 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 transition border border-indigo-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span>📸</span>
                    <span>{isRtl ? 'فوٹو لیں یا گیلری سے لگائیں' : 'Take Photo or Choose Gallery'}</span>
                  </button>

                  {imageUri && (
                    <button
                      type="button"
                      onClick={() => setImageUri(null)}
                      className="text-red-600 hover:text-red-700 text-[11px] font-bold px-2 py-1 hover:bg-red-50 rounded-lg border border-red-200 transition-colors shrink-0 cursor-pointer"
                    >
                      {isRtl ? 'حذف' : 'Remove'}
                    </button>
                  )}
                </div>

                {isOcrScanning && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold animate-pulse">
                    <span className="text-sm">⚡</span>
                    <span>{isRtl ? 'پرچے سے ناپ پڑھی جا رہی ہے، چند سیکنڈ انتظار فرمائیں...' : 'Reading measurements from receipt, please wait...'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expanded AI Voice / Text Panel */}
          {showAiVoiceBox && (
            <div className="bg-emerald-950 text-white p-3 rounded-xl border border-emerald-700/80 space-y-2 animate-in fade-in duration-150 shrink-0">
              <p className="text-[11px] text-emerald-100 leading-tight">
                {isRtl 
                  ? 'ایک جملے میں تمام ناپیں بولیں یا لکھیں، مثلاً: "لمبائی 40، تیرا 18، بازو 22، چھاتی 38، کمر 36، گھیر 26، کالر 15.5، شلوار 37، پانچا 8.5"'
                  : 'Speak or type all measurements (e.g. "Length 40, Shoulder 18, Sleeve 22, Chest 38, Waist 36, Daaman 26, Collar 15.5, Shalwar 37, Pancha 8.5")'}
              </p>

              <div className="flex items-center gap-1.5" dir="ltr">
                <button
                  type="button"
                  onClick={handleVoiceRecordAI}
                  className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
                  title="Voice Input"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={aiInputText}
                  onChange={(e) => setAiInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleParseAIText())}
                  placeholder={isRtl ? "لمبائی 40، تیرا 18، بازو 22..." : "Length 40, Shoulder 18..."}
                  className="flex-1 px-2.5 py-1 rounded-lg bg-emerald-900 border border-emerald-700 text-xs text-white placeholder-emerald-300/60 outline-none focus:ring-1 focus:ring-emerald-400"
                  dir={isRtl ? 'rtl' : 'ltr'}
                />
                <button
                  type="button"
                  onClick={() => handleParseAIText()}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
                >
                  {isRtl ? 'چیک کریں' : 'Parse'}
                </button>
              </div>

              {/* AI Measurement Preview with Confirmation */}
              {aiPreviewData && Object.keys(aiPreviewData).length > 0 && (
                <div className="bg-white text-slate-900 rounded-xl p-2.5 space-y-2 border border-emerald-300 shadow-md animate-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <span className="font-bold text-emerald-900 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      {isRtl ? 'ناپ کا مکمل جائزہ (Preview)' : 'Measurement Preview'}
                    </span>
                    <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                      {isRtl ? 'تصدیق درکار ہے' : 'Confirmation Needed'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    {aiPreviewData.length && (
                      <div className="bg-slate-50 p-1 rounded border border-slate-200 flex justify-between">
                        <span className="text-slate-500">لمبائی:</span>
                        <span className="font-bold text-slate-900">{aiPreviewData.length}</span>
                      </div>
                    )}
                    {aiPreviewData.shoulder && (
                      <div className="bg-slate-50 p-1 rounded border border-slate-200 flex justify-between">
                        <span className="text-slate-500">تیرہ:</span>
                        <span className="font-bold text-slate-900">{aiPreviewData.shoulder}</span>
                      </div>
                    )}
                    {aiPreviewData.sleeves && (
                      <div className="bg-slate-50 p-1 rounded border border-slate-200 flex justify-between">
                        <span className="text-slate-500">بازو:</span>
                        <span className="font-bold text-slate-900">{aiPreviewData.sleeves}</span>
                      </div>
                    )}
                    {aiPreviewData.chest && (
                      <div className="bg-slate-50 p-1 rounded border border-slate-200 flex justify-between">
                        <span className="text-slate-500">چھاتی:</span>
                        <span className="font-bold text-slate-900">{aiPreviewData.chest}</span>
                      </div>
                    )}
                    {aiPreviewData.waist && (
                      <div className="bg-slate-50 p-1 rounded border border-slate-200 flex justify-between">
                        <span className="text-slate-500">کمر:</span>
                        <span className="font-bold text-slate-900">{aiPreviewData.waist}</span>
                      </div>
                    )}
                    {aiPreviewData.daaman && (
                      <div className="bg-slate-50 p-1 rounded border border-slate-200 flex justify-between">
                        <span className="text-slate-500">گھیر:</span>
                        <span className="font-bold text-slate-900">{aiPreviewData.daaman}</span>
                      </div>
                    )}
                    {aiPreviewData.collar && (
                      <div className="bg-slate-50 p-1 rounded border border-slate-200 flex justify-between">
                        <span className="text-slate-500">کالر:</span>
                        <span className="font-bold text-slate-900">{aiPreviewData.collar}</span>
                      </div>
                    )}
                    {aiPreviewData.shalwar && (
                      <div className="bg-slate-50 p-1 rounded border border-slate-200 flex justify-between">
                        <span className="text-slate-500">شلوار:</span>
                        <span className="font-bold text-slate-900">{aiPreviewData.shalwar}</span>
                      </div>
                    )}
                    {aiPreviewData.pancha && (
                      <div className="bg-slate-50 p-1 rounded border border-slate-200 flex justify-between">
                        <span className="text-slate-500">پانچا:</span>
                        <span className="font-bold text-slate-900">{aiPreviewData.pancha}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={handleConfirmAIPreview}
                      className="flex-1 py-1 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isRtl ? 'تصدیق کریں' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiPreviewData(null)}
                      className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      {isRtl ? 'منسوخ' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Measurement Slip Box (Compact Fit) */}
          <div className="border border-emerald-200 rounded-xl p-2.5 bg-emerald-50/20 flex flex-col justify-between flex-1 space-y-2">
            
            <div className="flex justify-between items-center border-b border-emerald-100 pb-1 mb-1 shrink-0">
              <span className="text-[11px] font-bold text-emerald-800">
                📏 Measurement Slip (Inches)
              </span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                Inch
              </span>
            </div>

            {/* Compact Garment Category Dropdown */}
            <div className="bg-white p-1.5 rounded-lg border border-emerald-200 shrink-0">
              <select 
                id="dressCategory" 
                value={dressCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-2 py-1 rounded bg-slate-50 text-slate-800 text-[11px] font-bold outline-none cursor-pointer"
              >
                <option value="shalwar_qameez">Shalwar Qameez (سلوار قمیض)</option>
                <option value="saudi_thobe">Saudi Thobe (سعودی تووب)</option>
                <option value="kurta">Kurta (کرتا)</option>
                <option value="coat_pant">Coat Pant (کوٹ پینٹ)</option>
                <option value="kwadi_thobe">Kuwaiti Thobe (کویتی تووب)</option>
                <option value="waist_coat">Waist Coat (ویسٹ کوٹ)</option>
                <option value="sherwani">Sherwani (شیروانی)</option>
                <option value="jodhpuri">Jodhpuri Suit (جودھپوری سوٹ)</option>
                <option value="kurta_pajama">Kurta Pajama (کرتا پاجامہ)</option>
                <option value="pent_shirt">Pant Shirt (پینٹ شرٹ)</option>
                <option value="kids_suit">Kids Suit (بچوں کا سوٹ)</option>
                <option value="special_dress">Special Custom Dress (اسپیشل ڈریس)</option>
              </select>
            </div>

            {/* 9 Measurement Rows (Strictly Fitted & responsive to Cutting Mode) */}
            <div id="measurementList" className="grid grid-cols-1 gap-1.5 text-xs flex-1">
              
              {/* 1. Length */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  Length (لمبائی)
                </span>
                <input 
                  type="text" 
                  value={length} 
                  onChange={(e) => setLength(e.target.value)}
                  className={`measurement-input w-20 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                    isCuttingMode 
                      ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                />
              </div>

              {/* 2. Shoulder */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  Shoulder (تیرہ)
                </span>
                <input 
                  type="text" 
                  value={shoulder} 
                  onChange={(e) => setShoulder(e.target.value)}
                  className={`measurement-input w-20 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                    isCuttingMode 
                      ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                />
              </div>

              {/* 3. Sleeve */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  Sleeve (بازو)
                </span>
                <input 
                  type="text" 
                  value={sleeves} 
                  onChange={(e) => setSleeves(e.target.value)}
                  className={`measurement-input w-20 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                    isCuttingMode 
                      ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                />
              </div>

              {/* 4. Chest */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  Chest (چھاتی)
                </span>
                <input 
                  type="text" 
                  value={chest} 
                  onChange={(e) => setChest(e.target.value)}
                  className={`measurement-input w-20 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                    isCuttingMode 
                      ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                />
              </div>

              {/* 5. Waist */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  Waist (کمر)
                </span>
                <input 
                  type="text" 
                  value={waist} 
                  onChange={(e) => setWaist(e.target.value)}
                  className={`measurement-input w-20 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                    isCuttingMode 
                      ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                />
              </div>

              {/* 6. Daaman */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  Daaman (گھیر)
                </span>
                <input 
                  type="text" 
                  value={daaman} 
                  onChange={(e) => setDaaman(e.target.value)}
                  className={`measurement-input w-20 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                    isCuttingMode 
                      ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                />
              </div>

              {/* 7. Collar / Ban */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  Collar / Ban (کالر/بین)
                </span>
                <input 
                  type="text" 
                  value={collar} 
                  onChange={(e) => setCollar(e.target.value)}
                  className={`measurement-input w-20 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                    isCuttingMode 
                      ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                />
              </div>

              {/* 8. Shalwar */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  Shalwar (شلوار)
                </span>
                <input 
                  type="text" 
                  value={shalwar} 
                  onChange={(e) => setShalwar(e.target.value)}
                  className={`measurement-input w-20 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                    isCuttingMode 
                      ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                />
              </div>

              {/* 9. Pancha */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  Pancha (پانچا)
                </span>
                <input 
                  type="text" 
                  value={pancha} 
                  onChange={(e) => setPancha(e.target.value)}
                  className={`measurement-input w-20 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                    isCuttingMode 
                      ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                />
              </div>

            </div>

            {/* Optional Notes & Pocket Mini Bar */}
            <div className="pt-1.5 border-t border-emerald-200/60 grid grid-cols-2 gap-1.5 shrink-0">
              <input 
                type="text" 
                value={pocket} 
                onChange={(e) => setPocket(e.target.value)} 
                placeholder="پکٹ / جیب..."
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-700 outline-none"
              />
              <input 
                type="text" 
                value={specialNotes} 
                onChange={(e) => setSpecialNotes(e.target.value)} 
                placeholder="خصوصی ہدایات..."
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-700 outline-none"
              />
            </div>

          </div>

          {/* Photo & Action Buttons Bottom Bar */}
          <div className="pt-1 space-y-2 shrink-0">
            {/* Accounts & Advance Section (اجرت، ایڈوانس اور بقایا) */}
            <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/60 p-2.5 rounded-xl border border-emerald-300/80 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950">
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{isRtl ? 'سلائی کھاتہ و اجرت (Tailoring Bill & Advance):' : 'Tailoring Bill & Payment:'}</span>
                </span>
                {totalAmount ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    (parseFloat(totalAmount) || 0) > 0 && Math.max(0, (parseFloat(totalAmount) || 0) - (parseFloat(advanceAmount) || 0)) === 0 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {(parseFloat(totalAmount) || 0) > 0 && Math.max(0, (parseFloat(totalAmount) || 0) - (parseFloat(advanceAmount) || 0)) === 0 
                      ? (isRtl ? '✓ مکمل وصول (Paid)' : '✓ Full Paid') 
                      : `${isRtl ? 'بقایا واجب الادا' : 'Balance'}: Rs. ${Math.max(0, (parseFloat(totalAmount) || 0) - (parseFloat(advanceAmount) || 0))}`}
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Total Stitching Charge */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                    {isRtl ? 'کل اجرت (Rs):' : 'Total (Rs):'}
                  </label>
                  <input 
                    id="modal-total-amount-input"
                    type="number"
                    min="0"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="مثلاً 1500"
                    className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                {/* Advance Paid */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                    {isRtl ? 'پیشگی / ایڈوانس:' : 'Advance (Rs):'}
                  </label>
                  <input 
                    id="modal-advance-amount-input"
                    type="number"
                    min="0"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    placeholder="مثلاً 500"
                    className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                {/* Balance (Auto calculated) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                    {isRtl ? 'بقایا رقم (Balance):' : 'Balance (Rs):'}
                  </label>
                  <div className={`w-full px-2 py-1.5 rounded-lg text-xs font-extrabold flex items-center justify-between border shadow-2xs ${
                    (parseFloat(totalAmount) || 0) > 0 && Math.max(0, (parseFloat(totalAmount) || 0) - (parseFloat(advanceAmount) || 0)) === 0
                      ? 'bg-emerald-100/90 border-emerald-400 text-emerald-800'
                      : (parseFloat(totalAmount) || 0) > 0
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    <span className="text-[10px]">Rs.</span>
                    <span>{totalAmount ? Math.max(0, (parseFloat(totalAmount) || 0) - (parseFloat(advanceAmount) || 0)) : '0'}</span>
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              {(parseFloat(totalAmount) || 0) > 0 && (
                <div className="flex items-center gap-1.5 pt-0.5 border-t border-emerald-200/50">
                  <span className="text-[9px] text-slate-500 font-bold">{isRtl ? 'فوری بٹن:' : 'Quick:'}</span>
                  <button
                    type="button"
                    onClick={() => setAdvanceAmount(totalAmount)}
                    className="text-[9.5px] px-2 py-0.5 bg-white hover:bg-emerald-100 text-emerald-800 font-bold rounded-md border border-emerald-300 transition-colors cursor-pointer"
                  >
                    {isRtl ? '✓ پورا ادا (Full)' : 'Full'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvanceAmount(String(Math.round((parseFloat(totalAmount) || 0) / 2)))}
                    className="text-[9.5px] px-2 py-0.5 bg-white hover:bg-emerald-100 text-emerald-800 font-bold rounded-md border border-emerald-300 transition-colors cursor-pointer"
                  >
                    {isRtl ? '50% پیشگی' : '50%'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvanceAmount('0')}
                    className="text-[9.5px] px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-600 font-bold rounded-md border border-slate-200 transition-colors cursor-pointer"
                  >
                    {isRtl ? '0 ایڈوانس' : '0 Advance'}
                  </button>
                </div>
              )}
            </div>

            {/* Order Status Selector with Delivered Lock Protection */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isRtl ? 'آرڈر کی حالت (Order Status):' : 'Order Status:'}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {orderStatus === 'delivered' ? (
                    <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 flex items-center gap-1">
                      <span>🔒</span>
                      <span>{isRtl ? 'پکا / لاک شدہ' : 'Locked'}</span>
                    </span>
                  ) : (
                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                      <span>🔓</span>
                      <span>{isRtl ? 'تبدیل ہو سکتا ہے' : 'Unlocked'}</span>
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusMeta(orderStatus).badgeClass}`}>
                    {getStatusMeta(orderStatus).icon} {isRtl ? getStatusMeta(orderStatus).shortUrdu : getStatusMeta(orderStatus).labelEn}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {ORDER_STATUS_LIST.map((st) => {
                  const meta = ORDER_STATUSES[st];
                  const isSelected = orderStatus === st;
                  return (
                    <button
                      key={st}
                      id={`modal-order-status-${st}`}
                      type="button"
                      onClick={() => handleStatusClick(st)}
                      className={`py-1.5 px-1 rounded-lg text-[9.5px] font-bold flex flex-col items-center justify-center gap-0.5 border transition-all cursor-pointer ${
                        isSelected 
                          ? `${meta.badgeClass} ring-2 ring-emerald-600 font-extrabold shadow-2xs` 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-[11px] leading-none">{meta.icon}</span>
                      <span className="truncate w-full text-center">{isRtl ? meta.shortUrdu : meta.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Delivery Date (تاریخ واپسی و ڈیلیوری) */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{isRtl ? 'تاریخ واپسی / ڈیلیوری (Delivery Date):' : 'Delivery Date:'}</span>
                </span>
                {deliveryDate && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    getDeliveryStatus(deliveryDate, orderStatus) === 'late'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : getDeliveryStatus(deliveryDate, orderStatus) === 'today'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}>
                    {getDeliveryStatus(deliveryDate, orderStatus) === 'late' && '⚠️ تاخیر شدہ'}
                    {getDeliveryStatus(deliveryDate, orderStatus) === 'today' && '⚡ آج کی ڈیلیوری'}
                    {getDeliveryStatus(deliveryDate, orderStatus) === 'upcoming' && '📅 مقررہ وقت'}
                    {getDeliveryStatus(deliveryDate, orderStatus) === 'delivered' && '✅ مکمل تحویل'}
                  </span>
                )}
              </div>

              {/* Date Input */}
              <div className="flex items-center gap-2">
                <input 
                  id="modal-delivery-date-input"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer"
                />
              </div>

              {/* Quick delivery presets */}
              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                <span className="text-[9px] text-slate-500 font-bold">{isRtl ? 'فوری تاریخ:' : 'Presets:'}</span>
                <button
                  type="button"
                  onClick={() => setDeliveryDate(getOffsetDateString(0))}
                  className={`text-[9.5px] px-2 py-0.5 rounded-md border font-bold transition-all cursor-pointer ${
                    deliveryDate === getOffsetDateString(0)
                      ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  ⚡ {isRtl ? 'آج (Today)' : 'Today'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryDate(getOffsetDateString(1))}
                  className={`text-[9.5px] px-2 py-0.5 rounded-md border font-bold transition-all cursor-pointer ${
                    deliveryDate === getOffsetDateString(1)
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isRtl ? 'کل (Tomorrow)' : 'Tomorrow'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryDate(getOffsetDateString(3))}
                  className={`text-[9.5px] px-2 py-0.5 rounded-md border font-bold transition-all cursor-pointer ${
                    deliveryDate === getOffsetDateString(3)
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isRtl ? '۳ دن' : '3 Days'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryDate(getOffsetDateString(7))}
                  className={`text-[9.5px] px-2 py-0.5 rounded-md border font-bold transition-all cursor-pointer ${
                    deliveryDate === getOffsetDateString(7)
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isRtl ? '۱ ہفتہ' : '1 Week'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryDate(getOffsetDateString(10))}
                  className={`text-[9.5px] px-2 py-0.5 rounded-md border font-bold transition-all cursor-pointer ${
                    deliveryDate === getOffsetDateString(10)
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isRtl ? '۱۰ دن' : '10 Days'}
                </button>
              </div>
            </div>

            {/* Photo Attachment Bar */}
            <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                {imageUri ? '✓ فوٹو منسلک ہے' : 'پرچہ / کپڑا فوٹو'}
              </span>
              <div className="flex gap-1.5">
                <label className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-[10px] font-bold border border-emerald-200 cursor-pointer transition-colors">
                  <span>گیلری</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <label className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-[10px] font-bold border border-emerald-200 cursor-pointer transition-colors">
                  <span>کیمرہ</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                </label>
                {imageUri && (
                  <button
                    type="button"
                    onClick={() => setImageUri(null)}
                    className="text-red-600 text-[10px] font-bold px-1.5 py-1 hover:bg-red-50 rounded"
                  >
                    حذف
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button 
                id="save-measurement-btn"
                type="submit" 
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white py-2 px-3 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer text-center"
              >
                {t.saveDone}
              </button>
              <button 
                type="button" 
                onClick={onClose} 
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 px-3 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </form>

        {/* Searchable International Country Selector Modal */}
        <CountrySelectorModal
          isOpen={showCountryModal}
          onClose={() => setShowCountryModal(false)}
          selectedCode={selectedCountryCode}
          onSelect={(c) => {
            setSelectedCountryCode(c.code);
          }}
          isRtl={isRtl}
        />
      </div>
    </div>
  );
};
