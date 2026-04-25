import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ville } from '@/services/annonceService';
import { getVilles } from '@/services/villeService';

type FiltersModalProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  initialFilters: any;
};

export default function FiltersModal({ visible, onClose, onApply, initialFilters }: FiltersModalProps) {
  const [villes, setVilles] = useState<Ville[]>([]);
  const [minPrice, setMinPrice] = useState(initialFilters.min_price?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(initialFilters.max_price?.toString() || '');
  const [selectedVilleId, setSelectedVilleId] = useState<number | null>(initialFilters.ville_id || null);
  const [minRating, setMinRating] = useState(initialFilters.min_rating || 0);
  const [onlyAvailable, setOnlyAvailable] = useState(initialFilters.status === 'available');

  useEffect(() => {
    if (visible) {
      getVilles().then(setVilles).catch(console.error);
    }
  }, [visible]);

  const handleApply = () => {
    onApply({
      min_price: minPrice ? parseInt(minPrice) : undefined,
      max_price: maxPrice ? parseInt(maxPrice) : undefined,
      ville_id: selectedVilleId,
      min_rating: minRating || undefined,
      status: onlyAvailable ? 'available' : undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedVilleId(null);
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
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-dark-bg rounded-t-[40px] h-[85%] p-6">
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-white text-2xl font-body-bold">Filtres</Text>
            <TouchableOpacity onPress={onClose} className="bg-dark-surface p-2 rounded-full">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Price Range */}
            <View className="mb-8">
              <Text className="text-white text-lg font-body-bold mb-4">Prix (USD)</Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 bg-dark-surface rounded-2xl p-4 mr-2">
                  <Text className="text-gray-400 text-xs mb-1">Min</Text>
                  <TextInput
                    className="text-white font-body text-base"
                    placeholder="0"
                    placeholderTextColor="#4B5563"
                    keyboardType="numeric"
                    value={minPrice}
                    onChangeText={setMinPrice}
                  />
                </View>
                <View className="flex-1 bg-dark-surface rounded-2xl p-4 ml-2">
                  <Text className="text-gray-400 text-xs mb-1">Max</Text>
                  <TextInput
                    className="text-white font-body text-base"
                    placeholder="10000"
                    placeholderTextColor="#4B5563"
                    keyboardType="numeric"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                  />
                </View>
              </View>
            </View>

            {/* City Selection */}
            <View className="mb-8">
              <Text className="text-white text-lg font-body-bold mb-4">Ville</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  onPress={() => setSelectedVilleId(null)}
                  className={`mr-3 px-6 py-3 rounded-2xl border ${
                    selectedVilleId === null ? 'bg-dark-teal border-dark-teal' : 'bg-dark-surface border-white/5'
                  }`}
                >
                  <Text className={`font-body-medium ${selectedVilleId === null ? 'text-white' : 'text-gray-400'}`}>Toutes</Text>
                </TouchableOpacity>
                {villes.map((ville) => (
                  <TouchableOpacity
                    key={ville.id}
                    onPress={() => setSelectedVilleId(ville.id)}
                    className={`mr-3 px-6 py-3 rounded-2xl border ${
                      selectedVilleId === ville.id ? 'bg-dark-teal border-dark-teal' : 'bg-dark-surface border-white/5'
                    }`}
                  >
                    <Text className={`font-body-medium ${selectedVilleId === ville.id ? 'text-white' : 'text-gray-400'}`}>{ville.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Rating */}
            <View className="mb-8">
              <Text className="text-white text-lg font-body-bold mb-4">Note minimum</Text>
              <View className="flex-row justify-between">
                {[0, 1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setMinRating(star)}
                    className={`w-12 h-12 items-center justify-center rounded-xl ${
                      minRating === star ? 'bg-dark-teal' : 'bg-dark-surface'
                    }`}
                  >
                    <Text className={`font-body-bold ${minRating === star ? 'text-white' : 'text-gray-400'}`}>
                      {star === 0 ? 'All' : star}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Availability */}
            <View className="flex-row items-center justify-between mb-10 bg-dark-surface p-5 rounded-3xl">
              <View>
                <Text className="text-white text-lg font-body-bold">Disponibilité</Text>
                <Text className="text-gray-400 text-sm font-body">Afficher uniquement les biens disponibles</Text>
              </View>
              <Switch
                value={onlyAvailable}
                onValueChange={setOnlyAvailable}
                trackColor={{ false: '#374151', true: '#00BFA5' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </ScrollView>

          <View className="flex-row gap-4 mt-auto pb-6">
            <TouchableOpacity
              onPress={handleReset}
              className="flex-1 bg-dark-surface py-5 rounded-2xl items-center border border-white/5"
            >
              <Text className="text-white font-body-bold text-base">Réinitialiser</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleApply}
              className="flex-2 bg-dark-teal py-5 rounded-2xl items-center"
              style={{ flex: 2 }}
            >
              <Text className="text-white font-body-bold text-base">Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
