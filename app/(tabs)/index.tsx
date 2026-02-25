import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

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

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-8 rounded-b-[32px]">
        <View className="flex-row items-center justify-between">
          <View>
            <Text
              className="text-white/70 text-sm"
              style={{ fontFamily: 'Montserrat_400Regular' }}
            >
              Bienvenue 👋
            </Text>
            <Text
              className="text-white text-xl mt-1"
              style={{ fontFamily: 'Montserrat_700Bold' }}
            >
              {user?.fullName ?? 'Utilisateur'}
            </Text>
          </View>

          {/* Bouton déconnexion */}
          <TouchableOpacity
            onPress={handleLogout}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            activeOpacity={0.75}
          >
            <Ionicons name="log-out-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenu */}
      <View className="flex-1 items-center justify-center px-6">
        <Text
          className="text-gray-400 text-sm text-center"
          style={{ fontFamily: 'Montserrat_400Regular' }}
        >
          Le tableau de bord arrive bientôt…
        </Text>
      </View>
    </View>
  );
}
