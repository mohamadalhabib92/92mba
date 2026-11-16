import { composeSave } from '../lib/preservation';
import { defaultAppState, mergeLate, mergeStored } from '../lib/stateMerge';
import { contrastRatio } from '../theme';
import { darkPalette, highContrastDark, highContrastLight, lightPalette } from '../theme/system';
import { contentProblems, coverage, modules } from './content/catalog';
import {
  addMark,
  applyGrade,
  cardFromMark,
  completeLesson,
  localDay,
  recordExam,
  reviewIds,
  touchStreak,
} from './study';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const now = new Date(2026, 10, 15, 12, 0, 0).getTime();
const nextDay = new Date(2026, 10, 16, 12, 0, 0).getTime();
const gap = new Date(2026, 10, 17, 12, 0, 0).getTime();

const legacy = {
  lang: 'ar',
  fontScale: 1.1,
  progress: { 'lire-un-bilan': { page: 120, pages: 200, updatedAt: 50 } },
  bookmarks: { 'lire-un-bilan': [2, 5] },
  searchHistory: ['bilan', 'swot'],
  userDocs: [
    {
      id: 'user-notes',
      title: 'Notes',
      author: 'Moi',
      lang: 'fr',
      category: 'other',
      license: { kind: 'owned', label: 'Je possède', statusCode: 'owned', date: 'à valider' },
      summary: '',
      paragraphs: ['Paragraphe un.'],
      userAdded: true,
      fileName: 'notes.txt',
    },
  ],
  accountId: 'local-account-kept',
  importBatch: { count: 1 },
};

const merged = mergeStored(legacy as never);
assert(merged.progress['lire-un-bilan'].page === 120, 'page 120');
assert(merged.bookmarks['lire-un-bilan'].join() === '2,5', 'signets');
assert(merged.lang === 'ar', 'langue');
assert(merged.userDocs[0]?.id === 'user-notes', 'document');
assert(merged.study.xp === 0 && merged.study.freezes === 2, 'étude par défaut');
assert(merged.study.scheduler === 'sm2', 'sm2 par défaut');
assert(Object.keys(merged.study.cards).length === 0, 'pas de cartes inventées');

const live = {
  ...merged,
  fontScale: 1.2,
  study: completeLesson(merged.study, modules[0].lessons[0].id, modules[0].id, modules[0].lessons.map((lesson) => lesson.id), now),
};
const written = composeSave(legacy as Record<string, unknown>, live, new Set(['study']));
assert(written.accountId === 'local-account-kept', 'clé inconnue');
assert(written.importBatch && (written.importBatch as { count: number }).count === 1, 'lot');
assert((written.progress as { 'lire-un-bilan': { page: number } })['lire-un-bilan'].page === 120, 'progression intacte');
assert((written.userDocs as { fileName?: string }[])[0]?.fileName === 'notes.txt', 'fichier');
assert((written.bookmarks as { 'lire-un-bilan': number[] })['lire-un-bilan'].join() === '2,5', 'signets intacts');
const study = written.study as { xp: number; lessons: Record<string, { doneAt?: number }>; futureLab?: string };
assert(study.xp > 0 && study.lessons[modules[0].lessons[0].id]?.doneAt === now, 'leçon enregistrée');

const withFuture = composeSave(
  { ...legacy, study: { futureLab: 'keep-me', xp: 3, cards: { old: { ease: 2.5, extra: 'pin' } } } },
  {
    ...live,
    study: {
      ...live.study,
      xp: 15,
      cards: { ...live.study.cards, old: { ...live.study.cards.old, ease: 2.6, sm2Interval: 1, sm2Reps: 1, sm2Lapses: 0, sm2Due: now, stability: 1, difficulty: 5, fsrsReps: 1, fsrsLapses: 0, fsrsDue: now, lastReview: now } },
    },
  },
  new Set(['study']),
);
const kept = withFuture.study as { futureLab?: string; cards: Record<string, { extra?: string; ease: number }> };
assert(kept.futureLab === 'keep-me', 'champ d’étude inconnu');
assert(kept.cards.old?.extra === 'pin', 'champ de carte inconnu');
assert(kept.cards.old?.ease === 2.6, 'facilité mise à jour');

