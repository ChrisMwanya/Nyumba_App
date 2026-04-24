import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Alert, ScrollView, Text, TouchableOpacity, View, Image } from 'react-native';
import { categories, listings } from '@/constants/fakeData';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0].id);

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

  const popularListings = listings.filter(l => l.isPopular);
  const filteredListings = listings.filter(l => l.categoryId === selectedCategory);

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
        </View>

        {/* Categories */}
        <View className="mb-8">
           <ScrollView 
             horizontal 
             showsHorizontalScrollIndicator={false}
             contentContainerStyle={{ paddingHorizontal: 24 }}
           >
             {categories.map((category) => {
               const isActive = selectedCategory === category.id;
               return (
                 <TouchableOpacity
                   key={category.id}
                   onPress={() => setSelectedCategory(category.id)}
                   className={`mr-4 px-5 py-3 rounded-2xl flex-row items-center border ${
                     isActive ? 'bg-dark-teal border-dark-teal' : 'bg-dark-surface border-white/5'
                   }`}
                 >
                   <Ionicons 
                     name={category.icon as any} 
                     size={20} 
                     color={isActive ? 'white' : '#9CA3AF'} 
                   />
                   <Text 
                     className={`ml-2 font-body font-medium ${
                       isActive ? 'text-white' : 'text-gray-400'
                     }`}
                   >
                     {category.name}
                   </Text>
                 </TouchableOpacity>
               );
             })}
           </ScrollView>
        </View>

        <View className="px-6">
          <Text className="text-white text-xl font-body-bold mb-4">Recommandé pour vous</Text>
          
          {/* Mockup Card List */}
          {filteredListings.map((listing) => (
            <View key={listing.id} className="bg-dark-surface rounded-[32px] overflow-hidden border border-white/5 mb-6">
               <Image 
                 source={{ uri: listing.imageUrl }} 
                 className="h-56 w-full bg-gray-700"
                 resizeMode="cover"
               />
               <View className="p-5">
                 <View className="flex-row justify-between items-start mb-2">
                   <Text className="text-white text-lg font-body-bold flex-1 mr-2">{listing.title}</Text>
                   <View className="flex-row items-center bg-dark-bg px-2 py-1 rounded-lg">
                     <Ionicons name="star" size={14} color="#FFD700" />
                     <Text className="text-white text-xs font-body-bold ml-1">{listing.rating}</Text>
                   </View>
                 </View>
                 <Text className="text-gray-400 text-sm font-body mb-4">{listing.location}</Text>
                 <View className="flex-row items-center justify-between">
                   <Text className="text-white font-body-bold text-lg">
                     {listing.price}$ <Text className="text-gray-500 text-sm font-body">/ nuit</Text>
                   </Text>
                   <TouchableOpacity className="bg-dark-teal px-4 py-2 rounded-xl">
                     <Text className="text-white font-body-bold text-xs">Réserver</Text>
                   </TouchableOpacity>
                 </View>
               </View>
            </View>
          ))}
          
          {filteredListings.length === 0 && (
            <View className="items-center justify-center py-10">
              <Ionicons name="sad-outline" size={48} color="#4B5563" />
              <Text className="text-gray-400 font-body mt-4 text-center">Aucune annonce trouvée dans cette catégorie.</Text>
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}
