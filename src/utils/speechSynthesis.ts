// Speech Synthesis Helper with Urdu / Hindi / English voice prioritization and fallback
export function speakText(
  text: string, 
  lang: string = 'ur-PK', 
  onStart?: () => void, 
  onEnd?: () => void, 
  onError?: (e: any) => void
): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return () => {};
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Clean markdown symbols, bullets, asterisks, JSON blocks, or emoji for natural speech
  const cleanedText = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/•/g, '، ')
    .replace(/[*_#`~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanedText) {
    if (onEnd) onEnd();
    return () => {};
  }

  const utterance = new SpeechSynthesisUtterance(cleanedText);
  utterance.rate = 0.95; // slightly relaxed for clear tailoring pronunciation
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const targetLang = (lang || 'ur-PK').toLowerCase();
  
  let voice: SpeechSynthesisVoice | undefined;

  if (targetLang.startsWith('en')) {
    // English priority
    voice = voices.find(v => v.lang.toLowerCase() === 'en-us') ||
            voices.find(v => v.lang.toLowerCase() === 'en-gb') ||
            voices.find(v => v.lang.toLowerCase().startsWith('en'));
  } else if (targetLang.startsWith('hi')) {
    // Hindi priority
    voice = voices.find(v => v.lang.toLowerCase().includes('hi')) ||
            voices.find(v => v.lang.toLowerCase().includes('in'));
  } else if (targetLang.startsWith('sd') || targetLang.startsWith('ur')) {
    // Sindhi / Urdu priority
    voice = voices.find(v => v.lang.toLowerCase().includes('ur') || v.lang.toLowerCase().includes('pk')) ||
            voices.find(v => v.lang.toLowerCase().includes('sd')) ||
            voices.find(v => v.lang.toLowerCase().includes('hi'));
  } else if (targetLang.startsWith('ar')) {
    voice = voices.find(v => v.lang.toLowerCase().startsWith('ar'));
  } else {
    // Generic match by language code prefix
    const prefix = targetLang.split(/[-_]/)[0];
    voice = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
  }

  // Fallback to any voice available if no match
  if (!voice && voices.length > 0) {
    voice = voices.find(v => v.lang.toLowerCase().startsWith('en')) || voices[0];
  }

  if (voice) {
    utterance.voice = voice;
  }
  utterance.lang = lang || 'ur-PK';

  if (onStart) utterance.onstart = onStart;
  utterance.onend = () => {
    if (onEnd) onEnd();
  };
  utterance.onerror = (e) => {
    console.warn('SpeechSynthesis error:', e);
    if (onError) onError(e);
    if (onEnd) onEnd();
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Failed to call window.speechSynthesis.speak', err);
    if (onEnd) onEnd();
  }

  return () => {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  };
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
