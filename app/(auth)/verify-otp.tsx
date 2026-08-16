import { ApiError, useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { colors } = useTheme();
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
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ backgroundColor: colors.bg }} className="px-6 pt-16 pb-8">
          <TouchableOpacity
            onPress={() => {
              router.replace('/(auth)/login' as any);
            }}
            style={{ backgroundColor: colors.border }}
            className="w-10 h-10 rounded-full items-center justify-center mb-6"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
       
          <Text style={{ color: colors.text }} className="text-3xl font-body-bold">Vérification OTP</Text>
          <Text style={{ color: colors.textMuted }} className="text-sm font-body mt-2">
            Nous avons envoyé un code de vérification à l'adresse : 
            <Text style={{ color: colors.text }} className="font-body-bold"> {pendingVerification?.destination || 'votre email'}</Text>
          </Text>
        </View>

        <View className="flex-1 px-8 pt-4 pb-10">
          {error && (
            <View style={{ backgroundColor: colors.errorSoft, borderColor: colors.errorBorder }} className="rounded-2xl px-4 py-4 mb-8 flex-row items-center border">
              <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
              <Text style={{ color: colors.error }} className="text-sm font-body ml-3 flex-1">{error}</Text>
            </View>
          )}

          {resendSuccess && (
            <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.10)', borderColor: 'rgba(16, 185, 129, 0.20)' }} className="rounded-2xl px-4 py-4 mb-8 flex-row items-center border">
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
              <Text style={{ color: '#10B981' }} className="text-sm font-body ml-3 flex-1">Nouveau code envoyé avec succès.</Text>
            </View>
          )}

          <View className="mb-8">
            <Text style={{ color: colors.textMuted }} className="text-xs font-body-medium mb-2 uppercase tracking-widest ml-1">
              Code de vérification *
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: focused ? colors.borderFocused : colors.border,
              }}
              className="flex-row items-center border rounded-2xl px-4 py-4"
            >
              <Ionicons
                name="keypad-outline"
                size={20}
                color={focused ? colors.teal : colors.icon}
                style={{ marginRight: 12 }}
              />
              <TextInput
                style={{ color: colors.text }}
                className="flex-1 text-base font-body tracking-widest"
                placeholder="123456"
                placeholderTextColor={colors.textMuted}
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
            style={{ backgroundColor: colors.teal, opacity: loading ? 0.7 : 1 }}
            className="rounded-2xl py-5 items-center"
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
            <Text style={{ color: colors.textMuted }} className="text-sm font-body">
              Vous n'avez pas reçu le code ?{' '}
            </Text>
            <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
              {resendLoading ? (
                <ActivityIndicator size="small" color={colors.teal} />
              ) : (
                <Text style={{ color: colors.text }} className="font-body-bold text-sm">
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
