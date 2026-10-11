import Button from '@/components/ui/Button';
import {
  CATEGORY_INK,
  getCategoryColor,
  getCategoryIcon,
} from '@/constants/categories';
import { Tiles, type TileName } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTheme, type ThemeMode } from '@/contexts/ThemeContext';
import type { Category, Ville } from '@/services/annonceService';
import { getCategories } from '@/services/categoryService';
import { getVilles } from '@/services/villeService';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type IconName = keyof typeof Ionicons.glyphMap;

// Pastille d'aplat en tête de chaque étape
const STEP_TILES: TileName[] = ['yellow', 'sky', 'lilac'];

const STEPS: { icon: IconName; title: string; subtitle: string }[] = [
  {
    icon: 'heart-outline',
    title: "Qu'est-ce qui vous intéresse ?",
    subtitle:
      'Restos, rooftops, hôtels… choisissez ce qui vous fait envie, on le mettra en avant sur votre accueil.',
  },
  {
    icon: 'location-outline',
    title: 'Dans quelle ville sortez-vous ?',
    subtitle: "On vous montrera d'abord les bons coins de cette ville.",
  },
  {
    icon: 'color-palette-outline',
    title: 'Choisissez votre apparence',
    subtitle: 'Vous pourrez la modifier à tout moment depuis votre profil.',
  },
];

const THEME_OPTIONS: {
  mode: ThemeMode;
  label: string;
  description: string;
  icon: IconName;
}[] = [
  {
    mode: 'light',
    label: 'Clair',
    description: 'Fond clair, idéal en journée',
    icon: 'sunny-outline',
  },
  {
    mode: 'dark',
    label: 'Sombre',
    description: 'Plus reposant le soir',
    icon: 'moon-outline',
  },
  {
    mode: 'system',
    label: 'Système',
    description: 'Suit le réglage du téléphone',
    icon: 'phone-portrait-outline',
  },
];

