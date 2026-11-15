import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Retour tactile léger. Sur le web, ou si l’appareil refuse, rien ne casse. */
export async function haptic(kind: 'select' | 'success' | 'warn' = 'select') {
  if (Platform.OS === 'web') return;
  try {
    if (kind === 'success') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === 'warn') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else await Haptics.selectionAsync();
  } catch {
    /* appareil sans moteur ou permission absente */
  }
}
