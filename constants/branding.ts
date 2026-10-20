/**
 * Fasi — Logo assets
 *
 * Les fichiers sont nommés d'après **l'encre du logo**, pas d'après le thème :
 *   - `splash-icon-dark.png`  → logo bleu nuit, destiné aux fonds CLAIRS
 *   - `splash-icon-light.png` → logo blanc, destiné aux fonds SOMBRES
 *
 * Passez toujours par `getLogo(isDark)` pour éviter d'afficher un logo blanc
 * sur un fond blanc (et inversement).
 */

export const LOGO_ON_LIGHT = require('../assets/images/splash-icon-dark.png');
export const LOGO_ON_DARK = require('../assets/images/splash-icon-light.png');

export const getLogo = (isDark: boolean) =>
  isDark ? LOGO_ON_DARK : LOGO_ON_LIGHT;
