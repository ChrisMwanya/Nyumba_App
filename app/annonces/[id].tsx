import FavoriteButton from '@/components/FavoriteButton';
import Button from '@/components/ui/Button';
import {
  CATEGORY_INK,
  getCategoryColor,
  getCategoryIcon,
} from '@/constants/categories';
import { Tiles } from '@/constants/theme';
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
  Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import {
  getAnnonceById,
  getMyReview,
  rateListing,
  Annonce,
  CategoryAttribute,
  ListingRating,
} from '@/services/annonceService';
import { getCategoryAttributes } from '@/services/categoryService';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryFeatures, getDynamicFeatures } from '@/constants/features';
import { openDirections } from '@/utils/map';
import StarRating from '@/components/StarRating';
import LocationMap from '@/components/map/LocationMap';
import { useUserLocation } from '@/hooks/useUserLocation';
import { distanceKm, formatDistance } from '@/utils/geo';

const { width } = Dimensions.get('window');

/** Only these category slugs allow reservations */
const BOOKABLE_CATEGORIES = new Set([
  'hotel',
  'hotels',
  'airbnbs',
  'restaurant',
  'restaurants',
]);

// Pastilles d'aplat des caractéristiques principales
const FEATURE_TILES = [Tiles.mint, Tiles.lilac, Tiles.sky];

