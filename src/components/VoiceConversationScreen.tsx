import React, { useState, useEffect, useRef } from 'react';
import { CustomerMeasurements, SupportedLanguage } from '../types';
import { X, Mic, MicOff, Volume2, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import { speakText, stopSpeaking } from '../utils/speechSynthesis';
import { parseMeasurementsFromText } from '../utils/measurementParser';
import { saveMeasurementToFirebase } from '../firebase';
import { useLanguage } from '../context/LanguageContext';

interface VoiceConversationScreenProps {
  onClose: () => void;
  isRtl: boolean;
  onApplyMeasurements?: (measurements: Partial<CustomerMeasurements>) => void;
  onNewMessageFromVoice?: (userText: string, botText: string, detectedMeasurements?: Partial<CustomerMeasurements>) => void;
  masterName?: string;
  currentLang?: SupportedLanguage;
}

type ConversationState = 'idle' | 'listening' | 'processing' | 'speaking';

export const VoiceConversationScreen: React.FC<VoiceConversationScreenProps> = ({
  onClose,
  isRtl,
  onApplyMeasurements,
  onNewMessageFromVoice,
  masterName,
  currentLang = 'ur'
}) => {
  const { t } = useLanguage();
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [aiResponseText, setAiResponseText] = useState<string>('');
  const [detectedMeasurements, setDetectedMeasurements] = useState<Partial<CustomerMeasurements> | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [statusNote, setStatusNote] = useState<string>('');
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const recognitionRef = useRef<any>(null);
  const cancelSpeechRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);
  const isMutedRef = useRef(isMuted);

  const getSpeechLang = (): string => {
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

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Initial welcome greeting
  useEffect(() => {
    isMountedRef.current = true;

    const tailorGreetingName = masterName?.trim() || t.masterDefaultName || (currentLang === 'ur' ? 'ماسٹر صاحب' : 'Master');
    let initialGreeting = '';
    if (currentLang === 'ur') {
      initialGreeting = `جی ${tailorGreetingName}! میں سن رہا ہوں۔ آپ ناپ یا کٹنگ کا کوئی بھی سوال بول سکتے ہیں۔`;
    } else if (currentLang === 'sd') {
      initialGreeting = `جي ${tailorGreetingName}! مان ٻڌي رهيو آهيان. اوهان ماپ يا ڪٽنگ جو ڪوبه سوال ڳالهائي سگهو ٿا.`;
    } else if (currentLang === 'hi') {
      initialGreeting = `नमस्ते ${tailorGreetingName}! मैं सुन रहा हूँ। आप माप या कटिंग का कोई भी सवाल बोल सकते हैं।`;
    } else if (currentLang === 'ar') {
      initialGreeting = `أهلاً بك ${tailorGreetingName}! أنا أستمع إليك. تفضل بنطق القياسات أو أي سؤال حول الخياطة.`;
    } else if (currentLang === 'fa') {
      initialGreeting = `درود ${tailorGreetingName}! من در حال شنیدن هستم. می‌توانید اندازه‌ها یا پرسش خیاطی خود را بفرمایید.`;
    } else if (currentLang === 'ps') {
      initialGreeting = `سلام ${tailorGreetingName}! زه اورم. تاسو کولی شئ خپلې اندازې یا د خیاطۍ پوښتنه ووایاست.`;
    } else if (currentLang === 'es') {
      initialGreeting = `¡Hola ${tailorGreetingName}! Te escucho. Indica las medidas o cualquier duda de sastrería.`;
    } else if (currentLang === 'fr') {
      initialGreeting = `Bonjour ${tailorGreetingName}! Je vous écoute. Indiquez vos mesures ou votre question.`;
    } else if (currentLang === 'de') {
      initialGreeting = `Hallo ${tailorGreetingName}! Ich höre zu. Bitte nennen Sie Ihre Maße oder Schneidereifragen.`;
    } else if (currentLang === 'tr') {
      initialGreeting = `Merhaba ${tailorGreetingName}! Sizi dinliyorum. Ölçülerinizi veya terzilik sorularınızı söyleyebilirsiniz.`;
    } else {
      initialGreeting = `Hello ${tailorGreetingName}! I am listening. Speak your measurements or any tailoring question.`;
    }

    setAiResponseText(initialGreeting);
    setStatusNote(t.botSpeaking || `${t.aiVoiceAssistant}...`);
    setConversationState('speaking');

    cancelSpeechRef.current = speakText(
      initialGreeting,
      getSpeechLang(),
      () => {
        if (isMountedRef.current) setConversationState('speaking');
      },
      () => {
        if (isMountedRef.current && !isMutedRef.current) {
          startListening();
        } else if (isMountedRef.current) {
          setConversationState('idle');
          setStatusNote(t.tapToSpeak || 'Microphone muted');
        }
      },
      () => {
        if (isMountedRef.current) {
          startListening();
        }
      }
    );

    return () => {
      isMountedRef.current = false;
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [currentLang]);

  const startListening = () => {
    if (isMutedRef.current) return;
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setStatusNote(t.browserNoVoice || 'Speech recognition not supported.');
      setConversationState('idle');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = getSpeechLang();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        if (!isMountedRef.current) return;
        setConversationState('listening');
        setStatusNote(t.listeningVoice || 'Listening... please speak');
      };

      recognition.onresult = (event: any) => {
        if (!isMountedRef.current) return;
        let finalStr = '';
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const trans = event.results[i][0]?.transcript;
            if (trans) {
              finalStr += trans + ' ';
            }
          }
        }
        const cleanFinal = finalStr.trim();
        if (cleanFinal) {
          setUserTranscript(cleanFinal);
          processSpokenMessage(cleanFinal);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Recognition error in voice mode:', event.error);
        if (!isMountedRef.current) return;
        if (event.error === 'no-speech') {
          if (!isMutedRef.current && conversationState === 'listening') {
            setStatusNote(t.listeningVoice || 'Listening... please speak');
            setTimeout(() => {
              if (isMountedRef.current && !isMutedRef.current && (conversationState as string) !== 'speaking') {
                startListening();
              }
            }, 600);
          }
        } else {
          setConversationState('idle');
          setStatusNote(t.tapToSpeak || 'Tap mic to speak');
        }
      };

      recognition.onend = () => {
        if (!isMountedRef.current) return;
        if (!isMutedRef.current && conversationState === 'listening') {
          setTimeout(() => {
            if (isMountedRef.current && !isMutedRef.current && conversationState === 'listening') {
              startListening();
            }
          }, 150);
        }
      };

      recognition.start();
    } catch (e) {
      console.warn('SpeechRecognition start failed', e);
      setConversationState('idle');
    }
  };

  const processSpokenMessage = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    setConversationState('processing');
    setStatusNote(t.processingVoice || 'Thinking...');

    // Parse measurement immediately locally as well
    const localParsed = parseMeasurementsFromText(spokenText);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: spokenText,
          language: currentLang || (isRtl ? 'ur' : 'en')
        })
      });

      const data = await response.json();
      const detected = data.parsedMeasurements || localParsed;

      const callerTitle = masterName?.trim() || t.masterDefaultName || (currentLang === 'ur' ? 'ماسٹر صاحب' : 'Master');
      let replyText = data.reply;
      if (!replyText) {
        if (currentLang === 'ur') {
          replyText = `جی ${callerTitle}! آپ کی بات سمجھ آ گئی ہے۔`;
        } else if (currentLang === 'sd') {
          replyText = `جي ${callerTitle}! اوهان جي ڳالهه سمجهه ۾ اچي وئي.`;
        } else if (currentLang === 'hi') {
          replyText = `जी ${callerTitle}! आपकी बात समझ आ गई।`;
        } else if (currentLang === 'ar') {
          replyText = `حسناً ${callerTitle}! لقد فهمت طلبك.`;
        } else {
          replyText = `Got it, ${callerTitle}!`;
        }
      }

      if (detected && Object.keys(detected).length > 0) {
        setDetectedMeasurements(detected);
        setHasConfirmed(false);
      }

      setAiResponseText(replyText);

      if (onNewMessageFromVoice) {
        onNewMessageFromVoice(spokenText, replyText, detected || undefined);
      }

      // Now speak the response aloud
      setConversationState('speaking');
      setStatusNote(t.botSpeaking || 'Responding...');

      cancelSpeechRef.current = speakText(
        replyText,
        getSpeechLang(),
        () => {
          if (isMountedRef.current) setConversationState('speaking');
        },
        () => {
          if (isMountedRef.current && !isMutedRef.current) {
            setUserTranscript('');
            startListening();
          } else if (isMountedRef.current) {
            setConversationState('idle');
            setStatusNote(t.tapToSpeak || 'Conversation paused');
          }
        },
        () => {
          if (isMountedRef.current && !isMutedRef.current) {
            startListening();
          }
        }
      );

    } catch (err) {
      console.error('Error in Voice Mode chat:', err);
      const fallbackMsg = currentLang === 'ur'
        ? "معذرت، رابطہ قائم نہ ہو سکا۔ آپ دوبارہ فرما سکتے ہیں۔"
        : (currentLang === 'ar' ? "عذراً، تعذر الاتصال بالخادم. يرجى التحدث مرة أخرى." : "Could not reach server. Please speak again.");
      setAiResponseText(fallbackMsg);
      setConversationState('speaking');
      cancelSpeechRef.current = speakText(
        fallbackMsg,
        getSpeechLang(),
        undefined,
        () => {
          if (isMountedRef.current && !isMutedRef.current) {
            startListening();
          }
        }
      );
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    isMutedRef.current = nextMuted;

    if (nextMuted) {
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      setConversationState('idle');
      setStatusNote('Microphone muted');
    } else {
      startListening();
    }
  };

  const handleInterruptOrTap = () => {
    if (conversationState === 'speaking') {
      stopSpeaking();
      startListening();
    } else if (conversationState === 'idle') {
      if (isMuted) setIsMuted(false);
      startListening();
    }
  };

  const handleConfirmMeasurements = () => {
    if (!detectedMeasurements) return;
    setHasConfirmed(true);
    if (onApplyMeasurements) {
      onApplyMeasurements(detectedMeasurements);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[1150] flex items-center justify-center p-3 bg-emerald-950/75 backdrop-blur-md animate-in fade-in duration-200"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div 
        id="voice-conversation-screen"
        className="relative w-full max-w-sm h-[600px] max-h-[94vh] rounded-3xl bg-gradient-to-b from-[#135a39] via-[#0d442b] to-[#072d1c] text-white flex flex-col justify-between overflow-hidden shadow-2xl border border-emerald-400/30"
      >
        {/* Subtle Decorative Background Aura */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        {/* Micro-texture tailored pattern */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: 'radial-gradient(#34d399 1.5px, transparent 1.5px)',
            backgroundSize: '20px 20px'
          }}
        />

        {/* Top Bar */}
        <div className="relative z-10 px-5 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 border border-amber-300/40 flex items-center justify-center shadow-xs shrink-0">
              <img src="/azad-master-logo.svg" alt="Azad Master" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-emerald-100 flex items-center gap-1.5">
                {t.aiVoiceAssistant || 'Azad Master Assistant'}
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              </h3>
              <p className="text-[10px] text-emerald-300/70">
                {t.aiVoiceAssistantSub || 'Live Two-Way Voice'}
              </p>
            </div>
          </div>

          <button
            id="close-voice-mode-btn"
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 text-xs font-semibold flex items-center gap-1 transition-colors border border-white/10 shadow-xs cursor-pointer"
            title={t.closeVoiceMode || 'End'}
          >
            <X className="w-3.5 h-3.5" />
            <span>{t.closeVoiceMode || 'End'}</span>
          </button>
        </div>

        {/* Middle Canvas: Interactive Waveform / Aura Circle */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center select-none">
          
          {/* Main Visualizer Sphere */}
          <div 
            onClick={handleInterruptOrTap}
            className="relative w-48 h-48 cursor-pointer flex items-center justify-center my-auto transition-transform active:scale-95"
            title={t.tapToSpeak || 'Tap to speak'}
          >
            {/* Outer Expanding Waves for Speaking/Listening */}
            {conversationState === 'speaking' && (
              <>
                <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping duration-1000" />
                <div className="absolute -inset-4 rounded-full bg-emerald-400/20 animate-pulse duration-700" />
                <div className="absolute -inset-8 rounded-full border border-amber-300/30 animate-spin duration-3000" />
              </>
            )}

            {conversationState === 'listening' && (
              <>
                <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping duration-1000" />
                <div className="absolute -inset-3 rounded-full bg-emerald-500/20 animate-pulse duration-500" />
                <div className="absolute -inset-6 rounded-full border border-emerald-400/40" />
              </>
            )}

            {conversationState === 'processing' && (
              <div className="absolute -inset-2 rounded-full border-2 border-dashed border-amber-400/60 animate-spin" />
            )}

            {/* Core Orb with Center Audio Wave & Mic */}
            <div className={`relative w-40 h-40 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-3 transition-all duration-300 ${
              conversationState === 'speaking'
                ? 'bg-gradient-to-tr from-[#128c7e] via-[#075e54] to-[#25d366] shadow-[#25d366]/30 ring-4 ring-[#25d366]/40 scale-105'
                : conversationState === 'listening'
                ? 'bg-gradient-to-tr from-[#075e54] via-[#128c7e] to-[#25d366] shadow-[#128c7e]/40 ring-4 ring-[#25d366]/50 scale-100'
                : conversationState === 'processing'
                ? 'bg-gradient-to-tr from-[#054840] to-[#075e54] shadow-black/30 scale-95 opacity-85'
                : 'bg-gradient-to-tr from-[#054840] to-[#075e54] shadow-black/30 scale-95 opacity-70'
            }`}>
              
              <div className="relative flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-inner mb-2">
                  {conversationState === 'speaking' ? (
                    <Volume2 className="w-8 h-8 text-[#25d366] animate-pulse" />
                  ) : conversationState === 'listening' ? (
                    <Mic className="w-8 h-8 text-[#25d366] animate-bounce" />
                  ) : (
                    <Sparkles className="w-8 h-8 text-[#dcf8c6]" />
                  )}
                </div>
                
                {/* Voice Status Pill Tag */}
                <div className="px-2.5 py-0.5 rounded-full bg-[#054840]/95 border border-[#25d366]/60 text-[9px] font-extrabold tracking-wider text-[#dcf8c6] whitespace-nowrap shadow-md">
                  {conversationState === 'speaking' && (t.botSpeaking ? `🎙️ ${t.botSpeaking}` : '🎙️ Speaking')}
                  {conversationState === 'listening' && (t.listeningVoice ? `👂 ${t.listeningVoice}` : '👂 Listening')}
                  {conversationState === 'processing' && (t.processingVoice ? `⏳ ${t.processingVoice}` : '⏳ Thinking')}
                  {conversationState === 'idle' && (t.tapToSpeak ? `👆 ${t.tapToSpeak}` : '👆 Tap to Talk')}
                </div>
              </div>

              {/* Dynamic Animated Bars inside sphere */}
              <div className="flex items-center justify-center gap-1.5 h-6 mt-2">
                {conversationState === 'speaking' ? (
                  <>
                    <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:0ms] h-4" />
                    <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:150ms] h-6" />
                    <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:300ms] h-3" />
                    <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:200ms] h-5" />
                    <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:400ms] h-4" />
                  </>
                ) : conversationState === 'listening' ? (
                  <>
                    <span className="w-1 bg-emerald-100 rounded-full animate-pulse h-3" />
                    <span className="w-1 bg-emerald-100 rounded-full animate-pulse h-5" />
                    <span className="w-1 bg-emerald-100 rounded-full animate-pulse h-4" />
                    <span className="w-1 bg-emerald-100 rounded-full animate-pulse h-2.5" />
                  </>
                ) : conversationState === 'processing' ? (
                  <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                ) : (
                  <MicOff className="w-4 h-4 text-white/60" />
                )}
              </div>
            </div>
          </div>

          {/* Status Note */}
          <div className="text-xs text-emerald-200/80 font-medium mb-3 min-h-[18px]">
            {statusNote}
          </div>

          {/* Live Subtitle Transcript Display */}
          <div className="w-full max-h-32 overflow-y-auto px-4 py-2.5 rounded-2xl bg-[#093522]/85 border border-emerald-500/25 text-xs text-left leading-relaxed backdrop-blur-xs space-y-1.5 shadow-inner">
            {userTranscript && (
              <div className="text-emerald-200 flex items-start gap-1.5">
                <span className="font-bold text-[10px] uppercase bg-emerald-900/90 border border-emerald-600/40 px-1 py-0.5 rounded text-emerald-200 shrink-0">
                  User:
                </span>
                <span className="italic line-clamp-2">{userTranscript}</span>
              </div>
            )}
            {aiResponseText && (
              <div className="text-white/95 flex items-start gap-1.5">
                <span className="font-bold text-[10px] uppercase bg-amber-900/90 border border-amber-600/40 px-1 py-0.5 rounded text-amber-200 shrink-0">
                  AI:
                </span>
                <span className="line-clamp-3">{aiResponseText}</span>
              </div>
            )}
          </div>

          {/* Detected Measurement Interactive Confirmation Card in Voice Mode */}
          {detectedMeasurements && Object.keys(detectedMeasurements).length > 0 && (
            <div className="w-full mt-2 p-2.5 rounded-2xl bg-emerald-950/80 border border-amber-400/40 text-xs space-y-1.5 animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 pb-1 border-b border-white/10">
                <span>📏 {t.detectedMeasurementsHeading || 'Detected Measurements'}</span>
                <span>{Object.keys(detectedMeasurements).length} fields</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px] text-center">
                {detectedMeasurements.length && (
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-emerald-300">{t.lengthLabel || 'Length'}</div>
                    <div className="font-bold text-white">{detectedMeasurements.length}</div>
                  </div>
                )}
                {detectedMeasurements.shoulder && (
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-emerald-300">{t.shoulderLabel || 'Shoulder'}</div>
                    <div className="font-bold text-white">{detectedMeasurements.shoulder}</div>
                  </div>
                )}
                {detectedMeasurements.sleeves && (
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-emerald-300">{t.sleevesLabel || 'Sleeves'}</div>
                    <div className="font-bold text-white">{detectedMeasurements.sleeves}</div>
                  </div>
                )}
                {detectedMeasurements.chest && (
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-emerald-300">{t.chestLabel || 'Chest'}</div>
                    <div className="font-bold text-white">{detectedMeasurements.chest}</div>
                  </div>
                )}
                {detectedMeasurements.daaman && (
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-emerald-300">{t.daamanLabel || 'Daaman'}</div>
                    <div className="font-bold text-white">{detectedMeasurements.daaman}</div>
                  </div>
                )}
                {detectedMeasurements.collar && (
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-emerald-300">{t.collarLabel || 'Collar'}</div>
                    <div className="font-bold text-white">{detectedMeasurements.collar}</div>
                  </div>
                )}
                {detectedMeasurements.shalwar && (
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-emerald-300">{t.shalwarLabel || 'Shalwar'}</div>
                    <div className="font-bold text-white">{detectedMeasurements.shalwar}</div>
                  </div>
                )}
                {detectedMeasurements.pancha && (
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-emerald-300">{t.panchaLabel || 'Pancha'}</div>
                    <div className="font-bold text-white">{detectedMeasurements.pancha}</div>
                  </div>
                )}
              </div>

              {!hasConfirmed ? (
                <button
                  type="button"
                  onClick={handleConfirmMeasurements}
                  className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t.confirmAndApplySlip || 'Confirm & Send to Slip'}
                </button>
              ) : (
                <div className="py-1 text-center font-semibold text-emerald-300 text-[11px]">
                  ✓ {t.confirmedMeasurement || 'Confirmed! Added to slip.'}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Bottom Action Controls */}
        <div className="relative z-10 px-6 py-4 bg-[#072e1d]/90 border-t border-emerald-500/20 flex items-center justify-around backdrop-blur-xs">
          
          {/* Mute/Unmute Mic */}
          <button
            type="button"
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMuted 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Center Interrupt / Re-speak Button */}
          <button
            type="button"
            onClick={handleInterruptOrTap}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#25d366] via-[#128c7e] to-[#25d366] text-white flex items-center justify-center shadow-lg shadow-[#25d366]/40 hover:scale-105 active:scale-95 transition-all p-2 border-2 border-white/60 cursor-pointer"
            title={conversationState === 'speaking' ? "Interrupt & Speak" : "Speak"}
          >
            {conversationState === 'speaking' ? (
              <RotateCcw className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Mic className="w-7 h-7 text-white" />
            )}
          </button>

          {/* Close / Return to Chat Button */}
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="w-12 h-12 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white flex items-center justify-center border border-rose-400/40 shadow-sm transition-all"
            title={t.closeVoiceMode || 'End Voice Mode'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};
