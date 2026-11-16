import type { Lang } from '../i18n/strings';
import type { CardMemory, Grade, SchedulerId } from './srs';
import { blankMemory, dueAt, isDue, reviewCard } from './srs';
import type { Capstone, StudyModule, StudyPath } from './types';

export type Appearance = 'light' | 'dark' | 'system';
export type CelebrationLevel = 'full' | 'reduced' | 'off';

export type LessonProgress = { screen: number; doneAt?: number };

export type ExamResult = { correct: number; total: number; at: number };

export type ReaderMark = {
  id: string;
  docId: string;
  page: number;
  text: string;
  createdAt: number;
  cardId?: string;
};

export type UserCard = {
  id: string;
  moduleId: string;
  front: string;
  back: string;
  lang: Lang;
  docId?: string;
  author: string;
  date: string;
  source: string;
  licence: string;
  status: string;
};

export type ResumePoint = {
  kind: 'lesson' | 'doc' | 'review' | 'quiz' | 'case' | 'focus';
  id: string;
  screen?: number;
};

export type StudyState = {
  scheduler: SchedulerId;
  appearance: Appearance;
  highContrast: boolean;
  /** null = suivre le réglage du système. */
  reduceMotion: boolean | null;
  celebrations: CelebrationLevel;
  focusMinutes: number;
  reminderEnabled: boolean;
  reminderHour: number;
  onboarded: boolean;
  pathId: string | null;
  pathStartedAt: number | null;
  xp: number;
  streak: number;
  /** Jour local AAAA-MM-JJ de la dernière activité comptée. */
  streakDay: string | null;
  freezes: number;
  freezeUsedOn: string | null;
  lessons: Record<string, LessonProgress>;
  cards: Record<string, CardMemory>;
  userCards: UserCard[];
  exams: Record<string, ExamResult>;
  capstoneAt: number | null;
  badges: string[];
  marks: ReaderMark[];
  resume: ResumePoint | null;
};

export const FOCUS_CHOICES = [5, 10, 15, 25, 45] as const;
export const XP_LESSON = 12;
export const XP_CARD = 4;
export const XP_EXAM = 30;
export const XP_CAPSTONE = 40;
export const XP_PER_LEVEL = 80;
export const REVIEW_SESSION = 10;
export const PASS_RATIO = 0.7;

export function defaultStudyState(): StudyState {
  return {
    scheduler: 'sm2',
    appearance: 'system',
    highContrast: false,
    reduceMotion: null,
    celebrations: 'full',
    focusMinutes: 15,
    reminderEnabled: false,
    reminderHour: 18,
    onboarded: false,
    pathId: null,
    pathStartedAt: null,
    xp: 0,
    streak: 0,
    streakDay: null,
    freezes: 2,
    freezeUsedOn: null,
    lessons: {},
    cards: {},
    userCards: [],
    exams: {},
    capstoneAt: null,
    badges: [],
    marks: [],
    resume: null,
  };
}

function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function localDay(now: number): string {
  const d = new Date(now);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function dayNumber(day: string): number {
  const [y, m, d] = day.split('-').map((part) => Number(part));
  if (!y || !m || !d) return 0;
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

function sanitizeMemory(raw: unknown): CardMemory | null {
  if (!raw || typeof raw !== 'object') return null;
  const base = blankMemory(0);
  const row = raw as Partial<CardMemory>;
  return {
    ease: Math.max(1.3, finite(row.ease, base.ease)),
    sm2Interval: Math.max(0, finite(row.sm2Interval, 0)),
    sm2Reps: Math.max(0, finite(row.sm2Reps, 0)),
    sm2Lapses: Math.max(0, finite(row.sm2Lapses, 0)),
    sm2Due: finite(row.sm2Due, 0),
    stability: Math.max(0, finite(row.stability, 0)),
    difficulty: finite(row.difficulty, 0),
    fsrsReps: Math.max(0, finite(row.fsrsReps, 0)),
    fsrsLapses: Math.max(0, finite(row.fsrsLapses, 0)),
    fsrsDue: finite(row.fsrsDue, 0),
    lastReview: finite(row.lastReview, 0),
  };
}

function sanitizeLessons(raw: unknown): Record<string, LessonProgress> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, LessonProgress> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const row = value as Partial<LessonProgress>;
    const screen = finite(row.screen, 0);
    const doneAt = typeof row.doneAt === 'number' && Number.isFinite(row.doneAt) ? row.doneAt : undefined;
    out[id] = doneAt ? { screen, doneAt } : { screen };
  }
  return out;
}

