import Button from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/contexts/ThemeContext';
import type { Ville } from '@/services/annonceService';
import { getVilles } from '@/services/villeService';

/** Gammes de prix telles que l'API les stocke (champ libre `priceRange`). */
export const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'] as const;

const PRICE_HINTS: Record<string, string> = {
  $: 'Petit budget',
  $$: 'Abordable',
  $$$: 'Haut de gamme',
  $$$$: 'Luxe',
};

export type FilterSelection = {
  /** `undefined` = toutes les villes. */
  cityId?: string;
  /** Vide = toutes les gammes. */
  priceRanges: string[];
  /** Budget total du groupe, en dollars. `undefined` = pas de limite. */
  budget?: number;
  /** Nombre de personnes qui se partagent le budget. */
  people: number;
};

export const EMPTY_SELECTION: FilterSelection = { priceRanges: [], people: 1 };

const MAX_PEOPLE = 50;

/** Nombre de critères actifs — sert à marquer le bouton Filtres de l'accueil. */
export const countActiveFilters = (selection: FilterSelection): number =>
  (selection.cityId ? 1 : 0) +
  (selection.priceRanges.length > 0 ? 1 : 0) +
  (selection.budget ? 1 : 0);

type FiltersModalProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (selection: FilterSelection) => void;
  selection: FilterSelection;
};

/**
 * Panneau de filtres.
 *
 * La ville et le budget sont filtrés par l'API : avec un budget et un nombre de
 * personnes, elle ne renvoie que les lieux accessibles pour la somme disponible
 * par personne. La gamme de prix l'est côté client, sur les annonces déjà
 * chargées — l'API n'expose pas ce critère. Les autres (note,
 * commune, disponibilité) restent absents tant qu'elle ne les gère pas : mieux
 * vaut un panneau court et honnête que des contrôles sans effet.
 */
