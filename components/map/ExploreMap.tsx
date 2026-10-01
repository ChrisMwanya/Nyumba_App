import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { StyleSheet } from 'react-native';

import {
  CAMERA,
  FALLBACK_CENTER,
  MAP_STYLE_URL,
  basemapConfig,
} from '@/constants/map';
import { useTheme } from '@/contexts/ThemeContext';
import type { Annonce } from '@/services/annonceService';
import type { Coordinates } from '@/utils/geo';
import {
  Camera,
  type Camera as CameraRef,
  isMapboxReady,
  LocationPuck,
  MapView,
  MarkerView,
  StyleImport,
} from '@/utils/mapbox';

import AnnonceMarker from './AnnonceMarker';
import MapPlaceholder from './MapPlaceholder';

export type ExploreMapHandle = {
  /** Centre la caméra sur un point, en gardant l'inclinaison courante. */
  focusOn: (
    coords: Coordinates,
    options?: { zoom?: number; bottomPadding?: number }
  ) => void;
  /** Cadre la caméra sur un ensemble de points (résultats d'une recherche). */
  fitTo: (points: Coordinates[], options?: { bottomPadding?: number }) => void;
};

type Props = {
  annonces: Annonce[];
  selectedId: string | null;
  onSelect: (annonce: Annonce | null) => void;
  userCoords: Coordinates | null;
  /** Vue inclinée (bâtiments en relief) ou vue du dessus. */
  in3D: boolean;
};

const ExploreMap = forwardRef<ExploreMapHandle, Props>(function ExploreMap(
  { annonces, selectedId, onSelect, userCoords, in3D },
  ref
) {
  const { colors, isDark } = useTheme();
  const camera = useRef<CameraRef>(null);
  // La caméra ne se recale automatiquement qu'au premier point GPS reçu :
  // ensuite, c'est l'utilisateur qui décide où regarder.
  const didCenterOnUser = useRef(false);

  useImperativeHandle(
    ref,
    () => ({
      focusOn: (coords, options) => {
        camera.current?.setCamera({
          centerCoordinate: [coords.longitude, coords.latitude],
          zoomLevel: options?.zoom ?? CAMERA.zoomFocused,
          pitch: in3D ? CAMERA.pitch3D : CAMERA.pitch2D,
          padding: {
            paddingTop: 0,
            paddingLeft: 0,
            paddingRight: 0,
            paddingBottom: options?.bottomPadding ?? 0,
          },
          animationDuration: 650,
          animationMode: 'easeTo',
        });
      },
      fitTo: (points, options) => {
        if (points.length === 0) return;

        const latitudes = points.map(point => point.latitude);
        const longitudes = points.map(point => point.longitude);

        // Un point unique n'a pas de boîte englobante : on le centre.
        if (points.length === 1) {
          camera.current?.setCamera({
            centerCoordinate: [longitudes[0], latitudes[0]],
            zoomLevel: CAMERA.zoomFocused,
            animationDuration: 650,
          });
          return;
        }

        camera.current?.fitBounds(
          [Math.max(...longitudes), Math.max(...latitudes)],
          [Math.min(...longitudes), Math.min(...latitudes)],
          [80, 60, (options?.bottomPadding ?? 0) + 80, 60],
          700
        );
      },
    }),
    [in3D]
  );

  useEffect(() => {
    if (!userCoords || didCenterOnUser.current) return;
    didCenterOnUser.current = true;
    camera.current?.setCamera({
      centerCoordinate: [userCoords.longitude, userCoords.latitude],
      zoomLevel: CAMERA.zoom,
      pitch: in3D ? CAMERA.pitch3D : CAMERA.pitch2D,
      animationDuration: 900,
    });
  }, [userCoords, in3D]);

  // Bascule 2D / 3D : seule l'inclinaison change, le centre est conservé.
  useEffect(() => {
    camera.current?.setCamera({
      pitch: in3D ? CAMERA.pitch3D : CAMERA.pitch2D,
      animationDuration: 500,
    });
  }, [in3D]);

  if (!isMapboxReady) return <MapPlaceholder />;

  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      styleURL={MAP_STYLE_URL}
      scaleBarEnabled={false}
      logoEnabled={false}
      attributionEnabled
      attributionPosition={{ bottom: 96, left: 12 }}
      compassEnabled
      compassFadeWhenNorth
      compassPosition={{ top: 190, right: 16 }}
      pitchEnabled
      rotateEnabled
      onPress={() => onSelect(null)}
    >
      {/* Configure la 3D du style Standard (bâtiments, relief, éclairage). */}
      <StyleImport id="basemap" existing config={basemapConfig(isDark, in3D)} />

      <Camera
        ref={camera}
        defaultSettings={{
          centerCoordinate: FALLBACK_CENTER,
          zoomLevel: CAMERA.zoom,
          pitch: CAMERA.pitch3D,
        }}
      />

      {userCoords && (
        <LocationPuck
          puckBearing="heading"
          puckBearingEnabled
          pulsing={{ isEnabled: true, color: colors.teal, radius: 'accuracy' }}
        />
      )}

      {annonces.map(annonce => {
        if (annonce.latitude === undefined || annonce.longitude === undefined)
          return null;
        return (
          <MarkerView
            key={annonce.id}
            id={annonce.id}
            coordinate={[annonce.longitude, annonce.latitude]}
            anchor={{ x: 0.5, y: 1 }}
            allowOverlap={annonce.id === selectedId}
          >
            <AnnonceMarker
              annonce={annonce}
              selected={annonce.id === selectedId}
              onPress={() => onSelect(annonce)}
            />
          </MarkerView>
        );
      })}
    </MapView>
  );
});

export default ExploreMap;
