export type Locale = 'en' | 'si';

export const defaultLocale: Locale = 'en';

export const supportedLocales: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' }
];
