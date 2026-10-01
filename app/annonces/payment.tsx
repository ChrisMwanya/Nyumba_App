import Button from '@/components/ui/Button';
import { Tiles } from '@/constants/theme';
import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { createReservation } from '@/services/reservationService';
import { useAuth } from '@/contexts/AuthContext';

export default function ConfirmationScreen() {
  const params = useLocalSearchParams();
  const { annonce_id, start_date, end_date, guests_count, title } = params;

  const { colors } = useTheme();
  const { accessToken } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    if (!accessToken) {
      Alert.alert(
        'Erreur',
        'Vous devez être connecté pour effectuer une réservation.'
      );
      return;
    }

    setProcessing(true);
    try {
      // 1. Create Reservation directly (no payment required)
      await createReservation(
        {
          listingId: String(annonce_id),
          startDate: start_date as string,
          endDate: end_date as string,
          guestsCount: Number(guests_count),
        },
        accessToken
      );

      setConfirmed(true);
    } catch (error) {
      console.error('Reservation confirmation error:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la confirmation de votre réservation.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const formatDateLabel = (dateStr: any) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (confirmed) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg }}
        className="items-center justify-center px-10"
      >
        <View
          style={{ backgroundColor: Tiles.mint }}
          className="mb-8 h-24 w-24 items-center justify-center rounded-full"
        >
          <Ionicons name="checkmark" size={52} color={colors.ink} />
        </View>
        <Text
          style={{ color: colors.text, letterSpacing: -0.8 }}
          className="mb-4 text-center font-body-bold text-3xl"
        >
          Réservation réussie !
        </Text>
        <Text
          style={{ color: colors.textMuted }}
          className="mb-10 text-center font-body text-lg"
        >
          Votre réservation pour &quot;{title}&quot; a été confirmée avec
          succès. Retrouvez tous les détails dans vos réservations.
        </Text>
        <Button
          title="Voir mes réservations"
          className="w-full"
          onPress={() => router.replace('/(tabs)/reservations' as any)}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView className="flex-1 px-6 pt-6">
        <View
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
          className="mb-8 rounded-3xl border p-6"
        >
          <Text
            style={{ color: colors.textMuted }}
            className="mb-2 font-body-semibold text-sm"
          >
            Détails de la réservation
          </Text>

          <Text
            style={{ color: colors.text }}
            className="mb-6 font-body-bold text-2xl"
          >
            {title}
          </Text>

          <View
            style={{ backgroundColor: colors.divider }}
            className="mb-6 h-[1px] w-full"
          />

          <View className="gap-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.teal}
                />
                <Text
                  style={{ color: colors.textMuted }}
                  className="ml-3 font-body"
                >
                  Date d&apos;arrivée
                </Text>
              </View>
              <Text style={{ color: colors.text }} className="font-body-bold">
                {formatDateLabel(start_date)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.teal}
                />
                <Text
                  style={{ color: colors.textMuted }}
                  className="ml-3 font-body"
                >
                  Date de départ
                </Text>
              </View>
              <Text style={{ color: colors.text }} className="font-body-bold">
                {formatDateLabel(end_date)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={20} color={colors.teal} />
                <Text
                  style={{ color: colors.textMuted }}
                  className="ml-3 font-body"
                >
                  Voyageurs
                </Text>
              </View>
              <Text style={{ color: colors.text }} className="font-body-bold">
                {guests_count}{' '}
                {Number(guests_count) > 1 ? 'personnes' : 'personne'}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
          className="mb-10 rounded-3xl border p-6"
        >
          <View className="mb-3 flex-row items-center">
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={colors.teal}
            />
            <Text
              style={{ color: colors.text }}
              className="ml-2 font-body-bold"
            >
              Note d&apos;information
            </Text>
          </View>
          <Text
            style={{ color: colors.textMuted }}
            className="font-body text-sm leading-6"
          >
            Aucun paiement en ligne n&apos;est requis pour valider cette
            réservation. La validation se fait directement auprès de
            l&apos;établissement selon les conditions d&apos;accueil.
          </Text>
        </View>
      </ScrollView>

      <View
        style={{ backgroundColor: colors.bg, borderTopColor: colors.border }}
        className="border-t p-6"
      >
        <Button
          title="Confirmer la réservation"
          icon="checkmark-circle-outline"
          onPress={handleConfirm}
          loading={processing}
        />
      </View>
    </View>
  );
}
