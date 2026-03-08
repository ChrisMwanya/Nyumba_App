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
  const { token, email: emailParam } = useLocalSearchParams<{ token: string; email: string }>();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!password || password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!token || !emailParam) {
      setError('Lien de réinitialisation invalide ou expiré.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await authService.resetPassword({
        email: emailParam,
        token: token,
        password: password,
        password_confirmation: confirmPassword,
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Une erreur est survenue.');
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
          <Text className="text-white text-3xl font-body-bold">Nouveau mot de passe</Text>
          <Text className="text-gray-400 text-sm font-body mt-2">
            Créez un nouveau mot de passe sécurisé pour votre compte.
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

              {/* Nouveau mot de passe */}
              <View className="mb-6">
                <Text className="text-gray-400 text-xs font-body-medium mb-2 uppercase tracking-widest ml-1">
                  Nouveau mot de passe
                </Text>
                <View
                  className={`flex-row items-center bg-dark-surface border rounded-2xl px-4 py-4 ${
                    passwordFocused ? 'border-dark-teal' : 'border-white/5'
                  }`}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={passwordFocused ? '#00BFA5' : '#6B7280'}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    className="flex-1 text-white text-base font-body"
                    placeholder="••••••••"
                    placeholderTextColor="#4B5563"
                    value={password}
                    onChangeText={(v) => { setPassword(v); setError(null); }}
                    secureTextEntry={!showPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
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

              {/* Confirmation */}
              <View className="mb-10">
                <Text className="text-gray-400 text-xs font-body-medium mb-2 uppercase tracking-widest ml-1">
                  Confirmer le mot de passe
                </Text>
                <View
                  className={`flex-row items-center bg-dark-surface border rounded-2xl px-4 py-4 ${
                    confirmPasswordFocused ? 'border-dark-teal' : 'border-white/5'
                  }`}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={confirmPasswordFocused ? '#00BFA5' : '#6B7280'}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    className="flex-1 text-white text-base font-body"
                    placeholder="••••••••"
                    placeholderTextColor="#4B5563"
                    value={confirmPassword}
                    onChangeText={(v) => { setConfirmPassword(v); setError(null); }}
                    secureTextEntry={!showPassword}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                  />
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
              <Text className="text-white text-xl font-body-bold text-center mb-4">Mot de passe réinitialisé !</Text>
              <Text className="text-gray-400 text-center font-body mb-10 leading-6">
                Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.
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
