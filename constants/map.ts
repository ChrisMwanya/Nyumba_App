/**
 * Nyumba — Configuration Mapbox
 *
 * Le style « Standard » (Mapbox v11) porte nativement les bâtiments, reliefs et
 * repères en 3D : il suffit de l'incliner (`pitch`) pour obtenir la vue 3D.
 * Son `lightPreset` sert aussi de bascule clair / sombre, ce qui évite de
 * charger deux styles différents.
 */

/** Jeton public (pk.…). Absent → la carte ne peut pas s'afficher. */
export const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

/** Style Mapbox Standard — 3D intégrée, configurable via <StyleImport>. */
export const MAP_STYLE_URL = 'mapbox://styles/mapbox/standard';

/** Centre de repli tant que la position de l'utilisateur est inconnue (Kinshasa). */
export const FALLBACK_CENTER: [number, number] = [15.322, -4.325];

/** Niveaux de caméra : 3D = inclinée, 2D = vue du dessus. */
export const CAMERA = {
  zoom: 14.5,
  zoomFocused: 16.5,
  pitch3D: 55,
  pitch2D: 0,
} as const;

/** Configuration du basemap « Standard » selon le thème de l'app. */
export const basemapConfig = (isDark: boolean, in3D: boolean) => ({
  lightPreset: isDark ? ('night' as const) : ('day' as const),
  show3dObjects: in3D,
  showPointOfInterestLabels: false,
  showTransitLabels: false,
  showPlaceLabels: true,
  showRoadLabels: true,
});
