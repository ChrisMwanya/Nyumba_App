import { useAuth } from '@/contexts/AuthContext';
import { useTheme, type ThemeMode } from '@/contexts/ThemeContext';
import * as authService from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'light', label: 'Clair', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Sombre', icon: 'moon-outline' },
  { mode: 'system', label: 'Système', icon: 'phone-portrait-outline' },
];

export default function ProfileScreen() {
  const { user, signOut, accessToken, updateUser } = useAuth();
  const { colors, mode: themeMode, setMode: setThemeMode } = useTheme();
  const router = useRouter();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  
  // Profile Form state
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  // General state
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      // Logic for backend upload would go here
      Alert.alert('Succès', 'Photo de profil mise à jour localement.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!fullName) {
      Alert.alert('Erreur', 'Le nom complet est requis.');
      return;
    }

    setIsUpdating(true);
    try {
      if (accessToken) {
        const response = await authService.updateProfile(accessToken, {
          fullName : fullName ,
          phone: phone || undefined,
        });
        
        // Mettre à jour le state utilisateur global
        updateUser(response.user);
        
        Alert.alert('Succès', 'Votre profil a été mis à jour avec succès.');
        setEditModalVisible(false);
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la mise à jour.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Tous les champs sont requis.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Le nouveau mot de passe et la confirmation ne correspondent pas.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setIsChangingPassword(true);
    try {
      if (accessToken) {
        await authService.changePassword(accessToken, {
          currentPassword,
          password: newPassword,
          passwordConfirmation: confirmPassword
        });
        Alert.alert('Succès', 'Votre mot de passe a été modifié avec succès.');
        setPasswordModalVisible(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de modifier le mot de passe.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Êtes-vous absolument sûr ? Cette action est irréversible et toutes vos données seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              if (accessToken) {
                await authService.deleteAccount(accessToken);
                Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès.');
                signOut();
              }
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible de supprimer le compte.');
            } finally {
              setIsDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const SettingsRow = ({ icon, label, onPress, isDestructive, showDivider = true, isLoading = false }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      style={{ borderBottomColor: showDivider ? colors.divider : 'transparent', borderBottomWidth: showDivider ? 1 : 0 }}
      className="flex-row items-center justify-between px-4 py-4"
      activeOpacity={0.6}
    >
      <View className="flex-row items-center">
        <View style={{ backgroundColor: isDestructive ? colors.errorSoft : colors.tealSoft }} className="w-10 h-10 rounded-xl items-center justify-center mr-4">
          <Ionicons name={icon} size={20} color={isDestructive ? colors.error : colors.teal} />
        </View>
        <Text style={{ color: isDestructive ? colors.error : colors.text }} className="font-body-medium text-base">{label}</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={isDestructive ? colors.error : colors.teal} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={isDestructive ? colors.error : colors.border} />
      )}
    </TouchableOpacity>
  );

  const InputField = ({ label, value, onChangeText, keyboardType = 'default' as any, placeholder, secureTextEntry, editable = true }: any) => (
    <View className="mb-5">
      <Text style={{ color: colors.textMuted }} className="text-sm font-body-medium mb-2 ml-1">{label}</Text>
      <View className="relative">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          editable={editable}
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: editable ? colors.text : colors.textMuted,
            opacity: editable ? 1 : 0.5,
          }}
          className="border px-4 py-4 rounded-xl font-body"
          placeholderTextColor={colors.icon}
        />
        {label.toLowerCase().includes('pass') && (
           <TouchableOpacity 
             className="absolute right-4 top-4"
             onPress={() => setShowPasswords(!showPasswords)}
           >
             <Ionicons name={showPasswords ? "eye-off-outline" : "eye-outline"} size={20} color={colors.icon} />
           </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>
      <ScrollView 
       
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }}
      >
        {/* Header Profile Section */}
        <View className="px-6  pb-8">
          <View className="flex-row items-center justify-between mb-8">
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)' as any)}
              style={{ backgroundColor: colors.border }}
              className="w-10 h-10 rounded-full items-center justify-center"
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ color: colors.text }} className="text-xl font-body-bold">Mon Profil</Text>
            <View className="w-10" />
          </View>

          <View className="items-center mb-6">
            <View className="relative">
              <TouchableOpacity 
                onPress={pickImage}
                activeOpacity={0.8}
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                className="w-28 h-28 rounded-full items-center justify-center border-4 overflow-hidden"
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage }} className="w-full h-full" />
                ) : (
                  <Text style={{ color: colors.text }} className="text-4xl font-heading">
                    {user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() ?? 'U'}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={pickImage}
                style={{ backgroundColor: colors.teal, borderColor: colors.bg }}
                className="absolute bottom-1 right-1 w-8 h-8 rounded-full items-center justify-center border-2"
              >
                <Ionicons name="pencil" size={14} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.text }} className="text-2xl font-body-bold mt-4 mb-1">
              Bonjour, {user?.fullName}
            </Text>
            <Text style={{ color: colors.textMuted }} className="text-sm font-body">
              {user?.email}
            </Text>
          </View>

          <TouchableOpacity 
            onPress={() => setEditModalVisible(true)}
            style={{ backgroundColor: colors.tealSoft, borderColor: colors.tealSoft }}
            className="py-4 rounded-2xl items-center border"
            activeOpacity={0.8}
          >
            <Text style={{ color: colors.teal }} className="font-body-bold text-base">Modifier les informations</Text>
          </TouchableOpacity>
        </View>

        <View className="px-6">
          {/* Theme Selector */}
          <Text style={{ color: colors.text }} className="text-xl font-body-bold mb-4">Apparence</Text>
          <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="rounded-3xl overflow-hidden mb-8 border">
            <View className="flex-row p-2">
              {THEME_OPTIONS.map((opt) => {
                const isActive = themeMode === opt.mode;
                return (
                  <TouchableOpacity
                    key={opt.mode}
                    onPress={() => setThemeMode(opt.mode)}
                    style={{
                      backgroundColor: isActive ? colors.teal : 'transparent',
                    }}
                    className="flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2"
                    activeOpacity={0.7}
                  >
                    <Ionicons name={opt.icon as any} size={16} color={isActive ? 'white' : colors.textMuted} />
                    <Text
                      style={{ color: isActive ? 'white' : colors.textMuted }}
                      className="font-body-bold text-sm"
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* General Settings */}
          <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="rounded-3xl overflow-hidden mb-8 border">
            <SettingsRow icon="notifications-outline" label="Préférences de notification" showDivider />
            <SettingsRow icon="card-outline" label="Moyens de paiement" showDivider />
            <SettingsRow icon="lock-closed-outline" label="Sécurité" onPress={() => setPasswordModalVisible(true)} showDivider={false} />
          </View>

          {/* Reservations section */}
          <Text style={{ color: colors.text }} className="text-xl font-body-bold mb-4">Mes Réservations</Text>
          
          <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="flex-row p-1.5 rounded-2xl mb-6 border">
            <TouchableOpacity 
              onPress={() => setActiveTab('upcoming')}
              style={{ backgroundColor: activeTab === 'upcoming' ? colors.border : 'transparent' }}
              className="flex-1 py-3 rounded-xl items-center"
            >
              <Text style={{ color: activeTab === 'upcoming' ? colors.text : colors.textMuted }} className="font-body-medium">À venir</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setActiveTab('history')}
              style={{ backgroundColor: activeTab === 'history' ? colors.border : 'transparent' }}
              className="flex-1 py-3 rounded-xl items-center"
            >
              <Text style={{ color: activeTab === 'history' ? colors.text : colors.textMuted }} className="font-body-medium">Historique</Text>
            </TouchableOpacity>
          </View>

          {/* Reservation Card Mockup */}
          <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="rounded-[32px] overflow-hidden border mb-8">
             <View style={{ backgroundColor: colors.skeleton }} className="h-48 relative">
               <View style={{ backgroundColor: colors.tealSoft, borderColor: colors.tealSoft }} className="absolute top-4 right-4 px-3 py-1.5 rounded-full border">
                 <Text style={{ color: colors.teal }} className="text-xs font-body-bold">Confirmé</Text>
               </View>
             </View>
             <View className="p-5">
               <Text style={{ color: colors.text }} className="text-lg font-body-bold mb-1">Grand Hyatt Hotel</Text>
               <Text style={{ color: colors.textMuted }} className="text-sm font-body mb-4">Paris, France</Text>
               
               <View style={{ borderTopColor: colors.divider }} className="flex-row items-center justify-between border-t pt-4">
                 <View>
                   <Text style={{ color: colors.textMuted }} className="text-xs font-body mb-1">Arrivée</Text>
                   <Text style={{ color: colors.text }} className="font-body-bold">25 Déc, 2024</Text>
                 </View>
                 <View className="items-end">
                   <Text style={{ color: colors.textMuted }} className="text-xs font-body mb-1">Départ</Text>
                   <Text style={{ color: colors.text }} className="font-body-bold">30 Déc, 2024</Text>
                 </View>
               </View>
             </View>
          </View>

          {/* Help section */}
          <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="rounded-3xl overflow-hidden mb-12 border">
            <SettingsRow icon="help-circle-outline" label="Aide & FAQ" showDivider />
            <SettingsRow icon="headset-outline" label="Contacter le support" showDivider={false} />
          </View>

          {/* Logout & Delete */}
          <TouchableOpacity 
            onPress={handleLogout}
            style={{ backgroundColor: colors.errorSoft, borderColor: colors.errorBorder }}
            className="py-5 rounded-2xl border flex-row items-center justify-center mb-4"
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={{ color: colors.error }} className="font-body-bold ml-2">Déconnexion</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleDeleteAccount}
            className="py-2 items-center"
          >
            <Text style={{ color: colors.textMuted }} className="font-body-medium text-xs">Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals updated to Theme */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: colors.modalOverlay }}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1, backgroundColor: colors.bg, borderTopColor: colors.border }}
            className="rounded-t-[40px] px-6 pt-8 pb-10 border-t"
          >
            <View className="flex-row items-center justify-between mb-8">
              <Text style={{ color: colors.text }} className="text-xl font-body-bold">Modifier le profil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={{ backgroundColor: colors.border }} className="w-10 h-10 items-center justify-center rounded-full">
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView 
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <InputField label="Nom complet" value={fullName} onChangeText={setFullName} />
              <InputField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" editable={false} />
              <InputField label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <TouchableOpacity onPress={handleUpdateProfile} disabled={isUpdating} style={{ backgroundColor: colors.teal, opacity: isUpdating ? 0.7 : 1 }} className="py-4 rounded-2xl items-center justify-center flex-row mt-4" activeOpacity={0.8}>
                {isUpdating ? <ActivityIndicator color="white" className="mr-2" /> : <Ionicons name="save-outline" size={20} color="white" className="mr-2" />}
                <Text className="text-white font-body-bold text-base ml-2">Enregistrer les modifications</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: colors.modalOverlay }}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1, backgroundColor: colors.bg, borderTopColor: colors.border }}
            className="rounded-t-[40px] px-6 pt-8 pb-10 border-t"
          >
            <View className="flex-row items-center justify-between mb-8">
              <Text style={{ color: colors.text }} className="text-xl font-body-bold">Modifier le mot de passe</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)} style={{ backgroundColor: colors.border }} className="w-10 h-10 items-center justify-center rounded-full">
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView 
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <InputField 
                label="Mot de passe actuel" 
                value={currentPassword} 
                onChangeText={setCurrentPassword} 
                secureTextEntry={!showPasswords} 
                placeholder="Votre mot de passe actuel"
              />
              <InputField 
                label="Nouveau mot de passe" 
                value={newPassword} 
                onChangeText={setNewPassword} 
                secureTextEntry={!showPasswords} 
                placeholder="Min. 8 caractères"
              />
              <InputField 
                label="Confirmer le nouveau mot de passe" 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                secureTextEntry={!showPasswords} 
                placeholder="Répétez le nouveau mot de passe"
              />
              <TouchableOpacity 
                onPress={handleChangePassword} 
                disabled={isChangingPassword} 
                style={{ backgroundColor: colors.teal, opacity: isChangingPassword ? 0.7 : 1 }}
                className="py-4 rounded-2xl items-center justify-center flex-row mt-4" 
                activeOpacity={0.8}
              >
                {isChangingPassword ? <ActivityIndicator color="white" className="mr-2" /> : <Ionicons name="lock-open-outline" size={20} color="white" className="mr-2" />}
                <Text className="text-white font-body-bold text-base ml-2">Mettre à jour</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
