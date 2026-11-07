import type { Doc } from './library';
import { mergeStored, type AppState, type Progress } from './stateMerge';
import { sha256Hex, utf8ByteLength } from './sha256';

/**
 * Version lue par cette application. Une valeur absente = documents déjà installés (legacy).
 * Toute autre valeur est mise en quarantaine : pas d'adoption, pas d'écrasement.
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Seuil produit : on n'écrit pas la clé unique si le JSON atteint 2 000 000 octets.
 * Hypothèse seulement. La doc AsyncStorage 2.x parle d'une fenêtre curseur Android
 * d'environ 2 Mo par entrée. Ce n'est pas une limite mesurée, ni un plafond
 * universel iOS, web ou Android, ni une garantie technique.
 */
export const PRODUCT_ENTRY_GUARD_BYTES = 2_000_000;

export function exceedsProductEntryGuard(bytes: number): boolean {
  return bytes >= PRODUCT_ENTRY_GUARD_BYTES;
}

/** Clé de copie pour une version refusée. Jamais la clé d'origine. */
export function quarantineStorageKey(key: string): string {
  return `${key}:quarantine`;
}

/** Restauration isolée d'une future bascule. Jamais la clé live `92mba:v1`. */
export const ISOLATED_RESTORE_KEY = '92mba:v1:isolated-restore';

export const KNOWN_STATE_KEYS = [
  'lang',
  'fontScale',
  'lineHeight',
  'readerMargin',
  'dyslexia',
  'readerTheme',
  'progress',
  'bookmarks',
  'searchHistory',
  'userDocs',
] as const;

export type VersionState = 'empty' | 'legacy' | 'v1' | 'unsupported' | 'incoherent' | 'unreadable';

export type PreserveReport = {
  bytes: number;
  sha256: string;
  progressEntries: number;
  bookmarkLists: number;
  historyEntries: number;
  userDocs: number;
  unknownKeys: number;
  versionState: VersionState;
};

export const EMPTY_PRESERVE_REPORT: PreserveReport = {
  bytes: 0,
  sha256: '',
  progressEntries: 0,
  bookmarkLists: 0,
  historyEntries: 0,
  userDocs: 0,
  unknownKeys: 0,
  versionState: 'empty',
};

export type ClassifyResult =
  | { action: 'adopt'; rawObject: Record<string, unknown> }
  | { action: 'quarantine'; reason: 'unsupported-version' | 'incoherent-version' }
  | { action: 'unreadable' };

