/**
 * Mode Focus — logique pure (aucun import React Native), testée unitairement.
 *
 * - Durées proposées : 10, 15, 20 ou 30 min (10 min minimum).
 * - Minuteur basé sur l’horloge murale (horodatages) : le temps passé HORS de
 *   l’app (arrière-plan) met le minuteur en PAUSE et ne compte pas. Au retour,
 *   un message discret signale l’interruption.
 * - Avant la fin, on ne sort que par la « Sortie d’urgence » (appui long ≈ 3 s,
 *   puis confirmation).
 * - Chaque passage en arrière-plan est noté comme une interruption.
 * - Une sortie d’urgence est gardée dans l’historique mais ne compte ni dans
 *   les totaux (seules les sessions terminées comptent ; le Mode Focus n’a pas de série).
 * - Navigation : pendant une session, l’écran Focus ne se ferme pas (Retour
 *   bloqué) ; le contenu (leçon, lecteur) reste accessible ; tout autre écran
 *   ramène à l’écran Focus.
 * - Historique stocké sous une NOUVELLE clé dédiée : aucune clé existante n’est
 *   lue, migrée, réécrite ou supprimée.
 */

export const FOCUS_DURATIONS = [10, 15, 20, 30] as const;
export type FocusMinutes = (typeof FOCUS_DURATIONS)[number];
export const MIN_FOCUS_MINUTES = 10;
/** Durée de l’appui long de la sortie d’urgence. */
export const EMERGENCY_HOLD_MS = 3000;
/** Historique conservé (les plus anciennes sessions sortent en premier). */
export const HISTORY_LIMIT = 200;

const MINUTE = 60_000;

export type FocusTarget = { kind: string; id?: string; label?: string };
export type Interruption = { at: number; ms?: number };

export type FocusSession = {
  id: string;
  startedAt: number;
  durationMs: number;
  target?: FocusTarget;
  interruptions: Interruption[];
  /** Horodatage du passage en arrière-plan en cours, sinon null. */
  backgroundSince: number | null;
};

export type FocusOutcome = 'completed' | 'emergency';

export type FocusRecord = {
  id: string;
  startedAt: number;
  endedAt: number;
  plannedMinutes: number;
  /** Temps de concentration (pauses exclues, plafonné à la durée). */
  elapsedMs: number;
  /** Temps passé hors de l’app pendant la session. */
  awayMs: number;
  interruptions: number;
  outcome: FocusOutcome;
  target?: FocusTarget;
};

export type FocusData = { v: 1; active: FocusSession | null; history: FocusRecord[]; guideSeen: boolean };

export function isFocusMinutes(n: unknown): n is FocusMinutes {
  return typeof n === 'number' && (FOCUS_DURATIONS as readonly number[]).includes(n);
}

export function startFocus(minutes: number, now: number, target?: FocusTarget, id?: string): FocusSession {
  if (!isFocusMinutes(minutes)) throw new Error(`Durée de focus invalide : ${minutes} (attendu : ${FOCUS_DURATIONS.join(', ')})`);
  return {
    id: id ?? `f${now.toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`,
    startedAt: now,
    durationMs: minutes * MINUTE,
    target,
    interruptions: [],
    backgroundSince: null,
  };
}

/** Temps en pause (hors de l’app) : interruptions closes + interruption en cours. */
export function pausedMs(s: FocusSession, now: number): number {
  let total = 0;
  for (const it of s.interruptions) total += it.ms !== undefined ? it.ms : Math.max(0, now - it.at);
  return total;
}

/** Temps de concentration : horloge murale moins les pauses, borné à [0, durée] (horloge reculée ⇒ 0). */
export function elapsedMs(s: FocusSession, now: number): number {
  return Math.min(s.durationMs, Math.max(0, now - s.startedAt - pausedMs(s, now)));
}

export function remainingMs(s: FocusSession, now: number): number {
  return s.durationMs - elapsedMs(s, now);
}

export function progressOf(s: FocusSession, now: number): number {
  return s.durationMs > 0 ? elapsedMs(s, now) / s.durationMs : 1;
}

export function isComplete(s: FocusSession, now: number): boolean {
  return now - s.startedAt - pausedMs(s, now) >= s.durationMs;
}

/** Temps restant « mm:ss » (secondes arrondies au supérieur). */
export function formatClock(ms: number, num: (n: number) => string = String): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const sec = total % 60;
  const two = (v: number) => (v < 10 ? num(0) + num(v) : num(v));
  return `${two(m)}:${two(sec)}`;
}

/** Minutes restantes à afficher (arrondi supérieur : « 1 min » jusqu’à la fin). */
export function remainingMinutes(s: FocusSession, now: number): number {
  return Math.ceil(remainingMs(s, now) / MINUTE);
}