const onlyFont = composeSave(legacy as Record<string, unknown>, { ...merged, fontScale: 1.4 }, new Set(['fontScale']));
assert(onlyFont.study === undefined, 'une préférence de lecture n’écrit pas un bloc d’étude absent');
assert((onlyFont.progress as { 'lire-un-bilan': { page: number } })['lire-un-bilan'].page === 120, 'page toujours là');

const day = localDay(now);
let streak = touchStreak({ ...merged.study, streak: 3, streakDay: day, freezes: 1 }, nextDay);
assert(streak.streak === 4, 'série continue');
streak = touchStreak({ ...merged.study, streak: 3, streakDay: day, freezes: 1, badges: [] }, gap);
assert(streak.streak === 4 && streak.freezes === 0, 'gel utilisé');
const shamed = touchStreak({ ...merged.study, streak: 5, streakDay: day, freezes: 0, badges: [] }, gap);
assert(shamed.streak === 1, 'reprise à 1 sans gel, pas un compteur négatif');

const graded = applyGrade(merged.study, modules[0].cards[0].id, 'good', now);
assert(graded.cards[modules[0].cards[0].id]?.sm2Reps === 1, 'carte revue');
assert(reviewIds(modules, graded, now).includes(modules[0].cards[0].id) === false, 'plus due aujourd’hui');

const marked = addMark(merged.study, { id: 'm1', docId: 'lire-un-bilan', page: 120, text: 'Actifs = dettes + capitaux', createdAt: now });
const carded = cardFromMark(marked, 'm1', now, {
  front: 'Que retenir ?',
  back: 'Actifs = dettes + capitaux',
  lang: 'fr',
  docId: 'lire-un-bilan',
  author: "Équipe 92'MBA",
  date: '2026-11-15',
  source: 'Surlignage',
  licence: 'Original — Équipe 92\'MBA / Mohamed',
  status: 'original',
});
assert(carded.userCards.length === 1 && carded.marks[0]?.cardId === carded.userCards[0]?.id, 'surlignage devenu carte');
assert(cardFromMark(carded, 'm1', now, carded.userCards[0]).userCards.length === 1, 'pas de doublon');

const late = mergeLate(
  { ...defaultAppState(), lang: 'fr', study: { ...defaultAppState().study, xp: 40, onboarded: true } },
  { lang: 'ar', progress: { 'lire-un-bilan': { page: 120, pages: 200, updatedAt: 1 } }, study: { xp: 10, futureLab: 'x' } } as never,
  new Set(['lang']),
);
assert(late.lang === 'fr', 'langue de session');
assert(late.progress['lire-un-bilan'].page === 120, 'page tardive');
assert(late.study.xp === 40, 'xp la plus haute');
assert(late.study.onboarded === true, 'accueil déjà vu en session');

const passed = recordExam(merged.study, 'strategy', 4, 5, now);
assert((passed.exams.strategy?.correct ?? 0) === 4, 'examen');

const problems = contentProblems();
assert(problems.length === 0, `schéma / licence: ${problems.slice(0, 12).join(', ')}`);
const rows = coverage();
assert(rows.length === 15, '15 modules');
assert(rows.filter((row) => row.richness === 'rich').every((row) => row.lessons >= 3 && row.cards >= 6), 'modules riches');
assert(rows.filter((row) => row.richness === 'thin').every((row) => row.lessons >= 2 && row.cards >= 4), 'modules minces');

for (const palette of [lightPalette, darkPalette, highContrastLight, highContrastDark]) {
  assert(contrastRatio(palette.text, palette.bg) >= 4.5, `texte ${palette.bg}`);
  assert(contrastRatio(palette.muted, palette.bg) >= 4.5, `secondaire ${palette.bg}`);
  assert(contrastRatio(palette.onPrimary, palette.primary) >= 4.5, `bouton ${palette.primary}`);
}

console.log('study checks ok');
console.log(rows.map((row) => `${row.id} ${row.richness} leçons=${row.lessons} cartes=${row.cards} quiz=${row.quiz} cas=${row.cases} formules=${row.formulas}`).join('\n'));
