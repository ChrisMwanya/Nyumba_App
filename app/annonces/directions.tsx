import Button from '@/components/ui/Button';
import { FloatShadow, Tiles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomSheet from '@/components/BottomSheet';
import MapPlaceholder from '@/components/map/MapPlaceholder';
import { CAMERA, MAP_STYLE_URL, basemapConfig } from '@/constants/map';
import { useTheme } from '@/contexts/ThemeContext';
import { distanceKm } from '@/utils/geo';
import {
  formatDuration,
  formatLength,
  getRoute,
  maneuverIcon,
  RoutingError,
  type Coordinates,
  type Route,
  type TravelMode,
} from '@/services/routingService';
import {
  Camera,
  type Camera as CameraRef,
  isMapboxReady,
  LineLayer,
  LocationPuck,
  MapView,
  MarkerView,
  ShapeSource,
  StyleImport,
} from '@/utils/mapbox';

/** Hauteurs de la feuille : résumé seul, puis résumé + liste des étapes. */
const SHEET_SNAP_POINTS = [230, 520];

const MODES: { mode: TravelMode; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'car', icon: 'car-outline' },
  { mode: 'pedestrian', icon: 'walk-outline' },
  { mode: 'bicycle', icon: 'bicycle-outline' },
];

const LABELS = {
  fr: {
    modes: { car: 'Voiture', pedestrian: 'À pied', bicycle: 'Vélo' },
    towards: 'Itinéraire vers',
    computing: "Calcul de l'itinéraire…",
    arrival: 'Arrivée',
    traffic: 'de trafic',
    steps: 'Étapes',
    openInMaps: 'Lancer la navigation',
    retry: 'Réessayer',
    permissionTitle: 'Position nécessaire',
    permissionBody:
      "Pour tracer un itinéraire, Nyumba a besoin de savoir d'où vous partez.",
    openSettings: 'Ouvrir les réglages',
    noKey: 'Le service de calcul d’itinéraire n’est pas configuré.',
    noRoute: 'Aucun itinéraire trouvé jusqu’à ce lieu.',
    tooFarTitle: 'Ce lieu est trop loin de vous',
    tooFarBody: (distance: string) =>
      `Il se trouve à environ ${distance} à vol d’oiseau : aucune route ne relie votre position à cet endroit. Si vous testez sur un simulateur, réglez sa position sur Kinshasa.`,
    network: 'Connexion au service d’itinéraire impossible.',
  },
  en: {
    modes: { car: 'Car', pedestrian: 'Walk', bicycle: 'Bike' },
    towards: 'Directions to',
    computing: 'Calculating route…',
    arrival: 'Arrival',
    traffic: 'of traffic',
    steps: 'Steps',
    openInMaps: 'Start navigation',
    retry: 'Try again',
    permissionTitle: 'Location needed',
    permissionBody:
      'To draw a route, Nyumba needs to know where you are starting from.',
    openSettings: 'Open Settings',
    noKey: 'The routing service is not configured.',
    noRoute: 'No route found to this place.',
    tooFarTitle: 'This place is too far away',
    tooFarBody: (distance: string) =>
      `It is about ${distance} away as the crow flies: no road connects your position to it. If you are testing on a simulator, set its location to Kinshasa.`,
    network: 'Could not reach the routing service.',
  },
} as const;

