/**
 * iOS sur Mac : même bundle et même build iPhone, iPad activé, capacités compatibles.
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

const app = JSON.parse(readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
assert(app.ios.supportsTablet === true, 'supportsTablet');
assert(app.ios.requireFullScreen === false, 'fenêtre redimensionnable');
assert(app.ios.bundleIdentifier === 'ch.mohamadba.ninetytwomba', 'bundle');
assert(app.ios.buildNumber === '1', 'build iPhone');
assert(app.ios.infoPlist.UIApplicationSupportsIndirectInputEvents === true, 'pointeur');
assert(!app.ios.infoPlist.UIRequiredDeviceCapabilities, 'app.json n’exige pas de capacité incompatible');

const { macCompatiblePlist, MAC_BLOCKED_CAPABILITIES } = require('../plugins/with-mac-ipad.js');
const plist = macCompatiblePlist({
  UIRequiredDeviceCapabilities: ['armv7', 'arm64', 'telephony'],
  UIRequiresFullScreen: true,
  CFBundleName: '92MBA',
});
assert(!plist.UIRequiredDeviceCapabilities.includes('armv7'), 'armv7 retiré');
assert(!plist.UIRequiredDeviceCapabilities.includes('telephony'), 'telephony retiré');
assert(plist.UIRequiredDeviceCapabilities.includes('arm64'), 'arm64 conservé');
assert(plist.UIRequiresFullScreen === false, 'plein écran non exigé');
assert(plist.UIApplicationSupportsIndirectInputEvents === true, 'événements indirects');
assert(plist.CFBundleName === '92MBA', 'le reste du plist reste');
for (const blocked of ['gps', 'sms', 'wifi', 'microphone']) {
  assert(MAC_BLOCKED_CAPABILITIES.includes(blocked), blocked);
}
const emptied = macCompatiblePlist({ UIRequiredDeviceCapabilities: ['armv7'] });
assert(!('UIRequiredDeviceCapabilities' in emptied), 'liste vide retirée');

const { TV_AUTOLINK_EXCLUDE } = require('../scripts/tv-native.cjs');
assert(TV_AUTOLINK_EXCLUDE.includes('mba-mac'), 'le module Mac ne se lie pas au build tvOS');

const run = spawnSync(
  process.execPath,
  [
    '-e',
    'const c=require("./app.config.js")({config:require("./app.json").expo}); process.stdout.write(JSON.stringify({bundle:c.ios.bundleIdentifier,build:c.ios.buildNumber,tablet:c.ios.supportsTablet,full:c.ios.requireFullScreen,project:c.extra.eas.projectId,plugins:(c.plugins||[]).map(p=>Array.isArray(p)?p[0]:p)}))',
  ],
  { cwd: root, env: { ...process.env, EXPO_NO_CAPABILITY_SYNC: '1', EXPO_TV: '' }, encoding: 'utf8' },
);
if (run.status !== 0) throw new Error(run.stderr || 'config');
const phone = JSON.parse(run.stdout);
assert(phone.bundle === 'ch.mohamadba.ninetytwomba' && phone.build === '1', 'config iPhone');
assert(phone.tablet === true && phone.full === false, 'iPad sans plein écran forcé');
assert(phone.project === 'd366aa25-21c9-49f2-8f0c-3e07b37a70af', 'projet Expo');
assert(phone.plugins.includes('./plugins/with-mac-ipad.js'), 'plugin Mac');
assert(!phone.plugins.includes('@react-native-tvos/config-tv'), 'pas de config TV sur iPhone');

console.log('mac checks ok');
