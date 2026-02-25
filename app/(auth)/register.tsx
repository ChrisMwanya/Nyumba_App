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
        password_confirmation: confirmPassword,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 422 && err.errors?.length) {
          // Mapper les erreurs API aux champs du formulaire
          const apiFieldMap: Record<string, string> = {
            fullName: 'fullName',
            email: 'email',
            phone: 'phone',
            password: 'password',
            password_confirmation: 'confirmPassword',
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
      ? 'border-primary'
      : fieldErrors[field]
      ? 'border-red-400'
      : 'border-gray-200';

  const iconColor = (field: string) => (focusedField === field ? '#1A306C' : '#9CA3AF');

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
        {/* En-tête */}
        <View className="bg-primary px-6 pt-16 pb-10 rounded-b-[40px]">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mb-6"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
       
          <Text className="text-white text-2xl mt-2" style={{ fontFamily: 'Montserrat_700Bold' }}>
            Créer un compte
          </Text>
          <Text className="text-white/70 text-sm mt-1" style={{ fontFamily: 'Montserrat_400Regular' }}>
            Rejoignez Nyumba et gérez vos biens
          </Text>
        </View>

        <View className="flex-1 px-6 pt-8 pb-8">

          {/* Erreur globale */}
          {globalError && (
            <View className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-6 flex-row items-center gap-2">
              <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
              <Text className="text-red-600 text-sm flex-1" style={{ fontFamily: 'Montserrat_400Regular' }}>
                {globalError}
              </Text>
            </View>
          )}

          {/* Nom complet */}
          <View className="mb-5">
            <Text className="text-gray-600 text-xs mb-2 uppercase tracking-widest" style={{ fontFamily: 'Montserrat_500Medium' }}>
              Nom complet *
            </Text>
            <View className={`flex-row items-center border rounded-2xl px-4 py-4 bg-gray-50 ${borderClass('fullName')}`}>
              <Ionicons name="person-outline" size={20} color={iconColor('fullName')} style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 text-gray-800 text-base"
                style={{ fontFamily: 'Montserrat_400Regular' }}
                placeholder="Jean Dupont"
                placeholderTextColor="#D1D5DB"
                value={fullName}
                onChangeText={(v) => { setFullName(v); clearError('fullName'); }}
                autoCapitalize="words"
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {fieldErrors.fullName && (
              <Text className="text-red-500 text-xs mt-1 ml-1" style={{ fontFamily: 'Montserrat_400Regular' }}>
                {fieldErrors.fullName}
              </Text>
            )}
          </View>

          {/* Email */}
          <View className="mb-5">
            <Text className="text-gray-600 text-xs mb-2 uppercase tracking-widest" style={{ fontFamily: 'Montserrat_500Medium' }}>
              Adresse email *
            </Text>
            <View className={`flex-row items-center border rounded-2xl px-4 py-4 bg-gray-50 ${borderClass('email')}`}>
              <Ionicons name="mail-outline" size={20} color={iconColor('email')} style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 text-gray-800 text-base"
                style={{ fontFamily: 'Montserrat_400Regular' }}
                placeholder="votre@email.com"
                placeholderTextColor="#D1D5DB"
                value={email}
                onChangeText={(v) => { setEmail(v); clearError('email'); }}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {fieldErrors.email && (
              <Text className="text-red-500 text-xs mt-1 ml-1" style={{ fontFamily: 'Montserrat_400Regular' }}>
                {fieldErrors.email}
              </Text>
            )}
          </View>

          {/* Téléphone (optionnel) */}
          <View className="mb-5">
            <Text className="text-gray-600 text-xs mb-2 uppercase tracking-widest" style={{ fontFamily: 'Montserrat_500Medium' }}>
              Téléphone <Text className="normal-case text-gray-400">(optionnel)</Text>
            </Text>
            <View className={`flex-row items-center border rounded-2xl px-4 py-4 bg-gray-50 ${borderClass('phone')}`}>
              <Ionicons name="call-outline" size={20} color={iconColor('phone')} style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 text-gray-800 text-base"
                style={{ fontFamily: 'Montserrat_400Regular' }}
                placeholder="+243 81 234 5678"
                placeholderTextColor="#D1D5DB"
                value={phone}
                onChangeText={(v) => { setPhone(v); clearError('phone'); }}
                keyboardType="phone-pad"
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {fieldErrors.phone && (
              <Text className="text-red-500 text-xs mt-1 ml-1" style={{ fontFamily: 'Montserrat_400Regular' }}>
                {fieldErrors.phone}
              </Text>
            )}
          </View>

          {/* Mot de passe */}
          <View className="mb-5">
            <Text className="text-gray-600 text-xs mb-2 uppercase tracking-widest" style={{ fontFamily: 'Montserrat_500Medium' }}>
              Mot de passe *
            </Text>
            <View className={`flex-row items-center border rounded-2xl px-4 py-4 bg-gray-50 ${borderClass('password')}`}>
              <Ionicons name="lock-closed-outline" size={20} color={iconColor('password')} style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 text-gray-800 text-base"
                style={{ fontFamily: 'Montserrat_400Regular' }}
                placeholder="Minimum 8 caractères"
                placeholderTextColor="#D1D5DB"
                value={password}
                onChangeText={(v) => { setPassword(v); clearError('password'); }}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
              </Pressable>
            </View>
            {fieldErrors.password && (
              <Text className="text-red-500 text-xs mt-1 ml-1" style={{ fontFamily: 'Montserrat_400Regular' }}>
                {fieldErrors.password}
              </Text>
            )}
          </View>

          {/* Confirmer le mot de passe */}
          <View className="mb-8">
            <Text className="text-gray-600 text-xs mb-2 uppercase tracking-widest" style={{ fontFamily: 'Montserrat_500Medium' }}>
              Confirmer le mot de passe *
            </Text>
            <View className={`flex-row items-center border rounded-2xl px-4 py-4 bg-gray-50 ${borderClass('confirmPassword')}`}>
              <Ionicons name="shield-checkmark-outline" size={20} color={iconColor('confirmPassword')} style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 text-gray-800 text-base"
                style={{ fontFamily: 'Montserrat_400Regular' }}
                placeholder="Répétez votre mot de passe"
                placeholderTextColor="#D1D5DB"
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); clearError('confirmPassword'); }}
                secureTextEntry={!showConfirmPassword}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
              />
              <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
              </Pressable>
            </View>
            {fieldErrors.confirmPassword && (
              <Text className="text-red-500 text-xs mt-1 ml-1" style={{ fontFamily: 'Montserrat_400Regular' }}>
                {fieldErrors.confirmPassword}
              </Text>
            )}
          </View>

          {/* Bouton S'inscrire */}
          <TouchableOpacity
            className="bg-primary rounded-2xl py-5 items-center"
            onPress={handleRegister}
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
              <Text className="text-white text-base tracking-wider" style={{ fontFamily: 'Montserrat_700Bold' }}>
                Créer mon compte
              </Text>
            )}
          </TouchableOpacity>

          {/* Lien vers connexion */}
          <View className="flex-row justify-center items-center mt-8">
            <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Montserrat_400Regular' }}>
              Déjà un compte ?{' '}
            </Text>
            <Link href={"/(auth)/login" as any} asChild>
              <TouchableOpacity>
                <Text className="text-primary text-sm" style={{ fontFamily: 'Montserrat_700Bold' }}>
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
