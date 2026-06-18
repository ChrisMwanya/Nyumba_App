import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Annonce } from '@/services/annonceService';
import { getCategoryFeatures, getDynamicFeatures } from '@/constants/features';
import { openDirections } from '@/utils/map';

interface PropertyCardProps {
  annonce: Annonce;
  language?: 'fr' | 'en';
}

export default function PropertyCard({ annonce, language = 'fr' }: PropertyCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      className="rounded-[32px] overflow-hidden border mb-6"
      activeOpacity={0.9}
      onPress={() => router.push(`/annonces/${annonce.id}` as any)}
    >
       <View className="relative">
         <Image 
           source={{ uri: (annonce.images && annonce.images[0]?.url) || annonce.coverImageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800' }} 
           className="h-64 w-full"
           style={{ backgroundColor: colors.skeleton }}
           resizeMode="cover"
         />
         <View style={{ backgroundColor: colors.teal }} className="absolute top-4 left-4 px-3 py-1.5 rounded-full shadow-lg shadow-black/40">
           <Text className="text-white text-[10px] font-body-bold uppercase tracking-wider">{annonce.category?.name || 'Propriété'}</Text>
         </View>
         <View style={{ backgroundColor: colors.overlay }} className="absolute top-4 right-4 px-3 py-2 rounded-2xl backdrop-blur-md">
            <View className="flex-row items-center">
              <Ionicons name="star" size={14} color={colors.star} />
              <Text className="text-white text-xs font-body-bold ml-1">{annonce.avgRating || '4.5'}</Text>
            </View>
         </View>
       </View>

       <View className="p-6">
         <View className="flex-row justify-between items-start mb-3">
           <View className="flex-1 mr-3">
              <Text style={{ color: colors.text }} className="text-xl font-body-bold" numberOfLines={1}>{annonce.title}</Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="location-outline" size={14} color={colors.icon} />
                <Text style={{ color: colors.textMuted }} className="text-xs font-body ml-1">
                  {annonce.ville?.name}{annonce.commune?.name ? `, ${annonce.commune.name}` : ''}
                </Text>
              </View>
           </View>
           {annonce.status && (
             <View style={{ backgroundColor: colors.tealSoft }} className="px-3 py-1 rounded-lg">
                <Text style={{ color: colors.teal }} className="text-xs font-body-bold uppercase">{annonce.status}</Text>
             </View>
           )}
         </View>

         <View style={{ backgroundColor: colors.divider }} className="h-[1px] w-full my-4" />

         <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              {getDynamicFeatures(annonce).slice(0, 2).map((feat, idx) => (
                <View key={idx} className="flex-row items-center">
                  <Ionicons name={feat.icon as any} size={16} color={colors.teal} />
                  <Text style={{ color: colors.textSecondary }} className="text-xs font-body-medium ml-1">{feat.value}</Text>
                </View>
              ))}
              {getDynamicFeatures(annonce).length === 0 && (
                <>
                  <View className="flex-row items-center">
                    <Ionicons name="bed-outline" size={16} color={colors.teal} />
                    <Text style={{ color: colors.textSecondary }} className="text-xs font-body-medium ml-1">3 Ch.</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="water-outline" size={16} color={colors.teal} />
                    <Text style={{ color: colors.textSecondary }} className="text-xs font-body-medium ml-1">2 Sdb.</Text>
                  </View>
                </>
              )}
            </View>

         </View>

         {annonce.latitude && annonce.longitude && (
           <TouchableOpacity 
             onPress={() => openDirections(annonce.latitude!, annonce.longitude!, annonce.title)}
             style={{ backgroundColor: colors.surface, borderColor: colors.border }}
             className="w-full mt-4 h-12 rounded-2xl border flex-row items-center justify-center"
           >
             <Ionicons name="navigate-outline" size={20} color={colors.teal} />
             <Text style={{ color: colors.text }} className="ml-2 font-body-bold">
               {language === 'fr' ? 'Voir l\'itinéraire' : 'Get Directions'}
             </Text>
           </TouchableOpacity>
         )}
       </View>
    </TouchableOpacity>
  );
}
