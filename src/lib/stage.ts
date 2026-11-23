/** Colonne téléphone inchangée. Au-delà, une fenêtre iPad, Mac ou web reste lisible. */
export const PHONE_CONTENT_MAX = 760;
export const WIDE_CONTENT_MAX = 1040;
export const WIDE_BREAKPOINT = 840;

export type StageKind = 'phone' | 'pad' | 'mac' | 'web' | 'tv';

export function stageKind(input: { os: string; isPad: boolean; isTV: boolean; isMac: boolean }): StageKind {
  if (input.isTV) return 'tv';
  if (input.isMac) return 'mac';
  if (input.os === 'web') return 'web';
  if (input.isPad) return 'pad';
  return 'phone';
}

/** L’iPhone et l’Apple TV gardent la colonne étroite, même en paysage. */
export function stageFor(width: number, kind: StageKind): { wide: boolean; maxWidth: number } {
  const wide = kind !== 'phone' && kind !== 'tv' && width >= WIDE_BREAKPOINT;
  return { wide, maxWidth: wide ? WIDE_CONTENT_MAX : PHONE_CONTENT_MAX };
}

export type MacKeyName = 'escape' | 'find' | 'tab' | 'tabBack' | 'enter' | 'space' | 'up' | 'down' | 'left' | 'right';

export function keyFromWeb(event: { key: string; metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean }): MacKeyName | null {
  const key = event.key;
  if ((event.metaKey || event.ctrlKey) && !event.altKey && key.toLowerCase() === 'f') return 'find';
  if (event.metaKey || event.ctrlKey || event.altKey) return null;
  if (key === 'Escape') return 'escape';
  if (key === 'Tab') return event.shiftKey ? 'tabBack' : 'tab';
  if (key === 'Enter') return 'enter';
  if (key === ' ') return 'space';
  if (key === 'ArrowUp') return 'up';
  if (key === 'ArrowDown') return 'down';
  if (key === 'ArrowLeft') return 'left';
  if (key === 'ArrowRight') return 'right';
  return null;
}

export type KeyAction = 'ignore' | 'escape' | 'find' | 'next' | 'prev' | 'activate' | 'left' | 'right' | 'up' | 'down';

/** En saisie, seules Échap et Cmd+F sortent du champ. */
export function actionForKey(key: string, typing: boolean): KeyAction {
  if (key === 'find') return 'find';
  if (key === 'escape') return 'escape';
  if (typing) return 'ignore';
  if (key === 'tab') return 'next';
  if (key === 'tabBack') return 'prev';
  if (key === 'enter' || key === 'space') return 'activate';
  if (key === 'up') return 'up';
  if (key === 'down') return 'down';
  if (key === 'left') return 'left';
  if (key === 'right') return 'right';
  return 'ignore';
}
