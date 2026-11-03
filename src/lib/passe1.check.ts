import { highlightColors, badgeTones, colors, contrastRatio, readerThemes, readingColumnWidth, snapFontScale, snapLineHeight, snapMargin } from '../theme';
import { classifyOptionalFailure, FEATURE_ACCOUNT, FEATURE_AI, sentryEnabled } from './features';
import { licenseAudit } from './library';
import React, { act } from 'react';
import TestRenderer from 'react-test-renderer';
import { useReaderPage } from '../app/doc/useReaderPage';
import { createPersistedStore, unreadableStorageKey, type KeyValueStorage } from './persist';
import { commitSessionProgress, recordProgress } from './store';
import { defaultAppState, mergeLate, mergeStored, readingPageToKeep } from './stateMerge';
import type { Doc } from './library';
import { cleanHistory, fillTemplate, safePageIndex, sanitizeSearchQuery } from './textGuard';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const TAYLOR = 'taylor-scientific-management';

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
const late = mergeLate(
  current,
  {
    userDocs: [docB],
    progress: { a: { page: 1, pages: 4, updatedAt: 2 }, b: { page: 0, pages: 2, updatedAt: 3 } },
    bookmarks: { b: [1] },
    searchHistory: ['undefined', 'swot'],
  },
  new Set(['lang']),
);
assert(late.lang === 'ar', 'langue réellement changée conservée');
assert(late.userDocs.map((d) => d.id).sort().join() === 'a,b', 'docs union');
assert(late.progress.a.page === 3 && late.progress.b.page === 0, 'progress union');
assert(late.bookmarks.b[0] === 1, 'bookmark union');
assert(!late.searchHistory.includes('undefined'), 'late history');

scenarioA_preferencesNotReplacedByDefaults();
scenarioB_furthestPageWins();

void (async () => {
  await assertNoSaveBeforeSuccessfulLoad();
  await scenarioA_continueOfflineKeepsSavedPreferences();
  await scenarioB_pageZeroBeforeReadyDoesNotErase();
  await scenarioB2_nextBeforeReadyKeepsSavedPage();
  await scenarioC_unreadableStaysBlocked();
  await scenarioC4_resetWaitsForVerifiedCopy();
  await scenarioC_copyFailureRefusesReset();
  await scenarioC_copyMismatchRefusesReset();
  await scenarioC_datedSuffixKeepsPreviousCopy();
  await scenarioLinkOpensRequestedPage();
  await scenarioDeleteFailureIsNotUnverifiedCopy();
  await scenarioRereadCopyBeforeDelete();
  console.log('passe1 checks ok');
})();

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

function scenarioA_preferencesNotReplacedByDefaults() {
  const session = defaultAppState();
  session.progress = { [TAYLOR]: { page: 0, pages: 300, updatedAt: 9_999 } };
  const merged = mergeLate(session, {
    lang: 'ar',
    readerTheme: 'dark',
    fontScale: 1.4,
    progress: { [TAYLOR]: { page: 120, pages: 300, updatedAt: 1 } },
  });
  assert(merged.lang === 'ar', `a: langue ${merged.lang}`);
  assert(merged.readerTheme === 'dark', `a: thème ${merged.readerTheme}`);
  assert(merged.fontScale === 1.4, `a: corps ${merged.fontScale}`);
  assert(merged.progress[TAYLOR]?.page === 120, `a: page ${merged.progress[TAYLOR]?.page}`);

  const changed = defaultAppState();
  changed.lang = 'en';
  const kept = mergeLate(changed, { lang: 'ar', readerTheme: 'dark', fontScale: 1.4 }, new Set(['lang']));
  assert(kept.lang === 'en', 'a: langue touchée');
  assert(kept.readerTheme === 'dark' && kept.fontScale === 1.4, 'a: les autres préférences restent celles du cache');
}

function scenarioB_furthestPageWins() {
  const session = defaultAppState();
  session.progress = { [TAYLOR]: { page: 0, pages: 300, updatedAt: Date.now() } };
  const merged = mergeLate(session, {
    progress: { [TAYLOR]: { page: 120, pages: 300, updatedAt: 1 } },
  });
  assert(merged.progress[TAYLOR]?.page === 120, `b: page fusionnée ${merged.progress[TAYLOR]?.page}`);
}