export default function OnboardingScreen() {
  // `edit=1` : ouvert depuis le profil pour modifier des préférences existantes
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEditing = edit === '1';
  const { user } = useAuth();
  const { preferences, savePreferences } = usePreferences();
  const { colors, mode, setMode } = useTheme();

  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [categoryIds, setCategoryIds] = useState<string[]>(
    preferences?.categoryIds ?? []
  );
  const [cityId, setCityId] = useState<string | null>(
    preferences?.cityId ?? null
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      getCategories().catch(() => [] as Category[]),
      getVilles().catch(() => [] as Ville[]),
    ])
      .then(([cats, cities]) => {
        setCategories(cats);
        setVilles(cities);
      })
      .finally(() => setLoadingOptions(false));
  }, []);

  const isLastStep = step === STEPS.length - 1;
  const current = STEPS[step];
  const firstName = user?.fullName?.split(' ')[0];

  const toggleCategory = (id: string) =>
    setCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );

  // Terminer comme passer enregistre les choix : l'onboarding ne s'affiche qu'une fois
  const finish = async () => {
    setSaving(true);
    try {
      await savePreferences({ categoryIds, cityId });
      // Première connexion : le layout racine redirige vers l'accueil
      if (isEditing) router.back();
    } catch {
      Alert.alert(
        'Erreur',
        "Impossible d'enregistrer vos préférences. Réessayez."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => (isEditing ? router.back() : finish());
  const handleNext = () => (isLastStep ? finish() : setStep(step + 1));

  const OptionRow = ({
    icon,
    label,
    description,
    selected,
    onPress,
  }: {
    icon: IconName;
    label: string;
    description?: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: selected ? colors.tealSoft : colors.surface,
        borderColor: selected ? colors.teal : colors.border,
      }}
      className="mb-3 flex-row items-center rounded-2xl border p-4"
    >
      <View
        style={{ backgroundColor: selected ? colors.teal : colors.muted }}
        className="h-11 w-11 items-center justify-center rounded-full"
      >
        <Ionicons
          name={icon}
          size={20}
          color={selected ? colors.textInverse : colors.icon}
        />
      </View>
      <View className="ml-4 flex-1">
        <Text
          style={{ color: colors.text }}
          className="font-body-bold text-base"
        >
          {label}
        </Text>
        {description && (
          <Text
            style={{ color: colors.textMuted }}
            className="mt-0.5 font-body text-xs"
          >
            {description}
          </Text>
        )}
      </View>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={selected ? colors.teal : colors.icon}
      />
    </TouchableOpacity>
  );

  const renderCategories = () => {
    if (categories.length === 0) {
      return (
        <Text
          style={{ color: colors.textMuted }}
          className="mt-6 text-center font-body"
        >
          Aucune catégorie disponible pour le moment. Vous pouvez passer cette
          étape.
        </Text>
      );
    }
    return (
      // Grille d'aplats de couleur, comme l'écran d'onboarding de la landing
      <View className="flex-row flex-wrap justify-between">
        {categories.map(category => {
          const selected = categoryIds.includes(category.id);
          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => toggleCategory(category.id)}
              activeOpacity={0.85}
              style={{
                backgroundColor: getCategoryColor(category.slug),
                opacity: selected ? 1 : 0.5,
                width: '48.5%',
              }}
              className="mb-3 h-24 justify-between rounded-3xl p-4"
            >
              <View className="flex-row items-start justify-between">
                <Ionicons
                  name={getCategoryIcon(category.slug)}
                  size={22}
                  color={CATEGORY_INK}
                />
                {selected && (
                  <View
                    style={{
                      backgroundColor: CATEGORY_INK,
                      borderColor: 'rgba(255,255,255,0.7)',
                    }}
                    className="h-6 w-6 items-center justify-center rounded-full border-4"
                  >
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text
                style={{ color: CATEGORY_INK }}
                className="font-body-bold text-base"
                numberOfLines={1}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderVilles = () => (
    <>
      <OptionRow
        icon="globe-outline"
        label="Toutes les villes"
        description="Découvrir les bons coins partout"
        selected={cityId === null}
        onPress={() => setCityId(null)}
      />
      {villes.map(ville => (
        <OptionRow
          key={ville.id}
          icon="business-outline"
          label={ville.name}
          description={ville.country}
          selected={cityId === ville.id}
          onPress={() => setCityId(ville.id)}
        />
      ))}
    </>
  );

  // Le thème s'applique immédiatement : l'utilisateur voit le résultat de son choix
  const renderTheme = () => (
    <>
      {THEME_OPTIONS.map(option => (
        <OptionRow
          key={option.mode}
          icon={option.icon}
          label={option.label}
          description={option.description}
          selected={mode === option.mode}
          onPress={() => setMode(option.mode)}
        />
      ))}
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Navigation */}
      <View className="h-16 flex-row items-center justify-between px-6 pt-4">
        {step > 0 ? (
          <TouchableOpacity
            onPress={() => setStep(step - 1)}
            style={{ backgroundColor: colors.muted }}
            className="h-10 w-10 items-center justify-center rounded-full"
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View className="h-10 w-10" />
        )}
        <TouchableOpacity onPress={handleSkip} disabled={saving}>
          <Text
            style={{ color: colors.textMuted }}
            className="font-body-medium text-sm"
          >
            {isEditing ? 'Annuler' : 'Passer'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progression */}
      <View className="mt-4 flex-row gap-2 px-6">
        {STEPS.map((_, index) => (
          <View
            key={index}
            style={{
              backgroundColor: index <= step ? colors.cta : colors.border,
            }}
            className="h-1.5 flex-1 rounded-full"
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{ backgroundColor: Tiles[STEP_TILES[step]] }}
          className="mb-6 h-16 w-16 items-center justify-center rounded-full"
        >
          <Ionicons name={current.icon} size={28} color={colors.ink} />
        </View>
        {step === 0 && !isEditing && (
          <Text
            style={{ color: colors.teal }}
            className="mb-2 font-body-bold text-sm"
          >
            Bienvenue{firstName ? `, ${firstName}` : ''} 👋
          </Text>
        )}
        <Text
          style={{ color: colors.text, letterSpacing: -0.8 }}
          className="mb-2 font-body-bold text-3xl"
        >
          {current.title}
        </Text>
        <Text
          style={{ color: colors.textMuted }}
          className="mb-8 font-body text-sm leading-6"
        >
          {current.subtitle}
        </Text>

        {step < 2 && loadingOptions ? (
          <ActivityIndicator color={colors.teal} className="mt-10" />
        ) : step === 0 ? (
          renderCategories()
        ) : step === 1 ? (
          renderVilles()
        ) : (
          renderTheme()
        )}
      </ScrollView>

      {/* Action principale */}
      <View
        style={{ borderTopColor: colors.border }}
        className="border-t px-6 py-5"
      >
        <Button
          title={isLastStep ? 'Terminer' : 'Continuer'}
          iconRight={isLastStep ? 'checkmark' : 'arrow-forward'}
          onPress={handleNext}
          loading={saving}
        />
      </View>
    </SafeAreaView>
  );
}
