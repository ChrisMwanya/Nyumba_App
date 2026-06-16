import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Alert,
  Platform
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/contexts/ThemeContext';
import { checkAvailability } from '@/services/reservationService';

export default function BookingScreen() {
  const { id, title, price, currency, image } = useLocalSearchParams();
  const { colors } = useTheme();
  
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));
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

    setChecking(true);
    setIsAvailable(false);

    try {
      const res = await checkAvailability({
        annonce_id: Number(id),
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        guests_count: guests
      });

      if (res.available) {
        setIsAvailable(true);
      } else {
        Alert.alert('Indisponible', res.message || 'Ces dates ne sont pas disponibles.');
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
        title: title
      }
    } as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="flex-row p-4 rounded-3xl mb-8 border">
          <Image 
            source={{ uri: (image as string) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800' }} 
            className="w-20 h-20 rounded-2xl"
            style={{ backgroundColor: colors.skeleton }}
          />
          <View className="ml-4 justify-center flex-1">
            <Text style={{ color: colors.text }} className="font-body-bold text-lg" numberOfLines={1}>{title}</Text>
            <Text style={{ color: colors.teal }} className="font-body mt-1">Formulaire de réservation</Text>
          </View>
        </View>

        {/* Date Selection */}
        <Text style={{ color: colors.text }} className="text-lg font-body-bold mb-4">Choisir les dates</Text>
        
        <View className="flex-row gap-4 mb-8">
          <TouchableOpacity 
            onPress={() => setShowStartPicker(true)}
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            className="flex-1 p-4 rounded-2xl border"
          >
            <Text style={{ color: colors.textMuted }} className="text-xs font-body uppercase mb-1">Début</Text>
            <Text style={{ color: colors.text }} className="font-body-bold">{startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setShowEndPicker(true)}
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            className="flex-1 p-4 rounded-2xl border"
          >
            <Text style={{ color: colors.textMuted }} className="text-xs font-body uppercase mb-1">Fin</Text>
            <Text style={{ color: colors.text }} className="font-body-bold">{endDate.toLocaleDateString()}</Text>
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
        <Text style={{ color: colors.text }} className="text-lg font-body-bold mb-4">Nombre de personnes</Text>
        <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="flex-row items-center justify-between p-4 rounded-2xl border mb-8">
          <TouchableOpacity 
            onPress={() => setGuests(Math.max(1, guests - 1))}
            style={{ backgroundColor: colors.bg, borderColor: colors.border }}
            className="w-10 h-10 rounded-full items-center justify-center border"
          >
            <Ionicons name="remove" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text }} className="text-xl font-body-bold">{guests}</Text>
          <TouchableOpacity 
            onPress={() => setGuests(guests + 1)}
            style={{ backgroundColor: colors.bg, borderColor: colors.border }}
            className="w-10 h-10 rounded-full items-center justify-center border"
          >
            <Ionicons name="add" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Check Button */}
        {!isAvailable && (
          <TouchableOpacity 
            onPress={handleCheckAvailability}
            disabled={checking}
            style={{ backgroundColor: colors.teal }}
            className="h-16 rounded-2xl flex-row items-center justify-center shadow-xl mb-10"
          >
            {checking ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="search-outline" size={20} color="white" />
                <Text className="text-white font-body-bold text-lg ml-2">Vérifier disponibilité</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Quote Recap */}
        {isAvailable && (
          <View style={{ backgroundColor: colors.surface, borderColor: `${colors.teal}4D` }} className="p-6 rounded-3xl border mb-10">
            <Text style={{ color: colors.text }} className="text-lg font-body-bold mb-4">Récapitulatif de la réservation</Text>
            
            <View className="flex-row justify-between mb-2">
              <Text style={{ color: colors.textMuted }} className="font-body">Date d'arrivée</Text>
              <Text style={{ color: colors.text }} className="font-body-medium">{startDate.toLocaleDateString()}</Text>
            </View>
            
            <View className="flex-row justify-between mb-2">
              <Text style={{ color: colors.textMuted }} className="font-body">Date de départ</Text>
              <Text style={{ color: colors.text }} className="font-body-medium">{endDate.toLocaleDateString()}</Text>
            </View>
            
            <View className="flex-row justify-between mb-4">
              <Text style={{ color: colors.textMuted }} className="font-body">Voyageurs</Text>
              <Text style={{ color: colors.text }} className="font-body-medium">{guests} {guests > 1 ? 'personnes' : 'personne'}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer Navigation */}
      {isAvailable && (
        <View style={{ backgroundColor: colors.bg, borderTopColor: colors.border }} className="p-6 border-t">
          <TouchableOpacity 
            onPress={handleNext}
            style={{ backgroundColor: colors.teal }}
            className="h-16 rounded-2xl flex-row items-center justify-center shadow-xl"
          >
            <Text className="text-white font-body-bold text-lg">Continuer</Text>
            <Ionicons name="arrow-forward" size={20} color="white" className="ml-2" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