async function scenarioA_continueOfflineKeepsSavedPreferences() {
  const saved = JSON.stringify({
    lang: 'ar',
    readerTheme: 'dark',
    fontScale: 1.4,
    progress: { [TAYLOR]: { page: 120, pages: 300, updatedAt: 4 } },
  });
  const writes: string[] = [];
  let open: ((value: string | null) => void) | null = null;
  const storage: KeyValueStorage = {
    getItem: () =>
      new Promise((resolve) => {
        open = resolve;
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
  store.set({ progress: { [TAYLOR]: { page: 0, pages: 300, updatedAt: Date.now() } } });
  await wait(30);
  open!(saved);
  await wait(40);
  const state = store.get();
  assert(state.lang === 'ar' && state.readerTheme === 'dark' && state.fontScale === 1.4, `a: session ${state.lang}/${state.readerTheme}/${state.fontScale}`);
  assert(state.progress[TAYLOR]?.page === 120, `a: progression ${state.progress[TAYLOR]?.page}`);
  const written = writes.filter((item) => item !== 'REMOVE').map((item) => JSON.parse(item) as { lang?: string; readerTheme?: string; fontScale?: number; progress?: Record<string, { page?: number }> });
  assert(written.length >= 1, 'a: la sauvegarde après fusion n’a pas eu lieu');
  for (const item of written) {
    assert(item.lang === 'ar' && item.readerTheme === 'dark' && item.fontScale === 1.4, `a: écriture ${JSON.stringify(item)}`);
    assert(item.progress?.[TAYLOR]?.page === 120, `a: écriture page ${item.progress?.[TAYLOR]?.page}`);
  }
}

async function scenarioB_pageZeroBeforeReadyDoesNotErase() {
  const saved = JSON.stringify({
    lang: 'ar',
    readerTheme: 'dark',
    fontScale: 1.4,
    progress: { [TAYLOR]: { page: 120, pages: 300, updatedAt: 4 } },
  });
  let open: ((value: string | null) => void) | null = null;
  const storage: KeyValueStorage = {
    getItem: () =>
      new Promise((resolve) => {
        open = resolve;
      }),
    setItem: async () => undefined,
    removeItem: async () => undefined,
  };
  const store = createPersistedStore('92mba:v1', defaultAppState(), {
    storage,
    saveDelayMs: 0,
    merge: mergeStored,
    mergeLate,
  });
  store.continueOffline();
  assert(store.isStorageReady() === false, 'b: storage pas prêt');
  recordProgress(store, TAYLOR, 0, 300);
  assert(store.get().progress[TAYLOR] === undefined, 'b: page 0 enregistrée avant la lecture');
  open!(saved);
  await wait(40);
  assert(store.isStorageReady() === true, 'b: lecture terminée');
  assert(store.get().progress[TAYLOR]?.page === 120, `b: Taylor ${store.get().progress[TAYLOR]?.page}`);
  recordProgress(store, TAYLOR, 121, 300);
  assert(store.get().progress[TAYLOR]?.page === 121, 'b: avance réelle après la lecture');
}

async function scenarioC_unreadableStaysBlocked() {
  const raw = '{"lang":"ar","readerTheme":"dark",';
  const disk = new Map<string, string>([['92mba:v1', raw]]);
  const writes: { key: string; value: string }[] = [];
  const storage: KeyValueStorage = {
    getItem: async (key) => disk.get(key) ?? null,
    setItem: async (key, value) => {
      writes.push({ key, value });
      disk.set(key, value);
    },
    removeItem: async (key) => {
      disk.delete(key);
      writes.push({ key, value: 'REMOVE' });
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
  await wait(40);
  assert(store.getWarning() === 'unreadable', `c: avertissement ${store.getWarning()}`);
  assert(store.isStorageReady() === false, 'c: écriture débloquée sur un JSON illisible');
  assert(disk.get('92mba:v1') === raw, 'c: clé principale écrasée');
  assert(disk.get(unreadableStorageKey('92mba:v1')) === raw, 'c: copie brute absente');
  assert(writes.every((item) => item.key === unreadableStorageKey('92mba:v1')), `c: écritures ${JSON.stringify(writes)}`);
  store.set({ fontScale: 1.4, readerTheme: 'light' });
  await wait(40);
  assert(disk.get('92mba:v1') === raw, 'c: première modification après coup a écrasé le cache');
  assert(writes.filter((item) => item.key === '92mba:v1').length === 0, 'c: setItem sur la clé principale');
}

async function scenarioB2_nextBeforeReadyKeepsSavedPage() {
  assert(readingPageToKeep(120, 1, true) === 120, 'b2: page 1 remplace 120');
  assert(readingPageToKeep(120, 121, true) === 121, 'b2: une avance réelle doit compter');
  assert(readingPageToKeep(120, 0, false) === 120, 'b2: page automatique 0');
  const saved = JSON.stringify({
    progress: { [TAYLOR]: { page: 120, pages: 300, updatedAt: 4 } },
  });
  const storage: KeyValueStorage = {
    getItem: async () => saved,
    setItem: async () => undefined,
    removeItem: async () => undefined,
  };
  const store = createPersistedStore('92mba:v1', defaultAppState(), {
    storage,
    saveDelayMs: 0,
    merge: mergeStored,
    mergeLate,
  });
  await wait(30);
  const kept = commitSessionProgress(store, TAYLOR, 1, 300, true);
  assert(kept === 120, `b2: commit ${kept}`);
  assert(store.get().progress[TAYLOR]?.page === 120, `b2: stockée ${store.get().progress[TAYLOR]?.page}`);
  const ahead = commitSessionProgress(store, TAYLOR, 121, 300, true);
  assert(ahead === 121 && store.get().progress[TAYLOR]?.page === 121, 'b2: page suivante après lecture');
}

async function scenarioC4_resetWaitsForVerifiedCopy() {
  const raw = '{"lang":"ar"';
  const disk = new Map<string, string>([['92mba:v1', raw]]);
  const ops: string[] = [];
  let release: ((value: string) => void) | null = null;
  let mainReads = 0;
  const storage: KeyValueStorage = {
    getItem: (key) => {
      ops.push(`get:${key}`);
      if (key === '92mba:v1' && mainReads === 0) {
        mainReads += 1;
        return new Promise((resolve) => {
          release = resolve;
        });
      }
      return Promise.resolve(disk.get(key) ?? null);
    },
    setItem: async (key, value) => {
      ops.push(`set:${key}`);
      disk.set(key, value);
    },
    removeItem: async (key) => {
      ops.push(`rm:${key}`);
      disk.delete(key);
    },
  };
  const store = createPersistedStore('92mba:v1', defaultAppState(), {
    storage,
    saveDelayMs: 0,
    merge: mergeStored,
    mergeLate,
  });
  store.continueOffline();
  assert(store.reset() === 'pending', 'c4: reset trop tôt');
  await wait(30);
  assert(disk.get('92mba:v1') === raw, 'c4: original supprimé avant analyse');
  assert(!ops.includes('rm:92mba:v1'), `c4: rm prématuré ${ops.join(' ')}`);
  release!(raw);
  await wait(40);
  const copy = unreadableStorageKey('92mba:v1');
  assert(disk.get(copy) === raw, 'c4: copie non vérifiée');
  assert(!disk.has('92mba:v1'), 'c4: original encore présent après copie identique');
  const setAt = ops.indexOf(`set:${copy}`);
  const readBack = ops.findIndex((op, index) => op === `get:${copy}` && index > setAt);
  const rmAt = ops.indexOf('rm:92mba:v1');
  assert(setAt >= 0 && readBack > setAt && rmAt > readBack, `c4: ordre ${ops.join(' ')}`);
  assert(store.getResetResult() === 'wiped', `c4: résultat ${store.getResetResult()}`);
}

async function scenarioC_copyFailureRefusesReset() {
  const raw = '{"lang":"ar"';
  const disk = new Map<string, string>([['92mba:v1', raw]]);
  const ops: string[] = [];
  const storage: KeyValueStorage = {
    getItem: async (key) => disk.get(key) ?? null,
    setItem: async (key) => {
      ops.push(`set:${key}`);
      throw new Error('disk full');
    },
    removeItem: async (key) => {
      ops.push(`rm:${key}`);
      disk.delete(key);
    },
  };
  const store = createPersistedStore('92mba:v1', defaultAppState(), {
    storage,
    saveDelayMs: 0,
    merge: mergeStored,
    mergeLate,
  });
  store.continueOffline();
  await wait(30);
  assert(store.getWarning() === 'copy-failed', `copie ${store.getWarning()}`);
  assert(disk.get('92mba:v1') === raw, 'échec copie : original modifié');
  assert(store.reset() === 'refused', 'reset accepté sans copie');
  await wait(20);
  assert(disk.get('92mba:v1') === raw, 'reset a modifié l’original');
  assert(!ops.some((op) => op.startsWith('rm:')), `rm malgré l’échec ${ops.join(' ')}`);
}

async function scenarioC_copyMismatchRefusesReset() {
  const raw = '{"lang":"ar"';
  const disk = new Map<string, string>([['92mba:v1', raw]]);
  const copy = unreadableStorageKey('92mba:v1');
  let copyReads = 0;
  const storage: KeyValueStorage = {
    getItem: async (key) => {
      if (key === copy) {
        copyReads += 1;
        return copyReads === 1 ? null : `${raw}!`;
      }
      return disk.get(key) ?? null;
    },
    setItem: async (key, value) => {
      disk.set(key, value);
    },
    removeItem: async (key) => {
      disk.delete(key);
    },
  };
  const store = createPersistedStore('92mba:v1', defaultAppState(), {
    storage,
    saveDelayMs: 0,
    merge: mergeStored,
    mergeLate,
  });
  store.continueOffline();
  await wait(30);
  assert(store.getWarning() === 'copy-failed', `altération ${store.getWarning()}`);
  assert(store.isCopyVerified() === false, 'copie altérée considérée vérifiée');
  assert(disk.get('92mba:v1') === raw, 'altération : original modifié');
  assert(store.reset() === 'refused', 'reset après copie différente');
  await wait(20);
  assert(disk.get('92mba:v1') === raw, 'reset a effacé l’original non copié');
}

async function scenarioC_datedSuffixKeepsPreviousCopy() {
  const raw = '{"lang":"ar"';
  const previous = 'ancienne-copie-differente';
  const copy = unreadableStorageKey('92mba:v1');
  const disk = new Map<string, string>([
    ['92mba:v1', raw],
    [copy, previous],
  ]);
  const storage: KeyValueStorage = {
    getItem: async (key) => disk.get(key) ?? null,
    setItem: async (key, value) => {
      disk.set(key, value);
    },
    removeItem: async (key) => {
      disk.delete(key);
    },
  };
  const store = createPersistedStore('92mba:v1', defaultAppState(), {
    storage,
    saveDelayMs: 0,
    merge: mergeStored,
    mergeLate,
    now: () => '2026-11-02T22:08:00.000Z',
  });
  store.continueOffline();
  await wait(30);
  const dated = `${copy}:2026-11-02T22-08-00-000Z`;
  assert(disk.get(copy) === previous, 'l’ancienne copie a été écrasée');
  assert(disk.get(dated) === raw, `suffixe daté absent (${[...disk.keys()].join(', ')})`);
  assert(disk.get('92mba:v1') === raw, 'original modifié en ajoutant un suffixe');
  assert(store.getWarning() === 'unreadable' && store.isCopyVerified(), 'copie datée non vérifiée');
}

async function scenarioLinkOpensRequestedPage() {
  const linkShown = { page: -1 };
  const commits: number[] = [];
  function Probe(props: {
    ready: boolean;
    saved?: number;
    pageParam?: unknown;
    sink: number[];
    display: { page: number };
    onGo?: (go: (page: number) => void) => void;
  }) {
    const view = useReaderPage({
      docId: TAYLOR,
      pageParam: props.pageParam,
      savedPage: props.saved,
      pageCount: 300,
      storageReady: props.ready,
      onCommit: (next) => props.sink.push(next),
    });
    props.display.page = view.page;
    props.onGo?.(view.go);
    return null;
  }
  await act(async () => {
    TestRenderer.create(React.createElement(Probe, { ready: true, saved: 120, pageParam: '5', sink: commits, display: linkShown }));
  });
  assert(linkShown.page === 5, `lien vers la page 5 alors que la page enregistrée est 120 : affiché ${linkShown.page}`);
  assert(commits[commits.length - 1] === 5, `lien enregistré ${commits.join(',')}`);
  assert(!commits.includes(120), `le max a remplacé le lien : ${commits.join(',')}`);

  const nextShown = { page: -1 };
  const early: number[] = [];
  let go = (_page: number) => {};
  const holder: { tree?: TestRenderer.ReactTestRenderer } = {};
  await act(async () => {
    holder.tree = TestRenderer.create(
      React.createElement(Probe, {
        ready: false,
        pageParam: undefined,
        sink: early,
        display: nextShown,
        onGo: (next) => {
          go = next;
        },
      }),
    );
  });
  await act(async () => {
    go(1);
  });
  await act(async () => {
    holder.tree!.update(
      React.createElement(Probe, {
        ready: true,
        saved: 120,
        pageParam: undefined,
        sink: early,
        display: nextShown,
        onGo: (next) => {
          go = next;
        },
      }),
    );
  });
  assert(nextShown.page === 120, `suivant avant la lecture : affiché ${nextShown.page}`);
  assert(!early.includes(1), `page 1 écrite avant le max : ${early.join(',')}`);
  assert(early[early.length - 1] === 120, `page conservée ${early.join(',')}`);
}

async function scenarioDeleteFailureIsNotUnverifiedCopy() {
  const raw = '{"lang":"ar"';
  const disk = new Map<string, string>([['92mba:v1', raw]]);
  const copy = unreadableStorageKey('92mba:v1');
  const ops: string[] = [];
  const storage: KeyValueStorage = {
    getItem: async (key) => {
      ops.push(`get:${key}`);
      return disk.get(key) ?? null;
    },
    setItem: async (key, value) => {
      ops.push(`set:${key}`);
      disk.set(key, value);
    },
    removeItem: async (key) => {
      ops.push(`rm:${key}`);
      throw new Error('remove failed');
    },
  };
  const store = createPersistedStore('92mba:v1', defaultAppState(), {
    storage,
    saveDelayMs: 0,
    merge: mergeStored,
    mergeLate,
  });
  store.continueOffline();
  await wait(40);
  assert(store.isCopyVerified() && store.getWarning() === 'unreadable', 'suppression : copie pas prête');
  const mark = ops.length;
  assert(store.reset() === 'pending', 'suppression : reset');
  await wait(40);
  assert(store.getWarning() === 'delete-failed', `message ${store.getWarning()}`);
  assert(store.getResetResult() === 'delete-failed', `résultat ${store.getResetResult()}`);
  assert(disk.get('92mba:v1') === raw, 'échec de suppression : original disparu');
  const tail = ops.slice(mark);
  const reread = tail.indexOf(`get:${copy}`);
  const rmAt = tail.indexOf('rm:92mba:v1');
  assert(reread >= 0 && rmAt > reread, `relecture avant suppression manquante : ${tail.join(' ')}`);
}

async function scenarioRereadCopyBeforeDelete() {
  const raw = '{"lang":"ar"';
  const disk = new Map<string, string>([['92mba:v1', raw]]);
  const copy = unreadableStorageKey('92mba:v1');
  let copyReads = 0;
  const storage: KeyValueStorage = {
    getItem: async (key) => {
      if (key === copy) {
        copyReads += 1;
        if (copyReads === 1) return null;
        if (copyReads === 2) return disk.get(key) ?? null;
        return `${raw}#`;
      }
      return disk.get(key) ?? null;
    },
    setItem: async (key, value) => {
      disk.set(key, value);
    },
    removeItem: async (key) => {
      disk.delete(key);
    },
  };
  const store = createPersistedStore('92mba:v1', defaultAppState(), {
    storage,
    saveDelayMs: 0,
    merge: mergeStored,
    mergeLate,
  });
  store.continueOffline();
  await wait(40);
  assert(store.getWarning() === 'unreadable' && store.isCopyVerified(), 'relecture : copie initiale');
  store.reset();
  await wait(40);
  assert(disk.has('92mba:v1'), 'original effacé alors que la copie a changé');
  assert(disk.get('92mba:v1') === raw, 'original altéré');
  assert(store.getWarning() === 'copy-failed', `relecture ${store.getWarning()}`);
  assert(store.getResetResult() === 'refused', `relecture résultat ${store.getResetResult()}`);
}
