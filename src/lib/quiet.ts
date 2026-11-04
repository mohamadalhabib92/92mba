/**
 * Mode Focus : les toasts de l’app sont mis en sourdine pendant une session
 * (pas d’affichage, pas d’annonce, pas de vibration).
 */
let muted = false;
export function setToastsMuted(on: boolean) {
  muted = on;
}
export function toastsMuted(): boolean {
  return muted;
}
