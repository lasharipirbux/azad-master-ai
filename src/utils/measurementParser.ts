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

export interface MeasurementConflict {
  key: StandardMeasurementKey;
  labelUrdu: string;
  labelEnglish: string;
  values: string[];
  chosen: string;
}

export interface DetailedMeasurementResult {
  measurements: Partial<CustomerMeasurements>;
  conflicts: MeasurementConflict[];
}

const MEASUREMENT_METADATA: Record<StandardMeasurementKey, { labelUrdu: string; labelEnglish: string }> = {
  length: { labelUrdu: 'لمبائی', labelEnglish: 'Length' },
  shoulder: { labelUrdu: 'تیرا', labelEnglish: 'Shoulder (Teera)' },
  sleeves: { labelUrdu: 'بازو', labelEnglish: 'Sleeves' },
  chest: { labelUrdu: 'سینہ / چھاتی', labelEnglish: 'Chest' },
  waist: { labelUrdu: 'کمر', labelEnglish: 'Waist' },
  daaman: { labelUrdu: 'گھیرا / دامن', labelEnglish: 'Daaman (Gheer)' },
  collar: { labelUrdu: 'کالر / بین', labelEnglish: 'Collar (Ban)' },
  shalwar: { labelUrdu: 'شلوار لمبائی', labelEnglish: 'Shalwar Length' },
  pancha: { labelUrdu: 'پانچہ', labelEnglish: 'Pancha' },
  pocket: { labelUrdu: 'جیب', labelEnglish: 'Pocket' },
  specialNotes: { labelUrdu: 'نوٹ', labelEnglish: 'Notes' }
};

export function parseMeasurementsWithDetails(input: string): DetailedMeasurementResult {
  if (!input || typeof input !== 'string') {
    return { measurements: {}, conflicts: [] };
  }

  const normalized = normalizeNumerals(input).toLowerCase();
  const found: Partial<CustomerMeasurements> = {};
  const conflicts: MeasurementConflict[] = [];

  // Patterns for each field
  const patterns: { key: StandardMeasurementKey; regex: RegExp[] }[] = [
    {
      key: 'length',
      regex: [
        /(?:لمبائی|لمبائ|lambai|length|ڊيگهه|لمبائي)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)/gi,
        /([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)\s*(?:انچ\s*)?(?:لمبائی|lambai|length|ڊيگهه)/gi
      ]
    },
    {
      key: 'shoulder', // تیرا
      regex: [
        /(?:تیرا|تیرہ|tira|teera|shoulder|ٽيرو|तीरा)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)/gi,
        /([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)\s*(?:انچ\s*)?(?:تیرا|tira|teera|shoulder|ٽيرو)/gi
      ]
    },
    {
      key: 'sleeves', // بازو
      regex: [
        /(?:بازو|بازوں|bazo|bazu|sleeve|sleeves|ٻانهن|बाजू)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)/gi,
        /([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)\s*(?:انچ\s*)?(?:بازو|bazo|bazu|sleeve|sleeves|ٻانهن)/gi
      ]
    },
    {
      key: 'chest', // سینہ / چھاتی
      regex: [
        /(?:سینہ|چھاتی|seena|chest|ڇاتي|सीना)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)/gi,
        /([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)\s*(?:انچ\s*)?(?:سینہ|چھاتی|seena|chest|ڇاتي)/gi
      ]
    },
    {
      key: 'daaman', // گھیرا / دامن
      regex: [
        /(?:گھیرا|گھیراؤ|دامن|gheera|ghera|daaman|daman|घेरा)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)/gi,
        /([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)\s*(?:انچ\s*)?(?:گھیرا|gheera|ghera|daaman|daman)/gi
      ]
    },
    {
      key: 'collar', // کالر / بین
      regex: [
        /(?:کالر|بین|بین\s*کالر|collar|ban|bain|ڪالر|कॉलर|बैन)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)/gi,
        /([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)\s*(?:انچ\s*)?(?:کالر|بین|collar|ban|bain|ڪالر)/gi
      ]
    },
    {
      key: 'shalwar', // شلوار
      regex: [
        /(?:شلوار\s*لمبائی|شلوار|shalwar\s*length|shalwar|salwar|trouser|سٿڻ|सलوار)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)/gi,
        /([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)\s*(?:انچ\s*)?(?:شلوار|shalwar|salwar|سٿڻ)/gi
      ]
    },
    {
      key: 'pancha', // پانچہ
      regex: [
        /(?:پانچہ|پائنچہ|پانچا|pancha|paancha|poncha|paincha|پانچو|पाँचा)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)/gi,
        /([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)\s*(?:انچ\s*)?(?:پانچہ|pancha|paancha|poncha|پانچو)/gi
      ]
    },
    {
      key: 'waist', // کمر
      regex: [
        /(?:کمر|waist|kamar|ڪمر)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)/gi,
        /([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/[248])?)\s*(?:انچ\s*)?(?:کمر|waist|kamar|ڪمر)/gi
      ]
    }
  ];

  for (const item of patterns) {
    const matchedNumbers: string[] = [];

    for (const r of item.regex) {
      const matches = [...normalized.matchAll(r)];
      for (const m of matches) {
        if (m && m[1]) {
          const val = m[1].trim();
          if (val && !matchedNumbers.includes(val)) {
            matchedNumbers.push(val);
          }
        }
      }
    }

    if (matchedNumbers.length > 0) {
      // RULE: Always treat the LAST mentioned number as the true intended value (not the first)
      const lastValue = matchedNumbers[matchedNumbers.length - 1];
      found[item.key] = lastValue;

      // Check if different distinct numbers were spoken for the same measurement
      if (matchedNumbers.length > 1) {
        const meta = MEASUREMENT_METADATA[item.key] || { labelUrdu: item.key, labelEnglish: item.key };
        conflicts.push({
          key: item.key,
          labelUrdu: meta.labelUrdu,
          labelEnglish: meta.labelEnglish,
          values: matchedNumbers,
          chosen: lastValue
        });
      }
    }
  }

  return { measurements: found, conflicts };
}

export function parseMeasurementsFromText(input: string): Partial<CustomerMeasurements> | null {
  const result = parseMeasurementsWithDetails(input);
  return Object.keys(result.measurements).length > 0 ? result.measurements : null;
}
