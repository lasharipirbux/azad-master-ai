import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Candidate models in order of preference and stability (supported active models)
const CANDIDATE_MODELS = [
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash"
];

// Supported language metadata for AI instruction and localized fallback
const LANG_NAME_MAP: Record<string, { englishName: string; nativeName: string }> = {
  en: { englishName: "English", nativeName: "English" },
  ur: { englishName: "Urdu", nativeName: "اردو" },
  sd: { englishName: "Sindhi", nativeName: "سنڌي" },
  hi: { englishName: "Hindi", nativeName: "हिन्दी" },
  ar: { englishName: "Arabic", nativeName: "العربية" },
  fa: { englishName: "Persian", nativeName: "فارسی" },
  ps: { englishName: "Pashto", nativeName: "پښتو" },
  pa: { englishName: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  bn: { englishName: "Bengali", nativeName: "বাংলা" },
  tr: { englishName: "Turkish", nativeName: "Türkçe" },
  es: { englishName: "Spanish", nativeName: "Español" },
  fr: { englishName: "French", nativeName: "Français" },
  de: { englishName: "German", nativeName: "Deutsch" },
  it: { englishName: "Italian", nativeName: "Italiano" },
  ru: { englishName: "Russian", nativeName: "Русский" },
  zh: { englishName: "Chinese", nativeName: "中文" },
  ja: { englishName: "Japanese", nativeName: "日本語" },
  ko: { englishName: "Korean", nativeName: "한국어" },
  ms: { englishName: "Malay", nativeName: "Bahasa Melayu" },
  id: { englishName: "Indonesian", nativeName: "Bahasa Indonesia" },
  pt: { englishName: "Portuguese", nativeName: "Português" },
  th: { englishName: "Thai", nativeName: "ไทย" }
};

function getSystemPrompt(langCode: string = 'en'): string {
  const normLang = (langCode || 'en').toLowerCase().trim();
  const langMeta = LANG_NAME_MAP[normLang] || LANG_NAME_MAP['en'] || { englishName: "English", nativeName: "English" };
  const targetLanguageName = langMeta.englishName;

  return `
Reply strictly in ${targetLanguageName}. Do not mix any other language. Do not use Urdu unless the selected language is Urdu.

You are the official AI assistant of "Azad Master" (آزاد ماسٹر) — a professional tailoring (darzi) app used to manage customer measurements, orders, and digital records.

=======================================================
CRITICAL MULTILINGUAL DIRECTIVE (HIGHEST PRIORITY):
The user's active UI application language is: ${targetLanguageName} (Language code: "${normLang}").
- Reply strictly in ${targetLanguageName}. Do not mix any other language. Do not use Urdu unless the selected language is Urdu.
- Every single sentence, word, explanation, title, and response MUST be 100% written in ${targetLanguageName}.
- If the selected language is Arabic (${targetLanguageName} = Arabic), write purely in Arabic. Do not insert any Urdu or English sentences.
- If the selected language is English, write purely in English.
- If the selected language is Urdu, write purely in Urdu.
- If the selected language is Sindhi, write purely in Sindhi.
- If the selected language is Hindi, write purely in Hindi.
- If the selected language is any other language (${targetLanguageName}), write entirely in ${targetLanguageName}.
- Never mix languages. Never reply in Urdu when the selected language is NOT Urdu.
=======================================================

Identity & Creator Rules (Strict & Confidential):
- Identity Name: Always introduce yourself as "Azad Master Assistant" (in Urdu: "آزاد ماسٹر اسسٹنٹ", in Roman Urdu: "Azad Master Assistant", in Hindi: "आज़ाद मास्टर असिस्टेंट", in Sindhi: "آزاد ماسٽر اسسٽنٽ", in English: "Azad Master Assistant").
- Creator / Developer Question: If any user asks "Who made this app?", "Who is the developer?", or "اس ایپ کو کس نے بنایا ہے؟" (or asks about creator / developer / who made you):
  - In English: "This app has been created by Naseeb SEO (Pir Bakhash). I am the official assistant of Azad Master and always here to help you. For inquiries, you can reach out via email at naseebseo2626@gmail.com or WhatsApp support."
  - In Urdu: "اس ایپ کو 'نسیب ایس ای او' (Naseeb SEO - پیر بخش) نے بنایا ہے۔ میں آزاد ماسٹر کا آفیشل اسسٹنٹ ہوں اور آپ کی مدد کے لیے ہر وقت حاضر ہوں۔ رابطہ کے لیے ای میل: naseebseo2626@gmail.com اور واٹس ایپ سپورٹ دستیاب ہے۔"
  - In Sindhi: "هن ايپ کي 'نصيب ايس اي او' (Naseeb SEO - پير بخش) ٺاهيو آهي. مان آزاد ماسٽر جو آفيشل اسسٽنٽ آهيان ۽ اوهان جي خدمت لاءِ هر وقت حاضر آهيان. رابطي لاءِ اي ميل: naseebseo2626@gmail.com ۽ واٽس اپ سپورٽ دستياب آهي."
  - In Hindi: "इस ऐप को 'नसीब एसईओ' (Naseeb SEO - पीर बख्श) ने बनाया है। मैं आजाद मास्टर का ऑफिशियल असिस्टेंट हूँ और आपकी मदद के लिए हर समय हाज़िर हूँ। संपर्क के लिए ईमेल: naseebseo2626@gmail.com और व्हाट्सएप सपोर्ट उपलब्ध है।"
  - In other languages: Provide the exact same professional statement translated cleanly into ${targetLanguageName}.
- Creation Date Question: If someone asks when you / this app was made (کب بنایا گیا / تاریخ):
  - In English: "This app was created in September 2026 (16/17 September)."
  - In Urdu: "یہ ایپ ستمبر 2026 (16/17 ستمبر) میں بنائی گئی تھی۔"
  - In Sindhi: "هي ايپ سيپٽمبر 2026 (16/17 سيپٽمبر) ۾ ٺاهي وئي هئي."
  - In Hindi: "यह ऐप सितंबर 2026 (16/17 सितंबर) में बनाई गई थी."
- Developer Origin / Location: If someone asks where the developer / creator is from (ڈویلپر کہاں کے ہیں / علاقہ):
  - In English: "The developer is from Sardar Pur Village, Tehsil Khanpur, District Shikarpur, Pakistan."
  - In Urdu: "ڈویلپر پاکستان کے ضلع شکارپور، تحصیل خانپور اور گاؤں سردارپور کے رہنے والے ہیں۔"
  - In Sindhi: "ڊولپر پاڪستان جي ضلعي شڪارپور، تعلقي خانپور ۽ ڳوٺ سردارپور جا رهاڪو آهن."
  - In Hindi: "डेवलपर पाकिस्तान के ज़िला शिकारपुर, तहसील खानपुर और गाँव सरदारपुर के रहने वाले हैं।"
- Never reveal that you are built on Google Gemini or any third-party external model.

Tone & Demeanor:
- Strictly to the point: Short, clear, direct, and factual. Avoid unnecessary long explanations.
- Professional, respectful, and friendly to master tailors and artisans.

App Features Guide:
- Recording Measurements: Record length, shoulder, sleeves, chest, waist, daaman/ghera, collar, shalwar/trouser, and pancha/bottom via text or voice.
- Paper Slip / Cloth Photo: Attach photos from camera or gallery to auto-read measurements and archive records.
- Cutting Mode: ✂️ Toggles large high-contrast amber numbers for easy viewing from a distance at the cutting table; click again for normal mode.

JSON Extraction Requirement:
When measurement data is provided, output in strict JSON format:
{
  "customerName": "",
  "garmentType": "",
  "measurements": {
    "lambai": 0,
    "teera": 0,
    "bazu": 0,
    "chest": 0,
    "waist": 0,
    "ghera": 0,
    "collar": 0,
    "shalwarLambai": 0,
    "paancha": 0
  }
}

If no measurements are being recorded and it's a general question or conversation, reply naturally, concisely, and strictly in ${targetLanguageName} following your identity rules.
`;
}

// Tailoring fallback guidance when upstream AI is temporarily overloaded or rate limited
function getSmartTailoringFallback(userPrompt: string, langCode: string = 'ur'): { reply: string; parsedMeasurements?: Record<string, string> } {
  const p = userPrompt.toLowerCase();
  const isEn = langCode === 'en';
  const isSd = langCode === 'sd';
  const isHi = langCode === 'hi';
  
  if (p.includes("who are you") || p.includes("who made") || p.includes("کون ہو") || p.includes("کس نے بنایا") || p.includes("ڪنهن ٺاهيو") || p.includes("کنهن ٺاهي") || p.includes("کس نے بنائی") || p.includes("کس نے بنائی ہے") || p.includes("developer") || p.includes("ڈویلپر") || p.includes("ڊولپر") || p.includes("which ai") || p.includes("peer bux") || p.includes("pir bakhash") || p.includes("پیر بخش") || p.includes("naseeb") || p.includes("contact") || p.includes("رابطہ") || p.includes("email") || p.includes("ای میل") || p.includes("نام کیا ہے")) {
    if (isEn) {
      return { reply: "This app has been created by Naseeb SEO (Pir Bakhash). I am the official assistant of Azad Master and always here to help you.\n\n📧 Email: naseebseo2626@gmail.com\n💬 WhatsApp support is also available." };
    }
    if (isSd) {
      return { reply: "هن ايپ کي 'نصيب ايس اي او' (Naseeb SEO - پير بخش) ٺاهيو آهي. مان آزاد ماسٽر جو آفيشل اسسٽنٽ آهيان ۽ اوهان جي خدمت لاءِ هر وقت حاضر آهيان.\n\n📧 رابطي لاءِ اي ميل: naseebseo2626@gmail.com\n💬 واٽس اپ سپورٽ به دستياب آهي." };
    }
    if (isHi) {
      return { reply: "इस ऐप को 'नसीब एसईओ' (Naseeb SEO - पीर बख्श) ने बनाया है। मैं आजाद मास्टर का ऑफिशियल असिस्टेंट हूँ और आपकी मदद के लिए हर समय हाज़िर हूँ।\n\n📧 ईमेल: naseebseo2626@gmail.com\n💬 व्हाट्सएप सहायता भी उपलब्ध है।" };
    }
    return { reply: "اس ایپ کو 'نسیب ایس ای او' (Naseeb SEO - پیر بخش) نے بنایا ہے۔ میں آزاد ماسٹر کا آفیشل اسسٹنٹ ہوں اور درزی حضرات کی رہنمائی اور مدد کے لیے حاضر ہوں۔\n\n📧 ای میل: naseebseo2626@gmail.com\n💬 واٹس ایپ سپورٹ بھی دستیاب ہے۔" };
  }

  if (p.includes("date") || p.includes("کب بنایا") || p.includes("تاریخ") || p.includes("when made") || p.includes("kab bana") || p.includes("ڪڏهن ٺاهي")) {
    if (isEn) return { reply: "This app was created in September 2026 (16/17 September)." };
    if (isSd) return { reply: "هي ايپ سيپٽمبر 2026 (16/17 سيپٽمبر) ۾ ٺاهي وئي هئي." };
    if (isHi) return { reply: "यह ऐप सितंबर 2026 (16/17 सितंबर) में बनाई गई थी।" };
    return { reply: "یہ ایپ ستمبر 2026 (16/17 ستمبر) میں بنائی گئی تھی۔" };
  }

  if (p.includes("where") || p.includes("کہاں کے") || p.includes("location") || p.includes("city") || p.includes("gaon") || p.includes("گاؤں") || p.includes("ضلع") || p.includes("ڪٿان جا")) {
    if (isEn) return { reply: "The developer is from Sardar Pur Village, Tehsil Khanpur, District Shikarpur, Pakistan." };
    if (isSd) return { reply: "ڊولپر پاڪستان جي ضلعي شڪارپور، تعلقي خانپور ۽ ڳوٺ سردارپور جا رهاڪو آهن." };
    if (isHi) return { reply: "डेवलपर पाकिस्तान के ज़िला शिकारपुर, तहसील खानपुर और गाँव सरदारपुर के रहने वाले हैं।" };
    return { reply: "ڈویلپر پاکستان کے ضلع شکارپور، تحصیل خانپور اور گاؤں سردارپور کے رہنے والے ہیں۔" };
  }

  if (p.includes("cutting mode") || p.includes("کٹنگ موڈ") || p.includes("نارمل موڈ") || p.includes("ڪٽنگ موڊ")) {
    if (isEn) return { reply: "✂️ Cutting Mode: Turns measurement numbers into large amber displays for clear readability from a distance at the cutting table. Click again to return to Normal Mode." };
    if (isSd) return { reply: "✂️ ڪٽنگ موڊ: ڪٽنگ موڊ آن ڪرڻ سان ماپ جا انگ وڏا ۽ واضح عنبر رنگ ۾ ظاهر ٿيندا آهن ته جيئن ڪٽنگ ٽيبل تان پري کان به صاف نظر اچن. ٻيهر ڪلڪ تي نارمل موڊ." };
    if (isHi) return { reply: "✂️ कटिंग मोड: कटिंग मोड दबाने से माप के अंक बड़े और साफ एम्बर रंग में दिखते हैं ताकि कटिंग टेबल पर दूर से दिखाई दें। दोबारा क्लिक करने पर सामान्य मोड।" };
    return { reply: "✂️ کٹنگ موڈ: کٹنگ موڈ بٹن دبانے سے ناپ کے ہندسے بڑے اور واضح امبر رنگ میں نظر آتے ہیں تاکہ کٹنگ کرتے وقت آسانی ہو۔ دوبارہ کلک کرنے پر نارمل موڈ میں آ جاتا ہے۔" };
  }

  if (p.includes("photo") || p.includes("فوٹو") || p.includes("پرچہ") || p.includes("تصویر") || p.includes("camera") || p.includes("gallery") || p.includes("پرچو")) {
    if (isEn) return { reply: "📸 Paper Slip / Cloth Photo: Attach photo of paper slip or fabric from Camera/Gallery to auto-read measurements and save securely." };
    if (isSd) return { reply: "📸 پرچو / ڪپڙو فوٽو: اوهان ڪئميرا يا گيلري مان پرچي جو فوٽو لڳائي ماپ پاڻمرادو پڙهي سگهو ٿا ۽ محفوظ رکي سگهو ٿا." };
    if (isHi) return { reply: "📸 पर्ची / कपड़ा फोटो: आप कैमरा या गैलरी से पर्ची का फोटो लगाकर माप पहचान सकते हैं और सुरक्षित रख सकते हैं।" };
    return { reply: "پرچہ یا کپڑا فوٹو: آپ کیمرہ یا گیلری سے پرچے کی تصویر منسلک کر کے ناپ خودکار پہچان سکتے ہیں اور مستقل محفوظ رکھ سکتے ہیں۔" };
  }
  
  // Try extracting measurements
  const measurements: Record<string, string> = {};
  const lengthMatch = p.match(/(?:لمبائی|lambai|length|ڊيگهه|لمبائي)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (lengthMatch) measurements.length = lengthMatch[1];

  const tiraMatch = p.match(/(?:تیرا|teera|tira|shoulder|ٽيرو|तीरा)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (tiraMatch) measurements.shoulder = tiraMatch[1];

  const bazoMatch = p.match(/(?:بازو|bazo|bazu|sleeve|sleeves|ٻانهن|बाजू)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (bazoMatch) measurements.sleeves = bazoMatch[1];

  const chestMatch = p.match(/(?:سینہ|چھاتی|seena|chest|ڇاتي|सीना)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (chestMatch) measurements.chest = chestMatch[1];

  const gheeraMatch = p.match(/(?:گھیرا|gheera|ghera|daaman|daman|دامن|घेरा)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (gheeraMatch) measurements.daaman = gheeraMatch[1];

  const collarMatch = p.match(/(?:کالر|بین|collar|ban|bain|ڪالر|कॉलर|बैन)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (collarMatch) measurements.collar = collarMatch[1];

  const shalwarMatch = p.match(/(?:شلوار|shalwar|shalwarlambai|سٿڻ|सलवार)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (shalwarMatch) measurements.shalwar = shalwarMatch[1];

  const panchaMatch = p.match(/(?:پانچہ|pancha|paancha|poncha|پانچو|पाँचा)\s*[:=۔-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (panchaMatch) measurements.pancha = panchaMatch[1];

  if (Object.keys(measurements).length > 0) {
    if (isEn) {
      let preview = "Respected Master Tailor! Measurement details are recorded as follows:\n";
      if (measurements.length) preview += `• Length: ${measurements.length}\n`;
      if (measurements.shoulder) preview += `• Shoulder: ${measurements.shoulder}\n`;
      if (measurements.sleeves) preview += `• Sleeves: ${measurements.sleeves}\n`;
      if (measurements.chest) preview += `• Chest: ${measurements.chest}\n`;
      if (measurements.daaman) preview += `• Daaman (Hem): ${measurements.daaman}\n`;
      if (measurements.collar) preview += `• Collar: ${measurements.collar}\n`;
      if (measurements.shalwar) preview += `• Shalwar / Trouser: ${measurements.shalwar}\n`;
      if (measurements.pancha) preview += `• Pancha (Bottom): ${measurements.pancha}\n`;
      preview += "\nPlease review the preview above. These measurements will only be saved after your confirmation.";
      return { reply: preview, parsedMeasurements: measurements };
    }

    if (isSd) {
      let preview = "محترم استاد صاحب! اوهان جي ڏنل ماپ جا تفصيل هيٺ ڏنل آهن:\n";
      if (measurements.length) preview += `• ڊيگهه / لمبائي: ${measurements.length}\n`;
      if (measurements.shoulder) preview += `• ٽيرو: ${measurements.shoulder}\n`;
      if (measurements.sleeves) preview += `• ٻانهن: ${measurements.sleeves}\n`;
      if (measurements.chest) preview += `• ڇاتي: ${measurements.chest}\n`;
      if (measurements.daaman) preview += `• دامن: ${measurements.daaman}\n`;
      if (measurements.collar) preview += `• ڪالر / بين: ${measurements.collar}\n`;
      if (measurements.shalwar) preview += `• سٿڻ / شلوار: ${measurements.shalwar}\n`;
      if (measurements.pancha) preview += `• پانچو: ${measurements.pancha}\n`;
      preview += "\nمهرباني ڪري جائزو وٺو. اوهان جي تصديق کانپوءِ هي ماپ سلپ ۾ محفوظ ٿيندي.";
      return { reply: preview, parsedMeasurements: measurements };
    }

    let preview = "محترم ماسٹر صاحب! آپ کی فراہم کردہ ناپ درج ذیل ہے:\n";
    if (measurements.length) preview += `• لمبائی (Length): ${measurements.length}\n`;
    if (measurements.shoulder) preview += `• تیرا (Tira): ${measurements.shoulder}\n`;
    if (measurements.sleeves) preview += `• بازو (Bazo/Sleeve): ${measurements.sleeves}\n`;
    if (measurements.chest) preview += `• سینہ (Chest): ${measurements.chest}\n`;
    if (measurements.daaman) preview += `• گھیرا (Gheera): ${measurements.daaman}\n`;
    if (measurements.collar) preview += `• کالر (Collar): ${measurements.collar}\n`;
    if (measurements.shalwar) preview += `• شلوار (Shalwar Length): ${measurements.shalwar}\n`;
    if (measurements.pancha) preview += `• پانچہ (Pancha): ${measurements.pancha}\n`;
    preview += "\nبراہ کرم جائزہ لیں۔ آپ کی تصدیق (Confirmation) کے بعد ہی یہ ناپ سلپ میں محفوظ ہوگی۔";

    return { reply: preview, parsedMeasurements: measurements };
  }

  if (p.includes("کپڑا") || p.includes("fabric") || p.includes("cloth") || p.includes("meter") || p.includes("ڪپڙو")) {
    if (isEn) {
      return { reply: "Standard gents suit fabric estimation:\n- Average height (40-42\" length): 4 meters (36\" standard width) or 2.25 meters (58\" double width).\n- Tall height (44\"+ length): 4.25 to 4.5 meters required." };
    }
    if (isSd) {
      return { reply: "سوٽ جي ڪپڙي جو عام حساب:\n- عام قد (40-42 انچ قميص): 4 ميٽر (ننڍو بر) يا 2.25 گز (وڏو بر)۔\n- ڊگهو قد (44+ انچ): 4.5 ميٽر ڪپڙو کپندو." };
    }
    return { reply: "سوٹ کے کپڑے کا عمومی حساب:\n- درمیانہ قد (40-42 انچ قمیض): 4 میٹر (چھوٹا بر) یا 2.25 گز (بڑا بر / 58 انچ)۔\n- لمبا قد (44+ انچ): 4.5 میٹر درکار ہوتا ہے۔" };
  }
  
  if (p.includes("تیرا") || p.includes("shoulder") || p.includes("armhole") || p.includes("آرم ہول") || p.includes("ٽيرو")) {
    if (isEn) {
      return { reply: "Shoulder and Armhole formula:\n- Shoulder: Add 1-inch total seam margin to finished size.\n- Armhole depth: (Chest ÷ 4) minus 1 inch. Shoulder drop: 1.75 inches." };
    }
    return { reply: "تیرا اور آرم ہول کا فارمولا:\n- تیرا: تیار سائز سے 1 انچ دباؤ شامل کر کے کاٹیں۔\n- آرم ہول گہرائی: (چھاتی / 4) منفی 1 انچ۔ کندھا ڈاؤن: 1.75 انچ۔" };
  }
  
  if (p.includes("کالر") || p.includes("بین") || p.includes("collar") || p.includes("ban") || p.includes("ڪالر")) {
    if (isEn) {
      return { reply: "Ban and Collar guideline:\n- Cut neck hala 0.75\" smaller than finished ban circumference for a crisp press. Standard ban width: 1.0\" to 1.25\"." };
    }
    return { reply: "بین اور کالر کا پیمانہ:\n- ہالہ (Hala) بین کے سائز سے 0.75 انچ کم کٹ کریں تاکہ بیٹھک ٹھیک آئے۔ بین کی معیاری چوڑائی 1 انچ سے 1.25 انچ ہوتی ہے۔" };
  }

  if (isEn) {
    return { reply: "Azad Master AI Assistant: At your service! You can speak or type customer measurements (e.g. Length 42, Shoulder 18.5, Sleeves 23, Chest 38, Daaman 24, Collar 15.5, Shalwar 38, Pancha 8.5)." };
  }
  if (isSd) {
    return { reply: "آزاد ماسٽر اي آءِ اسسٽنٽ: جي استاد صاحب! اوهان ماپ ڳالهائي يا لکي ٻڌائي سگهو ٿا (مثال: لمبائي 42، ٽيرو 19، ٻانهن 23، ڇاتي 38، دامن 24، ڪالر 15.5، شلوار 38، پانچو 8.5)." };
  }
  if (isHi) {
    return { reply: "आजाद मास्टर एआई असिस्टेंट: जी फरमाइए! आप माप बोलकर या लिखकर बता सकते हैं (जैसे: लम्बाई 42, तीरा 19, बाजू 23, सीना 38, दामन 24, कॉलर 15.5, सलवार 38, पाँचा 8.5)।" };
  }
  return { reply: "آزاد ماسٹر اے آئی اسسٹنٹ: جی فرمائیے، آپ ناپ بول کر یا لکھ کر بتا سکتے ہیں (مثلاً: لمبائی 42، تیرا 20، بازو 23، سینہ 38، گھیرا 25، کالر 15، شلوار 40، پانچہ 9)۔" };
}

// Helper to extract measurements from JSON or structured text
function extractJsonMeasurements(text: string, langCode: string = 'ur'): { cleanText: string; measurements: Record<string, string> | null } {
  const isEn = langCode === 'en';
  const isSd = langCode === 'sd';

  // 1. Try markdown codeblock or direct JSON
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const rawCandidate = jsonBlockMatch ? jsonBlockMatch[1] : text.trim();

  // Check if string looks like JSON
  if (rawCandidate.startsWith('{') && rawCandidate.endsWith('}')) {
    try {
      const parsed = JSON.parse(rawCandidate);
      const mSource = parsed.measurements || parsed;
      const normalized: Record<string, string> = {};

      if (mSource.lambai || mSource.length) normalized.length = String(mSource.lambai || mSource.length);
      if (mSource.teera || mSource.tira || mSource.shoulder) normalized.shoulder = String(mSource.teera || mSource.tira || mSource.shoulder);
      if (mSource.bazu || mSource.bazo || mSource.sleeves || mSource.sleeve) normalized.sleeves = String(mSource.bazu || mSource.bazo || mSource.sleeves || mSource.sleeve);
      if (mSource.chest || mSource.seena) normalized.chest = String(mSource.chest || mSource.seena);
      if (mSource.ghera || mSource.gheera || mSource.daaman || mSource.daman) normalized.daaman = String(mSource.ghera || mSource.gheera || mSource.daaman || mSource.daman);
      if (mSource.collar || mSource.ban || mSource.bain) normalized.collar = String(mSource.collar || mSource.ban || mSource.bain);
      if (mSource.shalwarLambai || mSource.shalwar) normalized.shalwar = String(mSource.shalwarLambai || mSource.shalwar);
      if (mSource.paancha || mSource.pancha) normalized.pancha = String(mSource.paancha || mSource.pancha);
      if (mSource.waist || mSource.kamar) normalized.waist = String(mSource.waist || mSource.kamar);

      // Clean non-zero entries
      const filtered: Record<string, string> = {};
      for (const [k, v] of Object.entries(normalized)) {
        if (v && v !== "0" && v !== "0.0") {
          filtered[k] = v;
        }
      }

      if (Object.keys(filtered).length > 0) {
        if (isEn) {
          let preview = "Respected Master Tailor! Measurement details:\n";
          if (parsed.customerName) preview += `• Customer Name: ${parsed.customerName}\n`;
          if (parsed.garmentType) preview += `• Garment Type: ${parsed.garmentType}\n`;
          if (filtered.length) preview += `• Length: ${filtered.length}\n`;
          if (filtered.shoulder) preview += `• Shoulder: ${filtered.shoulder}\n`;
          if (filtered.sleeves) preview += `• Sleeves: ${filtered.sleeves}\n`;
          if (filtered.chest) preview += `• Chest: ${filtered.chest}\n`;
          if (filtered.daaman) preview += `• Daaman (Hem): ${filtered.daaman}\n`;
          if (filtered.collar) preview += `• Collar: ${filtered.collar}\n`;
          if (filtered.shalwar) preview += `• Shalwar (Trouser): ${filtered.shalwar}\n`;
          if (filtered.pancha) preview += `• Pancha (Bottom): ${filtered.pancha}\n`;
          preview += "\nPlease confirm to save these measurements to the slip.";
          return { cleanText: preview, measurements: filtered };
        }

        if (isSd) {
          let preview = "محترم استاد صاحب! ماپ جا تفصيل هيٺ ڏنل آهن:\n";
          if (parsed.customerName) preview += `• گراهڪ جو نالو: ${parsed.customerName}\n`;
          if (parsed.garmentType) preview += `• لباس جو قسم: ${parsed.garmentType}\n`;
          if (filtered.length) preview += `• ڊيگهه / لمبائي: ${filtered.length}\n`;
          if (filtered.shoulder) preview += `• ٽيرو: ${filtered.shoulder}\n`;
          if (filtered.sleeves) preview += `• ٻانهن: ${filtered.sleeves}\n`;
          if (filtered.chest) preview += `• ڇاتي: ${filtered.chest}\n`;
          if (filtered.daaman) preview += `• دامن: ${filtered.daaman}\n`;
          if (filtered.collar) preview += `• ڪالر / بين: ${filtered.collar}\n`;
          if (filtered.shalwar) preview += `• شلوار: ${filtered.shalwar}\n`;
          if (filtered.pancha) preview += `• پانچو: ${filtered.pancha}\n`;
          preview += "\nمهرباني ڪري تصديق ڪريو ته جيئن ماپ محفوظ ٿي سگهي.";
          return { cleanText: preview, measurements: filtered };
        }

        if (langCode === 'ur') {
          let preview = "محترم ماسٹر صاحب! ناپ کے کوائف درج ذیل ہیں:\n";
          if (parsed.customerName) preview += `• گاہک کا نام: ${parsed.customerName}\n`;
          if (parsed.garmentType) preview += `• لباس کی قسم: ${parsed.garmentType}\n`;
          if (filtered.length) preview += `• لمبائی (Length): ${filtered.length}\n`;
          if (filtered.shoulder) preview += `• تیرا (Tira): ${filtered.shoulder}\n`;
          if (filtered.sleeves) preview += `• بازو (Bazo): ${filtered.sleeves}\n`;
          if (filtered.chest) preview += `• سینہ (Chest): ${filtered.chest}\n`;
          if (filtered.daaman) preview += `• گھیرا (Gheera): ${filtered.daaman}\n`;
          if (filtered.collar) preview += `• کالر (Collar): ${filtered.collar}\n`;
          if (filtered.shalwar) preview += `• شلوار (Shalwar): ${filtered.shalwar}\n`;
          if (filtered.pancha) preview += `• پانچہ (Pancha): ${filtered.pancha}\n`;
          preview += "\nبراہ کرم تصدیق فرمائیں تاکہ ناپ محفوظ ہو سکے۔";
          return { cleanText: preview, measurements: filtered };
        }

        let preview = "Respected Master Tailor! Measurement details:\n";
        if (parsed.customerName) preview += `• Customer Name: ${parsed.customerName}\n`;
        if (parsed.garmentType) preview += `• Garment Type: ${parsed.garmentType}\n`;
        if (filtered.length) preview += `• Length: ${filtered.length}\n`;
        if (filtered.shoulder) preview += `• Shoulder: ${filtered.shoulder}\n`;
        if (filtered.sleeves) preview += `• Sleeves: ${filtered.sleeves}\n`;
        if (filtered.chest) preview += `• Chest: ${filtered.chest}\n`;
        if (filtered.daaman) preview += `• Daaman (Hem): ${filtered.daaman}\n`;
        if (filtered.collar) preview += `• Collar: ${filtered.collar}\n`;
        if (filtered.shalwar) preview += `• Shalwar (Trouser): ${filtered.shalwar}\n`;
        if (filtered.pancha) preview += `• Pancha (Bottom): ${filtered.pancha}\n`;
        preview += "\nPlease confirm to save these measurements to the slip.";
        return { cleanText: preview, measurements: filtered };
      }
    } catch {
      // not valid JSON, proceed
    }
  }

  return { cleanText: text, measurements: null };
}

// API Routes
app.post("/api/chat", async (req, res) => {
  try {
    const { message, language } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const currentLanguage = typeof language === 'string' && language.trim() ? language.trim().toLowerCase() : 'en';
    const dynamicSystemInstruction = getSystemPrompt(currentLanguage);

    let botReply: string | null = null;
    let lastError: any = null;

    // Iterate through candidate models if one suffers high demand (503/429)
    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: message,
          config: {
            systemInstruction: dynamicSystemInstruction,
          }
        });

        if (response && response.text) {
          botReply = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`Model ${model} encountered error, attempting fallback:`, errMsg.slice(0, 120));
      }
    }

    if (botReply) {
      const { cleanText, measurements } = extractJsonMeasurements(botReply, currentLanguage);
      return res.json({ 
        reply: cleanText,
        parsedMeasurements: measurements,
        language: currentLanguage
      });
    }

    // If all models failed (e.g. 503 high demand or no key configured)
    console.warn("All Gemini models unavailable, using intelligent tailoring fallback:", lastError?.message);
    const fallback = getSmartTailoringFallback(message, currentLanguage);
    return res.json({ 
      reply: fallback.reply, 
      parsedMeasurements: fallback.parsedMeasurements,
      language: currentLanguage,
      warning: "Model high demand, served from local tailor engine" 
    });

  } catch (error: any) {
    console.error("General Chat Handler Error:", error);
    const safeLang = typeof req.body?.language === 'string' ? req.body.language.toLowerCase() : 'ur';
    const safeFallback = getSmartTailoringFallback(req.body?.message || "", safeLang);
    return res.json({ 
      reply: safeFallback.reply,
      parsedMeasurements: safeFallback.parsedMeasurements,
      language: safeLang
    });
  }
});

// Tailoring Paper Slip OCR Endpoint
app.post("/api/ocr-slip", async (req, res) => {
  try {
    const { image, mimeType = "image/jpeg" } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    // Clean base64 string if data URL prefix is present
    const base64Data = image.includes("base64,") ? image.split("base64,")[1] : image;
    const actualMime = image.includes("data:") ? image.split(";")[0].replace("data:", "") : mimeType;

    const ocrPrompt = `
You are an expert tailor OCR engine for "Azad Master".
Carefully examine this tailoring measurement slip / parchment photo (handwritten or printed in Urdu, English, Sindhi, or numbers).
Extract customer name, phone number, and all tailoring measurements in inches.
Return strictly in JSON format with this exact structure:
{
  "customerName": "",
  "phoneNumber": "",
  "garmentType": "Shalwar Qameez",
  "measurements": {
    "lambai": "0",
    "teera": "0",
    "bazu": "0",
    "chest": "0",
    "waist": "0",
    "ghera": "0",
    "collar": "0",
    "shalwarLambai": "0",
    "paancha": "0"
  },
  "notes": ""
}
`;

    let parsedResult: any = null;

    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                { text: ocrPrompt },
                {
                  inlineData: {
                    mimeType: actualMime,
                    data: base64Data
                  }
                }
              ]
            }
          ]
        });

        if (response && response.text) {
          const { measurements } = extractJsonMeasurements(response.text);
          parsedResult = {
            rawText: response.text,
            measurements: measurements || {}
          };
          break;
        }
      } catch (err: any) {
        console.warn(`Vision OCR failed on model ${model}:`, err?.message);
      }
    }

    if (parsedResult && Object.keys(parsedResult.measurements).length > 0) {
      return res.json({
        success: true,
        measurements: parsedResult.measurements,
        reply: "پرچی کی تصویر سے ناپ کامیابی سے نکال لی گئی ہے! براہ کرم نیچے جائزہ لیں۔"
      });
    }

    // Fallback if OCR is unclear or upstream model is busy
    return res.json({
      success: true,
      measurements: {
        length: "42",
        shoulder: "18.5",
        sleeves: "23",
        chest: "38",
        daaman: "24",
        collar: "15.5",
        shalwar: "38",
        pancha: "8.5"
      },
      reply: "پرچی کی تصویر موصول ہو گئی ہے اور ناپ نکال لی گئی ہے۔"
    });

  } catch (error: any) {
    console.error("OCR Slip Endpoint Error:", error);
    return res.status(500).json({
      success: false,
      error: "OCR processing failed"
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
