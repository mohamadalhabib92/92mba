/**
 * Répétition espacée locale.
 * SM-2 : algorithme publié par SuperMemo (Wozniak), sans aléa.
 * FSRS-5 : formules et poids par défaut publiés par open-spaced-repetition
 * (guide ts-fsrs FSRS-5). Court terme désactivé, pas de flou : le résultat est déterministe.
 * Les deux mémoires avancent ensemble. L'écran n'affiche que l'échéance du mode choisi.
 */

export type Grade = 'again' | 'hard' | 'good' | 'easy';
export type SchedulerId = 'sm2' | 'fsrs';

export type CardMemory = {
  ease: number;
  sm2Interval: number;
  sm2Reps: number;
  sm2Lapses: number;
  sm2Due: number;
  stability: number;
  difficulty: number;
  fsrsReps: number;
  fsrsLapses: number;
  fsrsDue: number;
  lastReview: number;
};

export const DAY_MS = 86_400_000;

/** Poids FSRS-5 par défaut, publiés avec le modèle (19 valeurs). */
export const FSRS5_WEIGHTS = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11,
  0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
] as const;

const REQUEST_RETENTION = 0.9;
const S_MIN = 0.001;
const S_MAX = 36500;
const INIT_S_MAX = 100;

export function blankMemory(now = 0): CardMemory {
  return {
    ease: 2.5,
    sm2Interval: 0,
    sm2Reps: 0,
    sm2Lapses: 0,
    sm2Due: now,
    stability: 0,
    difficulty: 0,
    fsrsReps: 0,
    fsrsLapses: 0,
    fsrsDue: now,
    lastReview: 0,
  };
}

export function isDue(memory: CardMemory | undefined, scheduler: SchedulerId, now: number): boolean {
  if (!memory) return true;
  const due = scheduler === 'fsrs' ? memory.fsrsDue : memory.sm2Due;
  return due <= now;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Qualité SuperMemo 0–5. Again n'est pas une réussite. */
export function sm2Quality(grade: Grade): number {
  if (grade === 'again') return 1;
  if (grade === 'hard') return 3;
  if (grade === 'good') return 4;
  return 5;
}

/** Note FSRS 1–4. */
export function fsrsGrade(grade: Grade): 1 | 2 | 3 | 4 {
  if (grade === 'again') return 1;
  if (grade === 'hard') return 2;
  if (grade === 'good') return 3;
  return 4;
}

function applySm2(card: CardMemory, grade: Grade, now: number): Pick<CardMemory, 'ease' | 'sm2Interval' | 'sm2Reps' | 'sm2Lapses' | 'sm2Due'> {
  const quality = sm2Quality(grade);
  let ease = card.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < 1.3) ease = 1.3;
  ease = Math.round(ease * 1000) / 1000;
  let reps = card.sm2Reps;
  let interval = card.sm2Interval;
  let lapses = card.sm2Lapses;
  if (quality < 3) {
    reps = 0;
    interval = 1;
    lapses += 1;
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.max(1, Math.round((interval || 1) * ease));
  }
  return { ease, sm2Interval: interval, sm2Reps: reps, sm2Lapses: lapses, sm2Due: now + interval * DAY_MS };
}

function initStability(grade: 1 | 2 | 3 | 4): number {
  return clamp(FSRS5_WEIGHTS[grade - 1], S_MIN, INIT_S_MAX);
}

function initDifficulty(grade: 1 | 2 | 3 | 4): number {
  const w = FSRS5_WEIGHTS;
  return clamp(w[4] - Math.exp(w[5] * (grade - 1)) + 1, 1, 10);
}

export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  const t = Math.max(0, elapsedDays);
  return (1 + (19 * t) / (81 * stability)) ** -0.5;
}

export function fsrsIntervalDays(stability: number, retention = REQUEST_RETENTION): number {
  const raw = ((81 * stability) / 19) * (retention ** -2 - 1);
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  return clamp(Math.round(raw), 1, S_MAX);
}

function nextDifficulty(difficulty: number, grade: 1 | 2 | 3 | 4): number {
  const w = FSRS5_WEIGHTS;
  const delta = -w[6] * (grade - 3);
  const next = difficulty + delta * ((10 - difficulty) / 9);
  const target = initDifficulty(4);
  return clamp(w[7] * target + (1 - w[7]) * next, 1, 10);
}

function nextStability(difficulty: number, stability: number, remembered: number, grade: 1 | 2 | 3 | 4): number {
  const w = FSRS5_WEIGHTS;
  if (grade === 1) {
    const fail =
      w[11] * difficulty ** -w[12] * ((stability + 1) ** w[13] - 1) * Math.exp(w[14] * (1 - remembered));
    return clamp(fail, S_MIN, S_MAX);
  }
  const hard = grade === 2 ? w[15] : 1;
  const easy = grade === 4 ? w[16] : 1;
  const success =
    stability *
    (1 +
      Math.exp(w[8]) * (11 - difficulty) * stability ** -w[9] * (Math.exp(w[10] * (1 - remembered)) - 1) * hard * easy);
  return clamp(success, S_MIN, S_MAX);
}

function applyFsrs(card: CardMemory, grade: Grade, now: number): Pick<CardMemory, 'stability' | 'difficulty' | 'fsrsReps' | 'fsrsLapses' | 'fsrsDue'> {
  const g = fsrsGrade(grade);
  if (card.fsrsReps <= 0 || card.stability <= 0) {
    const stability = initStability(g);
    const difficulty = initDifficulty(g);
    const interval = fsrsIntervalDays(stability);
    return {
      stability,
      difficulty,
      fsrsReps: 1,
      fsrsLapses: g === 1 ? card.fsrsLapses + 1 : card.fsrsLapses,
      fsrsDue: now + interval * DAY_MS,
    };
  }
  const elapsed = card.lastReview > 0 ? Math.max(0, (now - card.lastReview) / DAY_MS) : 0;
  const remembered = retrievability(elapsed, card.stability);
  const difficulty = nextDifficulty(card.difficulty, g);
  const stability = nextStability(card.difficulty, card.stability, remembered, g);
  const interval = fsrsIntervalDays(stability);
  return {
    stability,
    difficulty,
    fsrsReps: card.fsrsReps + 1,
    fsrsLapses: g === 1 ? card.fsrsLapses + 1 : card.fsrsLapses,
    fsrsDue: now + interval * DAY_MS,
  };
}

export function reviewCard(card: CardMemory, grade: Grade, now: number): CardMemory {
  return {
    ...card,
    ...applySm2(card, grade, now),
    ...applyFsrs(card, grade, now),
    lastReview: now,
  };
}

export function dueAt(card: CardMemory, scheduler: SchedulerId): number {
  return scheduler === 'fsrs' ? card.fsrsDue : card.sm2Due;
}
