import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Image
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createReservation } from '@/services/reservationService';
import { initiatePayment, confirmPayment, PaymentMethod } from '@/services/paymentService';

const PAYMENT_METHODS: { id: PaymentMethod, name: string, icon: string, color: string }[] = [
  { id: 'mpesa', name: 'M-Pesa', icon: 'phone-portrait-outline', color: '#E41E26' },
  { id: 'orange_money', name: 'Orange Money', icon: 'phone-portrait-outline', color: '#FF7900' },
  { id: 'airtel_money', name: 'Airtel Money', icon: 'phone-portrait-outline', color: '#ED1C24' },
  { id: 'card', name: 'Carte Bancaire', icon: 'card-outline', color: '#00BFA5' },
];

export default function PaymentScreen() {
  const params = useLocalSearchParams();
  const { 
    annonce_id, 
    start_date, 
    end_date, 
    guests_count, 
    total, 
    currency,
    title 
  } = params;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'selection' | 'processing' | 'success'>('selection');

  const handlePay = async () => {
    if (!selectedMethod) {
      Alert.alert('Sélectionnez un moyen de paiement');
      return;
    }

    setProcessing(true);
    try {
      // 1. Create Reservation
      const reservation = await createReservation({
        annonce_id: Number(annonce_id),
        start_date: start_date as string,
        end_date: end_date as string,
        guests_count: Number(guests_count)
      });

      // 2. Initiate Payment
      const initiation = await initiatePayment({
        reservation_id: reservation.id,
        payment_method: selectedMethod
      });

      // 3. Confirm Payment (Simulated for this flow)
      // In a real app, this would be triggered by a webhook or a redirect back
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
      
      const confirmation = await confirmPayment({
        transaction_reference: initiation.transactionReference,
        status: 'success'
      });

      if (confirmation.status === 'success') {
        setStep('success');
      } else {
        Alert.alert('Erreur', 'Le paiement a échoué. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Payment flow error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du processus de paiement.');
    } finally {
      setProcessing(false);
    }
  };

  if (step === 'success') {
    return (
      <View className="flex-1 bg-dark-bg items-center justify-center px-10">
        <View className="w-24 h-24 bg-dark-teal rounded-full items-center justify-center mb-8 shadow-2xl shadow-dark-teal/40">
          <Ionicons name="checkmark" size={60} color="white" />
        </View>
        <Text className="text-white text-3xl font-body-bold text-center mb-4">Paiement Réussi !</Text>
        <Text className="text-gray-400 font-body text-center mb-10 text-lg">
          Votre réservation pour "{title}" est confirmée. Vous recevrez un reçu par email sous peu.
        </Text>
        <TouchableOpacity 
          onPress={() => router.replace('/(tabs)/reservations' as any)}
          className="bg-dark-teal w-full h-16 rounded-2xl items-center justify-center"
        >
          <Text className="text-white font-body-bold text-lg">Voir mes réservations</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-bg">
      <ScrollView className="flex-1 px-6 pt-6">
        <View className="bg-dark-surface p-8 rounded-[40px] items-center mb-10 border border-white/5">
          <Text className="text-gray-500 font-body uppercase tracking-widest mb-2">Montant à payer</Text>
          <Text className="text-white text-5xl font-body-bold">{total} {currency}</Text>
        </View>

        <Text className="text-white text-xl font-body-bold mb-6">Moyen de paiement</Text>
        
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity 
            key={method.id}
            onPress={() => setSelectedMethod(method.id)}
            className={`flex-row items-center p-6 rounded-3xl mb-4 border-2 ${
              selectedMethod === method.id ? 'bg-dark-teal/10 border-dark-teal' : 'bg-dark-surface border-transparent'
            }`}
          >
            <View className={`w-12 h-12 rounded-2xl items-center justify-center bg-dark-bg border border-white/5`}>
              <Ionicons name={method.icon as any} size={24} color={method.color} />
            </View>
            <Text className="text-white text-lg font-body-bold ml-4 flex-1">{method.name}</Text>
            {selectedMethod === method.id && (
              <Ionicons name="checkmark-circle" size={24} color="#00BFA5" />
            )}
          </TouchableOpacity>
        ))}

        <View className="bg-dark-surface p-6 rounded-3xl border border-white/5 mt-6 mb-10">
          <View className="flex-row items-center mb-2">
            <Ionicons name="shield-checkmark-outline" size={20} color="#00BFA5" />
            <Text className="text-white font-body-medium ml-2">Paiement sécurisé</Text>
          </View>
          <Text className="text-gray-500 text-xs font-body">
            Vos informations de paiement sont cryptées et ne sont jamais stockées sur nos serveurs.
          </Text>
        </View>
      </ScrollView>

      <View className="p-6 bg-dark-bg border-t border-white/5">
        <TouchableOpacity 
          onPress={handlePay}
          disabled={processing || !selectedMethod}
          className={`h-16 rounded-2xl flex-row items-center justify-center shadow-xl ${
            processing || !selectedMethod ? 'bg-gray-800' : 'bg-dark-teal'
          }`}
        >
          {processing ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="lock-closed-outline" size={20} color="white" />
              <Text className="text-white font-body-bold text-lg ml-2">Payer Maintenant</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
