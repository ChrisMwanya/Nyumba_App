import { ApiError, useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
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

type FieldErrors = Record<string, string>;

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clearError = (field: string) =>
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });

  const validateLocally = (): boolean => {
    const errs: FieldErrors = {};
    if (!fullName.trim() || fullName.trim().length < 2)
      errs.fullName = 'Minimum 2 caractères.';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email))
      errs.email = 'Adresse email invalide.';
    if (phone && (phone.length < 8 || phone.length > 20))
      errs.phone = 'Numéro entre 8 et 20 caractères.';
    if (!password || password.length < 8)
      errs.password = 'Minimum 8 caractères.';
    if (password !== confirmPassword)
      errs.confirmPassword = 'Les mots de passe ne correspondent pas.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    setGlobalError(null);
    if (!validateLocally()) return;
    setLoading(true);
    try {
      await signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        passwordConfirmation: confirmPassword,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 422 && err.errors?.length) {
          const apiFieldMap: Record<string, string> = {
            fullName: 'fullName',
            email: 'email',
            phone: 'phone',
            password: 'password',
            passwordConfirmation: 'confirmPassword',
          };
          const mapped: FieldErrors = {};
          for (const e of err.errors) {
            const key = apiFieldMap[e.field] ?? e.field;
            mapped[key] = e.message;
          }
          setFieldErrors(mapped);
        } else if (err.status === 400) {
          setGlobalError('Données invalides. Vérifiez les champs et réessayez.');
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

  const borderClass = (field: string) =>
    focusedField === field
      ? 'border-dark-teal'
      : fieldErrors[field]
      ? 'border-red-400'
      : 'border-white/5';

  const iconColor = (field: string) => (focusedField === field ? '#00BFA5' : '#6B7280');

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
       
          <Text className="text-white text-3xl font-body-bold">Créer un compte</Text>
          <Text className="text-gray-400 text-sm font-body mt-2">
            Rejoignez Nyumba et gérez vos biens
          </Text>
        </View>

        <View className="flex-1 px-8 pt-4 pb-10">

          {/* Erreur globale */}
          {globalError && (
            <View className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-4 mb-8 flex-row items-center">
              <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
              <Text className="text-red-500 text-sm font-body ml-3 flex-1">
                {globalError}
              </Text>
            </View>
          )}

          {/* Nom complet */}
          <View className="mb-6">
            <Text className="text-gray-400 text-xs font-body-medium mb-2 uppercase tracking-widest ml-1">
              Nom complet *
            </Text>
            <View className={`flex-row items-center bg-dark-surface border rounded-2xl px-4 py-4 ${borderClass('fullName')}`}>
              <Ionicons name="person-outline" size={20} color={iconColor('fullName')} style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 text-white text-base font-body"
                placeholder="Jean Dupont"
                placeholderTextColor="#4B5563"
                value={fullName}
                onChangeText={(v) => { setFullName(v); clearError('fullName'); }}
                autoCapitalize="words"
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {fieldErrors.fullName && (
              <Text className="text-red-400 text-xs mt-1 ml-1 font-body">
                {fieldErrors.fullName}
              </Text>
            )}
          </View>

          {/* Email */}
          <View className="mb-6">
            <Text className="text-gray-400 text-xs font-body-medium mb-2 uppercase tracking-widest ml-1">
              Adresse email *
            </Text>
            <View className={`flex-row items-center bg-dark-surface border rounded-2xl px-4 py-4 ${borderClass('email')}`}>
              <Ionicons name="mail-outline" size={20} color={iconColor('email')} style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 text-white text-base font-body"
                placeholder="votre@email.com"
                placeholderTextColor="#4B5563"
                value={email}
                onChangeText={(v) => { setEmail(v); clearError('email'); }}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {fieldErrors.email && (
              <Text className="text-red-400 text-xs mt-1 ml-1 font-body">
                {fieldErrors.email}
              </Text>
            )}
          </View>

          {/* Téléphone (optionnel) */}
          <View className="mb-6">
            <Text className="text-gray-400 text-xs font-body-medium mb-2 uppercase tracking-widest ml-1">
              Téléphone <Text className="normal-case text-gray-500">(optionnel)</Text>
            </Text>
            <View className={`flex-row items-center bg-dark-surface border rounded-2xl px-4 py-4 ${borderClass('phone')}`}>
              <Ionicons name="call-outline" size={20} color={iconColor('phone')} style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 text-white text-base font-body"
                placeholder="+243 81 234 5678"
                placeholderTextColor="#4B5563"
                value={phone}
                onChangeText={(v) => { setPhone(v); clearError('phone'); }}
                keyboardType="phone-pad"
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {fieldErrors.phone && (
              <Text className="text-red-400 text-xs mt-1 ml-1 font-body">
                {fieldErrors.phone}
              </Text>
            )}
          </View>

          {/* Mot de passe */}
          <View className="mb-6">
            <Text className="text-gray-400 text-xs font-body-medium mb-2 uppercase tracking-widest ml-1">
              Mot de passe *
            </Text>
            <View className={`flex-row items-center bg-dark-surface border rounded-2xl px-4 py-4 ${borderClass('password')}`}>
              <Ionicons name="lock-closed-outline" size={20} color={iconColor('password')} style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 text-white text-base font-body"
                placeholder="Minimum 8 caractères"
                placeholderTextColor="#4B5563"
                value={password}
                onChangeText={(v) => { setPassword(v); clearError('password'); }}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
              </Pressable>
            </View>
            {fieldErrors.password && (
              <Text className="text-red-400 text-xs mt-1 ml-1 font-body">
                {fieldErrors.password}
              </Text>
            )}
          </View>

          {/* Confirmer le mot de passe */}
          <View className="mb-10">
            <Text className="text-gray-400 text-xs font-body-medium mb-2 uppercase tracking-widest ml-1">
              Confirmer le mot de passe *
            </Text>
            <View className={`flex-row items-center bg-dark-surface border rounded-2xl px-4 py-4 ${borderClass('confirmPassword')}`}>
              <Ionicons name="shield-checkmark-outline" size={20} color={iconColor('confirmPassword')} style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 text-white text-base font-body"
                placeholder="Répétez votre mot de passe"
                placeholderTextColor="#4B5563"
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); clearError('confirmPassword'); }}
                secureTextEntry={!showConfirmPassword}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
              />
              <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
              </Pressable>
            </View>
            {fieldErrors.confirmPassword && (
              <Text className="text-red-400 text-xs mt-1 ml-1 font-body">
                {fieldErrors.confirmPassword}
              </Text>
            )}
          </View>

          {/* Bouton S'inscrire */}
          <TouchableOpacity
            className={`bg-dark-teal rounded-2xl py-5 items-center ${loading ? 'opacity-70' : ''}`}
            onPress={handleRegister}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-base font-body-bold tracking-wider">
                Créer mon compte
              </Text>
            )}
          </TouchableOpacity>

          {/* Lien vers connexion */}
          <View className="flex-row justify-center items-center mt-10">
            <Text className="text-gray-400 text-sm font-body">
              Déjà un compte ?{' '}
            </Text>
            <Link href={"/(auth)/login" as any} asChild>
              <TouchableOpacity>
                <Text className="text-white font-body-bold text-sm">
                  Se connecter
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
