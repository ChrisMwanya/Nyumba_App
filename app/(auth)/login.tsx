import { ApiError, useAuth } from '@/contexts/AuthContext';
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
        setGlobalError('Impossible de joindre le serveur. Vérifiez votre connexion.');
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
        {/* En-tête avec fond sombre et accent teal */}
        <View className="bg-dark-bg px-6 pt-20 pb-12 items-center">
          <View className="w-20 h-20 bg-dark-surface rounded-[24px] items-center justify-center border border-white/5 mb-6">
            <Image
              source={require('../../assets/images/splash-icon-light.png')}
              className="w-12 h-12"
              resizeMode="contain"
            />
          </View>
          <Text className="text-white text-3xl font-body-bold mb-2">Nyumba</Text>
          <Text className="text-gray-400 text-sm font-body text-center">
            Gérez vos propriétés facilement
          </Text>
        </View>

        {/* Formulaire */}
        <View className="flex-1 px-8 pb-10">
          <Text className="text-white text-2xl font-body-bold mb-2">Content de vous revoir</Text>
          <Text className="text-gray-400 text-sm font-body mb-10">
            Connectez-vous à votre compte.
          </Text>

          {/* Erreur globale */}
          {globalError && (
            <View className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-4 mb-8 flex-row items-center">
              <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
              <Text className="text-red-500 text-sm font-body ml-3 flex-1">
                {globalError}
              </Text>
            </View>
          )}

          {/* Champ Identifiant */}
          <View className="mb-6">
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
            <Text className="text-gray-400 text-xs font-body-medium mb-2 uppercase tracking-widest ml-1">
              Mot de passe
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
                onChangeText={(v) => { setPassword(v); setGlobalError(null); }}
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

          {/* Mot de passe oublié */}
          <View className="items-end mb-10">
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password' as any)}>
              <Text className="text-dark-teal text-sm font-body-medium">
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bouton Connexion */}
          <TouchableOpacity
            className={`bg-dark-teal rounded-2xl py-5 items-center ${loading ? 'opacity-70' : ''}`}
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
            <Text className="text-gray-400 text-sm font-body">
              Pas encore de compte ?{' '}
            </Text>
            <Link href={"/(auth)/register" as any} asChild>
              <TouchableOpacity>
                <Text className="text-white font-body-bold text-sm">
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
