import { ApiError } from '@/contexts/AuthContext';
import * as authService from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ResetPasswordScreen() {
  // `identifier` est passé depuis forgot-password.tsx
  const { identifier } = useLocalSearchParams<{ identifier: string }>();

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const borderClass = (field: string) =>
    focusedField === field ? 'border-dark-teal' : 'border-white/5';
  const iconColor = (field: string) => (focusedField === field ? '#00BFA5' : '#6B7280');

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
      const isEmail = /\S+@\S+\.\S+/.test(identifier);
      await authService.resetPassword({
        ...(isEmail ? { email: identifier } : { phone: identifier }),
        code: code.trim(),
        password,
        passwordConfirmation: confirmPassword,
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
      className="flex-1 bg-dark-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête */}
        <View className="bg-dark-bg px-6 pt-16 pb-8">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mb-6"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-3xl font-body-bold">Nouveau mot de passe</Text>
          <Text className="text-gray-400 text-sm font-body mt-2">
            Entrez le code reçu sur{' '}
            <Text className="text-white font-body-bold">{identifier}</Text>
            {' '}et votre nouveau mot de passe.
          </Text>
        </View>

        <View className="flex-1 px-8 pt-4 pb-10">
          {!success ? (
            <>
              {error && (
                <View className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-4 mb-8 flex-row items-center">
                  <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                  <Text className="text-red-500 text-sm font-body ml-3 flex-1">
                    {error}
                  </Text>
                </View>
              )}

              {/* Code OTP */}
              <View className="mb-6">
                <Text className="text-gray-400 text-xs font-body-medium mb-2 uppercase tracking-widest ml-1">
                  Code de vérification *
                </Text>
                <View className={`flex-row items-center bg-dark-surface border rounded-2xl px-4 py-4 ${borderClass('code')}`}>
                  <Ionicons
                    name="keypad-outline"
                    size={20}
                    color={iconColor('code')}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    className="flex-1 text-white text-base font-body tracking-widest"
                    placeholder="123456"
                    placeholderTextColor="#4B5563"
                    value={code}
                    onChangeText={(v) => { setCode(v); setError(null); }}
                    keyboardType="number-pad"
                    maxLength={6}
                    onFocus={() => setFocusedField('code')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Nouveau mot de passe */}
              <View className="mb-6">
                <Text className="text-gray-400 text-xs font-body-medium mb-2 uppercase tracking-widest ml-1">
                  Nouveau mot de passe *
                </Text>
                <View className={`flex-row items-center bg-dark-surface border rounded-2xl px-4 py-4 ${borderClass('password')}`}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={iconColor('password')}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    className="flex-1 text-white text-base font-body"
                    placeholder="Minimum 8 caractères"
                    placeholderTextColor="#4B5563"
                    value={password}
                    onChangeText={(v) => { setPassword(v); setError(null); }}
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#6B7280"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Confirmation mot de passe */}
              <View className="mb-10">
                <Text className="text-gray-400 text-xs font-body-medium mb-2 uppercase tracking-widest ml-1">
                  Confirmer le mot de passe *
                </Text>
                <View className={`flex-row items-center bg-dark-surface border rounded-2xl px-4 py-4 ${borderClass('confirm')}`}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={iconColor('confirm')}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    className="flex-1 text-white text-base font-body"
                    placeholder="••••••••"
                    placeholderTextColor="#4B5563"
                    value={confirmPassword}
                    onChangeText={(v) => { setConfirmPassword(v); setError(null); }}
                    secureTextEntry={!showConfirmPassword}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#6B7280"
                    />
                  </Pressable>
                </View>
              </View>

              <TouchableOpacity
                className={`bg-dark-teal rounded-2xl py-5 items-center ${loading ? 'opacity-70' : ''}`}
                onPress={handleResetPassword}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white text-base font-body-bold tracking-wider">
                    Réinitialiser le mot de passe
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View className="items-center justify-center py-10">
              <View className="w-20 h-20 bg-dark-teal/20 rounded-full items-center justify-center mb-6">
                <Ionicons name="checkmark-circle-outline" size={48} color="#00BFA5" />
              </View>
              <Text className="text-white text-xl font-body-bold text-center mb-4">
                Mot de passe réinitialisé !
              </Text>
              <Text className="text-gray-400 text-center font-body mb-10 leading-6">
                Votre mot de passe a été mis à jour avec succès.{'\n'}
                Vous pouvez maintenant vous connecter.
              </Text>
              <TouchableOpacity
                onPress={() => router.replace('/(auth)/login' as any)}
                className="bg-dark-teal w-full py-5 rounded-2xl items-center"
              >
                <Text className="text-white font-body-bold text-base">Se connecter</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
