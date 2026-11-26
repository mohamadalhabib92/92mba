# Kaizen 92'MBA

Petites améliorations sur `release/next`. Rien n'est mergé dans `main`. Les lectures, signets, cartes et passages déjà enregistrés restent. Aucun lien partagé n'est republié.

## 2026-11-26 — Lean Six Sigma, ceinture blanche

Écart visé : un parcours Lean Six Sigma à part des 15 modules du MBA, de la ceinture blanche à la noire, sans toucher à la clé `92mba:v1`.

### Ceinture blanche

Avant : pas de piste Lean Six Sigma.

Après : module `lss-white`, six leçons (DMAIC, TIMWOODS, voix du client, CTQ, DPMO, rôles), 36 questions originales (QCM, vrai/faux, calculs), examen blanc de 15 questions en 20 minutes avec revue des erreurs. L’écran de fin dit que c’est une attestation dans l’application, pas une certification accréditée. Les ceintures suivantes ne sont pas encore dans cette entrée.

Fichiers : `src/learn/content/lss/`, `src/app/lss/`, `src/app/tv/lss.tsx`, `src/app/tv/lss-mock/[id].tsx`.

Les leçons et l’examen blanc s’écrivent dans `study.lessons` et `study.exams` (`lss-white:mock`), champs déjà prévus. Le parcours des 92 jours ne change pas.

## 2026-11-26 — ceinture jaune

Avant : la piste s’arrêtait à la blanche.

Après : `lss-yellow` s’ouvre seulement quand les leçons blanches sont finies et que l’examen blanc de la ceinture blanche est tenu à 70 %. Six leçons (5S, Gemba, kaizen, SIPOC, charte, carte, takt, kanban, SMED, poka-yoke), 36 questions, examen blanc de 18 questions en 30 minutes. Même phrase d’attestation : pas une certification accréditée.

## 2026-11-26 — ceinture verte

Avant : la piste s’arrêtait au jaune.

Après : `lss-green` s’ouvre quand le jaune est tenu. Huit leçons (gage R&R, forme des données, Cp/Cpk/Pp/Ppk, causes, tests t / ANOVA / khi-deux, corrélation, cartes, plan de contrôle), 64 questions, examen blanc de 30 questions en 60 minutes. Les calculs sont recomptés par le test, à part du texte des options.

## 2026-11-23 — du surlignage à la révision

Écart visé : un passage gardé devient une carte, puis entre dans une séance courte, comme dans Readwise. La répétition espacée et la clé `92mba:v1` existaient déjà.

### 1. Couleurs et liste des surlignages

Avant : la baguette enregistrait le passage sans couleur. Les quatre teintes (`highlightColors`) ne servaient qu'à la recherche. Il n'y avait pas d'écran pour revoir les passages.

Après : jaune, vert, bleu ou rose, choisi dans le lecteur. Un passage déjà gardé change de couleur sans être dupliqué. L'écran Surlignages liste les passages, ouvre la page d'origine, et propose d'en faire une carte. Une couleur absente ou inconnue redevient jaune à la lecture, le texte reste.

Fichiers : `src/learn/study.ts`, `src/app/doc/[id].tsx`, `src/app/highlights.tsx`, `src/app/(tabs)/index.tsx`, `src/learn/copy.ts`.

### 2. Carte et séance du jour

Avant : « En faire une carte » était seulement dans le panneau d'infos. La séance montrait jusqu'à 10 cartes dues, sans faire passer devant celles qui viennent d'un passage.

Après : la carte se crée depuis le passage ou depuis la liste, dans le même état local (`study.marks`, `study.userCards`, `study.cards`). La séance du jour reste plafonnée à 10 (entre 5 et 10), met les cartes de surlignage dues en tête, et n'ajoute pas de carte fictive s'il y en a moins. Les autres cartes dues restent pour la fois suivante.

Fichiers : `src/learn/highlights.ts`, `src/learn/actions.ts` (inchangé, déjà le chemin `promoteMark`), `src/app/review.tsx`, `src/app/highlights.tsx`, `src/app/doc/[id].tsx`.

### 3. Un seul geste

Avant : surligner ne disait pas quoi faire ensuite.

Après : le panneau dit « Passage gardé » puis « Une seule carte maintenant. Le reste peut attendre. » Un bouton principal crée la carte. La liste s'ouvre par « Un passage à la fois ».

Fichiers : `src/learn/copy.ts`, `src/app/doc/[id].tsx`, `src/app/highlights.tsx`.

### Tests

`npx tsc --noEmit`. `npm test`, dont `src/learn/highlights.check.ts` : couleur gardée, couleur inconnue, pas de doublon, champ inconnu du disque conservé, carte unique, file du jour plafonnée avec le surlignage devant.
