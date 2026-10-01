import Button from '@/components/ui/Button';
import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/contexts/ThemeContext';
import { checkAvailability } from '@/services/reservationService';
import { useAuth } from '@/contexts/AuthContext';

export default function BookingScreen() {
  const { id, title, price, currency, image } = useLocalSearchParams();
  const { colors } = useTheme();
  const { accessToken } = useAuth();

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 1))
  );
  const [guests, setGuests] = useState(1);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [checking, setChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleCheckAvailability = async () => {
    if (endDate <= startDate) {
      Alert.alert('Erreur', 'La date de fin doit être après la date de début.');
      return;
    }

    if (!accessToken) {
      Alert.alert(
        'Connexion requise',
        'Connectez-vous pour vérifier la disponibilité.'
      );
      return;
    }

    setChecking(true);
    setIsAvailable(false);

    try {
      const res = await checkAvailability(
        String(id),
        { startDate: formatDate(startDate), endDate: formatDate(endDate) },
        accessToken
      );

      if (res.available) {
        setIsAvailable(true);
      } else {
        Alert.alert('Indisponible', 'Ces dates ne sont pas disponibles.');
      }
    } catch (error) {
      console.error('Check availability error:', error);
      Alert.alert('Erreur', 'Impossible de vérifier la disponibilité.');
    } finally {
      setChecking(false);
    }
  };

  const handleNext = () => {
    if (!isAvailable) return;

    router.push({
      pathname: '/annonces/payment',
      params: {
        annonce_id: id,
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        guests_count: guests,
        title: title,
      },
    } as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
          className="mb-8 flex-row rounded-3xl border p-4"
        >
          <Image
            source={{
              uri:
                (image as string) ||
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800',
            }}
            className="h-20 w-20 rounded-2xl"
            style={{ backgroundColor: colors.skeleton }}
          />
          <View className="ml-4 flex-1 justify-center">
            <Text
              style={{ color: colors.text }}
              className="font-body-bold text-lg"
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              style={{ color: colors.textMuted }}
              className="mt-1 font-body"
            >
              Formulaire de réservation
            </Text>
          </View>
        </View>

        {/* Date Selection */}
        <Text
          style={{ color: colors.text }}
          className="mb-4 font-body-bold text-lg"
        >
          Choisir les dates
        </Text>

        <View className="mb-8 flex-row gap-4">
          <TouchableOpacity
            onPress={() => setShowStartPicker(true)}
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.input,
            }}
            className="flex-1 rounded-2xl border p-4"
          >
            <Text
              style={{ color: colors.textMuted }}
              className="mb-1 font-body-semibold text-sm"
            >
              Début
            </Text>
            <Text style={{ color: colors.text }} className="font-body-bold">
              {startDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowEndPicker(true)}
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.input,
            }}
            className="flex-1 rounded-2xl border p-4"
          >
            <Text
              style={{ color: colors.textMuted }}
              className="mb-1 font-body-semibold text-sm"
            >
              Fin
            </Text>
            <Text style={{ color: colors.text }} className="font-body-bold">
              {endDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            minimumDate={new Date()}
            onChange={(event, date) => {
              setShowStartPicker(false);
              if (date) setStartDate(date);
            }}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            minimumDate={startDate}
            onChange={(event, date) => {
              setShowEndPicker(false);
              if (date) setEndDate(date);
            }}
          />
        )}

        {/* Guests Selection */}
        <Text
          style={{ color: colors.text }}
          className="mb-4 font-body-bold text-lg"
        >
          Nombre de personnes
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
          className="mb-8 flex-row items-center justify-between rounded-2xl border p-4"
        >
          <TouchableOpacity
            onPress={() => setGuests(Math.max(1, guests - 1))}
            style={{ borderColor: colors.input }}
            className="h-10 w-10 items-center justify-center rounded-full border"
          >
            <Ionicons name="remove" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text
            style={{ color: colors.text }}
            className="font-body-bold text-xl"
          >
            {guests}
          </Text>
          <TouchableOpacity
            onPress={() => setGuests(guests + 1)}
            style={{ borderColor: colors.input }}
            className="h-10 w-10 items-center justify-center rounded-full border"
          >
            <Ionicons name="add" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Check Button */}
        {!isAvailable && (
          <Button
            title="Vérifier la disponibilité"
            icon="search-outline"
            onPress={handleCheckAvailability}
            loading={checking}
            className="mb-10"
          />
        )}

        {/* Quote Recap */}
        {isAvailable && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
            className="mb-10 rounded-3xl border p-6"
          >
            <Text
              style={{ color: colors.text }}
              className="mb-4 font-body-bold text-lg"
            >
              Récapitulatif de la réservation
            </Text>

            <View className="mb-2 flex-row justify-between">
              <Text style={{ color: colors.textMuted }} className="font-body">
                Date d&apos;arrivée
              </Text>
              <Text style={{ color: colors.text }} className="font-body-medium">
                {startDate.toLocaleDateString()}
              </Text>
            </View>

            <View className="mb-2 flex-row justify-between">
              <Text style={{ color: colors.textMuted }} className="font-body">
                Date de départ
              </Text>
              <Text style={{ color: colors.text }} className="font-body-medium">
                {endDate.toLocaleDateString()}
              </Text>
            </View>

            <View className="mb-4 flex-row justify-between">
              <Text style={{ color: colors.textMuted }} className="font-body">
                Voyageurs
              </Text>
              <Text style={{ color: colors.text }} className="font-body-medium">
                {guests} {guests > 1 ? 'personnes' : 'personne'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer Navigation */}
      {isAvailable && (
        <View
          style={{ backgroundColor: colors.bg, borderTopColor: colors.border }}
          className="border-t p-6"
        >
          <Button
            title="Continuer"
            iconRight="arrow-forward"
            onPress={handleNext}
          />
        </View>
      )}
    </View>
  );
}
