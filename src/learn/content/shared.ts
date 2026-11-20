import { L, publicDomain, team } from '../l10n';
import type { Formula, GlossaryEntry, OpenReading, StudyModule } from '../types';

const readMgmt: OpenReading = {
  id: 'read-openstax-management',
  moduleId: 'strategy',
  title: L(
    'Pour aller plus loin — OpenStax, Principles of Management',
    'Further reading — OpenStax, Principles of Management',
    'للمتابعة — OpenStax، مبادئ الإدارة',
  ),
  note: L(
    'Aucun passage du manuel n’est recopié. Le PDF 2019 indique CC BY 4.0. La préface web consultée indique CC BY-NC-SA 4.0. La licence exacte de l’édition que vous ouvrez est à vérifier avant toute reproduction.',
    'No textbook passage is copied. The 2019 PDF states CC BY 4.0. The web preface checked for this app states CC BY-NC-SA 4.0. Confirm the edition’s licence before reproducing anything.',
    'لا ننسخ فقرات من الكتاب. ملف 2019 يذكر CC BY 4.0. مقدمة الموقع التي روجعت تذكر CC BY-NC-SA 4.0. يُتحقق من ترخيص الطبعة قبل أي نقل.',
  ),
  provenance: {
    author: 'OpenStax, Rice University',
    date: '2019',
    source: 'Principles of Management — page du livre',
    licence: 'CC BY 4.0 sur le PDF 2019 ; CC BY-NC-SA 4.0 sur la préface web — à vérifier',
    status: 'needs-review',
    url: 'https://openstax.org/details/books/principles-management',
    verify: 'Les deux mentions de licence ne concordent pas. Aucun extrait n’est inclus.',
  },
};

const readAccounting: OpenReading = {
  id: 'read-openstax-accounting',
  moduleId: 'financial-accounting',
  title: L(
    'Pour aller plus loin — OpenStax, Principles of Accounting',
    'Further reading — OpenStax, Principles of Accounting',
    'للمتابعة — OpenStax، مبادئ المحاسبة',
  ),
  note: L(
    'Pointeur seulement. Les leçons de ce module sont originales. Vérifiez la licence de l’édition (souvent CC BY ou CC BY-NC-SA selon le volume) avant de citer le manuel.',
    'A pointer only. Lessons in this module are original. Check the edition licence (often CC BY or CC BY-NC-SA depending on the volume) before quoting the textbook.',
    'رابط فقط. دروس هذه الوحدة أصلية. تحقق من ترخيص الطبعة قبل الاقتباس.',
  ),
  provenance: {
    author: 'OpenStax, Rice University',
    date: '2019',
    source: 'Principles of Accounting, Volume 1: Financial Accounting',
    licence: 'Licence d’édition à vérifier (OpenStax publie en CC BY ou CC BY-NC-SA selon le volume)',
    status: 'needs-review',
    url: 'https://openstax.org/details/books/principles-financial-accounting',
    verify: 'URL et licence d’édition à confirmer sur openstax.org avant citation.',
  },
};

const readEcon: OpenReading = {
  id: 'read-openstax-econ',
  moduleId: 'economics',
  title: L(
    'Pour aller plus loin — OpenStax, Principles of Economics',
    'Further reading — OpenStax, Principles of Economics',
    'للمتابعة — OpenStax، مبادئ الاقتصاد',
  ),
  note: L(
    'Pointeur seulement, micro et macro. Aucun chapitre n’est recopié.',
    'Pointer only, micro and macro. No chapter is copied.',
    'رابط فقط، للاقتصاد الجزئي والكلي. لا ننسخ فصلاً.',
  ),
  provenance: {
    author: 'OpenStax, Rice University',
    date: '2022',
    source: 'Principles of Economics 3e',
    licence: 'CC BY 4.0 annoncé par OpenStax pour plusieurs éditions — à vérifier sur la page du livre',
    status: 'needs-review',
    url: 'https://openstax.org/details/books/principles-economics-3e',
    verify: 'Confirmer CC BY 4.0 sur l’édition ouverte avant toute citation.',
  },
};

