export type Locale =
  | 'en'
  | 'si'
  | 'ta' // Tamil
  | 'zh' // Chinese (Mandarin)
  | 'hi' // Hindi
  | 'es' // Spanish
  | 'fr' // French
  | 'ar' // Arabic
  | 'bn' // Bengali
  | 'pt' // Portuguese
  | 'ru' // Russian
  | 'ur' // Urdu
  | 'de' // German
  | 'ja'; // Japanese

export const defaultLocale: Locale = 'en';

export const supportedLocales: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'zh', label: '中文（普通话）' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'ur', label: 'اردو' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' }
];
