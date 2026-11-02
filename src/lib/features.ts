/**
 * Phase 1 : la bibliothèque, la liseuse, la recherche, les signets et la progression
 * ne dépendent d'aucun réseau, d'aucun crédit et d'aucune clé.
 * L'IA et le compte restent éteints (FEATURE_AI / FEATURE_ACCOUNT).
 * Un échec 402, s'il survient plus tard, ne peut pas bloquer la lecture :
 * il se traduit uniquement par le badge « Service optionnel indisponible ».
 */

export const FEATURE_AI = false;
export const FEATURE_ACCOUNT = false;

export type OptionalFailure = { status?: number } | null;

export function classifyOptionalFailure(enabled: boolean, failure: OptionalFailure): 'hidden' | 'unavailable' {
  if (!enabled) return 'hidden';
  const status = failure?.status;
  if (typeof status === 'number' && (status === 402 || status >= 400)) return 'unavailable';
  return 'hidden';
}

/** Vrai seulement pour un DSN réel. YOUR_* , vide ou absent = désactivé, aucune requête. */
export function sentryEnabled(dsn: string | undefined | null): boolean {
  if (!dsn) return false;
  const value = dsn.trim();
  if (!value || value.includes('YOUR_') || value === 'undefined' || value === 'null') return false;
  return /^https:\/\/\S+@\S+\/\S+$/.test(value);
}

/**
 * Journal de crash. Sans DSN réel, ne fait rien (et n'importe aucun SDK).
 * Le SDK Sentry n'est pas embarqué : un placeholder ne doit ni partir sur le réseau
 * ni ajouter une dépendance native au démarrage.
 */
export function reportCrash(error: unknown, context?: string): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.error('[92mba]', context ?? 'crash', error);
  }
  if (!sentryEnabled(process.env.EXPO_PUBLIC_SENTRY_DSN)) return;
}
