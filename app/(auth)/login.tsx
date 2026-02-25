import { ApiError, useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setGlobalError('Veuillez remplir tous les champs.');
      return;
    }
    setGlobalError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 400) {
          setGlobalError('Email ou mot de passe incorrect.');
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
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête avec fond primary */}
        <View className="bg-primary px-6 pt-16 pb-12 items-center rounded-b-[40px]">
          <Image
            source={require('../../assets/images/splash-icon-light.png')}
            className="w-24 h-24"
            resizeMode="contain"
          />
       
          <Text className="text-white/70 text-sm mt-1" style={{ fontFamily: 'Montserrat_400Regular' }}>
            Gérez vos propriétés facilement
          </Text>
        </View>

        {/* Formulaire */}
        <View className="flex-1 px-6 pt-10 pb-8">
          <Text
            className="text-2xl text-gray-800 mb-2"
            style={{ fontFamily: 'Montserrat_700Bold' }}
          >
            Connexion
          </Text>
          <Text className="text-gray-500 mb-8 text-sm" style={{ fontFamily: 'Montserrat_400Regular' }}>
            Content de vous revoir ! Connectez-vous à votre compte.
          </Text>

          {/* Erreur globale */}
          {globalError && (
            <View className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-6 flex-row items-center gap-2">
              <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
              <Text className="text-red-600 text-sm flex-1" style={{ fontFamily: 'Montserrat_400Regular' }}>
                {globalError}
              </Text>
            </View>
          )}

          {/* Champ Email */}
          <View className="mb-5">
            <Text
              className="text-gray-600 text-xs mb-2 uppercase tracking-widest"
              style={{ fontFamily: 'Montserrat_500Medium' }}
            >
              Adresse email
            </Text>
            <View
              className={`flex-row items-center border rounded-2xl px-4 py-4 bg-gray-50 ${
                emailFocused ? 'border-primary' : 'border-gray-200'
              }`}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={emailFocused ? '#1A306C' : '#9CA3AF'}
                style={{ marginRight: 12 }}
              />
              <TextInput
                className="flex-1 text-gray-800 text-base"
                style={{ fontFamily: 'Montserrat_400Regular' }}
                placeholder="votre@email.com"
                placeholderTextColor="#D1D5DB"
                value={email}
                onChangeText={(v) => { setEmail(v); setGlobalError(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
          </View>

          {/* Champ Mot de passe */}
          <View className="mb-3">
            <Text
              className="text-gray-600 text-xs mb-2 uppercase tracking-widest"
              style={{ fontFamily: 'Montserrat_500Medium' }}
            >
              Mot de passe
            </Text>
            <View
              className={`flex-row items-center border rounded-2xl px-4 py-4 bg-gray-50 ${
                passwordFocused ? 'border-primary' : 'border-gray-200'
              }`}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={passwordFocused ? '#1A306C' : '#9CA3AF'}
                style={{ marginRight: 12 }}
              />
              <TextInput
                className="flex-1 text-gray-800 text-base"
                style={{ fontFamily: 'Montserrat_400Regular' }}
                placeholder="••••••••"
                placeholderTextColor="#D1D5DB"
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
                  color="#9CA3AF"
                />
              </Pressable>
            </View>
          </View>

          {/* Mot de passe oublié */}
          <View className="items-end mb-8">
            <TouchableOpacity>
              <Text
                className="text-primary text-sm"
                style={{ fontFamily: 'Montserrat_500Medium' }}
              >
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bouton Connexion */}
          <TouchableOpacity
            className="bg-primary rounded-2xl py-5 items-center"
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
            style={{
              shadowColor: '#1A306C',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 8,
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text
                className="text-white text-base tracking-wider"
                style={{ fontFamily: 'Montserrat_700Bold' }}
              >
                Se connecter
              </Text>
            )}
          </TouchableOpacity>

          {/* Séparateur */}
          <View className="flex-row items-center my-8">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-400 text-xs" style={{ fontFamily: 'Montserrat_400Regular' }}>
              ou
            </Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Lien vers inscription */}
          <View className="flex-row justify-center items-center">
            <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Montserrat_400Regular' }}>
              Pas encore de compte ?{' '}
            </Text>
            <Link href={"/(auth)/register" as any} asChild>
              <TouchableOpacity>
                <Text className="text-primary text-sm" style={{ fontFamily: 'Montserrat_700Bold' }}>
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
