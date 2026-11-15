# Système visuel — 92'MBA

La bibliothèque et la liseuse gardent la palette d’origine (`src/theme.ts`) : crème `#F7F4EE`, encre `#16213A`, marine `#1B2A4A`, or `#C9A227` seulement en décoration ou sur fond sombre. Le texte sur fond clair continue de passer par `accentInk` `#6B4F10`. Cette page décrit la couche ajoutée pour le cursus et le mode sombre. Elle ne remplace pas les trois thèmes de lecture (clair, sépia, sombre), qui restent un choix à part.

## Typographie

| Rôle | Taille | Graisse | Police |
|---|---|---|---|
| Display / H1 | 28–34 | 800 | Source Sans 3, Noto Naskh Arabic en RTL |
| H2 | 20 | 700 | idem |
| H3 | 16 | 700 | idem |
| Corps | 16 / interligne 24 | 400 | idem |
| Secondaire | 13 / 18 | 400 | idem |
| Lecture | 18 × échelle (0,8 à 2) | 400 | Source Serif 4, ou Atkinson Hyperlegible si « espacement dyslexie » est actif en alphabet latin |

Atkinson Hyperlegible (Braille Institute, SIL OFL, fichier `assets/fonts/OFL-AtkinsonHyperlegible.txt`) ne couvre pas l’arabe. Un document arabe reste en Noto Naskh, avec l’interlettrage déjà prévu. Les polices sont dans le paquet : pas de téléchargement au démarrage.

## Espacement et forme

Échelle existante, en points : 4, 8, 12, 16, 24, 40. Les cartes ont un rayon de 18, un filet fin, et une ombre douce (opacité 0,08 en clair, 0,35 en sombre, décalage vertical 6, flou 16). Le mode « réduire les animations » retire l’ombre portée et les changements d’échelle. Les cibles tactiles restent à 44 points au minimum. La colonne de contenu plafonne à 760 points ; à partir d’environ 840 points de large, la liste des modules passe sur deux colonnes.

## Couleur

Quatre palettes dans `src/theme/system.ts`. Le texte, le texte secondaire et le libellé de bouton visent un contraste d’au moins 4,5:1 (test dans `src/learn/study.check.ts`).

| Jeton | Clair | Sombre | Contraste élevé clair | Contraste élevé sombre |
|---|---|---|---|---|
| Fond | `#F7F4EE` | `#12151C` | `#FFFFFF` | `#000000` |
| Surface | `#FFFFFF` | `#1C2230` | `#FFFFFF` | `#000000` |
| Texte | `#16213A` | `#F4F1EA` | `#000000` | `#FFFFFF` |
| Secondaire | `#5F6577` | `#C5CDD8` | `#1A1A1A` | `#F2F2F2` |
| Action | `#1B2A4A` | `#D5E2F7` | `#0B1B33` | `#FFFFFF` |
| Texte sur action | `#FFFFFF` | `#12151C` | `#FFFFFF` | `#000000` |

L’or `#C9A227` ne sert pas de texte sur la crème : le rapport est sous 4,5:1, et le test de la passe 1 le rappelle. En sombre, l’or éclairci `#E0C36A` peut porter un petit libellé.

Le réglage Apparence (système, clair, sombre) concerne l’interface. Le thème de lecture ne le suit pas tout seul.

## Mouvement

Durées : 160 ms, 240 ms, 420 ms. Un bouton primaire se contracte légèrement à l’appui, sauf si les animations sont réduites (réglage de l’app, ou réglage du système quand l’app est sur « comme le système »). Les célébrations ont trois crans : complètes, discrètes, aucune. Il n’y a pas de compteur de honte : une série interrompue sans gel repart à 1, avec une phrase neutre.

Le retour tactile (`expo-haptics`) accompagne un bouton primaire, une bonne réponse et une réponse à revoir. Sur le web, l’appel ne fait rien.

## États vides

L’accueil sans lecture garde la carte « Aucune lecture en cours » et le bouton vers la bibliothèque. La révision sans carte dit que la session est tenue et que le reste peut attendre. Le glossaire sans filtre montre tout le lexique. Rien de ces états n’est un message d’erreur technique.

Le premier lancement propose trois écrans (promesse, une idée par écran, limite : pas un diplôme et pas un avis médical). On peut les quitter. Les données déjà sur l’appareil ne sont pas effacées.

## Lecture à voix haute et focus

`expo-speech` lit la leçon dans la langue de l’interface (fr, en, ar). Le focus propose 5, 10, 15, 25 ou 45 minutes, met l’écran en veille empêchée (`expo-keep-awake`) et ne compte pas le temps passé hors de l’app. Une sortie d’urgence demande une confirmation. Ce n’est pas un dispositif médical et l’app ne mesure pas l’attention.

## Arabe

`direction: rtl` est posé sur l’écran quand la langue d’interface est l’arabe. Les rangées suivent cette direction. Les champs de recherche alignent le texte à droite. La liseuse inversait déjà les flèches pour un document arabe : ce comportement reste.