function sanitizeCards(raw: unknown): Record<string, CardMemory> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, CardMemory> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const card = sanitizeMemory(value);
    if (card) out[id] = card;
  }
  return out;
}

function sanitizeUserCards(raw: unknown): UserCard[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Partial<UserCard>;
    if (!row.id || !row.front || !row.back) return [];
    const lang: Lang = row.lang === 'en' || row.lang === 'ar' ? row.lang : 'fr';
    return [
      {
        id: row.id,
        moduleId: text(row.moduleId, 'library'),
        front: row.front,
        back: row.back,
        lang,
        docId: typeof row.docId === 'string' ? row.docId : undefined,
        author: text(row.author, "Équipe 92'MBA"),
        date: text(row.date, 'à vérifier'),
        source: text(row.source, 'Surlignage du lecteur'),
        licence: text(row.licence, 'à vérifier'),
        status: text(row.status, 'needs-review'),
      },
    ];
  });
}

function sanitizeExams(raw: unknown): Record<string, ExamResult> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, ExamResult> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const row = value as Partial<ExamResult>;
    if (!Number.isFinite(row.correct) || !Number.isFinite(row.total) || (row.total ?? 0) <= 0) continue;
    out[id] = { correct: row.correct as number, total: row.total as number, at: finite(row.at, 0) };
  }
  return out;
}

function sanitizeMarks(raw: unknown): ReaderMark[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Partial<ReaderMark>;
    if (!row.id || !row.docId || typeof row.text !== 'string' || !row.text.trim()) return [];
    return [
      {
        id: row.id,
        docId: row.docId,
        page: Math.max(0, finite(row.page, 0)),
        text: row.text.slice(0, 600),
        createdAt: finite(row.createdAt, 0),
        cardId: typeof row.cardId === 'string' ? row.cardId : undefined,
      },
    ];
  });
}

function sanitizeResume(raw: unknown): ResumePoint | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Partial<ResumePoint>;
  const kinds = ['lesson', 'doc', 'review', 'quiz', 'case', 'focus'] as const;
  if (!row.kind || !kinds.includes(row.kind) || typeof row.id !== 'string' || !row.id) return null;
  return { kind: row.kind, id: row.id, screen: Number.isFinite(row.screen) ? row.screen : undefined };
}

/** Adoption additive. Un champ absent ou illisible reprend le défaut, le reste est gardé. */
export function sanitizeStudy(raw: unknown): StudyState {
  const base = defaultStudyState();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const row = raw as Partial<StudyState>;
  const focus = FOCUS_CHOICES.includes(row.focusMinutes as (typeof FOCUS_CHOICES)[number]) ? (row.focusMinutes as number) : base.focusMinutes;
  const hour = finite(row.reminderHour, base.reminderHour);
  return {
    scheduler: row.scheduler === 'fsrs' ? 'fsrs' : 'sm2',
    appearance: row.appearance === 'light' || row.appearance === 'dark' || row.appearance === 'system' ? row.appearance : base.appearance,
    highContrast: row.highContrast === true,
    reduceMotion: row.reduceMotion === true || row.reduceMotion === false ? row.reduceMotion : null,
    celebrations: row.celebrations === 'reduced' || row.celebrations === 'off' ? row.celebrations : 'full',
    focusMinutes: focus,
    reminderEnabled: row.reminderEnabled === true,
    reminderHour: Math.max(0, Math.min(23, Math.round(hour))),
    onboarded: row.onboarded === true,
    pathId: typeof row.pathId === 'string' ? row.pathId : null,
    pathStartedAt: typeof row.pathStartedAt === 'number' && Number.isFinite(row.pathStartedAt) ? row.pathStartedAt : null,
    xp: Math.max(0, finite(row.xp, 0)),
    streak: Math.max(0, finite(row.streak, 0)),
    streakDay: typeof row.streakDay === 'string' ? row.streakDay : null,
    freezes: Math.max(0, finite(row.freezes, base.freezes)),
    freezeUsedOn: typeof row.freezeUsedOn === 'string' ? row.freezeUsedOn : null,
    lessons: sanitizeLessons(row.lessons),
    cards: sanitizeCards(row.cards),
    userCards: sanitizeUserCards(row.userCards),
    exams: sanitizeExams(row.exams),
    capstoneAt: typeof row.capstoneAt === 'number' && Number.isFinite(row.capstoneAt) ? row.capstoneAt : null,
    badges: Array.isArray(row.badges) ? [...new Set(row.badges.filter((item): item is string => typeof item === 'string'))] : [],
    marks: sanitizeMarks(row.marks),
    resume: sanitizeResume(row.resume),
  };
}

