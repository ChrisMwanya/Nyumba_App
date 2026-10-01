import Button from '@/components/ui/Button';
import { Tiles } from '@/constants/theme';
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
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  BookingStatus,
  getMyReservations,
  Reservation,
} from '@/services/reservationService';
import { getAnnonceById, Annonce } from '@/services/annonceService';

const { height } = Dimensions.get('window');

// /bookings/me ne renvoie pas d'image pour le listing
const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800';

type FilterStatus = 'all' | BookingStatus;

export default function ReservationsScreen() {
  const { user, accessToken } = useAuth();
  const { colors } = useTheme();

  const STATUS_MAP: Record<
    string,
    { label: string; color: string; bgColor: string; icon: string }
  > = {
    // Pastilles en aplats, comme sur la landing (texte encre dans les deux modes)
    PENDING: {
      label: 'En attente',
      color: colors.ink,
      bgColor: Tiles.yellow,
      icon: 'time-outline',
    },
    CONFIRMED: {
      label: 'Confirmée',
      color: colors.ink,
      bgColor: Tiles.mint,
      icon: 'checkmark-circle-outline',
    },
    CANCELLED: {
      label: 'Annulée',
      color: colors.ink,
      bgColor: Tiles.coral,
      icon: 'close-circle-outline',
    },
    COMPLETED: {
      label: 'Terminée',
      color: colors.textSecondary,
      bgColor: colors.muted,
      icon: 'flag-outline',
    },
  };

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<
    Reservation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  // Selected reservation for the detailed drawer modal
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAnnonce, setSelectedAnnonce] = useState<Annonce | null>(null);
  const [loadingAnnonce, setLoadingAnnonce] = useState(false);

  const fetchReservations = useCallback(
    async (isRefresh = false) => {
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
    },
    [accessToken]
  );

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

  const formatDisplayDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatShortDateRange = (startStr: string, endStr: string | null) => {
    if (!endStr) return formatDisplayDate(startStr);
    try {
      const s = new Date(startStr);
      const e = new Date(endStr);
      const optionsDayMonth: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
      };
      const startF = s.toLocaleDateString('fr-FR', optionsDayMonth);
      const endF = e.toLocaleDateString('fr-FR', {
        ...optionsDayMonth,
        year: 'numeric',
      });
      return `${startF} au ${endF}`;
    } catch {
      return `${startStr} - ${endStr}`;
    }
  };

  const calculateNights = (startStr: string, endStr: string | null) => {
    if (!endStr) return 1;
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

  // Auth Gate check
  if (!user || !accessToken) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View className="flex-1 items-center justify-center px-6">
          <View
            style={{ backgroundColor: Tiles.lilac }}
            className="mb-8 h-24 w-24 items-center justify-center rounded-full"
          >
            <Ionicons name="lock-closed-outline" size={40} color={colors.ink} />
          </View>
          <Text
            style={{ color: colors.text }}
            className="mb-2 text-center font-body-bold text-2xl"
          >
            Connexion requise
          </Text>
          <Text
            style={{ color: colors.textMuted }}
            className="mb-8 px-6 text-center font-body"
          >
            Connectez-vous à votre compte Nyumba pour voir et gérer vos
            réservations.
          </Text>
          <Button
            title="Se connecter"
            className="w-full"
            onPress={() => router.replace('/(auth)/login' as any)}
          />
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
          backgroundColor: isActive ? colors.cta : colors.surface,
          borderColor: isActive ? colors.cta : colors.border,
        }}
        className="mr-2 rounded-full border px-5 py-2.5"
      >
        <Text
          style={{ color: isActive ? colors.ctaText : colors.text }}
          className="font-body-semibold text-sm"
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const getStatusBadge = (status: string) => {
    const mapped = STATUS_MAP[status] || {
      label: status,
      color: colors.textMuted,
      bgColor: colors.border,
      icon: 'help-circle-outline',
    };
    return (
      <View
        style={{ backgroundColor: mapped.bgColor }}
        className="flex-row items-center rounded-full px-3 py-1"
      >
        <Ionicons name={mapped.icon as any} size={14} color={mapped.color} />
        <Text
          style={{ color: mapped.color }}
          className="ml-1.5 font-body-semibold text-xs"
        >
          {mapped.label}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View className="px-6 pb-4 pt-8">
        <Text
          style={{ color: colors.text, letterSpacing: -0.8 }}
          className="mb-2 font-body-bold text-3xl"
        >
          Mes réservations
        </Text>
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
          {renderFilterButton('CONFIRMED', 'Confirmées')}
          {renderFilterButton('PENDING', 'En attente')}
          {renderFilterButton('CANCELLED', 'Annulées')}
          {renderFilterButton('COMPLETED', 'Terminées')}
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
          keyExtractor={item => item.id.toString()}
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
              <View
                style={{ backgroundColor: Tiles.sky }}
                className="mb-6 h-24 w-24 items-center justify-center rounded-full"
              >
                <Ionicons
                  name="calendar-outline"
                  size={40}
                  color={colors.ink}
                />
              </View>
              <Text
                style={{ color: colors.text }}
                className="mb-2 font-body-bold text-xl"
              >
                Aucune réservation
              </Text>
              <Text
                style={{ color: colors.textMuted }}
                className="mb-8 px-8 text-center font-body"
              >
                {activeFilter === 'all'
                  ? 'Vos réservations passées et à venir apparaîtront ici une fois confirmées.'
                  : `Aucune réservation correspondant au statut sélectionné.`}
              </Text>
              <Button
                title="Explorer les bons coins"
                variant="outline"
                size="md"
                onPress={() => router.replace('/(tabs)/' as any)}
              />
            </View>
          }
          renderItem={({ item }) => {
            const nights = calculateNights(item.startDate, item.endDate);

            return (
              <TouchableOpacity
                onPress={() => handleOpenDetails(item)}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
                className="mb-4 flex-row rounded-3xl border p-4"
              >
                {/* Cover Image */}
                <Image
                  source={{ uri: PLACEHOLDER_IMAGE }}
                  className="h-24 w-24 rounded-2xl"
                  style={{ backgroundColor: colors.skeleton }}
                />

                {/* Card details */}
                <View className="ml-4 flex-1 justify-between py-1">
                  <View>
                    <View className="mb-1.5 flex-row items-center">
                      {getStatusBadge(item.status)}
                    </View>
                    <Text
                      style={{ color: colors.text }}
                      className="font-body-bold text-base"
                      numberOfLines={1}
                    >
                      {item.annonce?.title || 'Hébergement Nyumba'}
                    </Text>
                    <Text
                      style={{ color: colors.textMuted }}
                      className="mt-1 font-body text-xs"
                    >
                      {formatShortDateRange(item.startDate, item.endDate)} ·{' '}
                      {nights} {nights > 1 ? 'nuits' : 'nuit'}
                    </Text>
                  </View>

                  <View className="mt-2 flex-row items-center justify-between">
                    <Text
                      style={{ color: colors.teal }}
                      className="font-body-medium text-xs"
                    >
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
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.bg, borderTopColor: colors.border },
            ]}
            className="rounded-t-3xl border-t"
          >
            {/* Grab handle */}
            <View
              style={{ backgroundColor: colors.border }}
              className="mx-auto my-4 h-1 w-12 rounded-full"
            />

            {selectedRes && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 24,
                  paddingBottom: 40,
                }}
              >
                {/* Title Section */}
                <View className="mb-6 flex-row items-center justify-between">
                  <Text
                    style={{ color: colors.text }}
                    className="font-body-bold text-2xl"
                  >
                    Détails de réservation
                  </Text>
                  {getStatusBadge(selectedRes.status)}
                </View>

                {/* Mini card */}
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                  className="mb-6 flex-row rounded-3xl border p-4"
                >
                  <Image
                    source={{
                      uri: selectedAnnonce?.images[0]?.url || PLACEHOLDER_IMAGE,
                    }}
                    className="h-20 w-20 rounded-2xl"
                    style={{ backgroundColor: colors.skeleton }}
                  />
                  <View className="ml-4 flex-1 justify-center">
                    <Text
                      style={{ color: colors.text }}
                      className="font-body-bold text-lg"
                      numberOfLines={1}
                    >
                      {selectedRes.annonce?.title || 'Hébergement Nyumba'}
                    </Text>
                    <Text
                      style={{ color: colors.textMuted }}
                      className="mt-1 font-body text-sm"
                    >
                      {selectedAnnonce?.address || 'Kinshasa'}
                    </Text>
                  </View>
                </View>

                {/* Recap of dates & guests */}
                <Text
                  style={{ color: colors.text }}
                  className="mb-4 font-body-bold text-base"
                >
                  Informations
                </Text>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                  className="mb-6 gap-4 rounded-3xl border p-5"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={colors.teal}
                      />
                      <Text
                        style={{ color: colors.textMuted }}
                        className="ml-3 font-body"
                      >
                        {"Date d'arrivée"}
                      </Text>
                    </View>
                    <Text
                      style={{ color: colors.text }}
                      className="font-body-medium"
                    >
                      {formatDisplayDate(selectedRes.startDate)}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={colors.teal}
                      />
                      <Text
                        style={{ color: colors.textMuted }}
                        className="ml-3 font-body"
                      >
                        Date de départ
                      </Text>
                    </View>
                    <Text
                      style={{ color: colors.text }}
                      className="font-body-medium"
                    >
                      {formatDisplayDate(selectedRes.endDate)}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons
                        name="people-outline"
                        size={18}
                        color={colors.teal}
                      />
                      <Text
                        style={{ color: colors.textMuted }}
                        className="ml-3 font-body"
                      >
                        Voyageurs
                      </Text>
                    </View>
                    <Text
                      style={{ color: colors.text }}
                      className="font-body-medium"
                    >
                      {selectedRes.guestsCount}{' '}
                      {selectedRes.guestsCount > 1 ? 'personnes' : 'personne'}
                    </Text>
                  </View>
                </View>

                {/* Host Section */}
                <Text
                  style={{ color: colors.text }}
                  className="mb-4 font-body-bold text-base"
                >
                  Hôte & Support
                </Text>
                {loadingAnnonce ? (
                  <View
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }}
                    className="mb-6 items-center rounded-3xl border p-6"
                  >
                    <ActivityIndicator size="small" color={colors.teal} />
                  </View>
                ) : selectedAnnonce ? (
                  <View
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }}
                    className="mb-6 rounded-3xl border p-5"
                  >
                    <View className="mb-4 flex-row items-center">
                      <Image
                        source={{
                          uri:
                            'https://ui-avatars.com/api/?name=' +
                            encodeURIComponent(
                              selectedAnnonce.owner?.fullName || 'Owner'
                            ) +
                            '&background=00806A&color=fff',
                        }}
                        className="h-12 w-12 rounded-full"
                        style={{ backgroundColor: colors.skeleton }}
                      />
                      <View className="ml-3 flex-1">
                        <Text
                          style={{ color: colors.text }}
                          className="font-body-bold text-base"
                        >
                          {selectedAnnonce.owner?.fullName || 'Propriétaire'}
                        </Text>
                        <Text
                          style={{ color: colors.textMuted }}
                          className="font-body text-xs capitalize"
                        >
                          Hôte
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }}
                    className="mb-6 items-center justify-center rounded-3xl border p-5"
                  >
                    <Text
                      style={{ color: colors.textMuted }}
                      className="font-body text-xs"
                    >
                      {"Infos de l'hôte indisponibles"}
                    </Text>
                  </View>
                )}

                <Button
                  title="Fermer"
                  variant="outline"
                  className="mt-2 w-full"
                  onPress={handleCloseDetails}
                />
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
    backgroundColor: 'rgba(11, 15, 26, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: height * 0.85,
    minHeight: height * 0.5,
    width: '100%',
  },
});