const readStats: OpenReading = {
  id: 'read-openstax-stats',
  moduleId: 'statistics',
  title: L(
    'Pour aller plus loin — OpenStax, Introductory Business Statistics',
    'Further reading — OpenStax, Introductory Business Statistics',
    'للمتابعة — OpenStax، الإحصاء للأعمال',
  ),
  note: L(
    'Le PDF 2018 consulté porte la mention CC BY 4.0. Les formules de ce module sont des définitions usuelles, rédigées ici, pas un extrait du manuel.',
    'The 2018 PDF that was checked states CC BY 4.0. Formulas in this module are standard definitions written here, not a textbook extract.',
    'ملف 2018 الذي روجع يذكر CC BY 4.0. صيغ هذه الوحدة تعريفات شائعة كُتبت هنا، وليست مقتطفاً.',
  ),
  provenance: {
    author: 'OpenStax, Rice University',
    date: '2018',
    source: 'Introductory Business Statistics, PDF OpenStax',
    licence: 'CC BY 4.0 sur le PDF 2018 — à vérifier pour l’édition 2e',
    status: 'needs-review',
    url: 'https://openstax.org/details/books/introductory-business-statistics',
    verify: 'La mention CC BY 4.0 a été lue sur le PDF 2018, pas recopiée comme texte de cours.',
  },
};

const readEnt: OpenReading = {
  id: 'read-openstax-ent',
  moduleId: 'entrepreneurship',
  title: L(
    'Pour aller plus loin — OpenStax, Entrepreneurship',
    'Further reading — OpenStax, Entrepreneurship',
    'للمتابعة — OpenStax، ريادة الأعمال',
  ),
  note: L(
    'Pointeur seulement. Les mini-leçons restent un texte original.',
    'Pointer only. The micro-lessons stay original writing.',
    'رابط فقط. الدروس القصيرة تبقى نصاً أصلياً.',
  ),
  provenance: {
    author: 'OpenStax, Rice University',
    date: '2020',
    source: 'Entrepreneurship',
    licence: 'Licence d’édition à vérifier sur openstax.org',
    status: 'needs-review',
    url: 'https://openstax.org/details/books/entrepreneurship',
    verify: 'Ne pas citer le manuel tant que la licence de l’édition ouverte n’est pas confirmée.',
  },
};

export const openReadings: OpenReading[] = [readMgmt, readAccounting, readEcon, readStats, readEnt];

