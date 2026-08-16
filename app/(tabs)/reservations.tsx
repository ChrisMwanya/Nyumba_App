import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  RefreshControl, 
  Modal, 
  ScrollView, 
  Linking, 
  Alert,
  Dimensions,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getMyReservations, Reservation } from '@/services/reservationService';
import { getAnnonceById, Annonce } from '@/services/annonceService';

const { height } = Dimensions.get('window');

type FilterStatus = 'all' | 'confirmee' | 'en_attente_paiement' | 'annulee';

export default function ReservationsScreen() {
  const { user, accessToken } = useAuth();
  const { colors } = useTheme();
  
  const STATUS_MAP: Record<string, { label: string, color: string, bgColor: string, icon: string }> = {
    'en_attente_paiement': { label: 'En attente', color: colors.warning, bgColor: 'rgba(255, 159, 10, 0.1)', icon: 'time-outline' },
    'confirmee': { label: 'Confirmée', color: colors.success, bgColor: colors.tealSoft, icon: 'checkmark-circle-outline' },
    'annulee': { label: 'Annulée', color: colors.error, bgColor: colors.errorSoft, icon: 'close-circle-outline' },
    'cancelled': { label: 'Annulée', color: colors.error, bgColor: colors.errorSoft, icon: 'close-circle-outline' },
  };

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  
  // Selected reservation for the detailed drawer modal
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAnnonce, setSelectedAnnonce] = useState<Annonce | null>(null);
  const [loadingAnnonce, setLoadingAnnonce] = useState(false);

  const fetchReservations = useCallback(async (isRefresh = false) => {
    if (!accessToken) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getMyReservations(accessToken);
      setReservations(data);
    } catch (error) {
      console.error('Fetch reservations error:', error);
      Alert.alert('Erreur', 'Impossible de charger vos réservations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  // Load reservations when the screen is focused
  useFocusEffect(
    useCallback(() => {
      if (accessToken) {
        fetchReservations();
      }
    }, [accessToken, fetchReservations])
  );

  // Apply filters whenever the reservations list or active filter changes
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredReservations(reservations);
    } else {
      setFilteredReservations(
        reservations.filter(res => res.status === activeFilter)
      );
    }
  }, [reservations, activeFilter]);

  const handleOpenDetails = async (res: Reservation) => {
    setSelectedRes(res);
    setModalVisible(true);
    setLoadingAnnonce(true);
    setSelectedAnnonce(null);

    try {
      const details = await getAnnonceById(res.annonceId);
      setSelectedAnnonce(details);
    } catch (error) {
      console.error('Error fetching annonce detailed details:', error);
    } finally {
      setLoadingAnnonce(false);
    }
  };

  const handleCloseDetails = () => {
    setModalVisible(false);
    setSelectedRes(null);
    setSelectedAnnonce(null);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatShortDateRange = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return '';
    try {
      const s = new Date(startStr);
      const e = new Date(endStr);
      const optionsDayMonth: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
      const startF = s.toLocaleDateString('fr-FR', optionsDayMonth);
      const endF = e.toLocaleDateString('fr-FR', { ...optionsDayMonth, year: 'numeric' });
      return `${startF} au ${endF}`;
    } catch {
      return `${startStr} - ${endStr}`;
    }
  };

  const calculateNights = (startStr: string, endStr: string) => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const diff = end.getTime() - start.getTime();
      const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return nights > 0 ? nights : 1;
    } catch {
      return 1;
    }
  };

  const handlePayNow = (res: Reservation) => {
    setModalVisible(false);
    router.push({
      pathname: '/annonces/payment',
      params: {
        annonce_id: res.annonceId,
        start_date: res.startDate.split('T')[0],
        end_date: res.endDate.split('T')[0],
        guests_count: res.guestsCount,
        total: res.totalAmount,
        currency: res.annonce?.currency || 'USD',
        title: res.annonce?.title || 'Hébergement'
      }
    } as any);
  };

  const handleCall = () => {
    if (selectedAnnonce?.annonceur?.phone) {
      Linking.openURL(`tel:${selectedAnnonce.annonceur.phone}`);
    } else {
      Alert.alert('Indisponible', "Le numéro de l'annonceur n'est pas renseigné.");
    }
  };

  const handleWhatsApp = () => {
    if (selectedAnnonce?.annonceur?.phone) {
      const message = `Bonjour, je vous contacte concernant ma réservation pour "${selectedAnnonce.title}" sur Nyumba.`;
      Linking.openURL(`whatsapp://send?phone=${selectedAnnonce.annonceur.phone}&text=${encodeURIComponent(message)}`);
    } else {
      Alert.alert('Indisponible', "Le numéro de l'annonceur n'est pas renseigné.");
    }
  };

  // Auth Gate check
  if (!user || !accessToken) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View className="flex-1 px-6 justify-center items-center">
          <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="w-24 h-24 rounded-full items-center justify-center mb-8 border">
            <Ionicons name="lock-closed-outline" size={48} color={colors.teal} />
          </View>
          <Text style={{ color: colors.text }} className="text-2xl font-body-bold text-center mb-2">Connexion requise</Text>
          <Text style={{ color: colors.textMuted }} className="font-body text-center mb-8 px-6">
            Connectez-vous à votre compte Nyumba pour voir et gérer vos réservations.
          </Text>
          <TouchableOpacity 
            onPress={() => router.replace('/(auth)/login' as any)}
            style={{ backgroundColor: colors.teal }}
            className="px-8 h-14 rounded-2xl items-center justify-center w-full"
          >
            <Text className="text-white font-body-bold text-lg">Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderFilterButton = (filter: FilterStatus, label: string) => {
    const isActive = activeFilter === filter;
    return (
      <TouchableOpacity 
        onPress={() => setActiveFilter(filter)}
        style={{
          backgroundColor: isActive ? colors.tealSoft : colors.surface,
          borderColor: isActive ? colors.teal : colors.border,
        }}
        className="px-6 py-3 rounded-full mr-2 border"
      >
        <Text style={{ color: isActive ? colors.teal : colors.textMuted }} className={`font-body-medium text-sm ${isActive ? 'font-body-bold' : ''}`}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const getStatusBadge = (status: string) => {
    const mapped = STATUS_MAP[status] || { label: status, color: colors.textMuted, bgColor: colors.border, icon: 'help-circle-outline' };
    return (
      <View style={{ backgroundColor: mapped.bgColor }} className="flex-row items-center px-3 py-1 rounded-full">
        <Ionicons name={mapped.icon as any} size={14} color={mapped.color} />
        <Text style={{ color: mapped.color }} className="text-xs font-body-bold ml-1.5">{mapped.label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View className="px-6 pt-8 pb-4">
        <Text style={{ color: colors.text }} className="text-3xl font-body-bold mb-2">Mes Réservations</Text>
        <Text style={{ color: colors.textMuted }} className="font-body text-sm">
          Retrouvez ici toutes vos réservations passées et à venir.
        </Text>
      </View>

      {/* Status Filter Row */}
      <View className="mb-6">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingHorizontal: 24 }}
        >
          {renderFilterButton('all', 'Toutes')}
          {renderFilterButton('confirmee', 'Confirmées')}
          {renderFilterButton('en_attente_paiement', 'En attente')}
          {renderFilterButton('annulee', 'Annulées')}
        </ScrollView>
      </View>

      {/* Loading state */}
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      ) : (
        <FlatList
          data={filteredReservations}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => fetchReservations(true)} 
              colors={[colors.teal]}
              tintColor={colors.teal}
            />
          }
          ListEmptyComponent={
            <View className="mt-20 items-center justify-center">
              <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="w-24 h-24 rounded-full items-center justify-center mb-6 border">
                <Ionicons name="calendar-outline" size={48} color={colors.icon} />
              </View>
              <Text style={{ color: colors.text }} className="text-xl font-body-bold mb-2">Aucune réservation</Text>
              <Text style={{ color: colors.textMuted }} className="font-body text-center px-8 mb-8">
                {activeFilter === 'all' 
                  ? 'Vos réservations passées et à venir apparaîtront ici une fois confirmées.'
                  : `Aucune réservation correspondant au statut sélectionné.`
                }
              </Text>
              <TouchableOpacity 
                onPress={() => router.replace('/(tabs)/' as any)}
                style={{ backgroundColor: colors.border, borderColor: colors.border }}
                className="px-6 py-3.5 rounded-2xl border"
              >
                <Text style={{ color: colors.text }} className="font-body-bold">Explorer les hébergements</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const nights = calculateNights(item.startDate, item.endDate);
            const isPendingPayment = item.status === 'en_attente_paiement';
            
            return (
              <TouchableOpacity 
                onPress={() => handleOpenDetails(item)}
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                className="p-4 rounded-3xl mb-4 border flex-row"
              >
                {/* Cover Image */}
                <Image 
                  source={{ uri: item.annonce?.coverImageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800' }} 
                  className="w-24 h-24 rounded-2xl"
                  style={{ backgroundColor: colors.skeleton }}
                />

                {/* Card details */}
                <View className="ml-4 flex-1 justify-between py-1">
                  <View>
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text style={{ color: colors.textMuted }} className="text-[10px] font-body uppercase tracking-wider">PROPRIÉTÉ</Text>
                      {getStatusBadge(item.status)}
                    </View>
                    <Text style={{ color: colors.text }} className="font-body-bold text-base" numberOfLines={1}>
                      {item.annonce?.title || 'Hébergement Nyumba'}
                    </Text>
                    <Text style={{ color: colors.textMuted }} className="font-body text-xs mt-1">
                      {formatShortDateRange(item.startDate, item.endDate)} · {nights} {nights > 1 ? 'nuits' : 'nuit'}
                    </Text>
                  </View>
                  
                  <View className="flex-row items-center justify-between mt-2">
                    <Text style={{ color: colors.teal }} className="font-body-medium text-xs">
                      Réservation enregistrée
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Reservation Details Drawer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseDetails}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={handleCloseDetails} 
          />
          <View style={[styles.modalContent, { backgroundColor: colors.bg, borderTopColor: colors.border }]} className="border-t rounded-t-[40px]">
            {/* Grab handle */}
            <View style={{ backgroundColor: colors.border }} className="w-12 h-1 rounded-full my-4 mx-auto" />

            {selectedRes && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
                {/* Title Section */}
                <View className="flex-row items-center justify-between mb-6">
                  <Text style={{ color: colors.text }} className="text-2xl font-body-bold">Détails de réservation</Text>
                  {getStatusBadge(selectedRes.status)}
                </View>

                {/* Mini card */}
                <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="flex-row p-4 rounded-3xl border mb-6">
                  <Image 
                    source={{ uri: selectedRes.annonce?.coverImageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800' }} 
                    className="w-20 h-20 rounded-2xl"
                    style={{ backgroundColor: colors.skeleton }}
                  />
                  <View className="ml-4 justify-center flex-1">
                    <Text style={{ color: colors.text }} className="font-body-bold text-lg" numberOfLines={1}>
                      {selectedRes.annonce?.title || 'Hébergement Nyumba'}
                    </Text>
                    <Text style={{ color: colors.textMuted }} className="font-body text-sm mt-1">
                      {selectedRes.annonce?.address || 'Kinshasa'}
                    </Text>
                  </View>
                </View>

                {/* Recap of dates & guests */}
                <Text style={{ color: colors.text }} className="text-base font-body-bold mb-4">Informations</Text>
                <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="p-5 rounded-3xl border mb-6 gap-4">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={18} color={colors.teal} />
                      <Text style={{ color: colors.textMuted }} className="font-body ml-3">{"Date d'arrivée"}</Text>
                    </View>
                    <Text style={{ color: colors.text }} className="font-body-medium">{formatDisplayDate(selectedRes.startDate)}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={18} color={colors.teal} />
                      <Text style={{ color: colors.textMuted }} className="font-body ml-3">Date de départ</Text>
                    </View>
                    <Text style={{ color: colors.text }} className="font-body-medium">{formatDisplayDate(selectedRes.endDate)}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Ionicons name="people-outline" size={18} color={colors.teal} />
                      <Text style={{ color: colors.textMuted }} className="font-body ml-3">Voyageurs</Text>
                    </View>
                    <Text style={{ color: colors.text }} className="font-body-medium">
                      {selectedRes.guestsCount} {selectedRes.guestsCount > 1 ? 'personnes' : 'personne'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Ionicons name="bookmark-outline" size={18} color={colors.teal} />
                      <Text style={{ color: colors.textMuted }} className="font-body ml-3">Type</Text>
                    </View>
                    <Text style={{ color: colors.text }} className="font-body-medium capitalize">{selectedRes.typeReservation || 'standard'}</Text>
                  </View>
                </View>


                {/* Host Section */}
                <Text style={{ color: colors.text }} className="text-base font-body-bold mb-4">Hôte & Support</Text>
                {loadingAnnonce ? (
                  <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="p-6 rounded-3xl border mb-6 items-center">
                    <ActivityIndicator size="small" color={colors.teal} />
                  </View>
                ) : selectedAnnonce ? (
                  <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="p-5 rounded-3xl border mb-6">
                    <View className="flex-row items-center mb-4">
                      <Image 
                        source={{ uri: selectedAnnonce.annonceur?.logoUrl || 'https://ui-avatars.com/api/?name=' + (selectedAnnonce.annonceur?.name || 'Owner') + '&background=00BFA5&color=fff' }} 
                        className="w-12 h-12 rounded-xl"
                        style={{ backgroundColor: colors.skeleton }}
                      />
                      <View className="ml-3 flex-1">
                        <Text style={{ color: colors.text }} className="font-body-bold text-base">
                          {selectedAnnonce.annonceur?.name || 'Propriétaire'}
                        </Text>
                        <Text style={{ color: colors.textMuted }} className="font-body text-xs capitalize">
                          {selectedAnnonce.annonceur?.type === 'agence' ? 'Agence Immobilière' : 'Hôte Particulier'}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-row gap-3">
                      <TouchableOpacity 
                        onPress={handleCall}
                        style={{ backgroundColor: colors.border, borderColor: colors.border }}
                        className="flex-1 h-12 rounded-2xl flex-row items-center justify-center border"
                      >
                        <Ionicons name="call-outline" size={18} color={colors.text} />
                        <Text style={{ color: colors.text }} className="font-body-bold ml-2 text-sm">Appeler</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={handleWhatsApp}
                        style={{ backgroundColor: colors.whatsappSoft, borderColor: colors.whatsappBorder }}
                        className="flex-1 h-12 rounded-2xl flex-row items-center justify-center border"
                      >
                        <Ionicons name="logo-whatsapp" size={18} color={colors.whatsapp} />
                        <Text style={{ color: colors.whatsapp }} className="font-body-bold ml-2 text-sm">WhatsApp</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="p-5 rounded-3xl border mb-6 justify-center items-center">
                    <Text style={{ color: colors.textMuted }} className="font-body text-xs">{"Infos de l'hôte indisponibles"}</Text>
                  </View>
                )}

                <TouchableOpacity 
                  onPress={handleCloseDetails}
                  style={{ backgroundColor: colors.border, borderColor: colors.border }}
                  className="h-16 rounded-[20px] items-center justify-center w-full mt-2 border"
                >
                  <Text style={{ color: colors.text }} className="font-body-bold text-base">Fermer</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: height * 0.85,
    minHeight: height * 0.5,
    width: '100%',
  },
});
