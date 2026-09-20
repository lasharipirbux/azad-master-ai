#!/usr/bin/env python3
import json
import os
import sys

base_dir = os.path.dirname(__file__)
sys.path.insert(0, base_dir)

import langs_part1 as p1
import langs_part2 as p2
import langs_part3 as p3

# Read base_en
with open(os.path.join(base_dir, 'base_en.json'), 'r', encoding='utf-8') as f:
    base_en = json.load(f)

# Extra keys definition for each language
patches = {
    "ur": {
        "chatbotHeaderSub": "آن لائن ٹیلرنگ اور کٹنگ اسسٹنٹ",
        "liveTalkBtn": "آزاد ماسٹر سے لائیو بات کریں",
        "chatInputPlaceholder": "آزاد ماسٹر اسسٹنٹ کو میسج کریں...",
        "measurementPreviewTitle": "ناپ کا تفصیلی جائزہ",
        "needsConfirmation": "تصدیق درکار",
        "confirmedBadge": "تصدیق شدہ ✓",
        "confirmationNotice": "⚠️ قواعد کے مطابق: آپ کی تصدیق کے بغیر یہ ڈیٹا بیس میں محفوظ نہیں ہوگی۔",
        "twoWayVoiceTitle": "دو طرفہ آواز میں بات چیت",
        "endVoiceMode": "ختم کریں",
        "tapToTalk": "بولنے کے لیے ٹیپ کریں",
        "speakingState": "بول رہا ہے...",
        "listeningState": "سن رہا ہے...",
        "thinkingState": "سوچ رہا ہے...",
        "youLabel": "آپ",
        "aiAssistantSpeaking": "آزاد ماسٹر اسسٹنٹ بول رہا ہے...",
        "micMuted": "مائیک خاموش ہے",
        "chatbotGreeting": "السلام علیکم! میں آزاد ماسٹر اسسٹنٹ ہوں۔ آپ ناپ بول کر یا لکھ کر بتا سکتے ہیں (لمبائی، تیرا، بازو، چھاتی، کمر، دامن، کالر، شلوار، پانچہ)۔ میں ناپ ترتیب دے کر سلپ میں درج کروا دوں گا۔"
    },
    "ar": {
        "chatbotHeaderSub": "مساعد التفصيل والخياطة عبر الإنترنت",
        "liveTalkBtn": "تحدث مباشرة مع أستاذ آزاد",
        "chatInputPlaceholder": "أرسل رسالة إلى مساعد أزاد ماستر...",
        "measurementPreviewTitle": "معاينة تفاصيل المقاسات",
        "needsConfirmation": "بانتظار التأكيد",
        "confirmedBadge": "تم التأكيد ✓",
        "confirmationNotice": "⚠️ تنبيه: لن يتم حفظ المقاسات في قاعدة البيانات دون تأكيدك.",
        "twoWayVoiceTitle": "محادثة صوتية مباشرة",
        "endVoiceMode": "إنهاء",
        "tapToTalk": "اضغط للتحدث",
        "speakingState": "يتحدث الآن...",
        "listeningState": "يستمع الآن...",
        "thinkingState": "جاري المعالجة...",
        "youLabel": "أنت",
        "aiAssistantSpeaking": "مساعد أزاد ماستر يتحدث...",
        "micMuted": "الميكروفون مكتوم",
        "chatbotGreeting": "مرحباً! أنا مساعد آزاد ماستر.\n\nيمكنك نطق القياسات أو كتابتها (مثلاً: الطول 42، الكتف 19، الكم 23، الصدر 38، الياقة 15.5). سأقوم بترتيب كل قياس في خانته وعرض معاينة كاملة لك ولن أقوم بالحفظ دون تأكيدك."
    },
    "sd": {
        "chatbotHeaderSub": "آن لائين درزي ۽ ڪٽنگ اسسٽنٽ",
        "liveTalkBtn": "آزاد ماسٽر سان لائيو ڳالهايو",
        "chatInputPlaceholder": "آزاد ماسٽر اسسٽنٽ کي ميسيج ڪريو...",
        "measurementPreviewTitle": "ماپ جو تفصيلي جائزو",
        "needsConfirmation": "تصديق گهربل",
        "confirmedBadge": "تصديق ٿيل ✓",
        "confirmationNotice": "⚠️ قاعدي موجب: اوهان جي تصديق کانسواءِ هي ڊيٽابيس ۾ محفوظ نه ٿيندي.",
        "twoWayVoiceTitle": "ٻه طرفي آواز ۾ ڳالهه ٻولهه",
        "endVoiceMode": "بند ڪريو",
        "tapToTalk": "ڳالهائڻ لاءِ ٽيپ ڪريو",
        "speakingState": "ڳالهائي رهيو آهي...",
        "listeningState": "ٻڌي رهيو آهي...",
        "thinkingState": "سوچي رهيو آهي...",
        "youLabel": "اوهان",
        "aiAssistantSpeaking": "آزاد ماسٽر اسسٽنٽ ڳالهائي رهيو آهي...",
        "micMuted": "مائيڪروفون بند آهي",
        "chatbotGreeting": "اسلام عليڪم! مان آزاد ماسٽر اسسٽنٽ آهيان.\n\nاوهان ماپ ڳالهائي يا لکي ٻڌائي سگهو ٿا (مثال: لمبائي 42، ٽيرو 19، ٻانهن 23، ڇاتي 38، دامن 24، ڪالر 15.5، شلوار 38، پانچو 8.5). مان ماپ جا سڀ تفصيل ترتيب ڏئي اوهان کي اڳواٽ جائزو ڏيکاريندس ۽ اوهان جي تصديق کانسواءِ محفوظ نه ڪندس."
    },
    "hi": {
        "chatbotHeaderSub": "ऑनलाइन कटिंग व सिलाई असिस्टेंट",
        "liveTalkBtn": "आजाद मास्टर से लाइव बात करें",
        "chatInputPlaceholder": "आजाद मास्टर असिस्टेंट को मैसेज करें...",
        "measurementPreviewTitle": "नाप का विस्तृत पूर्वावलोकन",
        "needsConfirmation": "पुष्टि अपेक्षित",
        "confirmedBadge": "पुष्टीकृत ✓",
        "confirmationNotice": "⚠️ नियम अनुसार: आपकी पुष्टि के बिना यह डेटाबेस में सुरक्षित नहीं होगी।",
        "twoWayVoiceTitle": "द्विमार्गी लाइव वॉयस वार्तालाप",
        "endVoiceMode": "समाप्त करें",
        "tapToTalk": "बोलने के लिए टैप करें",
        "speakingState": "बोल रहा है...",
        "listeningState": "सुन रहा है...",
        "thinkingState": "सोच रहा है...",
        "youLabel": "आप",
        "aiAssistantSpeaking": "आजाद मास्टर असिस्टेंट बोल रहा है...",
        "micMuted": "माइक बंद है",
        "chatbotGreeting": "नमस्ते! मैं आजाद मास्टर असिस्टेंट हूँ।\n\nआप माप बोलकर या लिखकर बता सकते हैं (जैसे: लम्बाई 42, तीरा 19, बाजू 23, सीना 38, दामन 24, कॉलर 15.5, सलवार 38, पाँचा 8.5)। मैं हर माप को सही खाने में रखकर पहले आपको पूरा प्रीव्यू दिखाऊँगा और आपकी पुष्टि के बिना सुरक्षित नहीं करूँगा।"
    },
    "fa": {
        "chatbotHeaderSub": "دستیار آنلاین خیاطی و برش",
        "liveTalkBtn": "گفتگوی زنده با استاد آزاد",
        "chatInputPlaceholder": "به دستیار استاد آزاد پیام دهید...",
        "measurementPreviewTitle": "پیش‌نمایش تفصیلی اندازه‌ها",
        "needsConfirmation": "نیازمند تأیید",
        "confirmedBadge": "تأیید شده ✓",
        "confirmationNotice": "⚠️ توجه: اندازه‌ها بدون تأیید شما در دیتابیس ذخیره نخواهند شد.",
        "twoWayVoiceTitle": "مکالمه صوتی زنده دوطرفه",
        "endVoiceMode": "پایان",
        "tapToTalk": "برای گفتگو لمس کنید",
        "speakingState": "در حال صحبت...",
        "listeningState": "در حال شنیدن...",
        "thinkingState": "در حال پردازش...",
        "youLabel": "شما",
        "aiAssistantSpeaking": "دستیار استاد آزاد در حال صحبت است...",
        "micMuted": "میکروفون بی‌صدا است"
    },
    "ps": {
        "chatbotHeaderSub": "آنلاین خیاطي او پرېکولو مرستیال",
        "liveTalkBtn": "له ازاد ماسټر سره مخامخ خبرې وکړئ",
        "chatInputPlaceholder": "د ازاد ماسټر مرستیال ته پیغام واستوئ...",
        "measurementPreviewTitle": "د کچو تفصیلي مخکتنه",
        "needsConfirmation": "تصدیق ته اړتیا لري",
        "confirmedBadge": "تصدیق شوی ✓",
        "confirmationNotice": "⚠️ یادونه: ستاسو له تصدیق پرته دا ډیټابیس کې نه خوندي کېږي.",
        "twoWayVoiceTitle": "ژوندۍ دوه اړخیزه غږیزه خبرې",
        "endVoiceMode": "پای",
        "tapToTalk": "د خبرو لپاره لمس کړئ",
        "speakingState": "خبرې کوي...",
        "listeningState": "اوري...",
        "thinkingState": "فکر کوي...",
        "youLabel": "تاسو",
        "aiAssistantSpeaking": "د ازاد ماسټر مرستیال غږیږي...",
        "micMuted": "مایکروفون بند دی"
    },
    "pa": {
        "chatbotHeaderSub": "ਆਨਲਾਈਨ ਟੇਲਰਿੰਗ ਅਤੇ ਕਟਿੰਗ ਸਹਾਇਕ",
        "liveTalkBtn": "ਆਜ਼ਾਦ ਮਾਸਟਰ ਨਾਲ ਲਾਈਵ ਗੱਲਬਾਤ ਕਰੋ",
        "chatInputPlaceholder": "ਆਜ਼ਾਦ ਮਾਸਟਰ ਸਹਾਇਕ ਨੂੰ ਸੁਨੇਹਾ ਭੇਜੋ...",
        "measurementPreviewTitle": "ਨਾਪ ਦਾ ਵਿਸਤ੍ਰਿਤ ਪੂਰਵ ਦਰਸ਼ਨ",
        "needsConfirmation": "ਪੁਸ਼ਟੀ ਲੋੜੀਂਦੀ",
        "confirmedBadge": "ਪੁਸ਼ਟੀ ਹੋਈ ✓",
        "confirmationNotice": "⚠️ ਨਿਯਮ: ਤੁਹਾਡੀ ਪੁਸ਼ਟੀ ਤੋਂ ਬਿਨਾਂ ਇਹ ਡਾਟਾਬੇਸ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਨਹੀਂ ਹੋਵੇਗਾ।",
        "twoWayVoiceTitle": "ਦੋ-ਪੱਖੀ ਲਾਈਵ ਆਵਾਜ਼ ਗੱਲਬਾਤ",
        "endVoiceMode": "ਸਮਾਪਤ",
        "tapToTalk": "ਬੋਲਣ ਲਈ ਟੈਪ ਕਰੋ",
        "speakingState": "ਬੋਲ ਰਿਹਾ ਹੈ...",
        "listeningState": "ਸੁਣ ਰਿਹਾ ਹੈ...",
        "thinkingState": "ਸੋਚ ਰਿਹਾ ਹੈ...",
        "youLabel": "ਤੁਸੀਂ",
        "aiAssistantSpeaking": "ਆਜ਼ਾਦ ਮਾਸਟਰ ਸਹਾਇਕ ਬੋਲ ਰਿਹਾ ਹੈ...",
        "micMuted": "ਮਾਈਕ੍ਰੋਫੋਨ ਬੰਦ ਹੈ"
    },
    "bn": {
        "chatbotHeaderSub": "অনলাইন টেইলারিং ও কাটিং সহকারী",
        "liveTalkBtn": "আজাদ মাস্টারের সাথে সরাসরি কথা বলুন",
        "chatInputPlaceholder": "আজাদ মাস্টার সহকারীকে বার্তা পাঠান...",
        "measurementPreviewTitle": "পরিমাপের বিস্তারিত পূর্বরূপ",
        "needsConfirmation": "নিশ্চিতকরণ প্রয়োজন",
        "confirmedBadge": "নিশ্চিত হয়েছে ✓",
        "confirmationNotice": "⚠️ দ্রষ্টব্য: আপনার নিশ্চিতকরণ ছাড়া এটি ডেটাবেজে সংরক্ষিত হবে না।",
        "twoWayVoiceTitle": "দ্বিমুখী লাইভ ভয়েস কথোপকথন",
        "endVoiceMode": "শেষ করুন",
        "tapToTalk": "কথা বলতে ট্যাপ করুন",
        "speakingState": "কথা বলছে...",
        "listeningState": "শুনছে...",
        "thinkingState": "প্রক্রিয়াধীন...",
        "youLabel": "আপনি",
        "aiAssistantSpeaking": "আজাদ মাস্টার সহকারী কথা বলছেন...",
        "micMuted": "মাইক্রোফোন বন্ধ"
    },
    "tr": {
        "chatbotHeaderSub": "Çevrimiçi Terzilik ve Kesim Asistanı",
        "liveTalkBtn": "Azad Master ile Canlı Konuşun",
        "chatInputPlaceholder": "Azad Master Asistanına mesaj yazın...",
        "measurementPreviewTitle": "Ölçü Detay Önizlemesi",
        "needsConfirmation": "Onay Bekliyor",
        "confirmedBadge": "Onaylandı ✓",
        "confirmationNotice": "⚠️ Gerekli: Onayınız olmadan veritabanına kaydedilmeyecektir.",
        "twoWayVoiceTitle": "İki Yönlü Canlı Sesli Konuşma",
        "endVoiceMode": "Bitir",
        "tapToTalk": "Konuşmak İçin Dokunun",
        "speakingState": "Konuşuyor...",
        "listeningState": "Dinliyor...",
        "thinkingState": "Düşünüyor...",
        "youLabel": "Siz",
        "aiAssistantSpeaking": "Azad Master Asistanı konuşuyor...",
        "micMuted": "Mikrofon sessizde"
    },
    "es": {
        "chatbotHeaderSub": "Asistente Virtual de Sastrería y Corte",
        "liveTalkBtn": "Hablar en vivo con Azad Master",
        "chatInputPlaceholder": "Enviar mensaje al Asistente Azad Master...",
        "measurementPreviewTitle": "Vista Previa de Medidas",
        "needsConfirmation": "Confirmación requerida",
        "confirmedBadge": "Confirmado ✓",
        "confirmationNotice": "⚠️ Importante: No se guardará en la base de datos sin su confirmación.",
        "twoWayVoiceTitle": "Conversación de Voz en Vivo",
        "endVoiceMode": "Finalizar",
        "tapToTalk": "Tocar para Hablar",
        "speakingState": "Hablando...",
        "listeningState": "Escuchando...",
        "thinkingState": "Pensando...",
        "youLabel": "Usted",
        "aiAssistantSpeaking": "El Asistente Azad Master está hablando...",
        "micMuted": "Micrófono silenciado"
    },
    "fr": {
        "chatbotHeaderSub": "Assistant Virtuel de Coupe et Couture",
        "liveTalkBtn": "Parler en direct avec Azad Master",
        "chatInputPlaceholder": "Envoyer un message à l'assistant Azad Master...",
        "measurementPreviewTitle": "Aperçu détaillé des mesures",
        "needsConfirmation": "Confirmation requise",
        "confirmedBadge": "Confirmé ✓",
        "confirmationNotice": "⚠️ Important : Ne sera pas enregistré sans votre confirmation.",
        "twoWayVoiceTitle": "Conversation Vocale en Direct",
        "endVoiceMode": "Terminer",
        "tapToTalk": "Appuyer pour Parler",
        "speakingState": "En train de parler...",
        "listeningState": "À l'écoute...",
        "thinkingState": "En cours de traitement...",
        "youLabel": "Vous",
        "aiAssistantSpeaking": "L'assistant Azad Master parle...",
        "micMuted": "Microphone désactivé"
    },
    "de": {
        "chatbotHeaderSub": "Online Schneiderei- und Zuschnittassistent",
        "liveTalkBtn": "Live-Gespräch mit Azad Master",
        "chatInputPlaceholder": "Nachricht an Azad Master Assistenten...",
        "measurementPreviewTitle": "Maß-Detailvorschau",
        "needsConfirmation": "Bestätigung erforderlich",
        "confirmedBadge": "Bestätigt ✓",
        "confirmationNotice": "⚠️ Erforderlich: Wird ohne Ihre Bestätigung nicht gespeichert.",
        "twoWayVoiceTitle": "Live-Sprachunterhaltung",
        "endVoiceMode": "Beenden",
        "tapToTalk": "Tippen zum Sprechen",
        "speakingState": "Spricht...",
        "listeningState": "Hört zu...",
        "thinkingState": "Verarbeitet...",
        "youLabel": "Sie",
        "aiAssistantSpeaking": "Azad Master Assistent spricht...",
        "micMuted": "Mikrofon stummgeschaltet"
    },
    "it": {
        "chatbotHeaderSub": "Assistente Online di Sartoria e Taglio",
        "liveTalkBtn": "Parla dal vivo con Azad Master",
        "chatInputPlaceholder": "Invia un messaggio all'Assistente Azad Master...",
        "measurementPreviewTitle": "Anteprima Dettaglio Misure",
        "needsConfirmation": "Conferma richiesta",
        "confirmedBadge": "Confermato ✓",
        "confirmationNotice": "⚠️ Attenzione: non verrà salvato nel database senza la tua conferma.",
        "twoWayVoiceTitle": "Conversazione Vocale dal Vivo",
        "endVoiceMode": "Fine",
        "tapToTalk": "Tocca per Parlare",
        "speakingState": "Parla...",
        "listeningState": "In ascolto...",
        "thinkingState": "Elaborazione...",
        "youLabel": "Tu",
        "aiAssistantSpeaking": "L'assistente Azad Master sta parlando...",
        "micMuted": "Microfono disattivato"
    },
    "ru": {
        "chatbotHeaderSub": "Онлайн-ассистент по пошиву и раскрою",
        "liveTalkBtn": "Живой голосовой чат с Azad Master",
        "chatInputPlaceholder": "Написать ассистенту Azad Master...",
        "measurementPreviewTitle": "Детальный предпросмотр мерок",
        "needsConfirmation": "Требуется подтверждение",
        "confirmedBadge": "Подтверждено ✓",
        "confirmationNotice": "⚠️ Внимание: мерки не сохранятся без вашего подтверждения.",
        "twoWayVoiceTitle": "Двусторонняя голосовая связь",
        "endVoiceMode": "Завершить",
        "tapToTalk": "Нажмите, чтобы говорить",
        "speakingState": "Говорит...",
        "listeningState": "Слушает...",
        "thinkingState": "Обработка...",
        "youLabel": "Вы",
        "aiAssistantSpeaking": "Ассистент Azad Master говорит...",
        "micMuted": "Микрофон выключен"
    },
    "zh": {
        "chatbotHeaderSub": "在线裁剪与缝纫助手",
        "liveTalkBtn": "与 Azad Master 实时语音对话",
        "chatInputPlaceholder": "向 Azad Master 助手发送消息...",
        "measurementPreviewTitle": "量体尺寸详细预览",
        "needsConfirmation": "待确认",
        "confirmedBadge": "已确认 ✓",
        "confirmationNotice": "⚠️ 注意：未经您的确认，数据不会保存至数据库。",
        "twoWayVoiceTitle": "双向实时语音通话",
        "endVoiceMode": "结束",
        "tapToTalk": "点击开始说话",
        "speakingState": "正在讲话...",
        "listeningState": "正在倾听...",
        "thinkingState": "正在思考...",
        "youLabel": "您",
        "aiAssistantSpeaking": "Azad Master 助手正在讲话...",
        "micMuted": "麦克风已静音"
    },
    "ja": {
        "chatbotHeaderSub": "オンライン仕立て・裁断アシスタント",
        "liveTalkBtn": "Azad Masterとライブ会話",
        "chatInputPlaceholder": "Azad Master アシスタントにメッセージを送信...",
        "measurementPreviewTitle": "寸法詳細プレビュー",
        "needsConfirmation": "確認が必要",
        "confirmedBadge": "確認済み ✓",
        "confirmationNotice": "⚠️ 注意：お客様の確認なしにデータベースには保存されません。",
        "twoWayVoiceTitle": "双方向ライブ音声通話",
        "endVoiceMode": "終了",
        "tapToTalk": "タップして話す",
        "speakingState": "応答中...",
        "listeningState": "聞き取り中...",
        "thinkingState": "処理中...",
        "youLabel": "あなた",
        "aiAssistantSpeaking": "Azad Master アシスタントが話しています...",
        "micMuted": "マイクはミュートです"
    },
    "ko": {
        "chatbotHeaderSub": "온라인 재단 및 재봉 어시스턴트",
        "liveTalkBtn": "Azad Master와 실시간 대화",
        "chatInputPlaceholder": "Azad Master 어시스턴트에게 메시지 보내기...",
        "measurementPreviewTitle": "측정 치수 상세 미리보기",
        "needsConfirmation": "확인 필요",
        "confirmedBadge": "확인됨 ✓",
        "confirmationNotice": "⚠️ 주의: 확인 전에는 데이터베이스에 저장되지 않습니다.",
        "twoWayVoiceTitle": "양방향 실시간 음성 대화",
        "endVoiceMode": "종료",
        "tapToTalk": "말하려면 탭하세요",
        "speakingState": "말하는 중...",
        "listeningState": "듣는 중...",
        "thinkingState": "생각하는 중...",
        "youLabel": "나",
        "aiAssistantSpeaking": "Azad Master 어시스턴트가 말하고 있습니다...",
        "micMuted": "마이크 음소거됨"
    },
    "ms": {
        "chatbotHeaderSub": "Pembantu Jahitan & Pemotongan Dalam Talian",
        "liveTalkBtn": "Bercakap Langsung dengan Azad Master",
        "chatInputPlaceholder": "Mesej Pembantu Azad Master...",
        "measurementPreviewTitle": "Pratonton Perincian Ukuran",
        "needsConfirmation": "Perlu Pengesahan",
        "confirmedBadge": "Disahkan ✓",
        "confirmationNotice": "⚠️ Perhatian: Tidak akan disimpan ke pangkalan data tanpa pengesahan anda.",
        "twoWayVoiceTitle": "Perbualan Suara Langsung Dua Hala",
        "endVoiceMode": "Tamat",
        "tapToTalk": "Ketik untuk Bercakap",
        "speakingState": "Sedang bercakap...",
        "listeningState": "Sedang mendengar...",
        "thinkingState": "Sedang memproses...",
        "youLabel": "Anda",
        "aiAssistantSpeaking": "Pembantu Azad Master sedang bercakap...",
        "micMuted": "Mikrofon diredam"
    },
    "id": {
        "chatbotHeaderSub": "Asisten Jahit & Pemotongan Online",
        "liveTalkBtn": "Bicara Langsung dengan Azad Master",
        "chatInputPlaceholder": "Kirim pesan ke Asisten Azad Master...",
        "measurementPreviewTitle": "Pratinjau Rincian Ukuran",
        "needsConfirmation": "Perlu Konfirmasi",
        "confirmedBadge": "Terkonfirmasi ✓",
        "confirmationNotice": "⚠️ Perhatian: Tidak akan disimpan ke database tanpa konfirmasi Anda.",
        "twoWayVoiceTitle": "Percakapan Suara Langsung Dua Arah",
        "endVoiceMode": "Selesai",
        "tapToTalk": "Ketuk untuk Berbicara",
        "speakingState": "Sedang berbicara...",
        "listeningState": "Mendengarkan...",
        "thinkingState": "Sedang memproses...",
        "youLabel": "Anda",
        "aiAssistantSpeaking": "Asisten Azad Master sedang berbicara...",
        "micMuted": "Mikrofon dibisukan"
    },
    "pt": {
        "chatbotHeaderSub": "Assistente Virtual de Alfaiataria e Corte",
        "liveTalkBtn": "Falar ao Vivo com Azad Master",
        "chatInputPlaceholder": "Enviar mensagem para o Assistente Azad Master...",
        "measurementPreviewTitle": "Pré-visualização Detalhada das Medidas",
        "needsConfirmation": "Confirmação necessária",
        "confirmedBadge": "Confirmado ✓",
        "confirmationNotice": "⚠️ Aviso: Não será salvo no banco de dados sem a sua confirmação.",
        "twoWayVoiceTitle": "Conversação de Voz em Tempo Real",
        "endVoiceMode": "Encerrar",
        "tapToTalk": "Toque para Falar",
        "speakingState": "Falando...",
        "listeningState": "Ouvindo...",
        "thinkingState": "Processando...",
        "youLabel": "Você",
        "aiAssistantSpeaking": "O Assistente Azad Master está falando...",
        "micMuted": "Microfone desativado"
    },
    "th": {
        "chatbotHeaderSub": "ผู้ช่วยตัดเย็บและตัดผ้าออนไลน์",
        "liveTalkBtn": "คุยสดกับ Azad Master",
        "chatInputPlaceholder": "ส่งข้อความถึงผู้ช่วย Azad Master...",
        "measurementPreviewTitle": "ตัวอย่างรายละเอียดการวัดขนาด",
        "needsConfirmation": "รอการยืนยัน",
        "confirmedBadge": "ยืนยันแล้ว ✓",
        "confirmationNotice": "⚠️ ข้อควรระวัง: จะไม่บันทึกหากยังไม่ได้รับการยืนยันจากคุณ",
        "twoWayVoiceTitle": "การสนทนาด้วยเสียงสดสองทาง",
        "endVoiceMode": "สิ้นสุด",
        "tapToTalk": "แตะเพื่อพูด",
        "speakingState": "กำลังพูด...",
        "listeningState": "กำลังฟัง...",
        "thinkingState": "กำลังประมวลผล...",
        "youLabel": "คุณ",
        "aiAssistantSpeaking": "ผู้ช่วย Azad Master กำลังพูด...",
        "micMuted": "ปิดเสียงไมโครโฟน"
    },
    "en": {
        "chatbotHeaderSub": "Online Tailoring & Cutting Assistant",
        "liveTalkBtn": "Live Talk with Azad Master Assistant",
        "chatInputPlaceholder": "Message Azad Master Assistant...",
        "measurementPreviewTitle": "Measurement Preview",
        "needsConfirmation": "Needs Confirm",
        "confirmedBadge": "Confirmed ✓",
        "confirmationNotice": "⚠️ Required: Will not be saved to database without your confirmation.",
        "twoWayVoiceTitle": "Live Two-Way Voice",
        "endVoiceMode": "End",
        "tapToTalk": "Tap to Speak",
        "speakingState": "Speaking...",
        "listeningState": "Listening...",
        "thinkingState": "Thinking...",
        "youLabel": "You",
        "aiAssistantSpeaking": "Azad Master Assistant speaking...",
        "micMuted": "Microphone is muted",
        "chatbotGreeting": "Hello! I am Azad Master Assistant. You can speak or type measurements (Length, Shoulder, Sleeves, Chest, Waist, Daaman, Collar, Shalwar, Pancha). I will arrange every measurement and confirm before saving."
    }
}

