import { useColorScheme, StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { badgeTones, badgeTonesDark, colors, darkColors, type Colors } from '../theme';

/** Palette de l’interface selon l’apparence du système (clair / sombre). */
export function useColors(): Colors {
  return useColorScheme() === 'dark' ? darkColors : colors;
}

export function useIsDark(): boolean {
  return useColorScheme() === 'dark';
}

export function useBadgeTones() {
  return useColorScheme() === 'dark' ? badgeTonesDark : badgeTones;
}

/**
 * Feuille de styles dépendante de la palette : créée une fois par thème.
 * `const useStyles = makeStyles((colors) => ({ … }))`, puis `const styles = useStyles()`.
 */
export function makeStyles<S extends Record<string, ViewStyle | TextStyle | ImageStyle>>(fn: (c: Colors) => S) {
  const cache = new Map<Colors, Readonly<S>>();
  return function useStyles(): Readonly<S> {
    const c = useColors();
    let s = cache.get(c);
    if (!s) {
      s = StyleSheet.create(fn(c));
      cache.set(c, s);
    }
    return s;
  };
}

/** Ombre douce, plus discrète en sombre. */
export function softShadow(dark: boolean, level: 1 | 2 | 3 = 1) {
  const k = { 1: [0.06, 12, 4, 1], 2: [0.1, 18, 6, 3], 3: [0.18, 28, 12, 8] }[level];
  return { shadowColor: '#000', shadowOpacity: dark ? k[0] * 3 : k[0], shadowRadius: k[1], shadowOffset: { width: 0, height: k[2] }, elevation: k[3] };
}
