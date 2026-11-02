import { highlightColors, badgeTones, colors, contrastRatio, readerThemes, readingColumnWidth, snapFontScale, snapLineHeight, snapMargin } from '../theme';
import { classifyOptionalFailure, FEATURE_ACCOUNT, FEATURE_AI, sentryEnabled } from './features';
import { licenseAudit } from './library';
import { createPersistedStore, type KeyValueStorage } from './persist';
import { defaultAppState, mergeLate, mergeStored } from './stateMerge';
import type { Doc } from './library';
import { cleanHistory, fillTemplate, safePageIndex, sanitizeSearchQuery } from './textGuard';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function checkContrast(name: string, fg: string, bg: string, min = 4.5) {
  const ratio = contrastRatio(fg, bg);
  assert(ratio >= min, `${name} ${ratio.toFixed(2)} < ${min} (${fg} on ${bg})`);
}

const history = cleanHistory([undefined, 'undefined', 'UNDEFINED', 'null', 'Null', 'MBA', 'mba', '  ', 4, 'a']);
assert(history.length === 1 && history[0] === 'MBA', `history ${JSON.stringify(history)}`);
assert(!history.some((item) => item.toLowerCase() === 'undefined'), 'undefined visible');
assert(sanitizeSearchQuery(undefined) === '', 'sanitize undefined');
assert(sanitizeSearchQuery('undefined') === '', 'sanitize string undefined');
assert(sanitizeSearchQuery(['null']) === '', 'sanitize array null');
assert(sanitizeSearchQuery('stratégie') === 'stratégie', 'sanitize keep');
assert(safePageIndex('undefined') === null, 'page undefined');
assert(safePageIndex(['2']) === 2, 'page array');
assert(safePageIndex('-1') === null, 'page negative');
assert(!fillTemplate('Page {p} / {n}', { p: undefined, n: 4 }).includes('undefined'), 'template undefined');
assert(fillTemplate('Page {p} / {n}', { p: 2, n: 9 }) === 'Page 2 / 9', 'template numbers');

for (const theme of Object.values(readerThemes)) {
  checkContrast('text/bg', theme.text, theme.bg);
  checkContrast('muted/bg', theme.muted, theme.bg);
  checkContrast('link/bg', theme.link, theme.bg);
  checkContrast('text/bar', theme.text, theme.bar);
  checkContrast('link/bar', theme.link, theme.bar);
}
assert(readerThemes.light.link !== colors.accent, 'gold used as light link');
assert(readerThemes.sepia.link !== colors.accent, 'gold used as sepia link');
checkContrast('gold/navy', colors.accent, colors.primary);
assert(contrastRatio(colors.accent, colors.bg) < 4.5, 'gold unexpectedly passes on cream');
checkContrast('ui text', colors.text, colors.bg);
checkContrast('ui muted', colors.muted, colors.bg);

for (const [name, swatch] of Object.entries(highlightColors)) {
  checkContrast(`highlight ${name}`, swatch.text, swatch.bg);
}
for (const [name, tone] of Object.entries(badgeTones)) {
  checkContrast(`badge ${name}`, tone.fg, tone.bg);
}

assert(readingColumnWidth(18, 'wide') === 540, 'wide measure');
assert(readingColumnWidth(18, 'normal') === 612, 'normal measure');
assert(readingColumnWidth(18, 'compact') === 675, 'compact measure');
assert(snapLineHeight(1.62) === 1.6, 'line height snap');
assert(snapLineHeight(9) === 1.7, 'line height clamp');
assert(snapMargin('nope') === 'normal', 'margin snap');
assert(snapFontScale(3) === 2, 'font max 200%');
assert(snapFontScale(0.1) === 0.8, 'font min');

assert(FEATURE_AI === false && FEATURE_ACCOUNT === false, 'features off');
assert(classifyOptionalFailure(false, { status: 402 }) === 'hidden', '402 hidden when AI off');
assert(classifyOptionalFailure(true, { status: 402 }) === 'unavailable', '402 badge when AI on');
assert(sentryEnabled(undefined) === false, 'sentry absent');
assert(sentryEnabled('YOUR_SENTRY_DSN') === false, 'sentry placeholder');
assert(sentryEnabled('https://example@o0.ingest.sentry.io/1') === true, 'sentry shape');