# Now re-assemble translations
languages = [
    ('ur', 'Urdu', 'اردو', True, '🇵🇰'),
    ('sd', 'Sindhi', 'سنڌي', True, '🇵🇰'),
    ('ar', 'Arabic', 'العربية', True, '🇸🇦'),
    ('en', 'English', 'English', False, '🇬🇧'),
    ('hi', 'Hindi', 'हिन्दी', False, '🇮🇳'),
    ('fa', 'Persian', 'فارسی', True, '🇮🇷'),
    ('ps', 'Pashto', 'پښتو', True, '🇦🇫'),
    ('pa', 'Punjabi', 'ਪੰਜਾਬੀ / پنجابی', False, '🇮🇳'),
    ('bn', 'Bengali', 'বাংলা', False, '🇧🇩'),
    ('tr', 'Turkish', 'Türkçe', False, '🇹🇷'),
    ('es', 'Spanish', 'Español', False, '🇪🇸'),
    ('fr', 'French', 'Français', False, '🇫🇷'),
    ('de', 'German', 'Deutsch', False, '🇩🇪'),
    ('it', 'Italian', 'Italiano', False, '🇮🇹'),
    ('ru', 'Russian', 'Русский', False, '🇷🇺'),
    ('zh', 'Chinese', '中文', False, '🇨🇳'),
    ('ja', 'Japanese', '日本語', False, '🇯🇵'),
    ('ko', 'Korean', '한국어', False, '🇰🇷'),
    ('ms', 'Malay', 'Bahasa Melayu', False, '🇲🇾'),
    ('id', 'Indonesian', 'Bahasa Indonesia', False, '🇮🇩'),
    ('pt', 'Portuguese', 'Português', False, '🇵🇹'),
    ('th', 'Thai', 'ไทย', False, '🇹🇭'),
]

