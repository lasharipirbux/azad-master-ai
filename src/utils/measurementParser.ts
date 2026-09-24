import { CustomerMeasurements } from '../types';

// Convert eastern Arabic / Urdu numerals to western digits, and map common spoken Urdu numbers
export function normalizeNumerals(str: string): string {
  const urduDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(urduDigits[i], i.toString());
  }

  // Common spoken compound fractions in tailoring (e.g. ساڑھے 40 -> 40.5, سوا 40 -> 40.25, پونے 40 -> 39.75)
  res = res.replace(/ساڑھے\s*([0-9]+)/g, '$1.5');
  res = res.replace(/سوا\s*([0-9]+)/g, '$1.25');
  res = res.replace(/پونے\s*([0-9]+)/g, (_, n) => (parseFloat(n) - 0.25).toString());
  res = res.replace(/([0-9]+)\s*اور\s*آدھا/g, '$1.5');
  res = res.replace(/([0-9]+)\s*آدھا/g, '$1.5');

  // Spoken Urdu number words mapped to digits
  const wordMap: [RegExp, string][] = [
    [/پچاس/g, '50'], [/انچاس/g, '49'], [/اڑتالیس/g, '48'], [/سینتالیس/g, '47'], [/چھیالیس/g, '46'],
    [/پینتالیس/g, '45'], [/چوالیس/g, '44'], [/تینتالیس/g, '43'], [/بیالیس/g, '42'], [/اکتالیس/g, '41'],
    [/چالیس/g, '40'], [/انتالیس/g, '39'], [/اڑتیس/g, '38'], [/سینتیس/g, '37'], [/چھتیس/g, '36'],
    [/پینتیس/g, '35'], [/چونتیس/g, '34'], [/تینتیس/g, '33'], [/بتیس/g, '32'], [/اکتیس/g, '31'],
    [/تیس/g, '30'], [/انتیس/g, '29'], [/اٹھائیس/g, '28'], [/ستائیس/g, '27'], [/چھبیس/g, '26'],
    [/پچیس/g, '25'], [/چوبیس/g, '24'], [/تئیس/g, '23'], [/بائیس/g, '22'], [/اکیس/g, '21'],
    [/بیس/g, '20'], [/انیس/g, '19'], [/اٹھارہ/g, '18'], [/سترہ/g, '17'], [/سولہ/g, '16'],
    [/پندرہ/g, '15'], [/چودہ/g, '14'], [/بارہ/g, '12'], [/گیارہ/g, '11'], [/دس/g, '10'],
    [/نو/g, '9'], [/آٹھ/g, '8'], [/سات/g, '7'], [/چھ/g, '6'], [/پانچ/g, '5'], [/چار/g, '4'], [/تین/g, '3'], [/دو/g, '2']
  ];

  for (const [re, replacement] of wordMap) {
    res = res.replace(re, replacement);
  }

  // After replacing words, evaluate any leftover "ساڑھے 40" pattern
  res = res.replace(/ساڑھے\s*([0-9]+)/g, '$1.5');
  res = res.replace(/سوا\s*([0-9]+)/g, '$1.25');

  return res;
}

export type StandardMeasurementKey = 
  | 'length' 
  | 'shoulder' 
  | 'sleeves' 
  | 'chest' 
  | 'waist' 
  | 'daaman' 
  | 'collar' 
  | 'shalwar' 
  | 'pancha' 
  | 'pocket' 
  | 'specialNotes';

export function parseMeasurementsFromText(input: string): Partial<CustomerMeasurements> | null {
  if (!input || typeof input !== 'string') return null;

  const normalized = normalizeNumerals(input).toLowerCase();
  const found: Partial<CustomerMeasurements> = {};

  // Patterns for each field
  const patterns: { key: StandardMeasurementKey; regex: RegExp[] }[] = [
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
