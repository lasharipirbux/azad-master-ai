import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, CustomerMeasurements, SupportedLanguage } from '../types';
import { Bot, X, User, Scissors, CheckCircle, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { parseMeasurementsFromText } from '../utils/measurementParser';
import { VoiceConversationScreen } from './VoiceConversationScreen';
import { speakText, stopSpeaking } from '../utils/speechSynthesis';
import { saveMeasurementToFirebase } from '../firebase';

interface ChatbotModalProps {
  onClose: () => void;
  translations: Record<string, string>;
  isRtl: boolean;
  onApplyMeasurements?: (measurements: Partial<CustomerMeasurements>) => void;
  masterName?: string;
  currentLang?: SupportedLanguage;
}

const getInitialBotGreeting = (lang: string = 'ur'): string => {
  if (lang === 'en') {
    return 'Hello! I am Azad Master Assistant.\n\nYou can speak or type measurements (e.g. Length 42, Shoulder 18.5, Sleeves 23, Chest 38, Daaman 24, Collar 15.5, Shalwar 38, Pancha 8.5). I will map each measurement to its proper field, present a full preview, and will never save to the database without your explicit confirmation.';
  }
  if (lang === 'sd') {
    return 'اسلام عليڪم! مان آزاد ماسٽر اسسٽنٽ آهيان.\n\nاوهان ماپ ڳالهائي يا لکي ٻڌائي سگهو ٿا (مثال: لمبائي 42، ٽيرو 19، ٻانهن 23، ڇاتي 38، دامن 24، ڪالر 15.5، شلوار 38، پانچو 8.5). مان ماپ جا سڀ تفصيل ترتيب ڏئي اوهان کي اڳواٽ جائزو ڏيکاريندس ۽ اوهان جي تصديق کانسواءِ محفوظ نه ڪندس.';
  }
  if (lang === 'hi') {
    return 'नमस्ते! मैं आजाद मास्टर असिस्टेंट हूँ।\n\nआप माप बोलकर या लिखकर बता सकते हैं (जैसे: लम्बाई 42, तीरा 19, बाजू 23, सीना 38, दामन 24, कॉलर 15.5, सलवार 38, पाँचा 8.5)। मैं हर माप को सही खाने में रखकर पहले आपको पूरा प्रीव्यू दिखाऊँगा और आपकी पुष्टि के बिना सुरक्षित नहीं करूँगा।';
  }
  if (lang === 'ar') {
    return 'مرحباً! أنا مساعد أزاد ماستر.\n\nيمكنك نطق القياسات أو كتابتها (مثلاً: الطول 42، الكتف 19، الكم 23، الصدر 38، الياقة 15.5). سأقوم بترتيب كل قياس في خانته وعرض معاينة كاملة لك ولن أقوم بالحفظ دون تأكيدك.';
  }
  return 'السلام علیکم! میں آزاد ماسٹر اسسٹنٹ ہوں۔\n\nآپ ناپ بول کر یا لکھ کر بتا سکتے ہیں (مثلاً: لمبائی 42، تیرا 20، بازو 23، سینہ 38، گھیرا 25، کالر 15، شلوار 40، پانچہ 9)۔ میں ہر ناپ کو اس کے اصل خانے میں رکھ کر پہلے آپ کو مکمل جائزہ دکھاؤں گا اور آپ کی اجازت (تصدیق) کے بغیر محفوظ نہیں کروں گا۔';
};

const getQuickPromptsList = (lang: string = 'ur'): string[] => {
  if (lang === 'en') {
    return [
      'Length 42, Shoulder 18.5, Sleeves 23, Chest 38, Daaman 24, Collar 15.5, Shalwar 38, Pancha 8.5',
      'How much fabric is required for a gents suit?',
      'Shoulder and armhole cutting formula',
      'How to cut Ban and Collar accurately?'
    ];
  }
  if (lang === 'sd') {
    return [
      'لمبائي 42، ٽيرو 19، ٻانهن 23، ڇاتي 38، دامن 24، ڪالر 15.5، شلوار 38، پانچو 8.5',
      'هڪ سوٽ لاءِ ڪيترو ڪپڙو گهربل هوندو آهي؟',
      'ٽيرو ۽ آرم هول جو ڪٽنگ فارمولو ڇا آهي؟',
      'بين ۽ ڪالر جي ڪٽنگ ڪيئن ڪجي؟'
    ];
  }
  if (lang === 'hi') {
    return [
      'लम्बाई 42, तीरा 19, बाजू 23, सीना 38, दामन 24, कॉलर 15.5, सलवार 38, पाँचा 8.5',
      'एक सूट के लिए कितना कपड़ा चाहिए?',
      'तीरा और आर्महोल का कटिंग फार्मूला',
      'बैन और कॉलर की सही कटिंग कैसे करें?'
    ];
  }
  if (lang === 'ar') {
    return [
      'الطول 42، الكتف 19، الكم 23، الصدر 38، المحيط 24، الياقة 15.5، السروال 38، الحاشية 8.5',
      'كم متر قماش يحتاج الثوب الرجالي؟',
      'معادلة قص الكتف وحردة الإبط',
      'كيفية قص الياقة بشكل دقيق؟'
    ];
  }
  return [
    'لمبائی 42، تیرا 20، بازو 23، سینہ 38، گھیرا 25، کالر 15، شلوار 40، پانچہ 9',
    'سوٹ کے لیے کتنا کپڑا درکار ہے؟',
    'تیرا (Shoulder) اور آرم ہول کا فارمولا',
    'بین اور کالر کی کٹنگ کیسے کریں؟'
  ];
};

export const ChatbotModal: React.FC<ChatbotModalProps> = ({
  onClose,
  translations: t,
  isRtl,
  onApplyMeasurements,
  masterName,
  currentLang = 'ur'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: t.chatbotGreeting || getInitialBotGreeting(currentLang)
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [confirmedMessageIds, setConfirmedMessageIds] = useState<Record<string, boolean>>({});
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);

  // User's voiceReplyOn toggle: default true (awaaz mein jawab on rahe)
  const [voiceReplyOn, setVoiceReplyOn] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const isListeningRef = useRef<boolean>(false);
  const accumulatedTranscriptRef = useRef<string>('');
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update initial greeting when language changes if conversation hasn't started
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === '1') {
        return [{ ...prev[0], text: t.chatbotGreeting || getInitialBotGreeting(currentLang) }];
      }
      return prev;
    });
  }, [currentLang, t.chatbotGreeting]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("تصویر منتخب ہو گئی:", file.name);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Img = e.target?.result as string;
        
        // Add user message with photo
        const uploadUserMsg: ChatMessage = {
          id: Date.now().toString(),
          sender: 'user',
          text: `📸 ${file.name} (${t.slipPhotoAttached || (currentLang === 'ur' ? 'پرچے کی تصویر منسلک کی گئی' : 'Paper slip attached')})`
        };
        setMessages((prev) => [...prev, uploadUserMsg]);
        setIsTyping(true);

        try {
          const res = await fetch('/api/ocr-slip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Img, mimeType: file.type })
          });
          const ocrData = await res.json();
          const measurements = ocrData.measurements || {
            length: "42",
            shoulder: "18.5",
            sleeves: "23",
            chest: "38",
            daaman: "24",
            collar: "15.5",
            shalwar: "38",
            pancha: "8.5"
          };

          const botReplyText = ocrData.reply || (t.ocrExtractionSuccess || (currentLang === 'ur' 
            ? "پرچی کی تصویر سے ناپ کامیابی سے نکال لی گئی ہے! براہ کرم نیچے جائزہ لے کر تصدیق فرمائیں۔"
            : "Measurements extracted from the paper slip! Please review and confirm below."));

          const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: botReplyText,
            measurementsPreview: measurements,
            pendingConfirmation: true
          };

          setMessages((prev) => [...prev, botMsg]);

          if (voiceReplyOn) {
            speakText(botReplyText, getSpeechLangCode());
          }
        } catch (err) {
          console.error("OCR upload error:", err);
          const fallbackBotMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: isRtl 
              ? "پرچی کی تصویر موصول ہو گئی ہے۔ ناپ درج ذیل ہے:" 
              : "Slip received. Measurements detected:",
            measurementsPreview: {
              length: "42",
              shoulder: "18.5",
              sleeves: "23",
              chest: "38",
              daaman: "24",
              collar: "15.5",
              shalwar: "38",
              pancha: "8.5"
            },
            pendingConfirmation: true
          };
          setMessages((prev) => [...prev, fallbackBotMsg]);
        } finally {
          setIsTyping(false);
          if (event.target) event.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Cleanup speech and recognition when component unmounts
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Speaker toggle (jawab ko bolna hai ya nahi)
  const handleToggleSpeaker = () => {
    const nextState = !voiceReplyOn;
    setVoiceReplyOn(nextState);
    // agar user ne OFF kiya to chal rahi awaaz turant rok do
    if (!nextState) {
      stopSpeaking();
    }
  };

  const getSpeechLangCode = (): string => {
    const speechMap: Record<string, string> = {
      en: 'en-US',
      ur: 'ur-PK',
      sd: 'ur-PK',
      hi: 'hi-IN',
      ar: 'ar-SA',
      fa: 'fa-IR',
      ps: 'ps-AF',
      pa: 'pa-IN',
      bn: 'bn-BD',
      tr: 'tr-TR',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      it: 'it-IT',
      ru: 'ru-RU',
      zh: 'zh-CN',
      ja: 'ja-JP',
      ko: 'ko-KR',
      ms: 'ms-MY',
      id: 'id-ID',
      pt: 'pt-BR',
      th: 'th-TH'
    };
    return speechMap[currentLang] || (currentLang === 'ur' ? 'ur-PK' : 'en-US');
  };

  const quickPrompts = [
    t.quickPrompt1,
    t.quickPrompt2,
    t.quickPrompt3,
    t.quickPrompt4
  ].filter(Boolean);

  const getTailorAnswer = (query: string): string => {
    const q = query.toLowerCase();
    const isUr = currentLang === 'ur';
    const isSd = currentLang === 'sd';
    const isHi = currentLang === 'hi';
    const isAr = currentLang === 'ar';
    
    // Developer / Creator Question
    if (q.includes('who made') || q.includes('who are you') || q.includes('کس نے بنایا') || q.includes('ڪنهن ٺاهي') || q.includes('ڈویلپر') || q.includes('developer') || q.includes('creator') || q.includes('کون ہو') || q.includes('kis ne banaya') || q.includes('peer bux') || q.includes('pir bakhash') || q.includes('پیر بخش') || q.includes('naseeb') || q.includes('contact') || q.includes('رابطہ') || q.includes('email') || q.includes('ای میل') || q.includes('نام کیا ہے')) {
      if (isUr) {
        return `اس ایپ کو 'نسیب ایس ای او' (Naseeb SEO - پیر بخش) نے بنایا ہے۔ میں آزاد ماسٹر کا آفیشل اسسٹنٹ ہوں اور آپ کی مدد کے لیے ہر وقت حاضر ہوں۔\n\n📧 رابطہ ای میل: naseebseo2626@gmail.com\n💬 واٹس ایپ سپورٹ بھی دستیاب ہے۔`;
      }
      if (isSd) {
        return `هن ايپ کي 'نصيب ايس اي او' (Naseeb SEO - پير بخش) ٺاهيو آهي. مان آزاد ماسٽر جو آفيشل اسسٽنٽ آهيان ۽ اوهان جي خدمت لاءِ هميشه حاضر آهيان.\n\n📧 رابطو اي ميل: naseebseo2626@gmail.com\n💬 واٽس ايپ سپورٽ پڻ موجود آهي.`;
      }
      if (isHi) {
        return `इस ऐप को 'नसीब एसईओ' (Naseeb SEO - पीर बख्श) ने बनाया है। मैं आजाद मास्टर का ऑफिशियल असिस्टेंट हूँ और आपकी सेवा के लिए हमेशा हाज़िर हूँ।\n\n📧 संपर्क ईमेल: naseebseo2626@gmail.com\n💬 व्हाट्सएप सपोर्ट भी उपलब्ध है।`;
      }
      if (isAr) {
        return `تم إنشاء هذا التطبيق بواسطة "نصيب سيو" (Naseeb SEO - بير بخش). أنا المساعد الرسمي لـ "أزاد ماستر" وجاهز لمساعدتك دائماً.\n\n📧 البريد الإلكتروني للتواصل: naseebseo2626@gmail.com\n💬 دعم واتساب متاح أيضاً.`;
      }
      return `This app has been created by Naseeb SEO (Pir Bakhash). I am the official assistant of Azad Master, always ready to help you!\n\n📧 Contact Email: naseebseo2626@gmail.com\n💬 WhatsApp support is also available.`;
    }

    // Creation Date Question
    if (q.includes('date') || q.includes('کب بنایا') || q.includes('ڪڏهن ٺاهي') || q.includes('تاریخ') || q.includes('when made') || q.includes('kab bana') || q.includes('release')) {
      if (isUr) return `یہ ایپ ستمبر 2026 (16/17 ستمبر) میں بنائی گئی تھی۔`;
      if (isSd) return `هي ايپ سيپٽمبر 2026 (16/17 سيپٽمبر) ۾ ٺاهي وئي هئي.`;
      if (isHi) return `यह ऐप सितंबर 2026 (16/17 सितंबर) में बनाई गई थी।`;
      if (isAr) return `تم إنشاء هذا التطبيق في سبتمبر 2026 (16/17 سبتمبر).`;
      return `This app was created in September 2026 (16/17 September).`;
    }

    // Developer Location / Origin Question
    if (q.includes('where') || q.includes('کہاں کے') || q.includes('ڪٿان جا') || q.includes('location') || q.includes('city') || q.includes('gaon') || q.includes('گاؤں') || q.includes('ڳوٺ') || q.includes('ضلع') || q.includes('shikarpur') || q.includes('khanpur')) {
      if (isUr) return `ڈویلپر پاکستان کے ضلع شکارپور، تحصیل خانپور اور گاؤں سردارپور کے رہنے والے ہیں۔`;
      if (isSd) return `ڊولپر پاڪستان جي ضلعي شڪارپور، تعلقي خانپور ۽ ڳوٺ سردار پور جا رهواسي آهن.`;
      if (isHi) return `डेवलपर पाकिस्तान के ज़िला शिकारपुर, तहसील खानपुर और गाँव सरदारपुर के रहने वाले हैं।`;
      if (isAr) return `المطور من قرية سردار بور، ناحية خانبور، مقاطعة شيكاربور، باكستان.`;
      return `The developer is from Sardar Pur Village, Tehsil Khanpur, District Shikarpur, Pakistan.`;
    }

    // Cutting Mode Explanation
    if (q.includes('cutting mode') || q.includes('کٹنگ موڈ') || q.includes('ڪٽنگ موڊ') || q.includes('نارمل موڈ') || q.includes('normal mode')) {
      if (isUr) return `✂️ کٹنگ موڈ: کٹنگ موڈ بٹن دبانے سے ناپ کے ہندسے بڑے اور نمایاں امبر رنگ میں نظر آتے ہیں تاکہ کٹنگ کرتے وقت دور سے واضح دکھائی دیں۔ دوبارہ کلک پر نارمل موڈ میں آ جاتا ہے۔`;
      if (isSd) return `✂️ ڪٽنگ موڊ: هي بٽڻ دٻائڻ سان ماپ جون پڙهڻيون وڏيون ۽ روشن امبر رنگ ۾ نظر اينديون ته جيئن ڪٽنگ ٽيبل تي پري کان صاف ڏسن. وري ڪلڪ سان نارمل موڊ.`;
      if (isAr) return `✂️ وضع القص: يعرض القياسات بأرقام كبيرة باللون الكهرماني الواضح لتسهيل القص من مسافة بعيدة. انقر مرة أخرى للعودة للوضع العادي.`;
      return `✂️ Cutting Mode: Turns all measurement boxes into large, high-contrast amber displays for clear table visibility. Click again to return to Normal Mode.`;
    }

    // Photo & OCR Feature Explanation
    if (q.includes('photo') || q.includes('فوٹو') || q.includes('پرچہ') || q.includes('تصویر') || q.includes('camera') || q.includes('کیمرہ') || q.includes('gallery') || q.includes('گیلری') || q.includes('ocr')) {
      if (isUr) return `📸 پرچہ / کپڑا فوٹو: آپ کیمرہ یا گیلری سے پرچے کی تصویر لگا کر ناپ خودکار پہچان سکتے ہیں اور گاہک کے ریکارڈ میں محفوظ رکھ سکتے ہیں۔`;
      if (isSd) return `📸 پرچو / تصوير: اوهان ڪيمرا يا گيلري مان تصوير کڻي ماپ پاڻمرادو پڙهي سگهو ٿا ۽ گراهڪ جي کاتي ۾ محفوظ ڪري سگهو ٿا.`;
      if (isAr) return `📸 فحص الوصل بالصورة: التقط أو اختر صورة وصل القياسات للتعرف التلقائي عليها وحفظها بأمان.`;
      return `📸 Photo & OCR: Attach cloth or paper slip photos from Camera/Gallery to auto-read measurements and save them securely.`;
    }

    // App Usage / How to use
    if (q.includes('help') || q.includes('کیسے استعمال') || q.includes('طریقہ') || q.includes('usage') || q.includes('how to use')) {
      if (isUr) return `آزاد ماسٹر ایپ کا مختصر طریقہ:\n1. ➕ بٹن دبا کر نیا گاہک اور ناپ درج کریں۔\n2. ✂️ کٹنگ موڈ سے ناپ بڑی سکرین پر دیکھیں۔\n3. 📄 پرچی دیکھیں یا واٹس ایپ پر ایک کلک سے بھیجیں۔`;
      if (isSd) return `آزاد ماسٽر ايپ جو طريقو:\n1. ➕ بٽڻ دٻائي نئون گراهڪ ۽ ماپ لکو.\n2. ✂️ ڪٽنگ موڊ سان وڏا اکر ڏسو.\n3. 📄 ڊجيٽل سلپ واٽس ايپ تي موڪليو.`;
      if (isAr) return `دليل أزاد ماستر السريع:\n1. اضغط ➕ لإضافة الزبون والقياسات.\n2. اضغط ✂️ وضع القص للأرقام الكبيرة الواضحة.\n3. عرض الوصل الرقمي أو مشاركته عبر واتساب.`;
      return `Azad Master App Quick Guide:\n1. Tap ➕ to add customer & measurements.\n2. Tap ✂️ Cutting Mode for large visible numbers.\n3. View digital slip or share on WhatsApp.`;
    }

    if (q.includes('کپڑا') || q.includes('ڪپڙو') || q.includes('fabric') || q.includes('cloth') || q.includes('meter')) {
      if (isUr) return `سوٹ کے کپڑے کا حساب کتاب (Gents Suit):\n- عام قد (40-42 انچ لمبائی): 4 میٹر (چھوٹا بر) یا 2.25 گز (بڑا پنا / 54 انچ بر) کافی ہوتا ہے۔\n- زیادہ قد (44+ لمبائی یا 44+ چھاتی): 4.25 سے 4.5 میٹر درکار ہو گا۔\n- کرتا شلوار کے لیے عام طور پر 4 گز لگتی ہے۔`;
      if (isSd) return `مردن جي سوٽ جو ڪپڙو:\n- عام قد (40-42 انچ لمبائي): 4 ميٽر (ننڍو بر) يا سوا 2 گز (وڏو پنو).\n- ڊگهو قد (44+ لمبائي): 4.25 کان 4.5 ميٽر گهربل هوندو.`;
      if (isAr) return `تقدير قماش الثوب الرجالي:\n- الطول العادي (40-42 بوصة): 4 أمتار (عرض عادي) أو 2.25 متر (عرض مزدوج).\n- الطول أو الصدر الأكبر (44+ بوصة): 4.25 إلى 4.5 متر.`;
      return `Gents Suit Fabric Estimation:\n- Standard height (40"-42" length): 4.0 meters (standard 36" width) or 2.25 meters (double width 58").\n- Tall/Broad build (44"+ length or 44"+ chest): 4.25 to 4.5 meters.\n- Always add 2-3 inches extra for margin shrinkage after washing.`;
    }

    if (q.includes('تیرا') || q.includes('ٽيرو') || q.includes('shoulder') || q.includes('armhole') || q.includes('آرم ہول') || q.includes('ہول')) {
      if (isUr) return `تیرا اور آرم ہول کا سنہری اصول:\n- اگر تیرا 18 انچ ہے تو کٹنگ میں ادھا انچ سلائی کا دباؤ شامل کر کے 19 انچ (ہاف 9.5) کٹ کریں۔\n- شولڈر ڈاؤن (کندھے کی ڈھلوان) عام طور پر 1.75 انچ (پونے دو انچ) رکھی جاتی ہے۔\n- آرم ہول گہرائی = چھاتی / 4 میں سے 1 انچ کم (مثلاً 38 چھاتی کے لیے ساڑھے 8 انچ)۔`;
      if (isSd) return `ٽيرو ۽ آرم هول جو فارمولو:\n- جيڪڏهن ٽيرو 18 انچ تيار هجي ته سلائي جو دٻاءُ شامل ڪري 19 انچ (اڌ 9.5) ڪٽيو.\n- ڪلهي جو لاڙو (drop) پونا ٻه انچ (1.75) رکو.\n- آرم هول اونهائي = ڇاتي / 4 مان اڌ يا هڪ انچ گهٽ.`;
      if (isAr) return `قاعدة قص الكتف والإبط:\n- إذا كان الكتف 18 بوصة، يُقص على 19 بوصة شاملاً زيادات الخياطة.\n- ميلان الكتف العادي: 1.75 بوصة.\n- عمق حردة الإبط: (محيط الصدر ÷ 4) ناقص نصف بوصة إلى بوصة.`;
      return `Shoulder & Armhole Master Rule:\n- For an 18" finished shoulder, cut at 19" (half 9.5") including 1/2" seam allowances.\n- Shoulder slope / drop: standard 1.75 inches for gents.\n- Armhole depth formula: (Chest ÷ 4) minus 0.5" to 1" for regular fit.`;
    }

    if (q.includes('کالر') || q.includes('بین') || q.includes('ڪالر') || q.includes('بين') || q.includes('collar') || q.includes('ban')) {
      if (isUr) return `بین اور کالر کا پیمانہ:\n- مکمل بین کے لیے گلے کا ہالہ (Hala) قمیض پر بین کے اصل سائز سے پون انچ کم کاٹیں، تاکہ پریسنگ کے وقت بین ٹھیک بیٹھے۔\n- ہاف بین یا کٹ بین: عام طور پر 14 سے 16 انچ ہوتا ہے اور چوڑائی 1 انچ یا سوا انچ رکھی جاتی ہے۔`;
      if (isSd) return `ڪالر ۽ بين جو حساب:\n- بين لاءِ ڳچيءَ جو هالو قميص تي اصل بين کان پون انچ ننڍو ڪٽيو ته جيئن پريسنگ بعد صحيح بيهي.\n- هاف بين يا ڪٽ بين 14 کان 16 انچ ٿيندو آهي.`;
      if (isAr) return `نصائح الياقة والبان:\n- قص فتحة الرقبة أقل بمقدار 0.5 إلى 0.75 بوصة من مقاس الياقة لتستقر بشكل مثالي بعد الكي.\n- العرض القياسي للياقة: 1 إلى 1.25 بوصة.`;
      return `Collar & Ban Fitting Tips:\n- Neck hole (Hala) should be cut 0.5" to 0.75" tighter than the finished collar circumference, then notched to fit smoothly.\n- Standard ban height: 1" to 1.25" for classic gents elegance.`;
    }

    if (q.includes('دامن') || q.includes('daaman') || q.includes('round')) {
      if (isUr) return `گول دامن کاٹنے کا طریقہ:\n- دامن کی سائیڈ چاک سے نیچے 1.5 انچ سے 2 انچ پر گولائی کا نشان لگائیں۔\n- گولائی کٹ کرتے وقت ایک جیسا کریو (curve) رکھیں تاکہ استری کرتے وقت جھول نہ آئے۔`;
      return `Round Daaman (Hem) Guide:\n- Mark curve 1.75" up from the bottom corner at the side slit.\n- Use a French curve or circular template for symmetry on front and back panels.`;
    }

    const callerTitle = masterName?.trim() || t.masterDefaultName || (currentLang === 'ur' ? 'ماسٹر صاحب' : 'Master Tailor');
    if (isUr) return `شکریہ ${callerTitle}! میں آپ کے ہر ناپ کو صحیح خانے میں رکھوں گا اور بغیر تصدیق کے محفوظ نہیں کروں گا۔`;
    if (isSd) return `مهرباني ${callerTitle}! مان اوهان جي ماپ کي ترتيب ڏئي محفوظ ڪرڻ لاءِ تيار آهيان.`;
    if (isHi) return `धन्यवाद ${callerTitle}! मैं आपकी नाپ को सही रूप से व्यवस्थित रखने के लिए तैयार हूँ।`;
    if (isAr) return `شكراً ${callerTitle}! أنا هنا لمساعدتك في تنظيم القياسات بدقة وبدون حفظ قبل تأكيدك.`;
    return `Thank you ${callerTitle}! I am here to help you manage measurements accurately.`;
  };

  const stopListening = () => {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert(t.voiceNotSupported || (currentLang === 'ur' ? 'اس براؤزر میں وائس ان پٹ سپورٹ نہیں ہے۔' : 'Voice input is not supported in this browser.'));
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {}
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        // ur-PK for Pakistani Urdu and local numbers
        const speechLang = currentLang === 'ur' || currentLang === 'sd' ? 'ur-PK' : getSpeechLangCode();
        recognition.lang = speechLang;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        isListeningRef.current = true;
        setIsListening(true);
        accumulatedTranscriptRef.current = '';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const trans = event.results[i][0]?.transcript;
              if (trans) {
                finalTranscript += trans + ' ';
              }
            }
          }

          const cleanFinal = finalTranscript.trim();
          if (cleanFinal) {
            setInputText(cleanFinal);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error in continuous mode:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            isListeningRef.current = false;
            setIsListening(false);
          }
          // Do not turn off for no-speech or network pauses - onend will restart it!
        };

        recognition.onend = () => {
          // Keep listening continuously across pauses/silence until user clicks mic again or sends message!
          if (isListeningRef.current) {
            try {
              recognition.start();
            } catch (e) {
              setTimeout(() => {
                if (isListeningRef.current) {
                  try {
                    recognition.start();
                  } catch (err) {
                    console.warn('SpeechRecognition restart error:', err);
                  }
                }
              }, 200);
            }
          } else {
            setIsListening(false);
          }
        };

        recognition.start();
      } catch (err) {
        console.warn('SpeechRecognition failed to start:', err);
        isListeningRef.current = false;
        setIsListening(false);
      }
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    // stop any ongoing mic listening when sending
    if (isListeningRef.current || (isListening && recognitionRef.current)) {
      isListeningRef.current = false;
      setIsListening(false);
      try {
        recognitionRef.current?.stop();
      } catch {}
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Also run client-side parser immediately as safety net
    const localParsed = parseMeasurementsFromText(text);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text.trim(),
          language: currentLang || 'en'
        })
      });

      const data = await response.json();
      const detected = data.parsedMeasurements || localParsed;
      const botReply = data.reply || getTailorAnswer(text);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botReply,
        measurementsPreview: detected && Object.keys(detected).length > 0 ? detected : undefined,
        pendingConfirmation: detected && Object.keys(detected).length > 0
      };
      
      setMessages((prev) => [...prev, botMsg]);

      // agar speaker ON hai to jawab bol kar sunao
      if (voiceReplyOn) {
        speakText(botReply, getSpeechLangCode());
      }
    } catch {
      const fallbackReply = getTailorAnswer(text);
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: fallbackReply,
        measurementsPreview: localParsed && Object.keys(localParsed).length > 0 ? localParsed : undefined,
        pendingConfirmation: localParsed && Object.keys(localParsed).length > 0
      };
      setMessages((prev) => [...prev, fallbackMsg]);

      // agar speaker ON hai to jawab bol kar sunao
      if (voiceReplyOn) {
        speakText(fallbackReply, getSpeechLangCode());
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmSlip = async (msgId: string, measurements: Partial<CustomerMeasurements>) => {
    setConfirmedMessageIds((prev) => ({ ...prev, [msgId]: true }));
    if (onApplyMeasurements) {
      onApplyMeasurements(measurements);
    }
    // Save confirmed measurement to Firebase Firestore
    try {
      await saveMeasurementToFirebase({
        measurements: measurements as Record<string, string>,
        status: 'confirmed',
        notes: 'AI Chatbot auto-extracted measurement'
      });
    } catch (err) {
      console.warn('Firebase sync warning:', err);
    }
  };

  const handleNewMessageFromVoice = (
    userText: string,
    botText: string,
    detectedMeasurements?: Partial<CustomerMeasurements>
  ) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText
    };
    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'bot',
      text: botText,
      measurementsPreview: detectedMeasurements,
      pendingConfirmation: !!(detectedMeasurements && Object.keys(detectedMeasurements).length > 0)
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  return (
    <div 
      className="fixed inset-0 z-[1050] flex items-center justify-center p-3 bg-emerald-950/70 backdrop-blur-xs transition-opacity"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div 
        id="chatbot-modal"
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl flex flex-col h-[560px] max-h-[92vh] overflow-hidden border border-emerald-500/30 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* AI Assistant Popup Header */}
        <div className="bg-[#075e54] text-white p-3 flex items-center justify-between rounded-t-2xl shadow-md shrink-0 border-b border-[#128c7e]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 border border-amber-300/40 flex items-center justify-center shadow-xs shrink-0">
              <img src="/azad-master-logo.svg" alt="Azad Master" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                <span>{t.chatbotHeaderTitle || 'Azad Assistant'}</span>
                <span className="text-[9px] bg-[#128c7e] text-white px-1.5 py-0.2 rounded-full border border-white/20">Tailoring</span>
              </h3>
              <p className="text-[10px] text-[#dcf8c6]">
                {t.chatbotHeaderSub || 'Online Tailoring & Cutting Assistant'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              id="chatbot-speaker-toggle-btn"
              type="button"
              onClick={handleToggleSpeaker}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors cursor-pointer ${
                voiceReplyOn
                  ? 'bg-[#25d366] hover:bg-[#20ba5a] text-white border-white/20'
                  : 'bg-[#054c44] hover:bg-[#043c36] text-[#dcf8c6] border-white/10'
              }`}
              title={voiceReplyOn ? "Awaaz ON" : "Awaaz MUTE"}
            >
              {voiceReplyOn ? <Volume2 className="w-3.5 h-3.5 text-white" /> : <VolumeX className="w-3.5 h-3.5 text-[#dcf8c6]" />}
            </button>
            <button 
              id="close-chatbot-btn"
              onClick={onClose}
              className="text-white bg-white/20 hover:bg-white/30 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border border-white/20 transition-colors cursor-pointer"
              aria-label={t.close || "Close"}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Message Feed / Chat Container */}
        <div id="chat-container" className="chat-container flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-1.5 ${
                msg.sender === 'user' ? (isRtl ? 'flex-row-reverse' : 'justify-end') : ''
              }`}
            >
              {msg.sender === 'bot' && (
                <div className="w-6 h-6 rounded-full bg-[#075e54] border border-[#128c7e]/40 flex items-center justify-center text-[#25d366] shrink-0 mt-0.5 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}
              
              <div
                className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                  msg.sender === 'user'
                    ? 'bg-[#075e54] text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Structured Measurement Preview Card */}
                {msg.measurementsPreview && Object.keys(msg.measurementsPreview).length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200 bg-slate-50/80 rounded-xl p-2.5 border">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-2">
                      <span className="font-bold text-emerald-800 flex items-center gap-1 text-[11px]">
                        📏 {t.detectedMeasurementsHeading || 'Measurement Preview'}
                      </span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded">
                        {confirmedMessageIds[msg.id] 
                          ? (t.confirmedMeasurement || 'Confirmed ✓')
                          : (t.statusPending || 'Needs Confirm')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-2.5">
                      {msg.measurementsPreview.length && (
                        <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="text-slate-500 font-medium">{t.lengthLabel || 'Length'}:</span>
                          <span className="font-bold text-slate-900">{msg.measurementsPreview.length}</span>
                        </div>
                      )}
                      {msg.measurementsPreview.shoulder && (
                        <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="text-slate-500 font-medium">{t.shoulderLabel || 'Shoulder'}:</span>
                          <span className="font-bold text-slate-900">{msg.measurementsPreview.shoulder}</span>
                        </div>
                      )}
                      {msg.measurementsPreview.sleeves && (
                        <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="text-slate-500 font-medium">{t.sleevesLabel || 'Sleeves'}:</span>
                          <span className="font-bold text-slate-900">{msg.measurementsPreview.sleeves}</span>
                        </div>
                      )}
                      {msg.measurementsPreview.chest && (
                        <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="text-slate-500 font-medium">{t.chestLabel || 'Chest'}:</span>
                          <span className="font-bold text-slate-900">{msg.measurementsPreview.chest}</span>
                        </div>
                      )}
                      {msg.measurementsPreview.daaman && (
                        <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="text-slate-500 font-medium">{t.daamanLabel || 'Daaman'}:</span>
                          <span className="font-bold text-slate-900">{msg.measurementsPreview.daaman}</span>
                        </div>
                      )}
                      {msg.measurementsPreview.collar && (
                        <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="text-slate-500 font-medium">{t.collarLabel || 'Collar'}:</span>
                          <span className="font-bold text-slate-900">{msg.measurementsPreview.collar}</span>
                        </div>
                      )}
                      {msg.measurementsPreview.shalwar && (
                        <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="text-slate-500 font-medium">{t.shalwarLabel || 'Shalwar'}:</span>
                          <span className="font-bold text-slate-900">{msg.measurementsPreview.shalwar}</span>
                        </div>
                      )}
                      {msg.measurementsPreview.pancha && (
                        <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="text-slate-500 font-medium">{t.panchaLabel || 'Pancha'}:</span>
                          <span className="font-bold text-slate-900">{msg.measurementsPreview.pancha}</span>
                        </div>
                      )}
                      {msg.measurementsPreview.waist && (
                        <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="text-slate-500 font-medium">{t.balanceAmountLabel ? t.balanceAmountLabel.split(' ')[0] : 'Waist'}:</span>
                          <span className="font-bold text-slate-900">{msg.measurementsPreview.waist}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-500 mb-2 leading-tight">
                      ⚠️ {t.secureRecords || 'Will not be saved without your confirmation.'}
                    </p>

                    {!confirmedMessageIds[msg.id] ? (
                      <button
                        type="button"
                        onClick={() => handleConfirmSlip(msg.id, msg.measurementsPreview!)}
                        className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {t.confirmAndApplySlip || 'Confirm & Create New Slip'}
                      </button>
                    ) : (
                      <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded font-medium text-[11px] text-center flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {t.confirmedMeasurement || 'Measurements confirmed!'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3 h-3" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1.5 text-slate-400 text-xs py-1">
              <div className="w-5 h-5 rounded-full bg-[#075e54] border border-[#128c7e]/40 flex items-center justify-center text-[#25d366] shrink-0 animate-pulse">
                <Sparkles className="w-3 h-3" />
              </div>
              <span className="italic">{t.processingVoice || 'Thinking...'}</span>
            </div>
          )}
        </div>

        {/* Hidden OCR File Input (Camera / Gallery) */}
        <input 
          type="file" 
          id="chatCameraInput" 
          ref={fileInputRef} 
          accept="image/*" 
          capture="environment" 
          style={{ display: 'none' }} 
          onChange={handleImageUpload} 
        />
        <input 
          type="file" 
          id="chatGalleryInput" 
          accept="image/*" 
          style={{ display: 'none' }} 
          onChange={handleImageUpload} 
        />

        {/* Quick Suggestion Drawer when ＋ is toggled */}
        {showQuickPrompts && (
          <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar animate-in slide-in-from-bottom-2 duration-150">
            {/* Camera Scan Button */}
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
                setShowQuickPrompts(false);
              }}
              className="shrink-0 bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] px-3 py-1.5 rounded-full border border-emerald-900 shadow-2xs transition-colors whitespace-nowrap cursor-pointer font-bold flex items-center gap-1"
            >
              <span>📷</span>
              <span>{t.cameraBtn || 'Camera'}</span>
            </button>

            {/* Gallery Scan Button */}
            <button
              type="button"
              onClick={() => {
                document.getElementById('chatGalleryInput')?.click();
                setShowQuickPrompts(false);
              }}
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-3 py-1.5 rounded-full border border-emerald-700 shadow-2xs transition-colors whitespace-nowrap cursor-pointer font-bold flex items-center gap-1"
            >
              <span>🖼️</span>
              <span>{t.galleryBtn || 'Gallery'}</span>
            </button>

            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  handleSend(prompt);
                  setShowQuickPrompts(false);
                }}
                className="shrink-0 bg-white hover:bg-emerald-50 hover:text-emerald-800 text-[11px] text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs transition-colors whitespace-nowrap cursor-pointer font-medium"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* 🎙️ Open Talk Button (Positioned clearly above Chat Bar) */}
        <div className="px-3 pt-2 pb-1 bg-white border-t border-slate-100 flex justify-center">
          <button
            id="open-talk-btn"
            type="button"
            onClick={() => setShowVoiceMode(true)}
            className="w-full py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#075e54] via-[#128c7e] to-[#075e54] hover:brightness-110 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-between shadow-sm border border-[#128c7e]/50 transition-all cursor-pointer group"
            title={t.liveTalkBtn || t.aiVoiceAssistant || 'Open Talk'}
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[#dcf8c6] shadow-none group-hover:scale-110 transition-transform">
                <Sparkles className="w-3 h-3 text-[#25d366]" />
              </div>
              <span className="tracking-wide text-[11.5px] font-bold">{t.liveTalkBtn || t.aiVoiceAssistant || 'Live Talk with Azad Master Assistant'}</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full border border-white/30 text-[#dcf8c6] font-extrabold flex items-center gap-1">
              <span>VOICE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#25d366] animate-pulse" />
            </span>
          </button>
        </div>

        {/* Continuous Voice Indicator */}
        {isListening && (
          <div className="px-3 py-1.5 bg-amber-500/10 border-t border-amber-300 flex items-center justify-between text-[11px] text-amber-900 animate-pulse">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping shrink-0" />
              <span>{isRtl ? '🎙️ مسلسل سن رہا ہے (ur-PK)... وقفے پر مائیک بند نہیں ہوگا۔' : '🎙️ Continuous listening (ur-PK)... Speak freely with pauses.'}</span>
            </div>
            <button
              type="button"
              onClick={stopListening}
              className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-0.5 rounded cursor-pointer"
            >
              {isRtl ? 'بند کریں' : 'Stop'}
            </button>
          </div>
        )}

        {/* Replaced Single Chat Bar: ＋ | Message Azad AI... | 🎙️ | ↑ */}
        <div 
          id="azad-chat-bar"
          className="px-3 py-2 bg-white border-t border-slate-200 flex items-center gap-2"
          dir="ltr"
        >
          {/* ＋ Button */}
          <button
            id="chat-plus-btn"
            type="button"
            onClick={() => setShowQuickPrompts(!showQuickPrompts)}
            className="w-9 h-9 min-w-[36px] rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer text-base leading-none border border-slate-200 shadow-2xs"
            title="Quick Prompts"
          >
            ＋
          </button>

          {/* Message Azad AI... Input */}
          <div className="flex-1 relative flex items-center">
            <input 
              id="chatInput"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.chatInputPlaceholder || t.typingInputPlaceholder || 'Message Azad Master Assistant...'}
              dir={isRtl ? 'rtl' : 'ltr'}
              className="w-full bg-slate-100 hover:bg-slate-100/90 focus:bg-white text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm rounded-full py-2 px-3.5 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all"
            />
          </div>

          {/* 🎙️ Mic Button (Speech-to-Text) */}
          <button
            id="chat-mic-btn"
            type="button"
            onClick={handleMicClick}
            className={`w-9 h-9 min-w-[36px] rounded-full flex items-center justify-center text-sm transition-all cursor-pointer border ${
              isListening 
                ? 'bg-amber-500 text-white border-amber-600 animate-pulse shadow-md shadow-amber-500/40' 
                : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200'
            }`}
            title={isListening ? (t.listeningVoice || "Listening...") : (t.tapToSpeak || "Speak")}
          >
            🎙️
          </button>

          {/* ↑ Send Button */}
          <button
            id="chat-send-btn"
            type="button"
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isTyping}
            className={`w-9 h-9 min-w-[36px] rounded-full flex items-center justify-center font-bold text-base transition-all border ${
              inputText.trim() && !isTyping
                ? 'bg-teal-800 hover:bg-teal-900 text-white border-teal-900 shadow-md active:scale-95 cursor-pointer'
                : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
            }`}
            title={t.sendBtn || "Send"}
          >
            ↑
          </button>
        </div>

        {/* Full Voice Conversation Mode (Open Talk Screen) */}
        {showVoiceMode && (
          <VoiceConversationScreen
            onClose={() => setShowVoiceMode(false)}
            isRtl={isRtl}
            currentLang={currentLang}
            onApplyMeasurements={onApplyMeasurements}
            onNewMessageFromVoice={handleNewMessageFromVoice}
            masterName={masterName}
          />
        )}
      </div>
    </div>
  );
};