export const formulas: Formula[] = [
  {
    id: 'f-balance',
    moduleId: 'financial-accounting',
    name: L('Équation du bilan', 'Balance-sheet equation', 'معادلة الميزانية'),
    expression: 'Actifs = Dettes + Capitaux propres',
    meaning: L(
      'Ce que l’entreprise contrôle est financé soit par des tiers, soit par les propriétaires.',
      'What the firm controls is financed either by outsiders or by the owners.',
      'ما تسيطر عليه المنشأة مُموَّل إما من الغير وإما من المالكين.',
    ),
    provenance: team(),
  },
  {
    id: 'f-current',
    moduleId: 'financial-accounting',
    name: L('Ratio de liquidité générale', 'Current ratio', 'نسبة التداول'),
    expression: 'Actifs courants / Passifs courants',
    meaning: L(
      'Une lecture simple de la trésorerie à court terme. Ce n’est pas un jugement de solvabilité à lui seul.',
      'A simple reading of short-term cash cover. It is not a solvency verdict on its own.',
      'قراءة بسيطة للغطاء النقدي القصير. ليست وحدها حكماً على الملاءة.',
    ),
    provenance: team(),
  },
  {
    id: 'f-contribution',
    moduleId: 'managerial-accounting',
    name: L('Marge sur coût variable', 'Contribution margin', 'هامش المساهمة'),
    expression: 'Prix unitaire − coût variable unitaire',
    meaning: L(
      'Ce que chaque unité vendue laisse pour couvrir les coûts fixes, puis le résultat.',
      'What each unit sold leaves to cover fixed costs, then profit.',
      'ما تتركه كل وحدة مباعة لتغطية التكاليف الثابتة ثم الربح.',
    ),
    provenance: team(),
  },
  {
    id: 'f-breakeven',
    moduleId: 'managerial-accounting',
    name: L('Seuil de rentabilité', 'Break-even volume', 'عتبة الربحية'),
    expression: 'Coûts fixes / marge sur coût variable unitaire',
    meaning: L(
      'Nombre d’unités à vendre pour un résultat nul, si le prix et les coûts restent ceux du calcul.',
      'Units to sell for zero profit, if price and costs stay as assumed.',
      'عدد الوحدات لنتيجة صفر، إذا بقي السعر والتكاليف كما في الفرض.',
    ),
    provenance: team(),
  },
  {
    id: 'f-npv',
    moduleId: 'corporate-finance',
    name: L('Valeur actuelle nette', 'Net present value', 'صافي القيمة الحالية'),
    expression: 'VAN = −I₀ + Σ Fluxₜ / (1 + r)ᵗ',
    meaning: L(
      'Un projet crée de la valeur quand la VAN est positive au taux qui rémunère le risque accepté.',
      'A project creates value when NPV is positive at the rate that pays for the risk you accept.',
      'المشروع يخلق قيمة عندما يكون صافي القيمة الحالية موجباً بالمعدل الذي يعوّض المخاطرة المقبولة.',
    ),
    provenance: team(),
  },
  {
    id: 'f-fv',
    moduleId: 'corporate-finance',
    name: L('Valeur future', 'Future value', 'القيمة المستقبلية'),
    expression: 'VF = VA × (1 + r)ᵗ',
    meaning: L(
      'Un franc aujourd’hui ne vaut pas un franc dans t années, si l’argent peut être placé au taux r.',
      'A franc today is not a franc in t years, if money can be invested at rate r.',
      'الفرنك اليوم ليس فرنكاً بعد t سنوات إذا أمكن استثمار المال بالمعدل r.',
    ),
    provenance: team(),
  },
  {
    id: 'f-mean',
    moduleId: 'statistics',
    name: L('Moyenne', 'Mean', 'المتوسط'),
    expression: 'x̄ = (x₁ + … + xₙ) / n',
    meaning: L(
      'Le centre de gravité des observations. Une valeur extrême peut le tirer loin de la médiane.',
      'The centre of mass of the observations. An outlier can pull it away from the median.',
      'مركز ثقل المشاهدات. قيمة شاذة قد تبعده عن الوسيط.',
    ),
    provenance: team(),
  },
  {
    id: 'f-vat',
    moduleId: 'law-ethics',
    name: L('TVA sur un prix hors taxe', 'VAT on a net price', 'ضريبة القيمة المضافة على سعر دون الضريبة'),
    expression: 'Taxe = prix hors taxe × taux ; prix TTC = prix hors taxe × (1 + taux)',
    meaning: L(
      'Le taux légal se vérifie auprès de l’AFC. Ici : normal 8,1 %, réduit 2,6 %, hébergement 3,8 %, lus le 15.11.2026 sur estv.admin.ch, à confirmer avant une facture.',
      'Confirm the legal rate with the FTA. Here: standard 8.1%, reduced 2.6%, accommodation 3.8%, read on 15 Nov 2026 at estv.admin.ch, confirm before invoicing.',
      'يُؤكد المعدل لدى الإدارة الفدرالية. هنا: عادي 8,1٪، مخفّض 2,6٪، إيواء 3,8٪، قُرئت في 15.11.2026 على estv.admin.ch، تُؤكد قبل الفاتورة.',
    ),
    provenance: team('Taux lus sur la page AFC « Taux de TVA applicables en Suisse » et le PDF « Impôts en vigueur » (état au 1.1.2026). À confirmer avant usage.'),
  },
];

const fayol = publicDomain(
  'Henri Fayol',
  '1916',
  'Administration industrielle et générale (1916). Noms usuels des principes, formulation originale, pas une traduction du livre.',
  'Fayol est mort en 1925 : le délai de 70 ans de la LDA suisse est dépassé. La formulation de la fiche n’est pas une édition du texte de 1916. À vérifier avant de citer une phrase du livre.',
);