const gaps = licenseAudit();
assert(gaps.length === 0, `license audit: ${gaps.join(', ')}`);

const stored = mergeStored({
  lang: 'en',
  fontScale: 1.2,
  bookmarks: { taylor: [0, 2, 2] },
  searchHistory: ['undefined', 'bilan', 'bilan'],
  progress: { taylor: { page: 1, pages: 8, updatedAt: 5 } },
});
assert(stored.lang === 'en', 'lang kept');
assert(stored.lineHeight === 1.6 && stored.dyslexia === false && stored.readerMargin === 'normal', 'new defaults');
assert(stored.searchHistory.join() === 'bilan', `history cleaned ${stored.searchHistory}`);
assert(stored.bookmarks.taylor.join() === '0,2', 'bookmarks kept');
assert(stored.progress.taylor.page === 1, 'progress kept');

const docA: Doc = {
  id: 'a',
  title: 'A',
  author: 'Moi',
  lang: 'fr',
  category: 'other',
  license: { kind: 'owned', label: 'Je possède', statusCode: 'owned', date: 'à valider' },
  summary: '',
  paragraphs: ['texte'],
  userAdded: true,
};
const docB: Doc = { ...docA, id: 'b', title: 'B' };
const current = defaultAppState();
current.userDocs = [docA];
current.progress = { a: { page: 3, pages: 4, updatedAt: 20 } };
current.lang = 'ar';
const late = mergeLate(current, {
  userDocs: [docB],
  progress: { a: { page: 1, pages: 4, updatedAt: 2 }, b: { page: 0, pages: 2, updatedAt: 3 } },
  bookmarks: { b: [1] },
  searchHistory: ['undefined', 'swot'],
});
assert(late.lang === 'ar', 'session lang kept');
assert(late.userDocs.map((d) => d.id).sort().join() === 'a,b', 'docs union');
assert(late.progress.a.page === 3 && late.progress.b.page === 0, 'progress union');
assert(late.bookmarks.b[0] === 1, 'bookmark union');
assert(!late.searchHistory.includes('undefined'), 'late history');

void assertNoSaveBeforeSuccessfulLoad().then(() => {
  console.log('passe1 checks ok');
});

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * main : Promise.race de 2,5 s résout `null` si getItem est lent, marque l'app prête
 * avec l'état vide, puis le prochain setItem écrase la sauvegarde.
 * Ici, « Continuer hors ligne » puis set() ne doit rien écrire avant un getItem réussi,
 * et l'écriture d'après doit contenir les données déjà sur le disque.
 */
