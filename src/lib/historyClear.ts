export type HistoryClearStep = 'idle' | 'confirming';
export type HistoryClearChoice = 'ask' | 'cancel' | 'erase';

/**
 * L'effacement n'est vrai que depuis l'étape de confirmation.
 * Annuler, ou un effacement hors de cette étape, ne retire rien.
 */
export function historyClearIntent(
  step: HistoryClearStep,
  choice: HistoryClearChoice,
): { step: HistoryClearStep; erase: boolean } {
  if (choice === 'ask') return { step: 'confirming', erase: false };
  if (choice === 'cancel') return { step: 'idle', erase: false };
  if (choice === 'erase' && step === 'confirming') return { step: 'idle', erase: true };
  return { step, erase: false };
}
