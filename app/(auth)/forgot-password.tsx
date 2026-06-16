import { ApiError } from '@/contexts/AuthContext';
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

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
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
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête */}
        <View style={{ backgroundColor: colors.bg }} className="px-6 pt-16 pb-8">
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ backgroundColor: colors.border }}
            className="w-10 h-10 rounded-full items-center justify-center mb-6"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
       
          <Text style={{ color: colors.text }} className="text-3xl font-body-bold">Mot de passe oublié</Text>
          <Text style={{ color: colors.textMuted }} className="text-sm font-body mt-2">
            Entrez votre email ou votre téléphone pour recevoir un code de réinitialisation.
          </Text>
        </View>

        <View className="flex-1 px-8 pt-4 pb-10">
          {!success ? (
            <>
              {error && (
                <View style={{ backgroundColor: colors.errorSoft, borderColor: colors.errorBorder }} className="rounded-2xl px-4 py-4 mb-8 flex-row items-center border">
                  <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
                  <Text style={{ color: colors.error }} className="text-sm font-body ml-3 flex-1">
                    {error}
                  </Text>
                </View>
              )}

              <View className="mb-8">
                <Text style={{ color: colors.textMuted }} className="text-xs font-body-medium mb-2 uppercase tracking-widest ml-1">
                  Email ou Téléphone
                </Text>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: identifierFocused ? colors.borderFocused : colors.border,
                  }}
                  className="flex-row items-center border rounded-2xl px-4 py-4"
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={identifierFocused ? colors.teal : colors.icon}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    style={{ color: colors.text }}
                    className="flex-1 text-base font-body"
                    placeholder="votre@email.com ou 07..."
                    placeholderTextColor={colors.textMuted}
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
                style={{ backgroundColor: colors.teal, opacity: loading ? 0.7 : 1 }}
                className="rounded-2xl py-5 items-center"
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
              <View style={{ backgroundColor: colors.tealSoft }} className="w-20 h-20 rounded-full items-center justify-center mb-6">
                <Ionicons name="mail-outline" size={48} color={colors.teal} />
              </View>
              <Text style={{ color: colors.text }} className="text-xl font-body-bold text-center mb-4">Code envoyé !</Text>
              <Text style={{ color: colors.textMuted }} className="text-center font-body mb-10 leading-6">
                Un code de réinitialisation a été envoyé à{' '}
                <Text style={{ color: colors.text }} className="font-body-bold">{identifier}</Text>.{'\n'}
                Entrez-le sur la page suivante.
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.replace({
                    pathname: '/(auth)/reset-password' as any,
                    params: { identifier: identifier.trim() },
                  })
                }
                style={{ backgroundColor: colors.teal }}
                className="w-full py-5 rounded-2xl items-center mb-4"
              >
                <Text className="text-white font-body-bold text-base">Saisir le code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.replace('/(auth)/login' as any)}
                style={{ backgroundColor: colors.border, borderColor: colors.border }}
                className="px-8 py-4 rounded-2xl border"
              >
                <Text style={{ color: colors.text }} className="font-body-bold">Retour à la connexion</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
