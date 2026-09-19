import { OrderStatus } from '../types';

/**
 * Parses various date formats (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY) into a Date object
 */
export function parseDateSafe(str?: string): Date | null {
  if (!str) return null;
  const trimmed = str.trim();
  if (!trimmed) return null;

  // Format: YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(trimmed)) {
    const parts = trimmed.split(/[\/\-]/).map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  // Format: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}/.test(trimmed)) {
    const parts = trimmed.split(/[\/\-\.]/).map(Number);
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a date into standard HTML input format (YYYY-MM-DD)
 */
export function toInputDateFormat(dateOrStr?: Date | string | null): string {
  if (!dateOrStr) return '';
  const d = dateOrStr instanceof Date ? dateOrStr : parseDateSafe(dateOrStr);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date into friendly display format (DD/MM/YYYY)
 */
export function toDisplayDateFormat(dateOrStr?: Date | string | null): string {
  if (!dateOrStr) return '';
  const d = dateOrStr instanceof Date ? dateOrStr : parseDateSafe(dateOrStr);
  if (!d) return typeof dateOrStr === 'string' ? dateOrStr : '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Returns date offset by X days in YYYY-MM-DD format
 */
export function getOffsetDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return toInputDateFormat(d);
}

export type DeliveryStatus = 'today' | 'late' | 'upcoming' | 'delivered' | 'none';

/**
 * Evaluates the delivery urgency of an order
 */
export function getDeliveryStatus(deliveryDate?: string, status?: OrderStatus): DeliveryStatus {
  if (!deliveryDate || !deliveryDate.trim()) return 'none';
  if (status === 'delivered') return 'delivered';

  const d = parseDateSafe(deliveryDate);
  if (!d) return 'none';

  const now = new Date();
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (dDay === today) {
    return 'today';
  } else if (dDay < today) {
    return 'late';
  } else {
    return 'upcoming';
  }
}

export function isDeliveryToday(deliveryDate?: string, status?: OrderStatus): boolean {
  return getDeliveryStatus(deliveryDate, status) === 'today';
}

export function isDeliveryLate(deliveryDate?: string, status?: OrderStatus): boolean {
  return getDeliveryStatus(deliveryDate, status) === 'late';
}
