export interface AvatarColorTheme {
  id: string;
  nameUrdu: string;
  nameEn: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeBg: string;
  gradientClass: string;
  solidBgClass: string;
  solidTextClass: string;
  ringClass: string;
  hex: string;
}

export const AVATAR_PALETTES: AvatarColorTheme[] = [
  {
    id: 'emerald',
    nameUrdu: 'زمردی سبز',
    nameEn: 'Emerald Green',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-950',
    borderClass: 'border-emerald-400',
    badgeBg: 'bg-emerald-600',
    gradientClass: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700',
    solidBgClass: 'bg-emerald-600',
    solidTextClass: 'text-white',
    ringClass: 'ring-emerald-400/40',
    hex: '#059669',
  },
  {
    id: 'teal',
    nameUrdu: 'سمندری نیلا',
    nameEn: 'Teal Cyan',
    bgClass: 'bg-teal-100',
    textClass: 'text-teal-950',
    borderClass: 'border-teal-400',
    badgeBg: 'bg-teal-600',
    gradientClass: 'bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700',
    solidBgClass: 'bg-teal-600',
    solidTextClass: 'text-white',
    ringClass: 'ring-teal-400/40',
    hex: '#0d9488',
  },
  {
    id: 'indigo',
    nameUrdu: 'نیلم نیلا',
    nameEn: 'Indigo Blue',
    bgClass: 'bg-indigo-100',
    textClass: 'text-indigo-950',
    borderClass: 'border-indigo-400',
    badgeBg: 'bg-indigo-600',
    gradientClass: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-700',
    solidBgClass: 'bg-indigo-600',
    solidTextClass: 'text-white',
    ringClass: 'ring-indigo-400/40',
    hex: '#4f46e5',
  },
  {
    id: 'blue',
    nameUrdu: 'آسمانی نیلا',
    nameEn: 'Sky Blue',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-950',
    borderClass: 'border-blue-400',
    badgeBg: 'bg-blue-600',
    gradientClass: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700',
    solidBgClass: 'bg-blue-600',
    solidTextClass: 'text-white',
    ringClass: 'ring-blue-400/40',
    hex: '#2563eb',
  },
  {
    id: 'purple',
    nameUrdu: 'شاہی جامنی',
    nameEn: 'Royal Purple',
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-950',
    borderClass: 'border-purple-400',
    badgeBg: 'bg-purple-600',
    gradientClass: 'bg-gradient-to-br from-purple-500 via-purple-600 to-fuchsia-700',
    solidBgClass: 'bg-purple-600',
    solidTextClass: 'text-white',
    ringClass: 'ring-purple-400/40',
    hex: '#9333ea',
  },
  {
    id: 'amber',
    nameUrdu: 'زعفرانی امبر',
    nameEn: 'Amber Gold',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-950',
    borderClass: 'border-amber-400',
    badgeBg: 'bg-amber-600',
    gradientClass: 'bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700',
    solidBgClass: 'bg-amber-600',
    solidTextClass: 'text-white',
    ringClass: 'ring-amber-400/40',
    hex: '#d97706',
  },
  {
    id: 'rose',
    nameUrdu: 'گلابی لال',
    nameEn: 'Rose Red',
    bgClass: 'bg-rose-100',
    textClass: 'text-rose-950',
    borderClass: 'border-rose-400',
    badgeBg: 'bg-rose-600',
    gradientClass: 'bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700',
    solidBgClass: 'bg-rose-600',
    solidTextClass: 'text-white',
    ringClass: 'ring-rose-400/40',
    hex: '#e11d48',
  },
  {
    id: 'orange',
    nameUrdu: 'نارنجی',
    nameEn: 'Vibrant Orange',
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-950',
    borderClass: 'border-orange-400',
    badgeBg: 'bg-orange-600',
    gradientClass: 'bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700',
    solidBgClass: 'bg-orange-600',
    solidTextClass: 'text-white',
    ringClass: 'ring-orange-400/40',
    hex: '#ea580c',
  },
  {
    id: 'cyan',
    nameUrdu: 'فیروزی',
    nameEn: 'Cyan Turquoise',
    bgClass: 'bg-cyan-100',
    textClass: 'text-cyan-950',
    borderClass: 'border-cyan-400',
    badgeBg: 'bg-cyan-600',
    gradientClass: 'bg-gradient-to-br from-cyan-500 via-cyan-600 to-teal-700',
    solidBgClass: 'bg-cyan-600',
    solidTextClass: 'text-white',
    ringClass: 'ring-cyan-400/40',
    hex: '#0891b2',
  },
  {
    id: 'violet',
    nameUrdu: 'بنفشی',
    nameEn: 'Deep Violet',
    bgClass: 'bg-violet-100',
    textClass: 'text-violet-950',
    borderClass: 'border-violet-400',
    badgeBg: 'bg-violet-600',
    gradientClass: 'bg-gradient-to-br from-violet-500 via-violet-600 to-purple-700',
    solidBgClass: 'bg-violet-600',
    solidTextClass: 'text-white',
    ringClass: 'ring-violet-400/40',
    hex: '#7c3aed',
  },
  {
    id: 'fuchsia',
    nameUrdu: 'قرمزی گلابی',
    nameEn: 'Fuchsia Pink',
    bgClass: 'bg-fuchsia-100',
    textClass: 'text-fuchsia-950',
    borderClass: 'border-fuchsia-400',
    badgeBg: 'bg-fuchsia-600',
    gradientClass: 'bg-gradient-to-br from-fuchsia-500 via-fuchsia-600 to-rose-700',
    solidBgClass: 'bg-fuchsia-600',
    solidTextClass: 'text-white',
    ringClass: 'ring-fuchsia-400/40',
    hex: '#c026d3',
  },
  {
    id: 'lime',
    nameUrdu: 'لیموں سبز',
    nameEn: 'Lime Green',
    bgClass: 'bg-lime-100',
    textClass: 'text-lime-950',
    borderClass: 'border-lime-400',
    badgeBg: 'bg-lime-600',
    gradientClass: 'bg-gradient-to-br from-lime-500 via-lime-600 to-emerald-700',
    solidBgClass: 'bg-lime-600',
    solidTextClass: 'text-white',
    ringClass: 'ring-lime-400/40',
    hex: '#65a30d',
  }
];

/**
 * Extracts a clean initial grapheme/letter from the customer name.
 * Handles Urdu, Arabic, Sindhi, Pashto, English, and other scripts.
 */
export function getCustomerInitial(name?: string): string {
  if (!name || typeof name !== 'string') return '👤';
  const trimmed = name.trim();
  if (!trimmed) return '👤';

  // Extract first letter or character sequence
  const firstChar = Array.from(trimmed)[0];
  if (!firstChar) return '👤';
  
  // If it's a Latin alphabet, uppercase it
  if (/^[a-zA-Z]$/.test(firstChar)) {
    return firstChar.toUpperCase();
  }
  
  return firstChar;
}

/**
 * Computes a deterministic color theme based on customer name string hash,
 * or returns the explicitly chosen palette if set.
 */
export function getAvatarColorByName(name?: string, customColorId?: string): AvatarColorTheme {
  if (customColorId) {
    const found = AVATAR_PALETTES.find((p) => p.id === customColorId);
    if (found) return found;
  }

  const safeName = (name || '').trim();
  if (!safeName) {
    return AVATAR_PALETTES[0]; // default emerald
  }

  // Simple and stable hash (djb2 variant)
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    const charCode = safeName.charCodeAt(i);
    hash = (hash << 5) - hash + charCode;
    hash |= 0; // Convert to 32bit integer
  }

  const positiveIndex = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[positiveIndex];
}
