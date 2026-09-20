#!/usr/bin/env python3
import json
import sys
import os

# 1. Update base_en.json
base_en_path = os.path.join(os.path.dirname(__file__), 'base_en.json')
with open(base_en_path, 'r', encoding='utf-8') as f:
    base_en = json.load(f)

new_keys_en = {
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
    "chatbotHeaderSub": "Online Tailoring & Cutting Assistant",
    "chatbotGreeting": "Hello! I am Azad Master Assistant. You can speak or type measurements (Length, Shoulder, Sleeves, Chest, Waist, Daaman, Collar, Shalwar, Pancha). I will arrange every measurement and confirm before saving."
}

base_en.update(new_keys_en)
with open(base_en_path, 'w', encoding='utf-8') as f:
    json.dump(base_en, f, ensure_ascii=False, indent=2)

print("Updated base_en.json with new chatbot keys.")
