import Button from '@/components/ui/Button';
import { ApiError, useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { pendingVerification, confirmOtp } = useAuth();
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
      setError(
        'Erreur technique: informations de vérification introuvables. Veuillez vous reconnecter.'
      );
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await confirmOtp(otp.trim());
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
      await authService.resendOtp(pendingVerification.destination);
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
        <View
          style={{ backgroundColor: colors.bg }}
          className="px-6 pb-8 pt-16"
        >
          <TouchableOpacity
            onPress={() => {
              router.replace('/(auth)/login' as any);
            }}
            style={{ backgroundColor: colors.muted }}
            className="mb-6 h-10 w-10 items-center justify-center rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text
            style={{ color: colors.text }}
            className="font-body-bold text-3xl"
          >
            Vérifiez votre compte
          </Text>
          <Text
            style={{ color: colors.textMuted }}
            className="mt-2 font-body text-sm"
          >
            Plus qu&apos;une étape ! Entrez le code à 6 chiffres envoyé à :
            <Text style={{ color: colors.text }} className="font-body-bold">
              {' '}
              {pendingVerification?.destination || 'votre email'}
            </Text>
          </Text>
        </View>

        <View className="flex-1 px-8 pb-10 pt-4">
          {error && (
            <View
              style={{
                backgroundColor: colors.errorSoft,
                borderColor: colors.errorBorder,
              }}
              className="mb-8 flex-row items-center rounded-2xl border px-4 py-4"
            >
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={colors.error}
              />
              <Text
                style={{ color: colors.error }}
                className="ml-3 flex-1 font-body text-sm"
              >
                {error}
              </Text>
            </View>
          )}

          {resendSuccess && (
            <View
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.10)',
                borderColor: 'rgba(16, 185, 129, 0.20)',
              }}
              className="mb-8 flex-row items-center rounded-2xl border px-4 py-4"
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#10B981"
              />
              <Text
                style={{ color: '#10B981' }}
                className="ml-3 flex-1 font-body text-sm"
              >
                Nouveau code envoyé avec succès.
              </Text>
            </View>
          )}

          <View className="mb-8">
            <Text
              style={{ color: colors.textMuted }}
              className="mb-2 font-body-semibold text-sm"
            >
              Code de vérification *
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: focused ? colors.borderFocused : colors.border,
              }}
              className="flex-row items-center rounded-2xl border px-4 py-3.5"
            >
              <Ionicons
                name="keypad-outline"
                size={20}
                color={focused ? colors.teal : colors.icon}
                style={{ marginRight: 12 }}
              />
              <TextInput
                style={{ color: colors.text }}
                className="flex-1 font-body text-base tracking-widest"
                placeholder="123456"
                placeholderTextColor={colors.textMuted}
                value={otp}
                onChangeText={v => {
                  setOtp(v);
                  setError(null);
                  setResendSuccess(false);
                }}
                keyboardType="number-pad"
                autoCapitalize="none"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                maxLength={6}
              />
            </View>
          </View>

          <Button title="Vérifier" onPress={handleVerify} loading={loading} />

          <View className="mt-10 flex-row items-center justify-center">
            <Text
              style={{ color: colors.textMuted }}
              className="font-body text-sm"
            >
              Vous n&apos;avez pas reçu le code ?{' '}
            </Text>
            <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
              {resendLoading ? (
                <ActivityIndicator size="small" color={colors.teal} />
              ) : (
                <Text
                  style={{ color: colors.text }}
                  className="font-body-bold text-sm"
                >
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
