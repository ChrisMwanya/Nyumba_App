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
import { useTheme } from '@/contexts/ThemeContext';
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
import { getCategoryFeatures } from '@/constants/features';
import PropertyCard from '@/components/PropertyCard';

const CATEGORY_ICONS: Record<string, any> = {
  'restaurants': 'restaurant-outline',
  'hotels': 'bed-outline',
  'airbnbs': 'home-outline',
  'coins-detente': 'wine-outline',
  'bistrots': 'beer-outline',
  'boites-nuits': 'flash-outline',
};

/** Display order for category filter chips */
const CATEGORY_ORDER: string[] = [
  'airbnbs',
  'hotels',
  'restaurants',
  'coins-detente',
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors, mode, setMode } = useTheme();
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
      const sortedCategories = [...(categoriesRes || [])].sort((a, b) => {
        const indexA = CATEGORY_ORDER.indexOf(a.slug);
        const indexB = CATEGORY_ORDER.indexOf(b.slug);
        // Items not in order list go to end
        const posA = indexA === -1 ? CATEGORY_ORDER.length : indexA;
        const posB = indexB === -1 ? CATEGORY_ORDER.length : indexB;
        return posA - posB;
      });
      setCategories(sortedCategories);
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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Sticky Header Section */}
      <View style={{ backgroundColor: colors.bg, paddingTop: 64, paddingBottom: 16, zIndex: 20 }}>
        <View style={{ paddingHorizontal: 24 }}>
          <View className="flex-row items-center justify-between mb-8">
             <View>
               <Text style={{ color: colors.textMuted }} className="text-sm font-body">
                 {language === 'fr' ? 'Bienvenue 👋' : 'Welcome 👋'}
               </Text>
               <Text style={{ color: colors.text }} className="text-2xl font-body-bold mt-1">
                 {user?.fullName ?? (language === 'fr' ? 'Utilisateur' : 'User')}
               </Text>
             </View>
             
             <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={toggleLanguage}
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                  className="w-12 h-12 rounded-2xl items-center justify-center border"
                >
                  <Text style={{ color: colors.text }} className="font-body-bold text-xs">{language.toUpperCase()}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                  className="w-12 h-12 rounded-2xl items-center justify-center border"
                  activeOpacity={0.7}
                >
                  <Ionicons name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                  className="w-12 h-12 rounded-2xl items-center justify-center border"
                  activeOpacity={0.7}
                >
                  <Ionicons name="notifications-outline" size={22} color={colors.text} />
                  <View style={{ backgroundColor: colors.teal, borderColor: colors.surface }} className="absolute top-3 right-3 w-2 h-2 rounded-full border-2" />
                </TouchableOpacity>
             </View>
          </View>

          {/* Search Bar + Controls */}
          <View className="flex-row items-center mb-6 gap-2">
            <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="flex-1 flex-row items-center px-4 py-3 rounded-2xl border">
              <Ionicons name="search-outline" size={20} color={colors.icon} />
              <TextInput 
                style={{ color: colors.text }}
                className="flex-1 font-body ml-3 h-10"
                placeholder={language === 'fr' ? 'Dites moi ce que vous cherchez' : 'Tell me what you are looking for'}
                placeholderTextColor={colors.icon}
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>
            
            <TouchableOpacity 
              onPress={toggleGPS}
              style={{
                backgroundColor: useGPS ? colors.tealSoft : colors.surface,
                borderColor: useGPS ? colors.teal : colors.border,
              }}
              className="w-14 h-14 rounded-2xl items-center justify-center border"
            >
              <Ionicons name="location-outline" size={22} color={useGPS ? colors.teal : colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowFilters(true)}
              style={{ backgroundColor: colors.teal }}
              className="w-14 h-14 rounded-2xl items-center justify-center"
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
                style={{
                  backgroundColor: selectedCategoryId === null ? colors.teal : colors.surface,
                  borderColor: selectedCategoryId === null ? colors.teal : colors.border,
                }}
                className="mr-3 px-5 py-3 rounded-2xl flex-row items-center border"
              >
                <Ionicons name="apps-outline" size={16} color={selectedCategoryId === null ? 'white' : colors.textMuted} />
                <Text style={{ color: selectedCategoryId === null ? 'white' : colors.textMuted }} className="ml-2 font-body-bold text-xs">
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
                   style={{
                     backgroundColor: isActive ? colors.teal : colors.surface,
                     borderColor: isActive ? colors.teal : colors.border,
                   }}
                   className="mr-3 px-5 py-3 rounded-2xl flex-row items-center border"
                 >
                   <Ionicons 
                     name={iconName} 
                     size={16} 
                     color={isActive ? 'white' : colors.textMuted} 
                   />
                   <Text 
                     style={{ color: isActive ? 'white' : colors.textMuted }}
                     className="ml-2 font-body-bold text-xs"
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />
        }
      >
        <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
          <View className="flex-row items-center justify-between mb-6">
            <Text style={{ color: colors.text }} className="text-xl font-body-bold">
              {language === 'fr' ? 'Résultats pour vous' : 'Results for you'}
            </Text>
            <Text style={{ color: colors.teal }} className="font-body-medium">{(annonces || []).length} {language === 'fr' ? 'biens' : 'properties'}</Text>
          </View>
          
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color={colors.teal} className="mt-20" />
          ) : (
            <>
              {annonces.map((annonce) => (
                <PropertyCard key={annonce.id} annonce={annonce} language={language} />
              ))}
              
              {annonces.length === 0 && (
                <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="items-center justify-center py-20 rounded-[40px] border">
                  <View style={{ backgroundColor: colors.bg }} className="w-20 h-20 rounded-full items-center justify-center mb-6">
                    <Ionicons name="search-outline" size={40} color={colors.icon} />
                  </View>
                  <Text style={{ color: colors.text }} className="text-lg font-body-bold">{language === 'fr' ? 'Aucun résultat' : 'No results'}</Text>
                  <Text style={{ color: colors.textMuted }} className="font-body mt-2 text-center px-10">
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
