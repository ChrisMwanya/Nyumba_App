import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FiltersModal, {
  countActiveFilters,
  EMPTY_SELECTION,
  type FilterSelection,
} from '@/components/FiltersModal';
import PropertyCard from '@/components/PropertyCard';
import AnnonceSheet, { SHEET_SNAP_POINTS } from '@/components/map/AnnonceSheet';
import ExploreMap, { type ExploreMapHandle } from '@/components/map/ExploreMap';
import { getCategoryIcon } from '@/constants/categories';
import { CAMERA } from '@/constants/map';
import { FloatShadow, Tiles } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserLocation } from '@/hooks/useUserLocation';
import {
  getAnnonces,
  type Annonce,
  type Category,
} from '@/services/annonceService';
import { getCategories } from '@/services/categoryService';
import { distanceKm } from '@/utils/geo';

/** Ordre d'affichage par défaut des puces de catégorie. */
const CATEGORY_ORDER: string[] = [
  'airbnbs',
  'hotels',
  'restaurants',
  'coins-detente',
];

/**
 * La carte affiche tout ce qu'elle reçoit : on demande donc une page large
 * plutôt que les 10 annonces de l'ancienne liste paginée.
 */
const MAP_PAGE_SIZE = 100;

/** Rayons du filtre « autour de moi », en km. Un tap sur la pastille passe au suivant. */
const RADIUS_STEPS = [2, 5, 10, 20] as const;

type ViewMode = 'map' | 'list';
type Language = 'fr' | 'en';
type DayPeriod = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

/** Moment de la journée, d'après l'heure locale de l'appareil. */
function dayPeriodOf(hour: number): DayPeriod {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 14) return 'noon';
  if (hour >= 14 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'night';
}

/** Libellés de l'accueil. La bascule FR/EN de la barre du haut pilote ce choix. */
const LABELS = {
  fr: {
    searchPlaceholder: 'Dites-moi ce que vous cherchez',
    topRated: 'Les mieux notés',
    // Message d'accueil au-dessus de la recherche : la salutation précède le
    // prénom, la question invite à chercher ce qui convient à l'heure.
    greetings: {
      morning: {
        hello: 'Bonjour',
        emoji: '☀️',
        prompt: 'Par où commence-t-on la journée ?',
      },
      noon: {
        hello: 'Bon appétit',
        emoji: '🍽️',
        prompt: 'Une bonne table pour le déjeuner ?',
      },
      afternoon: {
        hello: 'Bon après-midi',
        emoji: '🌤️',
        prompt: 'Un coin détente pour souffler ?',
      },
      evening: {
        hello: 'Bonsoir',
        emoji: '🌙',
        prompt: 'Où sortez-vous ce soir ?',
      },
      night: {
        hello: 'Encore debout',
        emoji: '✨',
        prompt: 'Un endroit où passer la nuit ?',
      },
    },
    places: 'lieux',
    map: 'Carte',
    list: 'Liste',
    empty: 'Aucun résultat',
    emptyHint: 'Essayez de modifier vos filtres ou votre recherche.',
    all: 'Tous',
    noMatch: 'Aucun lieu ne correspond à votre recherche',
    noCoordinates:
      "Ces lieux n'ont pas encore de coordonnées : ils n'apparaissent que dans la vue Liste.",
    nothingToShow: 'Aucun lieu à afficher pour le moment',
    seeList: 'Voir la liste',
    nearbyOn: 'Autour de moi',
    noNearby: 'Aucun lieu dans ce rayon',
    widenRadius: 'Élargir',
    locationOffTitle: 'Position désactivée',
    locationOffBody:
      "Nyumba n'a pas accès à votre position, la carte ne peut donc pas vous situer ni trier les lieux par proximité. Vous pouvez l'autoriser dans les réglages.",
    openSettings: 'Ouvrir les réglages',
    cancel: 'Plus tard',
  },
  en: {
    searchPlaceholder: 'Tell me what you are looking for',
    topRated: 'Top rated',
    greetings: {
      morning: {
        hello: 'Good morning',
        emoji: '☀️',
        prompt: 'Where shall we start the day?',
      },
      noon: {
        hello: 'Enjoy your meal',
        emoji: '🍽️',
        prompt: 'A good table for lunch?',
      },
      afternoon: {
        hello: 'Good afternoon',
        emoji: '🌤️',
        prompt: 'A spot to unwind?',
      },
      evening: {
        hello: 'Good evening',
        emoji: '🌙',
        prompt: 'Where are you going out tonight?',
      },
      night: {
        hello: 'Still up',
        emoji: '✨',
        prompt: 'A place to spend the night?',
      },
    },
    places: 'places',
    map: 'Map',
    list: 'List',
    empty: 'No results',
    emptyHint: 'Try changing your filters or your search.',
    all: 'All',
    noMatch: 'No place matches your search',
    noCoordinates:
      'These places have no coordinates yet: they only show up in List view.',
    nothingToShow: 'Nothing to show yet',
    seeList: 'See the list',
    nearbyOn: 'Around me',
    noNearby: 'No place within this radius',
    widenRadius: 'Widen',
    locationOffTitle: 'Location off',
    locationOffBody:
      'Nyumba cannot access your location, so the map cannot centre on you or sort places by distance. You can allow it in Settings.',
    openSettings: 'Open Settings',
    cancel: 'Later',
  },
} as const;

