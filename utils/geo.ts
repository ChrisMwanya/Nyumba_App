/** Rayon moyen de la Terre, en kilomètres. */
const EARTH_RADIUS_KM = 6371;

export type Coordinates = { latitude: number; longitude: number };

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Distance orthodromique (formule de haversine) entre deux points, en km. */
export function distanceKm(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** « 450 m », « 2,3 km »… `undefined` si la distance est inconnue. */
export function formatDistance(km: number | undefined): string | undefined {
  if (km === undefined || Number.isNaN(km)) return undefined;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace('.', ',')} km`;
}
