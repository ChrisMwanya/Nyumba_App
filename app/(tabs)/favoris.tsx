import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PropertyCard from '@/components/PropertyCard';
import Button from '@/components/ui/Button';
import { Tiles } from '@/constants/theme';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function FavorisScreen() {
  const { colors } = useTheme();
  const { favorites, loading, refresh } = useFavorites();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={['top']}
    >
      <View className="px-6 pb-6 pt-4">
        <Text
          style={{ color: colors.text, letterSpacing: -0.8 }}
          className="mb-2 font-body-bold text-3xl"
        >
          Mes favoris
        </Text>
        <Text style={{ color: colors.textMuted }} className="font-body text-sm">
          Les bons coins que vous avez gardés sous le coude.
        </Text>
      </View>

      {loading && favorites.length === 0 && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <PropertyCard annonce={item} />}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 130,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.teal}
              colors={[colors.teal]}
            />
          }
          ListEmptyComponent={
            <View className="mt-16 items-center">
              <View
                style={{ backgroundColor: Tiles.coral }}
                className="mb-6 h-24 w-24 items-center justify-center rounded-full"
              >
                <Ionicons name="heart-outline" size={40} color={colors.ink} />
              </View>
              <Text
                style={{ color: colors.text }}
                className="mb-2 font-body-bold text-xl"
              >
                Aucun favori pour l&apos;instant
              </Text>
              <Text
                style={{ color: colors.textMuted }}
                className="mb-8 px-8 text-center font-body"
              >
                Touchez le cœur d&apos;une annonce pour la retrouver ici.
              </Text>
              <Button
                title="Explorer les bons coins"
                variant="outline"
                size="md"
                onPress={() => router.navigate('/(tabs)' as any)}
              />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