raw_map = {
    'ur': p1.ur, 'sd': p1.sd, 'ar': p1.ar, 'fa': p1.fa, 'ps': p1.ps,
    'hi': p2.hi, 'pa': p2.pa, 'bn': p2.bn, 'tr': p2.tr, 'es': p2.es, 'fr': p2.fr, 'de': p2.de,
    'it': p3.it, 'ru': p3.ru, 'zh': p3.zh, 'ja': p3.ja, 'ko': p3.ko,
    'ms': p3.ms, 'id': p3.id, 'pt': p3.pt, 'th': p3.th, 'en': base_en
}

# Ensure all languages have complete keys with English fallback, then apply patches
all_keys = sorted(list(base_en.keys()))
complete_catalog = {}

for code, name, native, rtl, flag in languages:
    raw = raw_map.get(code, {})
    lang_dict = {}
    for k in all_keys:
        val = raw.get(k)
        if not val or not str(val).strip():
            val = base_en[k]
        lang_dict[k] = val
    
    # Apply patches if any
    if code in patches:
        for pk, pv in patches[code].items():
            lang_dict[pk] = pv
            
    complete_catalog[code] = lang_dict

# Output to src/data/translations.ts
out_path = os.path.join(base_dir, '../src/data/translations.ts')

out_lines = [
    "// Generated complete 22-language translation catalog",
    "import { SupportedLanguage } from '../types';",
    "",
    "export interface LanguageMeta {",
    "  code: SupportedLanguage;",
    "  name: string;",
    "  nativeName: string;",
    "  isRtl: boolean;",
    "  flag: string;",
    "}",
    "",
    "export const languageList: LanguageMeta[] = ["
]

for code, name, native, rtl, flag in languages:
    out_lines.append(f"  {{ code: '{code}', name: '{name}', nativeName: '{native}', isRtl: {str(rtl).lower()}, flag: '{flag}' }},")

out_lines.append("];")
out_lines.append("")
out_lines.append("export interface TranslationDictionary {")
for k in all_keys:
    out_lines.append(f"  {k}: string;")
out_lines.append("}")
out_lines.append("")
out_lines.append("export const translations: Record<SupportedLanguage, TranslationDictionary> = {")

for code, name, native, rtl, flag in languages:
    dict_json = json.dumps(complete_catalog[code], ensure_ascii=False, indent=2)
    indented = "\n".join("  " + line for line in dict_json.split("\n"))
    out_lines.append(f"  {code}: {indented.strip()},")

out_lines.append("};")
out_lines.append("")

with open(out_path, 'w', encoding='utf-8') as f:
    f.write("\n".join(out_lines))

print(f"Successfully generated translations.ts with {len(all_keys)} keys across 22 languages.")