export const glossary: GlossaryEntry[] = [
  ['avantage', 'strategy', 'Avantage concurrentiel', 'Competitive advantage', 'ميزة تنافسية', 'Écart durable entre ce que les clients préfèrent chez vous et ce que les rivaux offrent au même prix.', 'A lasting gap between what customers prefer about you and what rivals offer at the same price.', 'فرق دائم بين ما يفضّله العملاء عندك وما يقدّمه المنافسون بالسعر نفسه.'],
  ['swot', 'strategy', 'SWOT', 'SWOT', 'SWOT', 'Forces, faiblesses, opportunités, menaces : une page de diagnostic, pas une stratégie.', 'Strengths, weaknesses, opportunities, threats: a one-page diagnosis, not a strategy.', 'قوة، ضعف، فرص، تهديدات: صفحة تشخيص لا استراتيجية.'],
  ['bilan', 'financial-accounting', 'Bilan', 'Balance sheet', 'الميزانية', 'Photo, à une date, des actifs et de leur financement.', 'A snapshot, on one date, of assets and how they are financed.', 'صورة في تاريخ واحد للأصول وطريقة تمويلها.'],
  ['resultat', 'financial-accounting', 'Compte de résultat', 'Income statement', 'قائمة الدخل', 'Film de la période : produits moins charges.', 'The film of the period: income minus expenses.', 'فيلم الفترة: الإيرادات ناقص الأعباء.'],
  ['fixe', 'managerial-accounting', 'Coût fixe', 'Fixed cost', 'تكلفة ثابتة', 'Coût qui ne bouge pas avec le volume, dans la zone d’activité prévue.', 'A cost that does not move with volume, inside the activity range you planned.', 'تكلفة لا تتحرك مع الحجم داخل نطاق النشاط المخطط.'],
  ['variable', 'managerial-accounting', 'Coût variable', 'Variable cost', 'تكلفة متغيرة', 'Coût qui suit, à peu près, chaque unité en plus.', 'A cost that roughly follows each extra unit.', 'تكلفة تتبع تقريباً كل وحدة إضافية.'],
  ['van', 'corporate-finance', 'VAN', 'NPV', 'صافي القيمة الحالية', 'Somme des flux futurs ramenés à aujourd’hui, moins la mise initiale.', 'Future cash flows brought back to today, minus the initial outlay.', 'مجموع التدفقات المستقبلية مُعادة إلى اليوم، ناقص الإنفاق الأول.'],
  ['taux', 'corporate-finance', 'Taux d’actualisation', 'Discount rate', 'معدل الخصم', 'Le rendement exigé pour le risque que vous acceptez de porter.', 'The return required for the risk you agree to carry.', 'العائد المطلوب مقابل المخاطرة التي تقبل حملها.'],
  ['offre', 'economics', 'Offre et demande', 'Supply and demand', 'العرض والطلب', 'Le prix bouge quand la quantité voulue et la quantité offerte ne se rencontrent pas.', 'Price moves when the quantity wanted and the quantity offered do not meet.', 'يتحرك السعر عندما لا تلتقي الكمية المطلوبة بالكمية المعروضة.'],
  ['opportunite', 'economics', 'Coût d’opportunité', 'Opportunity cost', 'تكلفة الفرصة', 'La meilleure chose à laquelle vous renoncez en choisissant celle-ci.', 'The best thing you give up by choosing this one.', 'أفضل شيء تتخلى عنه حين تختار هذا.'],
  ['stp', 'marketing', 'STP', 'STP', 'تقسيم واستهداف وتموضع', 'Segmenter, choisir une cible, tenir une position claire dans sa tête.', 'Segment, choose a target, hold a clear place in their mind.', 'قسّم، اختر هدفاً، وثبّت مكاناً واضحاً في ذهنه.'],
  ['mix', 'marketing', 'Mix', 'Marketing mix', 'المزيج التسويقي', 'Produit, prix, place et promotion : quatre leviers qui doivent raconter la même chose.', 'Product, price, place and promotion: four levers that must tell the same story.', 'المنتج والسعر والمكان والترويج: أربع روافع تحكي القصة نفسها.'],
  ['goulot', 'operations', 'Goulot', 'Bottleneck', 'عنق الزجاجة', 'L’étape la plus lente fixe le débit de toute la chaîne.', 'The slowest step sets the throughput of the whole chain.', 'أبطأ خطوة تحدد إنتاج السلسلة كلها.'],
  ['feedback', 'leadership', 'Feedback', 'Feedback', 'تغذية راجعة', 'Un fait observé, son effet, et une demande précise. Pas un jugement sur la personne.', 'An observed fact, its effect, and a precise request. Not a judgement of the person.', 'واقعة مُشاهَدة، أثرها، وطلب دقيق. ليس حكماً على الشخص.'],
  ['delegation', 'leadership', 'Délégation', 'Delegation', 'تفويض', 'Confier un résultat, un délai et une marge de décision, pas seulement une liste de tâches.', 'Hand over an outcome, a deadline and a margin of decision, not only a task list.', 'تسليم نتيجة وموعد وهامش قرار، لا قائمة مهام فحسب.'],
  ['rh', 'hr', 'Cycle RH', 'HR cycle', 'دورة الموارد البشرية', 'Attirer, accueillir, faire grandir, reconnaître, et séparer correctement.', 'Attract, welcome, grow, recognise, and separate properly.', 'اجذب، رحّب، طوّر، اعترف، وافصل بطريقة سليمة.'],
  ['mediane', 'statistics', 'Médiane', 'Median', 'الوسيط', 'La valeur du milieu quand les observations sont rangées. Elle résiste mieux qu’une moyenne à un extrême.', 'The middle value once observations are ordered. It resists an extreme better than the mean.', 'القيمة الوسطى بعد الترتيب. تقاوم الطرف الشاذ أفضل من المتوسط.'],
  ['ecart', 'statistics', 'Dispersion', 'Spread', 'التشتت', 'À moyenne égale, deux séries peuvent être calmes ou très écartées.', 'With the same mean, two series can be calm or widely scattered.', 'بمتوسط واحد قد تكون سلسلتان هادئتين أو شديدتي التباعد.'],
  ['batna', 'negotiation', 'Solution de rechange', 'Best alternative', 'البديل الأفضل', 'Ce que vous ferez si l’accord ne se fait pas. Elle fixe le plancher, pas le rêve.', 'What you will do if there is no deal. It sets the floor, not the dream.', 'ما ستفعله إذا لم يتم الاتفاق. يحدد الأرضية لا الحلم.'],
  ['ancre', 'negotiation', 'Ancrage', 'Anchoring', 'الإرساء', 'Le premier nombre posé sur la table tire la suite, même quand il est arbitraire.', 'The first number on the table pulls what follows, even when it is arbitrary.', 'أول رقم على الطاولة يجرّ ما بعده حتى لو كان اعتباطياً.'],
  ['hypothese', 'entrepreneurship', 'Hypothèse', 'Hypothesis', 'فرضية', 'Une phrase testable : qui a le problème, et quel signe montrera que votre offre l’aide.', 'A testable sentence: who has the problem, and what sign will show that your offer helps.', 'جملة قابلة للاختبار: من صاحب المشكلة، وأي علامة تُظهر أن عرضك يساعد.'],
  ['sarl', 'law-ethics', 'Sàrl', 'Limited liability company', 'شركة ذات مسؤولية محدودة', 'Forme de société du code des obligations. Capital, organes et responsabilité : à vérifier sur Fedlex, aucun article n’est cité ici.', 'A company form in the Code of Obligations. Capital, bodies and liability: check Fedlex. No article is cited here.', 'شكل شركة في قانون الالتزامات. رأس المال والأجهزة والمسؤولية: تُراجع على Fedlex. لا نذكر رقماً لمادة.'],
  ['sa', 'law-ethics', 'SA', 'Company limited by shares', 'شركة مساهمة', 'Société anonyme du code des obligations. Les conditions en vigueur se lisent sur Fedlex, pas de mémoire.', 'A company limited by shares under the Code of Obligations. Current conditions are read on Fedlex, not from memory.', 'شركة مساهمة وفق قانون الالتزامات. الشروط السارية تُقرأ على Fedlex لا من الذاكرة.'],
  ['tva', 'law-ethics', 'TVA', 'VAT', 'ضريبة القيمة المضافة', 'Impôt sur le chiffre d’affaires suisse. Les taux se confirment auprès de l’AFC.', 'Swiss tax on turnover. Rates are confirmed with the FTA.', 'ضريبة على رقم الأعمال السويسري. المعدلات تُؤكد لدى الإدارة.'],
  ['change', 'international', 'Risque de change', 'Currency risk', 'مخاطر الصرف', 'Le prix en francs bouge quand le contrat est dans une autre monnaie.', 'The franc price moves when the contract is in another currency.', 'سعر الفرنك يتحرك حين يكون العقد بعملة أخرى.'],
  ['processus', 'digital', 'Processus avant outil', 'Process before tool', 'العملية قبل الأداة', 'Un logiciel n’améliore pas une décision dont personne ne connaît l’entrée ni la sortie.', 'Software does not improve a decision whose input and output nobody can name.', 'البرنامج لا يحسّن قراراً لا يعرف أحد مدخله ومخرجه.'],
].map(([id, moduleId, fr, en, ar, dfr, den, dar]) => ({
  id: `g-${id}`,
  moduleId,
  term: L(fr, en, ar),
  definition: L(dfr, den, dar),
  provenance: team(),
}));

export const fayolProvenance = fayol;
