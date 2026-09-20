import { OrderStatus } from '../types';

export interface StatusMeta {
  id: OrderStatus;
  labelUrdu: string;
  labelEn: string;
  shortUrdu: string;
  icon: string;
  badgeClass: string;
  borderClass: string;
  bgLight: string;
  dotColor: string;
}

export const ORDER_STATUS_LIST: OrderStatus[] = ['pending', 'cutting', 'stitching', 'ready', 'delivered'];

export const ORDER_STATUSES: Record<OrderStatus, StatusMeta> = {
  pending: {
    id: 'pending',
    labelUrdu: 'زیرِ کار (Pending)',
    labelEn: 'Pending',
    shortUrdu: 'زیرِ کار',
    icon: '⏳',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    borderClass: 'border-amber-400',
    bgLight: 'bg-amber-50',
    dotColor: 'bg-amber-500'
  },
  cutting: {
    id: 'cutting',
    labelUrdu: 'کٹنگ (Cutting)',
    labelEn: 'Cutting',
    shortUrdu: 'کٹنگ',
    icon: '✂️',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    borderClass: 'border-sky-400',
    bgLight: 'bg-sky-50',
    dotColor: 'bg-sky-500'
  },
  stitching: {
    id: 'stitching',
    labelUrdu: 'سلائی جاری (Stitching)',
    labelEn: 'Stitching',
    shortUrdu: 'سلائی',
    icon: '🧵',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    borderClass: 'border-indigo-400',
    bgLight: 'bg-indigo-50',
    dotColor: 'bg-indigo-500'
  },
  ready: {
    id: 'ready',
    labelUrdu: 'تیار ہے (Ready)',
    labelEn: 'Ready',
    shortUrdu: 'تیار',
    icon: '🟢',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    borderClass: 'border-emerald-500',
    bgLight: 'bg-emerald-50',
    dotColor: 'bg-emerald-500'
  },
  delivered: {
    id: 'delivered',
    labelUrdu: 'حوالے کر دیا (Delivered)',
    labelEn: 'Delivered',
    shortUrdu: 'حوالے',
    icon: '✅',
    badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
    borderClass: 'border-slate-400',
    bgLight: 'bg-slate-100',
    dotColor: 'bg-slate-500'
  }
};

export const getStatusMeta = (status?: string): StatusMeta => {
  if (status && status in ORDER_STATUSES) {
    return ORDER_STATUSES[status as OrderStatus];
  }
  return ORDER_STATUSES.pending;
};

export const getLocalizedStatusLabel = (status: OrderStatus, t?: Record<string, string>): string => {
  if (t) {
    if (status === 'pending' && t.statusPending) return t.statusPending;
    if (status === 'cutting' && t.statusCutting) return t.statusCutting;
    if (status === 'stitching' && t.statusStitching) return t.statusStitching;
    if (status === 'ready' && t.statusReady) return t.statusReady;
    if (status === 'delivered' && t.statusDelivered) return t.statusDelivered;
  }
  const meta = ORDER_STATUSES[status];
  return meta ? meta.labelEn : status;
};
