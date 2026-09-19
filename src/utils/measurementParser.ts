import { CustomerMeasurements } from '../types';

// Convert eastern Arabic / Urdu numerals to western digits if present
export function normalizeNumerals(str: string): string {
  const urduDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(urduDigits[i], i.toString());
  }
  return res;
}

export function parseMeasurementsFromText(input: string): Partial<CustomerMeasurements> | null {
  if (!input || typeof input !== 'string') return null;

  const normalized = normalizeNumerals(input).toLowerCase();
  const found: Partial<CustomerMeasurements> = {};

  // Patterns for each field
  const patterns: { key: keyof CustomerMeasurements; regex: RegExp[] }[] = [
    {
      key: 'length',
      regex: [
        /(?:لمبائی|لمبائ|lambai|length)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)/i,
        /([0-9]+(?:\.[0-9]+)?)\s*(?:انچ\s*)?(?:لمبائی|lambai|length)/i
      ]
    },
    {
      key: 'shoulder', // تیرا
      regex: [
        /(?:تیرا|تیرہ|tira|teera|shoulder)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)/i,
        /([0-9]+(?:\.[0-9]+)?)\s*(?:انچ\s*)?(?:تیرا|tira|shoulder)/i
      ]
    },
    {
      key: 'sleeves', // بازو
      regex: [
        /(?:بازو|بازوں|bazo|bazu|sleeve|sleeves)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)/i,
        /([0-9]+(?:\.[0-9]+)?)\s*(?:انچ\s*)?(?:بازو|bazo|sleeve)/i
      ]
    },
    {
      key: 'chest', // سینہ
      regex: [
        /(?:سینہ|چھاتی|seena|chest)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)/i,
        /([0-9]+(?:\.[0-9]+)?)\s*(?:انچ\s*)?(?:سینہ|seena|chest)/i
      ]
    },
    {
      key: 'daaman', // گھیرا
      regex: [
        /(?:گھیرا|گھیراؤ|دامن|gheera|ghera|daaman|daman)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)/i,
        /([0-9]+(?:\.[0-9]+)?)\s*(?:انچ\s*)?(?:گھیرا|gheera|daaman)/i
      ]
    },
    {
      key: 'collar', // کالر / بین
      regex: [
        /(?:کالر|بین|بین کالر|collar|ban|bain)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)/i,
        /([0-9]+(?:\.[0-9]+)?)\s*(?:انچ\s*)?(?:کالر|بین|collar|ban)/i
      ]
    },
    {
      key: 'shalwar', // شلوار
      regex: [
        /(?:شلوار\s*لمبائی|شلوار|shalwar\s*length|shalwar|salwar|trouser)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)/i,
        /([0-9]+(?:\.[0-9]+)?)\s*(?:انچ\s*)?(?:شلوار|shalwar)/i
      ]
    },
    {
      key: 'pancha', // پانچہ
      regex: [
        /(?:پانچہ|پائنچہ|پانچا|pancha|poncha|paincha)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)/i,
        /([0-9]+(?:\.[0-9]+)?)\s*(?:انچ\s*)?(?:پانچہ|pancha)/i
      ]
    },
    {
      key: 'waist', // کمر
      regex: [
        /(?:کمر|waist|kamar)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)/i,
        /([0-9]+(?:\.[0-9]+)?)\s*(?:انچ\s*)?(?:کمر|waist)/i
      ]
    }
  ];

  let matchedCount = 0;

  for (const item of patterns) {
    for (const r of item.regex) {
      const match = normalized.match(r);
      if (match && match[1]) {
        found[item.key] = match[1].trim();
        matchedCount++;
        break;
      }
    }
  }

  return matchedCount > 0 ? found : null;
}
