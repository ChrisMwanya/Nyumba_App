import { ApiError, useAuth } from '@/contexts/AuthContext';
import type { VerifyOtpResponse } from '@/services/authService';
import * as authService from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function VerifyOtpScreen() {
  const { pendingVerification, completeSignIn } = useAuth();
  const [otp, setOtp] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      setError('Veuillez entrer un code valide à 6 chiffres.');
      return;
    }
    if (!pendingVerification?.destination) {
      setError('Erreur technique: informations de vérification introuvables. Veuillez vous reconnecter.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data: VerifyOtpResponse = await authService.verifyOtp(
        pendingVerification.destination,
        otp.trim(),
        pendingVerification.verificationMethod
      );
      await completeSignIn(data);

    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Code invalide.');
      } else {
        setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingVerification?.destination) return;
    setResendLoading(true);
    setError(null);
    setResendSuccess(false);
    try {
      await authService.resendOtp(
        pendingVerification.destination,
        pendingVerification.verificationMethod
      );
      setResendSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Erreur lors du renvoi du code.');
      } else {
        setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-dark-bg px-6 pt-16 pb-8">
          <TouchableOpacity
            onPress={() => {
              router.replace('/(auth)/login' as any);
            }}
            className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mb-6"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
       
          <Text className="text-white text-3xl font-body-bold">Vérification OTP</Text>
          <Text className="text-gray-400 text-sm font-body mt-2">
            Nous avons envoyé un code de vérification à l'adresse : 
            <Text className="text-white font-body-bold"> {pendingVerification?.destination || 'votre email'}</Text>
          </Text>
        </View>

        <View className="flex-1 px-8 pt-4 pb-10">
          {error && (
            <View className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-4 mb-8 flex-row items-center">
              <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
              <Text className="text-red-500 text-sm font-body ml-3 flex-1">{error}</Text>
            </View>
          )}

          {resendSuccess && (
            <View className="bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-4 mb-8 flex-row items-center">
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
              <Text className="text-green-500 text-sm font-body ml-3 flex-1">Nouveau code envoyé avec succès.</Text>
            </View>
          )}

          <View className="mb-8">
            <Text className="text-gray-400 text-xs font-body-medium mb-2 uppercase tracking-widest ml-1">
              Code de vérification *
            </Text>
            <View
              className={`flex-row items-center bg-dark-surface border rounded-2xl px-4 py-4 ${
                focused ? 'border-dark-teal' : 'border-white/5'
              }`}
            >
              <Ionicons
                name="keypad-outline"
                size={20}
                color={focused ? '#00BFA5' : '#6B7280'}
                style={{ marginRight: 12 }}
              />
              <TextInput
                className="flex-1 text-white text-base font-body tracking-widest"
                placeholder="123456"
                placeholderTextColor="#4B5563"
                value={otp}
                onChangeText={(v) => { setOtp(v); setError(null); setResendSuccess(false); }}
                keyboardType="number-pad"
                autoCapitalize="none"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                maxLength={6}
              />
            </View>
          </View>

          <TouchableOpacity
            className={`bg-dark-teal rounded-2xl py-5 items-center ${loading ? 'opacity-70' : ''}`}
            onPress={handleVerify}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-base font-body-bold tracking-wider">
                Vérifier
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mt-10">
            <Text className="text-gray-400 text-sm font-body">
              Vous n'avez pas reçu le code ?{' '}
            </Text>
            <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
              {resendLoading ? (
                <ActivityIndicator size="small" color="#00BFA5" />
              ) : (
                <Text className="text-white font-body-bold text-sm">
                  Renvoyer
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
