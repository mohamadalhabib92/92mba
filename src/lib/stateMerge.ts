import type { Lang } from '../i18n/strings';
import type { ReaderMargin, ReaderTheme } from '../theme';
import { snapFontScale, snapLineHeight, snapMargin } from '../theme';
import type { Doc, LicenseKind, LicenseStatusCode } from './library';
import { cleanHistory } from './textGuard';

export type Progress = { page: number; pages: number; updatedAt: number };

/** Préférences : seules celles réellement changées par l'utilisateur gagnent sur le cache. */
export const PREFERENCE_KEYS = ['lang', 'fontScale', 'lineHeight', 'readerMargin', 'dyslexia', 'readerTheme'] as const;
export type PreferenceKey = (typeof PREFERENCE_KEYS)[number];

export type AppState = {
  lang: Lang;
  fontScale: number;
  lineHeight: number;
  readerMargin: ReaderMargin;
  dyslexia: boolean;
  readerTheme: ReaderTheme;
  progress: Record<string, Progress>;
  bookmarks: Record<string, number[]>;
  searchHistory: string[];
  userDocs: Doc[];
  /** Introduction vue (ou passée). Les profils existants sont considérés comme déjà accueillis. */
  onboarded: boolean;
};

export function defaultAppState(): AppState {
  return {
    lang: 'fr',
    fontScale: 1,
    lineHeight: 1.6,
    readerMargin: 'normal',
    dyslexia: false,
    readerTheme: 'light',
    progress: {},
    bookmarks: {},
    searchHistory: [],
    userDocs: [],
    onboarded: false,
  };
}

const CATEGORIES = ['strategy', 'finance', 'marketing', 'leadership', 'operations', 'economics', 'other'] as const;
const KINDS: LicenseKind[] = ['original', 'owned', 'public-domain', 'open', 'placeholder'];
const STATUS: LicenseStatusCode[] = ['needs-review', 'public-domain-claimed', 'placeholder', 'owned', 'open'];

function sanitizeProgress(raw: unknown): Record<string, Progress> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, Progress> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const p = value as Partial<Progress>;
    if (typeof p.page !== 'number' || !Number.isFinite(p.page)) continue;
    if (typeof p.pages !== 'number' || !Number.isFinite(p.pages) || p.pages <= 0) continue;
    out[id] = { page: p.page, pages: p.pages, updatedAt: typeof p.updatedAt === 'number' && Number.isFinite(p.updatedAt) ? p.updatedAt : 0 };
  }
  return out;
}

function sanitizeBookmarks(raw: unknown): Record<string, number[]> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, number[]> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue;
    const pages = value.filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
    out[id] = [...new Set(pages)].sort((a, b) => a - b);
  }
  return out;
}

function sanitizeUserDoc(raw: unknown): Doc | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Partial<Doc>;
  if (typeof d.id !== 'string' || !d.id || typeof d.title !== 'string') return null;
  const kind = KINDS.includes(d.license?.kind as LicenseKind) ? (d.license!.kind as LicenseKind) : 'owned';
  const statusCode = STATUS.includes(d.license?.statusCode as LicenseStatusCode) ? d.license!.statusCode : undefined;
  const category = CATEGORIES.includes(d.category as (typeof CATEGORIES)[number]) ? d.category! : 'other';
  const lang: Lang = d.lang === 'en' || d.lang === 'ar' || d.lang === 'fr' ? d.lang : 'fr';
  const paragraphs = Array.isArray(d.paragraphs) ? d.paragraphs.filter((p): p is string => typeof p === 'string') : [];
  return {
    id: d.id,
    title: d.title,
    author: typeof d.author === 'string' && d.author.trim() ? d.author : '—',
    lang,
    category,
    year: typeof d.year === 'string' ? d.year : undefined,
    license: {
      kind,
      label: typeof d.license?.label === 'string' && d.license.label.trim() ? d.license.label : kind,
      source: typeof d.license?.source === 'string' ? d.license.source : undefined,
      url: typeof d.license?.url === 'string' ? d.license.url : undefined,
      statusCode,
      date: typeof d.license?.date === 'string' ? d.license.date : undefined,
      gutenberg: d.license?.gutenberg === 'stripped' ? 'stripped' : undefined,
    },
    summary: typeof d.summary === 'string' ? d.summary : '',
    note: typeof d.note === 'string' ? d.note : undefined,
    paragraphs,
    userAdded: d.userAdded === true,
    addedAt: typeof d.addedAt === 'string' ? d.addedAt : undefined,
  };
}

