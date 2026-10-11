import Button from '@/components/ui/Button';
import { ApiError, useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

type FieldErrors = Record<string, string>;

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { colors } = useTheme();
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
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

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
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.errors?.length) {
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
        } else if (err.status === 409 || err.status === 429) {
          setGlobalError(err.message);
        } else {
          setGlobalError('Une erreur est survenue. Réessayez plus tard.');
        }
      } else {
        setGlobalError(
          'Impossible de joindre le serveur. Vérifiez votre connexion.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getBorderColor = (field: string) =>
    focusedField === field
      ? colors.borderFocused
      : fieldErrors[field]
        ? colors.error
        : colors.input;

  const iconColor = (field: string) =>
    focusedField === field ? colors.teal : colors.icon;

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
            Rejoignez Nyumba
          </Text>
          <Text
            style={{ color: colors.textMuted }}
            className="mt-2 font-body text-sm"
          >
            Restos, hôtels, rooftops, sorties… trouvez les meilleurs coins de la
            ville en quelques secondes.
          </Text>
        </View>

        <View className="flex-1 px-8 pb-10 pt-4">
          {/* Erreur globale */}
          {globalError && (
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
                {globalError}
              </Text>
            </View>
          )}

          {/* Nom complet */}
          <View className="mb-6">
            <Text
              style={{ color: colors.textMuted }}
              className="mb-2 font-body-semibold text-sm"
            >
              Nom complet *
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: getBorderColor('fullName'),
              }}
              className="flex-row items-center rounded-2xl border px-4 py-3.5"
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={iconColor('fullName')}
                style={{ marginRight: 12 }}
              />
              <TextInput
                style={{ color: colors.text }}
                className="flex-1 font-body text-base"
                placeholder="Jean Dupont"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={v => {
                  setFullName(v);
                  clearError('fullName');
                }}
                autoCapitalize="words"
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {fieldErrors.fullName && (
              <Text
                style={{ color: colors.error }}
                className="ml-1 mt-1 font-body text-xs"
              >
                {fieldErrors.fullName}
              </Text>
            )}
          </View>

          {/* Email */}
          <View className="mb-6">
            <Text
              style={{ color: colors.textMuted }}
              className="mb-2 font-body-semibold text-sm"
            >
              Adresse email *
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: getBorderColor('email'),
              }}
              className="flex-row items-center rounded-2xl border px-4 py-3.5"
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={iconColor('email')}
                style={{ marginRight: 12 }}
              />
              <TextInput
                style={{ color: colors.text }}
                className="flex-1 font-body text-base"
                placeholder="votre@email.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={v => {
                  setEmail(v);
                  clearError('email');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {fieldErrors.email && (
              <Text
                style={{ color: colors.error }}
                className="ml-1 mt-1 font-body text-xs"
              >
                {fieldErrors.email}
              </Text>
            )}
          </View>

          {/* Téléphone (optionnel) */}
          <View className="mb-6">
            <Text
              style={{ color: colors.textMuted }}
              className="mb-2 font-body-semibold text-sm"
            >
              Téléphone{' '}
              <Text style={{ color: colors.textMuted }}>(optionnel)</Text>
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: getBorderColor('phone'),
              }}
              className="flex-row items-center rounded-2xl border px-4 py-3.5"
            >
              <Ionicons
                name="call-outline"
                size={20}
                color={iconColor('phone')}
                style={{ marginRight: 12 }}
              />
              <TextInput
                style={{ color: colors.text }}
                className="flex-1 font-body text-base"
                placeholder="+243 81 234 5678"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={v => {
                  setPhone(v);
                  clearError('phone');
                }}
                keyboardType="phone-pad"
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {fieldErrors.phone && (
              <Text
                style={{ color: colors.error }}
                className="ml-1 mt-1 font-body text-xs"
              >
                {fieldErrors.phone}
              </Text>
            )}
          </View>

          {/* Mot de passe */}
          <View className="mb-6">
            <Text
              style={{ color: colors.textMuted }}
              className="mb-2 font-body-semibold text-sm"
            >
              Mot de passe *
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: getBorderColor('password'),
              }}
              className="flex-row items-center rounded-2xl border px-4 py-3.5"
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={iconColor('password')}
                style={{ marginRight: 12 }}
              />
              <TextInput
                style={{ color: colors.text }}
                className="flex-1 font-body text-base"
                placeholder="Minimum 8 caractères"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={v => {
                  setPassword(v);
                  clearError('password');
                }}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.icon}
                />
              </Pressable>
            </View>
            {fieldErrors.password && (
              <Text
                style={{ color: colors.error }}
                className="ml-1 mt-1 font-body text-xs"
              >
                {fieldErrors.password}
              </Text>
            )}
          </View>

          {/* Confirmer le mot de passe */}
          <View className="mb-10">
            <Text
              style={{ color: colors.textMuted }}
              className="mb-2 font-body-semibold text-sm"
            >
              Confirmer le mot de passe *
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: getBorderColor('confirmPassword'),
              }}
              className="flex-row items-center rounded-2xl border px-4 py-3.5"
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={iconColor('confirmPassword')}
                style={{ marginRight: 12 }}
              />
              <TextInput
                style={{ color: colors.text }}
                className="flex-1 font-body text-base"
                placeholder="Répétez votre mot de passe"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={v => {
                  setConfirmPassword(v);
                  clearError('confirmPassword');
                }}
                secureTextEntry={!showConfirmPassword}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.icon}
                />
              </Pressable>
            </View>
            {fieldErrors.confirmPassword && (
              <Text
                style={{ color: colors.error }}
                className="ml-1 mt-1 font-body text-xs"
              >
                {fieldErrors.confirmPassword}
              </Text>
            )}
          </View>

          {/* Bouton S'inscrire */}
          <Button
            title="Créer mon compte"
            onPress={handleRegister}
            loading={loading}
          />

          {/* Lien vers connexion */}
          <View className="mt-10 flex-row items-center justify-center">
            <Text
              style={{ color: colors.textMuted }}
              className="font-body text-sm"
            >
              Déjà un compte ?{' '}
            </Text>
            <Link href={'/(auth)/login' as any} asChild>
              <TouchableOpacity>
                <Text
                  style={{ color: colors.text }}
                  className="font-body-bold text-sm"
                >
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
