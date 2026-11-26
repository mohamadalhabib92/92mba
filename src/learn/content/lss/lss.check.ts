import { contentProblems, modules } from '../catalog';
import { defaultStudyState } from '../../study';
import { lssBelts, mockQuestions } from './index';
import { beltHeld, beltOpen, type BeltGate } from './progress';
import { formatClock, scoreMock } from './score';
import { lessonAllowed } from '../resolve';
import type { LssQuestion } from './types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function roundTo(value: number, places: number): number {
  return Number(value.toFixed(places));
}

function parseNum(text: string): number | null {
  const match = text.replace(/[\s\u00a0\u202f]/g, '').match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  return Number(match[0].replace(',', '.'));
}

/** Formules reprises ici, à part du texte des options, pour recomptage. */
function compute(formula: string, inputs: number[]): number {
  const [a, b, c, d] = inputs;
  switch (formula) {
    case 'dpmo':
      return (a / (b * c)) * 1_000_000;
    case 'defectsFromDpmo':
      return (a * b * c) / 1_000_000;
    case 'dpu':
      return a / b;
    case 'pct':
      return (a / b) * 100;
    case 'rty':
      return inputs.reduce((product, yieldValue) => product * yieldValue, 1);
    case 'takt':
      return a / b;
    case 'kanban':
      return a * b + c;
    case 'va':
      return (a / b) * 100;
    case 'smed':
      return a - b;
    case 'mean':
      return inputs.reduce((sum, value) => sum + value, 0) / inputs.length;
    case 'median': {
      const sorted = [...inputs].sort((left, right) => left - right);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    case 'cp':
    case 'pp':
      return (a - b) / (6 * c);
    case 'cpk':
    case 'ppk':
      return Math.min((a - c) / (3 * d), (c - b) / (3 * d));
    case 'ucl':
      return a + b * c;
    case 'lcl':
      return a - b * c;
    case 'tstat':
      return (a - b) / (c / Math.sqrt(d));
    case 'chi2': {
      let sum = 0;
      for (let index = 0; index < inputs.length; index += 2) {
        const observed = inputs[index];
        const expected = inputs[index + 1];
        sum += (observed - expected) ** 2 / expected;
      }
      return sum;
    }
    case 'pearson': {
      const xs: number[] = [];
      const ys: number[] = [];
      for (let index = 0; index < inputs.length; index += 2) {
        xs.push(inputs[index]);
        ys.push(inputs[index + 1]);
      }
      const n = xs.length;
      const mx = xs.reduce((sum, value) => sum + value, 0) / n;
      const my = ys.reduce((sum, value) => sum + value, 0) / n;
      let num = 0;
      let dx = 0;
      let dy = 0;
      for (let index = 0; index < n; index += 1) {
        const vx = xs[index] - mx;
        const vy = ys[index] - my;
        num += vx * vy;
        dx += vx * vx;
        dy += vy * vy;
      }
      return num / Math.sqrt(dx * dy);
    }
    case 'slope':
    case 'intercept': {
      const xs: number[] = [];
      const ys: number[] = [];
      for (let index = 0; index < inputs.length; index += 2) {
        xs.push(inputs[index]);
        ys.push(inputs[index + 1]);
      }
      const n = xs.length;
      const mx = xs.reduce((sum, value) => sum + value, 0) / n;
      const my = ys.reduce((sum, value) => sum + value, 0) / n;
      let num = 0;
      let den = 0;
      for (let index = 0; index < n; index += 1) {
        num += (xs[index] - mx) * (ys[index] - my);
        den += (xs[index] - mx) ** 2;
      }
      const slope = num / den;
      if (formula === 'slope') return slope;
      return my - slope * mx;
    }
    case 'runs':
      return 2 ** a;
    case 'fraction':
      return 2 ** (a - b);
    case 'gage':
      return (a / b) * 100;
    case 'pareto': {
      const keep = a;
      const counts = inputs.slice(1);
      const total = counts.reduce((sum, value) => sum + value, 0);
      const top = [...counts].sort((left, right) => right - left).slice(0, keep).reduce((sum, value) => sum + value, 0);
      return (top / total) * 100;
    }
    case 'anovaF': {
      const perGroup = a;
      const values = inputs.slice(1);
      const groups = values.length / perGroup;
      const means: number[] = [];
      for (let group = 0; group < groups; group += 1) {
        const slice = values.slice(group * perGroup, group * perGroup + perGroup);
        means.push(slice.reduce((sum, value) => sum + value, 0) / perGroup);
      }
      const grand = values.reduce((sum, value) => sum + value, 0) / values.length;
      let between = 0;
      let within = 0;
      for (let group = 0; group < groups; group += 1) {
        between += perGroup * (means[group] - grand) ** 2;
        const slice = values.slice(group * perGroup, group * perGroup + perGroup);
        for (const value of slice) within += (value - means[group]) ** 2;
      }
      const dfBetween = groups - 1;
      const dfWithin = values.length - groups;
      return between / dfBetween / (within / dfWithin);
    }
    case 'pucl':
      return a + c * Math.sqrt((a * (1 - a)) / b);
    case 'predict':
      return a + b * c;
    case 'sigma': {
      const table: Record<string, number> = { '3.4': 6, '233': 5, '6210': 4, '66807': 3, '308538': 2 };
      const key = String(a);
      if (!(key in table)) throw new Error(`sigma inconnu: ${key}`);
      return table[key];
    }
    default:
      throw new Error(`formule inconnue: ${formula}`);
  }
}

const RULES: Record<string, { minQ: number; maxQ: number; mock: number; minutes: number; kinds: Array<LssQuestion['kind']> }> = {
  'lss-white': { minQ: 30, maxQ: 45, mock: 15, minutes: 20, kinds: ['mcq', 'tf', 'calc'] },
  'lss-yellow': { minQ: 30, maxQ: 45, mock: 18, minutes: 30, kinds: ['mcq', 'tf', 'calc'] },
  'lss-green': { minQ: 60, maxQ: 80, mock: 30, minutes: 60, kinds: ['mcq', 'tf', 'calc'] },
  'lss-black': { minQ: 80, maxQ: 100, mock: 40, minutes: 90, kinds: ['mcq', 'tf', 'calc'] },
};

function filled(value: { fr: string; en: string; ar: string } | undefined): boolean {
  return !!value && !!value.fr.trim() && !!value.en.trim() && !!value.ar.trim();
}

const ids = new Set<string>();
for (const belt of lssBelts) {
  const rule = RULES[belt.id];
  assert(rule, `règle manquante pour ${belt.id}`);
  assert(belt.questions.length >= rule.minQ && belt.questions.length <= rule.maxQ, `${belt.id} banque ${belt.questions.length}`);
  assert(belt.quiz.length === belt.questions.length, `${belt.id} quiz`);
  assert(belt.mockIds.length === rule.mock, `${belt.id} mock`);
  assert(belt.mockMinutes === rule.minutes, `${belt.id} durée`);
  assert(belt.lessons.length >= 4, `${belt.id} leçons`);
  assert(belt.cards.length >= 6, `${belt.id} cartes`);
  assert(belt.cases.length >= 1, `${belt.id} cas`);
  assert(belt.formulas.length >= 1, `${belt.id} formules`);
  assert(/certification/i.test(belt.attestation.fr), `${belt.id} attestation fr`);
  assert(/accrédit/i.test(belt.attestation.fr), `${belt.id} accréditation fr`);
  assert(/not an accredited certification/i.test(belt.attestation.en), `${belt.id} attestation en`);
  assert(/معتمدة/.test(belt.attestation.ar), `${belt.id} attestation ar`);
  const kinds = new Set(belt.questions.map((question) => question.kind));
  for (const kind of rule.kinds) assert(kinds.has(kind), `${belt.id} manque ${kind}`);
  const mock = mockQuestions(belt);
  assert(mock.length === belt.mockIds.length, `${belt.id} mock résolu`);
  assert(new Set(belt.mockIds).size === belt.mockIds.length, `${belt.id} mock dupliqué`);
  for (const kind of rule.kinds) assert(mock.some((question) => question.kind === kind), `${belt.id} mock sans ${kind}`);

  for (const lesson of belt.lessons) {
    assert(lesson.minutes >= 3 && lesson.minutes <= 7, `${lesson.id} minutes`);
    assert(lesson.screens.length >= 2, `${lesson.id} écrans`);
    assert(filled(lesson.title), `${lesson.id} titre`);
    assert(lesson.provenance.status === 'original' || lesson.provenance.verify, `${lesson.id} provenance`);
  }
  for (const question of belt.questions) {
    assert(!ids.has(question.id), `id dupliqué ${question.id}`);
    ids.add(question.id);
    assert(question.moduleId === belt.id, `${question.id} module`);
    assert(filled(question.prompt), `${question.id} énoncé`);
    assert(filled(question.why), `${question.id} explication`);
    assert(question.options.length >= 2, `${question.id} options`);
    assert(question.answer >= 0 && question.answer < question.options.length, `${question.id} index`);
    const signatures = question.options.map((option) => `${option.fr}|${option.en}|${option.ar}`);
    assert(new Set(signatures).size === signatures.length, `${question.id} options identiques`);
    for (const option of question.options) assert(filled(option), `${question.id} option vide`);
    const winners = question.options.filter((_, index) => index === question.answer);
    assert(winners.length === 1, `${question.id} une seule bonne réponse`);
    if (question.kind === 'calc') {
      assert(question.work, `${question.id} calcul sans formule`);
      const value = roundTo(compute(question.work.formula, question.work.inputs), question.work.places);
      const hits = question.options.filter((option) => {
        const found = [option.fr, option.en, option.ar].map(parseNum);
        return found.every((item) => item !== null && roundTo(item, question.work!.places) === value);
      });
      assert(hits.length === 1, `${question.id} valeur ${value} trouvée ${hits.length} fois`);
      const chosen = question.options[question.answer];
      const chosenNum = parseNum(chosen.fr);
      assert(chosenNum !== null && roundTo(chosenNum, question.work.places) === value, `${question.id} index ne porte pas ${value}`);
    } else {
      assert(!question.work, `${question.id} formule sur une question non chiffrée`);
    }
    if (question.kind === 'tf') {
      assert(question.options.length === 2, `${question.id} vrai/faux`);
    }
  }
  for (const reading of belt.readings) {
    assert(reading.provenance.url?.startsWith('https://'), `${reading.id} url`);
    assert(reading.provenance.verify, `${reading.id} verify`);
  }
}

assert(lssBelts.length === Object.keys(RULES).length, 'ceintures et règles');
const orders = lssBelts.map((belt) => belt.order);
assert(orders.join() === lssBelts.map((_, index) => index + 1).join(), `ordre ${orders.join()}`);

const fresh = defaultStudyState();
assert(lessonAllowed('lss-white', fresh), 'blanche ouverte');
assert(!lessonAllowed('lss-yellow', fresh), 'jaune fermée');
assert(!lessonAllowed('lss-green', fresh), 'verte fermée');
assert(!lessonAllowed('lss-black', fresh), 'noire fermée');
assert(lessonAllowed('strategy', fresh), 'module MBA intact');

const gates: BeltGate[] = [
  { id: 'a', order: 1, lessonIds: ['a1'] },
  { id: 'b', order: 2, lessonIds: ['b1'] },
];
assert(beltOpen(gates[0], gates, fresh), 'première ouverte');
assert(!beltOpen(gates[1], gates, fresh), 'deuxième fermée');
const almost = {
  ...fresh,
  lessons: { a1: { screen: 0, doneAt: 1 } },
  exams: { 'a:mock': { correct: 6, total: 10, at: 1 } },
};
assert(!beltHeld(gates[0], almost), '60 % ne tient pas');
assert(!beltOpen(gates[1], gates, almost), 'porte fermée');
const held = {
  ...almost,
  exams: { 'a:mock': { correct: 7, total: 10, at: 1 } },
};
assert(beltHeld(gates[0], held), '70 % tient');
assert(beltOpen(gates[1], gates, held), 'porte ouverte');

const scored = scoreMock([0, 1, 2], [0, 0, null]);
assert(scored.correct === 1 && scored.total === 3 && scored.misses.length === 2, 'score');
assert(scored.misses[1]?.picked === null, 'sans réponse');
assert(formatClock(75) === '1:15', 'chrono');
assert(formatClock(0) === '0:00', 'chrono nul');

const mba = contentProblems();
assert(mba.length === 0, `MBA: ${mba.slice(0, 8).join(', ')}`);
assert(modules.length === 15, '15 modules MBA');
assert(!modules.some((mod) => mod.id.startsWith('lss-')), 'le parcours 92 jours ne contient pas les ceintures');

const counts = lssBelts.map((belt) => `${belt.id} leçons=${belt.lessons.length} questions=${belt.questions.length} mock=${belt.mockIds.length}`).join('\n');
console.log('lss checks ok');
console.log(counts);
