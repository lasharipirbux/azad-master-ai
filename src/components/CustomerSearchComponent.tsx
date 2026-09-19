import React, { useState, useRef, useEffect } from 'react';
import { Customer } from '../types';

export interface CustomerSearchComponentProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onAddNewCustomer?: (nameQuery: string) => void;
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  onSearchSubmit?: (query: string) => void;
  searchHistory?: string[];
  onClearHistory?: () => void;
  onRemoveHistoryItem?: (item: string) => void;
  placeholder?: string;
  showSearchButton?: boolean;
  isRtl?: boolean;
}

/**
 * CustomerSearchComponent (کسٹمر سرچ و آٹو کمپلیٹ کمپوننٹ)
 * - سرچ بار جس میں گاہک کا نام یا فون نمبر لکھتے ہی فلوٹنگ سجیشن لسٹ ظاہر ہوتی ہے۔
 * - سلیکٹ کرنے پر نام سرچ بار میں آ جاتا ہے اور لسٹ فوری غائب ہو جاتی ہے تاکہ فالتو جگہ نہ گھیرے
 * - اگر کوئی گاہک نہ ملے تو 'No customer found. Tap to add new.' پر کلک کر کے نیا گاہک شامل کیا جا سکتا ہے
 */
export const CustomerSearchComponent: React.FC<CustomerSearchComponentProps> = ({
  customers,
  onSelectCustomer,
  onAddNewCustomer,
  searchQuery: externalQuery,
  onSearchChange: externalOnChange,
  onSearchSubmit,
  searchHistory = [],
  onClearHistory,
  onRemoveHistoryItem,
  placeholder,
  showSearchButton = true,
  isRtl = true,
}) => {
  const [internalQuery, setInternalQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchQuery = externalQuery !== undefined ? externalQuery : internalQuery;

  const handleQueryChange = (text: string) => {
    if (externalOnChange) {
      externalOnChange(text);
    } else {
      setInternalQuery(text);
    }
    setIsFocused(true);
  };

  // کسٹمر کو نام یا فون نمبر سے فلٹر کرنے کا فنکشن
  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return false;
    const matchName = c.name?.toLowerCase().includes(q);
    const rawPhoneDigits = c.phone?.replace(/[^0-9]/g, '');
    const qDigits = q.replace(/[^0-9]/g, '');
    const matchPhone = c.phone?.includes(q) || (qDigits.length > 1 && rawPhoneDigits?.includes(qDigits));
    return matchName || matchPhone;
  });

  // فلٹر شدہ پچھلی تلاشیں
  const matchingHistory = (searchHistory || []).filter(item => {
    const q = searchQuery.toLowerCase().trim();
    return q && item.toLowerCase().includes(q);
  });

  // Handle click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const defaultPlaceholder = isRtl
    ? 'نام یا فون نمبر تلاش کریں...'
    : 'Search by name or phone number...';

  const handleSubmit = () => {
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
    setIsFocused(false);
  };

  return (
    <div 
      ref={containerRef}
      id="customer-search-component"
      className="w-full relative z-40"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* سرچ ان پٹ بار مع آپشنل تلاش بٹن */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            id="customerSearchInput"
            type="text"
            className={`w-full bg-white border border-slate-300 rounded-xl ${
              isRtl ? 'pr-8 pl-11' : 'pl-8 pr-11'
            } h-[38px] sm:h-[40px] text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 shadow-2xs transition-all`}
            placeholder={placeholder || defaultPlaceholder}
            value={searchQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              } else if (e.key === 'Escape') {
                setIsFocused(false);
              }
            }}
          />

          {/* سرچ آئیکن */}
          <span 
            className={`absolute ${isRtl ? 'right-2.5' : 'left-2.5'} top-2.5 text-slate-400 text-xs pointer-events-none select-none`}
          >
            🔍
          </span>

          {/* میچ کاؤنٹ و کلیئر بٹن (✕) */}
          <div className={`absolute ${isRtl ? 'left-2' : 'right-2'} top-2 flex items-center gap-1`}>
            {searchQuery.length > 0 && (
              <>
                <span className="text-[10px] font-bold text-[#075e54] bg-[#e7f7ef] border border-[#128c7e]/30 px-1.5 py-0.5 rounded">
                  {filteredCustomers.length}
                </span>
                <button
                  type="button"
                  id="clearSearchQueryBtn"
                  onClick={() => {
                    handleQueryChange('');
                    setIsFocused(false);
                  }}
                  className="w-4.5 h-4.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center text-[10px] cursor-pointer transition-colors"
                  title={isRtl ? 'صاف کریں' : 'Clear'}
                >
                  ✕
                </button>
              </>
            )}
          </div>
        </div>

        {showSearchButton && (
          <button 
            id="searchSubmitBtn"
            type="button"
            onClick={handleSubmit}
            className="glow-button glow-emerald bg-[#075e54] hover:bg-[#054c44] text-white px-3.5 h-[38px] sm:h-[40px] rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center gap-1 shrink-0 transition-all cursor-pointer active:scale-95"
          >
            <span>{isRtl ? 'تلاش' : 'Search'}</span>
          </button>
        )}
      </div>

      {/* سجیشن لسٹ جو صرف اس وقت نظر آئے گی جب یوزر کچھ ٹائپ کرے گا، اس سے فالتو جگہ نہیں گھیرے گی */}
      {isFocused && searchQuery.trim().length > 0 && (
        <div 
          id="customer-suggestions-container"
          className="absolute top-[50px] left-0 right-0 bg-white rounded-xl border border-slate-300 max-h-[200px] overflow-y-auto shadow-2xl z-50 divide-y divide-slate-100 animate-in fade-in duration-100"
        >
          {/* پچھلی تلاشیں (اگر مماثل ہوں) */}
          {matchingHistory.length > 0 && (
            <div className="p-1.5 bg-slate-50/80">
              <div className="flex items-center justify-between px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>{isRtl ? 'پچھلی تلاش' : 'Recent Searches'}</span>
                {onClearHistory && (
                  <button 
                    type="button"
                    onClick={onClearHistory}
                    className="text-slate-400 hover:text-rose-600 text-[10px] cursor-pointer"
                  >
                    {isRtl ? 'صاف کریں' : 'Clear'}
                  </button>
                )}
              </div>
              {matchingHistory.map(item => (
                <div
                  key={item}
                  onClick={() => {
                    handleQueryChange(item);
                    handleSubmit();
                  }}
                  className="flex items-center justify-between px-2.5 py-1 rounded hover:bg-slate-100 text-xs text-slate-700 cursor-pointer"
                >
                  <span className="truncate">🕒 {item}</span>
                  {onRemoveHistoryItem && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveHistoryItem(item);
                      }}
                      className="text-slate-300 hover:text-rose-500 text-xs p-0.5"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* کسٹمر سجیشنز */}
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((item) => (
              <div
                key={item.id}
                id={`suggestion-item-${item.id}`}
                onClick={() => {
                  onSelectCustomer(item);
                  handleQueryChange(item.name); // نام سلیکٹ کرنے کے بعد بار میں آ جائے گا
                  setIsFocused(false); // لسٹ غائب ہو جائے گی تاکہ جگہ نہ گھیرے
                }}
                className="p-3 flex items-center justify-between hover:bg-emerald-50/80 active:bg-emerald-100 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 group-hover:bg-emerald-200 text-emerald-900 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                    {(item.name || 'G').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[15px] font-bold text-slate-800 group-hover:text-emerald-950 truncate">
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-slate-500 font-mono" dir="ltr">
                    {item.phone}
                  </span>
                  <span className="text-[11px] bg-[#075e54] text-white px-2 py-0.5 rounded-md font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {isRtl ? 'سلپ کھولیں' : 'Open'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div 
              id="noCustomerResult"
              onClick={() => {
                if (onAddNewCustomer) {
                  onAddNewCustomer(searchQuery);
                  setIsFocused(false);
                }
              }}
              className={`p-3.5 text-center ${
                onAddNewCustomer 
                  ? 'cursor-pointer hover:bg-amber-50 text-amber-900 transition-colors' 
                  : 'text-slate-500'
              }`}
            >
              <p className="text-sm font-semibold">
                {isRtl 
                  ? 'کوئی گاہک نہیں ملا۔ نیا شامل کرنے کے لیے یہاں کلک کریں۔' 
                  : 'No customer found. Tap to add new.'}
              </p>
              {onAddNewCustomer && (
                <span className="inline-block mt-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                  ➕ {isRtl ? `"${searchQuery}" کا نیا ناپ درج کریں` : `Add "${searchQuery}" as New Customer`}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSearchComponent;
