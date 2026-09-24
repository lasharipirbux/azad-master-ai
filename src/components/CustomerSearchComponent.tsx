import React, { memo } from 'react';
import { Customer } from '../types';
import { TranslationDictionary } from '../data/translations';
import { Search, X } from 'lucide-react';

export interface CustomerSearchComponentProps {
  customers: Customer[];
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  onSelectCustomer?: (customer: Customer) => void;
  placeholder?: string;
  isRtl?: boolean;
  translations?: TranslationDictionary;
  matchCount?: number;
}

/**
 * CustomerSearchComponent (سادہ اور تیز رفتار کسٹمر سرچ بار)
 * - گاہک کا نام یا موبائل نمبر لکھتے ہی فوری کسٹمر لسٹ فلٹر ہو جاتی ہے
 * - کسی قسم کی فالتو فلوٹنگ سجیشن لسٹ نہیں جو اسکرین یا بٹنز کو چھپائے
 */
export const CustomerSearchComponent: React.FC<CustomerSearchComponentProps> = memo(({
  searchQuery = '',
  onSearchChange,
  placeholder,
  isRtl = true,
  translations,
  matchCount,
}) => {
  const defaultPlaceholder =
    translations?.searchPlaceholder ||
    (isRtl ? 'گاہک کا نام یا موبائل نمبر تلاش کریں...' : 'Search by customer name or phone number...');

  const clearLabel = translations?.clear || (isRtl ? 'صاف کریں' : 'Clear');

  return (
    <div
      id="customer-search-component"
      className="w-full relative"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="relative flex items-center w-full">
        {/* سرچ آئیکن */}
        <span
          className={`absolute ${
            isRtl ? 'right-3' : 'left-3'
          } text-slate-400 pointer-events-none select-none flex items-center justify-center`}
        >
          <Search className="w-4 h-4 text-slate-400" />
        </span>

        {/* سرچ ان پٹ */}
        <input
          id="customerSearchInput"
          type="text"
          className={`w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#128c7e] rounded-xl ${
            isRtl ? 'pr-9 pl-16' : 'pl-9 pr-16'
          } h-[42px] text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#128c7e]/15 shadow-2xs transition-all`}
          placeholder={placeholder || defaultPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />

        {/* میچ کاؤنٹ اور ✕ کلیئر بٹن */}
        {searchQuery.trim().length > 0 && (
          <div className={`absolute ${isRtl ? 'left-2.5' : 'right-2.5'} flex items-center gap-1.5`}>
            {matchCount !== undefined && (
              <span className="text-[10px] font-bold text-[#075e54] bg-emerald-100/90 border border-emerald-300/60 px-1.5 py-0.5 rounded-md">
                {matchCount}
              </span>
            )}
            <button
              type="button"
              id="clearSearchQueryBtn"
              onClick={() => onSearchChange?.('')}
              className="w-6 h-6 rounded-full bg-slate-200/80 hover:bg-slate-300 active:bg-slate-400 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              title={clearLabel}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default CustomerSearchComponent;
