import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  ActivityIndicator, 
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import * as Location from 'expo-location';
import { 
  getAnnonces, 
  Annonce, 
  Category, 
  AnnonceFilters 
} from '@/services/annonceService';
import { getCategories } from '@/services/categoryService';
import FiltersModal from '@/components/FiltersModal';
import { router } from 'expo-router';

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, any> = {
  'hotels': 'bed-outline',
  'appartements': 'home-outline',
  'maisons': 'business-outline',
  'studios': 'apps-outline',
  'villas': 'trail-sign-outline',
  'bureaux': 'desktop-outline',
  'terrains': 'map-outline',
  'commerces': 'cart-outline',
};

export default function HomeScreen() {
  const { user } = useAuth();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [useGPS, setUseGPS] = useState(false);
  
  const [filters, setFilters] = useState<AnnonceFilters>({
    page: 1,
    limit: 10,
    status: 'available',
  });

  const fetchData = useCallback(async (currentFilters: AnnonceFilters) => {
    setLoading(true);
    try {
      const [annoncesRes, categoriesRes] = await Promise.all([
        getAnnonces({
          ...currentFilters,
          category_id: selectedCategoryId || undefined,
          search: searchQuery || undefined,
          ...(useGPS && location ? { 
            lat: location.coords.latitude, 
            lng: location.coords.longitude,
            radius: 50 // 50km radius
          } : {})
        }),
        getCategories()
      ]);
      setAnnonces(annoncesRes?.data || []);
      setCategories(categoriesRes || []);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategoryId, searchQuery, useGPS, location]);

  useEffect(() => {
    fetchData(filters);
  }, [fetchData, filters]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(filters);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const toggleGPS = async () => {
    if (!useGPS) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès à la localisation est nécessaire pour cette fonctionnalité.');
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

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'fr' ? 'en' : 'fr'));
  };

  return (
    <View className="flex-1 bg-dark-bg">
      {/* Sticky Header Section */}
      <View className="bg-dark-bg pt-16 pb-4 z-20">
        <View className="px-6">
          <View className="flex-row items-center justify-between mb-8">
             <View>
               <Text className="text-gray-400 text-sm font-body">
                 {language === 'fr' ? 'Bienvenue 👋' : 'Welcome 👋'}
               </Text>
               <Text className="text-white text-2xl font-body-bold mt-1">
                 {user?.fullName ?? (language === 'fr' ? 'Utilisateur' : 'User')}
               </Text>
             </View>
             
             <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={toggleLanguage}
                  className="w-12 h-12 rounded-2xl bg-dark-surface items-center justify-center border border-white/5"
                >
                  <Text className="text-white font-body-bold text-xs">{language.toUpperCase()}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="w-12 h-12 rounded-2xl bg-dark-surface items-center justify-center border border-white/5"
                  activeOpacity={0.7}
                >
                  <Ionicons name="notifications-outline" size={22} color="white" />
                  <View className="absolute top-3 right-3 w-2 h-2 rounded-full bg-dark-teal border-2 border-dark-surface" />
                </TouchableOpacity>
             </View>
          </View>

          {/* Search Bar + Controls */}
          <View className="flex-row items-center mb-6 gap-2">
            <View className="flex-1 flex-row items-center bg-dark-surface px-4 py-3 rounded-2xl border border-white/5">
              <Ionicons name="search-outline" size={20} color="#6B7280" />
              <TextInput 
                className="flex-1 text-white font-body ml-3 h-10"
                placeholder={language === 'fr' ? 'Dites moi ce que vous cherchez' : 'Tell me what you are looking for'}
                placeholderTextColor="#6B7280"
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>
            
            <TouchableOpacity 
              onPress={toggleGPS}
              className={`w-14 h-14 rounded-2xl items-center justify-center border ${
                useGPS ? 'bg-dark-teal/20 border-dark-teal' : 'bg-dark-surface border-white/5'
              }`}
            >
              <Ionicons name="location-outline" size={22} color={useGPS ? '#00BFA5' : '#6B7280'} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowFilters(true)}
              className="bg-dark-teal w-14 h-14 rounded-2xl items-center justify-center"
            >
              <Ionicons name="options-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories (Still Sticky) */}
        <View className="mb-2">
           <ScrollView 
             horizontal 
             showsHorizontalScrollIndicator={false}
             contentContainerStyle={{ paddingHorizontal: 24 }}
           >
              <TouchableOpacity
                onPress={() => setSelectedCategoryId(null)}
                className={`mr-3 px-5 py-3 rounded-2xl flex-row items-center border ${
                  selectedCategoryId === null ? 'bg-dark-teal border-dark-teal' : 'bg-dark-surface border-white/5'
                }`}
              >
                <Ionicons name="apps-outline" size={16} color={selectedCategoryId === null ? 'white' : '#9CA3AF'} />
                <Text className={`ml-2 font-body-bold text-xs ${selectedCategoryId === null ? 'text-white' : 'text-gray-400'}`}>
                  {language === 'fr' ? 'Tous' : 'All'}
                </Text>
              </TouchableOpacity>

             {categories.map((category) => {
               if (!category) return null;
               const isActive = selectedCategoryId === category.id;
               const iconName = CATEGORY_ICONS[category.slug] || 'business-outline';
               return (
                 <TouchableOpacity
                   key={category.id}
                   onPress={() => setSelectedCategoryId(category.id)}
                   className={`mr-3 px-5 py-3 rounded-2xl flex-row items-center border ${
                     isActive ? 'bg-dark-teal border-dark-teal' : 'bg-dark-surface border-white/5'
                   }`}
                 >
                   <Ionicons 
                     name={iconName} 
                     size={16} 
                     color={isActive ? 'white' : '#9CA3AF'} 
                   />
                   <Text 
                     className={`ml-2 font-body-bold text-xs ${
                       isActive ? 'text-white' : 'text-gray-400'
                     }`}
                   >
                     {category.name}
                   </Text>
                 </TouchableOpacity>
               );
             })}
           </ScrollView>
        </View>
      </View>

      {/* Scrollable Content Section */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00BFA5" />
        }
      >
        <View className="px-6 mt-4">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white text-xl font-body-bold">
              {language === 'fr' ? 'Résultats pour vous' : 'Results for you'}
            </Text>
            <Text className="text-dark-teal font-body-medium">{(annonces || []).length} {language === 'fr' ? 'biens' : 'properties'}</Text>
          </View>
          
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#00BFA5" className="mt-20" />
          ) : (
            <>
              {annonces.map((annonce) => (
                <TouchableOpacity 
                  key={annonce.id} 
                  className="bg-dark-surface rounded-[32px] overflow-hidden border border-white/5 mb-6"
                  activeOpacity={0.9}
                  onPress={() => router.push(`/annonces/${annonce.id}` as any)}
                >
                   <Image 
                     source={{ uri: (annonce.images && annonce.images[0]?.url) || annonce.coverImageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800' }} 
                     className="h-64 w-full bg-gray-800"
                     resizeMode="cover"
                   />
                   <View className="absolute top-4 right-4 bg-black/40 px-3 py-2 rounded-2xl backdrop-blur-md">
                      <View className="flex-row items-center">
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text className="text-white text-xs font-body-bold ml-1">{annonce.avgRating || '4.5'}</Text>
                      </View>
                   </View>

                   <View className="p-6">
                     <View className="flex-row justify-between items-start mb-3">
                       <View className="flex-1 mr-3">
                          <Text className="text-white text-xl font-body-bold" numberOfLines={1}>{annonce.title}</Text>
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="location-outline" size={14} color="#6B7280" />
                            <Text className="text-gray-400 text-xs font-body ml-1">{annonce.ville?.name}, {annonce.commune?.name || 'Gombe'}</Text>
                          </View>
                       </View>
                       <View className="bg-dark-teal/10 px-3 py-1 rounded-lg">
                          <Text className="text-dark-teal text-xs font-body-bold uppercase">{annonce.status}</Text>
                       </View>
                     </View>

                     <View className="h-[1px] bg-white/5 w-full my-4" />

                     <View className="flex-row items-center justify-between">
                       <View>
                          <Text className="text-gray-500 text-xs font-body mb-1">{language === 'fr' ? 'Prix total' : 'Total Price'}</Text>
                          <Text className="text-white font-body-bold text-2xl">
                            {annonce.price} {annonce.currency}
                          </Text>
                       </View>
                       <TouchableOpacity 
                         onPress={() => router.push(`/annonces/${annonce.id}` as any)}
                         className="bg-dark-teal px-6 py-4 rounded-2xl"
                       >
                         <Text className="text-white font-body-bold">{language === 'fr' ? 'Détails' : 'Details'}</Text>
                       </TouchableOpacity>
                     </View>
                   </View>
                </TouchableOpacity>
              ))}
              
              {annonces.length === 0 && (
                <View className="items-center justify-center py-20 bg-dark-surface rounded-[40px] border border-white/5">
                  <View className="w-20 h-20 bg-dark-bg rounded-full items-center justify-center mb-6">
                    <Ionicons name="search-outline" size={40} color="#4B5563" />
                  </View>
                  <Text className="text-white text-lg font-body-bold">{language === 'fr' ? 'Aucun résultat' : 'No results'}</Text>
                  <Text className="text-gray-400 font-body mt-2 text-center px-10">
                    {language === 'fr' ? 'Essayez de modifier vos filtres ou votre recherche.' : 'Try changing your filters or search query.'}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <FiltersModal 
        visible={showFilters} 
        onClose={() => setShowFilters(false)} 
        onApply={applyFilters}
        initialFilters={filters}
      />
    </View>
  );
}
