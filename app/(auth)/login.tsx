import { ApiError, useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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
        if (err.status === 401 || err.status === 400) {
          setGlobalError('Email/Téléphone ou mot de passe incorrect.');
        } else if (err.status === 403) {
          setGlobalError('Votre compte est désactivé. Contactez le support.');
        } else {
          setGlobalError('Une erreur est survenue. Réessayez plus tard.');
        }
      } else {
        console.log("erreur" + err);
        
        setGlobalError('Impossible de joindre le serveur. Vérifiez votre connexion.');
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
        {/* En-tête avec fond sombre et accent teal */}
        <View style={{ backgroundColor: colors.bg }} className="px-6 pt-20 pb-12 items-center">
          <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="w-20 h-20 rounded-[24px] items-center justify-center border mb-6">
            <Image
              source={require('../../assets/images/splash-icon-light.png')}
              className="w-12 h-12"
              resizeMode="contain"
            />
          </View>
          <Text style={{ color: colors.text }} className="text-3xl font-body-bold mb-2">Nyumba</Text>
          <Text style={{ color: colors.textMuted }} className="text-sm font-body text-center">
            Gérez vos propriétés facilement
          </Text>
        </View>

        {/* Formulaire */}
        <View className="flex-1 px-8 pb-10">
          <Text style={{ color: colors.text }} className="text-2xl font-body-bold mb-2">Content de vous revoir</Text>
          <Text style={{ color: colors.textMuted }} className="text-sm font-body mb-10">
            Connectez-vous à votre compte.
          </Text>

          {/* Erreur globale */}
          {globalError && (
            <View style={{ backgroundColor: colors.errorSoft, borderColor: colors.errorBorder }} className="rounded-2xl px-4 py-4 mb-8 flex-row items-center border">
              <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
              <Text style={{ color: colors.error }} className="text-sm font-body ml-3 flex-1">
                {globalError}
              </Text>
            </View>
          )}

          {/* Champ Identifiant */}
          <View className="mb-6">
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
                onChangeText={(v) => { setIdentifier(v); setGlobalError(null); }}
                keyboardType="default"
                autoCapitalize="none"
                onFocus={() => setIdentifierFocused(true)}
                onBlur={() => setIdentifierFocused(false)}
              />
            </View>
          </View>

          {/* Champ Mot de passe */}
          <View className="mb-4">
            <Text style={{ color: colors.textMuted }} className="text-xs font-body-medium mb-2 uppercase tracking-widest ml-1">
              Mot de passe
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: passwordFocused ? colors.borderFocused : colors.border,
              }}
              className="flex-row items-center border rounded-2xl px-4 py-4"
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={passwordFocused ? colors.teal : colors.icon}
                style={{ marginRight: 12 }}
              />
              <TextInput
                style={{ color: colors.text }}
                className="flex-1 text-base font-body"
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={(v) => { setPassword(v); setGlobalError(null); }}
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
          <View className="items-end mb-10">
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password' as any)}>
              <Text style={{ color: colors.teal }} className="text-sm font-body-medium">
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bouton Connexion */}
          <TouchableOpacity
            style={{ backgroundColor: colors.teal, opacity: loading ? 0.7 : 1 }}
            className="rounded-2xl py-5 items-center"
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-base font-body-bold tracking-wider">
                Se connecter
              </Text>
            )}
          </TouchableOpacity>

          {/* Lien vers inscription */}
          <View className="flex-row justify-center items-center mt-10">
            <Text style={{ color: colors.textMuted }} className="text-sm font-body">
              Pas encore de compte ?{' '}
            </Text>
            <Link href={"/(auth)/register" as any} asChild>
              <TouchableOpacity>
                <Text style={{ color: colors.text }} className="font-body-bold text-sm">
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
