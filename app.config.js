// baseUrl n'est utile que pour la PWA (GitHub Pages). Sur les builds natifs EAS,
// il préfixe les assets par "<slug>/", ce qui entre en collision avec
// l'exécutable de même nom (système de fichiers insensible à la casse).
// Il reste donc réservé au web : on ne le retire que lorsque EAS_BUILD est défini.
//
// Apple TV : EXPO_TV=1 (profil production-tv) seulement. Sans cette variable,
// le bundle, le buildNumber iPhone et le projet Expo ne bougent pas.
const { TV_BUNDLE_VERSION } = require('./scripts/tv-native.cjs');

const IPHONE_PROJECT = 'd366aa25-21c9-49f2-8f0c-3e07b37a70af';

module.exports = ({ config }) => {
  if (process.env.EXPO_TV === '1') return withAppleTv(config);
  if (!process.env.EXPO_NO_CAPABILITY_SYNC) {
    process.env.EXPO_NO_CAPABILITY_SYNC = '1';
  }
  config.ios = { ...(config.ios ?? {}), appleTeamId: 'Y9XF9RY2BU', supportsTablet: true, requireFullScreen: false };
  config.plugins = [...(config.plugins || []), './plugins/with-mac-ipad.js'];
  if (process.env.EAS_BUILD && config.experiments) {
    const { baseUrl, ...rest } = config.experiments;
    config.experiments = rest;
  }
  return config;
};

const TV_DROP_INFO = [
  'NSBluetoothAlwaysUsageDescription',
  'NSCameraUsageDescription',
  'NSPhotoLibraryUsageDescription',
  'NSMicrophoneUsageDescription',
  'NSMotionUsageDescription',
  'NSLocationWhenInUseUsageDescription',
  'NSLocationTemporaryUsageDescriptionDictionary',
];

/**
 * Même bundle et même projet Expo que l’iPhone. Le buildNumber tvOS est 2,
 * écrit aussi dans le binaire par plugins/with-tv-pods.js. L’iPhone reste à 1.
 */
function withAppleTv(config) {
  if (!process.env.EXPO_NO_CAPABILITY_SYNC) {
    process.env.EXPO_NO_CAPABILITY_SYNC = '1';
  }
  if (process.env.EAS_BUILD && config.experiments) {
    const { baseUrl, ...rest } = config.experiments;
    config.experiments = rest;
  }
  const keep = new Set(['expo-router', 'expo-font']);
  const plugins = (config.plugins || []).filter((plugin) => keep.has(Array.isArray(plugin) ? plugin[0] : plugin));
  plugins.push([
    '@react-native-tvos/config-tv',
    {
      isTV: true,
      tvosDeploymentTarget: '16.4',
      appleTVImages: {
        iconSmallLayers: { front: './assets/tv/icon-home-front.png', back: './assets/tv/icon-home-back.png' },
        iconSmall2xLayers: { front: './assets/tv/icon-home-front@2x.png', back: './assets/tv/icon-home-back@2x.png' },
        iconLayers: { front: './assets/tv/icon-store-front.png', back: './assets/tv/icon-store-back.png' },
        topShelf: './assets/tv/top-shelf.png',
        topShelf2x: './assets/tv/top-shelf@2x.png',
        topShelfWide: './assets/tv/top-shelf-wide.png',
        topShelfWide2x: './assets/tv/top-shelf-wide@2x.png',
      },
    },
  ]);
  plugins.push('./plugins/with-tv-pods.js');
  config.plugins = plugins;
  config.orientation = 'landscape';
  config.slug = '92mba';
  config.owner = 'habib548';
  config.ios = { ...(config.ios || {}) };
  config.ios.bundleIdentifier = 'ch.mohamadba.ninetytwomba';
  config.ios.buildNumber = TV_BUNDLE_VERSION;
  config.ios.appleTeamId = 'Y9XF9RY2BU';
  config.ios.entitlements = {};
  const info = { ...(config.ios.infoPlist || {}) };
  for (const key of TV_DROP_INFO) delete info[key];
  info.CFBundleVersion = TV_BUNDLE_VERSION;
  config.ios.infoPlist = info;
  config.extra = { ...(config.extra || {}) };
  config.extra.eas = { ...(config.extra.eas || {}), projectId: IPHONE_PROJECT };
  return config;
}
