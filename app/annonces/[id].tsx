import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Dimensions,
  StatusBar,
  Alert,
  StyleSheet,
  Linking
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { getAnnonceById, Annonce } from '@/services/annonceService';
import { getCategoryFeatures, getDynamicFeatures } from '@/constants/features';
import { openDirections } from '@/utils/map';

const { width } = Dimensions.get('window');

/** Only these category slugs allow reservations */
const BOOKABLE_CATEGORIES = new Set(['hotels', 'airbnbs', 'restaurants']);

export default function AnnonceDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const [annonce, setAnnonce] = useState<Annonce | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      getAnnonceById(Number(id))
        .then(setAnnonce)
        .catch(error => {
          console.error('Error fetching annonce details:', error);
          Alert.alert('Erreur', 'Impossible de charger les détails de cette annonce.');
          router.back();
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleBooking = () => {
    if (!annonce) return;
    router.push({
      pathname: '/annonces/booking',
      params: { 
        id: annonce.id,
        title: annonce.title,
        price: annonce.price,
        currency: annonce.currency,
        image: images[0]?.url
      }
    } as any);
  };


  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.teal} />
      </View>
    );
  }

  if (!annonce) return null;

  const images = (annonce.images && annonce.images.length > 0) 
    ? annonce.images 
    : (annonce.coverImageUrl ? [{ url: annonce.coverImageUrl }] : [{ url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800' }]);

  const isBookable = BOOKABLE_CATEGORIES.has(annonce.category?.slug || '');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={colors.statusBar === 'dark' ? 'dark-content' : 'light-content'} />
      
      {/* Fixed Header Icons */}
      <SafeAreaView className="absolute top-0 left-0 right-0 z-20 flex-row justify-between px-6 pt-4">
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{ backgroundColor: colors.overlay }}
          className="w-12 h-12 rounded-full items-center justify-center backdrop-blur-md"
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <View className="flex-row gap-3">
          <TouchableOpacity style={{ backgroundColor: colors.overlay }} className="w-12 h-12 rounded-full items-center justify-center backdrop-blur-md">
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={{ backgroundColor: colors.overlay }} className="w-12 h-12 rounded-full items-center justify-center backdrop-blur-md">
            <Ionicons name="heart-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: isBookable ? 120 : 40 }}>
        {/* Image Gallery */}
        <View className="relative">
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              setActiveImageIndex(Math.round(x / width));
            }}
            scrollEventThrottle={16}
          >
            {images.map((img: any, index: number) => (
              <Image 
                key={index}
                source={{ uri: img.url }} 
                className="w-screen h-[450px]"
                style={{ width, backgroundColor: colors.skeleton }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Image Pagination Dots */}
          <View className="absolute bottom-12 left-0 right-0 flex-row justify-center gap-2">
            {images.map((_: any, index: number) => (
              <View 
                key={index} 
                style={{ backgroundColor: activeImageIndex === index ? colors.teal : 'rgba(255,255,255,0.4)' }}
                className={`h-1.5 rounded-full ${activeImageIndex === index ? 'w-6' : 'w-1.5'}`} 
              />
            ))}
          </View>
          
          <View style={{ backgroundColor: colors.teal }} className="absolute bottom-8 left-6 px-4 py-2 rounded-2xl shadow-2xl">
            <Text className="text-white font-body-bold text-sm uppercase tracking-widest">{annonce.category?.name || 'Propriété'}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ backgroundColor: colors.bg }} className="px-6 -mt-6 rounded-t-[40px] pt-8">
          {/* Title & Location */}
          <View className="mb-6">
            <Text style={{ color: colors.text }} className="text-3xl font-body-bold mb-2">{annonce.title}</Text>
            <View className="flex-row items-center mb-3">
              <Ionicons name="location" size={16} color={colors.teal} />
              <Text style={{ color: colors.textMuted }} className="font-body ml-1">
                {[annonce.commune?.name, annonce.ville?.name, annonce.address].filter(Boolean).join(', ') || 'Kinshasa'}
              </Text>
            </View>
            {/* Price */}
            <View className="flex-row items-baseline">
              <Text style={{ color: colors.teal }} className="text-2xl font-body-bold">
                {Number(annonce.price).toLocaleString('fr-FR')} {annonce.currency || 'USD'}
              </Text>
              {isBookable && (
                <Text style={{ color: colors.textMuted }} className="font-body text-sm ml-1">
                  / nuit
                </Text>
              )}
            </View>
          </View>

          {/* Features */}
          <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="flex-row justify-between p-6 rounded-[32px] mb-8 border">
            {getDynamicFeatures(annonce).slice(0, 3).map((feat, idx) => (
              <View key={idx} className="items-center flex-1">
                <View style={{ backgroundColor: colors.tealSoft }} className="w-12 h-12 rounded-2xl items-center justify-center mb-2">
                  <Ionicons name={feat.icon as any} size={24} color={colors.teal} />
                </View>
                <Text style={{ color: colors.text }} className="font-body-bold text-center" numberOfLines={1}>{feat.value}</Text>
                <Text style={{ color: colors.textMuted }} className="text-[10px] font-body uppercase text-center">{feat.label}</Text>
              </View>
            ))}
            <View className="items-center flex-1">
              <View style={{ backgroundColor: colors.tealSoft }} className="w-12 h-12 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="star-outline" size={24} color={colors.teal} />
              </View>
              <Text style={{ color: colors.text }} className="font-body-bold text-center">{annonce.avgRating || '4.5'}</Text>
              <Text style={{ color: colors.textMuted }} className="text-[10px] font-body uppercase text-center">Note</Text>
            </View>
          </View>

          {/* Description */}
          <View className="mb-8">
            <Text style={{ color: colors.text }} className="text-xl font-body-bold mb-4">Description</Text>
            <Text style={{ color: colors.textMuted }} className="font-body leading-7">
              {annonce.description || "Cette magnifique propriété offre tout le confort moderne dans un cadre sécurisé et prestigieux. Idéalement située, elle dispose de finitions haut de gamme et d'un espace de vie généreux."}
            </Text>
          </View>

          {/* Detailed Features */}
          {getDynamicFeatures(annonce).length > 0 && (
            <View className="mb-8">
              <Text style={{ color: colors.text }} className="text-xl font-body-bold mb-4">Informations détaillées</Text>
              <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="rounded-[32px] overflow-hidden border">
                {getDynamicFeatures(annonce).map((feat, idx, arr) => (
                  <View key={idx} style={{ borderBottomColor: colors.divider, borderBottomWidth: idx < arr.length - 1 ? 1 : 0 }} className="flex-row items-center justify-between p-4 px-6">
                    <View className="flex-row items-center">
                      <Ionicons name={feat.icon as any} size={20} color={colors.icon} />
                      <Text style={{ color: colors.textSecondary }} className="font-body ml-3">{feat.label}</Text>
                    </View>
                    <Text style={{ color: colors.text }} className="font-body-bold">{feat.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Specific Links (e.g. Menu for Restaurant) */}
          {annonce.category?.slug === 'restaurants' && annonce.restaurantDetail?.menuUrl && (
            <View className="mb-8">
              <TouchableOpacity 
                 onPress={() => Linking.openURL(annonce.restaurantDetail!.menuUrl!)}
                 style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                 className="h-14 rounded-2xl flex-row items-center justify-center border"
               >
                 <Ionicons name="document-text-outline" size={20} color={colors.teal} />
                 <Text style={{ color: colors.text }} className="font-body-bold ml-2">Voir le menu complet</Text>
               </TouchableOpacity>
            </View>
          )}

          {/* Location Map Placeholder */}
          <View className="mb-8">
            <Text style={{ color: colors.text }} className="text-xl font-body-bold mb-4">Localisation</Text>
            <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="h-48 rounded-[32px] overflow-hidden border items-center justify-center mb-4">
              <Ionicons name="map-outline" size={48} color={colors.icon} />
              <Text style={{ color: colors.textMuted }} className="font-body mt-2">Carte de localisation</Text>
            </View>
            
            {annonce.latitude && annonce.longitude && (
               <TouchableOpacity 
                 onPress={() => openDirections(annonce.latitude!, annonce.longitude!, annonce.title)}
                 style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                 className="h-14 rounded-2xl flex-row items-center justify-center border"
               >
                 <Ionicons name="navigate-outline" size={20} color={colors.teal} />
                 <Text style={{ color: colors.text }} className="font-body-bold ml-2">Obtenir l'itinéraire</Text>
               </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Footer Button — only for bookable categories */}
      {isBookable && (
        <View style={{ backgroundColor: `${colors.bg}CC`, borderTopColor: colors.border }} className="absolute bottom-0 left-0 right-0 border-t px-6 py-6 backdrop-blur-xl">
          <TouchableOpacity 
            onPress={handleBooking}
            disabled={booking}
            style={{ backgroundColor: colors.teal }}
            className="h-16 rounded-[24px] flex-row items-center justify-center shadow-2xl"
          >
            {booking ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="calendar-outline" size={20} color="white" />
                <Text className="text-white font-body-bold text-lg ml-2">Réserver maintenant</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