export default function FiltersModal({
  visible,
  onClose,
  onApply,
  selection,
}: FiltersModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [villes, setVilles] = useState<Ville[]>([]);
  const [loadingVilles, setLoadingVilles] = useState(false);
  const [draft, setDraft] = useState<FilterSelection>(selection);

  useEffect(() => {
    if (!visible) return;

    // Repart de la sélection appliquée : sans ça, rouvrir le panneau après un
    // changement afficherait l'état de la session précédente.
    setDraft(selection);

    if (villes.length === 0) {
      setLoadingVilles(true);
      getVilles()
        .then(setVilles)
        .catch(console.error)
        .finally(() => setLoadingVilles(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const togglePrice = (price: string) => {
    setDraft(current => ({
      ...current,
      priceRanges: current.priceRanges.includes(price)
        ? current.priceRanges.filter(item => item !== price)
        : [...current.priceRanges, price],
    }));
  };

  const setPeople = (people: number) =>
    setDraft(current => ({
      ...current,
      people: Math.min(MAX_PEOPLE, Math.max(1, people)),
    }));

  const activeCount = countActiveFilters(draft);

  /* ---------------------------------------------------------------- */

  const sectionTitle = (title: string, hint?: string) => (
    <View className="mb-3 flex-row items-baseline justify-between">
      <Text
        style={{ color: colors.textMuted }}
        className="font-body-semibold text-sm"
      >
        {title}
      </Text>
      {hint && (
        <Text
          style={{ color: colors.textMuted }}
          className="font-body text-[11px]"
        >
          {hint}
        </Text>
      )}
    </View>
  );

  const chip = (
    label: string,
    active: boolean,
    onPress: () => void,
    sublabel?: string
  ) => (
    <TouchableOpacity
      key={label}
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: active ? colors.cta : colors.surface,
        borderColor: active ? colors.cta : colors.border,
      }}
      className="flex-row items-center rounded-full border px-4 py-2.5"
    >
      {active && (
        <Ionicons
          name="checkmark"
          size={15}
          color={colors.ctaText}
          style={{ marginRight: 6 }}
        />
      )}
      <Text
        style={{ color: active ? colors.ctaText : colors.text }}
        className="font-body-semibold text-sm"
      >
        {label}
      </Text>
      {sublabel && (
        <Text
          style={{
            color: active ? colors.ctaText : colors.textMuted,
            opacity: active ? 0.7 : 1,
          }}
          className="ml-2 font-body text-xs"
        >
          {sublabel}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end"
      >
        <Pressable
          style={{ backgroundColor: colors.modalOverlay }}
          className="absolute inset-0"
          onPress={onClose}
        />

        {/* Hauteur dictée par le contenu : un panneau court ne doit pas
            occuper tout l'écran pour deux réglages. */}
        <View
          style={{
            backgroundColor: colors.bg,
            maxHeight: '85%',
            paddingBottom: insets.bottom + 16,
          }}
          className="rounded-t-3xl"
        >
          <View className="items-center pb-1 pt-3">
            <View
              style={{ backgroundColor: colors.border }}
              className="h-1.5 w-12 rounded-full"
            />
          </View>

          <View className="flex-row items-center justify-between px-6 pb-5 pt-3">
            <View className="flex-row items-center">
              <Text
                style={{ color: colors.text }}
                className="font-body-bold text-2xl"
              >
                Filtres
              </Text>
              {activeCount > 0 && (
                <View
                  style={{ backgroundColor: colors.tealSoft }}
                  className="ml-3 rounded-full px-2.5 py-1"
                >
                  <Text
                    style={{ color: colors.tealInk }}
                    className="font-body-bold text-xs"
                  >
                    {activeCount}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={{ backgroundColor: colors.muted }}
              className="h-10 w-10 items-center justify-center rounded-full"
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8 }}
          >
            {/* --- Ville --- */}
            <View className="mb-7">
              {sectionTitle('Ville')}
              {loadingVilles ? (
                <ActivityIndicator color={colors.teal} className="self-start" />
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {chip('Toutes', !draft.cityId, () =>
                    setDraft(current => ({ ...current, cityId: undefined }))
                  )}
                  {villes.map(ville =>
                    chip(ville.name, draft.cityId === ville.id, () =>
                      setDraft(current => ({ ...current, cityId: ville.id }))
                    )
                  )}
                </View>
              )}
            </View>

            {/* --- Budget --- */}
            <View className="mb-7">
              {sectionTitle('Budget', 'pour tout le groupe')}
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.input,
                  }}
                  className="h-14 flex-1 flex-row items-center rounded-2xl border px-4"
                >
                  <TextInput
                    value={draft.budget ? String(draft.budget) : ''}
                    onChangeText={text => {
                      const amount = Number(text.replace(/\D/g, ''));
                      setDraft(current => ({
                        ...current,
                        budget: amount > 0 ? amount : undefined,
                      }));
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="Budget total"
                    placeholderTextColor={colors.icon}
                    style={{ color: colors.text }}
                    className="flex-1 font-body text-base"
                    accessibilityLabel="Budget total en dollars"
                  />
                  <Text
                    style={{ color: colors.textMuted }}
                    className="ml-2 font-body-semibold"
                  >
                    $
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.input,
                  }}
                  className="h-14 flex-row items-center rounded-2xl border px-2"
                >
                  <TouchableOpacity
                    onPress={() => setPeople(draft.people - 1)}
                    disabled={draft.people <= 1}
                    style={{ opacity: draft.people <= 1 ? 0.35 : 1 }}
                    className="h-10 w-10 items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel="Une personne de moins"
                  >
                    <Ionicons name="remove" size={20} color={colors.text} />
                  </TouchableOpacity>
                  <View className="min-w-[44px] flex-row items-center justify-center">
                    <Ionicons
                      name="people-outline"
                      size={15}
                      color={colors.textMuted}
                    />
                    <Text
                      style={{ color: colors.text }}
                      className="ml-1.5 font-body-bold text-base"
                    >
                      {draft.people}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setPeople(draft.people + 1)}
                    disabled={draft.people >= MAX_PEOPLE}
                    style={{ opacity: draft.people >= MAX_PEOPLE ? 0.35 : 1 }}
                    className="h-10 w-10 items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel="Une personne de plus"
                  >
                    <Ionicons name="add" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text
                style={{ color: colors.textMuted }}
                className="mt-2 font-body text-xs"
              >
                {draft.budget
                  ? draft.people > 1
                    ? `Soit environ ${Math.floor(draft.budget / draft.people)} $ par personne : seuls les lieux accessibles à ce prix sont proposés.`
                    : 'Seuls les lieux accessibles avec ce budget sont proposés.'
                  : 'Indiquez votre budget et le nombre de personnes pour ne voir que les lieux à votre portée.'}
              </Text>
            </View>

            {/* --- Gamme de prix --- */}
            <View className="mb-6">
              {sectionTitle('Gamme de prix', 'plusieurs choix possibles')}
              <View className="flex-row flex-wrap gap-2">
                {PRICE_RANGES.map(price =>
                  chip(
                    price,
                    draft.priceRanges.includes(price),
                    () => togglePrice(price),
                    PRICE_HINTS[price]
                  )
                )}
              </View>
            </View>
          </ScrollView>

          <View
            style={{ borderTopColor: colors.divider }}
            className="flex-row gap-3 border-t px-6 pt-5"
          >
            <Button
              title="Réinitialiser"
              variant="outline"
              onPress={() => setDraft(EMPTY_SELECTION)}
              disabled={activeCount === 0}
              style={{ flex: 1 }}
            />
            <Button
              title="Appliquer"
              onPress={() => {
                onApply(draft);
                onClose();
              }}
              style={{ flex: 2 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
