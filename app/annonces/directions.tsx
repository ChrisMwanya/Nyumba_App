import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  TouchableOpacity, 
  StyleSheet,
  Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '@/contexts/ThemeContext';

const TOMTOM_API_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY || '';

export default function DirectionsScreen() {
  const params = useLocalSearchParams();
  const destLat = Number(params.latitude);
  const destLng = Number(params.longitude);
  const destTitle = (params.title as string) || 'Destination';

  const { colors, mode } = useTheme();
  const mapRef = useRef<MapView>(null);
  
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<{latitude: number, longitude: number}[]>([]);
  const [routeInfo, setRouteInfo] = useState<{distance?: string, time?: string}>({});

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission refusée', 'L\'accès à la localisation est nécessaire pour tracer l\'itinéraire.');
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);

        if (TOMTOM_API_KEY) {
          await fetchRoute(location.coords.latitude, location.coords.longitude, destLat, destLng);
        } else {
          Alert.alert('Erreur', 'Clé API TomTom manquante.');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting location or route:', error);
        Alert.alert('Erreur', 'Impossible de calculer l\'itinéraire.');
        setLoading(false);
      }
    })();
  }, [destLat, destLng]);

  const fetchRoute = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    try {
      const url = `https://api.tomtom.com/routing/1/calculateRoute/${startLat},${startLng}:${endLat},${endLng}/json?key=${TOMTOM_API_KEY}`;
      const response = await fetch(url);
      const json = await response.json();

      if (json.routes && json.routes.length > 0) {
        const points = json.routes[0].legs[0].points.map((p: any) => ({
          latitude: p.latitude,
          longitude: p.longitude
        }));
        setRouteCoordinates(points);
        
        const summary = json.routes[0].summary;
        const distanceKm = (summary.lengthInMeters / 1000).toFixed(1);
        const timeMin = Math.round(summary.travelTimeInSeconds / 60);
        
        setRouteInfo({
          distance: `${distanceKm} km`,
          time: `${timeMin} min`
        });

        // Fit map to coordinates
        if (mapRef.current) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(
              [{ latitude: startLat, longitude: startLng }, { latitude: endLat, longitude: endLng }],
              { edgePadding: { top: 100, right: 50, bottom: 150, left: 50 }, animated: true }
            );
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error fetching route from TomTom:', error);
      Alert.alert('Erreur', 'Impossible de récupérer l\'itinéraire.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg, zIndex: 10 }}>
        <View className="flex-row items-center px-4 py-4 border-b" style={{ borderBottomColor: colors.border }}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ backgroundColor: colors.surface }}
            className="w-10 h-10 rounded-full items-center justify-center mr-4"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text style={{ color: colors.text }} className="text-lg font-body-bold">Itinéraire</Text>
            <Text style={{ color: colors.textMuted }} className="text-xs font-body" numberOfLines={1}>Vers {destTitle}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.teal} />
            <Text style={{ color: colors.textMuted, marginTop: 16 }} className="font-body">Calcul de l'itinéraire...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFillObject}
            initialRegion={userLocation ? {
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            } : {
              latitude: destLat,
              longitude: destLng,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
            showsUserLocation={true}
            customMapStyle={mode === 'dark' ? darkMapStyle : lightMapStyle}
          >
            {/* Destination Marker */}
            <Marker coordinate={{ latitude: destLat, longitude: destLng }}>
               <View className="items-center">
                 <View style={{ backgroundColor: colors.teal, borderColor: 'white' }} className="w-10 h-10 rounded-full border-2 items-center justify-center shadow-lg">
                   <Ionicons name="location" size={20} color="white" />
                 </View>
                 <View 
                   style={{
                     width: 0,
                     height: 0,
                     backgroundColor: 'transparent',
                     borderStyle: 'solid',
                     borderLeftWidth: 6,
                     borderRightWidth: 6,
                     borderBottomWidth: 10,
                     borderLeftColor: 'transparent',
                     borderRightColor: 'transparent',
                     borderBottomColor: colors.teal,
                     transform: [{ rotate: '180deg' }],
                     marginTop: -2
                   }}
                 />
               </View>
            </Marker>

            {/* Route Polyline */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={5}
                strokeColor={colors.teal}
              />
            )}
          </MapView>
        )}

        {/* Route Info Bottom Sheet */}
        {!loading && routeInfo.time && (
          <View style={{ backgroundColor: colors.surface, borderTopColor: colors.border }} className="absolute bottom-0 left-0 right-0 px-6 py-8 border-t rounded-t-[40px] shadow-2xl">
             <View className="flex-row items-center justify-between mb-4">
               <View>
                 <Text style={{ color: colors.text }} className="text-3xl font-body-bold">{routeInfo.time}</Text>
                 <Text style={{ color: colors.textMuted }} className="font-body text-base mt-1">{routeInfo.distance}</Text>
               </View>
               <TouchableOpacity 
                 style={{ backgroundColor: colors.teal }}
                 className="w-14 h-14 rounded-full items-center justify-center shadow-lg"
               >
                 <Ionicons name="navigate" size={24} color="white" />
               </TouchableOpacity>
             </View>
          </View>
        )}
      </View>
    </View>
  );
}

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#121212" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

const lightMapStyle = [
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }
];