async function assertNoSaveBeforeSuccessfulLoad() {
  const saved = JSON.stringify({
    lang: 'fr',
    progress: { doc: { page: 4, pages: 10, updatedAt: 9 } },
    bookmarks: { doc: [1] },
    searchHistory: ['swot'],
    userDocs: [],
  });
  const writes: string[] = [];
  let gate: { resolve: (value: string | null) => void; reject: (error: unknown) => void } | null = null;
  const storage: KeyValueStorage = {
    getItem: () =>
      new Promise((resolve, reject) => {
        gate = { resolve, reject };
      }),
    setItem: async (_key, value) => {
      writes.push(value);
    },
    removeItem: async () => {
      writes.push('REMOVE');
    },
  };
  const store = createPersistedStore('92mba:v1', defaultAppState(), {
    storage,
    saveDelayMs: 0,
    merge: mergeStored,
    mergeLate,
  });
  store.continueOffline();
  store.set({ lang: 'en' });
  store.set((current) => ({ fontScale: current.fontScale }));
  await wait(40);
  assert(writes.join('|') === '', `setItem avant lecture réussie : ${writes.join(' | ')}`);

  gate!.resolve(saved);
  await wait(40);
  assert(store.get().progress.doc?.page === 4, 'progression disque perdue en mémoire');
  assert(store.get().bookmarks.doc?.[0] === 1, 'signet disque perdu en mémoire');
  assert(store.get().lang === 'en', 'préférence de session perdue');
  assert(writes.length >= 1, 'la fusion après lecture doit être enregistrée');
  for (const raw of writes) {
    assert(raw !== 'REMOVE', 'effacement inattendu');
    const parsed = JSON.parse(raw) as { progress?: { doc?: { page?: number } }; bookmarks?: { doc?: number[] }; lang?: string };
    assert(parsed.progress?.doc?.page === 4, `écrasement de la progression : ${raw}`);
    assert(parsed.bookmarks?.doc?.[0] === 1, `écrasement des signets : ${raw}`);
  }

  store.set({ fontScale: 1.2 });
  await wait(40);
  const last = JSON.parse(writes[writes.length - 1]) as { progress?: { doc?: { page?: number } }; lang?: string; fontScale?: number };
  assert(last.progress?.doc?.page === 4, 'save suivant sans la progression');
  assert(last.lang === 'en' && last.fontScale === 1.2, 'save suivant incomplet');

  const wiped: string[] = [];
  let wipeGate: ((value: string | null) => void) | null = null;
  const wipeStorage: KeyValueStorage = {
    getItem: () =>
      new Promise((resolve) => {
        wipeGate = resolve;
      }),
    setItem: async (_key, value) => {
      wiped.push(value);
    },
    removeItem: async () => {
      wiped.push('REMOVE');
    },
  };
  const resetting = createPersistedStore('92mba:v1', defaultAppState(), {
    storage: wipeStorage,
    saveDelayMs: 0,
    merge: mergeStored,
    mergeLate,
  });
  resetting.continueOffline();
  resetting.set({ lang: 'ar' });
  resetting.reset();
  await wait(40);
  assert(wiped.join('|') === '', `reset a écrit avant la lecture : ${wiped.join(' | ')}`);
  wipeGate!(saved);
  await wait(40);
  assert(wiped.join('|') === 'REMOVE', `reset doit effacer, pas remplacer par l'état vide : ${wiped.join(' | ')}`);
  assert(resetting.get().progress.doc === undefined, 'reset doit vider la progression en mémoire');

  const failed: string[] = [];
  let failGate: ((error: unknown) => void) | null = null;
  const failStorage: KeyValueStorage = {
    getItem: () =>
      new Promise((_resolve, reject) => {
        failGate = reject;
      }),
    setItem: async (_key, value) => {
      failed.push(value);
    },
    removeItem: async () => {
      failed.push('REMOVE');
    },
  };
  const offline = createPersistedStore('92mba:v1', defaultAppState(), {
    storage: failStorage,
    saveDelayMs: 0,
    merge: mergeStored,
    mergeLate,
  });
  offline.continueOffline();
  failGate!(new Error('storage down'));
  await wait(20);
  offline.set({ lang: 'en' });
  await wait(40);
  assert(failed.join('|') === '', `écriture après lecture ratée : ${failed.join(' | ')}`);

  const fresh: string[] = [];
  let freshGate: ((value: string | null) => void) | null = null;
  const freshStorage: KeyValueStorage = {
    getItem: () =>
      new Promise((resolve) => {
        freshGate = resolve;
      }),
    setItem: async (_key, value) => {
      fresh.push(value);
    },
    removeItem: async () => {
      fresh.push('REMOVE');
    },
  };
  const first = createPersistedStore('92mba:v1', defaultAppState(), {
    storage: freshStorage,
    saveDelayMs: 0,
    merge: mergeStored,
    mergeLate,
  });
  freshGate!(null);
  await wait(20);
  first.set({ lang: 'en' });
  await wait(40);
  assert(fresh.join('|') !== '' && fresh[0] !== 'REMOVE', 'première installation : l’enregistrement après lecture vide doit fonctionner');
  const created = JSON.parse(fresh[0] ?? '{}') as { lang?: string; progress?: Record<string, unknown> };
  assert(created.lang === 'en' && created.progress && Object.keys(created.progress).length === 0, 'première sauvegarde inattendue');
}
