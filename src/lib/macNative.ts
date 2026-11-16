import { Platform } from 'react-native';

/**
 * Vrai seulement quand le binaire iOS tourne sur un Mac (ProcessInfo.isiOSAppOnMac).
 * Sinon, si expo-device est présent, DeviceType.DESKTOP. Jamais sur iPhone, tvOS ou le web.
 */
export function isIOSAppOnMac(): boolean {
  if (Platform.OS !== 'ios' || Platform.isTV) return false;
  try {
    const { requireNativeModule } = require('expo-modules-core') as {
      requireNativeModule: (name: string) => { isiOSAppOnMac?: boolean };
    };
    const native = requireNativeModule('MbaMac');
    if (typeof native?.isiOSAppOnMac === 'boolean') return native.isiOSAppOnMac;
  } catch {
    /* binaire sans le module : tests, Expo Go */
  }
  try {
    const Device = require('expo-device') as { deviceType?: number; DeviceType?: { DESKTOP: number } };
    return Device.deviceType != null && Device.DeviceType != null && Device.deviceType === Device.DeviceType.DESKTOP;
  } catch {
    return false;
  }
}
