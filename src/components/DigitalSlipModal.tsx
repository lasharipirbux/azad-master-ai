import React, { useState } from 'react';
import { Customer, OrderStatus } from '../types';
import { getStatusMeta, ORDER_STATUS_LIST, ORDER_STATUSES } from '../utils/orderStatus';
import { 
  ArrowLeft, 
  MessageCircle, 
  Edit3, 
  X, 
  Copy, 
  Check, 
  Printer, 
  Calendar, 
  Phone, 
  User, 
  Scissors, 
  Image as ImageIcon,
  Trash2,
  Clock,
  CheckCircle,
  PackageCheck,
  Wallet,
  AlertTriangle
} from 'lucide-react';
import { getDeliveryStatus } from '../utils/deliveryDate';
import { getAvatarColorByName, getCustomerInitial } from '../utils/avatarColors';

interface DigitalSlipModalProps {
  slip: Customer;
  onClose: () => void;
  onEdit: (slip: Customer) => void;
  onDelete?: (id: number) => void;
  onUpdateStatus?: (id: number, status: OrderStatus) => void;
  translations: Record<string, string>;
  isRtl: boolean;
}

export const DigitalSlipModal: React.FC<DigitalSlipModalProps> = ({
  slip,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
  translations: t,
  isRtl,
}) => {
  const [copied, setCopied] = useState(false);
  const [imagePreviewModal, setImagePreviewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(slip.status || 'pending');
  const [isStatusLocked, setIsStatusLocked] = useState<boolean>(slip.status === 'delivered');

  const getStatusLabel = (st: OrderStatus): string => {
    if (st === 'pending') return t.statusPending || 'Pending';
    if (st === 'cutting') return t.statusCutting || 'Cutting';
    if (st === 'stitching') return t.statusStitching || 'Stitching';
    if (st === 'ready') return t.statusReady || 'Ready';
    if (st === 'delivered') return t.statusDelivered || 'Delivered';
    return st;
  };

  const cleanPhoneForWhatsApp = slip.phone.replace(/[^0-9]/g, '');
  const statusMeta = getStatusMeta(currentStatus);

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (isStatusLocked && newStatus !== 'delivered') {
      const confirmUnlock = window.confirm(
        t.statusLockedNotice || (isRtl 
          ? "⚠️ یہ آرڈر مکمل (Delivered) ہو چکا ہے اور لاک ہے۔ کیا آپ واقعی اسے دوبارہ ان لاک کر کے اسٹیٹس تبدیل کرنا چاہتے ہیں؟"
          : "⚠️ This order is Delivered and Locked. Do you want to unlock and change status?")
      );
      if (!confirmUnlock) return;
      setIsStatusLocked(false);
    }

    setCurrentStatus(newStatus);
    if (newStatus === 'delivered') {
      setIsStatusLocked(true);
    }
    if (onUpdateStatus) {
      onUpdateStatus(slip.id, newStatus);
    }
  };

  const formatSlipWhatsAppMessage = () => {
    let msg = `✨ *آزاد ماسٹر - کٹنگ سلپ (AZAD MASTER)* ✨\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👤 *گاہک (Customer):* ${slip.name || 'محترم گاہک'}\n`;
    msg += `📞 *فون (Phone):* ${slip.phone || '-'}\n`;
    msg += `📅 *تاریخ بکنگ (Booking Date):* ${slip.date}\n`;
    if (slip.deliveryDate) {
      msg += `🚀 *تاریخ واپسی / ڈیلیوری (Delivery Date):* ${slip.deliveryDate}\n`;
    }
    msg += `📦 *آرڈر اسٹیٹس (Status):* ${statusMeta.icon} ${getStatusLabel(currentStatus)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `✂️ *ناپ کی تفصیل (Measurements):*\n\n`;

    if (slip.measurementsObj && Object.keys(slip.measurementsObj).length > 0) {
      const m = slip.measurementsObj;
      if (m.length) msg += `▫️ لمبائی (Length): *${m.length}"*\n`;
      if (m.shoulder) msg += `▫️ تیرا (Shoulder): *${m.shoulder}"*\n`;
      if (m.sleeves) msg += `▫️ بازو (Sleeves): *${m.sleeves}"*\n`;
      if (m.chest) msg += `▫️ چھاتی (Chest): *${m.chest}"*\n`;
      if (m.waist) msg += `▫️ کمر (Waist): *${m.waist}"*\n`;
      if (m.daaman) msg += `▫️ دامن/گھیر (Daaman): *${m.daaman}"*\n`;
      if (m.collar) msg += `▫️ کالر/بین (Collar): *${m.collar}"*\n`;
      if (m.shalwar) msg += `▫️ شلوار (Shalwar): *${m.shalwar}"*\n`;
      if (m.pancha) msg += `▫️ پانچہ (Paancha): *${m.pancha}"*\n`;
      if (m.pocket) msg += `▫️ جیب/پکٹ (Pocket): ${m.pocket}\n`;
      if (m.specialNotes) msg += `▫️ خصوصی نوٹ: ${m.specialNotes}\n`;
    } else {
      msg += `${slip.details}\n`;
    }

    if (slip.totalAmount !== undefined && slip.totalAmount !== null && slip.totalAmount !== '') {
      const tot = parseFloat(String(slip.totalAmount)) || 0;
      const adv = parseFloat(String(slip.advanceAmount || 0)) || 0;
      const bal = slip.balanceAmount !== undefined && slip.balanceAmount !== '' 
        ? slip.balanceAmount 
        : Math.max(0, tot - adv);
      msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `💰 *سلائی کھاتہ و بل (Tailoring Bill):*\n`;
      msg += `💵 کل اجرت (Total Fee): *Rs. ${tot}*\n`;
      msg += `📥 پیشگی ایڈوانس (Advance): *Rs. ${adv}*\n`;
      if (Number(bal) === 0) {
        msg += `✅ بقایا رقم (Balance Due): *Rs. 0 (مکمل ادا شدہ / Paid)*\n`;
      } else {
        msg += `⏳ بقایا واجب الادا (Balance Due): *Rs. ${bal}*\n`;
      }
    }

    msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `✨ *آزاد ماسٹر کا انتخاب کرنے کا شکریہ!*`;
    return encodeURIComponent(msg);
  };

  const formatSuitReadyWhatsAppMessage = () => {
    let msg = `✨ *آزاد ماسٹر (AZAD MASTER) - اطلاع برائے سوٹ تیاری* ✨\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `محترم جناب *${slip.name || 'محترم گاہک'}* صاحب،\n`;
    msg += `السلام علیکم! آپ کا سوٹ سل کر بالکل تیار ہو چکا ہے اور دکان پر وصولی کے لیے موجود ہے۔ 🪡✨\n\n`;
    msg += `📅 *بکنگ تاریخ:* ${slip.date}\n`;
    if (slip.deliveryDate) {
      msg += `🚀 *مقررہ ڈیلیوری:* ${slip.deliveryDate}\n`;
    }
    if (slip.totalAmount !== undefined && slip.totalAmount !== null && slip.totalAmount !== '') {
      const tot = parseFloat(String(slip.totalAmount)) || 0;
      const adv = parseFloat(String(slip.advanceAmount || 0)) || 0;
      const bal = slip.balanceAmount !== undefined && slip.balanceAmount !== '' 
        ? slip.balanceAmount 
        : Math.max(0, tot - adv);
      if (Number(bal) > 0) {
        msg += `⏳ *بقایا رقم:* Rs. ${bal}\n`;
      } else {
        msg += `✅ *بل:* مکمل ادا شدہ (Paid)\n`;
      }
    }
    msg += `\nآپ کسی بھی وقت تشریف لا کر اپنا تیار سوٹ وصول فرما سکتے ہیں۔\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `شکریہ!\n*آزاد ماسٹر ٹیلرز*`;
    return encodeURIComponent(msg);
  };

  const whatsappMessage = formatSlipWhatsAppMessage();
  const suitReadyMessage = formatSuitReadyWhatsAppMessage();

  const handleCopy = () => {
    let billText = '';
    if (slip.totalAmount !== undefined && slip.totalAmount !== null && slip.totalAmount !== '') {
      billText = `\n\nBILL & PAYMENT:\nTotal: Rs. ${slip.totalAmount}\nAdvance: Rs. ${slip.advanceAmount || 0}\nBalance Due: Rs. ${slip.balanceAmount || 0}`;
    }
    const deliveryText = slip.deliveryDate ? `\nDelivery Date: ${slip.deliveryDate}` : '';
    const textToCopy = `AZAD MASTER - CUTTING SLIP\nCustomer: ${slip.name}\nPhone: ${slip.phone}\nBooking Date: ${slip.date}${deliveryText}\nStatus: ${getStatusLabel(currentStatus)}\n\n${slip.details}${billText}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs transition-opacity"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div 
        id="digital-cutting-slip"
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-[#128c7e]/20 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-[#075e54] text-white p-4 relative text-center shadow-md">
          <button 
            id="slip-back-btn"
            onClick={onClose}
            className="absolute top-3.5 left-3 bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            title={t.back}
          >
            <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            <span className="hidden sm:inline">{t.back}</span>
          </button>

          <button 
            id="slip-close-corner-btn"
            onClick={onClose}
            className="absolute top-3.5 right-3 bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-2 mb-1">
            <Scissors className="w-5 h-5 text-[#dcf8c6]" />
            <h3 className="font-bold text-base tracking-wide uppercase">{t.digitalSlip}</h3>
          </div>
          
          <div className="flex flex-col items-center justify-center gap-1.5 mb-2">
            {(() => {
              const avatarTheme = getAvatarColorByName(slip.name, slip.avatarColor);
              const initialChar = getCustomerInitial(slip.name);
              return (
                <div 
                  className={`w-16 h-16 rounded-2xl overflow-hidden ${
                    slip.imageUri && slip.imageUri.trim() !== ''
                      ? 'bg-white border-2 border-white/80'
                      : `${avatarTheme.gradientClass} ${avatarTheme.solidTextClass} border-2 border-white ring-2 ${avatarTheme.ringClass}`
                  } flex items-center justify-center font-black text-2xl shadow-lg`}
                >
                  {slip.imageUri && slip.imageUri.trim() !== '' ? (
                    <img src={slip.imageUri} alt={slip.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="select-none leading-none drop-shadow-xs">{initialChar}</span>
                  )}
                </div>
              );
            })()}
            <h2 className="text-xl font-extrabold tracking-tight text-white">{slip.name}</h2>
          </div>
          
          <div className="flex flex-col gap-1.5 text-xs font-medium text-[#dcf8c6] bg-[#054c44]/60 p-2 rounded-lg border border-[#128c7e]/30">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-white" dir="ltr">
                <Phone className="w-3.5 h-3.5 text-[#25d366]" />
                {slip.phone}
              </span>
              <span className="flex items-center gap-1.5 text-white">
                <Calendar className="w-3.5 h-3.5 text-[#25d366]" />
                <span>{t.dateLabel || (isRtl ? 'بکنگ:' : 'Booked:')}: {slip.date}</span>
              </span>
            </div>
            {slip.deliveryDate && (
              <div className="flex justify-between items-center pt-1 border-t border-[#128c7e]/30 text-[11px]">
                <span className="text-[#dcf8c6] flex items-center gap-1">
                  <span>🚀</span>
                  <span>{t.deliveryDateLabel || (isRtl ? 'تاریخ ڈیلیوری:' : 'Delivery Date:')}:</span>
                  <span className="font-bold text-white">{slip.deliveryDate}</span>
                </span>
                {getDeliveryStatus(slip.deliveryDate, currentStatus) === 'late' && (
                  <span className="bg-rose-500 text-white font-black px-2 py-0.2 rounded-full text-[10px] animate-pulse">
                    ⚠️ {t.lateOrder || (isRtl ? 'تاخیر شدہ' : 'Late Order')}
                  </span>
                )}
                {getDeliveryStatus(slip.deliveryDate, currentStatus) === 'today' && (
                  <span className="bg-[#25d366] text-white font-black px-2 py-0.2 rounded-full text-[10px] animate-pulse">
                    ⚡ {t.dueToday || (isRtl ? 'آج کی ڈیلیوری' : 'Due Today')}
                  </span>
                )}
                {getDeliveryStatus(slip.deliveryDate, currentStatus) === 'upcoming' && (
                  <span className="bg-[#128c7e] text-white font-medium px-2 py-0.2 rounded-full text-[10px]">
                    📅 {t.upcomingOrder || (isRtl ? 'آئندہ' : 'Upcoming')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Slip Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3.5 bg-slate-50/50">
          {/* Order Tracking & Status Control */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#075e54]" />
                <span>{t.orderStatusHeading || (isRtl ? 'آرڈر کی حالت (Order Status)' : 'Order Tracking Status')}</span>
              </span>
              <div className="flex items-center gap-1.5">
                {currentStatus === 'delivered' ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#dcf8c6] text-[#075e54] border border-[#00a884]/40 flex items-center gap-1">
                    <span>🔒</span>
                    <span>{t.statusLocked || (isRtl ? 'پکا / لاک شدہ' : 'Locked')}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                    <span>🔓</span>
                    <span>{t.statusUnlocked || (isRtl ? 'تبدیل ہو سکتا ہے' : 'Unlocked')}</span>
                  </span>
                )}
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${statusMeta.badgeClass}`}>
                  <span>{statusMeta.icon}</span>
                  <span>{getStatusLabel(currentStatus)}</span>
                </span>
              </div>
            </div>

            {/* Quick Status Picker Buttons */}
            <div className="grid grid-cols-5 gap-1 pt-1">
              {ORDER_STATUS_LIST.map((st) => {
                const meta = ORDER_STATUSES[st];
                const isActive = currentStatus === st;
                return (
                  <button
                    key={st}
                    id={`status-btn-${st}`}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border ${
                      isActive
                        ? `${meta.badgeClass} ring-2 ring-[#075e54] shadow-xs scale-102`
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                    title={getStatusLabel(st)}
                  >
                    <span className="text-xs">{meta.icon}</span>
                    <span className="truncate w-full text-center leading-tight">
                      {getStatusLabel(st)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tailoring Bill & Accounts Card */}
          {slip.totalAmount !== undefined && slip.totalAmount !== null && slip.totalAmount !== '' && (
            <div className="bg-gradient-to-br from-[#f0faf4] to-[#e7f7ef] p-3.5 rounded-xl border border-[#128c7e]/30 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#128c7e]/20">
                <span className="text-xs font-bold uppercase tracking-wider text-[#075e54] flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-[#075e54]" />
                  {t.tailoringBillHeading || (isRtl ? 'سلائی کھاتہ و بل' : 'Tailoring Bill & Payment')}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  Number(slip.balanceAmount || 0) === 0
                    ? 'bg-[#dcf8c6] text-[#075e54] border-[#00a884]/40'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  {Number(slip.balanceAmount || 0) === 0
                    ? (t.fullyPaid || (isRtl ? '✓ مکمل ادا شدہ' : '✓ Fully Paid'))
                    : (t.balanceDueLabel || (isRtl ? '⏳ بقایا واجب الادا' : '⏳ Balance Due'))}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-lg border border-[#128c7e]/15 shadow-2xs">
                  <span className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    {t.totalAmountLabel || (isRtl ? 'کل سلائی اجرت' : 'Total Amount')}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-800">
                    Rs. {slip.totalAmount}
                  </span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-[#128c7e]/15 shadow-2xs">
                  <span className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    {t.advanceAmountLabel || (isRtl ? 'پیشگی ایڈوانس' : 'Advance Paid')}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-[#075e54]">
                    Rs. {slip.advanceAmount || 0}
                  </span>
                </div>

                <div className={`p-2 rounded-lg border shadow-2xs ${
                  Number(slip.balanceAmount || 0) === 0
                    ? 'bg-[#dcf8c6]/80 border-[#00a884]/40 text-[#075e54]'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}>
                  <span className="block text-[10px] font-semibold mb-0.5">
                    {t.balanceAmountLabel || (isRtl ? 'بقایا رقم' : 'Balance Due')}
                  </span>
                  <span className="text-xs sm:text-sm font-black">
                    Rs. {slip.balanceAmount !== undefined && slip.balanceAmount !== '' ? slip.balanceAmount : Math.max(0, (parseFloat(String(slip.totalAmount || 0)) - parseFloat(String(slip.advanceAmount || 0))))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Customer Note & Tailoring Preferences (کسٹمر نوٹ و خصوصی فرمائش) */}
          {(slip.notes || slip.measurementsObj?.specialNotes) && (
            <div className="bg-amber-50/90 border-2 border-amber-300 p-3 rounded-xl shadow-xs">
              <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs mb-1">
                <span>📝</span>
                <span>{isRtl ? 'کسٹمر نوٹ و خاص فرمائش (کٹنگ و سلائی نوٹ):' : 'Customer Note & Special Instructions:'}</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-amber-950 whitespace-pre-wrap leading-relaxed">
                {slip.notes || slip.measurementsObj?.specialNotes}
              </p>
            </div>
          )}

          {/* Formatted Table/Card for measurements */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#075e54] flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" />
                {t.cuttingDimensionsHeading || 'Cutting Dimensions'}
              </span>
              <button 
                id="copy-slip-btn"
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-[#075e54] bg-slate-100 hover:bg-[#e7f7ef] px-2.5 py-1 rounded-md transition-colors font-medium border border-slate-200"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#25d366]" />
                    <span className="text-[#075e54] font-semibold">{t.copySuccess}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.copySlip}</span>
                  </>
                )}
              </button>
            </div>

            <pre className="font-mono text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-200/60 selection:bg-[#dcf8c6]">
              {slip.details}
            </pre>
          </div>

          {/* Attached Slip / Cloth Photo */}
          {slip.imageUri && (
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs text-center">
              <span className="text-xs font-semibold text-slate-600 mb-2 flex items-center justify-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-[#075e54]" />
                {t.paperSlipSnapshot || 'Paper Slip / Cloth Snapshot'}
              </span>
              <div 
                className="relative cursor-pointer group inline-block max-w-full"
                onClick={() => setImagePreviewModal(true)}
              >
                <img 
                  src={slip.imageUri} 
                  alt="Paper Slip" 
                  className="max-h-36 max-w-full object-contain rounded-lg border border-slate-200 mx-auto shadow-xs group-hover:opacity-90 transition-opacity"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">{t.tapToZoom || 'Tap to zoom'}</span>
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp & Print Actions */}
        <div className="p-3 bg-white border-t border-slate-200/80 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a 
              id="whatsapp-share-link"
              href={`https://wa.me/${cleanPhoneForWhatsApp}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white py-2 px-3 rounded-xl font-bold text-xs sm:text-sm shadow-2xs transition-all text-center"
            >
              <MessageCircle className="w-4 h-4 fill-white shrink-0" />
              <span>{t.sendWhatsapp || (isRtl ? 'واٹس ایپ پرچی' : 'WhatsApp Slip')}</span>
            </a>

            <a 
              id="whatsapp-ready-alert-link"
              href={`https://wa.me/${cleanPhoneForWhatsApp}?text=${suitReadyMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white py-2 px-3 rounded-xl font-bold text-xs sm:text-sm shadow-2xs transition-all text-center"
              title={isRtl ? 'گاہک کو واٹس ایپ پر سوٹ تیاری کا میسج بھیجیں' : 'Send Suit is Ready Alert to Customer'}
            >
              <PackageCheck className="w-4 h-4 shrink-0" />
              <span>{isRtl ? 'سوٹ تیار ہے الرٹ' : 'Suit Ready Alert'}</span>
            </a>
          </div>

          {showDeleteConfirm ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 animate-in fade-in">
              <p className="text-xs font-bold text-red-800 text-center">
                {t.confirmDeleteCustomer || (isRtl ? 'کیا آپ واقعی اس گاہک کا ریکارڈ ڈیلیٹ کرنا چاہتے ہیں؟' : 'Are you sure you want to delete this customer record?')}
              </p>
              <div className="flex gap-2">
                <button
                  id="confirm-delete-slip-btn"
                  onClick={() => {
                    if (onDelete) onDelete(slip.id);
                    onClose();
                  }}
                  className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  {t.yesDelete || (isRtl ? 'ہاں، ڈیلیٹ کریں' : 'Yes, Delete')}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  {t.cancel || (isRtl ? 'منسوخ' : 'Cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button 
                id="slip-edit-mode-btn"
                onClick={() => onEdit(slip)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>{t.editMode}</span>
              </button>

              <button 
                id="slip-print-btn"
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm border border-slate-300 transition-colors"
                title="Print"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>{t.printSlip}</span>
              </button>

              {onDelete && (
                <button 
                  id="slip-delete-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm border border-red-200 transition-colors"
                  title={t.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button 
                id="slip-close-bottom-btn"
                onClick={onClose}
                className="flex items-center justify-center bg-slate-200 hover:bg-slate-300 text-slate-700 py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm transition-colors"
              >
                {t.close}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Zoom Modal */}
      {imagePreviewModal && slip.imageUri && (
        <div 
          className="fixed inset-0 z-60 bg-[#062c1d]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setImagePreviewModal(false)}
        >
          <button 
            className="absolute top-4 right-4 bg-white/20 text-white p-2.5 rounded-full hover:bg-white/40"
            onClick={() => setImagePreviewModal(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={slip.imageUri} 
            alt="Full Slip" 
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
