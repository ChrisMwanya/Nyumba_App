import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

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

  const handleNotifications = () => {
    Alert.alert('Notifications', "Vous n'avez pas de nouvelles notifications pour le moment.");
  };

  return (
    <View className="flex-1 bg-dark-bg">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* Header */}
        <View className="px-6 pt-16">
          <View className="flex-row items-center justify-between mb-8">
            <View>
              <Text className="text-gray-400 text-sm font-body">Bienvenue 👋</Text>
              <Text className="text-white text-2xl font-body-bold mt-1">
                {user?.fullName ?? 'Utilisateur'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleNotifications}
              className="w-12 h-12 rounded-2xl bg-dark-surface items-center justify-center border border-white/5"
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={22} color="white" />
              <View className="absolute top-3 right-3 w-2 h-2 rounded-full bg-dark-teal border-2 border-dark-surface" />
            </TouchableOpacity>
          </View>

          {/* Search/Filter Bar Mockup */}
          <View className="flex-row items-center bg-dark-surface px-4 py-4 rounded-2xl border border-white/5 mb-8">
            <Ionicons name="search-outline" size={20} color="#6B7280" />
            <Text className="text-gray-500 font-body ml-3 flex-1">Où voulez-vous aller ?</Text>
            <TouchableOpacity className="bg-dark-teal/10 p-2 rounded-lg">
              <Ionicons name="options-outline" size={20} color="#00BFA5" />
            </TouchableOpacity>
          </View>

          <Text className="text-white text-xl font-body-bold mb-4">Recommandé pour vous</Text>
          
          {/* Mockup Card */}
          <View className="bg-dark-surface rounded-[32px] overflow-hidden border border-white/5 mb-8">
             <View className="h-56 bg-gray-700" />
             <View className="p-5">
               <View className="flex-row justify-between items-start mb-2">
                 <Text className="text-white text-lg font-body-bold flex-1">Villa avec piscine privée</Text>
                 <View className="flex-row items-center bg-dark-bg px-2 py-1 rounded-lg">
                   <Ionicons name="star" size={14} color="#FFD700" />
                   <Text className="text-white text-xs font-body-bold ml-1">4.9</Text>
                 </View>
               </View>
               <Text className="text-gray-400 text-sm font-body mb-4">Abidjan, Côte d'Ivoire</Text>
               <View className="flex-row items-center justify-between">
                 <Text className="text-white font-body-bold text-lg">75.000 FCFA <Text className="text-gray-500 text-sm font-body">/ nuit</Text></Text>
                 <TouchableOpacity className="bg-dark-teal px-4 py-2 rounded-xl">
                   <Text className="text-white font-body-bold text-xs">Réserver</Text>
                 </TouchableOpacity>
               </View>
             </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
