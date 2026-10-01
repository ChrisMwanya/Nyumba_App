import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import FavoriteButton from '@/components/FavoriteButton';
import BottomSheet from '@/components/BottomSheet';
import { CATEGORY_INK, getCategoryColor } from '@/constants/categories';
import { getDynamicFeatures } from '@/constants/features';
import { useTheme } from '@/contexts/ThemeContext';
import type { Annonce } from '@/services/annonceService';
import { formatDistance } from '@/utils/geo';
import { openDirections } from '@/utils/map';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800';

/** Hauteurs d'accroche : aperçu (photo + actions) puis fiche déployée. */
export const SHEET_SNAP_POINTS = [320, 520];

type Props = {
  annonce: Annonce | null;
  onClose: () => void;
  /** Distance depuis l'utilisateur, en km. */
  distance?: number;
  /** Décalage depuis le bas de l'écran, pour dégager la barre d'onglets. */
  bottomInset?: number;
  language?: 'fr' | 'en';
};

/** Fiche d'un lieu, remontant du bas quand on touche son épingle sur la carte. */
export default function AnnonceSheet({
  annonce,
  onClose,
  distance,
  bottomInset = 0,
  language = 'fr',
}: Props) {
  const { colors } = useTheme();

  if (!annonce) return null;

  const tint = getCategoryColor(annonce.category?.slug);
  const readableDistance = formatDistance(distance);
  const features = getDynamicFeatures(annonce).slice(0, 3);
  const hasCoordinates =
    annonce.latitude !== undefined && annonce.longitude !== undefined;

  return (
    <BottomSheet
      visible
      onClose={onClose}
      snapPoints={SHEET_SNAP_POINTS}
      bottomInset={bottomInset}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 32,
        }}
      >
        <View className="flex-row">
          <View>
            <Image
              source={{ uri: annonce.images[0]?.url || PLACEHOLDER_IMAGE }}
              style={{ backgroundColor: colors.skeleton }}
              className="h-24 w-24 rounded-3xl"
              resizeMode="cover"
            />
            <FavoriteButton
              annonce={annonce}
              size={30}
              className="absolute right-1.5 top-1.5"
            />
          </View>

          <View className="ml-4 flex-1">
            <View className="flex-row items-center">
              <View
                style={{ backgroundColor: tint }}
                className="rounded-full px-3 py-1"
              >
                <Text
                  style={{ color: CATEGORY_INK }}
                  className="font-body-semibold text-[11px]"
                >
                  {annonce.category?.name ??
                    (language === 'fr' ? 'Lieu' : 'Place')}
                </Text>
              </View>

              {readableDistance && (
                <View className="ml-2 flex-row items-center">
                  <Ionicons
                    name="navigate-circle-outline"
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text
                    style={{ color: colors.textMuted }}
                    className="ml-1 font-body text-xs"
                  >
                    {readableDistance}
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={{ color: colors.text }}
              className="mt-2 font-body-bold text-lg"
              numberOfLines={2}
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
            </View>
          </View>
        </View>

        <View className="mt-5 flex-row gap-3">
          <TouchableOpacity
            disabled={!hasCoordinates}
            onPress={() =>
              openDirections(
                annonce.latitude!,
                annonce.longitude!,
                annonce.title
              )
            }
            style={{
              backgroundColor: colors.cta,
              opacity: hasCoordinates ? 1 : 0.4,
            }}
            className="h-14 flex-1 flex-row items-center justify-center rounded-full"
            activeOpacity={0.85}
          >
            <Ionicons name="navigate" size={20} color={colors.ctaText} />
            <Text
              style={{ color: colors.ctaText }}
              className="ml-2 font-body-semibold"
            >
              {language === 'fr' ? 'Itinéraire' : 'Directions'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(`/annonces/${annonce.id}` as any)}
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
            className="h-14 flex-1 flex-row items-center justify-center rounded-full border"
            activeOpacity={0.85}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.text}
            />
            <Text
              style={{ color: colors.text }}
              className="ml-2 font-body-bold"
            >
              {language === 'fr' ? 'Détails' : 'Details'}
            </Text>
          </TouchableOpacity>
        </View>

        {(features.length > 0 || annonce.priceRange) && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
            className="mt-5 rounded-3xl border p-5"
          >
            {annonce.priceRange && (
              <View className="mb-4 flex-row items-center justify-between">
                <Text
                  style={{ color: colors.textMuted }}
                  className="font-body text-xs"
                >
                  {language === 'fr' ? 'Gamme de prix' : 'Price range'}
                </Text>
                <Text style={{ color: colors.teal }} className="font-body-bold">
                  {annonce.priceRange}
                </Text>
              </View>
            )}

            {features.map(feature => (
              <View
                key={feature.label}
                className="flex-row items-center justify-between py-1.5"
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name={feature.icon as any}
                    size={16}
                    color={colors.teal}
                  />
                  <Text
                    style={{ color: colors.textMuted }}
                    className="ml-2 font-body text-xs"
                  >
                    {feature.label}
                  </Text>
                </View>
                <Text
                  style={{ color: colors.text }}
                  className="font-body-medium text-xs"
                >
                  {feature.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {annonce.description && (
          <Text
            style={{ color: colors.textSecondary }}
            className="mt-5 font-body text-sm leading-5"
          >
            {annonce.description}
          </Text>
        )}
      </ScrollView>
    </BottomSheet>
  );
}
