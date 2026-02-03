'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultLocale, supportedLocales, type Locale } from './config';
import en from './dictionaries/en.json';
import si from './dictionaries/si.json';
import ta from './dictionaries/ta.json';
import zh from './dictionaries/zh.json';
import hi from './dictionaries/hi.json';
import es from './dictionaries/es.json';
import fr from './dictionaries/fr.json';
import ar from './dictionaries/ar.json';
import bn from './dictionaries/bn.json';
import pt from './dictionaries/pt.json';
import ru from './dictionaries/ru.json';
import ur from './dictionaries/ur.json';
import de from './dictionaries/de.json';
import ja from './dictionaries/ja.json';

const dictionaries: Record<Locale, any> = {
  en,
  si,
  ta,
  zh,
  hi,
  es,
  fr,
  ar,
  bn,
  pt,
  ru,
  ur,
  de,
  ja
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

    const resolve = (source: any, segments: string[]): string | undefined => {
      let cur: any = source;
      for (const seg of segments) {
        if (cur && typeof cur === 'object' && seg in cur) {
          cur = cur[seg];
        } else {
          return undefined;
        }
      }
      return typeof cur === 'string' ? cur : undefined;
    };

    // Try current locale first
    const primary = resolve(dict, parts);
    if (primary !== undefined) return primary;

    // Fallback to default (English) if missing
    const fallback = resolve(dictionaries[defaultLocale], parts);
    return fallback !== undefined ? fallback : key;
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
