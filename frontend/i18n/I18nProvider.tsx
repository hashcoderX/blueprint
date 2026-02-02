'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultLocale, supportedLocales, type Locale } from './config';
import en from './dictionaries/en.json';
import si from './dictionaries/si.json';

const dictionaries: Record<Locale, any> = {
  en,
  si
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('locale') as Locale | null;
      if (stored && supportedLocales.find(l => l.code === stored)) {
        setLocaleState(stored);
      }
    } catch {}
  }, []);

  const setLocale = (loc: Locale) => {
    setLocaleState(loc);
    try {
      localStorage.setItem('locale', loc);
    } catch {}
  };

  const dict = useMemo(() => dictionaries[locale] || dictionaries[defaultLocale], [locale]);

  const t = (key: string): string => {
    const parts = key.split('.');
    let current: any = dict;
    for (const p of parts) {
      if (current && typeof current === 'object' && p in current) {
        current = current[p];
      } else {
        return key; // fallback: show key
      }
    }
    return typeof current === 'string' ? current : key;
  };

  const value: I18nContextValue = {
    locale,
    setLocale,
    t
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
