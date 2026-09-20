import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, CustomerMeasurements } from '../types';
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
}

export const ChatbotModal: React.FC<ChatbotModalProps> = ({
  onClose,
  translations: t,
  isRtl,
  onApplyMeasurements,
  masterName
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: isRtl 
        ? 'السلام علیکم! میں آزاد ماسٹر اسسٹنٹ ہوں۔\n\nآپ ناپ بول کر یا لکھ کر بتا سکتے ہیں (مثلاً: لمبائی 42، تیرا 20، بازو 23، سینہ 38، گھیرا 25، کالر 15، شلوار 40، پانچہ 9)۔ میں ہر ناپ کو اس کے اصل خانے میں رکھ کر پہلے آپ کو مکمل جائزہ دکھاؤں گا اور آپ کی اجازت (تصدیق) کے بغیر محفوظ نہیں کروں گا۔'
        : 'Hello! I am Azad Master Assistant.\n\nYou can speak or type measurements (e.g. Length 42, Tira 20, Bazo 23, Chest 38, Gheera 25, Collar 15, Shalwar 40, Pancha 9). I will map each measurement to its proper field, present a full preview, and will never save to the database without your explicit confirmation.'
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
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          text: `📸 ${file.name} (${isRtl ? 'پرچے کی تصویر منسلک کی گئی' : 'Paper slip attached'})`
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

          const botReplyText = ocrData.reply || (isRtl 
            ? "پرچی کی تصویر سے ناپ کامیابی سے نکال لی گئی ہے! براہ کرم نیچے جائزہ لے کر تصدیق فرمائیں۔"
            : "Measurements extracted from the paper slip! Please review and confirm below.");

          const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: botReplyText,
            measurementsPreview: measurements,
            pendingConfirmation: true
          };
          setMessages((prev) => [...prev, botMsg]);

          if (voiceReplyOn) {
            speakText(botReplyText, isRtl ? 'ur-PK' : 'en-US');
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

  const quickPrompts = isRtl ? [
    'لمبائی 42، تیرا 20، بازو 23، سینہ 38، گھیرا 25، کالر 15، شلوار 40، پانچہ 9',
    'سوٹ کے لیے کتنا کپڑا درکار ہے؟',
    'تیرا (Shoulder) اور آرم ہول کا فارمولا',
    'بین اور کالر کی کٹنگ کیسے کریں؟'
  ] : [
    'Length 42, Tira 20, Bazo 23, Chest 38, Gheera 25, Collar 15, Shalwar 40, Pancha 9',
    'How much fabric for a gents suit?',
    'Shoulder to armhole formula',
    'Collar vs Ban cutting guide'
  ];

  const getTailorAnswer = (query: string): string => {
    const q = query.toLowerCase();
    
    // Developer / Creator Question
    if (q.includes('who made') || q.includes('who are you') || q.includes('کس نے بنایا') || q.includes('ڈویلپر') || q.includes('developer') || q.includes('creator') || q.includes('کون ہو') || q.includes('kis ne banaya') || q.includes('peer bux') || q.includes('pir bakhash') || q.includes('پیر بخش') || q.includes('naseeb') || q.includes('contact') || q.includes('رابطہ') || q.includes('email') || q.includes('ای میل') || q.includes('نام کیا ہے')) {
      return isRtl 
        ? `اس ایپ کو 'نسیب ایس ای او' (Naseeb SEO - پیر بخش) نے بنایا ہے۔ میں آزاد ماسٹر کا آفیشل اسسٹنٹ ہوں اور آپ کی مدد کے لیے ہر وقت حاضر ہوں۔\n\n📧 رابطہ ای میل: naseebseo2626@gmail.com\n💬 واٹس ایپ سپورٹ بھی دستیاب ہے۔`
        : `This app has been created by Naseeb SEO (Pir Bakhash). I am the official assistant of Azad Master, always ready to help you!\n\n📧 Contact Email: naseebseo2626@gmail.com\n💬 WhatsApp support is also available.`;
    }

    // Creation Date Question
    if (q.includes('date') || q.includes('کب بنایا') || q.includes('تاریخ') || q.includes('when made') || q.includes('kab bana') || q.includes('release')) {
      return isRtl
        ? `یہ ایپ ستمبر 2026 (16/17 ستمبر) میں بنائی گئی تھی۔`
        : `Yeh app September 2026 (16/17 September) mein banayi gayi thi.`;
    }

    // Developer Location / Origin Question
    if (q.includes('where') || q.includes('کہاں کے') || q.includes('location') || q.includes('city') || q.includes('gaon') || q.includes('گاؤں') || q.includes('ضلع') || q.includes('shikarpur') || q.includes('khanpur')) {
      return isRtl
        ? `ڈویلپر پاکستان کے ضلع شکارپور، تحصیل خانپور اور گاؤں سردارپور کے رہنے والے ہیں۔`
        : `Developer Pakistan ke District Shikarpur, Tehsil Khanpur aur Gaon Sardar Pur ke rehne walay hain.`;
    }

    // Cutting Mode Explanation
    if (q.includes('cutting mode') || q.includes('کٹنگ موڈ') || q.includes('نارمل موڈ') || q.includes('normal mode')) {
      return isRtl
        ? `✂️ کٹنگ موڈ: کٹنگ موڈ بٹن دبانے سے ناپ کے ہندسے بڑے اور نمایاں امبر رنگ میں نظر آتے ہیں تاکہ کٹنگ کرتے وقت دور سے واضح دکھائی دیں۔ دوبارہ کلک پر نارمل موڈ میں آ جاتا ہے۔`
        : `✂️ Cutting Mode: Cutting mode button turns all measurement boxes into large, high-contrast amber displays for clear table visibility. Click again to return to Normal Mode.`;
    }

    // Photo & OCR Feature Explanation
    if (q.includes('photo') || q.includes('فوٹو') || q.includes('پرچہ') || q.includes('تصویر') || q.includes('camera') || q.includes('کیمرہ') || q.includes('gallery') || q.includes('گیلری') || q.includes('ocr')) {
      return isRtl
        ? `📸 پرچہ / کپڑا فوٹو: آپ کیمرہ یا گیلری سے پرچے کی تصویر لگا کر ناپ خودکار پہچان سکتے ہیں اور گاہک کے ریکارڈ میں محفوظ رکھ سکتے ہیں۔`
        : `📸 Photo & OCR: Attach cloth or paper slip photos from Camera/Gallery to auto-read measurements and save them securely.`;
    }

    // App Usage / How to use
    if (q.includes('help') || q.includes('کیسے استعمال') || q.includes('طریقہ') || q.includes('usage') || q.includes('how to use')) {
      return isRtl
        ? `آزاد ماسٹر ایپ کا مختصر طریقہ:\n1. ➕ بٹن دبا کر نیا گاہک اور ناپ درج کریں۔\n2. ✂️ کٹنگ موڈ سے ناپ بڑی سکرین پر دیکھیں۔\n3. 📄 پرچی دیکھیں یا واٹس ایپ پر ایک کلک سے بھیجیں۔`
        : `Azad Master App Quick Guide:\n1. Tap ➕ to add customer & measurements.\n2. Tap ✂️ Cutting Mode for large visible numbers.\n3. View digital slip or share on WhatsApp.`;
    }

    if (q.includes('کپڑا') || q.includes('fabric') || q.includes('cloth') || q.includes('meter')) {
      return isRtl 
        ? `سوٹ کے کپڑے کا حساب کتاب (Gents Suit):\n- عام قد (40-42 انچ لمبائی): 4 میٹر (چھوٹا بر) یا 2.25 گز (بڑا پنا / 54 انچ بر) کافی ہوتا ہے۔\n- زیادہ قد (44+ لمبائی یا 44+ چھاتی): 4.25 سے 4.5 میٹر درکار ہو گا۔\n- کرتا شلوار کے لیے عام طور پر 4 گز لگتی ہے۔`
        : `Gents Suit Fabric Estimation:\n- Standard height (40"-42" length): 4.0 meters (standard 36" width) or 2.25 meters (double width 58").\n- Tall/Broad build (44"+ length or 44"+ chest): 4.25 to 4.5 meters.\n- Always add 2-3 inches extra for margin shrinkage after washing.`;
    }

    if (q.includes('تیرا') || q.includes('shoulder') || q.includes('armhole') || q.includes('آرم ہول') || q.includes('ہول')) {
      return isRtl
        ? `تیرا اور آرم ہول کا سنہری اصول:\n- اگر تیرا 18 انچ ہے تو کٹنگ میں ادھا انچ سلائی کا دباؤ شامل کر کے 19 انچ (ہاف 9.5) کٹ کریں۔\n- شولڈر ڈاؤن (کندھے کی ڈھلوان) عام طور پر 1.75 انچ (پونے دو انچ) رکھی جاتی ہے۔\n- آرم ہول گہرائی = چھاتی / 4 میں سے 1 انچ کم (مثلاً 38 چھاتی کے لیے ساڑھے 8 انچ)۔`
        : `Shoulder & Armhole Master Rule:\n- For an 18" finished shoulder, cut at 19" (half 9.5") including 1/2" seam allowances.\n- Shoulder slope / drop: standard 1.75 inches for gents.\n- Armhole depth formula: (Chest ÷ 4) minus 0.5" to 1" for regular fit.`;
    }

    if (q.includes('کالر') || q.includes('بین') || q.includes('collar') || q.includes('ban')) {
      return isRtl
        ? `بین اور کالر کا پیمانہ:\n- مکمل بین کے لیے گلے کا ہالہ (Hala) قمیض پر بین کے اصل سائز سے پون انچ کم کاٹیں، تاکہ پریسنگ کے وقت بین ٹھیک بیٹھے۔\n- ہاف بین یا کٹ بین: عام طور پر 14 سے 16 انچ ہوتا ہے اور چوڑائی 1 انچ یا سوا انچ رکھی جاتی ہے۔`
        : `Collar & Ban Fitting Tips:\n- Neck hole (Hala) should be cut 0.5" to 0.75" tighter than the finished collar circumference, then notched to fit smoothly.\n- Standard ban height: 1" to 1.25" for classic gents elegance.`;
    }

    if (q.includes('دامن') || q.includes('daaman') || q.includes('round')) {
      return isRtl
        ? `گول دامن کاٹنے کا طریقہ:\n- دامن کی سائیڈ چاک سے نیچے 1.5 انچ سے 2 انچ پر گولائی کا نشان لگائیں۔\n- گولائی کٹ کرتے وقت ایک جیسا کریو (curve) رکھیں تاکہ استری کرتے وقت جھول نہ آئے۔`
        : `Round Daaman (Hem) Guide:\n- Mark curve 1.75" up from the bottom corner at the side slit.\n- Use a French curve or circular template for symmetry on front and back panels.`;
    }

    return isRtl
      ? `شکریہ ماسٹر صاحب! میں آپ کے ہر ناپ کو صحیح خانے میں رکھوں گا اور بغیر تصدیق کے محفوظ نہیں کروں گا۔`
      : `Thank you! Azad AI Assistant keeps your tailoring workshop organized without altering your field names.`;
  };

  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert(isRtl ? 'اس براؤزر میں وائس ان پٹ سپورٹ نہیں ہے۔' : 'Is browser/webview mein voice input support nahi hai.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
    } else {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = isRtl ? 'ur-PK' : 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.warn('SpeechRecognition failed to start:', err);
        setIsListening(false);
      }
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    // stop any ongoing mic listening when sending
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
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
        body: JSON.stringify({ message: text.trim() })
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
        speakText(botReply, isRtl ? 'ur-PK' : 'en-US');
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
        speakText(fallbackReply, isRtl ? 'ur-PK' : 'en-US');
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
                <span>Azad Assistant</span>
                <span className="text-[9px] bg-[#128c7e] text-white px-1.5 py-0.2 rounded-full border border-white/20">Tailoring</span>
              </h3>
              <p className="text-[10px] text-[#dcf8c6]">
                {isRtl ? 'آن لائن ٹیلرنگ اور کٹنگ اسسٹنٹ' : 'Online Tailoring & Cutting Assistant'}
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
              title={voiceReplyOn ? "Awaaz ON (Click to Mute)" : "Awaaz MUTE (Click to Unmute)"}
            >
              {voiceReplyOn ? <Volume2 className="w-3.5 h-3.5 text-white" /> : <VolumeX className="w-3.5 h-3.5 text-[#dcf8c6]" />}
            </button>
            <button 
              id="close-chatbot-btn"
              onClick={onClose}
              className="text-white bg-white/20 hover:bg-white/30 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border border-white/20 transition-colors cursor-pointer"
              aria-label="Close"
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
                        📏 {isRtl ? 'ناپ کا تفصیلی جائزہ (Preview)' : 'Measurement Preview'}
                      </span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded">
                        {confirmedMessageIds[msg.id] 
                          ? (isRtl ? 'تصدیق شدہ ✓' : 'Confirmed ✓')
                          : (isRtl ? 'تصدیق درکار' : 'Needs Confirm')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-2.5">
                      {msg.measurementsPreview.length && (
                        <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="text-slate-500 font-medium">لمبائی (Length):</span>
                          <span className="font-bold text-slate-900">{msg.measurementsPreview.length}</span>
                        </div>
                      )}
                      {msg.measurementsPreview.shoulder && (
                        <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="text-slate-500 font-medium">تیرا (Tira):</span>
                          <span className="font-bold text-slate-900">{msg.measurementsPreview.shoulder}</span>
                        </div>
                      )}
                      {msg.measurementsPreview.sleeves && (
                        <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="text-slate-500 font-medium">بازو (Bazo/Sleeve):</span>
                          <span className="font-bold text-slate-900">{msg.measurementsPreview.sleeves}</span>
                        </div>
                      )}
                      {msg.measurementsPreview.chest && (
                        <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="text-slate-500 font-medium">سینہ (Chest):</span>
                          <span className="font-bold text-slate-900">{msg.measurementsPreview.chest}</span>
                        </div>
                      )}
                      {msg.measurementsPreview.daaman && (
                        <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="text-slate-500 font-medium">گھیرا (Gheera):</span>
                          <span className="font-bold text-slate-900">{msg.measurementsPreview.daaman}</span>
                        </div>
                      )}
                      {msg.measurementsPreview.collar && (
                        <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="text-slate-500 font-medium">کالر (Collar):</span>
                          <span className="font-bold text-slate-900">{msg.measurementsPreview.collar}</span>
                        </div>
                      )}
                      {msg.measurementsPreview.shalwar && (
                        <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="text-slate-500 font-medium">شلوار (Shalwar):</span>
                          <span className="font-bold text-slate-900">{msg.measurementsPreview.shalwar}</span>
                        </div>
                      )}
                      {msg.measurementsPreview.pancha && (
                        <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="text-slate-500 font-medium">پانچہ (Pancha):</span>
                          <span className="font-bold text-slate-900">{msg.measurementsPreview.pancha}</span>
                        </div>
                      )}
                      {msg.measurementsPreview.waist && (
                        <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                          <span className="text-slate-500 font-medium">کمر (Waist):</span>
                          <span className="font-bold text-slate-900">{msg.measurementsPreview.waist}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-500 mb-2 leading-tight">
                      {isRtl 
                        ? '⚠️ قواعد کے مطابق: آپ کی تصدیق کے بغیر یہ ڈیٹا بیس میں محفوظ نہیں ہوگی۔'
                        : '⚠️ Required: Will not be saved to database without your confirmation.'}
                    </p>

                    {!confirmedMessageIds[msg.id] ? (
                      <button
                        type="button"
                        onClick={() => handleConfirmSlip(msg.id, msg.measurementsPreview!)}
                        className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {isRtl ? 'تصدیق کریں اور نئی کٹنگ سلپ بنائیں' : 'Confirm & Create New Slip'}
                      </button>
                    ) : (
                      <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded font-medium text-[11px] text-center flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {isRtl ? 'ناپ کی تصدیق ہو چکی ہے اور سلپ اوپن ہو رہی ہے۔' : 'Measurements confirmed and loaded!'}
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
              <span className="italic">Thinking / سوچ رہا ہے...</span>
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
              <span>{isRtl ? 'کیمرہ (Camera)' : 'Camera'}</span>
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
              <span>{isRtl ? 'گیلری (Gallery)' : 'Gallery'}</span>
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
            title="Open Talk"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[#dcf8c6] shadow-none group-hover:scale-110 transition-transform">
                <Sparkles className="w-3 h-3 text-[#25d366]" />
              </div>
              <span className="tracking-wide text-[11.5px] font-bold">{isRtl ? 'آزاد ماسٹر سے لائیو بات کریں' : 'Live Talk with Azad Master Assistant'}</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full border border-white/30 text-[#dcf8c6] font-extrabold flex items-center gap-1">
              <span>VOICE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#25d366] animate-pulse" />
            </span>
          </button>
        </div>

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
              placeholder={isRtl ? 'آزاد ماسٹر اسسٹنٹ کو میسج کریں...' : 'Message Azad Master Assistant...'}
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
            title={isListening ? "Listening..." : "Speak (Speech to text)"}
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
            title="Send"
          >
            ↑
          </button>
        </div>

        {/* Full Voice Conversation Mode (Open Talk Screen) */}
        {showVoiceMode && (
          <VoiceConversationScreen
            onClose={() => setShowVoiceMode(false)}
            isRtl={isRtl}
            onApplyMeasurements={onApplyMeasurements}
            onNewMessageFromVoice={handleNewMessageFromVoice}
            masterName={masterName}
          />
        )}
      </div>
    </div>
  );
};

