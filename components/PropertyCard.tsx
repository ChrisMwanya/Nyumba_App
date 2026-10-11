import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import FavoriteButton from '@/components/FavoriteButton';
import { STAR_COLOR } from '@/components/StarRating';
import {
  CATEGORY_INK,
  getCategoryColor,
  getCategoryIcon,
} from '@/constants/categories';
import { getDynamicFeatures, type FeatureItem } from '@/constants/features';
import { useTheme } from '@/contexts/ThemeContext';
import { Annonce, getPriceLabel } from '@/services/annonceService';
import { formatDistance } from '@/utils/geo';
import { openDirections } from '@/utils/map';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800';

/**
 * Un attribut booléen vaut « Oui » : affiché seul à côté d'une icône, ça ne
 * veut rien dire. On montre alors son libellé — « Terrasse » plutôt que « Oui ».
 */
const featureText = (feature: FeatureItem) =>
  feature.value === 'Oui' ? feature.label : feature.value;

interface PropertyCardProps {
  annonce: Annonce;
  language?: 'fr' | 'en';
  /** Distance depuis l'utilisateur, en km, si elle est connue. */
  distance?: number;
}

export default function PropertyCard({
  annonce,
  language = 'fr',
  distance,
}: PropertyCardProps) {
  const { colors } = useTheme();

  const tint = getCategoryColor(annonce.category?.slug);
  const features = getDynamicFeatures(annonce).slice(0, 2);
  const readableDistance = formatDistance(distance);
  const priceLabel = getPriceLabel(annonce);
  const hasCoordinates =
    annonce.latitude !== undefined && annonce.longitude !== undefined;

  return (
    <TouchableOpacity
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      className="mb-4 overflow-hidden rounded-3xl border"
      activeOpacity={0.9}
      onPress={() => router.push(`/annonces/${annonce.id}` as any)}
    >
      <View className="relative">
        <Image
          source={{ uri: annonce.images[0]?.url || PLACEHOLDER_IMAGE }}
          className="h-44 w-full"
          style={{ backgroundColor: colors.skeleton }}
          resizeMode="cover"
        />

        {/* Catégorie et prix posés sur la photo : l'information tient dans la
            hauteur de l'image au lieu d'ajouter des lignes sous elle. */}
        <View
          style={{ backgroundColor: tint }}
          className="absolute bottom-3 left-3 flex-row items-center rounded-full px-3 py-1.5"
        >
          <Ionicons
            name={getCategoryIcon(annonce.category?.slug ?? '')}
            size={12}
            color={CATEGORY_INK}
          />
          <Text
            style={{ color: CATEGORY_INK }}
            className="ml-1.5 font-body-semibold text-[11px]"
          >
            {annonce.category?.name ?? (language === 'fr' ? 'Lieu' : 'Place')}
          </Text>
        </View>

        {annonce.rating.count > 0 && (
          <View
            className="absolute left-3 top-3 flex-row items-center rounded-full bg-black/65 px-2.5 py-1.5"
            accessible
            accessibilityLabel={
              language === 'fr'
                ? `Noté ${annonce.rating.average} sur 5 par ${annonce.rating.count} personnes`
                : `Rated ${annonce.rating.average} out of 5 by ${annonce.rating.count} people`
            }
          >
            <Ionicons name="star" size={12} color={STAR_COLOR} />
            <Text className="ml-1 font-body-bold text-[11px] text-white">
              {language === 'fr'
                ? annonce.rating.average.toFixed(1).replace('.', ',')
                : annonce.rating.average.toFixed(1)}
            </Text>
            <Text className="ml-1 font-body text-[11px] text-white/70">
              ({annonce.rating.count})
            </Text>
          </View>
        )}

        <FavoriteButton annonce={annonce} className="absolute right-3 top-3" />

        {priceLabel && (
          <View className="absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-1.5">
            <Text className="font-body-bold text-[11px] text-white">
              {priceLabel}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row items-start p-4">
        <View className="mr-3 flex-1">
          <Text
            style={{ color: colors.text }}
            className="font-body-bold text-lg"
            numberOfLines={1}
          >
            {annonce.title}
          </Text>

          <View className="mt-1 flex-row items-center">
            <Ionicons name="location-outline" size={13} color={colors.icon} />
            <Text
              style={{ color: colors.textMuted }}
              className="ml-1 flex-1 font-body text-xs"
              numberOfLines={1}
            >
              {[annonce.address, annonce.ville?.name]
                .filter(Boolean)
                .join(', ')}
            </Text>
            {readableDistance && (
              <Text
                style={{ color: colors.teal }}
                className="ml-2 font-body-bold text-xs"
              >
                {readableDistance}
              </Text>
            )}
          </View>

          {features.length > 0 && (
            <View className="mt-2.5 flex-row items-center">
              {features.map((feature, index) => (
                <View key={feature.label} className="flex-row items-center">
                  {index > 0 && (
                    <Text
                      style={{ color: colors.textMuted }}
                      className="mx-2 font-body text-xs"
                    >
                      ·
                    </Text>
                  )}
                  <Ionicons
                    name={feature.icon as any}
                    size={13}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={{ color: colors.textSecondary }}
                    className="ml-1 font-body-medium text-xs"
                    numberOfLines={1}
                  >
                    {featureText(feature)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {hasCoordinates && (
          <TouchableOpacity
            onPress={() =>
              openDirections(
                annonce.latitude!,
                annonce.longitude!,
                annonce.title,
                language
              )
            }
            style={{ backgroundColor: colors.cta }}
            className="h-11 w-11 items-center justify-center rounded-full"
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={
              language === 'fr' ? "Voir l'itinéraire" : 'Get directions'
            }
          >
            <Ionicons name="navigate" size={18} color={colors.ctaText} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
