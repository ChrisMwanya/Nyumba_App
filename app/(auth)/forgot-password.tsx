import Button from '@/components/ui/Button';
import { ApiError } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import * as authService from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
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
      await authService.forgotPassword(identifier.trim());
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
            Mot de passe oublié
          </Text>
          <Text
            style={{ color: colors.textMuted }}
            className="mt-2 font-body text-sm"
          >
            Pas de panique ! Entrez votre email ou votre téléphone, on vous
            envoie un code pour en choisir un nouveau.
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

              <View className="mb-8">
                <Text
                  style={{ color: colors.textMuted }}
                  className="mb-2 font-body-semibold text-sm"
                >
                  Email ou Téléphone
                </Text>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: identifierFocused
                      ? colors.borderFocused
                      : colors.border,
                  }}
                  className="flex-row items-center rounded-2xl border px-4 py-3.5"
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={identifierFocused ? colors.teal : colors.icon}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    style={{ color: colors.text }}
                    className="flex-1 font-body text-base"
                    placeholder="votre@email.com ou 07..."
                    placeholderTextColor={colors.textMuted}
                    value={identifier}
                    onChangeText={v => {
                      setIdentifier(v);
                      setError(null);
                    }}
                    keyboardType="default"
                    autoCapitalize="none"
                    onFocus={() => setIdentifierFocused(true)}
                    onBlur={() => setIdentifierFocused(false)}
                  />
                </View>
              </View>

              <Button
                title="Envoyer le code"
                onPress={handleResetRequest}
                loading={loading}
              />
            </>
          ) : (
            <View className="items-center justify-center py-10">
              <View
                style={{ backgroundColor: colors.tealSoft }}
                className="mb-6 h-20 w-20 items-center justify-center rounded-full"
              >
                <Ionicons name="mail-outline" size={48} color={colors.teal} />
              </View>
              <Text
                style={{ color: colors.text }}
                className="mb-4 text-center font-body-bold text-xl"
              >
                Code envoyé !
              </Text>
              <Text
                style={{ color: colors.textMuted }}
                className="mb-10 text-center font-body leading-6"
              >
                Un code de réinitialisation a été envoyé à{' '}
                <Text style={{ color: colors.text }} className="font-body-bold">
                  {identifier}
                </Text>
                .{'\n'}
                Entrez-le sur la page suivante.
              </Text>
              <Button
                title="Saisir le code"
                className="mb-3 w-full"
                onPress={() =>
                  router.replace({
                    pathname: '/(auth)/reset-password' as any,
                    params: { identifier: identifier.trim() },
                  })
                }
              />
              <Button
                title="Retour à la connexion"
                variant="outline"
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
