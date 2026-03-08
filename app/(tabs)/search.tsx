import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F1721' }}>
      <View className="px-6 pt-8 pb-4">
        <Text className="text-white text-3xl font-body-bold mb-6">Recherche</Text>
        
        <View className="flex-row items-center bg-dark-surface border border-white/5 rounded-2xl px-4 py-4 mb-6">
          <Ionicons name="search" size={20} color="#6B7280" style={{ marginRight: 12 }} />
          <TextInput 
            placeholder="Rechercher une propriété..."
            placeholderTextColor="#4B5563"
            className="flex-1 text-white font-body text-base"
          />
        </View>

        <View className="flex-row flex-wrap gap-2">
          {['Maisons', 'Appartements', 'Villas', 'Terrains'].map((filter) => (
            <TouchableOpacity 
              key={filter}
              className="bg-dark-surface border border-white/5 px-4 py-2 rounded-full"
            >
              <Text className="text-gray-400 font-body-medium">{filter}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 px-6">
        <View className="mt-10 items-center justify-center">
          <View className="w-20 h-20 bg-dark-surface rounded-full items-center justify-center mb-4">
            <Ionicons name="search-outline" size={40} color="#374151" />
          </View>
          <Text className="text-gray-500 font-body text-center">
            Trouvez votre prochaine demeure idéale{"\n"}en utilisant la recherche ci-dessus.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
