/**
 * Surlignages : couleur additive, carte, file du jour.
 * Un passage déjà enregistré reste ; un champ inconnu sur le disque aussi.
 */
import { composeStudy, defaultStudyState, sanitizeStudy, addMark, cardFromMark, REVIEW_SESSION } from './study';
import { blankMemory } from './srs';
import { dailyReviewIds } from './highlights';
import type { StudyModule } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const loaded = sanitizeStudy({
  xp: 12,
  marks: [
    { id: 'a', docId: 'd', page: 2, text: 'hello', createdAt: 1, cardId: 'mark-a', color: 'green' },
    { id: 'b', docId: 'd', page: 0, text: 'old', createdAt: 2 },
    { id: 'c', docId: 'd', page: 1, text: 'odd', createdAt: 3, color: 'purple' },
    { id: '', docId: 'd', text: 'drop' },
  ],
});
assert(loaded.xp === 12, 'xp');
assert(loaded.marks.length === 3, 'passages illisibles écartés, les autres gardés');
assert(loaded.marks[0]?.color === 'green' && loaded.marks[0]?.cardId === 'mark-a', 'couleur et carte');
assert(loaded.marks[1]?.color === 'yellow' && loaded.marks[1]?.text === 'old', 'sans couleur → jaune, texte intact');
assert(loaded.marks[2]?.color === 'yellow', 'couleur inconnue → jaune');

const base = addMark(defaultStudyState(), { id: 'm', docId: 'd', page: 1, text: 'Actifs', createdAt: 1 });
assert(base.marks.length === 1 && base.marks[0]?.color === 'yellow', 'nouveau passage en jaune');
const painted = addMark(base, { id: 'm', docId: 'd', page: 1, text: 'Actifs', createdAt: 9, color: 'blue' });
assert(painted.marks.length === 1 && painted.marks[0]?.text === 'Actifs' && painted.marks[0]?.color === 'blue', 'repeindre ne duplique pas');
const same = addMark(painted, { id: 'm', docId: 'd', page: 1, text: 'Actifs', createdAt: 9, color: 'blue' });
assert(same === painted, 'même couleur : aucune réécriture');

const carded = cardFromMark(painted, 'm', 50, {
  front: 'Que retenir ?',
  back: 'Actifs',
  lang: 'fr',
  docId: 'd',
  author: 'Équipe',
  date: '2026-11-23',
  source: 'Surlignage',
  licence: 'Original',
  status: 'original',
});
assert(carded.userCards.length === 1 && carded.marks[0]?.cardId === carded.userCards[0]?.id, 'passage devenu carte');
assert(carded.marks[0]?.color === 'blue', 'la couleur reste sur la carte');

const disk = { marks: [{ id: 'm', docId: 'd', page: 1, text: 'Actifs', createdAt: 1, note: 'future' }], futureLab: 'x' };
const written = composeStudy(disk, painted) as { marks: Array<Record<string, unknown>>; futureLab?: string };
assert(written.futureLab === 'x', 'clé inconnue du bloc étude');
assert(written.marks[0]?.note === 'future' && written.marks[0]?.color === 'blue', 'champ de passage inconnu + couleur');

const now = 1_000;
const study = {
  ...defaultStudyState(),
  marks: [{ id: 'h', docId: 'd', page: 0, text: 'passage', createdAt: 1, cardId: 'mark-h', color: 'rose' as const }],
  userCards: [
    {
      id: 'mark-h',
      moduleId: 'library',
      front: 'Q',
      back: 'passage',
      lang: 'fr' as const,
      author: 'Équipe',
      date: '2026-11-23',
      source: 'Surlignage',
      licence: 'Original',
      status: 'original',
    },
  ],
  cards: {
    'mark-h': { ...blankMemory(now), sm2Due: now, fsrsDue: now },
    late: { ...blankMemory(now), sm2Due: now + 9_000, fsrsDue: now + 9_000 },
    soon: { ...blankMemory(now), sm2Due: now - 100, fsrsDue: now - 100 },
  },
};
const modules = [{ cards: [{ id: 'soon' }, { id: 'late' }] }] as unknown as StudyModule[];
const queue = dailyReviewIds(modules, study, now);
assert(queue[0] === 'mark-h', 'la carte de surlignage passe devant');
assert(queue.includes('soon') && !queue.includes('late'), 'seules les cartes dues');
assert(queue.length <= REVIEW_SESSION && REVIEW_SESSION <= 10 && REVIEW_SESSION >= 5, 'séance de 5 à 10');

const many = dailyReviewIds(
  [{ cards: Array.from({ length: 12 }, (_, i) => ({ id: `c${i}` })) }] as unknown as StudyModule[],
  defaultStudyState(),
  now,
);
assert(many.length === REVIEW_SESSION, 'plafond de séance');

console.log('highlights checks ok');
