# Release `release/next`

Cette branche est le train TestFlight de 92'MBA. **Ne pas la merger dans `main` sans un oui explicite.** Un merge vers `main` déclenche le workflow GitHub Pages et publie le web.

`main` reste la branche du site. Les builds iOS, Apple TV et Mac partent d'ici.

## D'où vient cette branche

Tête de départ : `cursor/mba-learning-adhd-14d1` (pull request #4), le head ouvert dont les builds TestFlight sont décrits (iPhone / iPad, Mac « Designed for iPad », Apple TV). Cette branche contient déjà `cursor/preservation-fondation-b42b` (pull request #3, non mergée dans `main`).

Laissée de côté : `ux/passe-plaisir-2026-11-04` (pull request #2). Elle part de `main` et réécrit les mêmes écrans (réglages, lecteur, accueil, chaînes) avec un autre mode Focus et d'autres clés (`92mba:focus@v1`, `92mba:vibrations@v1`). Le merge entre en conflit sur `focus.tsx` (ajout des deux côtés), `stateMerge.ts`, l'interface et les textes. L'intégrer écraserait le Focus et l'apparence déjà livrés sur la ligne TestFlight. La branche n'est pas supprimée.

Aucune branche ouverte n'a été supprimée. Rien n'est envoyé à App Store Connect depuis ce dépôt par ce document.

## Ce que la CI vérifie

À chaque push et à chaque pull request, `.github/workflows/ci.yml` lance, sans déployer :

1. `npm run typecheck` (`tsc --noEmit`)
2. `npm test`
3. `npx expo export --platform web`

Le workflow Pages (`.github/workflows/pages.yml`) ne part que sur `main`.

## TestFlight — iPhone, iPad et Mac

Même binaire, profil EAS **`production`**. Pas le profil `production-tv`. Ne pas définir `EXPO_TV`.

Identifiants déjà dans le dépôt, à ne pas changer ici : bundle `ch.mohamadba.ninetytwomba`, projet Expo `d366aa25-21c9-49f2-8f0c-3e07b37a70af`, équipe `Y9XF9RY2BU`. `app.json` garde `ios.buildNumber` à `"1"`. Le compteur de build iPhone est celui du profil `production` (`autoIncrement: true`, source distante). Ne pas l'avancer à la main pour compenser un build TV.

1. Rester sur la branche `release/next`.
2. Lancer le build iOS avec le profil **`production`** (pas depuis cette mise à jour : aucun build n'est lancé par le dépôt).
3. App Store Connect → l'app `ch.mohamadba.ninetytwomba` → envoyer le binaire à un groupe TestFlight.
4. Mac Apple Silicon : **Tarification et disponibilité** → **Apps iPhone et iPad sur les Mac Apple Silicon** reste disponible. Le même build iOS s'installe depuis TestFlight. Un Mac Intel ne lance pas cette app. Pas de cible Mac Catalyst, pas de second bundle.

`supportsTablet` est vrai et `requireFullScreen` est faux : la fenêtre iPad / Mac se redimensionne. Ce réglage est déjà dans la branche d'origine ; ne pas le retirer.

## TestFlight — Apple TV

Profil EAS **`production-tv`** uniquement, depuis `release/next`.

- `EXPO_TV=1` est posé par le profil. Sans cette variable, le binaire reste celui de l'iPhone.
- `autoIncrement` est faux : ce profil ne consomme pas le compteur iPhone.
- Le `buildNumber` tvOS écrit par la config quand `EXPO_TV=1` est **2**. Si Connect en affiche un autre, ne pas incrémenter l'iPhone pour l'aligner.
- Même bundle, même projet Expo. Ajouter la plateforme tvOS dans App Store Connect sur cette fiche, avec un profil de distribution tvOS. Pas de second `projectId`.
- Icônes et Top Shelf : `assets/tv/`.

Le salon TV (route `tv`) ne s'ouvre que lorsque `Platform.isTV` est vrai. Le verre y est opaque : le focus reste un fond plein, un bord de 6, l'échelle 1,08 et le halo.

## Verre

Les surfaces translucides, le relief des boutons et les jetons d'espacement / de typographie vivent dans `src/theme/glass.ts`, `src/theme/system.ts` et `src/components/ui.tsx`. Clair et sombre suivent le réglage d'apparence déjà stocké dans `92mba:v1` (`study.appearance`). Contraste élevé, « Réduire la transparence » et Apple TV passent sur des aplats opaques. « Réduire les animations » retire les déplacements, pas le relief. Les clés de stockage ne changent pas.
