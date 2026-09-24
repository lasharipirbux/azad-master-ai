import React, { useState, useMemo } from 'react';
import { Customer, SupportedLanguage } from '../types';
import { TranslationDictionary } from '../data/translations';
import { getAvatarColorByName, getCustomerInitial } from '../utils/avatarColors';
import { 
  X, 
  TrendingUp, 
  Users, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  MessageCircle, 
  Crown,
  Layers,
  ArrowUpRight,
  Filter
} from 'lucide-react';

export interface CustomerAnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
  customers: Customer[];
  onOpenCustomerSlip?: (customer: Customer) => void;
  isRtl?: boolean;
  currentLang?: SupportedLanguage;
  translations?: TranslationDictionary;
}

export const CustomerAnalyticsModal: React.FC<CustomerAnalyticsModalProps> = ({
  visible,
  onClose,
  customers,
  onOpenCustomerSlip,
  isRtl = true,
  translations,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'topCustomers' | 'udhaarKhata'>('overview');
  const [filterQuery, setFilterQuery] = useState('');

  // Business Calculations (Memoized for performance)
  const analyticsData = useMemo(() => {
    let totalSuits = customers.length;
    let totalRevenue = 0;
    let totalAdvance = 0;
    let totalPendingBalance = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let pendingCount = 0;

    // Grouping by customer phone or name to find frequent clients
    const customerMap: Record<string, {
      customer: Customer;
      orderCount: number;
      totalSpent: number;
      totalBalance: number;
    }> = {};

    customers.forEach((c) => {
      const tot = parseFloat(String(c.totalAmount || 0)) || 0;
      const adv = parseFloat(String(c.advanceAmount || 0)) || 0;
      const bal = c.balanceAmount !== undefined && c.balanceAmount !== '' 
        ? (parseFloat(String(c.balanceAmount)) || 0)
        : Math.max(0, tot - adv);

      totalRevenue += tot;
      totalAdvance += adv;
      totalPendingBalance += bal;

      const st = c.status || 'pending';
      if (st === 'delivered' || st === 'ready') {
        completedCount++;
      } else if (st === 'cutting' || st === 'stitching') {
        inProgressCount++;
      } else {
        pendingCount++;
      }

      // Key for grouping: clean phone or trimmed name
      const key = (c.phone ? c.phone.replace(/[^0-9]/g, '') : '') || c.name.trim().toLowerCase();
      if (key) {
        if (!customerMap[key]) {
          customerMap[key] = {
            customer: c,
            orderCount: 0,
            totalSpent: 0,
            totalBalance: 0,
          };
        }
        customerMap[key].orderCount += 1;
        customerMap[key].totalSpent += tot;
        customerMap[key].totalBalance += bal;
      }
    });

    // Top Loyal Customers (sorted by order count, then total spent)
    const topCustomersList = Object.values(customerMap).sort((a, b) => {
      if (b.orderCount !== a.orderCount) {
        return b.orderCount - a.orderCount;
      }
      return b.totalSpent - a.totalSpent;
    });

    // Udhaar Customers (customers with pending balance > 0)
    const udhaarList = customers
      .map((c) => {
        const tot = parseFloat(String(c.totalAmount || 0)) || 0;
        const adv = parseFloat(String(c.advanceAmount || 0)) || 0;
        const bal = c.balanceAmount !== undefined && c.balanceAmount !== '' 
          ? (parseFloat(String(c.balanceAmount)) || 0)
          : Math.max(0, tot - adv);
        return { customer: c, total: tot, advance: adv, balance: bal };
      })
      .filter((item) => item.balance > 0)
      .sort((a, b) => b.balance - a.balance);

    return {
      totalSuits,
      totalRevenue,
      totalAdvance,
      totalPendingBalance,
      completedCount,
      inProgressCount,
      pendingCount,
      topCustomersList,
      udhaarList,
    };
  }, [customers]);

  if (!visible) return null;

  // Filtered Udhaar List
  const filteredUdhaar = analyticsData.udhaarList.filter((item) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      (item.customer.name && item.customer.name.toLowerCase().includes(q)) ||
      (item.customer.phone && item.customer.phone.includes(q))
    );
  });

  // Filtered Top Customers
  const filteredTop = analyticsData.topCustomersList.filter((item) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      (item.customer.name && item.customer.name.toLowerCase().includes(q)) ||
      (item.customer.phone && item.customer.phone.includes(q))
    );
  });

  return (
    <div 
      id="customer-analytics-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div 
        className="bg-white w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#075e54] via-[#0d4a2a] to-[#075e54] text-white p-4 shrink-0 flex items-center justify-between border-b border-[#00a884]/30 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <TrendingUp className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{isRtl ? 'دکان کی بزنس رپورٹ و کسٹمر تجزیہ' : 'Tailor Business & Customer Analytics'}</span>
              </h2>
              <p className="text-[11px] text-emerald-100 font-medium">
                {isRtl ? 'تمام سلے ہوئے سوٹ، کل کمائی اور ادھار کھاتہ کا مکمل حساب' : 'Comprehensive order history, revenue & pending balance report'}
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

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-100 p-1.5 border-b border-slate-200 gap-1 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#075e54] text-white shadow-xs'
                : 'text-slate-600 hover:bg-white/80'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isRtl ? 'خلاصہ و آمدنی' : 'Overview & Revenue'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('topCustomers')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'topCustomers'
                ? 'bg-[#075e54] text-white shadow-xs'
                : 'text-slate-600 hover:bg-white/80'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>{isRtl ? 'ٹاپ کسٹمرز' : 'Top Customers'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15">
              {analyticsData.topCustomersList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('udhaarKhata')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'udhaarKhata'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white/80'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
            <span>{isRtl ? 'ادھار / بقایا کھاتہ' : 'Udhaar / Balance'}</span>
            {analyticsData.udhaarList.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white text-rose-800 font-black">
                {analyticsData.udhaarList.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 bg-slate-50/50">
          {/* TAB 1: OVERVIEW & REVENUE */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Top 4 Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Total Suits */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold">{isRtl ? 'کل سوٹ / آرڈرز' : 'Total Orders'}</span>
                    <Users className="w-3.5 h-3.5 text-[#075e54]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-800">
                    {analyticsData.totalSuits}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{isRtl ? 'محفوظ شدہ ریکارڈ' : 'Total Records'}</span>
                </div>

                {/* Total Revenue */}
                <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs bg-gradient-to-b from-emerald-50/40 to-white">
                  <div className="flex items-center justify-between text-emerald-800 mb-1">
                    <span className="text-[11px] font-bold">{isRtl ? 'کل سلائی بل' : 'Total Bill'}</span>
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-700">
                    Rs. {analyticsData.totalRevenue.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">{isRtl ? 'تمام سوٹوں کی فیس' : 'Gross Revenue'}</span>
                </div>

                {/* Received Advance */}
                <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs bg-gradient-to-b from-blue-50/40 to-white">
                  <div className="flex items-center justify-between text-blue-800 mb-1">
                    <span className="text-[11px] font-bold">{isRtl ? 'وصول شدہ رقم' : 'Received Cash'}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-blue-700">
                    Rs. {analyticsData.totalAdvance.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-blue-600 font-medium">{isRtl ? 'ایڈوانس / وصولی' : 'Paid / Advance'}</span>
                </div>

                {/* Pending Balance / Udhaar */}
                <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs bg-gradient-to-b from-rose-50/40 to-white">
                  <div className="flex items-center justify-between text-rose-800 mb-1">
                    <span className="text-[11px] font-bold">{isRtl ? 'کل بقایا ادھار' : 'Pending Balance'}</span>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-rose-700">
                    Rs. {analyticsData.totalPendingBalance.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-rose-600 font-medium">
                    {analyticsData.udhaarList.length} {isRtl ? 'گاہکوں کی طرف' : 'Customers'}
                  </span>
                </div>
              </div>

              {/* Order Status Progress Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#075e54]" />
                    <span>{isRtl ? 'آرڈرز کی موجودہ حالت (Status)' : 'Order Status Breakdown'}</span>
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500">
                    {analyticsData.totalSuits} {isRtl ? 'کل سوٹ' : 'Total'}
                  </span>
                </div>

                {/* Visual Progress Bar */}
                {analyticsData.totalSuits > 0 && (
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                    <div 
                      style={{ width: `${(analyticsData.completedCount / analyticsData.totalSuits) * 100}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`تیار و ڈیلیورڈ: ${analyticsData.completedCount}`}
                    />
                    <div 
                      style={{ width: `${(analyticsData.inProgressCount / analyticsData.totalSuits) * 100}%` }}
                      className="bg-amber-500 h-full transition-all"
                      title={`کٹنگ و سلائی میں: ${analyticsData.inProgressCount}`}
                    />
                    <div 
                      style={{ width: `${(analyticsData.pendingCount / analyticsData.totalSuits) * 100}%` }}
                      className="bg-slate-300 h-full transition-all"
                      title={`پینڈنگ: ${analyticsData.pendingCount}`}
                    />
                  </div>
                )}

                {/* Status Badges */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="text-sm font-black text-emerald-800">{analyticsData.completedCount}</div>
                    <div className="text-[10.5px] font-bold text-emerald-700">{isRtl ? '✅ تیار / ڈیلیورڈ' : 'Ready / Delivered'}</div>
                  </div>

                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="text-sm font-black text-amber-800">{analyticsData.inProgressCount}</div>
                    <div className="text-[10.5px] font-bold text-amber-700">{isRtl ? '✂️ زیرِ کار (کٹنگ/سلائی)' : 'In Progress'}</div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-100 border border-slate-200">
                    <div className="text-sm font-black text-slate-800">{analyticsData.pendingCount}</div>
                    <div className="text-[10.5px] font-bold text-slate-600">{isRtl ? '⏳ پینڈنگ' : 'Pending'}</div>
                  </div>
                </div>
              </div>

              {/* Quick Jump Callouts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('topCustomers')}
                  className="p-3 bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-200 rounded-xl text-left rtl:text-right hover:border-amber-300 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shadow-2xs">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-amber-800">
                        {isRtl ? 'سب سے زیادہ کام دینے والے گاہک' : 'Top Loyal Customers'}
                      </div>
                      <div className="text-[10.5px] text-slate-500">
                        {analyticsData.topCustomersList.length} {isRtl ? 'مستقل کسٹمرز کی فہرست' : 'Regular Clients'}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('udhaarKhata')}
                  className="p-3 bg-gradient-to-br from-rose-50 to-red-50/30 border border-rose-200 rounded-xl text-left rtl:text-right hover:border-rose-300 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold shadow-2xs">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-rose-800">
                        {isRtl ? 'ادھار کھاتہ اور واٹس ایپ یاد دہانی' : 'Udhaar Balance & Reminders'}
                      </div>
                      <div className="text-[10.5px] text-slate-500">
                        Rs. {analyticsData.totalPendingBalance.toLocaleString()} {isRtl ? 'بقایا وصولی' : 'Pending'}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-rose-700 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TOP CUSTOMERS */}
          {activeTab === 'topCustomers' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>{isRtl ? 'سب سے زیادہ سوٹ سلوانے والے کسٹمرز:' : 'Top Customers by Order Volume:'}</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-500">
                  {filteredTop.length} {isRtl ? 'گاہک' : 'Customers'}
                </span>
              </div>

              {/* Search Bar for Top Customers */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={isRtl ? 'کسٹمر کا نام یا فون تلاش کریں...' : 'Search top customer...'}
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#075e54] shadow-2xs"
                />
              </div>

              {/* Customer List */}
              <div className="space-y-2">
                {filteredTop.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                    {isRtl ? 'کوئی کسٹمر موجود نہیں ہے' : 'No customer records found'}
                  </div>
                ) : (
                  filteredTop.map((item, index) => {
                    const avatarTheme = getAvatarColorByName(item.customer.name, item.customer.avatarColor);
                    const initial = getCustomerInitial(item.customer.name);
                    const isTopThree = index < 3;

                    return (
                      <div
                        key={item.customer.id || index}
                        onClick={() => {
                          if (onOpenCustomerSlip) {
                            onOpenCustomerSlip(item.customer);
                            onClose();
                          }
                        }}
                        className="bg-white p-3 rounded-xl border border-slate-200 hover:border-[#075e54] shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Rank Badge */}
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                            index === 0 
                              ? 'bg-amber-400 text-amber-950 shadow-xs' 
                              : index === 1 
                              ? 'bg-slate-300 text-slate-800' 
                              : index === 2 
                              ? 'bg-amber-700 text-amber-50' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {index + 1}
                          </div>

                          {/* Avatar */}
                          <div 
                            className={`w-10 h-10 rounded-xl ${
                              item.customer.imageUri 
                                ? 'bg-slate-100 border border-slate-200' 
                                : `${avatarTheme.gradientClass} ${avatarTheme.solidTextClass} border border-white/60 shadow-2xs`
                            } flex items-center justify-center font-black text-sm shrink-0 overflow-hidden select-none`}
                          >
                            {item.customer.imageUri ? (
                              <img src={item.customer.imageUri} alt={item.customer.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="leading-none drop-shadow-xs">{initial}</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#075e54] truncate">
                              {item.customer.name}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono" dir="ltr">
                              <Phone className="w-3 h-3 text-[#25d366]" />
                              <span>{item.customer.phone || 'No phone'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Order Count & Total Spent */}
                        <div className="text-right rtl:text-left shrink-0">
                          <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg text-xs font-black">
                            <span>{item.orderCount} {isRtl ? 'سوٹ' : 'Suits'}</span>
                          </div>
                          {item.totalSpent > 0 && (
                            <div className="text-[11px] font-bold text-slate-600 mt-0.5">
                              Rs. {item.totalSpent.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: UDHAAR / BALANCE KHATA */}
          {activeTab === 'udhaarKhata' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>{isRtl ? 'بقایا ادھار کھاتہ (Pending Balances):' : 'Pending Customer Balances:'}</span>
                  </h3>
                  <p className="text-[10.5px] text-slate-500">
                    {isRtl ? 'یہاں سے گاہک کو واٹس ایپ پر بقایا رقم کی یاد دہانی بھیجیں' : 'Send WhatsApp payment reminders directly'}
                  </p>
                </div>
                <div className="bg-rose-100 border border-rose-300 text-rose-900 px-2.5 py-1 rounded-xl text-xs font-black">
                  Rs. {analyticsData.totalPendingBalance.toLocaleString()}
                </div>
              </div>

              {/* Search Bar for Udhaar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={isRtl ? 'ادھار والے کسٹمر کا نام تلاش کریں...' : 'Search pending balance customer...'}
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-rose-600 shadow-2xs"
                />
              </div>

              {/* Udhaar List */}
              <div className="space-y-2">
                {filteredUdhaar.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold space-y-1">
                    <div>✨ {isRtl ? 'ماشاءاللہ! کوئی بقایا ادھار رقم نہیں ہے' : 'Great! No pending balances found'}</div>
                    <div className="text-[10.5px] text-slate-500 font-normal">{isRtl ? 'تمام گاہکوں کا حساب مکمل ادا شدہ ہے۔' : 'All accounts are settled.'}</div>
                  </div>
                ) : (
                  filteredUdhaar.map((item) => {
                    const avatarTheme = getAvatarColorByName(item.customer.name, item.customer.avatarColor);
                    const initial = getCustomerInitial(item.customer.name);
                    const cleanPhone = item.customer.phone ? item.customer.phone.replace(/[^0-9]/g, '') : '';

                    const reminderMsg = encodeURIComponent(
                      `✨ *آزاد ماسٹر (AZAD MASTER) - یاد دہانی بل/بقایا رقم* ✨\n━━━━━━━━━━━━━━━━━━━━\nمحترم جناب *${item.customer.name || 'گاہک'}* صاحب،\nالسلام علیکم! آزاد ماسٹر ٹیلرز کے پاس آپ کے سوٹ کا حساب درج ذیل ہے:\n\n💵 *کل رقم:* Rs. ${item.total}\n✅ *وصول شدہ:* Rs. ${item.advance}\n⏳ *بقایا ادھار رقم:* Rs. ${item.balance}\n\nبرائے مہربانی تشریف لا کر بقایا رقم ادا فرما دیجیے۔\n━━━━━━━━━━━━━━━━━━━━\nشکریہ!\n*آزاد ماسٹر ٹیلرز*`
                    );

                    return (
                      <div
                        key={item.customer.id}
                        className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div 
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                          onClick={() => {
                            if (onOpenCustomerSlip) {
                              onOpenCustomerSlip(item.customer);
                              onClose();
                            }
                          }}
                        >
                          <div 
                            className={`w-10 h-10 rounded-xl ${
                              item.customer.imageUri 
                                ? 'bg-slate-100 border border-slate-200' 
                                : `${avatarTheme.gradientClass} ${avatarTheme.solidTextClass} border border-white/60 shadow-2xs`
                            } flex items-center justify-center font-black text-sm shrink-0 overflow-hidden select-none`}
                          >
                            {item.customer.imageUri ? (
                              <img src={item.customer.imageUri} alt={item.customer.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="leading-none drop-shadow-xs">{initial}</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 hover:text-rose-700 truncate">
                              {item.customer.name}
                            </h4>
                            <div className="text-[10.5px] text-slate-500 flex items-center gap-2">
                              <span>{isRtl ? 'تاریخ:' : 'Date:'} {item.customer.date}</span>
                              {item.customer.deliveryDate && (
                                <span className="font-semibold text-slate-700">• 🚀 {item.customer.deliveryDate}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount Breakdown & WhatsApp Reminder Button */}
                        <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="text-left rtl:text-right">
                            <span className="text-[10px] text-slate-500 font-bold block">{isRtl ? 'بقایا ادھار:' : 'Pending:'}</span>
                            <span className="text-sm font-black text-rose-700">Rs. {item.balance.toLocaleString()}</span>
                          </div>

                          {cleanPhone && cleanPhone.length >= 7 ? (
                            <a
                              href={`https://wa.me/${cleanPhone}?text=${reminderMsg}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
                              title={isRtl ? 'واٹس ایپ پر ادھار یاد دہانی بھیجیں' : 'Send WhatsApp Reminder'}
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-white" />
                              <span>{isRtl ? 'یاد دہانی بھیجیں' : 'Remind'}</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenCustomerSlip) {
                                  onOpenCustomerSlip(item.customer);
                                  onClose();
                                }
                              }}
                              className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                              {isRtl ? 'پرچی دیکھیں' : 'View Slip'}
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
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] font-bold text-[#075e54] flex items-center gap-1">
            <span>✨ آزاد ماسٹر بزنس اینالیٹکس</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-98 text-white font-bold text-xs transition-all cursor-pointer shadow-2xs"
          >
            {translations?.close || (isRtl ? 'بند کریں' : 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalyticsModal;
