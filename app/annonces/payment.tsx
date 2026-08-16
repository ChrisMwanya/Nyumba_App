import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { createReservation } from '@/services/reservationService';
import { useAuth } from '@/contexts/AuthContext';

export default function ConfirmationScreen() {
  const params = useLocalSearchParams();
  const { 
    annonce_id, 
    start_date, 
    end_date, 
    guests_count, 
    title 
  } = params;

  const { colors } = useTheme();
  const { accessToken } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    if (!accessToken) {
      Alert.alert('Erreur', 'Vous devez être connecté pour effectuer une réservation.');
      return;
    }

    setProcessing(true);
    try {
      // 1. Create Reservation directly (no payment required)
      await createReservation({
        annonce_id: Number(annonce_id),
        start_date: start_date as string,
        end_date: end_date as string,
        guests_count: Number(guests_count)
      }, accessToken);

      setConfirmed(true);
    } catch (error) {
      console.error('Reservation confirmation error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la confirmation de votre réservation.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDateLabel = (dateStr: any) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (confirmed) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }} className="items-center justify-center px-10">
        <View style={{ backgroundColor: colors.teal }} className="w-24 h-24 rounded-full items-center justify-center mb-8 shadow-2xl">
          <Ionicons name="checkmark" size={60} color="white" />
        </View>
        <Text style={{ color: colors.text }} className="text-3xl font-body-bold text-center mb-4">Réservation Réussie !</Text>
        <Text style={{ color: colors.textMuted }} className="font-body text-center mb-10 text-lg">
          Votre réservation pour &quot;{title}&quot; a été confirmée avec succès. Retrouvez tous les détails dans vos réservations.
        </Text>
        <TouchableOpacity 
          onPress={() => router.replace('/(tabs)/reservations' as any)}
          style={{ backgroundColor: colors.teal }}
          className="w-full h-16 rounded-2xl items-center justify-center shadow-lg"
        >
          <Text className="text-white font-body-bold text-lg">Voir mes réservations</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView className="flex-1 px-6 pt-6">
        <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="p-6 rounded-[32px] border mb-8">
          <Text style={{ color: colors.textMuted }} className="font-body-bold uppercase tracking-wider text-xs mb-4">Détails de la réservation</Text>
          
          <Text style={{ color: colors.text }} className="font-body-bold text-2xl mb-6">{title}</Text>

          <View style={{ backgroundColor: colors.divider }} className="h-[1px] w-full mb-6" />

          <View className="gap-5">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={20} color={colors.teal} />
                <Text style={{ color: colors.textMuted }} className="font-body ml-3">Date d'arrivée</Text>
              </View>
              <Text style={{ color: colors.text }} className="font-body-bold">{formatDateLabel(start_date)}</Text>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={20} color={colors.teal} />
                <Text style={{ color: colors.textMuted }} className="font-body ml-3">Date de départ</Text>
              </View>
              <Text style={{ color: colors.text }} className="font-body-bold">{formatDateLabel(end_date)}</Text>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={20} color={colors.teal} />
                <Text style={{ color: colors.textMuted }} className="font-body ml-3">Voyageurs</Text>
              </View>
              <Text style={{ color: colors.text }} className="font-body-bold">{guests_count} {Number(guests_count) > 1 ? 'personnes' : 'personne'}</Text>
            </View>
          </View>
        </View>

        <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="p-6 rounded-[32px] border mb-10">
          <View className="flex-row items-center mb-3">
            <Ionicons name="information-circle-outline" size={22} color={colors.teal} />
            <Text style={{ color: colors.text }} className="font-body-bold ml-2">Note d'information</Text>
          </View>
          <Text style={{ color: colors.textMuted }} className="text-sm font-body leading-6">
            Aucun paiement en ligne n'est requis pour valider cette réservation. La validation se fait directement auprès de l'établissement selon les conditions d'accueil.
          </Text>
        </View>
      </ScrollView>

      <View style={{ backgroundColor: colors.bg, borderTopColor: colors.border }} className="p-6 border-t">
        <TouchableOpacity 
          onPress={handleConfirm}
          disabled={processing}
          style={{ backgroundColor: colors.teal }}
          className="h-16 rounded-2xl flex-row items-center justify-center shadow-xl"
        >
          {processing ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={22} color="white" />
              <Text className="text-white font-body-bold text-lg ml-2">Confirmer la réservation</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
