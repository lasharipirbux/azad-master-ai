import { Customer, CustomerMeasurements } from '../types';

/**
 * Downloads full JSON backup file of all customer measurements and records
 */
export function exportCustomersToJson(customers: Customer[], fileNamePrefix = 'azad_master_backup'): boolean {
  try {
    if (!customers || customers.length === 0) {
      return false;
    }

    const payload = {
      app: "Azad Master (آزاد ماسٹر)",
      version: "1.0",
      exportDate: new Date().toISOString(),
      formattedDate: new Date().toLocaleString(),
      totalRecords: customers.length,
      customers: customers
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const dateStamp = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileNamePrefix}_${dateStamp}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error("Export to JSON failed:", err);
    return false;
  }
}

/**
 * Downloads Excel/CSV compatible spreadsheet with UTF-8 BOM for flawless Urdu/English rendering in MS Excel
 */
export function exportCustomersToExcelCsv(customers: Customer[], isRtl = true, fileNamePrefix = 'azad_master_customers_excel'): boolean {
  try {
    if (!customers || customers.length === 0) {
      return false;
    }

    // CSV Header row
    const headers = [
      isRtl ? 'سیریل نمبر (ID)' : 'Serial ID',
      isRtl ? 'گاہک کا نام' : 'Customer Name',
      isRtl ? 'موبائل نمبر' : 'Phone Number',
      isRtl ? 'تاریخ اندراج' : 'Booking Date',
      isRtl ? 'ڈیلیوری تاریخ' : 'Delivery Date',
      isRtl ? 'اسٹیٹس' : 'Status',
      isRtl ? 'کل رقم' : 'Total Amount',
      isRtl ? 'پیشگی (ایڈوانس)' : 'Advance',
      isRtl ? 'بقایا رقم' : 'Balance',
      isRtl ? 'لمبائی' : 'Length',
      isRtl ? 'تیرہ' : 'Shoulder (Teera)',
      isRtl ? 'بازو' : 'Sleeves',
      isRtl ? 'چھاتی' : 'Chest',
      isRtl ? 'کمر' : 'Waist',
      isRtl ? 'گھیر / دامن' : 'Daaman (Gheer)',
      isRtl ? 'کالر / بین' : 'Collar (Ban)',
      isRtl ? 'شلوار لمبائی' : 'Shalwar Length',
      isRtl ? 'پانچا' : 'Pancha',
      isRtl ? 'خاص ہدایات / نوٹ' : 'Special Notes'
    ];

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows: string[] = [];
    rows.push(headers.map(escapeCsv).join(','));

    customers.forEach((c, idx) => {
      const m = (c.measurementsObj || {}) as Partial<CustomerMeasurements>;
      const statusLabel = 
        c.status === 'delivered' ? (isRtl ? 'مکمل / ڈیلیورڈ' : 'Delivered') :
        c.status === 'ready' ? (isRtl ? 'تیار' : 'Ready') :
        c.status === 'stitching' ? (isRtl ? 'سلائی جاری' : 'Stitching') :
        c.status === 'cutting' ? (isRtl ? 'کٹنگ مکمل' : 'Cutting') :
        (isRtl ? 'زیر التواء' : 'Pending');

      const row = [
        c.id || idx + 1,
        c.name || (isRtl ? 'محترم گاہک' : 'Customer'),
        c.phone || '',
        c.date || '',
        c.deliveryDate || '',
        statusLabel,
        c.totalAmount || '0',
        c.advanceAmount || '0',
        c.balanceAmount || '0',
        m.length || '',
        m.shoulder || '',
        m.sleeves || '',
        m.chest || '',
        m.waist || '',
        m.daaman || '',
        m.collar || '',
        m.shalwar || '',
        m.pancha || '',
        c.notes || m.specialNotes || c.details || ''
      ];

      rows.push(row.map(escapeCsv).join(','));
    });

    const csvContent = rows.join('\r\n');
    // Prepend UTF-8 BOM (\uFEFF) so Excel parses Urdu Nastaliq & UTF-8 perfectly
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const dateStamp = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileNamePrefix}_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error("Export to Excel/CSV failed:", err);
    return false;
  }
}

/**
 * Parses and validates an uploaded backup file
 */
export async function parseBackupFile(file: File): Promise<Customer[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        let list: Customer[] = [];
        if (Array.isArray(parsed)) {
          list = parsed;
        } else if (parsed && Array.isArray(parsed.customers)) {
          list = parsed.customers;
        }
        
        // Sanitize and validate items
        const sanitized = list.filter((item): item is Customer => {
          return item && typeof item === 'object' && (Boolean(item.name) || Boolean(item.id) || Boolean(item.phone));
        });

        resolve(sanitized);
      } catch (err) {
        reject(new Error("Invalid backup file format. Please select a valid JSON backup."));
      }
    };
    reader.onerror = () => reject(new Error("Could not read backup file."));
    reader.readAsText(file);
  });
}