export default function DirectionsScreen() {
  const params = useLocalSearchParams();
  const language = params.language === 'en' ? 'en' : 'fr';
  const t = LABELS[language];
  const destinationTitle = (params.title as string) || 'Destination';

  const destination: Coordinates = useMemo(
    () => ({
      latitude: Number(params.latitude),
      longitude: Number(params.longitude),
    }),
    [params.latitude, params.longitude]
  );

  const { colors, isDark } = useTheme();
  const camera = useRef<CameraRef>(null);

  const [mode, setMode] = useState<TravelMode>('car');
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    title?: string;
    message: string;
    canRetry: boolean;
  } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const routeShape = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: route?.coordinates ?? [],
      },
    }),
    [route]
  );

  const fitToRoute = useCallback(
    (from: Coordinates) => {
      camera.current?.fitBounds(
        [
          Math.max(from.longitude, destination.longitude),
          Math.max(from.latitude, destination.latitude),
        ],
        [
          Math.min(from.longitude, destination.longitude),
          Math.min(from.latitude, destination.latitude),
        ],
        [110, 60, SHEET_SNAP_POINTS[0] + 60, 60],
        800
      );
    },
    [destination]
  );

  /** Récupère la position puis calcule l'itinéraire pour le mode courant. */
  const computeRoute = useCallback(
    async (travelMode: TravelMode) => {
      setLoading(true);
      setError(null);

      let from = origin;

      try {
        if (!from) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setPermissionDenied(true);
            return;
          }
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          from = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setOrigin(from);
          setPermissionDenied(false);
        }

        setRoute(await getRoute(from, destination, travelMode, language));
        fitToRoute(from);
      } catch (caught) {
        const kind = caught instanceof RoutingError ? caught.kind : 'network';
        setRoute(null);

        // Un échec de routage à l'échelle intercontinentale n'est pas une
        // panne : c'est qu'aucune route ne relie les deux points. Le dire
        // évite de faire chercher un problème là où il n'y en a pas.
        const crowFlies = from ? distanceKm(from, destination) : 0;
        const tooFar = kind === 'no-route' && crowFlies > 1500;

        setError({
          title: tooFar ? t.tooFarTitle : undefined,
          message: tooFar
            ? t.tooFarBody(
                `${Math.round(crowFlies).toLocaleString(
                  language === 'fr' ? 'fr-FR' : 'en-GB'
                )} km`
              )
            : kind === 'no-key'
              ? t.noKey
              : kind === 'no-route'
                ? t.noRoute
                : t.network,
          // Ni une clé absente ni une distance infranchissable ne changeront
          // au second essai.
          canRetry: kind !== 'no-key' && !tooFar,
        });
      } finally {
        setLoading(false);
      }
    },
    [destination, fitToRoute, language, origin, t]
  );

  useEffect(() => {
    computeRoute(mode);
    // Un changement de mode relance le calcul ; `computeRoute` ne doit pas
    // déclencher l'effet, sa référence changeant à chaque position reçue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /** Passe le relais à l'application de navigation du téléphone. */
  const openInMaps = () => {
    const { latitude, longitude } = destination;
    const url = Platform.select({
      ios: `maps://?daddr=${latitude},${longitude}&dirflg=${
        mode === 'pedestrian' ? 'w' : mode === 'bicycle' ? 'r' : 'd'
      }`,
      android: `google.navigation:q=${latitude},${longitude}&mode=${
        mode === 'pedestrian' ? 'w' : mode === 'bicycle' ? 'b' : 'd'
      }`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
      );
    });
  };

  const arrivalClock = route?.arrivalTime
    ? new Date(route.arrivalTime).toLocaleTimeString(
        language === 'fr' ? 'fr-FR' : 'en-GB',
        { hour: '2-digit', minute: '2-digit' }
      )
    : null;

  /* ------------------------------------------------------------------ */

  const roundButton = (
    icon: keyof typeof Ionicons.glyphMap,
    onPress: () => void
  ) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        ...FloatShadow,
      }}
      className="h-12 w-12 items-center justify-center rounded-full border"
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={22} color={colors.text} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {isMapboxReady ? (
        <MapView
          style={StyleSheet.absoluteFillObject}
          styleURL={MAP_STYLE_URL}
          scaleBarEnabled={false}
          logoEnabled={false}
          attributionPosition={{ bottom: SHEET_SNAP_POINTS[0] + 12, left: 12 }}
          compassEnabled={false}
        >
          <StyleImport
            id="basemap"
            existing
            config={basemapConfig(isDark, true)}
          />

          <Camera
            ref={camera}
            defaultSettings={{
              centerCoordinate: [destination.longitude, destination.latitude],
              zoomLevel: CAMERA.zoomFocused,
              pitch: CAMERA.pitch3D,
            }}
          />

          {origin && <LocationPuck puckBearing="course" puckBearingEnabled />}

          {route && route.coordinates.length > 1 && (
            <ShapeSource id="route" shape={routeShape}>
              {/* Liseré sombre sous le tracé : sans lui, le teal se perd sur
                  les zones claires de la carte. */}
              <LineLayer
                id="route-casing"
                style={{
                  lineColor: isDark ? '#000000' : '#FFFFFF',
                  lineWidth: 10,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              <LineLayer
                id="route-line"
                style={{
                  // Tracé marine comme sur la landing ; teal vif sur fond sombre
                  lineColor: isDark ? colors.teal : colors.navy,
                  lineWidth: 6,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </ShapeSource>
          )}

          <MarkerView
            coordinate={[destination.longitude, destination.latitude]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View className="items-center">
              <View
                style={{ backgroundColor: Tiles.coral, borderColor: '#FFFFFF' }}
                className="h-11 w-11 items-center justify-center rounded-full border-[3px]"
              >
                <Ionicons name="flag" size={19} color={colors.ink} />
              </View>
              <View
                style={{
                  width: 0,
                  height: 0,
                  borderLeftWidth: 6,
                  borderRightWidth: 6,
                  borderTopWidth: 10,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderTopColor: '#FFFFFF',
                  marginTop: -1,
                }}
              />
            </View>
          </MarkerView>
        </MapView>
      ) : (
        <MapPlaceholder />
      )}

      {/* Retour + sélecteur de mode */}
      <SafeAreaView
        edges={['top']}
        pointerEvents="box-none"
        className="absolute inset-x-0 top-0"
      >
        <View
          className="flex-row items-center px-6 pt-2"
          pointerEvents="box-none"
        >
          {roundButton('chevron-back', () => router.back())}

          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              ...FloatShadow,
            }}
            className="ml-3 flex-1 flex-row items-center rounded-full border p-1.5"
          >
            {MODES.map(({ mode: candidate, icon }) => {
              const active = mode === candidate;
              return (
                <TouchableOpacity
                  key={candidate}
                  onPress={() => setMode(candidate)}
                  style={{
                    backgroundColor: active ? colors.cta : 'transparent',
                  }}
                  className="flex-1 flex-row items-center justify-center rounded-full py-2"
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={icon}
                    size={16}
                    color={active ? colors.ctaText : colors.textSecondary}
                  />
                  <Text
                    style={{
                      color: active ? colors.ctaText : colors.textSecondary,
                    }}
                    className="ml-1.5 font-body-semibold text-xs"
                  >
                    {t.modes[candidate]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SafeAreaView>

      {/* Feuille : résumé, puis étapes */}
      <BottomSheet
        visible
        onClose={() => router.back()}
        snapPoints={SHEET_SNAP_POINTS}
      >
        <View className="px-6 pb-6 pt-2">
          <Text
            style={{ color: colors.textMuted }}
            className="font-body text-sm"
          >
            {t.towards}
          </Text>
          <Text
            style={{ color: colors.text }}
            className="mt-1 font-body-bold text-xl"
            numberOfLines={1}
          >
            {destinationTitle}
          </Text>
        </View>

        {loading ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color={colors.teal} />
            <Text
              style={{ color: colors.textMuted }}
              className="mt-4 font-body text-sm"
            >
              {t.computing}
            </Text>
          </View>
        ) : permissionDenied ? (
          <View className="px-6">
            <Text style={{ color: colors.text }} className="font-body-bold">
              {t.permissionTitle}
            </Text>
            <Text
              style={{ color: colors.textMuted }}
              className="mt-2 font-body text-sm"
            >
              {t.permissionBody}
            </Text>
            <Button
              title={t.openSettings}
              onPress={() => Linking.openSettings()}
              className="mt-5"
            />
          </View>
        ) : error ? (
          <View className="px-6">
            <View className="flex-row items-start">
              <Ionicons
                name={error.title ? 'map-outline' : 'alert-circle-outline'}
                size={20}
                color={error.title ? colors.textMuted : colors.error}
                style={{ marginTop: 1 }}
              />
              <View className="ml-2 flex-1">
                {error.title && (
                  <Text
                    style={{ color: colors.text }}
                    className="mb-1 font-body-bold"
                  >
                    {error.title}
                  </Text>
                )}
                <Text
                  style={{
                    color: error.title ? colors.textMuted : colors.text,
                  }}
                  className="font-body text-sm leading-5"
                >
                  {error.message}
                </Text>
              </View>
            </View>
            {error.canRetry && (
              <Button
                title={t.retry}
                onPress={() => computeRoute(mode)}
                className="mt-5"
              />
            )}
          </View>
        ) : route ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
              className="flex-row items-center justify-between rounded-3xl border p-5"
            >
              <View>
                <View className="flex-row items-baseline">
                  <Text
                    style={{ color: colors.text, letterSpacing: -0.8 }}
                    className="font-body-bold text-3xl"
                  >
                    {formatDuration(route.travelTimeInSeconds)}
                  </Text>
                  <Text
                    style={{ color: colors.textMuted }}
                    className="ml-2 font-body text-sm"
                  >
                    {formatLength(route.lengthInMeters)}
                  </Text>
                </View>

                <View className="mt-1 flex-row items-center">
                  {arrivalClock && (
                    <Text
                      style={{ color: colors.textMuted }}
                      className="font-body text-xs"
                    >
                      {t.arrival} {arrivalClock}
                    </Text>
                  )}
                  {route.trafficDelayInSeconds > 60 && (
                    <Text
                      style={{ color: colors.warning }}
                      className="ml-2 font-body-medium text-xs"
                    >
                      +{formatDuration(route.trafficDelayInSeconds)} {t.traffic}
                    </Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                onPress={openInMaps}
                style={{ backgroundColor: colors.cta }}
                className="h-14 w-14 items-center justify-center rounded-full"
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t.openInMaps}
              >
                <Ionicons name="navigate" size={24} color={colors.ctaText} />
              </TouchableOpacity>
            </View>

            {route.steps.length > 0 && (
              <>
                <Text
                  style={{ color: colors.textMuted }}
                  className="mb-3 mt-6 font-body-semibold text-sm"
                >
                  {t.steps}
                </Text>

                {route.steps.map(step => (
                  <TouchableOpacity
                    key={step.index}
                    onPress={() =>
                      camera.current?.setCamera({
                        centerCoordinate: [
                          step.coordinate.longitude,
                          step.coordinate.latitude,
                        ],
                        zoomLevel: 17,
                        animationDuration: 500,
                      })
                    }
                    className="flex-row items-start py-3"
                    activeOpacity={0.7}
                  >
                    <View
                      style={{ backgroundColor: colors.muted }}
                      className="mr-3 h-9 w-9 items-center justify-center rounded-full"
                    >
                      <Ionicons
                        name={maneuverIcon(step.maneuver) as any}
                        size={17}
                        color={colors.text}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        style={{ color: colors.text }}
                        className="font-body text-sm"
                      >
                        {step.message}
                      </Text>
                      {step.lengthInMeters > 0 && (
                        <Text
                          style={{ color: colors.textMuted }}
                          className="mt-0.5 font-body text-xs"
                        >
                          {formatLength(step.lengthInMeters)}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        ) : null}
      </BottomSheet>
    </View>
  );
}
