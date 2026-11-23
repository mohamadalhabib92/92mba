/**
 * Contraste AA du verre (clair, sombre, contraste élevé, repli opaque)
 * et des barres du lecteur. Ne touche à aucune clé de stockage.
 */
import { contrastRatio, hit, readerThemes } from '../theme';
import { darkPalette, highContrastDark, highContrastLight, lightPalette, type Palette } from './system';
import { dangerInk, frostBar, glassFor, reliefEdges } from './glass';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function pair(name: string, fg: string, bg: string, min = 4.5) {
  const ratio = contrastRatio(fg, bg);
  assert(ratio >= min, `${name} ${fg} sur ${bg} = ${ratio.toFixed(2)} < ${min}`);
}

function checkPalette(name: string, palette: Palette, dark: boolean, highContrast: boolean) {
  pair(`${name} texte/page`, palette.text, palette.bg);
  pair(`${name} secondaire/page`, palette.muted, palette.bg);
  pair(`${name} bouton`, palette.onPrimary, palette.primary);
  pair(`${name} notice`, palette.noticeText, palette.noticeBg);
  const danger = dangerInk(dark, highContrast);
  pair(`${name} danger`, danger.fg, danger.bg);
  for (const solid of [false, true]) {
    const glass = glassFor(palette, dark, solid || highContrast);
    pair(`${name} texte/verre${solid ? ' opaque' : ''}`, palette.text, glass.surfaceOpaque);
    pair(`${name} secondaire/verre${solid ? ' opaque' : ''}`, palette.muted, glass.surfaceOpaque);
    pair(`${name} fantôme`, palette.primary, glass.canvas);
    pair(`${name} fantôme/verre`, palette.primary, glass.surfaceOpaque);
    pair(`${name} secondaire`, palette.primary, palette.primarySoft);
    const edges = reliefEdges(palette.primary, dark);
    assert(edges.highlight !== edges.shade, `${name} relief sans épaisseur`);
    assert(edges.highlight.toLowerCase() !== palette.primary.toLowerCase(), `${name} arête haute invisible`);
  }
}

checkPalette('clair', lightPalette, false, false);
checkPalette('sombre', darkPalette, true, false);
checkPalette('contraste clair', highContrastLight, false, true);
checkPalette('contraste sombre', highContrastDark, true, true);

for (const [name, theme] of Object.entries(readerThemes)) {
  pair(`lecteur ${name} texte/page`, theme.text, theme.bg);
  pair(`lecteur ${name} texte/barre`, theme.text, theme.bar);
  pair(`lecteur ${name} texte/givre`, theme.text, frostBar(theme.bar, theme.bg, false));
  pair(`lecteur ${name} secondaire/givre`, theme.muted, frostBar(theme.bar, theme.bg, false));
}

const solid = glassFor(lightPalette, false, true);
assert(!solid.surface.startsWith('rgba'), 'repli opaque encore translucide');
assert(solid.surfaceOpaque === lightPalette.surface, 'surface opaque = surface historique');
assert(hit.min >= 44, 'cible minimale sous 44 pt');

console.log('glass checks ok');
