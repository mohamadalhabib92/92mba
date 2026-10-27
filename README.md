# 92'MBA — Bibliothèque business hors ligne

Application Expo (React Native + expo-router, TypeScript) qui fonctionne sur **iOS, Android et Web (PWA installable)**.
Reconstruite à partir de la spécification Vibecode « 92MBA ».

## Fonctionnalités

- **Bibliothèque** : 11 documents intégrés, filtres par catégorie / langue, squelettes de chargement, état vide « Aucun document — importer / ajouter ».
- **Lecteur** : pagination, curseur de page, précédent / suivant (flèches clavier sur le web), A- / A+, thèmes clair / sépia / sombre, signets, panneau d'informations (titre, auteur, licence, source), recherche dans le document avec surlignage, mise en page RTL pour l'arabe.
- **Progression** : % lu, « Continuer la lecture », statistiques (commencés, terminés, signets).
- **Recherche** : plein texte avec debounce, insensible aux accents, puces de filtre, extraits surlignés qui ouvrent la bonne page, historique propre (jamais de « undefined »).
- **Ajout de documents** : coller du texte ou importer un `.txt`, choix de la licence (je possède / domaine public / licence ouverte) et avertissement sur les droits.
- **Langues** : interface FR (par défaut), EN, AR (RTL).
- **Hors ligne** : tout est stocké localement (AsyncStorage / localStorage) ; service worker PWA qui pré-cache l'application.

## Contenus et droits

| Contenu | Statut |
|---|---|
| Fiches « Équipe 92'MBA » (stratégie, bilan, coûts, 4P, leadership, négociation, مبادئ الإدارة) | Contenu original rédigé pour l'app |
| F. W. Taylor, *The Principles of Scientific Management* (1911), extraits | Domaine public — Project Gutenberg |
| Adam Smith, *The Wealth of Nations* (1776), Livre I ch. 1–2 | Domaine public — Project Gutenberg (note éditoriale sur le vocabulaire daté) |
| « Vos cours ici » | **Placeholder / démo — à remplacer** |

Aucun contenu protégé n'est inclus. Remplacez le placeholder par vos propres supports (ou contenus sous licence ouverte).

## Développement

```bash
npm install
npm run web          # ou: npx expo start
npm run typecheck    # tsc --noEmit
npm run export:web   # expo export -p web + manifest/service worker -> dist/
```

Icônes : `python3 scripts/make-icons.py "#1B2A4A" "#FFFFFF" "92" "#C9A227"`.

## Publication sur GitHub Pages (à faire par vous)

1. Créez un dépôt GitHub nommé **`92mba`** (le `baseUrl` est `/92mba`, voir `app.json > experiments.baseUrl`).
2. `git remote add origin git@github.com:<vous>/92mba.git && git push -u origin main`
3. Dans *Settings → Pages*, choisissez **Source : GitHub Actions**. Le workflow `.github/workflows/pages.yml` construit et déploie.
4. L'app sera disponible sur `https://<vous>.github.io/92mba/` et installable (« Ajouter à l'écran d'accueil »).

Si vous changez le nom du dépôt, modifiez aussi `experiments.baseUrl`.

## Phase 2 (optionnelle, non activée)

Un assistant IA de résumé pourrait être ajouté **hors du parcours de lecture**, via un petit backend qui garde la clé côté serveur :
`OPENAI_API_KEY=YOUR_OPENAI_API_KEY` (jamais en `EXPO_PUBLIC_*`). Aucune clé n'est nécessaire pour l'app actuelle.

## Structure

```
src/app/            routes expo-router (onglets, lecteur doc/[id], ajout)
src/components/     UI (cartes, boutons, slider, squelettes…)
src/lib/            store persistant, i18n, bibliothèque/pagination/recherche
src/data/           textes originaux + extraits domaine public
scripts/pwa.mjs     manifest, service worker, 404.html (fallback SPA)
```
