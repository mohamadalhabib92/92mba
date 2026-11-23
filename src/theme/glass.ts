/**
 * Verre : surfaces translucides, relief des boutons, repli opaque.
 * Les couleurs historiques de `src/theme.ts` ne bougent pas.
 * Le résultat opaque (`surfaceOpaque`) est la couleur réellement perçue
 * quand la surface est posée sur le fond de page : c'est elle que l'on
 * compare pour le contraste AA.
 */

import type { Palette } from './system';

type ShadowLayer = {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
};

export type Glass = {
  /** Réduire la transparence, contraste élevé, ou Apple TV : pas de voile. */
  solid: boolean;
  canvas: string;
  surface: string;
  surfaceOpaque: string;
  strong: string;
  hairline: string;
  highlight: string;
  shade: string;
  wash: string;
  washAlt: string;
  shadow: string;
};

type RGB = { r: number; g: number; b: number };

function parseHex(hex: string): RGB {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function toHex({ r, g, b }: RGB): string {
  const ch = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${ch(r)}${ch(g)}${ch(b)}`.toUpperCase();
}

/** Mélange opaque : `t` = part de `src`. */
export function mix(dst: string, src: string, t: number): string {
  const a = parseHex(dst);
  const b = parseHex(src);
  const k = Math.max(0, Math.min(1, t));
  return toHex({
    r: a.r + (b.r - a.r) * k,
    g: a.g + (b.g - a.g) * k,
    b: a.b + (b.b - a.b) * k,
  });
}

export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = parseHex(hex);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** `src` à `alpha` composite sur `dst`. */
export function over(dst: string, src: string, alpha: number): string {
  return mix(dst, src, alpha);
}

export function glassFor(palette: Palette, dark: boolean, solid: boolean): Glass {
  if (solid) {
    return {
      solid: true,
      canvas: palette.bg,
      surface: palette.surface,
      surfaceOpaque: palette.surface,
      strong: palette.surfaceAlt,
      hairline: palette.border,
      highlight: mix(palette.surface, '#FFFFFF', dark ? 0.22 : 0.72),
      shade: mix(palette.surface, '#000000', dark ? 0.4 : 0.14),
      wash: 'transparent',
      washAlt: 'transparent',
      shadow: palette.shadow,
    };
  }
  if (!dark) {
    const alpha = 0.78;
    const src = '#FFFFFF';
    return {
      solid: false,
      canvas: palette.bg,
      surface: rgba(src, alpha),
      surfaceOpaque: over(palette.bg, src, alpha),
      strong: rgba('#FFFFFF', 0.92),
      hairline: rgba(palette.primary, 0.14),
      highlight: rgba('#FFFFFF', 0.96),
      shade: rgba(palette.primary, 0.16),
      wash: rgba(palette.primary, 0.08),
      washAlt: rgba(palette.accent, 0.2),
      shadow: palette.shadow,
    };
  }
  const alpha = 0.5;
  const src = '#243044';
  return {
    solid: false,
    canvas: palette.bg,
    surface: rgba(src, alpha),
    surfaceOpaque: over(palette.bg, src, alpha),
    strong: rgba('#2C364C', 0.86),
    hairline: rgba('#FFFFFF', 0.14),
    highlight: rgba('#FFFFFF', 0.24),
    shade: rgba('#000000', 0.55),
    wash: rgba(palette.accent, 0.14),
    washAlt: rgba(palette.primary, 0.12),
    shadow: '#000000',
  };
}

/** Bord clair en haut, bord sombre en bas : le bouton a une épaisseur visible. */
export function reliefEdges(fill: string, dark: boolean): { highlight: string; shade: string } {
  let highlight = mix(fill, '#FFFFFF', dark ? 0.42 : 0.5);
  let shade = mix(fill, '#000000', dark ? 0.38 : 0.34);
  if (highlight.toLowerCase() === fill.toLowerCase()) highlight = mix(fill, '#000000', 0.2);
  if (shade.toLowerCase() === fill.toLowerCase() || shade.toLowerCase() === highlight.toLowerCase()) {
    shade = mix(fill, '#000000', 0.45);
  }
  if (shade.toLowerCase() === highlight.toLowerCase()) highlight = mix(fill, '#FFFFFF', 0.55);
  return { highlight, shade };
}

export function pressedFill(fill: string, dark: boolean): string {
  return mix(fill, dark ? '#FFFFFF' : '#000000', dark ? 0.1 : 0.1);
}

/** Paire bouton danger, AA dans les deux apparences. */
export function dangerInk(dark: boolean, highContrast: boolean): { bg: string; fg: string } {
  if (highContrast && dark) return { bg: '#FFD2CC', fg: '#000000' };
  if (highContrast) return { bg: '#7A120E', fg: '#FFFFFF' };
  if (dark) return { bg: '#FFB4AB', fg: '#3B0907' };
  return { bg: '#B3261E', fg: '#FFFFFF' };
}

/**
 * Barre du lecteur : voile du thème de lecture sur la page.
 * Opaque quand la transparence est réduite. Le texte reste sur cette teinte.
 */
export function frostBar(bar: string, page: string, opaque: boolean): string {
  if (opaque) return bar;
  return over(page, bar, 0.88);
}

export function layeredShadow(shadow: string, pressed: boolean, lifted: boolean): { far: ShadowLayer; near: ShadowLayer } {
  if (!lifted) return { far: {}, near: {} };
  return {
    far: {
      shadowColor: shadow,
      shadowOffset: { width: 0, height: pressed ? 1 : 8 },
      shadowOpacity: pressed ? 0.14 : 0.22,
      shadowRadius: pressed ? 3 : 16,
      elevation: pressed ? 1 : 6,
    },
    near: {
      shadowColor: shadow,
      shadowOffset: { width: 0, height: pressed ? 1 : 2 },
      shadowOpacity: pressed ? 0.2 : 0.3,
      shadowRadius: pressed ? 1 : 3,
      elevation: pressed ? 1 : 2,
    },
  };
}
