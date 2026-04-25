import React, { useState, useEffect, useCallback } from 'react';
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
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { getAnnonces, Annonce, AnnonceFilters } from '@/services/annonceService';
import { router } from 'expo-router';
import FiltersModal from '@/components/FiltersModal';

const { width, height } = Dimensions.get('window');

// Kinshasa default region
const INITIAL_REGION = {
  latitude: -4.325,
  longitude: 15.322,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function AnnoncesScreen() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AnnonceFilters>({
    status: 'available',
    limit: 50
  });

  const fetchAnnonces = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAnnonces({
        ...filters,
        search: searchQuery || undefined,
      });
      setAnnonces(response.data);
    } catch (error) {
      console.error('Error fetching annonces:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filters]);

  useEffect(() => {
    fetchAnnonces();
  }, [fetchAnnonces]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnnonces();
  };

  const applyFilters = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const renderPropertyCard = ({ item }: { item: Annonce }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      className="bg-dark-surface rounded-[24px] overflow-hidden border border-white/5 mb-6 mx-6"
      onPress={() => router.push(`/annonces/${item.id}` as any)}
    >
      <View className="relative">
        <Image 
          source={{ uri: item.images?.[0]?.url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800' }} 
          className="h-56 w-full bg-gray-800"
          resizeMode="cover"
        />
        <View className="absolute top-4 left-4 bg-dark-teal px-3 py-1.5 rounded-full shadow-lg shadow-black/40">
          <Text className="text-white text-xs font-body-bold uppercase tracking-wider">{item.status}</Text>
        </View>
        <TouchableOpacity className="absolute top-4 right-4 bg-black/30 w-10 h-10 rounded-full items-center justify-center backdrop-blur-md">
          <Ionicons name="heart-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View className="p-5">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-dark-teal font-body-bold text-xl">{item.price} {item.currency}</Text>
          <View className="flex-row items-center bg-white/5 px-2 py-1 rounded-lg">
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text className="text-white text-xs font-body-bold ml-1">{item.avgRating || '4.5'}</Text>
          </View>
        </View>
        
        <Text className="text-white text-lg font-body-bold mb-1" numberOfLines={1}>{item.title}</Text>
        
        <View className="flex-row items-center mb-4">
          <Ionicons name="location-outline" size={14} color="#9CA3AF" />
          <Text className="text-gray-400 text-xs font-body ml-1" numberOfLines={1}>
            {item.ville?.name}{item.commune?.name ? `, ${item.commune.name}` : ''}
          </Text>
        </View>

        <View className="h-[1px] bg-white/5 w-full mb-4" />

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-dark-teal/20 items-center justify-center mr-2">
              <Ionicons name="bed-outline" size={16} color="#00BFA5" />
            </View>
            <Text className="text-gray-300 text-xs font-body-medium">3 Ch.</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-dark-teal/20 items-center justify-center mr-2">
              <Ionicons name="water-outline" size={16} color="#00BFA5" />
            </View>
            <Text className="text-gray-300 text-xs font-body-medium">2 Sdb.</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-dark-teal/20 items-center justify-center mr-2">
              <Ionicons name="resize-outline" size={16} color="#00BFA5" />
            </View>
            <Text className="text-gray-300 text-xs font-body-medium">120m²</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-dark-bg">
      {/* Header */}
      <SafeAreaView edges={['top']} className="z-10 bg-dark-bg border-b border-white/5">
        <View className="px-6 py-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-3xl font-body-bold">Annonces</Text>
            <View className="flex-row bg-dark-surface p-1 rounded-2xl border border-white/5">
              <TouchableOpacity 
                onPress={() => setViewMode('list')}
                className={`p-2 px-4 rounded-xl flex-row items-center ${viewMode === 'list' ? 'bg-dark-teal' : ''}`}
              >
                <Ionicons name="list" size={18} color={viewMode === 'list' ? 'white' : '#9CA3AF'} />
                {viewMode === 'list' && <Text className="text-white font-body-bold ml-2">Liste</Text>}
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setViewMode('map')}
                className={`p-2 px-4 rounded-xl flex-row items-center ${viewMode === 'map' ? 'bg-dark-teal' : ''}`}
              >
                <Ionicons name="map" size={18} color={viewMode === 'map' ? 'white' : '#9CA3AF'} />
                {viewMode === 'map' && <Text className="text-white font-body-bold ml-2">Carte</Text>}
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="flex-1 flex-row items-center bg-dark-surface px-4 py-3 rounded-2xl border border-white/5">
              <Ionicons name="search-outline" size={20} color="#6B7280" />
              <TextInput 
                placeholder="Dites moi ce que vous cherchez"
                placeholderTextColor="#6B7280"
                className="flex-1 text-white font-body ml-3 h-10"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={fetchAnnonces}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              onPress={() => setShowFilters(true)}
              className="bg-dark-teal w-12 h-12 rounded-2xl items-center justify-center"
            >
              <Ionicons name="options-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Content */}
      <View className="flex-1">
        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#00BFA5" />
            <Text className="text-gray-400 font-body mt-4">Chargement des annonces...</Text>
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
                <View className="w-24 h-24 bg-dark-surface rounded-full items-center justify-center mb-6">
                  <Ionicons name="search-outline" size={48} color="#374151" />
                </View>
                <Text className="text-white text-xl font-body-bold text-center">Aucune annonce trouvée</Text>
                <Text className="text-gray-500 font-body text-center mt-2">
                  Essayez de modifier votre recherche ou vos filtres.
                </Text>
              </View>
            }
          />
        ) : (
          <View className="flex-1">
            <MapView
              provider={PROVIDER_GOOGLE}
              style={StyleSheet.absoluteFillObject}
              initialRegion={INITIAL_REGION}
              customMapStyle={mapStyle}
            >
              {annonces.map((annonce) => {
                if (!annonce.latitude || !annonce.longitude) return null;
                return (
                  <Marker
                    key={annonce.id}
                    coordinate={{
                      latitude: Number(annonce.latitude),
                      longitude: Number(annonce.longitude),
                    }}
                    onPress={() => {}}
                  >
                    <View className="bg-dark-teal px-3 py-1.5 rounded-full border-2 border-white shadow-lg shadow-black/40">
                      <Text className="text-white font-body-bold text-xs">{annonce.price} {annonce.currency}</Text>
                    </View>
                    <Callout 
                      tooltip 
                      onPress={() => router.push(`/annonces/${annonce.id}` as any)}
                    >
                      <View className="bg-dark-surface rounded-2xl p-4 border border-white/10 shadow-2xl" style={{ width: 220 }}>
                        <Text className="text-white font-body-bold text-sm mb-1" numberOfLines={1}>{annonce.title}</Text>
                        <Text className="text-dark-teal font-body-bold text-base">{annonce.price} {annonce.currency}</Text>
                        <View className="flex-row items-center mt-2">
                          <Ionicons name="star" size={12} color="#FFD700" />
                          <Text className="text-white text-[10px] font-body-bold ml-1">{annonce.avgRating || '4.5'}</Text>
                        </View>
                      </View>
                    </Callout>
                  </Marker>
                );
              })}
            </MapView>

            {/* Floating button to return to list */}
            <TouchableOpacity 
              onPress={() => setViewMode('list')}
              className="absolute bottom-10 left-1/2 -ml-20 bg-dark-teal px-6 py-4 rounded-full flex-row items-center shadow-2xl shadow-black"
            >
              <Ionicons name="list" size={20} color="white" />
              <Text className="text-white font-body-bold ml-2">Afficher la liste</Text>
            </TouchableOpacity>
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
    "stylers": [{ "color": "#212121" }]
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
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#181818" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1b1b1b" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#2c2c2c" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#8a8a8a" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [{ "color": "#373737" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#3c3c3c" }]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [{ "color": "#4e4e4e" }]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#000000" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#3d3d3d" }]
  }
];
