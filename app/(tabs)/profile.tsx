import Button from '@/components/ui/Button';
import { Tiles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useTheme, type ThemeMode } from '@/contexts/ThemeContext';
import * as authService from '@/services/authService';
import { uploadToCloudinary } from '@/utils/cloudinary';

const THEME_OPTIONS: {
  mode: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { mode: 'light', label: 'Clair', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Sombre', icon: 'moon-outline' },
  { mode: 'system', label: 'Système', icon: 'phone-portrait-outline' },
];

const initialsOf = (fullName?: string) =>
  (fullName ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'U';

const memberSince = (isoDate?: string) => {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};

export default function ProfileScreen() {
  const { user, signOut, accessToken, updateUser, applyTokens } = useAuth();
  const { colors, mode: themeMode, setMode: setThemeMode } = useTheme();
  const { favorites } = useFavorites();
  const router = useRouter();

  const [editVisible, setEditVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPasswords, setShowNewPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Le profil peut arriver après le premier rendu (rafraîchissement du jeton).
  useEffect(() => {
    setFullName(user?.fullName ?? '');
    setPhone(user?.phone ?? '');
  }, [user?.fullName, user?.phone]);

  const trimmedName = fullName.trim();
  const trimmedPhone = phone.trim();
  const nameChanged = trimmedName !== (user?.fullName ?? '');
  const phoneChanged = trimmedPhone !== (user?.phone ?? '');
  const hasChanges = nameChanged || phoneChanged;

  const handleSave = async () => {
    if (trimmedName.length < 2) {
      Alert.alert(
        'Nom invalide',
        'Le nom complet doit contenir au moins 2 caractères.'
      );
      return;
    }
    if (!accessToken || !hasChanges) return;

    setIsSaving(true);
    try {
      // Seuls les champs réellement modifiés partent : l'API refuse un corps
      // vide, et renvoyer le numéro inchangé déclencherait sa vérification
      // d'unicité pour rien.
      const updated = await authService.updateProfile(accessToken, {
        ...(nameChanged ? { fullName: trimmedName } : {}),
        ...(phoneChanged ? { phone: trimmedPhone || null } : {}),
      });
      updateUser(updated);
      setEditVisible(false);
    } catch (error: any) {
      Alert.alert('Erreur', error.message ?? 'La mise à jour a échoué.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Permission requise',
        "Autorisez l'accès à vos photos pour choisir une image de profil."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !accessToken) return;

    setIsUploadingAvatar(true);
    try {
      // L'API signe la requête, la photo part directement chez l'hébergeur,
      // puis seule sa référence revient à l'API.
      const signature = await authService.getAvatarUploadSignature(accessToken);
      const uploaded = await uploadToCloudinary(
        result.assets[0].uri,
        signature
      );
      updateUser(await authService.setAvatar(accessToken, uploaded));
    } catch (error: any) {
      Alert.alert(
        'Photo non enregistrée',
        error.status === 503
          ? "L'hébergement des images n'est pas encore configuré sur le serveur."
          : (error.message ?? "L'envoi de la photo a échoué.")
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarOptions = () => {
    Alert.alert('Photo de profil', undefined, [
      { text: 'Changer la photo', onPress: handlePickAvatar },
      {
        text: 'Retirer la photo',
        style: 'destructive',
        onPress: handleRemoveAvatar,
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const handleRemoveAvatar = () => {
    Alert.alert('Retirer la photo', 'Retirer votre photo de profil ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer',
        style: 'destructive',
        onPress: async () => {
          if (!accessToken) return;
          setIsUploadingAvatar(true);
          try {
            updateUser(await authService.removeAvatar(accessToken));
          } catch (error: any) {
            Alert.alert(
              'Erreur',
              error.message ?? 'Impossible de retirer la photo.'
            );
          } finally {
            setIsUploadingAvatar(false);
          }
        },
      },
    ]);
  };

  const handleDelete = async () => {
    if (!accessToken || !password) return;

    setIsDeleting(true);
    try {
      await authService.deleteAccount(accessToken, password);
      setDeleteVisible(false);
      setPassword('');
      // `signOut` purge les jetons et renvoie sur la connexion. Son appel à
      // /auth/logout échouera — le compte n'existe plus — mais il l'ignore.
      await signOut();
    } catch (error: any) {
      Alert.alert(
        'Suppression impossible',
        error.message ?? 'Vérifiez votre mot de passe et réessayez.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const closePasswordModal = () => {
    setPasswordVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPasswords(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert(
        'Mot de passe trop court',
        'Le nouveau mot de passe doit contenir au moins 8 caractères.'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(
        'Confirmation incorrecte',
        'Le nouveau mot de passe et sa confirmation ne correspondent pas.'
      );
      return;
    }
    if (newPassword === currentPassword) {
      Alert.alert(
        'Mot de passe inchangé',
        'Le nouveau mot de passe doit être différent de l’actuel.'
      );
      return;
    }
    if (!accessToken) return;

    setIsChangingPassword(true);
    try {
      const { tokens } = await authService.changePassword(accessToken, {
        currentPassword,
        newPassword,
      });
      // L'API vient d'invalider toutes les sessions, y compris celle-ci :
      // sans l'adoption des jetons neufs, on se déconnecterait soi-même.
      await applyTokens(tokens);
      closePasswordModal();
      Alert.alert(
        'Mot de passe modifié',
        'Vos autres appareils ont été déconnectés.'
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message ?? 'La modification a échoué.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: signOut },
    ]);
  };

  /* ------------------------------------------------------------------ */

  const sectionTitle = (title: string) => (
    <Text
      style={{ color: colors.textMuted }}
      className="mb-3 ml-1 font-body-semibold text-sm"
    >
      {title}
    </Text>
  );

  const row = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    options: {
      onPress?: () => void;
      last?: boolean;
      soon?: boolean;
      count?: number;
    } = {}
  ) => (
    <TouchableOpacity
      key={label}
      onPress={options.onPress}
      disabled={!options.onPress}
      style={{
        borderBottomColor: options.last ? 'transparent' : colors.divider,
        borderBottomWidth: options.last ? 0 : 1,
      }}
      className="flex-row items-center px-4 py-4"
      activeOpacity={0.6}
    >
      <View
        style={{ backgroundColor: colors.muted }}
        className="mr-4 h-10 w-10 items-center justify-center rounded-full"
      >
        <Ionicons name={icon} size={19} color={colors.text} />
      </View>
      <Text
        style={{ color: options.soon ? colors.textMuted : colors.text }}
        className="flex-1 font-body-medium text-base"
      >
        {label}
      </Text>
      {options.soon ? (
        // Annoncé plutôt que masqué : une ligne qui ne réagit pas au toucher
        // sans explication se lit comme une panne.
        <View
          style={{ backgroundColor: Tiles.yellow }}
          className="rounded-full px-2.5 py-1"
        >
          <Text
            style={{ color: colors.ink }}
            className="font-body-semibold text-[11px]"
          >
            Bientôt
          </Text>
        </View>
      ) : (
        <>
          {!!options.count && (
            <Text
              style={{ color: colors.textMuted }}
              className="mr-2 font-body-medium text-sm"
            >
              {options.count}
            </Text>
          )}
          <Ionicons name="chevron-forward" size={18} color={colors.icon} />
        </>
      )}
    </TouchableOpacity>
  );

  const canSubmitPassword =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  const passwordField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string
  ) => (
    <View className="mb-4">
      <Text
        style={{ color: colors.text }}
        className="mb-2 font-body-semibold text-sm"
      >
        {label}
      </Text>
      <View className="relative">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showNewPasswords}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.input,
            color: colors.text,
          }}
          className="h-14 rounded-2xl border px-4 pr-12 font-body"
          placeholder={placeholder}
          placeholderTextColor={colors.icon}
        />
        <TouchableOpacity
          onPress={() => setShowNewPasswords(shown => !shown)}
          className="absolute right-4 top-4"
          hitSlop={8}
        >
          <Ionicons
            name={showNewPasswords ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.icon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const card = (children: React.ReactNode) => (
    <View
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      className="mb-7 overflow-hidden rounded-3xl border"
    >
      {children}
    </View>
  );

  const joined = memberSince(user?.createdAt);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }}
      >
        <Text
          style={{ color: colors.text, letterSpacing: -0.8 }}
          className="mb-5 mt-4 font-body-bold text-3xl"
        >
          Profil
        </Text>

        {/* --- Identité --- */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
          className="mb-7 rounded-3xl border p-5"
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={user?.avatarUrl ? handleAvatarOptions : handlePickAvatar}
              disabled={isUploadingAvatar}
              activeOpacity={0.85}
              className="relative"
              accessibilityRole="button"
              accessibilityLabel={
                user?.avatarUrl
                  ? 'Modifier la photo de profil'
                  : 'Ajouter une photo de profil'
              }
            >
              <View
                style={{ backgroundColor: Tiles.lilac }}
                className="h-16 w-16 items-center justify-center overflow-hidden rounded-full"
              >
                {isUploadingAvatar ? (
                  <ActivityIndicator color={colors.ink} />
                ) : user?.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Text
                    style={{ color: colors.ink }}
                    className="font-body-bold text-xl"
                  >
                    {initialsOf(user?.fullName)}
                  </Text>
                )}
              </View>

              {!isUploadingAvatar && (
                <View
                  style={{
                    backgroundColor: colors.cta,
                    borderColor: colors.surface,
                  }}
                  className="absolute -bottom-0.5 -right-0.5 h-7 w-7 items-center justify-center rounded-full border-2"
                >
                  <Ionicons name="camera" size={14} color={colors.ctaText} />
                </View>
              )}
            </TouchableOpacity>

            <View className="ml-4 flex-1">
              <Text
                style={{ color: colors.text }}
                className="font-body-bold text-lg"
                numberOfLines={1}
              >
                {user?.fullName ?? 'Utilisateur'}
              </Text>
              <Text
                style={{ color: colors.textMuted }}
                className="mt-0.5 font-body text-xs"
                numberOfLines={1}
              >
                {user?.email ?? user?.phone ?? '—'}
              </Text>

              <View className="mt-2 flex-row items-center">
                {user?.isVerified && (
                  <View className="mr-3 flex-row items-center">
                    <Ionicons
                      name="checkmark-circle"
                      size={13}
                      color={colors.teal}
                    />
                    <Text
                      style={{ color: colors.teal }}
                      className="ml-1 font-body-bold text-[11px]"
                    >
                      Vérifié
                    </Text>
                  </View>
                )}
                {joined && (
                  <Text
                    style={{ color: colors.textMuted }}
                    className="font-body text-[11px]"
                  >
                    Membre depuis {joined}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setEditVisible(true)}
            style={{ borderColor: colors.input }}
            className="mt-5 h-12 flex-row items-center justify-center rounded-full border"
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={18} color={colors.text} />
            <Text
              style={{ color: colors.text }}
              className="ml-2 font-body-semibold"
            >
              Modifier mes informations
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- Apparence --- */}
        {sectionTitle('Apparence')}
        {card(
          <View
            style={{ backgroundColor: colors.muted }}
            className="flex-row rounded-full p-1"
          >
            {THEME_OPTIONS.map(option => {
              const isActive = themeMode === option.mode;
              return (
                <TouchableOpacity
                  key={option.mode}
                  onPress={() => setThemeMode(option.mode)}
                  style={{
                    backgroundColor: isActive ? colors.surface : 'transparent',
                  }}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-full py-2.5"
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={option.icon}
                    size={16}
                    color={isActive ? colors.text : colors.textMuted}
                  />
                  <Text
                    style={{ color: isActive ? colors.text : colors.textMuted }}
                    className="font-body-semibold text-sm"
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* --- Compte --- */}
        {sectionTitle('Compte')}
        {card(
          <>
            {row('heart-outline', 'Mes favoris', {
              onPress: () => router.navigate('/(tabs)/favoris' as any),
              count: favorites.length,
            })}
            {row('options-outline', 'Mes préférences', {
              onPress: () => router.push('/onboarding?edit=1' as any),
            })}
            {row('lock-closed-outline', 'Mot de passe', {
              onPress: () => setPasswordVisible(true),
            })}
            {row('notifications-outline', 'Notifications', { soon: true })}
            {row('card-outline', 'Moyens de paiement', {
              soon: true,
              last: true,
            })}
          </>
        )}

        {/* --- Aide --- */}
        {sectionTitle('Aide')}
        {card(
          <>
            {row('help-circle-outline', 'Aide & FAQ', { soon: true })}
            {row('headset-outline', 'Contacter le support', {
              soon: true,
              last: true,
            })}
          </>
        )}

        <Button
          title="Déconnexion"
          variant="outline"
          icon="log-out-outline"
          onPress={confirmLogout}
        />

        <TouchableOpacity
          onPress={() => setDeleteVisible(true)}
          className="mt-6 items-center py-2"
          activeOpacity={0.6}
        >
          <Text
            style={{ color: colors.textMuted }}
            className="font-body-medium text-xs underline"
          >
            Supprimer mon compte
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ================= Modification du profil ================= */}
      <Modal
        animationType="slide"
        transparent
        visible={editVisible}
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
          style={{ backgroundColor: colors.modalOverlay }}
        >
          <View
            style={{ backgroundColor: colors.bg }}
            className="rounded-t-3xl px-6 pb-10 pt-6"
          >
            <View className="mb-6 flex-row items-center justify-between">
              <Text
                style={{ color: colors.text }}
                className="font-body-bold text-xl"
              >
                Mes informations
              </Text>
              <TouchableOpacity
                onPress={() => setEditVisible(false)}
                style={{ backgroundColor: colors.muted }}
                className="h-10 w-10 items-center justify-center rounded-full"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text
              style={{ color: colors.text }}
              className="mb-2 font-body-semibold text-sm"
            >
              Nom complet
            </Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.input,
                color: colors.text,
              }}
              className="h-14 rounded-2xl border px-4 font-body"
              placeholder="Votre nom"
              placeholderTextColor={colors.icon}
            />

            <Text
              style={{ color: colors.text }}
              className="mb-2 mt-4 font-body-semibold text-sm"
            >
              Téléphone
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
              returnKeyType="done"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.input,
                color: colors.text,
              }}
              className="h-14 rounded-2xl border px-4 font-body"
              placeholder="0812 345 678"
              placeholderTextColor={colors.icon}
            />
            <Text
              style={{ color: colors.textMuted }}
              className="ml-1 mt-1.5 font-body text-[11px]"
            >
              Format local ou international, les deux sont acceptés.
            </Text>

            {user?.email && (
              <View className="mt-4 flex-row items-start">
                <Ionicons
                  name="lock-closed-outline"
                  size={14}
                  color={colors.textMuted}
                  style={{ marginTop: 2 }}
                />
                <Text
                  style={{ color: colors.textMuted }}
                  className="ml-2 flex-1 font-body text-xs leading-4"
                >
                  {user.email} sert à vous connecter et ne peut pas être modifié
                  depuis l&apos;application.
                </Text>
              </View>
            )}

            <Button
              title="Enregistrer"
              onPress={handleSave}
              loading={isSaving}
              disabled={!hasChanges}
              className="mt-6"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= Mot de passe ================= */}
      <Modal
        animationType="slide"
        transparent
        visible={passwordVisible}
        onRequestClose={closePasswordModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
          style={{ backgroundColor: colors.modalOverlay }}
        >
          <View
            style={{ backgroundColor: colors.bg }}
            className="rounded-t-3xl px-6 pb-10 pt-6"
          >
            <View className="mb-6 flex-row items-center justify-between">
              <Text
                style={{ color: colors.text }}
                className="font-body-bold text-xl"
              >
                Changer de mot de passe
              </Text>
              <TouchableOpacity
                onPress={closePasswordModal}
                style={{ backgroundColor: colors.muted }}
                className="h-10 w-10 items-center justify-center rounded-full"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {passwordField(
              'Mot de passe actuel',
              currentPassword,
              setCurrentPassword,
              'Votre mot de passe actuel'
            )}
            {passwordField(
              'Nouveau mot de passe',
              newPassword,
              setNewPassword,
              '8 caractères minimum'
            )}
            {passwordField(
              'Confirmer le nouveau mot de passe',
              confirmPassword,
              setConfirmPassword,
              'Répétez le nouveau mot de passe'
            )}

            {/* Signalé pendant la saisie plutôt qu'au moment d'envoyer : on ne
                laisse pas l'utilisateur découvrir l'erreur après coup. */}
            {confirmPassword.length > 0 && confirmPassword !== newPassword && (
              <View className="mt-1 flex-row items-center">
                <Ionicons
                  name="alert-circle-outline"
                  size={14}
                  color={colors.error}
                />
                <Text
                  style={{ color: colors.error }}
                  className="ml-1.5 font-body text-xs"
                >
                  La confirmation ne correspond pas.
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => {
                closePasswordModal();
                router.push('/(auth)/forgot-password' as any);
              }}
              className="mt-4 self-start py-1"
              activeOpacity={0.6}
            >
              <Text
                style={{ color: colors.teal }}
                className="font-body-medium text-xs"
              >
                J&apos;ai oublié mon mot de passe actuel
              </Text>
            </TouchableOpacity>

            <Button
              title="Mettre à jour"
              onPress={handleChangePassword}
              loading={isChangingPassword}
              disabled={!canSubmitPassword}
              className="mt-5"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= Suppression du compte ================= */}
      <Modal
        animationType="slide"
        transparent
        visible={deleteVisible}
        onRequestClose={() => setDeleteVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
          style={{ backgroundColor: colors.modalOverlay }}
        >
          <View
            style={{ backgroundColor: colors.bg }}
            className="rounded-t-3xl px-6 pb-10 pt-6"
          >
            <View className="mb-5 flex-row items-center justify-between">
              <Text
                style={{ color: colors.error }}
                className="font-body-bold text-xl"
              >
                Supprimer mon compte
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setDeleteVisible(false);
                  setPassword('');
                }}
                style={{ backgroundColor: colors.muted }}
                className="h-10 w-10 items-center justify-center rounded-full"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View
              style={{
                backgroundColor: colors.errorSoft,
                borderColor: colors.errorBorder,
              }}
              className="mb-6 rounded-2xl border p-4"
            >
              <Text
                style={{ color: colors.text }}
                className="font-body-bold text-sm"
              >
                Cette action est définitive.
              </Text>
              <Text
                style={{ color: colors.textSecondary }}
                className="mt-2 font-body text-xs leading-5"
              >
                Votre compte, vos réservations, vos avis et vos favoris seront
                supprimés. Il n&apos;est pas possible de les récupérer ensuite.
              </Text>
            </View>

            <Text
              style={{ color: colors.text }}
              className="mb-2 font-body-semibold text-sm"
            >
              Confirmez avec votre mot de passe
            </Text>
            <View className="relative">
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.input,
                  color: colors.text,
                }}
                className="h-14 rounded-2xl border px-4 pr-12 font-body"
                placeholder="Votre mot de passe"
                placeholderTextColor={colors.icon}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(value => !value)}
                className="absolute right-4 top-4"
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.icon}
                />
              </TouchableOpacity>
            </View>

            <Button
              title="Supprimer définitivement"
              variant="danger"
              icon="trash-outline"
              onPress={handleDelete}
              loading={isDeleting}
              disabled={password.length === 0}
              className="mt-6"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