function sanitizeUserDocs(raw: unknown): Doc[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(sanitizeUserDoc).filter((d): d is Doc => !!d);
}

/** Fusion additive : les champs nouveaux reçoivent un défaut, l'historique est nettoyé, rien de valide n'est écarté. */
export function mergeStored(stored: Partial<AppState> | null | undefined): AppState {
  const base = defaultAppState();
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return base;
  const lang: Lang = stored.lang === 'en' || stored.lang === 'ar' || stored.lang === 'fr' ? stored.lang : base.lang;
  const readerTheme: ReaderTheme =
    stored.readerTheme === 'sepia' || stored.readerTheme === 'dark' || stored.readerTheme === 'light' ? stored.readerTheme : base.readerTheme;
  return {
    lang,
    fontScale: snapFontScale(stored.fontScale ?? base.fontScale),
    lineHeight: snapLineHeight(stored.lineHeight ?? base.lineHeight),
    readerMargin: snapMargin(stored.readerMargin ?? base.readerMargin),
    dyslexia: stored.dyslexia === true,
    readerTheme,
    progress: sanitizeProgress(stored.progress),
    bookmarks: sanitizeBookmarks(stored.bookmarks),
    searchHistory: cleanHistory(stored.searchHistory),
    userDocs: sanitizeUserDocs(stored.userDocs),
    // Un profil déjà enregistré sans ce champ = utilisateur existant : pas d’introduction.
    onboarded: stored.onboarded !== false,
  };
}

function furtherPage(a: Progress, b: Progress): Progress {
  if (a.page !== b.page) return a.page > b.page ? a : b;
  return a.updatedAt >= b.updatedAt ? a : b;
}

/**
 * Page à conserver quand la lecture du cache se termine après un « suivant ».
 * max(page enregistrée, page de la session) : la page 1 ne remplace pas la page 120.
 */
export function readingPageToKeep(savedPage: number | undefined, sessionPage: number, userMoved: boolean): number {
  const saved = typeof savedPage === 'number' && Number.isFinite(savedPage) ? savedPage : 0;
  const session = userMoved && Number.isFinite(sessionPage) ? sessionPage : saved;
  return Math.max(saved, session);
}

/**
 * Le cache arrive après « Continuer hors ligne ».
 * Chaque préférence de la session ne remplace le cache que si l'utilisateur l'a vraiment changée.
 * La progression garde la page la plus avancée, pas la plus récente (un page 0 automatique ne gagne pas).
 */
export function mergeLate(current: AppState, stored: Partial<AppState>, touched?: ReadonlySet<string>): AppState {
  const saved = mergeStored(stored);
  const keep = touched ?? new Set<string>();
  const progress: Record<string, Progress> = { ...saved.progress };
  for (const [id, page] of Object.entries(current.progress)) {
    const other = progress[id];
    progress[id] = other ? furtherPage(page, other) : page;
  }
  const bookmarks: Record<string, number[]> = { ...saved.bookmarks };
  for (const [id, pages] of Object.entries(current.bookmarks)) {
    bookmarks[id] = [...new Set([...(bookmarks[id] ?? []), ...pages])].sort((a, b) => a - b);
  }
  const docs = new Map<string, Doc>();
  for (const doc of saved.userDocs) docs.set(doc.id, doc);
  for (const doc of current.userDocs) docs.set(doc.id, doc);
  return {
    lang: keep.has('lang') ? current.lang : saved.lang,
    fontScale: keep.has('fontScale') ? current.fontScale : saved.fontScale,
    lineHeight: keep.has('lineHeight') ? current.lineHeight : saved.lineHeight,
    readerMargin: keep.has('readerMargin') ? current.readerMargin : saved.readerMargin,
    dyslexia: keep.has('dyslexia') ? current.dyslexia : saved.dyslexia,
    readerTheme: keep.has('readerTheme') ? current.readerTheme : saved.readerTheme,
    progress,
    bookmarks,
    searchHistory: cleanHistory([...current.searchHistory, ...saved.searchHistory]),
    userDocs: [...docs.values()],
    onboarded: current.onboarded || saved.onboarded,
  };
}
