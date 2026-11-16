import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Retour tactile léger. Sur le web et sur Apple TV, rien ne part vers un moteur. */
export async function haptic(kind: 'select' | 'success' | 'warn' = 'select') {
  if (Platform.OS === 'web' || Platform.isTV) return;
  try {
    if (kind === 'success') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === 'warn') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else await Haptics.selectionAsync();
  } catch {
    /* appareil sans moteur ou permission absente */
  }
}