export default function HomeScreen() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { colors } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { coords, permission, request } = useUserLocation();
  const map = useRef<ExploreMapHandle>(null);

  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [in3D, setIn3D] = useState(true);
  const [selected, setSelected] = useState<Annonce | null>(null);
  const [language, setLanguage] = useState<Language>('fr');
  // Filtre de proximité : éteint, toute la ville ; allumé, seulement `radiusKm`.
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(RADIUS_STEPS[1]);
  // Le bandeau (commandes + catégories) flotte au-dessus de la carte : la liste
  // doit réserver exactement sa hauteur, qui varie avec l'encoche de l'appareil.
  const [headerHeight, setHeaderHeight] = useState(140);
  // Même principe en bas pour le bloc message + recherche, mesuré depuis le
  // bord de l'écran : la barre d'onglets est comprise.
  const [searchDockHeight, setSearchDockHeight] = useState(tabBarHeight + 130);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [dayPeriod, setDayPeriod] = useState(() =>
    dayPeriodOf(new Date().getHours())
  );

  const t = LABELS[language];
  // Prénom seul : le nom complet déborde de la bulle sur un écran étroit.
  const firstName = user?.fullName?.trim().split(/\s+/)[0];
  const greeting = t.greetings[dayPeriod];

  // L'app peut rester ouverte d'un moment de la journée au suivant.
  useEffect(() => {
    const timer = setInterval(
      () => setDayPeriod(dayPeriodOf(new Date().getHours())),
      60_000
    );
    return () => clearInterval(timer);
  }, []);

  // Clavier ouvert, la recherche se pose juste au-dessus de lui : la barre
  // d'onglets, restée sous le clavier, n'a plus à être dégagée.
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(
      ios ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hide = Keyboard.addListener(
      ios ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const [selection, setSelection] = useState<FilterSelection>({
    ...EMPTY_SELECTION,
    cityId: preferences?.cityId ?? undefined,
  });
  const activeFilterCount = countActiveFilters(selection);

  const fetchData = useCallback(async () => {
    try {
      const [annoncesRes, categoriesRes] = await Promise.all([
        // La recherche texte est filtrée côté client (cf. `annonceService`) :
        // inutile de rappeler l'API à chaque frappe.
        // Les mieux notées d'abord : c'est l'ordre de la vue Liste, et si le
        // catalogue dépasse une page, ce sont elles qu'on garde.
        getAnnonces({
          page: 1,
          limit: MAP_PAGE_SIZE,
          sort: 'rating',
          cityId: selection.cityId,
          categoryId: selectedCategoryId ?? undefined,
        }),
        getCategories(),
      ]);

      setAnnonces(annoncesRes?.data ?? []);

      // Catégories choisies à l'onboarding en premier, puis l'ordre par défaut.
      const preferred = preferences?.categoryIds ?? [];
      const rank = (category: Category) => {
        const preferredIndex = preferred.indexOf(category.id);
        if (preferredIndex !== -1) return preferredIndex;
        const index = CATEGORY_ORDER.indexOf(category.slug);
        return (
          preferred.length + (index === -1 ? CATEGORY_ORDER.length : index)
        );
      };
      setCategories(
        [...(categoriesRes ?? [])].sort((a, b) => rank(a) - rank(b))
      );
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selection.cityId, selectedCategoryId, preferences]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Annonces filtrées par la recherche. La liste garde l'ordre de l'API (les
   * mieux notées d'abord) sauf avec « autour de moi » ; la carte les trie
   * toujours du plus proche au plus loin.
   */
  const visibleAnnonces = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    const matching = needle
      ? annonces.filter(annonce =>
          [
            annonce.title,
            annonce.description,
            annonce.address,
            annonce.ville?.name,
          ].some(field => field?.toLowerCase().includes(needle))
        )
      : annonces;

    const inPriceRange =
      selection.priceRanges.length > 0
        ? matching.filter(
            annonce =>
              annonce.priceRange !== undefined &&
              selection.priceRanges.includes(annonce.priceRange)
          )
        : matching;

    if (!coords) return inPriceRange;

    const withinRadius = nearbyOnly
      ? inPriceRange.filter(annonce => {
          if (
            annonce.latitude === undefined ||
            annonce.longitude === undefined
          ) {
            // Sans coordonnées, impossible d'affirmer que le lieu est proche.
            return false;
          }
          return (
            distanceKm(coords, {
              latitude: annonce.latitude,
              longitude: annonce.longitude,
            }) <= radiusKm
          );
        })
      : inPriceRange;

    // La liste ne quitte l'ordre des notes que pour « autour de moi », où la
    // proximité est justement ce qu'on cherche.
    if (viewMode === 'list' && !nearbyOnly) return withinRadius;

    return [...withinRadius].sort((a, b) => {
      const distanceA =
        a.latitude !== undefined && a.longitude !== undefined
          ? distanceKm(coords, { latitude: a.latitude, longitude: a.longitude })
          : Infinity;
      const distanceB =
        b.latitude !== undefined && b.longitude !== undefined
          ? distanceKm(coords, { latitude: b.latitude, longitude: b.longitude })
          : Infinity;
      return distanceA - distanceB;
    });
  }, [
    annonces,
    searchQuery,
    coords,
    nearbyOnly,
    radiusKm,
    selection.priceRanges,
    viewMode,
  ]);

  /** Seules les annonces géolocalisées peuvent être posées sur la carte. */
  const mappable = useMemo(
    () =>
      visibleAnnonces.filter(
        annonce =>
          annonce.latitude !== undefined && annonce.longitude !== undefined
      ),
    [visibleAnnonces]
  );

  // Sans ça, filtrer les épingles est invisible : les résultats restants
  // peuvent être hors champ et la carte semble simplement se vider.
  useEffect(() => {
    if (viewMode !== 'map' || !searchQuery.trim() || mappable.length === 0)
      return;
    map.current?.fitTo(
      mappable.map(annonce => ({
        latitude: annonce.latitude!,
        longitude: annonce.longitude!,
      })),
      { bottomPadding: searchDockHeight }
    );
  }, [mappable, searchQuery, viewMode, searchDockHeight]);

  const selectedDistance = useMemo(() => {
    if (!coords || !selected?.latitude || !selected?.longitude)
      return undefined;
    return distanceKm(coords, {
      latitude: selected.latitude,
      longitude: selected.longitude,
    });
  }, [coords, selected]);

  /**
   * Pourquoi la carte est vide. Sans ce message, une recherche sans résultat et
   * un jeu de données sans coordonnées sont indiscernables : dans les deux cas
   * l'utilisateur ne voit qu'une carte nue.
   */
  const emptyMapReason = useMemo(() => {
    if (loading || mappable.length > 0) return null;
    if (searchQuery.trim()) return t.noMatch;
    if (nearbyOnly) return t.noNearby;
    if (visibleAnnonces.length > 0) return t.noCoordinates;
    return t.nothingToShow;
  }, [
    loading,
    mappable.length,
    searchQuery,
    nearbyOnly,
    visibleAnnonces.length,
    t,
  ]);

  const handleSelect = useCallback(
    (annonce: Annonce | null) => {
      setSelected(annonce);
      if (!annonce?.latitude || !annonce?.longitude) return;
      // La fiche masque le bas de l'écran : on recadre au-dessus d'elle.
      map.current?.focusOn(
        { latitude: annonce.latitude, longitude: annonce.longitude },
        { bottomPadding: SHEET_SNAP_POINTS[0] + tabBarHeight }
      );
    },
    [tabBarHeight]
  );

  /** Allume / éteint le filtre de proximité. */
  const toggleNearby = useCallback(async () => {
    if (nearbyOnly) {
      setNearbyOnly(false);
      return;
    }

    // Une fois la permission refusée, iOS ne réaffiche plus jamais sa demande :
    // `request()` échouerait en silence. On renvoie donc vers les réglages.
    if (permission === 'denied') {
      Alert.alert(t.locationOffTitle, t.locationOffBody, [
        { text: t.cancel, style: 'cancel' },
        { text: t.openSettings, onPress: () => Linking.openSettings() },
      ]);
      return;
    }

    const next = coords ?? (await request());
    if (!next) return;
    setNearbyOnly(true);
    setSelected(null);
    map.current?.focusOn(next, { zoom: CAMERA.zoom });
  }, [coords, nearbyOnly, permission, request, t]);

  /** Passe au rayon suivant, en boucle. */
  const cycleRadius = useCallback(() => {
    setRadiusKm(current => {
      const index = RADIUS_STEPS.indexOf(
        current as (typeof RADIUS_STEPS)[number]
      );
      return RADIUS_STEPS[(index + 1) % RADIUS_STEPS.length];
    });
  }, []);

  const locationDenied = permission === 'denied';

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const applyFilters = (next: FilterSelection) => {
    setSelected(null);
    setSelection(next);
  };

  const selectCategory = (categoryId: string | null) => {
    setSelected(null);
    setSelectedCategoryId(categoryId);
  };

  /* ------------------------------------------------------------------ */
  /*  Rendu                                                              */
  /* ------------------------------------------------------------------ */

  const floatingButton = (
    icon: React.ComponentProps<typeof Ionicons>['name'],
    onPress: () => void,
    active = false
  ) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: active ? colors.cta : colors.surface,
        borderColor: active ? colors.cta : colors.border,
        ...FloatShadow,
      }}
      className="h-12 w-12 items-center justify-center rounded-full border"
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? colors.ctaText : colors.text}
      />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Couche de fond : carte en plein écran ou liste défilante */}
      {viewMode === 'map' ? (
        <ExploreMap
          ref={map}
          annonces={mappable}
          selectedId={selected?.id ?? null}
          onSelect={handleSelect}
          userCoords={coords}
          userLabel={language === 'fr' ? 'Vous' : 'You'}
          in3D={in3D}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: headerHeight + 16,
            paddingBottom: searchDockHeight + 24,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.teal}
              progressViewOffset={headerHeight}
            />
          }
        >
          <View className="mb-6 flex-row items-center justify-between">
            <Text
              style={{ color: colors.text, letterSpacing: -0.5 }}
              className="font-body-bold text-2xl"
            >
              {nearbyOnly ? t.nearbyOn : t.topRated}
            </Text>
            <Text style={{ color: colors.teal }} className="font-body-medium">
              {visibleAnnonces.length} {t.places}
            </Text>
          </View>

          {loading && !refreshing ? (
            <ActivityIndicator
              size="large"
              color={colors.teal}
              className="mt-20"
            />
          ) : visibleAnnonces.length > 0 ? (
            visibleAnnonces.map(annonce => (
              <PropertyCard
                key={annonce.id}
                annonce={annonce}
                language={language}
                distance={
                  coords &&
                  annonce.latitude !== undefined &&
                  annonce.longitude !== undefined
                    ? distanceKm(coords, {
                        latitude: annonce.latitude,
                        longitude: annonce.longitude,
                      })
                    : undefined
                }
              />
            ))
          ) : (
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
              className="items-center justify-center rounded-3xl border py-20"
            >
              <View
                style={{ backgroundColor: Tiles.sky }}
                className="mb-6 h-20 w-20 items-center justify-center rounded-full"
              >
                <Ionicons name="search-outline" size={36} color={colors.ink} />
              </View>
              <Text
                style={{ color: colors.text }}
                className="font-body-bold text-lg"
              >
                {nearbyOnly ? t.noNearby : t.empty}
              </Text>
              <Text
                style={{ color: colors.textMuted }}
                className="mt-2 px-10 text-center font-body"
              >
                {t.emptyHint}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Commandes et catégories, en surimpression sur la carte */}
      <SafeAreaView
        edges={['top']}
        pointerEvents="box-none"
        className="absolute inset-x-0 top-0"
        onLayout={event => setHeaderHeight(event.nativeEvent.layout.height)}
      >
        <View className="px-6 pt-2" pointerEvents="box-none">
          {/* Barre d'app : la bascule carte / liste, puis langue et
              notifications réunies dans une seule capsule. */}
          <View className="flex-row items-center justify-between">
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                ...FloatShadow,
              }}
              className="flex-row items-center rounded-full border p-1.5"
            >
              {(['map', 'list'] as ViewMode[]).map(current => {
                const isActive = viewMode === current;
                return (
                  <TouchableOpacity
                    key={current}
                    onPress={() => {
                      setViewMode(current);
                      setSelected(null);
                    }}
                    style={{
                      backgroundColor: isActive ? colors.cta : 'transparent',
                    }}
                    className="flex-row items-center rounded-full px-4 py-2"
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={current === 'map' ? 'map-outline' : 'list-outline'}
                      size={17}
                      color={isActive ? colors.ctaText : colors.textMuted}
                    />
                    <Text
                      style={{
                        color: isActive ? colors.ctaText : colors.textMuted,
                      }}
                      className="ml-2 font-body-bold text-xs"
                    >
                      {current === 'map' ? t.map : t.list}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                ...FloatShadow,
              }}
              className="flex-row items-center rounded-full border"
            >
              <TouchableOpacity
                onPress={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
                className="h-10 w-11 items-center justify-center"
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={
                  language === 'fr' ? 'Passer en anglais' : 'Switch to French'
                }
              >
                <Text
                  style={{ color: colors.text }}
                  className="font-body-bold text-[11px] tracking-wider"
                >
                  {language.toUpperCase()}
                </Text>
              </TouchableOpacity>

              <View
                style={{ backgroundColor: colors.border }}
                className="h-5 w-[1px]"
              />

              <TouchableOpacity
                className="h-10 w-11 items-center justify-center"
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
                <Ionicons
                  name="notifications-outline"
                  size={19}
                  color={colors.text}
                />
                <View
                  style={{
                    backgroundColor: colors.teal,
                    borderColor: colors.surface,
                  }}
                  className="absolute right-2.5 top-2 h-2 w-2 rounded-full border-2"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 14 }}
        >
          {[{ id: null, name: t.all, slug: '' }, ...categories].map(
            category => {
              const isActive = selectedCategoryId === category.id;
              return (
                <TouchableOpacity
                  key={category.id ?? 'all'}
                  onPress={() => selectCategory(category.id)}
                  style={{
                    backgroundColor: isActive ? colors.cta : colors.surface,
                    borderColor: isActive ? colors.cta : colors.border,
                    ...FloatShadow,
                  }}
                  className="mr-2 flex-row items-center rounded-full border px-4 py-2.5"
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={
                      category.id === null
                        ? 'apps-outline'
                        : getCategoryIcon(category.slug)
                    }
                    size={15}
                    color={isActive ? colors.ctaText : colors.text}
                  />
                  <Text
                    style={{ color: isActive ? colors.ctaText : colors.text }}
                    className="ml-2 font-body-semibold text-[13px]"
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Explication d'une carte vide */}
      {viewMode === 'map' && emptyMapReason && (
        <View
          className="absolute inset-x-0 items-center px-6"
          style={{ top: headerHeight + 8 }}
          pointerEvents="box-none"
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              ...FloatShadow,
            }}
            className="max-w-full flex-row items-center rounded-2xl border px-4 py-3"
          >
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.textMuted}
            />
            <Text
              style={{ color: colors.textSecondary }}
              className="ml-2 shrink font-body text-xs"
            >
              {emptyMapReason}
            </Text>
            {nearbyOnly &&
            radiusKm !== RADIUS_STEPS[RADIUS_STEPS.length - 1] ? (
              <TouchableOpacity
                onPress={cycleRadius}
                className="ml-3"
                hitSlop={8}
                activeOpacity={0.7}
              >
                <Text
                  style={{ color: colors.teal }}
                  className="font-body-bold text-xs"
                >
                  {t.widenRadius}
                </Text>
              </TouchableOpacity>
            ) : (
              visibleAnnonces.length > 0 && (
                <TouchableOpacity
                  onPress={() => setViewMode('list')}
                  className="ml-3"
                  hitSlop={8}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{ color: colors.teal }}
                    className="font-body-bold text-xs"
                  >
                    {t.seeList}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      )}

      {/* Commandes flottantes : la 3D ne concerne que la carte, « autour de
          moi » filtre aussi la liste. */}
      {!(viewMode === 'map' && selected) && (
        <View
          className="absolute right-6 items-end gap-3"
          style={{ bottom: searchDockHeight + 16 }}
          pointerEvents="box-none"
        >
          {viewMode === 'map' &&
            floatingButton(
              in3D ? 'cube' : 'cube-outline',
              () => setIn3D(value => !value),
              in3D
            )}
          <View className="flex-row items-center justify-end">
            {/* Le rayon ne s'affiche que si le filtre est allumé : il n'a aucun
                sens quand toute la ville est visible. */}
            {nearbyOnly && (
              <TouchableOpacity
                onPress={cycleRadius}
                activeOpacity={0.85}
                style={{
                  backgroundColor: colors.cta,
                  ...FloatShadow,
                }}
                className="mr-2 flex-row items-center rounded-full px-3.5 py-2"
                accessibilityRole="button"
                accessibilityLabel={`${t.nearbyOn} — ${radiusKm} km`}
              >
                <Text
                  style={{ color: colors.ctaText }}
                  className="font-body-bold text-xs"
                >
                  {visibleAnnonces.length} {t.places}
                </Text>
                <View
                  style={{ backgroundColor: colors.ctaText, opacity: 0.4 }}
                  className="mx-2 h-3 w-[1px]"
                />
                <Text
                  style={{ color: colors.ctaText }}
                  className="font-body-bold text-xs"
                >
                  {radiusKm} km
                </Text>
              </TouchableOpacity>
            )}

            {/* Libellé en toutes lettres : une icône seule ne disait pas que
                le bouton filtre les lieux proches. */}
            <TouchableOpacity
              onPress={toggleNearby}
              activeOpacity={0.85}
              style={{
                backgroundColor: nearbyOnly ? colors.cta : colors.surface,
                borderColor: nearbyOnly ? colors.cta : colors.border,
                ...FloatShadow,
              }}
              className="h-12 flex-row items-center rounded-full border pl-3.5 pr-4"
              accessibilityRole="button"
              accessibilityState={{ selected: nearbyOnly }}
              accessibilityLabel={t.nearbyOn}
            >
              <Ionicons
                name={locationDenied ? 'location-outline' : 'locate'}
                size={18}
                color={
                  nearbyOnly
                    ? colors.ctaText
                    : locationDenied
                      ? colors.warning
                      : colors.text
                }
              />
              <Text
                style={{ color: nearbyOnly ? colors.ctaText : colors.text }}
                className="ml-2 font-body-bold text-xs"
              >
                {t.nearbyOn}
              </Text>
              {/* Pastille d'alerte : la position est refusée, le bouton
                  renvoie vers les réglages. */}
              {locationDenied && (
                <View
                  style={{
                    backgroundColor: colors.warning,
                    borderColor: colors.surface,
                  }}
                  className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2"
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Message d'accueil et recherche, en bas : à portée de pouce. Masqués
          quand la fiche d'un lieu remonte, elle occupe le même espace. */}
      {!(viewMode === 'map' && selected) && (
        <KeyboardAvoidingView
          behavior="padding"
          pointerEvents="box-none"
          style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]}
        >
          <View
            className="px-6"
            pointerEvents="box-none"
            style={{ paddingBottom: (keyboardVisible ? 0 : tabBarHeight) + 12 }}
            onLayout={event =>
              setSearchDockHeight(event.nativeEvent.layout.height)
            }
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                ...FloatShadow,
              }}
              className="mb-2.5 max-w-[85%] self-start rounded-3xl border px-4 py-2.5"
            >
              <Text
                style={{ color: colors.textMuted }}
                className="font-body text-xs"
                numberOfLines={1}
              >
                {greeting.hello}
                {firstName ? ', ' : ' '}
                {firstName && (
                  <Text
                    style={{ color: colors.text }}
                    className="font-body-bold"
                  >
                    {firstName}{' '}
                  </Text>
                )}
                {greeting.emoji}
              </Text>
              <Text
                style={{ color: colors.text }}
                className="mt-0.5 font-body-bold text-sm"
              >
                {greeting.prompt}
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  ...FloatShadow,
                }}
                className="h-14 flex-1 flex-row items-center rounded-full border px-5"
              >
                <Ionicons name="search-outline" size={20} color={colors.icon} />
                <TextInput
                  style={{ color: colors.text }}
                  className="ml-3 h-14 flex-1 font-body"
                  placeholder={t.searchPlaceholder}
                  placeholderTextColor={colors.icon}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.icon}
                    />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setShowFilters(true)}
                style={{
                  backgroundColor: colors.cta,
                  ...FloatShadow,
                }}
                className="h-14 w-14 items-center justify-center rounded-full"
                activeOpacity={0.85}
              >
                <Ionicons
                  name="options-outline"
                  size={22}
                  color={colors.ctaText}
                />
                {/* Compteur : savoir que des filtres sont actifs sans ouvrir le
                    panneau — sinon une liste filtrée passe pour une liste vide. */}
                {activeFilterCount > 0 && (
                  <View
                    style={{
                      backgroundColor: colors.teal,
                      borderColor: colors.cta,
                    }}
                    className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full border-2"
                  >
                    <Text
                      style={{ color: colors.textInverse }}
                      className="font-body-bold text-[10px]"
                    >
                      {activeFilterCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      <AnnonceSheet
        annonce={viewMode === 'map' ? selected : null}
        onClose={() => setSelected(null)}
        distance={selectedDistance}
        bottomInset={tabBarHeight}
        language={language}
      />

      <FiltersModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={applyFilters}
        selection={selection}
      />
    </View>
  );
}
