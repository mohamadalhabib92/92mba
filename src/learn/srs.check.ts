import { DAY_MS, blankMemory, fsrsIntervalDays, retrievability, reviewCard, sm2Quality } from './srs';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const now = Date.UTC(2026, 10, 15);

const firstGood = reviewCard(blankMemory(now), 'good', now);
assert(firstGood.sm2Reps === 1, 'sm2 première réussite');
assert(firstGood.sm2Interval === 1, 'sm2 intervalle 1');
assert(firstGood.sm2Due === now + DAY_MS, 'sm2 échéance +1 jour');
assert(firstGood.fsrsReps === 1 && firstGood.stability > 0, 'fsrs stabilité initiale');
assert(firstGood.fsrsDue > now, 'fsrs échéance future');

const second = reviewCard(firstGood, 'good', firstGood.sm2Due);
assert(second.sm2Reps === 2 && second.sm2Interval === 6, `sm2 second palier ${second.sm2Interval}`);

const third = reviewCard(second, 'good', second.sm2Due);
assert(third.sm2Interval === Math.round(6 * second.ease), `sm2 troisième ${third.sm2Interval}`);

const lapse = reviewCard(third, 'again', third.sm2Due);
assert(lapse.sm2Reps === 0 && lapse.sm2Interval === 1 && lapse.sm2Lapses === 1, 'sm2 échec');

let crushed = blankMemory(now);
for (let i = 0; i < 12; i += 1) crushed = reviewCard(crushed, 'again', now + i * DAY_MS);
assert(crushed.ease >= 1.3, `plancher de facilité ${crushed.ease}`);

const again = reviewCard(blankMemory(now), 'again', now);
assert(again.fsrsLapses === 1, 'fsrs échec initial');
assert(sm2Quality('again') === 1 && sm2Quality('easy') === 5, 'qualités');

const learned = reviewCard(reviewCard(blankMemory(now), 'good', now), 'good', now + 10 * DAY_MS);
assert(learned.stability > 0 && learned.fsrsReps === 2, 'fsrs deuxième revue');
const remembered = retrievability(10, reviewCard(blankMemory(now), 'good', now).stability);
assert(remembered > 0 && remembered <= 1, `rétention ${remembered}`);
const interval = fsrsIntervalDays(learned.stability);
assert(interval >= 1, 'intervalle fsrs');

const copy = reviewCard(blankMemory(now), 'easy', now);
const copy2 = reviewCard(blankMemory(now), 'easy', now);
assert(JSON.stringify(copy) === JSON.stringify(copy2), 'pas de flou');

const both = reviewCard(blankMemory(now), 'hard', now);
assert(both.sm2Due !== 0 && both.fsrsDue !== 0, 'les deux mémoires avancent');

console.log('srs checks ok');
