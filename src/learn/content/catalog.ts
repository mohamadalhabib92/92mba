import { L, team } from '../l10n';
import type { Capstone, Provenance, StudyModule, StudyPath } from '../types';
import { moduleBodies } from './modulesRichStart';
import { moreModules } from './modulesMid';
import { endModules } from './modulesEnd';
import { formulas, glossary, openReadings } from './shared';

const ORDER = [
  'strategy',
  'financial-accounting',
  'managerial-accounting',
  'corporate-finance',
  'economics',
  'marketing',
  'operations',
  'leadership',
  'hr',
  'statistics',
  'negotiation',
  'entrepreneurship',
  'law-ethics',
  'international',
  'digital',
] as const;

const bodies = [...moduleBodies, ...moreModules, ...endModules];

export const modules: StudyModule[] = ORDER.map((id) => {
  const body = bodies.find((item) => item.id === id);
  if (!body) throw new Error(`module manquant: ${id}`);
  return {
    ...body,
    formulas: formulas.filter((item) => item.moduleId === id),
    readings: openReadings.filter((item) => item.moduleId === id),
  };
});

export const PATH_92: StudyPath = {
  id: 'mba-92',
  days: 92,
  title: L('MBA en 92 jours', 'MBA in 92 days', 'ماجستير في 92 يوماً'),
  summary: L(
    'Un module à la fois, environ six jours, puis deux jours pour le cas final. Ce n’est pas un diplôme. Vous pouvez aussi explorer librement.',
    'One module at a time, about six days, then two days for the final case. This is not a degree. You can also explore freely.',
    'وحدة في كل مرة، نحو ستة أيام، ثم يومان للحالة الختامية. هذا ليس شهادة. يمكن أيضاً الاستكشاف بحرية.',
  ),
  steps: [
    ...ORDER.map((id, index) => ({ from: index * 6 + 1, to: index * 6 + 6, moduleId: id })),
    { from: 91, to: 92, moduleId: 'capstone' },
  ],
};

export const capstone: Capstone = {
  id: 'capstone-leman',
  title: L('Cas final — Atelier Léman', 'Final case — Atelier Léman', 'الحالة الختامية — مشغل ليمان'),
  minutes: 12,
  scenes: [
    {
      title: L('La société', 'The firm', 'الشركة'),
      body: L(
        'Atelier Léman est une société fictive, douze personnes, à Renens. Elle règle des composants d’horlogerie. Un client fait 70 % du chiffre. Une enseigne propose un gros volume à un prix sous le coût variable. Un distributeur allemand paierait en euros.',
        'Atelier Léman is a fictional firm, twelve people, in Renens. It adjusts watch components. One client is 70% of revenue. A retailer offers a large volume below variable cost. A German distributor would pay in euros.',
        'مشغل ليمان شركة خيالية، اثنا عشر شخصاً، في رينان. يضبط مكوّنات ساعات. عميل واحد 70٪ من الرقم. متجر يعرض حجماً كبيراً دون التكلفة المتغيرة. موزّع ألماني سيدفع باليورو.',
      ),
    },
    {
      title: L('Ce que vous avez en main', 'What you have in hand', 'ما في أيديكم'),
      body: L(
        'Actifs 80, dettes 50. Marge unitaire 5 sur le réglage, prix enseigne sous le variable. Délai du composant critique : 10 jours, un seul fournisseur. L’équipe veut « passer en SA » sans avoir ouvert Fedlex.',
        'Assets 80, liabilities 50. Unit margin 5 on adjustment, retailer price below variable cost. Lead time of the critical part: 10 days, one supplier. The team wants to “become a company limited by shares” without opening Fedlex.',
        'أصول 80 وديون 50. هامش الوحدة 5 على الضبط، وسعر المتجر دون المتغير. مهلة القطعة الحرجة 10 أيام ومورّد واحد. الفريق يريد «التحول إلى مساهمة» من دون فتح Fedlex.',
      ),
    },
  ],
  decisions: [
    {
      id: 'cap-1',
      moduleId: 'capstone',
      prompt: L('L’enseigne sous le coût variable. Premier geste ?', 'The retailer is below variable cost. First move?', 'المتجر دون التكلفة المتغيرة. أول حركة؟'),
      options: [
        L('Nommer la perte par pièce et refuser, sauf intérêt écrit.', 'Name the loss per part and refuse, unless a written interest.', 'تسمية الخسارة لكل قطعة والرفض إلا لمصلحة مكتوبة.'),
        L('Accepter pour le volume.', 'Accept for the volume.', 'القبول من أجل الحجم.'),
        L('Baisser tous les prix de 30 %.', 'Cut every price by 30%.', 'خفض كل الأسعار 30٪.'),
      ],
      answer: 0,
      why: L('Le volume sous le variable aggrave la perte.', 'Volume below variable cost makes the loss worse.', 'الحجم دون المتغير يزيد الخسارة.'),
      provenance: team(),
    },
    {
      id: 'cap-2',
      moduleId: 'capstone',
      prompt: L('Capitaux propres ?', 'Equity?', 'حقوق الملكية؟'),
      options: [L('30', '30', '30'), L('130', '130', '130'), L('80', '80', '80')],
      answer: 0,
      why: L('80 = 50 + 30.', '80 = 50 + 30.', '80 = 50 + 30.'),
      provenance: team(),
    },
    {
      id: 'cap-3',
      moduleId: 'capstone',
      prompt: L('Le distributeur paie en euros, les salaires sont en francs.', 'The distributor pays in euros, wages are in francs.', 'الموزّع يدفع باليورو والرواتب بالفرنك.'),
      options: [
        L('Écrire qui porte le change. Le cours du jour se vérifie, il n’est pas dans le cas.', 'Write who carries the currency. Today’s rate is checked, it is not in the case.', 'اكتبوا من يحمل الصرف. سعر اليوم يُتحقق منه وليس في الحالة.'),
        L('Ignorer la devise.', 'Ignore the currency.', 'تجاهل العملة.'),
        L('Fixer 1 euro = 1 franc pour cinq ans.', 'Set 1 euro = 1 franc for five years.', 'تثبيت 1 يورو = 1 فرنك لخمس سنوات.'),
      ],
      answer: 0,
      why: L('Sans phrase, la marge flotte.', 'Without a sentence, the margin floats.', 'من دون جملة يطفو الهامش.'),
      provenance: team(),
    },
    {
      id: 'cap-4',
      moduleId: 'capstone',
      prompt: L('« Passer en SA » cette semaine ?', '“Become a company limited by shares” this week?', '«التحول إلى مساهمة» هذا الأسبوع؟'),
      options: [
        L('Non. Les conditions se lisent sur Fedlex le jour dit. Aucun article ici.', 'No. Conditions are read on Fedlex on the day. No article here.', 'لا. الشروط تُقرأ على Fedlex في اليوم. لا مادة هنا.'),
        L('Oui, le capital est toujours 1 franc.', 'Yes, capital is always 1 franc.', 'نعم، رأس المال دائماً فرنك.'),
        L('Oui, cette app vaut une décision notariale.', 'Yes, this app equals a notary’s decision.', 'نعم، هذا التطبيق يساوي قراراً لدى كاتب العدل.'),
      ],
      answer: 0,
      why: L('La forme juridique ne se devine pas.', 'The legal form is not guessed.', 'الشكل القانوني لا يُخمَّن.'),
      provenance: team(),
    },
  ],
  provenance: team('Cas fictif. Aucune société réelle n’est visée. Pas un conseil juridique, fiscal ou de placement.'),
};

