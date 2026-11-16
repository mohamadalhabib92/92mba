import { actionForKey, keyFromWeb, stageFor, stageKind } from './stage';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(stageKind({ os: 'ios', isPad: false, isTV: false, isMac: false }) === 'phone', 'phone');
assert(stageKind({ os: 'ios', isPad: true, isTV: false, isMac: false }) === 'pad', 'pad');
assert(stageKind({ os: 'ios', isPad: true, isTV: false, isMac: true }) === 'mac', 'mac');
assert(stageKind({ os: 'web', isPad: false, isTV: false, isMac: false }) === 'web', 'web');
assert(stageKind({ os: 'ios', isPad: false, isTV: true, isMac: false }) === 'tv', 'tv');

const phoneNarrow = stageFor(390, 'phone');
const phoneWide = stageFor(932, 'phone');
assert(phoneNarrow.wide === false && phoneNarrow.maxWidth === 760, 'iPhone étroit');
assert(phoneWide.wide === false && phoneWide.maxWidth === 760, 'iPhone paysage garde la colonne téléphone');

const padNarrow = stageFor(700, 'pad');
const padWide = stageFor(1024, 'pad');
assert(padNarrow.wide === false && padNarrow.maxWidth === 760, 'iPad étroit');
assert(padWide.wide === true && padWide.maxWidth === 1040, 'iPad large');

const mac = stageFor(1440, 'mac');
assert(mac.wide === true && mac.maxWidth === 1040, 'Mac');
assert(stageFor(800, 'mac').wide === false, 'fenêtre Mac étroite');
assert(stageFor(1920, 'tv').wide === false, 'TV');
assert(stageFor(1280, 'web').maxWidth === 1040, 'web large');

assert(keyFromWeb({ key: 'f', metaKey: true }) === 'find', 'cmd+f');
assert(keyFromWeb({ key: 'f', ctrlKey: true }) === 'find', 'ctrl+f');
assert(keyFromWeb({ key: 'f', metaKey: true, altKey: true }) === null, 'alt ignoré');
assert(keyFromWeb({ key: 'Escape' }) === 'escape', 'echap');
assert(keyFromWeb({ key: 'Tab', shiftKey: true }) === 'tabBack', 'shift tab');
assert(keyFromWeb({ key: 'ArrowLeft' }) === 'left', 'flèche');
assert(keyFromWeb({ key: 'a' }) === null, 'lettre');

assert(actionForKey('find', true) === 'find', 'cmd+f en saisie');
assert(actionForKey('escape', true) === 'escape', 'echap en saisie');
assert(actionForKey('enter', true) === 'ignore', 'entrée en saisie');
assert(actionForKey('space', true) === 'ignore', 'espace en saisie');
assert(actionForKey('tab', false) === 'next', 'tab');
assert(actionForKey('tabBack', false) === 'prev', 'shift tab action');
assert(actionForKey('enter', false) === 'activate', 'entrée');
assert(actionForKey('space', false) === 'activate', 'espace');
assert(actionForKey('left', false) === 'left', 'gauche');
assert(actionForKey('nope', false) === 'ignore', 'inconnu');

console.log('stage checks ok');
