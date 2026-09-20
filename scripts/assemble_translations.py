#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from langs_part1 import ur, sd, ar, fa, ps
from langs_part2 import hi, pa, bn, tr, es, fr, de
from langs_part3 import it, ru, zh, ja, ko, ms, id, pt, th, en

all_langs = {
    'ur': ur,
    'sd': sd,
    'ar': ar,
    'en': en,
    'hi': hi,
    'fa': fa,
    'ps': ps,
    'pa': pa,
    'bn': bn,
    'tr': tr,
    'es': es,
    'fr': fr,
    'de': de,
    'it': it,
    'ru': ru,
    'zh': zh,
    'ja': ja,
    'ko': ko,
    'ms': ms,
    'id': id,
    'pt': pt,
    'th': th,
}

base_keys = sorted(list(en.keys()))
print(f"Total base keys in English: {len(base_keys)}")

# Verify all 22 languages and fill any missing keys with English
verified_langs = {}
for code, lang_dict in all_langs.items():
    verified = {}
    missing_count = 0
    for key in base_keys:
        if key in lang_dict and lang_dict[key] and str(lang_dict[key]).strip():
            verified[key] = lang_dict[key]
        else:
            verified[key] = en[key]
            missing_count += 1
    verified_langs[code] = verified
    print(f"Language {code}: total keys = {len(verified)}, missing/fallback to EN = {missing_count}")

# Generate src/data/translations.ts
output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src', 'data', 'translations.ts')

ts_content = []
ts_content.append("// Generated complete 22-language translation catalog")
ts_content.append("import { SupportedLanguage } from '../types';\n")
ts_content.append("""export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  isRtl: boolean;
  flag: string;
}

export const languageList: LanguageMeta[] = [
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', isRtl: true, flag: '🇵🇰' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', isRtl: true, flag: '🇵🇰' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRtl: true, flag: '🇸🇦' },
  { code: 'en', name: 'English', nativeName: 'English', isRtl: false, flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isRtl: false, flag: '🇮🇳' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', isRtl: true, flag: '🇮🇷' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', isRtl: true, flag: '🇦🇫' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ / پنجابی', isRtl: false, flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', isRtl: false, flag: '🇧🇩' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', isRtl: false, flag: '🇹🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', isRtl: false, flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', isRtl: false, flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', isRtl: false, flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', isRtl: false, flag: '🇮🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', isRtl: false, flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', isRtl: false, flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', isRtl: false, flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', isRtl: false, flag: '🇰🇷' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', isRtl: false, flag: '🇲🇾' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', isRtl: false, flag: '🇮🇩' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', isRtl: false, flag: '🇵🇹' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', isRtl: false, flag: '🇹🇭' }
];
""")

# TranslationDictionary interface
ts_content.append("export interface TranslationDictionary {")
for k in base_keys:
    ts_content.append(f"  {k}: string;")
ts_content.append("}\n")

# Translations object
ts_content.append("export const translations: Record<SupportedLanguage, TranslationDictionary> = {")

for code in ['ur', 'sd', 'ar', 'en', 'hi', 'fa', 'ps', 'pa', 'bn', 'tr', 'es', 'fr', 'de', 'it', 'ru', 'zh', 'ja', 'ko', 'ms', 'id', 'pt', 'th']:
    d = verified_langs[code]
    ts_content.append(f"  {code}: {{")
    for k in base_keys:
        val = json.dumps(d[k], ensure_ascii=False)
        ts_content.append(f"    {k}: {val},")
    ts_content.append("  },")

ts_content.append("};\n")

# RTL Language list helper export
ts_content.append("""export const RTL_LANGUAGES: SupportedLanguage[] = ['ur', 'sd', 'ar', 'fa', 'ps'];

export function getLanguageDirection(lang: SupportedLanguage): 'rtl' | 'ltr' {
  return RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
}
""")

with open(output_path, 'w', encoding='utf-8') as f:
    f.write("\n".join(ts_content))

print(f"Successfully generated {output_path}!")