function laterLesson(a: LessonProgress, b: LessonProgress): LessonProgress {
  if (a.doneAt && !b.doneAt) return a;
  if (b.doneAt && !a.doneAt) return b;
  if ((a.doneAt ?? 0) !== (b.doneAt ?? 0)) return (a.doneAt ?? 0) >= (b.doneAt ?? 0) ? a : b;
  return a.screen >= b.screen ? a : b;
}

function laterCard(a: CardMemory, b: CardMemory): CardMemory {
  return a.lastReview >= b.lastReview ? a : b;
}

/**
 * Union de deux états d'étude. Sert quand la lecture du disque arrive après une action.
 * Les préférences suivent `preferCurrent` seulement si l'utilisateur les a touchées.
 * La progression garde le plus avancé. Rien de valide n'est écarté.
 */
export function mergeStudy(current: StudyState, saved: StudyState, preferCurrent: boolean): StudyState {
  const prefs = preferCurrent ? current : saved;
  const lessons: Record<string, LessonProgress> = { ...saved.lessons };
  for (const [id, lesson] of Object.entries(current.lessons)) {
    lessons[id] = lessons[id] ? laterLesson(lesson, lessons[id]) : lesson;
  }
  const cards: Record<string, CardMemory> = { ...saved.cards };
  for (const [id, card] of Object.entries(current.cards)) {
    cards[id] = cards[id] ? laterCard(card, cards[id]) : card;
  }
  const exams: Record<string, ExamResult> = { ...saved.exams };
  for (const [id, exam] of Object.entries(current.exams)) {
    const other = exams[id];
    exams[id] = !other || exam.at >= other.at ? exam : other;
  }
  const marks = new Map<string, ReaderMark>();
  for (const mark of saved.marks) marks.set(mark.id, mark);
  for (const mark of current.marks) marks.set(mark.id, { ...marks.get(mark.id), ...mark });
  const userCards = new Map<string, UserCard>();
  for (const card of saved.userCards) userCards.set(card.id, card);
  for (const card of current.userCards) userCards.set(card.id, card);
  const streakFromCurrent = (current.streakDay ?? '') > (saved.streakDay ?? '');
  return {
    scheduler: prefs.scheduler,
    appearance: prefs.appearance,
    highContrast: prefs.highContrast,
    reduceMotion: prefs.reduceMotion,
    celebrations: prefs.celebrations,
    focusMinutes: prefs.focusMinutes,
    reminderEnabled: prefs.reminderEnabled,
    reminderHour: prefs.reminderHour,
    onboarded: current.onboarded || saved.onboarded,
    pathId: prefs.pathId,
    pathStartedAt: prefs.pathStartedAt ?? saved.pathStartedAt ?? current.pathStartedAt,
    xp: Math.max(current.xp, saved.xp),
    streak: streakFromCurrent ? current.streak : saved.streak,
    streakDay: streakFromCurrent ? current.streakDay : saved.streakDay,
    freezes: streakFromCurrent ? current.freezes : saved.freezes,
    freezeUsedOn: streakFromCurrent ? current.freezeUsedOn : saved.freezeUsedOn,
    lessons,
    cards,
    userCards: [...userCards.values()],
    exams,
    capstoneAt: Math.max(current.capstoneAt ?? 0, saved.capstoneAt ?? 0) || null,
    badges: [...new Set([...saved.badges, ...current.badges])],
    marks: [...marks.values()],
    resume: preferCurrent && current.resume ? current.resume : saved.resume ?? current.resume,
  };
}

