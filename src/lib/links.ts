/** Pages déjà publiées avec le dépôt. Aucune adresse inventée. */
export const PRIVACY_URL = 'https://mohamadalhabib92.github.io/92mba/privacy/';
export const SUPPORT_URL = 'https://mohamadalhabib92.github.io/92mba/support/';

/** Mailto seulement si Mohamed a remplacé le placeholder. Jamais affiché tel quel. */
export function supportEmail(): string | null {
  const value = process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim();
  if (!value || value.includes('YOUR_') || value === 'undefined') return null;
  return value;
}
