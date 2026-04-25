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
  Linking,
  StyleSheet
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAnnonceById, Annonce } from '@/services/annonceService';
import { createReservation } from '@/services/reservationService';

const { width } = Dimensions.get('window');

export default function AnnonceDetailsScreen() {
  const { id } = useLocalSearchParams();
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

  const handleCall = () => {
    if (annonce?.annonceur?.phone) {
      Linking.openURL(`tel:${annonce.annonceur.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (annonce?.annonceur?.phone) {
      const message = `Bonjour, je suis intéressé par votre annonce "${annonce.title}" sur Nyumba.`;
      Linking.openURL(`whatsapp://send?phone=${annonce.annonceur.phone}&text=${encodeURIComponent(message)}`);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-dark-bg items-center justify-center">
        <ActivityIndicator size="large" color="#00BFA5" />
      </View>
    );
  }

  if (!annonce) return null;

  const images = (annonce.images && annonce.images.length > 0) 
    ? annonce.images 
    : (annonce.coverImageUrl ? [{ url: annonce.coverImageUrl }] : [{ url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800' }]);

  return (
    <View className="flex-1 bg-dark-bg">
      <StatusBar barStyle="light-content" />
      
      {/* Fixed Header Icons */}
      <SafeAreaView className="absolute top-0 left-0 right-0 z-20 flex-row justify-between px-6 pt-4">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-12 h-12 rounded-full bg-black/40 items-center justify-center backdrop-blur-md"
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <View className="flex-row gap-3">
          <TouchableOpacity className="w-12 h-12 rounded-full bg-black/40 items-center justify-center backdrop-blur-md">
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity className="w-12 h-12 rounded-full bg-black/40 items-center justify-center backdrop-blur-md">
            <Ionicons name="heart-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
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
                style={{ width }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Image Pagination Dots */}
          <View className="absolute bottom-12 left-0 right-0 flex-row justify-center gap-2">
            {images.map((_: any, index: number) => (
              <View 
                key={index} 
                className={`h-1.5 rounded-full ${activeImageIndex === index ? 'w-6 bg-dark-teal' : 'w-1.5 bg-white/40'}`} 
              />
            ))}
          </View>
          
          <View className="absolute bottom-8 left-6 bg-dark-teal px-4 py-2 rounded-2xl shadow-2xl">
            <Text className="text-white font-body-bold text-sm uppercase tracking-widest">{annonce.category?.name || 'Propriété'}</Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-6 -mt-6 bg-dark-bg rounded-t-[40px] pt-8">
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1 mr-4">
              <Text className="text-white text-3xl font-body-bold mb-2">{annonce.title}</Text>
              <View className="flex-row items-center">
                <Ionicons name="location" size={16} color="#00BFA5" />
                <Text className="text-gray-400 font-body ml-1">{annonce.ville?.name}, {annonce.address || 'Kinshasa'}</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-dark-teal text-3xl font-body-bold">{annonce.price}</Text>
              <Text className="text-gray-500 font-body-medium text-xs uppercase">{annonce.currency} / mois</Text>
            </View>
          </View>

          {/* Features */}
          <View className="flex-row justify-between bg-dark-surface p-6 rounded-[32px] mb-8 border border-white/5">
            <View className="items-center">
              <View className="w-12 h-12 rounded-2xl bg-dark-teal/10 items-center justify-center mb-2">
                <Ionicons name="bed-outline" size={24} color="#00BFA5" />
              </View>
              <Text className="text-white font-body-bold">3</Text>
              <Text className="text-gray-500 text-[10px] font-body uppercase">Chambres</Text>
            </View>
            <View className="items-center">
              <View className="w-12 h-12 rounded-2xl bg-dark-teal/10 items-center justify-center mb-2">
                <Ionicons name="water-outline" size={24} color="#00BFA5" />
              </View>
              <Text className="text-white font-body-bold">2</Text>
              <Text className="text-gray-500 text-[10px] font-body uppercase">Douches</Text>
            </View>
            <View className="items-center">
              <View className="w-12 h-12 rounded-2xl bg-dark-teal/10 items-center justify-center mb-2">
                <Ionicons name="resize-outline" size={24} color="#00BFA5" />
              </View>
              <Text className="text-white font-body-bold">120</Text>
              <Text className="text-gray-500 text-[10px] font-body uppercase">m² Surface</Text>
            </View>
            <View className="items-center">
              <View className="w-12 h-12 rounded-2xl bg-dark-teal/10 items-center justify-center mb-2">
                <Ionicons name="star-outline" size={24} color="#00BFA5" />
              </View>
              <Text className="text-white font-body-bold">{annonce.avgRating || '4.5'}</Text>
              <Text className="text-gray-500 text-[10px] font-body uppercase">Note</Text>
            </View>
          </View>

          {/* Annonceur / Contact Section */}
          <View className="bg-dark-surface p-6 rounded-[32px] mb-8 border border-white/5">
            <View className="flex-row items-center mb-6">
              <Image 
                source={{ uri: annonce.annonceur?.logoUrl || 'https://ui-avatars.com/api/?name=' + (annonce.annonceur?.name || 'Owner') + '&background=00BFA5&color=fff' }} 
                className="w-16 h-16 rounded-2xl bg-gray-800"
              />
              <View className="ml-4 flex-1">
                <Text className="text-white font-body-bold text-lg">{annonce.annonceur?.name || 'Propriétaire'}</Text>
                <Text className="text-gray-500 font-body text-sm">{annonce.annonceur?.type === 'agence' ? 'Agence Immobilière' : 'Particulier'}</Text>
              </View>
            </View>
            
            <View className="flex-row gap-3">
              <TouchableOpacity 
                onPress={handleCall}
                className="flex-1 bg-white/5 h-14 rounded-2xl flex-row items-center justify-center border border-white/5"
              >
                <Ionicons name="call-outline" size={20} color="white" />
                <Text className="text-white font-body-bold ml-2">Appeler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleWhatsApp}
                className="flex-1 bg-[#25D366]/10 h-14 rounded-2xl flex-row items-center justify-center border border-[#25D366]/20"
              >
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                <Text className="text-[#25D366] font-body-bold ml-2">WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View className="mb-8">
            <Text className="text-white text-xl font-body-bold mb-4">Description</Text>
            <Text className="text-gray-400 font-body leading-7">
              {annonce.description || "Cette magnifique propriété offre tout le confort moderne dans un cadre sécurisé et prestigieux. Idéalement située, elle dispose de finitions haut de gamme et d'un espace de vie généreux."}
            </Text>
          </View>

          {/* Location Map Placeholder */}
          <View className="mb-8">
            <Text className="text-white text-xl font-body-bold mb-4">Localisation</Text>
            <View className="h-48 bg-dark-surface rounded-[32px] overflow-hidden border border-white/5 items-center justify-center">
              <Ionicons name="map-outline" size={48} color="#374151" />
              <Text className="text-gray-500 font-body mt-2">Carte de localisation</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Footer Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-dark-bg/80 border-t border-white/5 px-6 py-6 backdrop-blur-xl">
        <TouchableOpacity 
          onPress={handleBooking}
          disabled={booking}
          className="bg-dark-teal h-16 rounded-[24px] flex-row items-center justify-center shadow-2xl shadow-dark-teal/40"
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
    </View>
  );
}
