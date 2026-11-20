import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Appearance, Platform, useColorScheme } from 'react-native';
import { appStore } from '../lib/store';
import { glassFor, type Glass } from '../theme/glass';
import { darkPalette, lightPalette, paletteFor, type Palette } from '../theme/system';

export type ThemeValue = {
  palette: Palette;
  dark: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  /** Réglage système. Aucune clé de stockage n'est lue ni écrite pour ça. */
  reduceTransparency: boolean;
  glass: Glass;
};

const fallback: ThemeValue = {
  palette: lightPalette,
  dark: false,
  reduceMotion: false,
  highContrast: false,
  reduceTransparency: false,
  glass: glassFor(lightPalette, false, false),
};
const ThemeContext = createContext<ThemeValue>(fallback);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const study = appStore.useStore().study;
  const scheme = useColorScheme();
  const [systemMotion, setSystemMotion] = useState(false);
  const [reduceTransparency, setReduceTransparency] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (alive) setSystemMotion(value);
      })
      .catch(() => undefined);
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemMotion);
    const info = AccessibilityInfo as typeof AccessibilityInfo & {
      isReduceTransparencyEnabled?: () => Promise<boolean>;
    };
    info.isReduceTransparencyEnabled?.()
      .then((value) => {
        if (alive) setReduceTransparency(value);
      })
      .catch(() => undefined);
    const transparency = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged' as 'reduceMotionChanged',
      setReduceTransparency,
    );
    return () => {
      alive = false;
      motion.remove();
      transparency.remove();
    };
  }, []);
  const value = useMemo<ThemeValue>(() => {
    const os = scheme ?? Appearance.getColorScheme() ?? 'light';
    const mode = study.appearance === 'system' ? (os === 'dark' ? 'dark' : 'light') : study.appearance;
    const reduceMotion = study.reduceMotion === null ? systemMotion : study.reduceMotion;
    const dark = mode === 'dark';
    const palette = paletteFor(mode, study.highContrast);
    const opaque = study.highContrast || reduceTransparency || Platform.isTV === true;
    return {
      palette,
      dark,
      reduceMotion,
      highContrast: study.highContrast,
      reduceTransparency,
      glass: glassFor(palette, dark, opaque),
    };
  }, [scheme, study.appearance, study.highContrast, study.reduceMotion, systemMotion, reduceTransparency]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext) ?? fallback;
}

export { darkPalette, lightPalette };