export { glossary, formulas, openReadings };

export type Coverage = {
  id: string;
  richness: 'rich' | 'thin';
  lessons: number;
  cards: number;
  quiz: number;
  cases: number;
  formulas: number;
  readings: number;
  minutes: number;
};

export function coverage(): Coverage[] {
  return modules.map((mod) => ({
    id: mod.id,
    richness: mod.richness,
    lessons: mod.lessons.length,
    cards: mod.cards.length,
    quiz: mod.quiz.length,
    cases: mod.cases.length,
    formulas: mod.formulas.length,
    readings: mod.readings.length,
    minutes: mod.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0) + mod.cases.reduce((sum, item) => sum + item.minutes, 0),
  }));
}

const STATUSES = new Set(['original', 'public-domain', 'open', 'needs-review']);

function checkProvenance(id: string, provenance: Provenance | undefined, problems: string[]) {
  if (!provenance) {
    problems.push(`${id}:provenance`);
    return;
  }
  if (!provenance.author.trim()) problems.push(`${id}:author`);
  if (!provenance.date.trim()) problems.push(`${id}:date`);
  if (!provenance.source.trim()) problems.push(`${id}:source`);
  if (!provenance.licence.trim()) problems.push(`${id}:licence`);
  if (!STATUSES.has(provenance.status)) problems.push(`${id}:status`);
  if ((provenance.status === 'needs-review' || provenance.status === 'public-domain' || provenance.status === 'open') && !provenance.verify?.trim()) {
    problems.push(`${id}:verify`);
  }
  if ((provenance.status === 'open' || provenance.licence.toLowerCase().includes('openstax') || provenance.url) && provenance.url && !provenance.url.startsWith('https://')) {
    problems.push(`${id}:url`);
  }
}

function checkL10n(id: string, value: { fr: string; en: string; ar: string } | undefined, problems: string[]) {
  if (!value || !value.fr.trim() || !value.en.trim() || !value.ar.trim()) problems.push(`${id}:l10n`);
}

