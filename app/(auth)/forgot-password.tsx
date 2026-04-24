import { ApiError } from '@/contexts/AuthContext';
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

export default function ForgotPasswordScreen() {
  const [identifier, setIdentifier] = useState('');
  const [identifierFocused, setIdentifierFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetRequest = async () => {
    if (!identifier.trim()) {
      setError('Veuillez entrer une adresse email ou un numéro de téléphone.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const trimmed = identifier.trim();
      const isEmail = /\S+@\S+\.\S+/.test(trimmed);
      await authService.forgotPassword(trimmed, isEmail ? 'email' : 'phone');
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
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mb-6"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
       
          <Text className="text-white text-3xl font-body-bold">Mot de passe oublié</Text>
          <Text className="text-gray-400 text-sm font-body mt-2">
            Entrez votre email ou votre téléphone pour recevoir un code de réinitialisation.
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

              <View className="mb-8">
                <Text className="text-gray-400 text-xs font-body-medium mb-2 uppercase tracking-widest ml-1">
                  Email ou Téléphone
                </Text>
                <View
                  className={`flex-row items-center bg-dark-surface border rounded-2xl px-4 py-4 ${
                    identifierFocused ? 'border-dark-teal' : 'border-white/5'
                  }`}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={identifierFocused ? '#00BFA5' : '#6B7280'}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    className="flex-1 text-white text-base font-body"
                    placeholder="votre@email.com ou 07..."
                    placeholderTextColor="#4B5563"
                    value={identifier}
                    onChangeText={(v) => { setIdentifier(v); setError(null); }}
                    keyboardType="default"
                    autoCapitalize="none"
                    onFocus={() => setIdentifierFocused(true)}
                    onBlur={() => setIdentifierFocused(false)}
                  />
                </View>
              </View>

              <TouchableOpacity
                className={`bg-dark-teal rounded-2xl py-5 items-center ${loading ? 'opacity-70' : ''}`}
                onPress={handleResetRequest}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white text-base font-body-bold tracking-wider">
                    Envoyer le code
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View className="items-center justify-center py-10">
              <View className="w-20 h-20 bg-dark-teal/20 rounded-full items-center justify-center mb-6">
                <Ionicons name="mail-outline" size={48} color="#00BFA5" />
              </View>
              <Text className="text-white text-xl font-body-bold text-center mb-4">Code envoyé !</Text>
              <Text className="text-gray-400 text-center font-body mb-10 leading-6">
                Un code de réinitialisation a été envoyé à{' '}
                <Text className="text-white font-body-bold">{identifier}</Text>.{'\n'}
                Entrez-le sur la page suivante.
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.replace({
                    pathname: '/(auth)/reset-password' as any,
                    params: { identifier: identifier.trim() },
                  })
                }
                className="bg-dark-teal w-full py-5 rounded-2xl items-center mb-4"
              >
                <Text className="text-white font-body-bold text-base">Saisir le code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.replace('/(auth)/login' as any)}
                className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl"
              >
                <Text className="text-white font-body-bold">Retour à la connexion</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
