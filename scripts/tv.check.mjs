/**
 * Contrats Apple TV. Sans EXPO_TV, l’iPhone (bundle, build 1, React Native 0.88) ne change pas.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const appJson = JSON.parse(readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
assert(appJson.ios.bundleIdentifier === 'ch.mohamadba.ninetytwomba', 'bundle iPhone');
assert(appJson.ios.buildNumber === '1', 'buildNumber iPhone dans app.json');
assert(appJson.extra.eas.projectId === 'd366aa25-21c9-49f2-8f0c-3e07b37a70af', 'projet Expo');

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
assert(pkg.dependencies['react-native'] === '0.88.0', 'react-native iPhone reste 0.88');
assert(pkg.devDependencies['@react-native-tvos/config-tv'], 'config-tv');

const eas = JSON.parse(readFileSync(path.join(root, 'eas.json'), 'utf8'));
assert(eas.build['production-tv'].env.EXPO_TV === '1', 'profil production-tv');
assert(eas.build['production-tv'].autoIncrement === false, 'le profil TV n’incrémente pas le compteur iPhone');
assert(eas.build['production-tv'].env.RCT_USE_PREBUILT_RNCORE === '0', 'rncore depuis les sources tvOS');
assert(!eas.build.production.env?.EXPO_TV, 'production iPhone sans EXPO_TV');
assert(eas.build.production.env.EXPO_NO_CAPABILITY_SYNC === '1', 'capability iPhone');

function loadConfig(tv) {
  const env = { ...process.env, EXPO_NO_CAPABILITY_SYNC: '1' };
  if (tv) env.EXPO_TV = '1';
  else delete env.EXPO_TV;
  const run = spawnSync(process.execPath, ['-e', 'const c=require("./app.config.js")({config:require("./app.json").expo}); process.stdout.write(JSON.stringify({bundle:c.ios.bundleIdentifier,build:c.ios.buildNumber,project:c.extra.eas.projectId,plugins:(c.plugins||[]).map(p=>Array.isArray(p)?p[0]:p)}))'], {
    cwd: root,
    env,
    encoding: 'utf8',
  });
  if (run.status !== 0) throw new Error(run.stderr || 'config failed');
  return JSON.parse(run.stdout);
}

const phone = loadConfig(false);
assert(phone.bundle === 'ch.mohamadba.ninetytwomba' && phone.build === '1', `config iPhone ${phone.build}`);
assert(phone.project === 'd366aa25-21c9-49f2-8f0c-3e07b37a70af', 'projet iPhone');
assert(!phone.plugins.includes('@react-native-tvos/config-tv'), 'config-tv absent de l’iPhone');

const tv = loadConfig(true);
assert(tv.bundle === 'ch.mohamadba.ninetytwomba', 'même bundle TV');
assert(tv.build === '2', 'CFBundleVersion TV 2 dans la config');
assert(tv.project === phone.project, 'même projet Expo, pas d’identifiant inventé');
assert(tv.plugins.includes('@react-native-tvos/config-tv'), 'config-tv sur le profil TV');
assert(tv.plugins.includes('./plugins/with-tv-pods.js'), 'plugin pods');

const { patchExpoRouterPodspecSource, patchAppleModuleConfig } = require('./tv-native-patch.cjs');
const podspec = readFileSync(path.join(root, 'node_modules/expo-router/ios/ExpoRouter.podspec'), 'utf8');
const patched = patchExpoRouterPodspecSource(podspec);
assert(patched.includes(":tvos => '16.4'"), 'déploiement tvOS 16.4');
assert(patched.includes("s.tvos.exclude_files = 'LinkPreview/**/*', 'Toolbar/**/*'"), 'Link Preview et Toolbar écartés');
assert(podspec === readFileSync(path.join(root, 'node_modules/expo-router/ios/ExpoRouter.podspec'), 'utf8'), 'le podspec du dépôt n’est pas réécrit par le test');

const provider = patchAppleModuleConfig(
  { apple: { modules: ['ExpoHeadModule', 'LinkPreviewNativeModule', 'RouterToolbarModule'], appDelegateSubscribers: ['ExpoHeadAppDelegateSubscriber'] } },
  new Set(['LinkPreviewNativeModule', 'RouterToolbarModule']),
);
assert(!provider.apple.modules.includes('LinkPreviewNativeModule'), 'LinkPreviewNativeModule retiré');
assert(!provider.apple.modules.includes('RouterToolbarModule'), 'RouterToolbarModule retiré');
assert(provider.apple.modules.includes('ExpoHeadModule'), 'ExpoHead reste');

const { patchPodfileSource, ensureBundleVersion } = require('../plugins/with-tv-pods.js');
const podfile = patchPodfileSource("platform :ios, '16.4'\nuse_expo_modules!\npost_install do |installer|\nend\n");
assert(podfile.includes("platform :tvos, '16.4'"), 'Podfile tvOS 16.4');
assert(podfile.includes('expo-haptics'), 'haptics hors du lien TV');
assert(podfile.includes('expo-speech'), 'speech hors du lien TV');
assert(podfile.includes("ENV['RCT_USE_PREBUILT_RNCORE'] = '0'"), 'pas de xcframework iOS');
const plist = ensureBundleVersion('<dict>\n</dict>', '2');
assert(plist.includes('<string>2</string>'), 'CFBundleVersion 2');
const replaced = ensureBundleVersion('<key>CFBundleVersion</key><string>1</string>', '2');
assert(replaced.includes('<string>2</string>') && !replaced.includes('<string>1</string>'), 'le 1 iPhone ne reste pas dans le plist TV');

const metrics = readFileSync(path.join(root, 'src/tv/metrics.ts'), 'utf8');
assert(metrics.includes('horizontal: 90') && metrics.includes('vertical: 60'), 'marges TV');
assert(metrics.includes('1.08'), 'échelle de focus');

const focus = readFileSync(path.join(root, 'src/components/tv/ui.tsx'), 'utf8');
assert(focus.includes('hasTVPreferredFocus') && focus.includes('TVFocusGuideView'), 'guide et focus préféré');
assert(focus.includes('TV_FOCUS_SCALE'), 'échelle partagée');

console.log('tv checks ok');
