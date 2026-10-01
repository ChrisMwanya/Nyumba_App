/**
 * Calcul d'itinéraires — TomTom Routing API.
 *
 * Isolé de l'écran pour que celui-ci n'ait à connaître ni la forme de la
 * réponse TomTom, ni l'ordre lng/lat, ni les codes de manœuvre.
 */

const API_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY ?? '';
const BASE_URL = 'https://api.tomtom.com/routing/1/calculateRoute';

export type TravelMode = 'car' | 'pedestrian' | 'bicycle';

export type Coordinates = { latitude: number; longitude: number };

export type RouteStep = {
  /** Index dans la liste : TomTom ne fournit pas d'identifiant. */
  index: number;
  /** Instruction rédigée, déjà traduite par l'API. */
  message: string;
  street?: string;
  maneuver: string;
  /** Longueur de cette étape, en mètres. */
  lengthInMeters: number;
  coordinate: Coordinates;
};

export type Route = {
  /** Tracé au format Mapbox : [longitude, latitude]. */
  coordinates: [number, number][];
  lengthInMeters: number;
  travelTimeInSeconds: number;
  /** Retard dû au trafic, en secondes (0 si aucun). */
  trafficDelayInSeconds: number;
  /** Heure d'arrivée estimée (ISO 8601). */
  arrivalTime?: string;
  steps: RouteStep[];
};

/** Pourquoi le calcul a échoué — l'écran affiche un message adapté à chacun. */
export type RoutingErrorKind = 'no-key' | 'no-route' | 'network';

export class RoutingError extends Error {
  constructor(
    public kind: RoutingErrorKind,
    message: string
  ) {
    super(message);
  }
}

/** `true` si la clé TomTom est configurée. */
export const isRoutingConfigured = Boolean(API_KEY);

type TomTomInstruction = {
  message?: string;
  street?: string;
  maneuver?: string;
  routeOffsetInMeters?: number;
  point?: { latitude: number; longitude: number };
};

export async function getRoute(
  from: Coordinates,
  to: Coordinates,
  mode: TravelMode = 'car',
  language: 'fr' | 'en' = 'fr'
): Promise<Route> {
  if (!API_KEY) {
    throw new RoutingError('no-key', 'Clé TomTom manquante.');
  }

  const query = new URLSearchParams({
    key: API_KEY,
    travelMode: mode,
    instructionsType: 'text',
    language: language === 'fr' ? 'fr-FR' : 'en-GB',
    // Le temps annoncé tient alors compte du trafic observé.
    computeTravelTimeFor: 'all',
  });

  const path = `${from.latitude},${from.longitude}:${to.latitude},${to.longitude}`;

  let payload: any;
  try {
    const response = await fetch(`${BASE_URL}/${path}/json?${query}`);
    payload = await response.json();
  } catch {
    throw new RoutingError(
      'network',
      'Impossible de joindre le service TomTom.'
    );
  }

  const route = payload?.routes?.[0];
  if (!route) {
    throw new RoutingError(
      'no-route',
      payload?.detailedError?.message ??
        payload?.error?.description ??
        'Aucun itinéraire trouvé entre ces deux points.'
    );
  }

  const instructions: TomTomInstruction[] = route.guidance?.instructions ?? [];

  return {
    coordinates: route.legs.flatMap((leg: any) =>
      leg.points.map(
        (point: { latitude: number; longitude: number }) =>
          [point.longitude, point.latitude] as [number, number]
      )
    ),
    lengthInMeters: route.summary.lengthInMeters,
    travelTimeInSeconds: route.summary.travelTimeInSeconds,
    trafficDelayInSeconds: route.summary.trafficDelayInSeconds ?? 0,
    arrivalTime: route.summary.arrivalTime,
    steps: instructions.map((instruction, index) => {
      // TomTom donne la distance depuis le départ : la longueur d'une étape est
      // l'écart avec la suivante, ce qui est ce qu'on veut afficher.
      const start = instruction.routeOffsetInMeters ?? 0;
      const next =
        instructions[index + 1]?.routeOffsetInMeters ??
        route.summary.lengthInMeters;

      return {
        index,
        message: instruction.message ?? '',
        street: instruction.street,
        maneuver: instruction.maneuver ?? 'STRAIGHT',
        lengthInMeters: Math.max(0, next - start),
        coordinate: {
          latitude: instruction.point?.latitude ?? to.latitude,
          longitude: instruction.point?.longitude ?? to.longitude,
        },
      };
    }),
  };
}

/** Icône Ionicons correspondant à une manœuvre TomTom. */
export function maneuverIcon(maneuver: string): string {
  if (maneuver.startsWith('ARRIVE')) return 'flag-outline';
  if (maneuver === 'DEPART') return 'navigate-outline';
  if (maneuver.startsWith('ROUNDABOUT')) return 'sync-outline';
  if (maneuver === 'TAKE_EXIT') return 'exit-outline';
  if (maneuver.includes('LEFT')) return 'arrow-back-outline';
  if (maneuver.includes('RIGHT')) return 'arrow-forward-outline';
  return 'arrow-up-outline';
}

/** « 12 min », « 1 h 05 ». */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${String(minutes % 60).padStart(2, '0')}`;
}

/** « 450 m », « 2,3 km ». */
export function formatLength(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}