export function levelFor(xp: number): number {
  return 1 + Math.floor(Math.max(0, xp) / XP_PER_LEVEL);
}

export function levelProgress(xp: number): number {
  const into = Math.max(0, xp) % XP_PER_LEVEL;
  return into / XP_PER_LEVEL;
}

/**
 * Série douce. Un jour manqué avec un gel disponible ne remet pas le compteur à zéro.
 * Sans gel, la série repart à 1 le jour où l'on revient — le texte d'interface ne gronde pas.
 */
export function touchStreak(study: StudyState, now: number): Pick<StudyState, 'streak' | 'streakDay' | 'freezes' | 'freezeUsedOn' | 'badges'> {
  const today = localDay(now);
  if (study.streakDay === today) {
    return { streak: study.streak, streakDay: today, freezes: study.freezes, freezeUsedOn: study.freezeUsedOn, badges: study.badges };
  }
  const previous = study.streakDay ? dayNumber(study.streakDay) : 0;
  const current = dayNumber(today);
  const gap = previous ? current - previous : 0;
  let streak = 1;
  let freezes = study.freezes;
  let freezeUsedOn = study.freezeUsedOn;
  if (gap === 1) streak = study.streak + 1;
  else if (gap === 2 && freezes > 0) {
    freezes -= 1;
    freezeUsedOn = today;
    streak = study.streak + 1;
  } else if (gap > 1) streak = 1;
  const badges = new Set(study.badges);
  if (streak >= 3) badges.add('streak-3');
  if (streak >= 7) badges.add('streak-7');
  if (streak >= 7 && freezes < 2) freezes += 1;
  return { streak, streakDay: today, freezes, freezeUsedOn, badges: [...badges] };
}

export function award(study: StudyState, badge: string, xp: number): StudyState {
  const badges = study.badges.includes(badge) ? study.badges : [...study.badges, badge];
  return { ...study, badges, xp: study.xp + xp };
}

export function completeLesson(study: StudyState, lessonId: string, moduleId: string, lessonIds: string[], now: number): StudyState {
  const prev = study.lessons[lessonId];
  if (prev?.doneAt) return { ...study, ...touchStreak(study, now), resume: { kind: 'lesson', id: lessonId } };
  const lessons = { ...study.lessons, [lessonId]: { screen: prev?.screen ?? 0, doneAt: now } };
  let next = award({ ...study, lessons }, 'first-lesson', XP_LESSON);
  next = { ...next, ...touchStreak(next, now), lessons, resume: { kind: 'lesson', id: lessonId } };
  const done = lessonIds.every((id) => next.lessons[id]?.doneAt);
  if (done && !next.badges.includes(`module:${moduleId}`)) next = { ...next, badges: [...next.badges, `module:${moduleId}`] };
  return next;
}

export function setLessonScreen(study: StudyState, lessonId: string, screen: number): StudyState {
  const prev = study.lessons[lessonId];
  if (prev?.doneAt) return { ...study, resume: { kind: 'lesson', id: lessonId, screen } };
  return {
    ...study,
    lessons: { ...study.lessons, [lessonId]: { screen } },
    resume: { kind: 'lesson', id: lessonId, screen },
  };
}

export function reviewIds(modules: StudyModule[], study: StudyState, now: number): string[] {
  const ids = [
    ...modules.flatMap((mod) => mod.cards.map((card) => card.id)),
    ...study.userCards.map((card) => card.id),
  ];
  return ids.filter((id) => isDue(study.cards[id], study.scheduler, now));
}

