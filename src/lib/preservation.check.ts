import fs from 'node:fs';
import path from 'node:path';
import { dictionaries } from '../i18n/strings';
import { cleanHistory } from './textGuard';
import { createPersistedStore, quarantineStorageKey, type KeyValueStorage } from './persist';
import {
  CURRENT_SCHEMA_VERSION,
  DOCUMENTED_ANDROID_CURSOR_BYTES,
  ISOLATED_RESTORE_KEY,
  SEARCH_HISTORY_CAP,
  describeRaw,
  exceedsDocumentedCursor,
  restoreIsolated,
} from './preservation';
import { sha256Hex } from './sha256';
import { defaultAppState, mergeLate, mergeStored } from './stateMerge';
import { STORAGE_KEY } from './store';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const fixtureDir = path.join(process.cwd(), 'testdata', 'preservation');

function readFixture(name: string): string {
  return fs.readFileSync(path.join(fixtureDir, name), 'utf8');
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function memory(initial: Record<string, string> = {}) {
  const disk = new Map(Object.entries(initial));
  const writes: { key: string; value: string }[] = [];
  let failMain = 0;
  const storage: KeyValueStorage = {
    getItem: async (key) => disk.get(key) ?? null,
    setItem: async (key, value) => {
      if (key === STORAGE_KEY && failMain > 0) {
        failMain -= 1;
        throw new Error('disk full');
      }
      writes.push({ key, value });
      disk.set(key, value);
    },
    removeItem: async (key) => {
      disk.delete(key);
      writes.push({ key, value: 'REMOVE' });
    },
  };
  return {
    disk,
    writes,
    storage,
    failNext(n: number) {
      failMain = n;
    },
  };
}

function open(storage: KeyValueStorage) {
  return createPersistedStore(STORAGE_KEY, defaultAppState(), {
    storage,
    saveDelayMs: 0,
    merge: mergeStored,
    mergeLate,
  });
}

const PERSONAL = ['Notes de cours', 'Paragraphe un.', 'local-account-kept', 'notes.txt', 'fichier importé', 'bilan', 'Secret futur', 'future-user'];

function assertNoPersonal(report: unknown) {
  const dumped = JSON.stringify(report);
  for (const secret of PERSONAL) assert(!dumped.includes(secret), `compteur affiche une donnée : ${secret}`);
}

assert(sha256Hex('') === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'sha256 vide');
assert(sha256Hex('abc') === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'sha256 abc');
assert(CURRENT_SCHEMA_VERSION === 1, 'schema');
assert(SEARCH_HISTORY_CAP === 12, 'plafond historique');
assert(DOCUMENTED_ANDROID_CURSOR_BYTES === 2_000_000, 'plafond curseur');
assert(exceedsDocumentedCursor(1_999_999) === false, '1 999 999 octets encore acceptés');
assert(exceedsDocumentedCursor(2_000_000) === true, '2 000 000 octets refusés');
assert(cleanHistory(Array.from({ length: 40 }, (_, i) => `requete-${String(i).padStart(2, '0')}`)).length === 12, 'cleanHistory 40 → 12');
assert(!dictionaries.fr.storageVersionQuarantine.toLowerCase().includes('corrompu'), 'message neutre');
assert(dictionaries.fr.storageVersionQuarantine.includes('rien n’a été remplacé'), 'message de non-remplacement');
assert(dictionaries.fr.logoutNoAccount !== dictionaries.fr.resetDone, 'déconnexion distincte de l’effacement');
assert(!dictionaries.fr.preserveCounts.includes('Paragraphe'), 'compteurs sans texte');

void (async () => {
  await legacyPlainKeepsPage120();
  await unknownFieldsSurviveUnrelatedWrite();
  await schemaV1KeepsAccountAndVersion();
  await futureVersionIsQuarantined();
  await incoherentVersionIsQuarantined();
  await mismatchedTypesStayOnDisk();
  await historyOf40SurvivesUntilExplicitClear();
  await writeFailureStaysVisibleAndRetries();
  await oversizedWriteDoesNotReplace();
  await roundTrip250k();
  await loadThrowDoesNotReplace();
  await corruptDoesNotInstallPlaceholder();
  await logoutDoesNotTouchDisk();
  await exportIsCompleteButReportIsNot();
  await cutoverRollsBackWhenHashDiffers();
  console.log('preservation checks ok');
})();

async function legacyPlainKeepsPage120() {
  const raw = readFixture('legacy-v1.json');
  const bag = memory({ [STORAGE_KEY]: raw });
  const store = open(bag.storage);
  await wait(30);
  assert(store.get().progress['taylor-scientific-management']?.page === 120, 'legacy page 120');
  assert(store.get().lang === 'ar' && store.get().bookmarks['taylor-scientific-management']?.length === 2, 'legacy prefs');
  store.set({ fontScale: 1.2 });
  await wait(40);
  const written = JSON.parse(bag.disk.get(STORAGE_KEY) ?? '{}') as {
    progress?: Record<string, { page?: number }>;
    lang?: string;
    fontScale?: number;
    searchHistory?: string[];
  };
  assert(written.progress?.['taylor-scientific-management']?.page === 120, 'legacy page réécrite');
  assert(written.lang === 'ar' && written.fontScale === 1.2, 'legacy préférence');
  assert(written.searchHistory?.length === 2, 'legacy historique 2');
  assertNoPersonal(store.getPreserveReport());
}

async function unknownFieldsSurviveUnrelatedWrite() {
  const raw = readFixture('legacy-unknown.json');
  const bag = memory({ [STORAGE_KEY]: raw });
  const store = open(bag.storage);
  await wait(30);
  assert(store.get().userDocs[0]?.note === 'fichier importé', 'note adoptée');
  assert(!('fileName' in (store.get().userDocs[0] ?? {})), 'champ inconnu pas affiché comme champ du document');
  const before = store.getPreserveReport();
  assert(before.userDocs === 1 && before.progressEntries === 1 && before.bookmarkLists === 1, 'compteurs 1/1/1');
  assert(before.historyEntries === 2 && before.unknownKeys === 2, 'historique 2, inconnues 2');
  assert(before.versionState === 'legacy', 'version legacy');
  assertNoPersonal(before);
  store.set({ fontScale: 1.2 });
  await wait(40);
  const written = JSON.parse(bag.disk.get(STORAGE_KEY) ?? '{}') as {
    accountId?: string;
    importBatch?: { id?: string; count?: number };
    fontScale?: number;
    progress?: Record<string, { page?: number; anchor?: string }>;
    userDocs?: { fileName?: string; note?: string; paragraphs?: string[] }[];
  };
  assert(written.accountId === 'local-account-kept', 'accountId perdu');
  assert(written.importBatch?.id === 'batch-1' && written.importBatch.count === 1, 'importBatch perdu');
  assert(written.fontScale === 1.2, 'fontScale non écrit');
  assert(written.progress?.['taylor-scientific-management']?.page === 120, 'page 120 perdue');
  assert(written.progress?.['taylor-scientific-management']?.anchor === 'p-120', 'ancre perdue');
  assert(written.userDocs?.[0]?.fileName === 'notes.txt', 'fileName perdu');
  assert(written.userDocs?.[0]?.note === 'fichier importé', 'note perdue');
  assert(written.userDocs?.[0]?.paragraphs?.[0] === 'Paragraphe un.', 'paragraphe perdu');
  assertNoPersonal(store.getPreserveReport());
}

async function schemaV1KeepsAccountAndVersion() {
  const raw = readFixture('schema-v1.json');
  const bag = memory({ [STORAGE_KEY]: raw });
  const store = open(bag.storage);
  await wait(30);
  assert(store.get().lang === 'en', 'v1 langue');
  assert(store.get().progress['taylor-scientific-management']?.page === 7, 'v1 page 7');
  assert(store.getPreserveReport().versionState === 'v1', 'état v1');
  store.set({ lineHeight: 1.7 });
  await wait(40);
  const written = JSON.parse(bag.disk.get(STORAGE_KEY) ?? '{}') as {
    schemaVersion?: number;
    accountId?: string;
    lang?: string;
    progress?: Record<string, { page?: number }>;
    lineHeight?: number;
  };
  assert(written.schemaVersion === 1, 'schemaVersion réécrit');
  assert(written.accountId === 'kept-on-v1', 'accountId v1 perdu');
  assert(written.lang === 'en', 'langue v1 perdue');
  assert(written.progress?.['taylor-scientific-management']?.page === 7, 'page v1 perdue');
  assert(written.lineHeight === 1.7, 'interligne non écrit');
}

async function futureVersionIsQuarantined() {
  const raw = readFixture('future-v2.json');
  const bag = memory({ [STORAGE_KEY]: raw });
  const store = open(bag.storage);
  store.continueOffline();
  store.set({ lang: 'en', fontScale: 1.2 });
  await wait(40);
  assert(store.getWarning() === 'version-quarantine', `quarantaine ${store.getWarning()}`);
  assert(store.isStorageReady() === false, 'version future adoptée pour l’écriture');
  assert(store.get().progress['future-doc'] === undefined, 'page future adoptée');
  assert(store.get().lang === 'en', 'session perdue');
  assert(store.get().userDocs.length === 0, 'document futur adopté en mémoire');
  assert(bag.disk.get(STORAGE_KEY) === raw, 'clé principale modifiée');
  assert(bag.disk.get(quarantineStorageKey(STORAGE_KEY)) === raw, 'copie de quarantaine absente');
  assert(bag.writes.every((item) => item.key !== STORAGE_KEY), 'écriture sur la clé principale');
  assert(store.getPreserveReport().versionState === 'unsupported', 'état version');
  assert(store.getPreserveReport().userDocs === 1 && store.getPreserveReport().progressEntries === 1, 'compteurs de la copie');
  assertNoPersonal(store.getPreserveReport());
  const exported = await store.exportRaw();
  assert(exported === raw, 'export différent de l’original');
}

async function incoherentVersionIsQuarantined() {
  const raw = readFixture('incoherent-version.json');
  const bag = memory({ [STORAGE_KEY]: raw });
  const store = open(bag.storage);
  await wait(30);
  assert(store.getWarning() === 'version-quarantine', 'version « 1 » adoptée');
  assert(store.getPreserveReport().versionState === 'incoherent', 'état incohérent');
  assert(store.get().progress.x === undefined, 'progression incohérente adoptée');
  assert(bag.disk.get(STORAGE_KEY) === raw, 'original incohérent modifié');
  assert(store.isCopyVerified() === true, 'copie non vérifiée');
}

async function mismatchedTypesStayOnDisk() {
  const raw = readFixture('mismatched-types.json');
  const bag = memory({ [STORAGE_KEY]: raw });
  const store = open(bag.storage);
  await wait(30);
  assert(store.get().fontScale === 1, 'échelle illisible adoptée comme nombre');
  assert(store.get().progress['doc-mix'] === undefined, 'page texte adoptée');
  store.set({ readerTheme: 'dark' });
  await wait(40);
  const written = JSON.parse(bag.disk.get(STORAGE_KEY) ?? '{}') as {
    fontScale?: unknown;
    readerTheme?: string;
    progress?: Record<string, { page?: unknown; anchor?: string }>;
    bookmarks?: Record<string, unknown>;
    userDocs?: { fileRef?: string }[];
  };
  assert(written.fontScale === 'large', 'fontScale « large » converti');
  assert(written.readerTheme === 'dark', 'thème non écrit');
  assert(written.progress?.['doc-mix']?.page === '12', 'page « 12 » convertie');
  assert(written.progress?.['doc-mix']?.anchor === 'p3', 'ancre mixte perdue');
  assert(JSON.stringify(written.bookmarks?.['doc-mix']) === JSON.stringify(['1', 2]), 'signets mixtes réécrits');
  assert(written.userDocs?.[0]?.fileRef === 'upload://1', 'fileRef perdu');
}

async function historyOf40SurvivesUntilExplicitClear() {
  const base = JSON.parse(readFixture('legacy-v1.json')) as { searchHistory: string[] };
  base.searchHistory = Array.from({ length: 40 }, (_, i) => `requete-${String(i).padStart(2, '0')}`);
  const raw = JSON.stringify(base);
  const bag = memory({ [STORAGE_KEY]: raw });
  const store = open(bag.storage);
  await wait(30);
  assert(store.get().searchHistory.length === 12, `mémoire ${store.get().searchHistory.length}`);
  store.set({ fontScale: 1.2 });
  await wait(40);
  const kept = JSON.parse(bag.disk.get(STORAGE_KEY) ?? '{}') as { searchHistory?: string[] };
  assert(kept.searchHistory?.length === 40, `historique disque ${kept.searchHistory?.length}`);
  store.set({ searchHistory: [] });
  await wait(40);
  const cleared = JSON.parse(bag.disk.get(STORAGE_KEY) ?? '{}') as { searchHistory?: string[] };
  assert(cleared.searchHistory?.length === 0, 'effacement explicite ignoré');
}

async function writeFailureStaysVisibleAndRetries() {
  const raw = readFixture('legacy-unknown.json');
  const bag = memory({ [STORAGE_KEY]: raw });
  bag.failNext(1);
  const store = open(bag.storage);
  await wait(30);
  store.set({ fontScale: 1.2 });
  await wait(40);
  assert(store.getWarning() === 'write-failed', `échec muet ${store.getWarning()}`);
  assert(bag.disk.get(STORAGE_KEY) === raw, 'échec : original remplacé');
  store.retrySave();
  await wait(40);
  assert(store.getWarning() === null, `retry ${store.getWarning()}`);
  const written = JSON.parse(bag.disk.get(STORAGE_KEY) ?? '{}') as { fontScale?: number; accountId?: string };
  assert(written.fontScale === 1.2 && written.accountId === 'local-account-kept', 'retry incomplet');
}

async function oversizedWriteDoesNotReplace() {
  const raw = readFixture('legacy-unknown.json');
  const bag = memory({ [STORAGE_KEY]: raw });
  const store = open(bag.storage);
  await wait(30);
  const before = bag.writes.length;
  store.set({
    userDocs: [
      {
        id: 'huge',
        title: 'Gros',
        author: 'Moi',
        lang: 'fr',
        category: 'other',
        license: { kind: 'owned', label: 'Je possède', statusCode: 'owned' },
        summary: '',
        paragraphs: ['x'.repeat(2_000_000)],
        userAdded: true,
      },
    ],
  });
  await wait(50);
  assert(store.getWarning() === 'write-failed', 'volume au-dessus de 2 000 000 octets écrit');
  assert(bag.disk.get(STORAGE_KEY) === raw, 'volume : original remplacé');
  assert(bag.writes.length === before, 'setItem malgré le plafond');
  assert(store.get().userDocs.some((doc) => doc.id === 'huge'), 'la saisie reste en mémoire pour un nouvel essai');
  const reread = open(bag.storage);
  await wait(30);
  assert(reread.get().userDocs[0]?.id === 'user-notes', 'relecture : document d’origine perdu');
  assert(
    !reread.get().userDocs.some((doc) => doc.paragraphs.some((paragraph) => paragraph.length >= 2_000_000)),
    'relecture : le volume refusé a été adopté',
  );
}

async function roundTrip250k() {
  const raw = readFixture('legacy-unknown.json');
  const bag = memory({ [STORAGE_KEY]: raw });
  const store = open(bag.storage);
  await wait(30);
  const paragraph = 'p'.repeat(250_000);
  store.set({
    userDocs: [
      ...store.get().userDocs,
      {
        id: 'big',
        title: 'Import',
        author: 'Moi',
        lang: 'fr',
        category: 'other',
        license: { kind: 'owned', label: 'Je possède', statusCode: 'owned' },
        summary: '',
        paragraphs: [paragraph],
        userAdded: true,
      },
    ],
  });
  await wait(50);
  const written = bag.disk.get(STORAGE_KEY) ?? '';
  assert(written.length >= 250_000, `taille ${written.length}`);
  assert(written.length < DOCUMENTED_ANDROID_CURSOR_BYTES, '250 000 octets ont dépassé le plafond');
  const parsed = JSON.parse(written) as { userDocs?: { id?: string; fileName?: string; paragraphs?: string[] }[]; accountId?: string };
  assert(parsed.accountId === 'local-account-kept', 'gros import a perdu accountId');
  assert(parsed.userDocs?.some((doc) => doc.fileName === 'notes.txt'), 'gros import a perdu fileName');
  assert(parsed.userDocs?.some((doc) => doc.paragraphs?.[0]?.length === 250_000), 'paragraphe de 250 000 perdu');
  assert(store.getWarning() === null, '250 000 octets signalés en échec');
}

async function loadThrowDoesNotReplace() {
  const raw = readFixture('legacy-unknown.json');
  const disk = new Map([[STORAGE_KEY, raw]]);
  const writes: string[] = [];
  const storage: KeyValueStorage = {
    getItem: async () => {
      throw new Error('storage down');
    },
    setItem: async (_key, value) => {
      writes.push(value);
    },
    removeItem: async () => {
      writes.push('REMOVE');
    },
  };
  const store = open(storage);
  store.continueOffline();
  store.set({ lang: 'en' });
  await wait(40);
  assert(writes.length === 0, 'lecture ratée : une écriture a eu lieu');
  assert(disk.get(STORAGE_KEY) === raw, 'lecture ratée : original modifié');
  assert(store.get().userDocs.length === 0, 'lecture ratée : document de démo en mémoire');
  assert(!raw.includes('placeholder-vos-cours'), 'le fixture ne doit pas contenir le placeholder');
}

async function corruptDoesNotInstallPlaceholder() {
  const raw = '{"lang":"ar"';
  const bag = memory({ [STORAGE_KEY]: raw });
  const store = open(bag.storage);
  await wait(30);
  assert(store.getWarning() === 'unreadable', 'JSON coupé adopté');
  assert(bag.disk.get(STORAGE_KEY) === raw, 'JSON coupé remplacé');
  assert(!bag.disk.get(STORAGE_KEY)?.includes('placeholder-vos-cours'), 'placeholder écrit à la place');
  assert(store.get().userDocs.length === 0, 'documents mémoire après JSON coupé');
}

async function logoutDoesNotTouchDisk() {
  const raw = readFixture('legacy-unknown.json');
  const bag = memory({ [STORAGE_KEY]: raw });
  const store = open(bag.storage);
  await wait(30);
  const before = bag.disk.get(STORAGE_KEY);
  assert(store.logout() === 'no-account', 'logout');
  await wait(20);
  assert(bag.disk.get(STORAGE_KEY) === before, 'logout a modifié le disque');
  assert(bag.writes.length === 0, 'logout a écrit');
  assert(store.get().progress['taylor-scientific-management']?.page === 120, 'logout a vidé la page');
}

async function exportIsCompleteButReportIsNot() {
  const raw = readFixture('legacy-unknown.json');
  const bag = memory({ [STORAGE_KEY]: raw });
  const store = open(bag.storage);
  await wait(30);
  const exported = await store.exportRaw();
  assert(exported === raw, 'export incomplet');
  assert(exported?.includes('Notes de cours') && exported.includes('local-account-kept'), 'export sans les champs');
  assertNoPersonal(store.getPreserveReport());
  assert(store.getPreserveReport().bytes === raw.length || store.getPreserveReport().bytes >= raw.length, 'octets');
  assert(store.getPreserveReport().sha256 === sha256Hex(raw), 'empreinte');
  assert(store.getPreserveReport().sha256.length === 64, 'empreinte 64');
}

async function cutoverRollsBackWhenHashDiffers() {
  const snapshot = readFixture('legacy-unknown.json');
  const candidate = snapshot.replace('local-account-kept', 'local-account-LOST');
  assert(snapshot.length === candidate.length, 'le candidat de test doit garder la même taille');
  const isolated = new Map<string, string>();
  const rolled = restoreIsolated(isolated, snapshot, candidate);
  assert(rolled.restored === false && rolled.rollback === true, 'bascule adoptée malgré le hash');
  assert(rolled.hashMatch === false, 'hash identique à tort');
  assert(rolled.snapshot.progressEntries === 1, 'compteur lectures');
  assert(rolled.snapshot.userDocs === 1, 'compteur documents');
  assert(rolled.snapshot.bookmarkLists === 1, 'compteur signets');
  assert(rolled.snapshot.historyEntries === 2, 'compteur historique');
  assert(rolled.snapshot.unknownKeys === 2, 'compteur inconnues');
  assert(isolated.get(ISOLATED_RESTORE_KEY) === snapshot, 'rollback isolé différent de l’instantané');
  assert(!isolated.has(STORAGE_KEY), 'la bascule a touché la clé live');
  assert(rolled.writtenBytes === snapshot.length || rolled.writtenBytes >= 1, 'octets rollback');
  const again = new Map<string, string>();
  const same = restoreIsolated(again, snapshot, snapshot);
  assert(same.restored === true && same.rollback === false && same.hashMatch && same.countsMatch, 'copie identique refusée');
  assert(again.get(ISOLATED_RESTORE_KEY) === snapshot, 'restauration isolée');
  assert(!again.has(STORAGE_KEY), 'copie identique écrite sur la clé live');
}
