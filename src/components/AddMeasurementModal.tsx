import React, { useState, useEffect, useRef } from 'react';
import { Customer, CustomerMeasurements, OrderStatus } from '../types';
import { CountrySelectorModal } from './CountrySelectorModal';
import { getCountryByCode, allCountries } from '../data/countries';
import { getStatusMeta, ORDER_STATUS_LIST, ORDER_STATUSES } from '../utils/orderStatus';
import { getAvatarColorByName, getCustomerInitial, AVATAR_PALETTES } from '../utils/avatarColors';
import { 
  X, 
  Scissors, 
  Camera, 
  Image as ImageIcon, 
  Check, 
  Sparkles, 
  Trash2,
  Plus,
  Sliders,
  Ruler,
  Bot,
  Mic,
  Square,
  CheckCircle2,
  ChevronDown,
  Globe,
  Clock,
  Wallet,
  Calendar,
  AlertCircle,
  Palette
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
        t.orderLockedNotice || (isRtl 
          ? "⚠️ یہ آرڈر مکمل (Delivered) ہو چکا ہے اور لاک ہے۔ کیا آپ واقعی اسے دوبارہ ان لاک کر کے اسٹیٹس تبدیل کرنا چاہتے ہیں؟"
          : "⚠️ This order is Marked as Delivered and Locked. Do you want to unlock and change status?")
      );
      if (!confirmUnlock) return;
      setIsStatusLocked(false);
    }
    
    setOrderStatus(st);
    if (st === 'delivered') {
      setIsStatusLocked(true);
    }
  };

  const getStatusLabel = (st: OrderStatus): string => {
    if (st === 'pending') return t.statusPending || 'Pending';
    if (st === 'cutting') return t.statusCutting || 'Cutting';
    if (st === 'stitching') return t.statusStitching || 'Stitching';
    if (st === 'ready') return t.statusReady || 'Ready';
    if (st === 'delivered') return t.statusDelivered || 'Delivered';
    return st;
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
  const [specialNotes, setSpecialNotes] = useState(initialCustomer?.notes || m?.specialNotes || '');

  // Custom Measurement Fields for flexible tailoring
  const [customFields, setCustomFields] = useState<Array<{ id: string; name: string; value: string }>>(
    m?.customFields || []
  );
  const [newCustomFieldName, setNewCustomFieldName] = useState<string>('');
  const [showAddCustomInput, setShowAddCustomInput] = useState<boolean>(false);

  const handleAddCustomField = (fieldName: string) => {
    const trimmed = fieldName.trim();
    if (!trimmed) return;
    const exists = customFields.some(f => f.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setShowAddCustomInput(false);
      setNewCustomFieldName('');
      return;
    }
    setCustomFields(prev => [
      ...prev,
      {
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: trimmed,
        value: ''
      }
    ]);
    setNewCustomFieldName('');
    setShowAddCustomInput(false);
  };

  const handleUpdateCustomField = (id: string, value: string) => {
    setCustomFields(prev => prev.map(f => f.id === id ? { ...f, value } : f));
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
  };

  const handleCategoryChange = (category: string) => {
    setDressCategory(category);
    if (category === 'shalwar_qameez' || category === 'kameez_shalwar') {
      setLength('40');
      setShoulder('18');
      setSleeves('22');
      setChest('38');
      setWaist('36');
      setDaaman('26');
      setCollar('15.5');
      setShalwar('37');
      setPancha('8.5');
    } else if (category === 'kameez_only') {
      setLength('40');
      setShoulder('18');
      setSleeves('22');
      setChest('38');
      setWaist('36');
      setDaaman('26');
      setCollar('15.5');
      setShalwar('N/A');
      setPancha('N/A');
    } else if (category === 'shalwar_only') {
      setLength('N/A');
      setShoulder('N/A');
      setSleeves('N/A');
      setChest('N/A');
      setWaist('36');
      setDaaman('N/A');
      setCollar('N/A');
      setShalwar('38');
      setPancha('8.5');
    } else if (category === 'pant' || category === 'pant_only') {
      setLength('39 (Pant)');
      setShoulder('N/A');
      setSleeves('N/A');
      setChest('N/A');
      setWaist('34 (Waist)');
      setDaaman('N/A');
      setCollar('N/A');
      setShalwar('39');
      setPancha('14.5 (Bottom)');
    } else if (category === 'coat' || category === 'coat_only') {
      setLength('29.5 (Coat)');
      setShoulder('18.5');
      setSleeves('24');
      setChest('40');
      setWaist('36');
      setDaaman('N/A');
      setCollar('16 (Neck)');
      setShalwar('N/A');
      setPancha('N/A');
    } else if (category === 'coat_pant') {
      setLength('30 (Coat)');
      setShoulder('18.5');
      setSleeves('24');
      setChest('40');
      setWaist('34 (Pant Waist)');
      setDaaman('N/A');
      setCollar('16 (Collar)');
      setShalwar('40 (Pant)');
      setPancha('15 (Bottom)');
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
  const [avatarColor, setAvatarColor] = useState<string>(initialCustomer?.avatarColor || '');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);

  // Dynamic Avatar Theme & Letter
  const activeAvatarTheme = getAvatarColorByName(name, avatarColor);
  const avatarLetter = getCustomerInitial(name);

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

    const customDetails = customFields
      .filter(f => f.name.trim() && f.value.trim())
      .map(f => `${f.name} : ${f.value}`);

    const cleanDetails = [
      length ? `Length (لمبائی) : ${length}` : '',
      shoulder ? `Shoulder (تیرہ) : ${shoulder}` : '',
      sleeves ? `Sleeve (بازو) : ${sleeves}` : '',
      chest ? `Chest (چھاتی) : ${chest}` : '',
      waist ? `Waist (کمر) : ${waist}` : '',
      daaman ? `Daaman (دامن) : ${daaman}` : '',
      collar ? `Neck/Collar/Ban (گلا/کالر/بین) : ${collar}` : '',
      shalwar ? `Shalwar/Pant (شلوار/پینٹ) : ${shalwar}` : '',
      pancha ? `Pancha/Bottom (پائچہ/موہری) : ${pancha}` : '',
      pocket ? `Pocket (پکٹ) : ${pocket}` : '',
      ...customDetails,
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
      specialNotes,
      customFields
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
      notes: specialNotes.trim(),
      date: initialCustomer?.date || new Date().toLocaleDateString('en-GB'),
      deliveryDate: deliveryDate ? toDisplayDateFormat(deliveryDate) : '',
      avatarColor: avatarColor.trim() ? avatarColor.trim() : undefined
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
                {t.customerDetailsHeading || (isRtl ? 'کسٹمر ناپ و سلپ فارم' : 'Customer Slip Form')}
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
                {isCuttingMode ? (t.normalMode || 'Normal') : (t.cuttingMode || 'Cutting Mode')}
              </span>
            </button>

            {/* Clean, well-spaced Close Button (Redundant AM badge removed) */}
            <button 
              id="close-add-modal-btn"
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/15 hover:bg-rose-600/90 flex items-center justify-center text-white transition-all cursor-pointer text-sm font-bold active:scale-95 border border-white/15 shadow-2xs"
              title={t.close}
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
                {t.customerName || (isRtl ? 'کسٹمر کی تصویر یا نام کا پہلا حرف' : 'Customer Photo or Initial Letter')}
              </label>
              <div className="flex items-center gap-1.5">
                <label className="text-[10.5px] bg-[#075e54] hover:bg-[#054c44] text-white px-2.5 py-1 rounded-lg font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-2xs border border-[#128c7e]/40">
                  <Camera className="w-3.5 h-3.5 text-[#25d366]" />
                  <span>{isRtl ? 'کیمرہ اسکین' : 'Camera'}</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                </label>
                <label className="text-[10.5px] bg-[#128c7e] hover:bg-[#0f766a] text-white px-2.5 py-1 rounded-lg cursor-pointer transition-all border border-[#128c7e]/30 flex items-center gap-1.5 font-bold">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isRtl ? 'گیلری پرچی' : 'Gallery'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>
            
            <div className="flex items-start gap-3.5">
              {/* Avatar Preview / Letter Box with Color Theme */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div 
                  id="avatarContainer" 
                  className={`relative w-16 h-16 rounded-2xl overflow-hidden ${
                    imageUri ? 'bg-slate-100 border border-slate-300' : `${activeAvatarTheme.gradientClass} ${activeAvatarTheme.solidTextClass} border-2 border-white ring-2 ${activeAvatarTheme.ringClass}`
                  } flex items-center justify-center font-black text-2xl shadow-md shrink-0 transition-all`}
                >
                  {/* تصویر کے لیے */}
                  {imageUri ? (
                    <img 
                      id="avatarPreview" 
                      src={imageUri} 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    /* نام کے پہلے حرف کے لیے (مثلاً ع، م، P وغیرہ) */
                    <span id="avatarLetter" className="select-none leading-none drop-shadow-xs font-black">
                      {avatarLetter}
                    </span>
                  )}

                  {imageUri && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageUri(null);
                      }}
                      title={t.removePhoto || "Remove photo"}
                      className="absolute inset-0 bg-[#062c1d]/60 text-white opacity-0 hover:opacity-100 flex items-center justify-center text-[10px] font-bold transition-opacity cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Avatar Color Picker Toggle */}
                {!imageUri && (
                  <button
                    type="button"
                    onClick={() => setShowColorPicker((prev) => !prev)}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-[#0d4a2a] bg-white hover:bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md shadow-2xs transition-all cursor-pointer"
                    title={isRtl ? 'اواتار کا رنگ منتخب کریں' : 'Choose Avatar Color'}
                  >
                    <Palette className="w-2.5 h-2.5 text-emerald-700" />
                    <span>{avatarColor ? (isRtl ? 'رنگ منتخب' : 'Custom') : (isRtl ? 'خودکار' : 'Auto')}</span>
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
                  placeholder={t.customerName || (isRtl ? "کسٹمر کا نام لکھیں" : "Customer name")} 
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
                    <span>{t.uploadPhotoTitle || (isRtl ? 'فوٹو لیں یا گیلری سے لگائیں' : 'Take Photo or Choose Gallery')}</span>
                  </button>

                  {imageUri && (
                    <button
                      type="button"
                      onClick={() => setImageUri(null)}
                      className="text-red-600 hover:text-red-700 text-[11px] font-bold px-2 py-1 hover:bg-red-50 rounded-lg border border-red-200 transition-colors shrink-0 cursor-pointer"
                    >
                      {t.removePhoto || (isRtl ? 'حذف' : 'Remove')}
                    </button>
                  )}
                </div>

                {isOcrScanning && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold animate-pulse">
                    <span className="text-sm">⚡</span>
                    <span>{t.extractingOcr || (isRtl ? 'پرچے سے ناپ پڑھی جا رہی ہے، چند سیکنڈ انتظار فرمائیں...' : 'Reading measurements from receipt, please wait...')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Avatar Color Selector Dropdown / Tray */}
            {showColorPicker && !imageUri && (
              <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Palette className="w-3 h-3 text-[#0d4a2a]" />
                    <span>{isRtl ? 'اواتار کا رنگ منتخب کریں:' : 'Select Avatar Color:'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setAvatarColor('')}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                      !avatarColor
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✨ {isRtl ? 'خودکار (نام کے مطابق)' : 'Auto (By Name)'}
                  </button>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-1">
                  {AVATAR_PALETTES.map((palette) => {
                    const isSelected = avatarColor === palette.id;
                    const isAutoMatch = !avatarColor && activeAvatarTheme.id === palette.id;
                    return (
                      <button
                        key={palette.id}
                        type="button"
                        onClick={() => setAvatarColor(palette.id)}
                        className={`h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer relative border ${
                          isSelected
                            ? 'ring-2 ring-emerald-700 ring-offset-1 border-emerald-800 scale-105'
                            : isAutoMatch
                            ? 'ring-1 ring-slate-400 border-slate-300'
                            : 'border-slate-200/80 hover:scale-105'
                        } ${palette.bgClass}`}
                        title={isRtl ? palette.nameUrdu : palette.nameEn}
                      >
                        <span className={`w-3 h-3 rounded-full ${palette.badgeBg}`} />
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[7px] font-black">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Measurement Slip Box (Compact Fit) */}
          <div className="border border-emerald-200 rounded-xl p-2.5 bg-emerald-50/20 flex flex-col justify-between flex-1 space-y-2">
            
            <div className="flex justify-between items-center border-b border-emerald-100 pb-1 mb-1 shrink-0">
              <span className="text-[11px] font-bold text-emerald-800">
                📏 {t.measurementsHeading || 'Measurement Slip (Inches)'}
              </span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                Inch
              </span>
            </div>

            {/* Quick Garment Template Chips */}
            <div className="space-y-1.5 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-emerald-900 flex items-center gap-1">
                  <span>✨</span>
                  <span>{isRtl ? 'ڈیزائن و ناپ ٹیمپلیٹ (Templates):' : 'Garment Templates:'}</span>
                </span>
                <span className="text-[9px] text-slate-500 font-medium">
                  {isRtl ? 'کلک کر کے معیاری ناپ لوڈ کریں' : 'Click to load default preset'}
                </span>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'shalwar_qameez', label: '🌟 قمیض شلوار', enLabel: 'Kameez Shalwar' },
                  { id: 'kameez_only', label: '👔 صرف قمیض/کرتا', enLabel: 'Kameez Only' },
                  { id: 'shalwar_only', label: '👖 صرف شلوار', enLabel: 'Shalwar Only' },
                  { id: 'pant', label: '👖 پینٹ/ٹراؤزر', enLabel: 'Pant / Trouser' },
                  { id: 'coat', label: '🧥 کوٹ/بلیزر', enLabel: 'Coat / Blazer' },
                  { id: 'waist_coat', label: '🦺 ویسٹ کوٹ', enLabel: 'Waistcoat' },
                  { id: 'saudi_thobe', label: '🕌 سعودی ثوب', enLabel: 'Saudi Thobe' },
                ].map((tpl) => {
                  const isActive = dressCategory === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleCategoryChange(tpl.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs scale-102 ring-1 ring-emerald-400'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-900'
                      }`}
                    >
                      {isRtl ? tpl.label : tpl.enLabel}
                    </button>
                  );
                })}
              </div>
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
                <option value="kameez_only">Kameez / Kurta Only (صرف قمیض / کرتا)</option>
                <option value="shalwar_only">Shalwar Only (صرف شلوار)</option>
                <option value="pant">Pant / Trouser (پینٹ / ٹراؤزر)</option>
                <option value="coat">Coat / Blazer (کوٹ / بلیزر)</option>
                <option value="coat_pant">Coat Pant Suit (کوٹ پینٹ مکمل سوٹ)</option>
                <option value="waist_coat">Waist Coat (ویسٹ کوٹ)</option>
                <option value="saudi_thobe">Saudi Thobe (سعودی تووب)</option>
                <option value="kwadi_thobe">Kuwaiti Thobe (کویتی تووب)</option>
                <option value="kurta">Kurta (کرتا)</option>
                <option value="sherwani">Sherwani (شیروانی)</option>
                <option value="jodhpuri">Jodhpuri Suit (جودھپوری سوٹ)</option>
                <option value="kurta_pajama">Kurta Pajama (کرتا پاجامہ)</option>
                <option value="pent_shirt">Pant Shirt (پینٹ شرٹ)</option>
                <option value="kids_suit">Kids Suit (بچوں کا سوٹ)</option>
                <option value="special_dress">Special Custom Dress (اسپیشل ڈریس)</option>
              </select>
            </div>

            {/* Measurement Rows (Strictly Fitted & responsive to Cutting Mode) */}
            <div id="measurementList" className="grid grid-cols-1 gap-1.5 text-xs flex-1">
              
              {/* 1. Length */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  {t.lengthLabel}
                </span>
                <input 
                  type="text" 
                  value={length} 
                  onChange={(e) => setLength(e.target.value)}
                  className={`measurement-input w-24 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                    isCuttingMode 
                      ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                />
              </div>

              {/* 2. Shoulder */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  {t.shoulderLabel}
                </span>
                <input 
                  type="text" 
                  value={shoulder} 
                  onChange={(e) => setShoulder(e.target.value)}
                  className={`measurement-input w-24 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                    isCuttingMode 
                      ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                />
              </div>

              {/* 3. Sleeve */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  {t.sleevesLabel}
                </span>
                <input 
                  type="text" 
                  value={sleeves} 
                  onChange={(e) => setSleeves(e.target.value)}
                  className={`measurement-input w-24 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                    isCuttingMode 
                      ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                />
              </div>

              {/* 4. Chest */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  {t.chestLabel}
                </span>
                <input 
                  type="text" 
                  value={chest} 
                  onChange={(e) => setChest(e.target.value)}
                  className={`measurement-input w-24 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                    isCuttingMode 
                      ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                />
              </div>

              {/* 5. Waist */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  {t.waistLabel}
                </span>
                <input 
                  type="text" 
                  value={waist} 
                  onChange={(e) => setWaist(e.target.value)}
                  className={`measurement-input w-24 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                    isCuttingMode 
                      ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                />
              </div>

              {/* 6. Daaman */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  {t.daamanLabel}
                </span>
                <input 
                  type="text" 
                  value={daaman} 
                  onChange={(e) => setDaaman(e.target.value)}
                  className={`measurement-input w-24 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                    isCuttingMode 
                      ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                />
              </div>

              {/* 7. Collar / Ban / Neck */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  {t.collarLabel}
                </span>
                <input 
                  type="text" 
                  value={collar} 
                  onChange={(e) => setCollar(e.target.value)}
                  className={`measurement-input w-24 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                    isCuttingMode 
                      ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                />
              </div>

              {/* 8. Shalwar */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  {t.shalwarLabel}
                </span>
                <input 
                  type="text" 
                  value={shalwar} 
                  onChange={(e) => setShalwar(e.target.value)}
                  className={`measurement-input w-24 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                    isCuttingMode 
                      ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                />
              </div>

              {/* 9. Pancha */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-slate-700'}`}>
                  {t.panchaLabel}
                </span>
                <input 
                  type="text" 
                  value={pancha} 
                  onChange={(e) => setPancha(e.target.value)}
                  className={`measurement-input w-24 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                    isCuttingMode 
                      ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                      : 'border-slate-300 bg-white text-slate-800'
                  }`}
                />
              </div>

              {/* Render Custom Fields */}
              {customFields.map((field) => (
                <div 
                  key={field.id}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${
                    isCuttingMode ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50/40 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(field.id)}
                      className="text-rose-500 hover:text-rose-700 p-0.5 rounded transition-colors cursor-pointer"
                      title={isRtl ? 'حذف کریں' : 'Delete'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className={`font-bold text-[11px] ${isCuttingMode ? 'text-amber-950 font-black' : 'text-emerald-900'}`}>
                      {field.name}
                    </span>
                  </div>
                  <input 
                    type="text" 
                    value={field.value} 
                    onChange={(e) => handleUpdateCustomField(field.id, e.target.value)}
                    placeholder="0"
                    className={`measurement-input w-24 py-1 rounded border text-center font-bold text-xs outline-none transition-all ${
                      isCuttingMode 
                        ? 'border-amber-400 bg-[#fef3c7] text-[#b45309] font-black text-[15px]' 
                        : 'border-emerald-300 bg-white text-slate-800 focus:border-emerald-600'
                    }`}
                  />
                </div>
              ))}

            </div>

            {/* Custom Field Addition Panel */}
            <div className="p-2 bg-white rounded-xl border border-emerald-200 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-emerald-900 flex items-center gap-1">
                  <Plus className="w-3 h-3 text-emerald-700" />
                  <span>{isRtl ? 'اضافی کسٹم ناپ شامل کریں:' : 'Add Custom Measurement:'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddCustomInput(!showAddCustomInput)}
                  className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                >
                  {showAddCustomInput ? (isRtl ? 'بند کریں' : 'Close') : (isRtl ? '+ نیا نام لکھیں' : '+ Type Custom')}
                </button>
              </div>

              {/* Quick Suggestion Chips for Tailoring */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                {[
                  { nameUrdu: 'ہپ (Hips)', nameEn: 'Hips' },
                  { nameUrdu: 'تھائی / ران (Thigh)', nameEn: 'Thigh' },
                  { nameUrdu: 'کراس بیک (Cross Back)', nameEn: 'Cross Back' },
                  { nameUrdu: 'بائسپ / موڈھا (Bicep)', nameEn: 'Bicep' },
                  { nameUrdu: 'کف چوڑائی (Cuff)', nameEn: 'Cuff' },
                  { nameUrdu: 'آسن (Rise)', nameEn: 'Rise / Aasan' },
                  { nameUrdu: 'گوڈا / گھٹنا (Knee)', nameEn: 'Knee' },
                  { nameUrdu: 'فرنٹ لمبائی (Front Length)', nameEn: 'Front Length' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddCustomField(isRtl ? item.nameUrdu : item.nameEn)}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[9px] font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0"
                  >
                    + {isRtl ? item.nameUrdu : item.nameEn}
                  </button>
                ))}
              </div>

              {/* Custom Input Box if tailor wants custom name */}
              {showAddCustomInput && (
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newCustomFieldName}
                    onChange={(e) => setNewCustomFieldName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomField(newCustomFieldName);
                      }
                    }}
                    placeholder={isRtl ? 'ناپ کا نام لکھیں (مثلاً: بیک لمبائی، کالر کف)' : 'Enter custom field name...'}
                    className="flex-1 px-2.5 py-1 text-xs border border-emerald-300 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomField(newCustomFieldName)}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isRtl ? 'شامل کریں' : 'Add'}
                  </button>
                </div>
              )}
            </div>

            {/* Customer Note & Tailoring Preferences (کسٹمر نوٹ اور خصوصی فرمائش) */}
            <div className="pt-2 border-t border-emerald-200/80 space-y-1.5 shrink-0">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                  <span className="text-amber-600">📝</span>
                  <span>{isRtl ? 'کسٹمر نوٹ و سلائی کی خاص فرمائش:' : 'Customer Note & Custom Instructions:'}</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {isRtl ? '(کٹنگ و سلائی کے وقت نظر آئے گا)' : '(Visible during cutting & stitching)'}
                </span>
              </div>

              {/* Quick suggestion tags for Darzi / Tailor */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { labelUrdu: 'بین (Ban)', labelEn: 'Ban' },
                  { labelUrdu: 'کالر (Collar)', labelEn: 'Collar' },
                  { labelUrdu: '1 سائیڈ جیب', labelEn: '1 Side Pocket' },
                  { labelUrdu: '2 سائیڈ جیب', labelEn: '2 Side Pockets' },
                  { labelUrdu: 'فرنٹ جیب', labelEn: 'Front Pocket' },
                  { labelUrdu: 'کف بازو', labelEn: 'Cuff Sleeves' },
                  { labelUrdu: 'کھلا بازو', labelEn: 'Open Sleeves' },
                  { labelUrdu: 'لوز فٹنگ', labelEn: 'Loose Fit' },
                  { labelUrdu: 'اسمارٹ فٹنگ', labelEn: 'Smart Fit' },
                  { labelUrdu: 'گول دامن', labelEn: 'Round Daman' },
                  { labelUrdu: 'چورس دامن', labelEn: 'Square Daman' },
                  { labelUrdu: 'ڈبل سلائی', labelEn: 'Double Stitch' },
                ].map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const tagText = isRtl ? tag.labelUrdu : tag.labelEn;
                      setSpecialNotes((prev) => {
                        const trimmed = prev.trim();
                        if (!trimmed) return tagText;
                        if (trimmed.includes(tagText)) return trimmed;
                        return `${trimmed}، ${tagText}`;
                      });
                    }}
                    className="px-2 py-0.5 rounded-md bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-slate-300 hover:border-emerald-400 text-slate-700 hover:text-emerald-900 text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs shrink-0"
                  >
                    + {isRtl ? tag.labelUrdu : tag.labelEn}
                  </button>
                ))}
              </div>

              {/* Multi-line Note Textarea */}
              <textarea
                rows={2}
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder={isRtl ? 'کسٹمر کی خاص فرمائش، کالر، بین، جیب، فٹنگ یا ادھار کا نوٹ یہاں لکھیں...' : 'Enter customer preferences, collar, ban, pockets, fitting, or balance notes...'}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 focus:border-[#075e54] focus:ring-1 focus:ring-[#075e54] rounded-lg text-xs text-slate-800 placeholder:text-slate-400 outline-none shadow-2xs transition-all"
              />

              {/* Pocket details line */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-600 shrink-0">
                  {t.pocketLabel || (isRtl ? 'جیب / پکٹ:' : 'Pockets:')}
                </span>
                <input 
                  type="text" 
                  value={pocket} 
                  onChange={(e) => setPocket(e.target.value)} 
                  placeholder={t.pocketLabel || "1 Front, 1 Side Pocket..."}
                  className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-md text-[10.5px] text-slate-700 outline-none"
                />
              </div>
            </div>

          </div>

          {/* Photo & Action Buttons Bottom Bar */}
          <div className="pt-1 space-y-2 shrink-0">
            {/* Accounts & Advance Section (اجرت، ایڈوانس اور بقایا) */}
            <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/60 p-2.5 rounded-xl border border-emerald-300/80 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950">
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{t.billingHeading || (isRtl ? 'سلائی کھاتہ و اجرت' : 'Tailoring Bill & Payment:')}</span>
                </span>
                {totalAmount ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    (parseFloat(totalAmount) || 0) > 0 && Math.max(0, (parseFloat(totalAmount) || 0) - (parseFloat(advanceAmount) || 0)) === 0 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {(parseFloat(totalAmount) || 0) > 0 && Math.max(0, (parseFloat(totalAmount) || 0) - (parseFloat(advanceAmount) || 0)) === 0 
                      ? (t.fullyPaidBadge || '✓ Paid') 
                      : `${t.balanceDueBadge || 'Balance'}: Rs. ${Math.max(0, (parseFloat(totalAmount) || 0) - (parseFloat(advanceAmount) || 0))}`}
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Total Stitching Charge */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                    {t.totalAmountLabel} (Rs):
                  </label>
                  <input 
                    id="modal-total-amount-input"
                    type="number"
                    min="0"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="1500"
                    className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                {/* Advance Paid */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                    {t.advanceAmountLabel} (Rs):
                  </label>
                  <input 
                    id="modal-advance-amount-input"
                    type="number"
                    min="0"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    placeholder="500"
                    className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                {/* Balance (Auto calculated) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                    {t.balanceAmountLabel} (Rs):
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
                    ✓ {t.fullyPaidBadge || 'Full'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvanceAmount(String(Math.round((parseFloat(totalAmount) || 0) / 2)))}
                    className="text-[9.5px] px-2 py-0.5 bg-white hover:bg-emerald-100 text-emerald-800 font-bold rounded-md border border-emerald-300 transition-colors cursor-pointer"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvanceAmount('0')}
                    className="text-[9.5px] px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-600 font-bold rounded-md border border-slate-200 transition-colors cursor-pointer"
                  >
                    0
                  </button>
                </div>
              )}
            </div>

            {/* Order Status Selector with Delivered Lock Protection */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.orderStatusLabel || 'Order Status:'}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {orderStatus === 'delivered' ? (
                    <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 flex items-center gap-1">
                      <span>🔒</span>
                      <span>{t.orderLockedBadge || 'Locked'}</span>
                    </span>
                  ) : (
                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                      <span>🔓</span>
                      <span>{t.orderUnlockedBadge || 'Unlocked'}</span>
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusMeta(orderStatus).badgeClass}`}>
                    {getStatusMeta(orderStatus).icon} {getStatusLabel(orderStatus)}
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
                      <span className="truncate w-full text-center">{getStatusLabel(st)}</span>
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
                  <span>{t.deliveryDateLabel || 'Delivery Date:'}</span>
                </span>
                {deliveryDate && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    getDeliveryStatus(deliveryDate, orderStatus) === 'late'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : getDeliveryStatus(deliveryDate, orderStatus) === 'today'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}>
                    {getDeliveryStatus(deliveryDate, orderStatus) === 'late' && (t.lateOrderBadge || '⚠️ Late')}
                    {getDeliveryStatus(deliveryDate, orderStatus) === 'today' && (t.dueTodayBadge || '⚡ Today')}
                    {getDeliveryStatus(deliveryDate, orderStatus) === 'upcoming' && (t.upcomingBadge || '📅 Upcoming')}
                    {getDeliveryStatus(deliveryDate, orderStatus) === 'delivered' && (t.statusDelivered || '✅ Delivered')}
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
                  ⚡ {t.quickToday || 'Today'}
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
                  {t.quickTomorrow || 'Tomorrow'}
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
                  {t.quick3Days || '3 Days'}
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
                  {t.quick1Week || '1 Week'}
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
                  {t.quick10Days || '10 Days'}
                </button>
              </div>
            </div>

            {/* Photo Attachment & Slip Preview Bar */}
            <div className="space-y-2 bg-white p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#075e54]" />
                  {imageUri ? (isRtl ? '✓ پرچی کی تصویر منسلک ہے (محفوظ ہو گی)' : '✓ Handwritten Slip Attached') : (t.paperSlipPhoto || (isRtl ? 'پرچہ / کپڑا فوٹو اسکین' : 'Paper / Cloth Photo'))}
                </span>
                <div className="flex gap-1.5">
                  <label className="bg-emerald-50 hover:bg-emerald-100 text-[#075e54] px-2.5 py-1 rounded-lg text-[10px] font-bold border border-emerald-200 cursor-pointer transition-colors shadow-2xs flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-amber-500" />
                    <span>{t.gallery}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <label className="bg-[#075e54] hover:bg-[#054c44] text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1">
                    <Camera className="w-3 h-3 text-[#25d366]" />
                    <span>{t.camera}</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {isOcrScanning && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-[#075e54] font-bold flex items-center gap-2 animate-pulse">
                  <Camera className="w-4 h-4 animate-spin text-[#25d366]" />
                  <span>{isRtl ? 'تصویر کا موازنہ اور خودکار ناپ پڑھی جا رہی ہے...' : 'Scanning slip image and extracting measurements via OCR...'}</span>
                </div>
              )}

              {imageUri && (
                <div className="p-2 bg-[#f0faf4] rounded-xl border border-[#128c7e]/30 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={imageUri} 
                      alt="Attached Slip" 
                      className="w-14 h-14 object-cover rounded-lg border border-[#128c7e]/40 shadow-xs shrink-0" 
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#075e54] flex items-center gap-1">
                        <span>📜</span>
                        <span>{isRtl ? 'اصلی ہینڈ رائٹنگ پرچی / کیمرہ فوٹو' : 'Original Handwritten Slip'}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {isRtl ? 'یہ تصویر گاہک کے آرڈر کے ساتھ کلاؤڈ پر مستقل طور پر محفوظ رہے گی' : 'Permanently saved attached to order record'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageUri(null)}
                    className="text-red-600 hover:text-red-800 text-[10px] font-bold px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 shrink-0 cursor-pointer"
                  >
                    {t.delete || (isRtl ? 'حذف کریں' : 'Delete')}
                  </button>
                </div>
              )}
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