export default function AnnonceDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const [annonce, setAnnonce] = useState<Annonce | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [attributeDefs, setAttributeDefs] = useState<CategoryAttribute[]>([]);
  const [rating, setRating] = useState<ListingRating | null>(null);
  const [myRating, setMyRating] = useState(0);
  const [savingRating, setSavingRating] = useState(false);
  const [ratingSaved, setRatingSaved] = useState(false);
  const { accessToken } = useAuth();
  const { coords } = useUserLocation();

  useEffect(() => {
    if (!id) return;
    const listingId = String(id);
    getAnnonceById(listingId)
      .then(data => {
        setAnnonce(data);
        setRating(data.rating);
        // Libellés et ordre des attributs dynamiques de la catégorie
        if (data.category?.slug) {
          getCategoryAttributes(data.category.slug)
            .then(setAttributeDefs)
            .catch(() => {});
        }
      })
      .catch(error => {
        console.error('Error fetching annonce details:', error);
        Alert.alert(
          'Erreur',
          'Impossible de charger les détails de cette annonce.'
        );
        router.back();
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Séparé du chargement de l'annonce : se connecter depuis cette page ne
  // doit recharger que la note de l'utilisateur.
  useEffect(() => {
    if (!id || !accessToken) {
      setMyRating(0);
      return;
    }
    getMyReview(String(id), accessToken)
      .then(review => setMyRating(review?.rating ?? 0))
      .catch(() => {});
  }, [id, accessToken]);

  const handleRate = async (value: number) => {
    if (!accessToken || !annonce) return;
    const previous = myRating;
    // Optimiste : l'étoile s'allume au toucher, on revient en arrière si l'API refuse.
    setMyRating(value);
    setRatingSaved(false);
    setSavingRating(true);
    try {
      const { summary } = await rateListing(annonce.id, value, accessToken);
      setRating(summary);
      setRatingSaved(true);
    } catch {
      setMyRating(previous);
      Alert.alert(
        'Erreur',
        "Votre note n'a pas pu être enregistrée. Réessayez."
      );
    } finally {
      setSavingRating(false);
    }
  };

  const handleBooking = () => {
    if (!annonce) return;
    router.push({
      pathname: '/annonces/booking',
      params: {
        id: annonce.id,
        title: annonce.title,
        image: images[0]?.url,
      },
    } as any);
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.teal} />
      </View>
    );
  }

  if (!annonce) return null;

  const images =
    annonce.images && annonce.images.length > 0
      ? annonce.images
      : [
          {
            url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800',
          },
        ];

  const isBookable = BOOKABLE_CATEGORIES.has(annonce.category?.slug || '');

  const hasCoordinates =
    annonce.latitude !== undefined && annonce.longitude !== undefined;
  // À vol d'oiseau ; inconnue tant que la position n'est pas accordée
  const readableDistance =
    coords && hasCoordinates
      ? formatDistance(
          distanceKm(coords, {
            latitude: annonce.latitude!,
            longitude: annonce.longitude!,
          })
        )
      : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar
        barStyle={
          colors.statusBar === 'dark' ? 'dark-content' : 'light-content'
        }
      />

      {/* Fixed Header Icons */}
      <SafeAreaView className="absolute left-0 right-0 top-0 z-20 flex-row justify-between px-6 pt-4">
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: '#FFFFFF' }}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </TouchableOpacity>
        <View className="flex-row gap-3">
          <TouchableOpacity
            style={{ backgroundColor: '#FFFFFF' }}
            className="h-11 w-11 items-center justify-center rounded-full"
          >
            <Ionicons name="share-outline" size={20} color={colors.ink} />
          </TouchableOpacity>
          <FavoriteButton annonce={annonce} size={44} />
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isBookable ? 120 : 40 }}
      >
        {/* Image Gallery */}
        <View className="relative">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={e => {
              const x = e.nativeEvent.contentOffset.x;
              setActiveImageIndex(Math.round(x / width));
            }}
            scrollEventThrottle={16}
          >
            {images.map((img: any, index: number) => (
              <Image
                key={index}
                source={{ uri: img.url }}
                className="h-[450px] w-screen"
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
                style={{
                  backgroundColor:
                    activeImageIndex === index
                      ? '#FFFFFF'
                      : 'rgba(255,255,255,0.45)',
                }}
                className={`h-1.5 rounded-full ${activeImageIndex === index ? 'w-6' : 'w-1.5'}`}
              />
            ))}
          </View>

          <View
            style={{
              backgroundColor: getCategoryColor(annonce.category?.slug),
            }}
            className="absolute bottom-10 left-6 flex-row items-center rounded-full px-3.5 py-1.5"
          >
            <Ionicons
              name={getCategoryIcon(annonce.category?.slug ?? '')}
              size={14}
              color={CATEGORY_INK}
            />
            <Text
              style={{ color: CATEGORY_INK }}
              className="ml-1.5 font-body-semibold text-sm"
            >
              {annonce.category?.name || 'Lieu'}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View
          style={{ backgroundColor: colors.bg }}
          className="-mt-6 rounded-t-3xl px-6 pt-8"
        >
          {/* Title & Location */}
          <View className="mb-6">
            <Text
              style={{ color: colors.text, letterSpacing: -0.8 }}
              className="mb-2 font-body-bold text-3xl"
            >
              {annonce.title}
            </Text>
            <View className="mb-3 flex-row items-center">
              <Ionicons
                name="location-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text
                style={{ color: colors.textMuted }}
                className="ml-1 font-body"
              >
                {[annonce.address, annonce.ville?.name]
                  .filter(Boolean)
                  .join(', ') || 'Kinshasa'}
              </Text>
            </View>
            {readableDistance && (
              <View className="mb-3 flex-row items-center">
                <Ionicons
                  name="navigate-outline"
                  size={16}
                  color={colors.teal}
                />
                <Text
                  style={{ color: colors.teal }}
                  className="ml-1 font-body-semibold"
                >
                  À {readableDistance} de vous
                </Text>
              </View>
            )}
            {/* Gamme de prix (l'API ne fournit pas de tarif chiffré) */}
            {annonce.priceRange && (
              <Text
                style={{ color: colors.text }}
                className="font-body-bold text-2xl"
              >
                {annonce.priceRange}
              </Text>
            )}
          </View>

          {/* Features */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
            className="mb-8 flex-row justify-between rounded-3xl border p-6"
          >
            {getDynamicFeatures(annonce, attributeDefs)
              .slice(0, 3)
              .map((feat, idx) => (
                <View key={idx} className="flex-1 items-center">
                  <View
                    style={{
                      backgroundColor:
                        FEATURE_TILES[idx % FEATURE_TILES.length],
                    }}
                    className="mb-2 h-12 w-12 items-center justify-center rounded-full"
                  >
                    <Ionicons
                      name={feat.icon as any}
                      size={22}
                      color={colors.ink}
                    />
                  </View>
                  <Text
                    style={{ color: colors.text }}
                    className="text-center font-body-bold"
                    numberOfLines={1}
                  >
                    {feat.value}
                  </Text>
                  <Text
                    style={{ color: colors.textMuted }}
                    className="text-center font-body text-xs"
                  >
                    {feat.label}
                  </Text>
                </View>
              ))}
            <View className="flex-1 items-center">
              <View
                style={{ backgroundColor: Tiles.yellow }}
                className="mb-2 h-12 w-12 items-center justify-center rounded-full"
              >
                <Ionicons name="star" size={22} color={colors.ink} />
              </View>
              <Text
                style={{ color: colors.text }}
                className="text-center font-body-bold"
              >
                {rating?.count ? rating.average.toFixed(1) : '—'}
              </Text>
              <Text
                style={{ color: colors.textMuted }}
                className="text-center font-body text-xs"
              >
                Note
              </Text>
            </View>
          </View>

          {/* Description */}
          <View className="mb-8">
            <Text
              style={{ color: colors.text }}
              className="mb-4 font-body-bold text-xl"
            >
              Description
            </Text>
            <Text
              style={{ color: colors.textMuted }}
              className="font-body leading-7"
            >
              {annonce.description ||
                "Cette magnifique propriété offre tout le confort moderne dans un cadre sécurisé et prestigieux. Idéalement située, elle dispose de finitions haut de gamme et d'un espace de vie généreux."}
            </Text>
          </View>

          {/* Detailed Features */}
          {getDynamicFeatures(annonce, attributeDefs).length > 0 && (
            <View className="mb-8">
              <Text
                style={{ color: colors.text }}
                className="mb-4 font-body-bold text-xl"
              >
                Informations détaillées
              </Text>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
                className="overflow-hidden rounded-3xl border"
              >
                {getDynamicFeatures(annonce, attributeDefs).map(
                  (feat, idx, arr) => (
                    <View
                      key={idx}
                      style={{
                        borderBottomColor: colors.divider,
                        borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                      }}
                      className="flex-row items-center justify-between p-4 px-6"
                    >
                      <View className="flex-row items-center">
                        <Ionicons
                          name={feat.icon as any}
                          size={20}
                          color={colors.icon}
                        />
                        <Text
                          style={{ color: colors.textSecondary }}
                          className="ml-3 font-body"
                        >
                          {feat.label}
                        </Text>
                      </View>
                      <Text
                        style={{ color: colors.text }}
                        className="font-body-bold"
                      >
                        {feat.value}
                      </Text>
                    </View>
                  )
                )}
              </View>
            </View>
          )}

          {/* Localisation */}
          <View className="mb-8">
            <View className="mb-4 flex-row items-center justify-between">
              <Text
                style={{ color: colors.text }}
                className="font-body-bold text-xl"
              >
                Localisation
              </Text>
              {readableDistance && (
                <Text
                  style={{ color: colors.textMuted }}
                  className="font-body text-sm"
                >
                  À {readableDistance} de vous
                </Text>
              )}
            </View>
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
              className="mb-4 h-48 items-center justify-center overflow-hidden rounded-3xl border"
            >
              {hasCoordinates ? (
                <LocationMap annonce={annonce} showUser={coords !== null} />
              ) : (
                <>
                  <Ionicons name="map-outline" size={48} color={colors.icon} />
                  <Text
                    style={{ color: colors.textMuted }}
                    className="mt-2 font-body"
                  >
                    Position non renseignée
                  </Text>
                </>
              )}
            </View>

            {hasCoordinates && (
              <TouchableOpacity
                onPress={() =>
                  openDirections(
                    annonce.latitude!,
                    annonce.longitude!,
                    annonce.title
                  )
                }
                style={{ borderColor: colors.input }}
                className="h-14 flex-row items-center justify-center rounded-full border"
              >
                <Ionicons
                  name="navigate-outline"
                  size={20}
                  color={colors.text}
                />
                <Text
                  style={{ color: colors.text }}
                  className="ml-2 font-body-semibold"
                >
                  Obtenir l&apos;itinéraire
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Note de l'utilisateur : une seule ligne, en fin de fiche */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
            className="mb-8 flex-row items-center justify-between rounded-3xl border px-5 py-4"
          >
            <View className="mr-3 shrink">
              <Text style={{ color: colors.text }} className="font-body-bold">
                {ratingSaved
                  ? 'Merci pour votre note !'
                  : myRating
                    ? 'Votre note'
                    : 'Noter ce lieu'}
              </Text>
              <Text
                style={{ color: colors.textMuted }}
                className="mt-0.5 font-body text-xs"
              >
                {rating && rating.count > 0
                  ? `${rating.average.toFixed(1).replace('.', ',')} · ${rating.count} avis`
                  : 'Aucun avis pour l’instant'}
              </Text>
            </View>

            {accessToken ? (
              <View className="flex-row items-center">
                {savingRating && (
                  <ActivityIndicator
                    size="small"
                    color={colors.teal}
                    className="mr-2"
                  />
                )}
                <StarRating
                  value={myRating}
                  size={26}
                  onChange={handleRate}
                  disabled={savingRating}
                />
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login' as any)}
                style={{ backgroundColor: colors.tealSoft }}
                className="h-10 flex-row items-center justify-center rounded-full px-4"
              >
                <Ionicons
                  name="log-in-outline"
                  size={16}
                  color={colors.tealInk}
                />
                <Text
                  style={{ color: colors.tealInk }}
                  className="ml-1.5 font-body-semibold text-sm"
                >
                  Se connecter
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Footer Button — only for bookable categories */}
      {isBookable && (
        <View
          style={{ backgroundColor: colors.bg, borderTopColor: colors.border }}
          className="absolute bottom-0 left-0 right-0 border-t px-6 pb-8 pt-4"
        >
          <View className="flex-row items-center justify-between">
            <View className="mr-4 shrink">
              {annonce.priceRange ? (
                <Text
                  style={{ color: colors.text }}
                  className="font-body-bold text-xl"
                >
                  {annonce.priceRange}
                </Text>
              ) : null}
              <Text
                style={{ color: colors.textMuted }}
                className="font-body text-xs"
              >
                {annonce.category?.name || 'Réservation'}
              </Text>
            </View>
            <Button
              title="Réserver"
              icon="calendar-outline"
              onPress={handleBooking}
              loading={booking}
              className="px-8"
            />
          </View>
        </View>
      )}
    </View>
  );
}
