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
import { checkAvailability, getQuote, QuoteResponse } from '@/services/reservationService';

export default function BookingScreen() {
  const { id, title, price, currency, image } = useLocalSearchParams();
  
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));
  const [guests, setGuests] = useState(1);
  
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  const [checking, setChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);

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
    setQuote(null);

    try {
      const res = await checkAvailability({
        annonce_id: Number(id),
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        guests_count: guests
      });

      if (res.available) {
        setIsAvailable(true);
        const quoteRes = await getQuote({
          annonce_id: Number(id),
          start_date: formatDate(startDate),
          end_date: formatDate(endDate),
          guests_count: guests
        });
        setQuote(quoteRes);
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
    if (!isAvailable || !quote) return;
    
    router.push({
      pathname: '/annonces/payment',
      params: {
        annonce_id: id,
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        guests_count: guests,
        total: quote.total,
        currency: quote.currency,
        title: title
      }
    } as any);
  };

  return (
    <View className="flex-1 bg-dark-bg">
      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View className="flex-row bg-dark-surface p-4 rounded-3xl mb-8 border border-white/5">
          <Image 
            source={{ uri: (image as string) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800' }} 
            className="w-20 h-20 rounded-2xl"
          />
          <View className="ml-4 justify-center">
            <Text className="text-white font-body-bold text-lg" numberOfLines={1}>{title}</Text>
            <Text className="text-dark-teal font-body-bold mt-1">{price} {currency} <Text className="text-gray-500 font-body text-xs">/ nuit</Text></Text>
          </View>
        </View>

        {/* Date Selection */}
        <Text className="text-white text-lg font-body-bold mb-4">Choisir les dates</Text>
        
        <View className="flex-row gap-4 mb-8">
          <TouchableOpacity 
            onPress={() => setShowStartPicker(true)}
            className="flex-1 bg-dark-surface p-4 rounded-2xl border border-white/5"
          >
            <Text className="text-gray-500 text-xs font-body uppercase mb-1">Début</Text>
            <Text className="text-white font-body-bold">{startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setShowEndPicker(true)}
            className="flex-1 bg-dark-surface p-4 rounded-2xl border border-white/5"
          >
            <Text className="text-gray-500 text-xs font-body uppercase mb-1">Fin</Text>
            <Text className="text-white font-body-bold">{endDate.toLocaleDateString()}</Text>
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
        <Text className="text-white text-lg font-body-bold mb-4">Nombre de personnes</Text>
        <View className="flex-row items-center justify-between bg-dark-surface p-4 rounded-2xl border border-white/5 mb-8">
          <TouchableOpacity 
            onPress={() => setGuests(Math.max(1, guests - 1))}
            className="w-10 h-10 rounded-full bg-dark-bg items-center justify-center border border-white/5"
          >
            <Ionicons name="remove" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-body-bold">{guests}</Text>
          <TouchableOpacity 
            onPress={() => setGuests(guests + 1)}
            className="w-10 h-10 rounded-full bg-dark-bg items-center justify-center border border-white/5"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Check Button */}
        {!isAvailable && (
          <TouchableOpacity 
            onPress={handleCheckAvailability}
            disabled={checking}
            className="bg-dark-teal h-16 rounded-2xl flex-row items-center justify-center shadow-xl mb-10"
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
        {isAvailable && quote && (
          <View className="bg-dark-surface p-6 rounded-3xl border border-dark-teal/30 mb-10">
            <Text className="text-white text-lg font-body-bold mb-4">Récapitulatif</Text>
            
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400 font-body">Prix de base</Text>
              <Text className="text-white font-body-medium">{quote.basePrice} {quote.currency}</Text>
            </View>
            
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400 font-body">Durée ({quote.duration} {quote.duration > 1 ? 'nuits' : 'nuit'})</Text>
              <Text className="text-white font-body-medium">{quote.subtotal} {quote.currency}</Text>
            </View>
            
            <View className="flex-row justify-between mb-4">
              <Text className="text-gray-400 font-body">Frais de service</Text>
              <Text className="text-white font-body-medium">{quote.serviceFee} {quote.currency}</Text>
            </View>
            
            <View className="h-[1px] bg-white/5 w-full my-4" />
            
            <View className="flex-row justify-between items-center">
              <Text className="text-white text-lg font-body-bold">Total</Text>
              <Text className="text-dark-teal text-2xl font-body-bold">{quote.total} {quote.currency}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer Navigation */}
      {isAvailable && (
        <View className="p-6 bg-dark-bg border-t border-white/5">
          <TouchableOpacity 
            onPress={handleNext}
            className="bg-dark-teal h-16 rounded-2xl flex-row items-center justify-center shadow-xl"
          >
            <Text className="text-white font-body-bold text-lg">Confirmer & Payer</Text>
            <Ionicons name="arrow-forward" size={20} color="white" className="ml-2" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
