import React, { useState, useMemo } from 'react';
import { allCountries, CountryData } from '../data/countries';

interface CountrySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCode: string;
  onSelect: (country: CountryData) => void;
  isRtl?: boolean;
}

export const CountrySelectorModal: React.FC<CountrySelectorModalProps> = ({
  isOpen,
  onClose,
  selectedCode,
  onSelect,
  isRtl = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCountries = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return allCountries;

    return allCountries.filter(c => {
      const matchName = c.name.toLowerCase().includes(term);
      const matchUrdu = c.nameUr ? c.nameUr.includes(term) : false;
      const matchCode = c.code.toLowerCase().includes(term) || c.code.replace('+', '').includes(term);
      const matchIso = c.iso.toLowerCase().includes(term);
      return matchName || matchUrdu || matchCode || matchIso;
    });
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div 
      id="countryModal"
      className="fixed inset-0 bg-[#062c1d]/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-150"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div 
        id="country-selector-dialog"
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
          <div className="text-left rtl:text-right">
            <h3 className="font-bold text-sm">
              {isRtl ? 'ملک منتخب کریں (Country Code)' : 'Select Country & Dialing Code'}
            </h3>
            <p className="text-[10px] text-emerald-200">
              {isRtl ? 'تمام بین الاقوامی ممالک اور کالنگ کوڈز' : 'All International Countries & Codes'}
            </p>
          </div>
          <button 
            type="button"
            id="btn-close-country-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center hover:bg-emerald-600 text-white cursor-pointer transition-colors shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Search Box */}
        <div className="p-3 border-b border-slate-100 bg-slate-50">
          <input 
            type="text" 
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRtl ? "ملک کا نام یا کوڈ تلاش کریں (مثال: +92, Pakistan)" : "Search country or dialing code (+92, Pakistan...)"}
            className={`w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-emerald-600 bg-white text-slate-800 ${isRtl ? 'text-right' : 'text-left'}`}
          />
        </div>

        {/* Country List (Scrollable - Clean Format) */}
        <div className="overflow-y-auto p-2 space-y-1 flex-1 text-left" dir="ltr">
          {filteredCountries.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <p>🔍 {isRtl ? 'کوئی ملک نہیں ملا۔' : 'No country found.'}</p>
            </div>
          ) : (
            filteredCountries.map((c) => {
              const isSelected = c.code === selectedCode;
              return (
                <div 
                  key={`${c.iso}-${c.code}`}
                  id={`country-item-${c.iso.toLowerCase()}`}
                  onClick={() => {
                    onSelect(c);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-3 hover:bg-slate-50 active:bg-slate-100 rounded-xl cursor-pointer border-b border-slate-50 transition-colors ${
                    isSelected ? 'bg-emerald-50/70 font-semibold' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl leading-none shrink-0">{c.flag}</span>
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {c.name} {c.nameUr ? `(${c.nameUr})` : ''}
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                    isSelected 
                      ? 'text-emerald-700 bg-emerald-100/80' 
                      : 'text-slate-600 bg-slate-100'
                  }`}>
                    {c.code}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <span className="text-[10px] text-slate-400 font-medium">
            {filteredCountries.length} {isRtl ? 'ممالک دستیاب ہیں' : 'countries available'}
          </span>
        </div>

      </div>
    </div>
  );
};