export function applyGrade(study: StudyState, cardId: string, grade: Grade, now: number): StudyState {
  const current = study.cards[cardId] ?? blankMemory(now);
  const cards = { ...study.cards, [cardId]: reviewCard(current, grade, now) };
  const gained = grade === 'again' ? 1 : XP_CARD;
  let next = award({ ...study, cards }, 'first-review', gained);
  next = { ...next, ...touchStreak(next, now), cards, resume: { kind: 'review', id: cardId } };
  return next;
}

export function recordExam(study: StudyState, moduleId: string, correct: number, total: number, now: number): StudyState {
  const exams = { ...study.exams, [moduleId]: { correct, total, at: now } };
  const passed = total > 0 && correct / total >= PASS_RATIO;
  let next: StudyState = { ...study, exams, resume: { kind: 'quiz', id: moduleId } };
  if (passed) next = award(next, `exam:${moduleId}`, XP_EXAM);
  next = { ...next, ...touchStreak(next, now), exams };
  return next;
}

export function recordCapstone(study: StudyState, now: number): StudyState {
  if (study.capstoneAt) return study;
  let next = award(study, 'capstone', XP_CAPSTONE);
  next = { ...next, ...touchStreak(next, now), capstoneAt: now };
  return next;
}

export function addMark(study: StudyState, mark: ReaderMark): StudyState {
  if (study.marks.some((item) => item.id === mark.id || (item.docId === mark.docId && item.page === mark.page && item.text === mark.text))) {
    return study;
  }
  return { ...study, marks: [mark, ...study.marks] };
}

export function cardFromMark(study: StudyState, markId: string, now: number, meta: Omit<UserCard, 'id' | 'front' | 'back' | 'moduleId'> & { back: string; front: string }): StudyState {
  const mark = study.marks.find((item) => item.id === markId);
  if (!mark || mark.cardId) return study;
  const cardId = `mark-${mark.id}`;
  const userCard: UserCard = {
    id: cardId,
    moduleId: 'library',
    front: meta.front,
    back: meta.back,
    lang: meta.lang,
    docId: meta.docId,
    author: meta.author,
    date: meta.date,
    source: meta.source,
    licence: meta.licence,
    status: meta.status,
  };
  const marks = study.marks.map((item) => (item.id === mark.id ? { ...item, cardId } : item));
  let next: StudyState = {
    ...study,
    marks,
    userCards: [userCard, ...study.userCards],
    cards: { ...study.cards, [cardId]: blankMemory(now) },
  };
  if (!next.badges.includes('highlight-card')) next = { ...next, badges: [...next.badges, 'highlight-card'] };
  return next;
}

export type WeakArea = { moduleId: string; reason: 'exam' | 'lapses' | 'untouched' };

export function weakAreas(modules: StudyModule[], study: StudyState, now: number, path: StudyPath | null): WeakArea[] {
  const out: WeakArea[] = [];
  for (const mod of modules) {
    const exam = study.exams[mod.id];
    if (exam && exam.correct / exam.total < PASS_RATIO) {
      out.push({ moduleId: mod.id, reason: 'exam' });
      continue;
    }
    const lapses = mod.cards.reduce((sum, card) => {
      const memory = study.cards[card.id];
      if (!memory) return sum;
      return sum + (study.scheduler === 'fsrs' ? memory.fsrsLapses : memory.sm2Lapses);
    }, 0);
    if (lapses >= 2) {
      out.push({ moduleId: mod.id, reason: 'lapses' });
      continue;
    }
    const started = mod.lessons.some((lesson) => study.lessons[lesson.id]);
    if (!started && path && study.pathStartedAt && expectedModule(path, study.pathStartedAt, now) === mod.id) {
      out.push({ moduleId: mod.id, reason: 'untouched' });
    }
  }
  return out;
}

export function pathDayIndex(startedAt: number, now: number, days: number): number {
  const start = dayNumber(localDay(startedAt));
  const today = dayNumber(localDay(now));
  const index = today - start + 1;
  return Math.max(1, Math.min(days, index));
}

export function expectedModule(path: StudyPath, startedAt: number, now: number): string {
  const day = pathDayIndex(startedAt, now, path.days);
  const step = path.steps.find((item) => day >= item.from && day <= item.to) ?? path.steps[path.steps.length - 1];
  return step?.moduleId ?? path.steps[0]?.moduleId ?? '';
}

