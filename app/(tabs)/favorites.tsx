import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FavoritesScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F1721' }}>
      <View className="px-6 pt-8 pb-4">
        <Text className="text-white text-3xl font-body-bold mb-2">Mes Favoris</Text>
        <Text className="text-gray-400 font-body text-sm">
          Retrouvez ici toutes les propriétés que vous avez aimées.
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        <View className="mt-20 items-center justify-center">
          <View className="w-24 h-24 bg-dark-surface rounded-full items-center justify-center mb-6">
            <Ionicons name="heart-outline" size={48} color="#374151" />
          </View>
          <Text className="text-white text-xl font-body-bold mb-2">Aucun favori pour le moment</Text>
          <Text className="text-gray-500 font-body text-center px-8">
            Explorez nos propriétés et cliquez sur l'icône de cœur pour les ajouter à votre liste.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
