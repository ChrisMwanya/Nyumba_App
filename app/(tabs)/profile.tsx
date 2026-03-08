import { useAuth } from '@/contexts/AuthContext';
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

export default function ProfileScreen() {
  const { user, signOut, accessToken } = useAuth();
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
    if (!fullName || !email) {
      Alert.alert('Erreur', 'Le nom et l\'email sont requis.');
      return;
    }

    setIsUpdating(true);
    try {
      // Simulation API Update Profile
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert('Succès', 'Votre profil a été mis à jour (simulation).');
      setEditModalVisible(false);
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la mise à jour.');
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
          newPassword,
          newPassword_confirmation: confirmPassword
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
      className={`flex-row items-center justify-between px-4 py-4 ${showDivider ? 'border-b border-white/5' : ''}`}
      activeOpacity={0.6}
    >
      <View className="flex-row items-center">
        <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${isDestructive ? 'bg-red-500/10' : 'bg-dark-accent/30'}`}>
          <Ionicons name={icon} size={20} color={isDestructive ? '#EF4444' : '#00BFA5'} />
        </View>
        <Text className={`font-body-medium text-base ${isDestructive ? 'text-red-500' : 'text-white'}`}>{label}</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={isDestructive ? '#EF4444' : '#00BFA5'} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={isDestructive ? '#EF4444' : '#ffffff20'} />
      )}
    </TouchableOpacity>
  );

  const InputField = ({ label, value, onChangeText, keyboardType = 'default' as any, placeholder, secureTextEntry }: any) => (
    <View className="mb-5">
      <Text className="text-gray-400 text-sm font-body-medium mb-2 ml-1">{label}</Text>
      <View className="relative">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          className="bg-dark-surface border border-white/5 px-4 py-4 rounded-xl text-white font-body"
          placeholderTextColor="#6B7280"
        />
        {label.toLowerCase().includes('pass') && (
           <TouchableOpacity 
             className="absolute right-4 top-4"
             onPress={() => setShowPasswords(!showPasswords)}
           >
             <Ionicons name={showPasswords ? "eye-off-outline" : "eye-outline"} size={20} color="#6B7280" />
           </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: '#0F1721' }}>
      <ScrollView 
       
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }}
      >
        {/* Header Profile Section */}
        <View className="px-6  pb-8">
          <View className="flex-row items-center justify-between mb-8">
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)' as any)}
              className="w-10 h-10 rounded-full items-center justify-center bg-white/5"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-body-bold">Mon Profil</Text>
            <View className="w-10" />
          </View>

          <View className="items-center mb-6">
            <View className="relative">
              <TouchableOpacity 
                onPress={pickImage}
                activeOpacity={0.8}
                className="w-28 h-28 rounded-full bg-dark-surface items-center justify-center border-4 border-white/10 overflow-hidden"
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage }} className="w-full h-full" />
                ) : (
                  <Text className="text-white text-4xl font-heading">
                    {user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() ?? 'U'}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={pickImage}
                className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-dark-teal items-center justify-center border-2 border-dark-bg"
              >
                <Ionicons name="pencil" size={14} color="white" />
              </TouchableOpacity>
            </View>
            <Text className="text-white text-2xl font-body-bold mt-4 mb-1">
              Bonjour, {user?.fullName}
            </Text>
            <Text className="text-gray-400 text-sm font-body">
              {user?.email}
            </Text>
          </View>

          <TouchableOpacity 
            onPress={() => setEditModalVisible(true)}
            className="bg-dark-accent/40 py-4 rounded-2xl items-center border border-dark-teal/20"
            activeOpacity={0.8}
          >
            <Text className="text-dark-teal font-body-bold text-base">Modifier les informations</Text>
          </TouchableOpacity>
        </View>

        <View className="px-6">
          {/* General Settings */}
          <View className="bg-dark-surface rounded-3xl overflow-hidden mb-8 border border-white/5">
            <SettingsRow icon="notifications-outline" label="Préférences de notification" showDivider />
            <SettingsRow icon="card-outline" label="Moyens de paiement" showDivider />
            <SettingsRow icon="lock-closed-outline" label="Sécurité" onPress={() => setPasswordModalVisible(true)} showDivider={false} />
          </View>

          {/* Reservations section */}
          <Text className="text-white text-xl font-body-bold mb-4">Mes Réservations</Text>
          
          <View className="flex-row bg-dark-surface p-1.5 rounded-2xl mb-6 border border-white/5">
            <TouchableOpacity 
              onPress={() => setActiveTab('upcoming')}
              className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'upcoming' ? 'bg-white/10' : ''}`}
            >
              <Text className={`font-body-medium ${activeTab === 'upcoming' ? 'text-white' : 'text-gray-400'}`}>À venir</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setActiveTab('history')}
              className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'history' ? 'bg-white/10' : ''}`}
            >
              <Text className={`font-body-medium ${activeTab === 'history' ? 'text-white' : 'text-gray-400'}`}>Historique</Text>
            </TouchableOpacity>
          </View>

          {/* Reservation Card Mockup */}
          <View className="bg-dark-surface rounded-[32px] overflow-hidden border border-white/5 mb-8">
             <View className="h-48 bg-gray-600 relative">
               <View className="absolute top-4 right-4 bg-dark-accent/80 px-3 py-1.5 rounded-full border border-dark-teal/30">
                 <Text className="text-dark-teal text-xs font-body-bold">Confirmé</Text>
               </View>
             </View>
             <View className="p-5">
               <Text className="text-white text-lg font-body-bold mb-1">Grand Hyatt Hotel</Text>
               <Text className="text-gray-400 text-sm font-body mb-4">Paris, France</Text>
               
               <View className="flex-row items-center justify-between border-t border-white/5 pt-4">
                 <View>
                   <Text className="text-gray-500 text-xs font-body mb-1">Arrivée</Text>
                   <Text className="text-white font-body-bold">25 Déc, 2024</Text>
                 </View>
                 <View className="items-end">
                   <Text className="text-gray-500 text-xs font-body mb-1">Départ</Text>
                   <Text className="text-white font-body-bold">30 Déc, 2024</Text>
                 </View>
               </View>
             </View>
          </View>

          {/* Help section */}
          <View className="bg-dark-surface rounded-3xl overflow-hidden mb-12 border border-white/5">
            <SettingsRow icon="help-circle-outline" label="Aide & FAQ" showDivider />
            <SettingsRow icon="headset-outline" label="Contacter le support" showDivider={false} />
          </View>

          {/* Logout & Delete */}
          <TouchableOpacity 
            onPress={handleLogout}
            className="bg-red-500/10 py-5 rounded-2xl border border-red-500/20 flex-row items-center justify-center mb-4"
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="text-red-500 font-body-bold ml-2">Déconnexion</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleDeleteAccount}
            className="py-2 items-center"
          >
            <Text className="text-gray-600 font-body-medium text-xs">Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals updated to Dark Theme */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            className="flex-1 bg-dark-bg rounded-t-[40px] px-6 pt-8 pb-10 border-t border-white/5"
          >
            <View className="flex-row items-center justify-between mb-8">
              <Text className="text-white text-xl font-body-bold">Modifier le profil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="w-10 h-10 items-center justify-center rounded-full bg-white/5">
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView 
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <InputField label="Nom complet" value={fullName} onChangeText={setFullName} />
              <InputField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
              <InputField label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <TouchableOpacity onPress={handleUpdateProfile} disabled={isUpdating} className={`bg-dark-teal py-4 rounded-2xl items-center justify-center flex-row mt-4 ${isUpdating ? 'opacity-70' : ''}`} activeOpacity={0.8}>
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
        <View className="flex-1 justify-end bg-black/60">
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            className="flex-1 bg-dark-bg rounded-t-[40px] px-6 pt-8 pb-10 border-t border-white/5"
          >
            <View className="flex-row items-center justify-between mb-8">
              <Text className="text-white text-xl font-body-bold">Modifier le mot de passe</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)} className="w-10 h-10 items-center justify-center rounded-full bg-white/5">
                <Ionicons name="close" size={24} color="white" />
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
                className={`bg-dark-teal py-4 rounded-2xl items-center justify-center flex-row mt-4 ${isChangingPassword ? 'opacity-70' : ''}`} 
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