/** Contrôle de schéma et de licence. Vide = le cours est publiable dans l’app. */
export function contentProblems(): string[] {
  const problems: string[] = [];
  if (modules.length !== 15) problems.push(`modules:${modules.length}`);
  const ids = new Set<string>();
  for (const mod of modules) {
    if (ids.has(mod.id)) problems.push(`${mod.id}:dup`);
    ids.add(mod.id);
    checkL10n(mod.id, mod.title, problems);
    checkL10n(`${mod.id}:promise`, mod.promise, problems);
    const minLessons = mod.richness === 'rich' ? 3 : 2;
    const minCards = mod.richness === 'rich' ? 6 : 4;
    const minQuiz = mod.richness === 'rich' ? 5 : 4;
    if (mod.lessons.length < minLessons) problems.push(`${mod.id}:lessons`);
    if (mod.cards.length < minCards) problems.push(`${mod.id}:cards`);
    if (mod.quiz.length < minQuiz) problems.push(`${mod.id}:quiz`);
    if (mod.cases.length < 1) problems.push(`${mod.id}:case`);
    for (const lesson of mod.lessons) {
      if (lesson.minutes < 3 || lesson.minutes > 7) problems.push(`${lesson.id}:minutes`);
      if (lesson.screens.length < 2) problems.push(`${lesson.id}:screens`);
      checkL10n(lesson.id, lesson.title, problems);
      checkProvenance(lesson.id, lesson.provenance, problems);
      lesson.screens.forEach((screen, index) => {
        const sid = `${lesson.id}:${index}`;
        if (screen.kind === 'check') {
          checkL10n(sid, screen.prompt, problems);
          if (screen.options.length < 2 || screen.answer < 0 || screen.answer >= screen.options.length) problems.push(`${sid}:answer`);
          screen.options.forEach((option, optionIndex) => checkL10n(`${sid}:o${optionIndex}`, option, problems));
          checkL10n(`${sid}:why`, screen.why, problems);
        } else {
          checkL10n(sid, screen.title, problems);
          checkL10n(`${sid}:body`, screen.body, problems);
        }
      });
    }
    for (const card of mod.cards) {
      checkL10n(card.id, card.front, problems);
      checkL10n(`${card.id}:back`, card.back, problems);
      checkProvenance(card.id, card.provenance, problems);
    }
    for (const quiz of mod.quiz) {
      checkL10n(quiz.id, quiz.prompt, problems);
      if (quiz.answer < 0 || quiz.answer >= quiz.options.length) problems.push(`${quiz.id}:answer`);
      checkProvenance(quiz.id, quiz.provenance, problems);
    }
    for (const item of mod.cases) {
      if (item.minutes < 3 || item.minutes > 7) problems.push(`${item.id}:minutes`);
      checkProvenance(item.id, item.provenance, problems);
    }
    for (const formula of mod.formulas) {
      if (!formula.expression.trim()) problems.push(`${formula.id}:expression`);
      checkProvenance(formula.id, formula.provenance, problems);
    }
    for (const reading of mod.readings) {
      if (!reading.provenance.url?.startsWith('https://')) problems.push(`${reading.id}:url`);
      checkProvenance(reading.id, reading.provenance, problems);
      if (!reading.provenance.licence.toLowerCase().includes('vérifier') && !reading.provenance.verify) problems.push(`${reading.id}:licence-note`);
    }
  }
  for (const entry of glossary) checkProvenance(entry.id, entry.provenance, problems);
  if (glossary.length < 20) problems.push(`glossary:${glossary.length}`);
  checkProvenance(capstone.id, capstone.provenance, problems);
  if (capstone.decisions.length < 4) problems.push('capstone:decisions');
  for (const decision of capstone.decisions) checkProvenance(decision.id, decision.provenance, problems);
  if (PATH_92.days !== 92 || PATH_92.steps[PATH_92.steps.length - 1]?.to !== 92) problems.push('path');
  const copied = JSON.stringify(modules).toLowerCase();
  if (copied.includes('lorem ipsum')) problems.push('lorem');
  return problems;
}

export function verifyNotes(): { id: string; verify: string }[] {
  const notes: { id: string; verify: string }[] = [];
  const take = (id: string, provenance: Provenance) => {
    if (provenance.verify) notes.push({ id, verify: provenance.verify });
    else if (provenance.status === 'needs-review' || provenance.status === 'public-domain') notes.push({ id, verify: provenance.licence });
  };
  for (const mod of modules) {
    for (const lesson of mod.lessons) take(lesson.id, lesson.provenance);
    for (const card of mod.cards) take(card.id, card.provenance);
    for (const reading of mod.readings) take(reading.id, reading.provenance);
    for (const formula of mod.formulas) if (formula.provenance.verify) take(formula.id, formula.provenance);
  }
  take(capstone.id, capstone.provenance);
  return notes;
}
