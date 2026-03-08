import { useAuth } from '@/contexts/AuthContext';
import * as authService from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const { user, signOut, accessToken } = useAuth();
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

  const InfoRow = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
    <View className="flex-row items-center py-4 border-b border-gray-100">
      <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-4">
        <Ionicons name={icon} size={20} color="#1A306C" />
      </View>
      <View className="flex-1">
        <Text className="text-gray-400 text-xs mb-1 font-body">{label}</Text>
        <Text className="text-gray-800 text-sm font-body-medium">{value || 'Non renseigné'}</Text>
      </View>
    </View>
  );

  const InputField = ({ label, value, onChangeText, keyboardType = 'default' as any, placeholder, secureTextEntry }: any) => (
    <View className="mb-5">
      <Text className="text-gray-600 text-sm font-body-medium mb-2 ml-1">{label}</Text>
      <View className="relative">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          className="bg-gray-50 border border-gray-100 px-4 py-4 rounded-xl text-gray-800 font-body"
          placeholderTextColor="#9CA3AF"
        />
        {label.toLowerCase().includes('pass') && (
           <TouchableOpacity 
             className="absolute right-4 top-4"
             onPress={() => setShowPasswords(!showPasswords)}
           >
             <Ionicons name={showPasswords ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
           </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Profile Section */}
        <View className="bg-primary pt-16 pb-12 px-6 items-center rounded-b-[40px] relative">
          <TouchableOpacity 
            onPress={() => setEditModalVisible(true)}
            className="absolute right-6 top-16 w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color="white" />
          </TouchableOpacity>

          <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center border-2 border-white/30 mb-4">
            <Text className="text-white text-3xl font-heading">
              {user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() ?? 'U'}
            </Text>
          </View>
          <Text className="text-white text-xl font-body-bold mb-1">
            {user?.fullName}
          </Text>
          <View className="bg-white/20 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-body-medium capitalize">
              {user?.role?.name ?? 'Utilisateur'}
            </Text>
          </View>
        </View>

        <View className="px-6 py-8">
          <Text className="text-gray-900 text-lg font-body-bold mb-4">Informations personnelles</Text>
          <View className="bg-white rounded-2xl border border-gray-100 px-4 mb-8">
            <InfoRow icon="mail-outline" label="Email" value={user?.email ?? ''} />
            <InfoRow icon="call-outline" label="Téléphone" value={user?.phone ?? ''} />
            <InfoRow icon="shield-checkmark-outline" label="Rôle" value={user?.role?.name ?? ''} />
          </View>

          <Text className="text-gray-900 text-lg font-body-bold mb-4">Sécurité</Text>
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <TouchableOpacity 
              onPress={() => setPasswordModalVisible(true)}
              className="flex-row items-center justify-between px-4 py-4 border-b border-gray-50"
              activeOpacity={0.6}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-4">
                  <Ionicons name="lock-closed-outline" size={20} color="#1A306C" />
                </View>
                <Text className="text-gray-800 font-body-medium">Modifier mon mot de passe</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="flex-row items-center justify-between px-4 py-4"
              activeOpacity={0.6}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mr-4">
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </View>
                <Text className="text-red-500 font-body-medium">Supprimer mon compte</Text>
              </View>
              {isDeletingAccount ? <ActivityIndicator size="small" color="#EF4444" /> : <Ionicons name="chevron-forward" size={20} color="#FECACA" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={handleLogout}
            className="mt-12 flex-row items-center justify-center bg-gray-50 py-4 rounded-xl border border-gray-100"
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#4B5563" />
            <Text className="text-gray-600 font-body-bold ml-2">Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals remain the same ... */}
      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="bg-white rounded-t-[40px] px-6 pt-8 pb-10">
            <View className="flex-row items-center justify-between mb-8">
              <Text className="text-gray-900 text-xl font-body-bold">Modifier le profil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="w-8 h-8 items-center justify-center">
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <InputField label="Nom complet" value={fullName} onChangeText={setFullName} />
              <InputField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
              <InputField label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <TouchableOpacity onPress={handleUpdateProfile} disabled={isUpdating} className={`bg-primary py-4 rounded-xl items-center justify-center flex-row mt-4 ${isUpdating ? 'opacity-70' : ''}`} activeOpacity={0.8}>
                {isUpdating ? <ActivityIndicator color="white" className="mr-2" /> : <Ionicons name="save-outline" size={20} color="white" className="mr-2" />}
                <Text className="text-white font-body-bold text-base ml-2">Enregistrer les modifications</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="bg-white rounded-t-[40px] px-6 pt-8 pb-10">
            <View className="flex-row items-center justify-between mb-8">
              <Text className="text-gray-900 text-xl font-body-bold">Modifier le mot de passe</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)} className="w-8 h-8 items-center justify-center">
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
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
                className={`bg-primary py-4 rounded-xl items-center justify-center flex-row mt-4 ${isChangingPassword ? 'opacity-70' : ''}`} 
                activeOpacity={0.8}
              >
                {isChangingPassword ? <ActivityIndicator color="white" className="mr-2" /> : <Ionicons name="lock-open-outline" size={20} color="white" className="mr-2" />}
                <Text className="text-white font-body-bold text-base ml-2">Mettre à jour le mot de passe</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