/** L’app passe en arrière-plan : le minuteur se met en pause, une interruption est notée (une seule par sortie). */
export function onBackground(s: FocusSession, now: number): FocusSession {
  if (s.backgroundSince !== null) return s;
  return { ...s, backgroundSince: now, interruptions: [...s.interruptions, { at: now }] };
}

/** Retour au premier plan : on ferme l’interruption en cours avec sa durée (le minuteur repart). */
export function onForeground(s: FocusSession, now: number): FocusSession {
  if (s.backgroundSince === null) return s;
  const since = s.backgroundSince;
  const list = s.interruptions.slice();
  const last = list[list.length - 1];
  if (last && last.ms === undefined) list[list.length - 1] = { ...last, ms: Math.max(0, now - since) };
  return { ...s, backgroundSince: null, interruptions: list };
}

/** Temps passé hors de l’app pendant la session (= temps en pause). */
export function awayMs(s: FocusSession, now: number): number {
  return pausedMs(s, now);
}

function toRecord(s: FocusSession, now: number, outcome: FocusOutcome): FocusRecord {
  // Terminée : l’instant où la durée de concentration a été atteinte (pauses comprises).
  const endedAt = outcome === 'completed' ? Math.min(now, s.startedAt + s.durationMs + pausedMs(s, now)) : Math.max(s.startedAt, now);
  return {
    id: s.id,
    startedAt: s.startedAt,
    endedAt,
    plannedMinutes: Math.round(s.durationMs / MINUTE),
    elapsedMs: elapsedMs(s, endedAt),
    awayMs: awayMs(s, endedAt),
    interruptions: s.interruptions.length,
    outcome,
    target: s.target,
  };
}

/** Fin normale : seulement quand la durée choisie est atteinte. */
export function completeFocus(s: FocusSession, now: number): FocusRecord | null {
  return isComplete(s, now) ? toRecord(onForeground(s, now), now, 'completed') : null;
}

export type LeaveResult = { ok: true; record: FocusRecord } | { ok: false; reason: 'minimum'; remainingMs: number };

/** Sortie ordinaire : refusée avant la fin de la durée choisie. */
export function requestLeave(s: FocusSession, now: number): LeaveResult {
  const record = completeFocus(s, now);
  return record ? { ok: true, record } : { ok: false, reason: 'minimum', remainingMs: remainingMs(s, now) };
}

export type EmergencyResult = { ok: true; record: FocusRecord } | { ok: false; reason: 'hold' | 'confirm' };

/**
 * Sortie d’urgence : appui long d’au moins EMERGENCY_HOLD_MS, PUIS confirmation.
 * Si la durée est déjà atteinte, la session compte comme terminée.
 */
export function emergencyExit(s: FocusSession, now: number, opts: { heldMs: number; confirmed: boolean }): EmergencyResult {
  if (!holdDone(opts.heldMs)) return { ok: false, reason: 'hold' };
  if (!opts.confirmed) return { ok: false, reason: 'confirm' };
  const done = completeFocus(s, now);
  return { ok: true, record: done ?? toRecord(onForeground(s, now), now, 'emergency') };
}

export function holdProgress(heldMs: number): number {
  return Math.min(1, Math.max(0, heldMs / EMERGENCY_HOLD_MS));
}

export function holdDone(heldMs: number): boolean {
  return heldMs >= EMERGENCY_HOLD_MS;
}

/* ---------- Persistance (clé dédiée) ---------- */

export type FocusStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export function emptyFocusData(): FocusData {
  return { v: 1, active: null, history: [], guideSeen: false };
}

const num = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

function cleanTarget(x: unknown): FocusTarget | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const t = x as Record<string, unknown>;
  if (typeof t.kind !== 'string') return undefined;
  return {
    kind: t.kind.slice(0, 40),
    id: typeof t.id === 'string' ? t.id.slice(0, 200) : undefined,
    label: typeof t.label === 'string' ? t.label.slice(0, 200) : undefined,
  };
}

function cleanSession(x: unknown): FocusSession | null {
  if (!x || typeof x !== 'object') return null;
  const s = x as Record<string, unknown>;
  if (typeof s.id !== 'string' || !num(s.startedAt) || !num(s.durationMs)) return null;
  if (!isFocusMinutes(Math.round(s.durationMs / MINUTE)) || s.durationMs % MINUTE !== 0) return null;
  const interruptions = Array.isArray(s.interruptions)
    ? s.interruptions
        .filter((i): i is Interruption => !!i && typeof i === 'object' && num((i as Interruption).at))
        .map((i) => (num(i.ms) ? { at: i.at, ms: Math.max(0, i.ms) } : { at: i.at }))
    : [];
  return {
    id: s.id,
    startedAt: s.startedAt,
    durationMs: s.durationMs,
    target: cleanTarget(s.target),
    interruptions,
    backgroundSince: num(s.backgroundSince) ? s.backgroundSince : null,
  };
}