export function moduleRatio(mod: StudyModule, study: StudyState): number {
  if (!mod.lessons.length) return 0;
  const done = mod.lessons.filter((lesson) => study.lessons[lesson.id]?.doneAt).length;
  return done / mod.lessons.length;
}

export function nextLessonId(mod: StudyModule, study: StudyState): string | null {
  const open = mod.lessons.find((lesson) => !study.lessons[lesson.id]?.doneAt);
  return open?.id ?? mod.lessons[0]?.id ?? null;
}

export function reminderDue(study: StudyState, now: number): boolean {
  if (!study.reminderEnabled) return false;
  if (study.streakDay === localDay(now)) return false;
  return new Date(now).getHours() >= study.reminderHour;
}

export function queuePreview(study: StudyState, ids: string[]): { id: string; due: number }[] {
  return ids
    .map((id) => ({ id, due: study.cards[id] ? dueAt(study.cards[id], study.scheduler) : 0 }))
    .sort((a, b) => a.due - b.due)
    .slice(0, REVIEW_SESSION);
}

export function capstoneScore(correct: number, total: number): boolean {
  return total > 0 && correct / total >= PASS_RATIO;
}

const STUDY_KEYS = [
  'scheduler',
  'appearance',
  'highContrast',
  'reduceMotion',
  'celebrations',
  'focusMinutes',
  'reminderEnabled',
  'reminderHour',
  'onboarded',
  'pathId',
  'pathStartedAt',
  'xp',
  'streak',
  'streakDay',
  'freezes',
  'freezeUsedOn',
  'lessons',
  'cards',
  'userCards',
  'exams',
  'capstoneAt',
  'badges',
  'marks',
  'resume',
] as const;

function plain(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function mergeRecords(rawVal: unknown, live: Record<string, unknown>): Record<string, unknown> {
  const base: Record<string, unknown> = plain(rawVal) ? { ...rawVal } : {};
  for (const [id, value] of Object.entries(live)) {
    const prev = base[id];
    base[id] = plain(prev) && plain(value) ? { ...prev, ...value } : value;
  }
  return base;
}

function mergeIdList(rawVal: unknown, live: { id: string }[]): unknown[] {
  const rawArr = Array.isArray(rawVal) ? rawVal : [];
  const byId = new Map<string, Record<string, unknown>>();
  const orphans: unknown[] = [];
  for (const item of rawArr) {
    if (plain(item) && typeof item.id === 'string' && item.id) byId.set(item.id, item);
    else orphans.push(item);
  }
  const seen = new Set<string>();
  const out: unknown[] = live.map((item) => {
    seen.add(item.id);
    const prev = byId.get(item.id);
    return prev ? { ...prev, ...item } : item;
  });
  for (const [id, prev] of byId) {
    if (!seen.has(id)) out.push(prev);
  }
  out.push(...orphans);
  return out;
}

/**
 * Réécrit les champs d'étude connus et laisse le reste du bloc (clés futures, champs de carte inconnus).
 * Les identifiants de cartes, leçons, examens et surlignages absents de la mémoire restent sur le disque.
 */
export function composeStudy(rawVal: unknown, live: StudyState): unknown {
  if (!plain(rawVal)) return live;
  const out: Record<string, unknown> = { ...rawVal };
  for (const key of STUDY_KEYS) {
    if (key === 'lessons' || key === 'cards' || key === 'exams') {
      out[key] = mergeRecords(rawVal[key], live[key] as unknown as Record<string, unknown>);
    } else if (key === 'userCards' || key === 'marks') {
      out[key] = mergeIdList(rawVal[key], live[key] as { id: string }[]);
    } else if (key === 'badges') {
      const prev = Array.isArray(rawVal.badges) ? rawVal.badges.filter((item) => typeof item === 'string') : [];
      out.badges = [...new Set([...prev, ...live.badges])];
    } else {
      out[key] = live[key];
    }
  }
  return out;
}
