import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { dictionaries, Lang, RTL_LANGS } from '../i18n/strings';
import { appStore } from './store';

type Ctx = { lang: Lang; dir: 'ltr' | 'rtl'; t: (key: keyof (typeof dictionaries)['fr'], vars?: Record<string, string | number>) => string; setLang: (l: Lang) => void };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { lang } = appStore.useStore();
  const dir: 'ltr' | 'rtl' = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
    }
  }, [lang, dir]);
  const value = useMemo<Ctx>(
    () => ({
      lang,
      dir,
      setLang: (l) => appStore.set({ lang: l }),
      t: (key, vars) => {
        let s: string = dictionaries[lang]?.[key] ?? dictionaries.fr[key] ?? String(key);
        if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        return s;
      },
    }),
    [lang, dir],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n hors I18nProvider');
  return ctx;
}