function isPlain(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function classifyStored(parsed: unknown): ClassifyResult {
  if (!isPlain(parsed)) return { action: 'unreadable' };
  if ('schemaVersion' in parsed) {
    const version = parsed.schemaVersion;
    if (version !== CURRENT_SCHEMA_VERSION) {
      const unsupported = typeof version === 'number' && Number.isFinite(version) && version > CURRENT_SCHEMA_VERSION;
      return { action: 'quarantine', reason: unsupported ? 'unsupported-version' : 'incoherent-version' };
    }
  }
  return { action: 'adopt', rawObject: parsed };
}

function countUnknown(obj: Record<string, unknown>): number {
  let n = 0;
  for (const key of Object.keys(obj)) {
    if (key === 'schemaVersion') continue;
    if (!(KNOWN_STATE_KEYS as readonly string[]).includes(key)) n += 1;
  }
  return n;
}

/** Compteurs et empreinte. Aucun texte de document, aucun identifiant, aucun historique. */
export function describeRaw(raw: string | null): PreserveReport {
  if (raw == null) return EMPTY_PRESERVE_REPORT;
  const bytes = utf8ByteLength(raw);
  const sha256 = sha256Hex(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...EMPTY_PRESERVE_REPORT, bytes, sha256, versionState: 'unreadable' };
  }
  const decision = classifyStored(parsed);
  if (decision.action === 'unreadable') {
    return { ...EMPTY_PRESERVE_REPORT, bytes, sha256, versionState: 'unreadable' };
  }
  const obj = decision.action === 'adopt' ? decision.rawObject : (parsed as Record<string, unknown>);
  const versionState: VersionState =
    decision.action === 'quarantine'
      ? decision.reason === 'unsupported-version'
        ? 'unsupported'
        : 'incoherent'
      : 'schemaVersion' in obj
        ? 'v1'
        : 'legacy';
  return {
    bytes,
    sha256,
    progressEntries: isPlain(obj.progress) ? Object.keys(obj.progress).length : 0,
    bookmarkLists: isPlain(obj.bookmarks) ? Object.keys(obj.bookmarks).length : 0,
    historyEntries: Array.isArray(obj.searchHistory) ? obj.searchHistory.length : 0,
    userDocs: Array.isArray(obj.userDocs) ? obj.userDocs.length : 0,
    unknownKeys: countUnknown(obj),
    versionState,
  };
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function adoptedProgress(prev: unknown): Progress | null {
  if (!isPlain(prev)) return null;
  if (typeof prev.page !== 'number' || !Number.isFinite(prev.page)) return null;
  if (typeof prev.pages !== 'number' || !Number.isFinite(prev.pages) || (prev.pages as number) <= 0) return null;
  const updatedAt = typeof prev.updatedAt === 'number' && Number.isFinite(prev.updatedAt) ? prev.updatedAt : 0;
  return { page: prev.page as number, pages: prev.pages as number, updatedAt };
}

function mergeProgress(rawVal: unknown, live: Record<string, Progress>): unknown {
  if (!isPlain(rawVal)) return live;
  const base: Record<string, unknown> = { ...rawVal };
  for (const [id, page] of Object.entries(live)) {
    const prev = base[id];
    if (sameJson(adoptedProgress(prev), page)) continue;
    if (isPlain(prev)) base[id] = { ...prev, page: page.page, pages: page.pages, updatedAt: page.updatedAt };
    else base[id] = { page: page.page, pages: page.pages, updatedAt: page.updatedAt };
  }
  return base;
}

function adoptedBookmarks(prev: unknown): number[] | null {
  if (!Array.isArray(prev)) return null;
  const pages = prev.filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  return [...new Set(pages)].sort((a, b) => a - b);
}

function mergeBookmarks(rawVal: unknown, live: Record<string, number[]>): unknown {
  if (!isPlain(rawVal)) return live;
  const base: Record<string, unknown> = { ...rawVal };
  for (const [id, pages] of Object.entries(live)) {
    if (sameJson(adoptedBookmarks(base[id]), pages)) continue;
    base[id] = pages;
  }
  return base;
}

function mergeDocs(rawVal: unknown, live: Doc[]): unknown {
  const rawArr = Array.isArray(rawVal) ? rawVal : [];
  const rawById = new Map<string, Record<string, unknown>>();
  const orphans: unknown[] = [];
  for (const item of rawArr) {
    if (isPlain(item) && typeof item.id === 'string' && item.id) rawById.set(item.id, item);
    else orphans.push(item);
  }
  const seen = new Set<string>();
  const out: unknown[] = [];
  for (const doc of live) {
    seen.add(doc.id);
    const prev = rawById.get(doc.id);
    const adopted = prev ? mergeStored({ userDocs: [prev as unknown as Doc] }).userDocs.find((item) => item.id === doc.id) : undefined;
    if (prev && adopted && sameJson(adopted, doc)) {
      out.push(prev);
      continue;
    }
    out.push(prev ? { ...prev, ...doc } : doc);
  }
  for (const [id, prev] of rawById) {
    if (!seen.has(id)) out.push(prev);
  }
  out.push(...orphans);
  return out;
}

/**
 * Ajoute les recherches déjà en mémoire devant l'historique stocké.
 * Une liste vide est un effacement explicite. Sinon, aucune entrée déjà présente
 * n'est retirée : le plafond d'affichage ne sert pas de coupe du disque.
 * La déduplication ne porte que sur la requête ajoutée (casse ignorée) et garde
 * l'orthographe déjà stockée. Elle ne fusionne pas deux graphies anciennes.
 * Une forme qui n'est pas un tableau est laissée telle quelle.
 */
export function mergePersistedSearchHistory(rawVal: unknown, live: string[]): unknown {
  if (!Array.isArray(rawVal)) return rawVal === undefined ? live : rawVal;
  if (live.length === 0) return [];
  const next = rawVal.slice();
  for (const query of [...live].reverse()) {
    if (typeof query !== 'string' || !query) continue;
    const idx = next.findIndex((item) => typeof item === 'string' && item.toLowerCase() === query.toLowerCase());
    if (idx >= 0) {
      const [kept] = next.splice(idx, 1);
      next.unshift(kept);
    } else {
      next.unshift(query);
    }
  }
  return next;
}

/**
 * Recompose l'objet à écrire.
 * Les clés inconnues, les types non adoptés et les documents non reconnus restent
 * tant que l'utilisateur n'a pas modifié cette partie.
 */
export function composeSave(raw: Record<string, unknown> | null, live: AppState, changed: ReadonlySet<string>): Record<string, unknown> {
  if (!raw) return { ...live };
  const out: Record<string, unknown> = { ...raw };
  for (const key of KNOWN_STATE_KEYS) {
    if (!changed.has(key)) continue;
    if (key === 'progress') out.progress = mergeProgress(raw.progress, live.progress);
    else if (key === 'bookmarks') out.bookmarks = mergeBookmarks(raw.bookmarks, live.bookmarks);
    else if (key === 'userDocs') out.userDocs = mergeDocs(raw.userDocs, live.userDocs);
    else if (key === 'searchHistory') out.searchHistory = mergePersistedSearchHistory(raw.searchHistory, live.searchHistory);
    else out[key] = live[key];
  }
  return out;
}

export type CutoverResult = {
  restored: boolean;
  rollback: boolean;
  hashMatch: boolean;
  countsMatch: boolean;
  snapshot: PreserveReport;
  candidate: PreserveReport;
  writtenBytes: number;
};

/**
 * Bascule future : compare un instantané et un candidat, puis n'écrit que la clé isolée.
 * Hash ou compteurs différents → la valeur isolée redevient l'instantané. La clé live n'est pas touchée.
 */
export function restoreIsolated(
  target: { set(key: string, value: string): void },
  snapshotRaw: string,
  candidateRaw: string,
): CutoverResult {
  const snapshot = describeRaw(snapshotRaw);
  const candidate = describeRaw(candidateRaw);
  const hashMatch = snapshot.sha256 !== '' && snapshot.sha256 === candidate.sha256;
  const countsMatch =
    snapshot.progressEntries === candidate.progressEntries &&
    snapshot.userDocs === candidate.userDocs &&
    snapshot.bookmarkLists === candidate.bookmarkLists &&
    snapshot.historyEntries === candidate.historyEntries &&
    snapshot.bytes === candidate.bytes &&
    snapshot.unknownKeys === candidate.unknownKeys;
  const restored = hashMatch && countsMatch;
  const written = restored ? candidateRaw : snapshotRaw;
  target.set(ISOLATED_RESTORE_KEY, written);
  return {
    restored,
    rollback: !restored,
    hashMatch,
    countsMatch,
    snapshot,
    candidate,
    writtenBytes: utf8ByteLength(written),
  };
}
