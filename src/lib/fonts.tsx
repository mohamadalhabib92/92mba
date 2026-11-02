import { useFonts } from 'expo-font';
import React, { createContext, useContext } from 'react';
import { TextStyle } from 'react-native';
import { fontNames } from '../theme';

export type LoadedFonts = {
  ui?: string;
  uiBold?: string;
  serif?: string;
  arabic?: string;
  arabicBold?: string;
};

const FontContext = createContext<LoadedFonts>({});

/**
 * Charge les polices OFL depuis le bundle. N'attend pas le réseau et ne bloque pas
 * l'ouverture : tant qu'elles ne sont pas prêtes, l'interface utilise les polices système.
 */
export function FontProvider({ children }: { children: React.ReactNode }) {
  const [loaded] = useFonts({
    [fontNames.ui]: require('../../assets/fonts/SourceSans3-Regular.ttf'),
    [fontNames.uiBold]: require('../../assets/fonts/SourceSans3-Bold.ttf'),
    [fontNames.serif]: require('../../assets/fonts/SourceSerif4-Regular.ttf'),
    [fontNames.arabic]: require('../../assets/fonts/NotoNaskhArabic-Regular.ttf'),
    [fontNames.arabicBold]: require('../../assets/fonts/NotoNaskhArabic-Bold.ttf'),
  });
  const value: LoadedFonts = loaded
    ? {
        ui: fontNames.ui,
        uiBold: fontNames.uiBold,
        serif: fontNames.serif,
        arabic: fontNames.arabic,
        arabicBold: fontNames.arabicBold,
      }
    : {};
  return <FontContext.Provider value={value}>{children}</FontContext.Provider>;
}

export function useAppFonts(): LoadedFonts {
  return useContext(FontContext);
}

export function uiFontStyle(weight: TextStyle['fontWeight'], rtl: boolean, fonts: LoadedFonts): TextStyle {
  const heavy = weight === 'bold' || weight === '600' || weight === '700' || weight === '800';
  if (rtl && (heavy ? fonts.arabicBold : fonts.arabic)) {
    return { fontFamily: heavy ? fonts.arabicBold : fonts.arabic, fontWeight: 'normal' };
  }
  if (!rtl && (heavy ? fonts.uiBold : fonts.ui)) {
    return { fontFamily: heavy ? fonts.uiBold : fonts.ui, fontWeight: 'normal' };
  }
  return weight ? { fontWeight: weight } : {};
}
