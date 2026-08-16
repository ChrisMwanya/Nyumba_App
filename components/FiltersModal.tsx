import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Switch,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Ville } from '@/services/annonceService';
import { getVilles } from '@/services/villeService';
import { getCommunes, Commune } from '@/services/communeService';

type FiltersModalProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  initialFilters: any;
};

export default function FiltersModal({ visible, onClose, onApply, initialFilters }: FiltersModalProps) {
  const { colors } = useTheme();
  const [villes, setVilles] = useState<Ville[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  
  const [minPrice, setMinPrice] = useState(initialFilters.min_price?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(initialFilters.max_price?.toString() || '');
  const [selectedVilleId, setSelectedVilleId] = useState<number | null>(initialFilters.ville_id || null);
  const [selectedCommuneId, setSelectedCommuneId] = useState<number | null>(initialFilters.commune_id || null);
  const [minRating, setMinRating] = useState(initialFilters.min_rating || 0);
  const [onlyAvailable, setOnlyAvailable] = useState(initialFilters.status === 'available');

  useEffect(() => {
    if (visible) {
      getVilles().then(setVilles).catch(console.error);
    }
  }, [visible]);

  useEffect(() => {
    if (selectedVilleId) {
      setLoadingCommunes(true);
      getCommunes(selectedVilleId)
        .then(setCommunes)
        .catch(console.error)
        .finally(() => setLoadingCommunes(false));
    } else {
      setCommunes([]);
      setSelectedCommuneId(null);
    }
  }, [selectedVilleId]);

  const handleApply = () => {
    onApply({
      min_price: minPrice ? parseInt(minPrice) : undefined,
      max_price: maxPrice ? parseInt(maxPrice) : undefined,
      ville_id: selectedVilleId,
      commune_id: selectedCommuneId,
      min_rating: minRating || undefined,
      status: onlyAvailable ? 'available' : undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedVilleId(null);
    setSelectedCommuneId(null);
    setMinRating(0);
    setOnlyAvailable(true);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.modalOverlay }}>
        <View style={{ backgroundColor: colors.bg }} className="rounded-t-[40px] h-[85%] p-6">
          <View className="flex-row justify-between items-center mb-8">
            <Text style={{ color: colors.text }} className="text-2xl font-body-bold">Filtres</Text>
            <TouchableOpacity onPress={onClose} style={{ backgroundColor: colors.surface }} className="p-2 rounded-full">
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Price Range */}
            <View className="mb-8">
              <Text style={{ color: colors.text }} className="text-lg font-body-bold mb-4">Prix (USD)</Text>
              <View className="flex-row items-center justify-between">
                <View style={{ backgroundColor: colors.surface }} className="flex-1 rounded-2xl p-4 mr-2">
                  <Text style={{ color: colors.textMuted }} className="text-xs mb-1">Min</Text>
                  <TextInput
                    style={{ color: colors.text }}
                    className="font-body text-base"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={minPrice}
                    onChangeText={setMinPrice}
                  />
                </View>
                <View style={{ backgroundColor: colors.surface }} className="flex-1 rounded-2xl p-4 ml-2">
                  <Text style={{ color: colors.textMuted }} className="text-xs mb-1">Max</Text>
                  <TextInput
                    style={{ color: colors.text }}
                    className="font-body text-base"
                    placeholder="10000"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                  />
                </View>
              </View>
            </View>

            {/* City Selection */}
            <View className="mb-8">
              <Text style={{ color: colors.text }} className="text-lg font-body-bold mb-4">Ville</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  onPress={() => setSelectedVilleId(null)}
                  style={{
                    backgroundColor: selectedVilleId === null ? colors.teal : colors.surface,
                    borderColor: selectedVilleId === null ? colors.teal : colors.border,
                  }}
                  className="mr-3 px-6 py-3 rounded-2xl border"
                >
                  <Text style={{ color: selectedVilleId === null ? 'white' : colors.textMuted }} className="font-body-medium">Toutes</Text>
                </TouchableOpacity>
                {villes.map((ville) => (
                  <TouchableOpacity
                    key={ville.id}
                    onPress={() => setSelectedVilleId(ville.id)}
                    style={{
                      backgroundColor: selectedVilleId === ville.id ? colors.teal : colors.surface,
                      borderColor: selectedVilleId === ville.id ? colors.teal : colors.border,
                    }}
                    className="mr-3 px-6 py-3 rounded-2xl border"
                  >
                    <Text style={{ color: selectedVilleId === ville.id ? 'white' : colors.textMuted }} className="font-body-medium">{ville.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Commune Selection (Visible only if Ville is selected) */}
            {selectedVilleId && (
              <View className="mb-8">
                <Text style={{ color: colors.text }} className="text-lg font-body-bold mb-4">Commune</Text>
                {loadingCommunes ? (
                  <ActivityIndicator color={colors.teal} />
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                      onPress={() => setSelectedCommuneId(null)}
                      style={{
                        backgroundColor: selectedCommuneId === null ? colors.teal : colors.surface,
                        borderColor: selectedCommuneId === null ? colors.teal : colors.border,
                      }}
                      className="mr-3 px-6 py-3 rounded-2xl border"
                    >
                      <Text style={{ color: selectedCommuneId === null ? 'white' : colors.textMuted }} className="font-body-medium">Toutes</Text>
                    </TouchableOpacity>
                    {communes.map((commune) => (
                      <TouchableOpacity
                        key={commune.id}
                        onPress={() => setSelectedCommuneId(commune.id)}
                        style={{
                          backgroundColor: selectedCommuneId === commune.id ? colors.teal : colors.surface,
                          borderColor: selectedCommuneId === commune.id ? colors.teal : colors.border,
                        }}
                        className="mr-3 px-6 py-3 rounded-2xl border"
                      >
                        <Text style={{ color: selectedCommuneId === commune.id ? 'white' : colors.textMuted }} className="font-body-medium">{commune.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Rating */}
            <View className="mb-8">
              <Text style={{ color: colors.text }} className="text-lg font-body-bold mb-4">Note minimum</Text>
              <View className="flex-row justify-between">
                {[0, 1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setMinRating(star)}
                    style={{ backgroundColor: minRating === star ? colors.teal : colors.surface }}
                    className="w-12 h-12 items-center justify-center rounded-xl"
                  >
                    <Text style={{ color: minRating === star ? 'white' : colors.textMuted }} className="font-body-bold">
                      {star === 0 ? 'All' : star}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Availability */}
            <View style={{ backgroundColor: colors.surface }} className="flex-row items-center justify-between mb-10 p-5 rounded-3xl">
              <View>
                <Text style={{ color: colors.text }} className="text-lg font-body-bold">Disponibilité</Text>
                <Text style={{ color: colors.textMuted }} className="text-sm font-body">Afficher uniquement les biens disponibles</Text>
              </View>
              <Switch
                value={onlyAvailable}
                onValueChange={setOnlyAvailable}
                trackColor={{ false: colors.skeleton, true: colors.teal }}
                thumbColor="#FFFFFF"
              />
            </View>
          </ScrollView>

          <View className="flex-row gap-4 mt-auto pb-6">
            <TouchableOpacity
              onPress={handleReset}
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              className="flex-1 py-5 rounded-2xl items-center border"
            >
              <Text style={{ color: colors.text }} className="font-body-bold text-base">Réinitialiser</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleApply}
              style={{ backgroundColor: colors.teal, flex: 2 }}
              className="py-5 rounded-2xl items-center"
            >
              <Text className="text-white font-body-bold text-base">Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
