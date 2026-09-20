import React, { useState, useEffect, useRef } from 'react';
import { CustomerMeasurements, SupportedLanguage } from '../types';
import { X, Mic, MicOff, Volume2, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import { speakText, stopSpeaking } from '../utils/speechSynthesis';
import { parseMeasurementsFromText } from '../utils/measurementParser';
import { saveMeasurementToFirebase } from '../firebase';

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
    if (currentLang === 'en') return 'en-US';
    if (currentLang === 'hi') return 'hi-IN';
    if (currentLang === 'sd') return 'ur-PK';
    if (currentLang === 'ar') return 'ar-SA';
    if (currentLang === 'fa') return 'fa-IR';
    if (currentLang === 'ps') return 'ps-AF';
    return isRtl ? 'ur-PK' : 'en-US';
  };

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Initial welcome greeting
  useEffect(() => {
    isMountedRef.current = true;

    const tailorGreetingName = masterName?.trim() || (isRtl ? (currentLang === 'sd' ? 'استاد صاحب' : 'ماسٹر صاحب') : 'Master Tailor');
    let initialGreeting = '';
    if (currentLang === 'en') {
      initialGreeting = `Hello ${tailorGreetingName}! I am listening. Speak your measurements or any tailoring question.`;
    } else if (currentLang === 'sd') {
      initialGreeting = `جي ${tailorGreetingName}! مان ٻڌي رهيو آهيان. اوهان ماپ يا ڪٽنگ جو ڪوبه سوال ڳالهائي سگهو ٿا.`;
    } else if (currentLang === 'hi') {
      initialGreeting = `नमस्ते ${tailorGreetingName}! मैं सुन रहा हूँ। आप माप या कटिंग का कोई भी सवाल बोल सकते हैं।`;
    } else if (isRtl) {
      initialGreeting = `جی ${tailorGreetingName}! میں سن رہا ہوں۔ آپ ناپ یا کٹنگ کا کوئی بھی سوال بول سکتے ہیں۔`;
    } else {
      initialGreeting = `Hello ${tailorGreetingName}! I am listening. Speak your measurements or any tailoring question.`;
    }

    setAiResponseText(initialGreeting);
    setStatusNote(
      currentLang === 'en' ? 'Azad Master Assistant speaking...' :
      currentLang === 'sd' ? 'آزاد ماسٽر اسسٽنٽ ڳالهائي رهيو آهي...' :
      currentLang === 'hi' ? 'आजाद मास्टर असिस्टेंट बोल रहा है...' :
      (isRtl ? 'آزاد ماسٹر اسسٹنٹ بول رہا ہے...' : 'Azad Master Assistant speaking...')
    );
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
          setStatusNote(
            currentLang === 'en' ? 'Microphone is muted' :
            currentLang === 'sd' ? 'مائيڪروفون بند آهي' :
            (isRtl ? 'مائیکروفون آف ہے' : 'Microphone is muted')
          );
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
      setStatusNote(isRtl ? 'براؤزر میں آواز ریکارڈر دستیاب نہیں ہے۔' : 'Speech recognition not supported.');
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

      recognition.lang = isRtl ? 'ur-PK' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        if (!isMountedRef.current) return;
        setConversationState('listening');
        setStatusNote(isRtl ? 'سن رہا ہوں... آپ بولیں' : 'Listening... please speak');
      };

      recognition.onresult = (event: any) => {
        if (!isMountedRef.current) return;
        let interim = '';
        let finalStr = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const currentSpoken = finalStr || interim;
        if (currentSpoken) {
          setUserTranscript(currentSpoken);
        }
        if (finalStr.trim()) {
          processSpokenMessage(finalStr.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Recognition error in voice mode:', event.error);
        if (!isMountedRef.current) return;
        if (event.error === 'no-speech') {
          // If no speech, gently restart listening if not muted
          if (!isMutedRef.current && conversationState === 'listening') {
            setStatusNote(isRtl ? 'سن رہا ہوں... آپ بولیں' : 'Listening... please speak');
            setTimeout(() => {
              if (isMountedRef.current && !isMutedRef.current && conversationState !== 'speaking') {
                startListening();
              }
            }, 600);
          }
        } else {
          setConversationState('idle');
          setStatusNote(isRtl ? 'مائیک کو دوبارہ دبائیں' : 'Tap mic to speak');
        }
      };

      recognition.onend = () => {
        if (!isMountedRef.current) return;
        // if still listening and no result was processed, don't leave hanging
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
    setStatusNote(isRtl ? 'سوچ رہا ہے...' : 'Thinking...');

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

      const callerTitle = masterName?.trim() || (isRtl ? (currentLang === 'sd' ? 'استاد صاحب' : 'ماسٹر صاحب') : 'Master');
      let replyText = data.reply;
      if (!replyText) {
        if (currentLang === 'en') {
          replyText = `Got it, ${callerTitle}!`;
        } else if (currentLang === 'sd') {
          replyText = `جي ${callerTitle}! اوهان جي ڳالهه سمجهه ۾ اچي وئي.`;
        } else if (currentLang === 'hi') {
          replyText = `जी ${callerTitle}! आपकी बात समझ आ गई।`;
        } else if (isRtl) {
          replyText = `جی ${callerTitle}! آپ کی بات سمجھ آ گئی ہے۔`;
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
      setStatusNote(
        currentLang === 'en' ? 'Azad AI responding...' :
        currentLang === 'sd' ? 'آزاد اي آءِ جواب ڏئي رهيو آهي...' :
        currentLang === 'hi' ? 'आजाद एआई जवाब दे रहा है...' :
        (isRtl ? 'آزاد AI جواب دے رہا ہے...' : 'Azad AI responding...')
      );

      cancelSpeechRef.current = speakText(
        replyText,
        getSpeechLang(),
        () => {
          if (isMountedRef.current) setConversationState('speaking');
        },
        () => {
          // Finished speaking: resume natural two-way listening
          if (isMountedRef.current && !isMutedRef.current) {
            setUserTranscript('');
            startListening();
          } else if (isMountedRef.current) {
            setConversationState('idle');
            setStatusNote(isRtl ? 'گفتگو روکی گئی ہے' : 'Conversation paused');
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
      const fallbackMsg = isRtl
        ? "معذرت، آواز کا رابطہ قائم نہ ہو سکا۔ آپ دوبارہ فرما سکتے ہیں۔"
        : "Could not reach server. Please speak again.";
      setAiResponseText(fallbackMsg);
      setConversationState('speaking');
      cancelSpeechRef.current = speakText(
        fallbackMsg,
        isRtl ? 'ur-PK' : 'en-US',
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
      setStatusNote(isRtl ? 'مائیک خاموش ہے (Muted)' : 'Microphone muted');
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
                {isRtl ? 'آزاد ماسٹر اسسٹنٹ وائس' : 'Azad Master Assistant'}
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              </h3>
              <p className="text-[10px] text-emerald-300/70">
                {isRtl ? 'دو طرفہ آواز میں بات چیت' : 'Live Two-Way Voice'}
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
            title={isRtl ? 'بند کریں' : 'End'}
          >
            <X className="w-3.5 h-3.5" />
            <span>{isRtl ? 'ختم کریں' : 'End'}</span>
          </button>
        </div>

        {/* Middle Canvas: Interactive Waveform / Aura Circle */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center select-none">
          
          {/* Main Visualizer Sphere */}
          <div 
            onClick={handleInterruptOrTap}
            className="relative w-48 h-48 cursor-pointer flex items-center justify-center my-auto transition-transform active:scale-95"
            title={isRtl ? 'بولنے کے لیے ٹیپ کریں' : 'Tap to speak'}
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
                  {conversationState === 'speaking' && (isRtl ? '🎙️ بول رہا ہے' : '🎙️ Speaking')}
                  {conversationState === 'listening' && (isRtl ? '👂 سن رہا ہے' : '👂 Listening')}
                  {conversationState === 'processing' && (isRtl ? '⏳ سوچ رہا ہے' : '⏳ Thinking')}
                  {conversationState === 'idle' && (isRtl ? '👆 ٹیپ کریں' : '👆 Tap to Talk')}
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
                  {isRtl ? 'آپ' : 'You'}:
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
                <span>📏 {isRtl ? 'ناپ مل گئی (Confirmation Required)' : 'Detected Measurements'}</span>
                <span>{Object.keys(detectedMeasurements).length} fields</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px] text-center">
                {detectedMeasurements.length && (
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-emerald-300">لمبائی</div>
                    <div className="font-bold text-white">{detectedMeasurements.length}</div>
                  </div>
                )}
                {detectedMeasurements.shoulder && (
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-emerald-300">تیرا</div>
                    <div className="font-bold text-white">{detectedMeasurements.shoulder}</div>
                  </div>
                )}
                {detectedMeasurements.sleeves && (
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-emerald-300">بازو</div>
                    <div className="font-bold text-white">{detectedMeasurements.sleeves}</div>
                  </div>
                )}
                {detectedMeasurements.chest && (
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-emerald-300">سینہ</div>
                    <div className="font-bold text-white">{detectedMeasurements.chest}</div>
                  </div>
                )}
                {detectedMeasurements.daaman && (
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-emerald-300">گھیرا</div>
                    <div className="font-bold text-white">{detectedMeasurements.daaman}</div>
                  </div>
                )}
                {detectedMeasurements.collar && (
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-emerald-300">کالر</div>
                    <div className="font-bold text-white">{detectedMeasurements.collar}</div>
                  </div>
                )}
                {detectedMeasurements.shalwar && (
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-emerald-300">شلوار</div>
                    <div className="font-bold text-white">{detectedMeasurements.shalwar}</div>
                  </div>
                )}
                {detectedMeasurements.pancha && (
                  <div className="bg-white/10 rounded p-1">
                    <div className="text-emerald-300">پانچہ</div>
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
                  {isRtl ? 'تصدیق کریں اور سلپ میں محفوظ کریں' : 'Confirm & Send to Slip'}
                </button>
              ) : (
                <div className="py-1 text-center font-semibold text-emerald-300 text-[11px]">
                  ✓ {isRtl ? 'تصدیق ہو گئی ہے۔ سلپ میں شامل کیا جا رہا ہے۔' : 'Confirmed! Added to slip.'}
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
            title={isMuted ? (isRtl ? 'مائیک آن کریں' : 'Unmute') : (isRtl ? 'مائیک بند کریں' : 'Mute')}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Center Interrupt / Re-speak Button */}
          <button
            type="button"
            onClick={handleInterruptOrTap}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#25d366] via-[#128c7e] to-[#25d366] text-white flex items-center justify-center shadow-lg shadow-[#25d366]/40 hover:scale-105 active:scale-95 transition-all p-2 border-2 border-white/60 cursor-pointer"
            title={conversationState === 'speaking' ? (isRtl ? 'روکیں اور بولیں' : 'Interrupt & Speak') : (isRtl ? 'بولیں' : 'Speak')}
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
            title={isRtl ? 'وائس موڈ بند کریں' : 'End Voice Mode'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};
