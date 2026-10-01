import BrandHero from '@/components/ui/BrandHero';
import Button from '@/components/ui/Button';
import { getLogo } from '@/constants/branding';
import { ApiError, useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [identifierFocused, setIdentifierFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setGlobalError('Veuillez remplir tous les champs.');
      return;
    }
    setGlobalError(null);
    setLoading(true);
    try {
      await signIn(identifier.trim(), password);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setGlobalError('Email/Téléphone ou mot de passe incorrect.');
        } else if (err.status === 400) {
          setGlobalError(
            err.errors?.[0]?.message ?? 'Email ou numéro de téléphone invalide.'
          );
        } else if (err.status === 429) {
          setGlobalError(err.message);
        } else {
          setGlobalError('Une erreur est survenue. Réessayez plus tard.');
        }
      } else {
        console.log('erreur' + err);

        setGlobalError(
          'Impossible de joindre le serveur. Vérifiez votre connexion.'
        );
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
        {/* En-tête en aplats géométriques, comme la landing */}
        <BrandHero tile="mint" height={200}>
          <View
            style={{ backgroundColor: '#FFFFFF' }}
            className="absolute bottom-6 left-6 h-16 w-16 items-center justify-center rounded-2xl"
          >
            <Image
              source={getLogo(false)}
              className="h-10 w-10"
              resizeMode="contain"
            />
          </View>
        </BrandHero>

        {/* Formulaire */}
        <View className="flex-1 px-6 pb-10 pt-8">
          <Text
            style={{ color: colors.text, letterSpacing: -0.8 }}
            className="mb-2 font-body-bold text-3xl"
          >
            Bienvenue sur Nyumba.
          </Text>
          <Text
            style={{ color: colors.textMuted }}
            className="mb-8 font-body text-sm"
          >
            Connectez-vous pour retrouver vos adresses et vos réservations.
          </Text>

          {/* Erreur globale */}
          {globalError && (
            <View
              style={{
                backgroundColor: colors.errorSoft,
                borderColor: colors.errorBorder,
              }}
              className="mb-6 flex-row items-center rounded-2xl border px-4 py-3.5"
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
                {globalError}
              </Text>
            </View>
          )}

          {/* Champ Identifiant */}
          <View className="mb-6">
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
                  : colors.input,
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
                  setGlobalError(null);
                }}
                keyboardType="default"
                autoCapitalize="none"
                onFocus={() => setIdentifierFocused(true)}
                onBlur={() => setIdentifierFocused(false)}
              />
            </View>
          </View>

          {/* Champ Mot de passe */}
          <View className="mb-4">
            <Text
              style={{ color: colors.textMuted }}
              className="mb-2 font-body-semibold text-sm"
            >
              Mot de passe
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: passwordFocused
                  ? colors.borderFocused
                  : colors.input,
              }}
              className="flex-row items-center rounded-2xl border px-4 py-3.5"
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={passwordFocused ? colors.teal : colors.icon}
                style={{ marginRight: 12 }}
              />
              <TextInput
                style={{ color: colors.text }}
                className="flex-1 font-body text-base"
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={v => {
                  setPassword(v);
                  setGlobalError(null);
                }}
                secureTextEntry={!showPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
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

          {/* Mot de passe oublié */}
          <View className="mb-10 items-end">
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password' as any)}
            >
              <Text
                style={{ color: colors.teal }}
                className="font-body-medium text-sm"
              >
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bouton Connexion */}
          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={loading}
          />

          {/* Lien vers inscription */}
          <View className="mt-10 flex-row items-center justify-center">
            <Text
              style={{ color: colors.textMuted }}
              className="font-body text-sm"
            >
              Pas encore de compte ?{' '}
            </Text>
            <Link href={'/(auth)/register' as any} asChild>
              <TouchableOpacity>
                <Text
                  style={{ color: colors.teal }}
                  className="font-body-bold text-sm"
                >
                  Créer un compte
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
