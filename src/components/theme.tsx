import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Appearance, useColorScheme } from 'react-native';
import { appStore } from '../lib/store';
import { darkPalette, lightPalette, paletteFor, type Palette } from '../theme/system';

export type ThemeValue = {
  palette: Palette;
  dark: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
};

const fallback: ThemeValue = { palette: lightPalette, dark: false, reduceMotion: false, highContrast: false };
const ThemeContext = createContext<ThemeValue>(fallback);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const study = appStore.useStore().study;
  const scheme = useColorScheme();
  const [systemMotion, setSystemMotion] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (alive) setSystemMotion(value);
      })
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemMotion);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  const value = useMemo<ThemeValue>(() => {
    const os = scheme ?? Appearance.getColorScheme() ?? 'light';
    const mode = study.appearance === 'system' ? (os === 'dark' ? 'dark' : 'light') : study.appearance;
    const reduceMotion = study.reduceMotion === null ? systemMotion : study.reduceMotion;
    return {
      palette: paletteFor(mode, study.highContrast),
      dark: mode === 'dark',
      reduceMotion,
      highContrast: study.highContrast,
    };
  }, [scheme, study.appearance, study.highContrast, study.reduceMotion, systemMotion]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext) ?? { palette: lightPalette, dark: false, reduceMotion: false, highContrast: false };
}

export { darkPalette, lightPalette };
