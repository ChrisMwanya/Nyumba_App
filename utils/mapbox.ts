import Mapbox from '@rnmapbox/maps';

import { MAPBOX_TOKEN } from '@/constants/map';

/**
 * Point d'entrée unique du SDK Mapbox : importer ce module suffit à armer le
 * jeton d'accès. Le faire à l'import garantit que le token est posé avant le
 * premier rendu d'une <MapView>, quel que soit l'écran qui l'affiche.
 */
if (MAPBOX_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
  // Pas de télémétrie : l'app n'expose aucun réglage pour la désactiver.
  Mapbox.setTelemetryEnabled(false);
}

/** `false` si le jeton public est absent — l'appelant affiche alors un repli. */
export const isMapboxReady = Boolean(MAPBOX_TOKEN);

// Réexport du SDK pour que les écrans n'importent jamais `@rnmapbox/maps`
// directement : passer par ici garantit l'initialisation ci-dessus.
export * from '@rnmapbox/maps';
export default Mapbox;
