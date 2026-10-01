import Button from '@/components/ui/Button';
import { ApiError } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import * as authService from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function ResetPasswordScreen() {
  // `identifier` est passé depuis forgot-password.tsx
  const { identifier } = useLocalSearchParams<{ identifier: string }>();
  const { colors } = useTheme();

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const getBorderColor = (field: string) =>
    focusedField === field ? colors.borderFocused : colors.border;
  const iconColor = (field: string) =>
    focusedField === field ? colors.teal : colors.icon;

  const handleResetPassword = async () => {
    if (!code || code.length !== 6) {
      setError('Veuillez entrer un code valide à 6 chiffres.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!identifier) {
      setError('Informations de réinitialisation invalides. Recommencez.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await authService.resetPassword({
        identifier,
        otp: code.trim(),
        newPassword: password,
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Code invalide ou expiré.');
      } else {
        setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
      }
    } finally {
      setLoading(false);
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
        {/* En-tête */}
        <View
          style={{ backgroundColor: colors.bg }}
          className="px-6 pb-8 pt-16"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ backgroundColor: colors.muted }}
            className="mb-6 h-10 w-10 items-center justify-center rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text
            style={{ color: colors.text }}
            className="font-body-bold text-3xl"
          >
            Nouveau mot de passe
          </Text>
          <Text
            style={{ color: colors.textMuted }}
            className="mt-2 font-body text-sm"
          >
            Entrez le code reçu sur{' '}
            <Text style={{ color: colors.text }} className="font-body-bold">
              {identifier}
            </Text>{' '}
            et votre nouveau mot de passe.
          </Text>
        </View>

        <View className="flex-1 px-8 pb-10 pt-4">
          {!success ? (
            <>
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

              {/* Code OTP */}
              <View className="mb-6">
                <Text
                  style={{ color: colors.textMuted }}
                  className="mb-2 font-body-semibold text-sm"
                >
                  Code de vérification *
                </Text>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: getBorderColor('code'),
                  }}
                  className="flex-row items-center rounded-2xl border px-4 py-3.5"
                >
                  <Ionicons
                    name="keypad-outline"
                    size={20}
                    color={iconColor('code')}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    style={{ color: colors.text }}
                    className="flex-1 font-body text-base tracking-widest"
                    placeholder="123456"
                    placeholderTextColor={colors.textMuted}
                    value={code}
                    onChangeText={v => {
                      setCode(v);
                      setError(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    onFocus={() => setFocusedField('code')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Nouveau mot de passe */}
              <View className="mb-6">
                <Text
                  style={{ color: colors.textMuted }}
                  className="mb-2 font-body-semibold text-sm"
                >
                  Nouveau mot de passe *
                </Text>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: getBorderColor('password'),
                  }}
                  className="flex-row items-center rounded-2xl border px-4 py-3.5"
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={iconColor('password')}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    style={{ color: colors.text }}
                    className="flex-1 font-body text-base"
                    placeholder="Minimum 8 caractères"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={v => {
                      setPassword(v);
                      setError(null);
                    }}
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.icon}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Confirmation mot de passe */}
              <View className="mb-10">
                <Text
                  style={{ color: colors.textMuted }}
                  className="mb-2 font-body-semibold text-sm"
                >
                  Confirmer le mot de passe *
                </Text>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: getBorderColor('confirm'),
                  }}
                  className="flex-row items-center rounded-2xl border px-4 py-3.5"
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={iconColor('confirm')}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    style={{ color: colors.text }}
                    className="flex-1 font-body text-base"
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    value={confirmPassword}
                    onChangeText={v => {
                      setConfirmPassword(v);
                      setError(null);
                    }}
                    secureTextEntry={!showConfirmPassword}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? 'eye-off-outline' : 'eye-outline'
                      }
                      size={20}
                      color={colors.icon}
                    />
                  </Pressable>
                </View>
              </View>

              <Button
                title="Réinitialiser le mot de passe"
                onPress={handleResetPassword}
                loading={loading}
              />
            </>
          ) : (
            <View className="items-center justify-center py-10">
              <View
                style={{ backgroundColor: colors.tealSoft }}
                className="mb-6 h-20 w-20 items-center justify-center rounded-full"
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={48}
                  color={colors.teal}
                />
              </View>
              <Text
                style={{ color: colors.text }}
                className="mb-4 text-center font-body-bold text-xl"
              >
                Mot de passe réinitialisé !
              </Text>
              <Text
                style={{ color: colors.textMuted }}
                className="mb-10 text-center font-body leading-6"
              >
                Votre mot de passe a été mis à jour avec succès.{'\n'}
                Reconnectez-vous et reprenez vos découvertes.
              </Text>
              <Button
                title="Se connecter"
                className="w-full"
                onPress={() => router.replace('/(auth)/login' as any)}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
