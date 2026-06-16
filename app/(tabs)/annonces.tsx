import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  ActivityIndicator, 
  Dimensions,
  StyleSheet,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '@/contexts/ThemeContext';
import { getAnnonces, Annonce, AnnonceFilters, Ville } from '@/services/annonceService';
import { getVilles } from '@/services/villeService';
import { router } from 'expo-router';
import FiltersModal from '@/components/FiltersModal';

const { width, height } = Dimensions.get('window');

const INITIAL_REGION = {
  latitude: -4.325,
  longitude: 15.322,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export default function AnnoncesScreen() {
  const { colors } = useTheme();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [useGPS, setUseGPS] = useState(false);
  const mapRef = useRef<MapView>(null);

  const [filters, setFilters] = useState<AnnonceFilters>({
    status: 'available',
    limit: 50
  });

  // Fetch Villes for coordinates
  useEffect(() => {
    getVilles().then(setVilles).catch(console.error);
  }, []);

  const fetchAnnonces = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAnnonces({
        ...filters,
        search: searchQuery || undefined,
        ...(useGPS && location ? { 
          lat: location.coords.latitude, 
          lng: location.coords.longitude,
          radius: 5 
        } : {})
      });
      setAnnonces(response.data);
    } catch (error) {
      console.error('Error fetching annonces:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filters, useGPS, location]);

  useEffect(() => {
    fetchAnnonces();
  }, [fetchAnnonces]);

  // Map follow filters logic
  useEffect(() => {
    if (viewMode === 'map' && mapRef.current) {
      if (useGPS && location) {
        mapRef.current.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } else if (filters.ville_id) {
        const selectedVille = villes.find(v => v.id === filters.ville_id);
        if (selectedVille && selectedVille.latitude && selectedVille.longitude) {
          mapRef.current.animateToRegion({
            latitude: Number(selectedVille.latitude),
            longitude: Number(selectedVille.longitude),
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          });
        }
      }
    }
  }, [filters.ville_id, useGPS, location, viewMode, villes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnnonces();
  };

  const toggleGPS = async () => {
    if (!useGPS) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès à la localisation est nécessaire.');
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      setUseGPS(true);
    } else {
      setUseGPS(false);
      setLocation(null);
    }
  };

  const applyFilters = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const renderPropertyCard = ({ item }: { item: Annonce }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      className="rounded-[32px] overflow-hidden border mb-6 mx-6"
      onPress={() => router.push(`/annonces/${item.id}` as any)}
    >
      <View className="relative">
        <Image 
          source={{ uri: (item.images && item.images[0]?.url) || item.coverImageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800' }} 
          className="h-64 w-full"
          style={{ backgroundColor: colors.skeleton }}
          resizeMode="cover"
        />
        <View style={{ backgroundColor: colors.teal }} className="absolute top-4 left-4 px-3 py-1.5 rounded-full shadow-lg shadow-black/40">
          <Text className="text-white text-[10px] font-body-bold uppercase tracking-wider">{item.category?.name || 'Propriété'}</Text>
        </View>
        <TouchableOpacity style={{ backgroundColor: colors.overlay }} className="absolute top-4 right-4 w-10 h-10 rounded-full items-center justify-center backdrop-blur-md">
          <Ionicons name="heart-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View className="p-6">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-2">
            <Text style={{ color: colors.text }} className="text-xl font-body-bold mb-1" numberOfLines={1}>{item.title}</Text>
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted }} className="text-xs font-body ml-1" numberOfLines={1}>
                {item.ville?.name}{item.commune?.name ? `, ${item.commune.name}` : ''}
              </Text>
            </View>
          </View>
          <View style={{ backgroundColor: colors.border }} className="flex-row items-center px-2 py-1 rounded-lg">
            <Ionicons name="star" size={12} color={colors.star} />
            <Text style={{ color: colors.text }} className="text-[10px] font-body-bold ml-1">{item.avgRating || '4.5'}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: colors.divider }} className="h-[1px] w-full my-4" />

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center">
              <Ionicons name="bed-outline" size={16} color={colors.teal} />
              <Text style={{ color: colors.textSecondary }} className="text-xs font-body-medium ml-1">3 Ch.</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="water-outline" size={16} color={colors.teal} />
              <Text style={{ color: colors.textSecondary }} className="text-xs font-body-medium ml-1">2 Sdb.</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="resize-outline" size={16} color={colors.teal} />
              <Text style={{ color: colors.textSecondary }} className="text-xs font-body-medium ml-1">120m²</Text>
            </View>
          </View>
          <View style={{ backgroundColor: colors.tealSoft }} className="px-3 py-2 rounded-xl">
            <Text style={{ color: colors.teal }} className="text-[10px] font-body-bold uppercase">Détails</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']} style={{ zIndex: 10, backgroundColor: colors.bg, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
        <View className="px-6 py-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text style={{ color: colors.text }} className="text-3xl font-body-bold">Annonces</Text>
            <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="flex-row p-1 rounded-2xl border">
              <TouchableOpacity 
                onPress={() => setViewMode('list')}
                style={{ backgroundColor: viewMode === 'list' ? colors.teal : 'transparent' }}
                className="p-2 px-4 rounded-xl flex-row items-center"
              >
                <Ionicons name="list" size={18} color={viewMode === 'list' ? 'white' : colors.textMuted} />
                {viewMode === 'list' && <Text className="text-white font-body-bold ml-2">Liste</Text>}
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setViewMode('map')}
                style={{ backgroundColor: viewMode === 'map' ? colors.teal : 'transparent' }}
                className="p-2 px-4 rounded-xl flex-row items-center"
              >
                <Ionicons name="map" size={18} color={viewMode === 'map' ? 'white' : colors.textMuted} />
                {viewMode === 'map' && <Text className="text-white font-body-bold ml-2">Carte</Text>}
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="flex-1 flex-row items-center px-4 py-3 rounded-2xl border">
              <Ionicons name="search-outline" size={20} color={colors.icon} />
              <TextInput 
                placeholder="Dites moi ce que vous cherchez"
                placeholderTextColor={colors.icon}
                style={{ color: colors.text }}
                className="flex-1 font-body ml-3 h-10"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={fetchAnnonces}
              />
            </View>
            
            <TouchableOpacity 
              onPress={toggleGPS}
              style={{
                backgroundColor: useGPS ? colors.tealSoft : colors.surface,
                borderColor: useGPS ? colors.teal : colors.border,
              }}
              className="w-12 h-12 rounded-2xl items-center justify-center border"
            >
              <Ionicons name="location-outline" size={22} color={useGPS ? colors.teal : colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowFilters(true)}
              style={{ backgroundColor: colors.teal }}
              className="w-12 h-12 rounded-2xl items-center justify-center"
            >
              <Ionicons name="options-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View className="flex-1">
        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.teal} />
          </View>
        ) : viewMode === 'list' ? (
          <FlatList
            data={annonces}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderPropertyCard}
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center mt-20 px-10">
                <Ionicons name="search-outline" size={48} color={colors.icon} />
                <Text style={{ color: colors.text }} className="text-xl font-body-bold text-center mt-4">Aucune annonce trouvée</Text>
              </View>
            }
          />
        ) : (
          <View className="flex-1">
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={StyleSheet.absoluteFillObject}
              initialRegion={INITIAL_REGION}
              customMapStyle={mapStyle}
              showsUserLocation={true}
            >
              {useGPS && location && (
                <Circle 
                  center={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }}
                  radius={5000} // 5km
                  strokeWidth={2}
                  strokeColor={`${colors.teal}80`}
                  fillColor={`${colors.teal}1A`}
                />
              )}

              {annonces.map((annonce) => {
                if (!annonce.latitude || !annonce.longitude) return null;
                const imageUrl = (annonce.images && annonce.images[0]?.url) || annonce.coverImageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=200';
                
                return (
                  <Marker
                    key={annonce.id}
                    coordinate={{
                      latitude: Number(annonce.latitude),
                      longitude: Number(annonce.longitude),
                    }}
                    onPress={() => router.push(`/annonces/${annonce.id}` as any)}
                  >
                    <View className="items-center">
                      <View style={{ backgroundColor: colors.surface, borderColor: colors.teal }} className="p-1.5 rounded-3xl border-2 shadow-2xl">
                        <Image 
                          source={{ uri: imageUrl }} 
                          className="w-20 h-20 rounded-2xl"
                          style={{ backgroundColor: colors.skeleton }}
                          resizeMode="cover"
                        />
                        <View className="absolute bottom-1 right-1 items-end">
                           <View style={{ backgroundColor: 'white', borderColor: colors.teal }} className="px-2 py-0.5 rounded-full border mb-1">
                             <Text style={{ color: colors.bg }} className="text-[8px] font-body-bold uppercase">{annonce.category?.name || 'Immo'}</Text>
                           </View>
                           <View style={{ backgroundColor: colors.teal }} className="px-3 py-1.5 rounded-xl border border-white shadow-sm">
                             <Text className="text-white text-xs font-body-bold">{annonce.price} {annonce.currency}</Text>
                           </View>
                        </View>
                      </View>
                      <View 
                        style={{
                          width: 0,
                          height: 0,
                          backgroundColor: 'transparent',
                          borderStyle: 'solid',
                          borderLeftWidth: 8,
                          borderRightWidth: 8,
                          borderBottomWidth: 12,
                          borderLeftColor: 'transparent',
                          borderRightColor: 'transparent',
                          borderBottomColor: colors.teal,
                          transform: [{ rotate: '180deg' }],
                          marginTop: -2
                        }}
                      />
                    </View>
                  </Marker>
                );
              })}
            </MapView>
          </View>
        )}
      </View>

      <FiltersModal 
        visible={showFilters} 
        onClose={() => setShowFilters(false)} 
        onApply={applyFilters}
        initialFilters={filters}
      />
    </View>
  );
}

const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#121212" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#2c2c2c" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#000000" }]
  }
];
