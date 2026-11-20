/**
 * Modules retirés du lien natif Apple TV. Une seule liste, lue par le hook EAS,
 * le plugin Podfile et react-native.config.js. Inerte tant que EXPO_TV n’est pas 1.
 *
 * expo-speech, expo-haptics et expo-document-picker n’ont pas de podspec tvOS.
 * expo-keep-awake déclare tvOS et reste. expo-router est patché à part.
 */
const TV_AUTOLINK_EXCLUDE = ['expo-haptics', 'expo-speech', 'expo-document-picker', 'mba-mac'];

/** Les xcframework Maven sont le cœur iOS upstream, pas le fork tvOS. */
const TV_RN_CORE_FROM_SOURCE = '0';

/** Version de build tvOS. L’iPhone reste sur le buildNumber de app.json. */
const TV_BUNDLE_VERSION = '2';

const TVOS_DEPLOYMENT_TARGET = '16.4';

module.exports = { TV_AUTOLINK_EXCLUDE, TV_RN_CORE_FROM_SOURCE, TV_BUNDLE_VERSION, TVOS_DEPLOYMENT_TARGET };
