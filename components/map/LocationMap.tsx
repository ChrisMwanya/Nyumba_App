import React from 'react';
import { StyleSheet } from 'react-native';

import { CAMERA, MAP_STYLE_URL, basemapConfig } from '@/constants/map';
import { useTheme } from '@/contexts/ThemeContext';
import type { Annonce } from '@/services/annonceService';
import {
  Camera,
  isMapboxReady,
  LocationPuck,
  MapView,
  MarkerView,
  StyleImport,
} from '@/utils/mapbox';

import AnnonceMarker from './AnnonceMarker';
import MapPlaceholder from './MapPlaceholder';

type Props = {
  annonce: Annonce;
  /** Affiche le point bleu de l'utilisateur (permission déjà accordée). */
  showUser: boolean;
};

/**
 * Aperçu fixe du lieu sur la fiche d'une annonce. Les gestes sont coupés :
 * la carte vit dans un ScrollView et ne doit pas en capturer le défilement.
 */
export default function LocationMap({ annonce, showUser }: Props) {
  const { colors, isDark } = useTheme();

  if (!isMapboxReady) return <MapPlaceholder />;
  if (annonce.latitude === undefined || annonce.longitude === undefined)
    return null;

  const coordinate = [annonce.longitude, annonce.latitude];

  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      styleURL={MAP_STYLE_URL}
      scaleBarEnabled={false}
      logoEnabled={false}
      attributionEnabled
      compassEnabled={false}
      scrollEnabled={false}
      zoomEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
    >
      <StyleImport
        id="basemap"
        existing
        config={basemapConfig(isDark, false)}
      />

      <Camera
        defaultSettings={{
          centerCoordinate: coordinate,
          zoomLevel: CAMERA.zoom,
          pitch: CAMERA.pitch2D,
        }}
      />

      {showUser && (
        <LocationPuck
          pulsing={{ isEnabled: true, color: colors.teal, radius: 'accuracy' }}
        />
      )}

      <MarkerView
        coordinate={coordinate}
        anchor={{ x: 0.5, y: 1 }}
        allowOverlap
      >
        <AnnonceMarker annonce={annonce} selected onPress={() => {}} />
      </MarkerView>
    </MapView>
  );
}