function cleanRecord(x: unknown): FocusRecord | null {
  if (!x || typeof x !== 'object') return null;
  const r = x as Record<string, unknown>;
  if (typeof r.id !== 'string' || !num(r.startedAt) || !num(r.endedAt) || !num(r.plannedMinutes)) return null;
  if (r.outcome !== 'completed' && r.outcome !== 'emergency') return null;
  return {
    id: r.id,
    startedAt: r.startedAt,
    endedAt: r.endedAt,
    plannedMinutes: r.plannedMinutes,
    elapsedMs: num(r.elapsedMs) ? r.elapsedMs : 0,
    awayMs: num(r.awayMs) ? r.awayMs : 0,
    interruptions: num(r.interruptions) ? r.interruptions : 0,
    outcome: r.outcome,
    target: cleanTarget(r.target),
  };
}

/** Lecture tolérante : valeur absente, illisible ou partielle ⇒ valeurs sûres. */
export function parseFocusData(raw: string | null): FocusData {
  if (!raw) return emptyFocusData();
  try {
    const d = JSON.parse(raw) as Record<string, unknown>;
    if (!d || typeof d !== 'object') return emptyFocusData();
    const history = Array.isArray(d.history) ? d.history.map(cleanRecord).filter((r): r is FocusRecord => !!r).slice(-HISTORY_LIMIT) : [];
    return { v: 1, active: cleanSession(d.active), history, guideSeen: d.guideSeen === true };
  } catch {
    return emptyFocusData();
  }
}

export function pushHistory(history: FocusRecord[], record: FocusRecord): FocusRecord[] {
  if (history.some((r) => r.id === record.id)) return history;
  return [...history, record].slice(-HISTORY_LIMIT);
}

/** Lecture / écriture sous une seule clé dédiée. Les erreurs de stockage ne bloquent jamais la session. */
export function createFocusStore(storage: FocusStorage, key: string) {
  return {
    key,
    async load(): Promise<FocusData> {
      try {
        return parseFocusData(await storage.getItem(key));
      } catch {
        return emptyFocusData();
      }
    },
    async save(data: FocusData): Promise<void> {
      try {
        await storage.setItem(key, JSON.stringify({ ...data, history: data.history.slice(-HISTORY_LIMIT) }));
      } catch {
        /* stockage indisponible : la session continue en mémoire */
      }
    },
  };
}

/**
 * Reprise au démarrage (app relancée pendant une session) : on ferme
 * l’interruption ouverte ; si la durée est atteinte, la session est terminée.
 */
export function resumeFocus(data: FocusData, now: number): { data: FocusData; finished: FocusRecord | null } {
  if (!data.active) return { data, finished: null };
  const active = onForeground(data.active, now);
  const finished = completeFocus(active, now);
  if (finished) return { data: { ...data, active: null, history: pushHistory(data.history, finished) }, finished };
  return { data: { ...data, active }, finished: null };
}

/** Totaux : seules les sessions TERMINÉES comptent (une sortie d’urgence ne compte pas). */
export function focusTotals(history: FocusRecord[]) {
  const completed = history.filter((r) => r.outcome === 'completed');
  return {
    completed: completed.length,
    minutes: Math.round(completed.reduce((n, r) => n + r.elapsedMs, 0) / MINUTE),
  };
}

/* ---------- Navigation pendant une session ---------- */

export const FOCUS_PATH = '/focus';

export type FocusNav = {
  /** Retour (bouton Android, geste iOS, beforeRemove) bloqué sur l’écran Focus. */
  blockBack: boolean;
  /** Pastille mm:ss affichée dans le contenu (leçon, lecteur). */
  showPill: boolean;
  /** Écran hors contenu pendant la session ⇒ retour à l’écran Focus. */
  redirect: string | null;
};

const clean = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p) || '/';
const under = (p: string, prefix: string) => p === prefix || p.startsWith(prefix + '/');

/** Règle de navigation : `contentPrefixes` = écrans de contenu autorisés pendant la session. */
export function focusNav(pathname: string, active: boolean, contentPrefixes: readonly string[]): FocusNav {
  if (!active) return { blockBack: false, showPill: false, redirect: null };
  const p = clean(pathname || '/');
  if (p === FOCUS_PATH) return { blockBack: true, showPill: false, redirect: null };
  if (contentPrefixes.some((c) => under(p, c))) return { blockBack: false, showPill: true, redirect: null };
  return { blockBack: false, showPill: false, redirect: FOCUS_PATH };
}
