import React, { useState } from 'react';
import { Customer, OrderStatus } from '../types';
import { ChevronDown, ChevronUp, Clock, Eye, Edit3, Calendar } from 'lucide-react';
import { getStatusMeta, getLocalizedStatusLabel } from '../utils/orderStatus';
import { isDeliveryToday, isDeliveryLate } from '../utils/deliveryDate';
import { TranslationDictionary } from '../data/translations';

interface RecentOrdersQuickViewProps {
  customers: Customer[];
  onOpenSlip?: (customer: Customer) => void;
  onSelectOrder?: (customer: Customer) => void;
  onEditCustomer?: (customer: Customer) => void;
  isRtl: boolean;
  translations?: TranslationDictionary;
}

export const RecentOrdersQuickView: React.FC<RecentOrdersQuickViewProps> = ({
  customers,
  onOpenSlip,
  onSelectOrder,
  onEditCustomer,
  isRtl,
  translations,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (customer: Customer) => {
    if (onOpenSlip) {
      onOpenSlip(customer);
    } else if (onSelectOrder) {
      onSelectOrder(customer);
    }
  };

  // Take the most recent 6 orders
  const recentOrders = customers.slice(0, 6);

  if (customers.length === 0) {
    return null;
  }

  const titleText = translations?.recentOrders || (isRtl ? 'حالیہ آرڈرز (کوئیک ویو)' : 'Recent Orders (Quick-View)');
  const latestCountText = translations?.recentOrdersCount || (isRtl ? 'تازہ ترین' : 'Latest');
  const showText = translations?.show || (isRtl ? 'دیکھیں' : 'Show');
  const hideText = translations?.hide || (isRtl ? 'چھپائیں' : 'Hide');
  const defaultCustomerName = translations?.unnamedCustomer || (isRtl ? 'محترم گاہک' : 'Customer');
  const lateLabel = translations?.lateOrders || (isRtl ? 'تاخیر شدہ' : 'Late');
  const todayLabel = translations?.todayDelivery || (isRtl ? 'آج کی ڈیلیوری' : 'Today');
  const slipBtnLabel = translations?.openSlip || (isRtl ? 'سلپ' : 'Slip');
  const editBtnLabel = translations?.editMode || (isRtl ? 'ایڈٹ' : 'Edit');

  return (
    <div
      id="recent-orders-quickview-container"
      className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs transition-all duration-200"
    >
      {/* Collapsible Header Bar */}
      <button
        type="button"
        id="recent-orders-toggle-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer text-left rtl:text-right"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-[#075e54] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#25d366]" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-slate-800 truncate">{titleText}</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#e7f7ef] text-[#075e54] border border-[#128c7e]/25 shrink-0">
              {recentOrders.length} {latestCountText}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#075e54] shrink-0">
          <span className="text-[11px] font-medium hidden sm:inline">
            {isOpen ? hideText : showText}
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-[#075e54]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#075e54]" />
          )}
        </div>
      </button>

      {/* Collapsible Content: Horizontal Ribbon */}
      {isOpen && (
        <div
          id="recent-orders-content"
          className="p-3 bg-slate-50/70 border-t border-slate-200 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
            {recentOrders.map((order) => {
              const status: OrderStatus = order.status || 'pending';
              const statusMeta = getStatusMeta(status);
              const isLate = isDeliveryLate(order.deliveryDate, status);
              const isToday = isDeliveryToday(order.deliveryDate, status);
              const localizedStatus = getLocalizedStatusLabel(status, translations as unknown as Record<string, string>);

              return (
                <div
                  key={order.id}
                  id={`recent-order-card-${order.id}`}
                  className="min-w-[210px] max-w-[230px] shrink-0 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Name & Status */}
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <h4 className="text-xs font-black text-slate-900 truncate" title={order.name}>
                        {order.name || defaultCustomerName}
                      </h4>
                      <span className="text-[10px] shrink-0 px-1.5 py-0.2 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {statusMeta.icon} {localizedStatus}
                      </span>
                    </div>

                    {/* Phone & Date */}
                    <div className="text-[10.5px] text-slate-500 space-y-0.5 mb-2">
                      <p className="truncate" dir="ltr">
                        {order.phone || 'No phone'}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{order.date}</span>
                        {order.deliveryDate && (
                          <span className="text-emerald-700 font-bold">
                            • 🚀 {order.deliveryDate}
                          </span>
                        )}
                      </div>
                      {isLate && (
                        <span className="inline-block text-[9.5px] font-black bg-rose-100 text-rose-800 px-1 py-0.2 rounded">
                          ⚠️ {lateLabel}
                        </span>
                      )}
                      {isToday && (
                        <span className="inline-block text-[9.5px] font-black bg-amber-100 text-amber-900 px-1 py-0.2 rounded">
                          ⚡ {todayLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleSelect(order)}
                      className="flex-1 py-1 px-2 rounded-md bg-[#075e54] hover:bg-[#054c44] text-white text-[10.5px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title={slipBtnLabel}
                    >
                      <Eye className="w-3 h-3" />
                      <span>{slipBtnLabel}</span>
                    </button>
                    {onEditCustomer && (
                      <button
                        type="button"
                        onClick={() => onEditCustomer(order)}
                        className="py-1 px-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-200"
                        title={editBtnLabel}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{editBtnLabel}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentOrdersQuickView;
