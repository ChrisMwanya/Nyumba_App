import React, { useCallback, useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';

const SPRING = { damping: 20, stiffness: 220, mass: 0.7 } as const;
/** Vitesse (px/s) à partir de laquelle un geste vers le bas ferme la feuille. */
const FLING_VELOCITY = 900;
const SCREEN_HEIGHT = Dimensions.get('window').height;

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Hauteurs d'accroche en px, croissantes. La dernière est la hauteur max. */
  snapPoints: number[];
  /** Rend le fond derrière la feuille inerte et assombri. */
  backdrop?: boolean;
  /** Décalage depuis le bas de l'écran, pour dégager une barre d'onglets. */
  bottomInset?: number;
  children: React.ReactNode;
};

/**
 * Feuille glissante ancrée en bas de l'écran.
 *
 * Écrite sur Reanimated plutôt qu'ajoutée en dépendance : la carte a besoin de
 * rester interactive derrière la feuille (`backdrop={false}`), ce que les
 * feuilles modales prêtes à l'emploi ne permettent pas sans contorsions.
 */
export default function BottomSheet({
  visible,
  onClose,
  snapPoints,
  backdrop = false,
  bottomInset = 0,
  children,
}: Props) {
  const { colors } = useTheme();
  const maxHeight = Math.min(
    snapPoints[snapPoints.length - 1],
    SCREEN_HEIGHT * 0.9
  );
  const stops = snapPoints.map(point => maxHeight - Math.min(point, maxHeight));

  // translateY : 0 = ouverte au maximum, `maxHeight` = entièrement masquée.
  const translateY = useSharedValue(maxHeight);
  const startY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(visible ? stops[0] : maxHeight, SPRING);
    // `stops` est recalculé à chaque rendu : on ne dépend que de ses valeurs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, maxHeight, stops[0]]);

  const close = useCallback(() => onClose(), [onClose]);

  const pan = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate(event => {
      translateY.value = Math.max(0, startY.value + event.translationY);
    })
    .onEnd(event => {
      const projected = translateY.value + event.velocityY * 0.1;

      if (event.velocityY > FLING_VELOCITY || projected > maxHeight * 0.65) {
        translateY.value = withSpring(maxHeight, SPRING, () =>
          runOnJS(close)()
        );
        return;
      }

      const nearest = stops.reduce((best, stop) =>
        Math.abs(stop - projected) < Math.abs(best - projected) ? stop : best
      );
      translateY.value = withSpring(nearest, SPRING);
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [maxHeight, 0],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  if (!visible) return null;

  return (
    <>
      {backdrop && (
        <Animated.View style={[StyleSheet.absoluteFillObject, backdropStyle]}>
          <Pressable
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: colors.modalOverlay },
            ]}
            onPress={() => {
              translateY.value = withTiming(maxHeight, { duration: 180 }, () =>
                runOnJS(close)()
              );
            }}
          />
        </Animated.View>
      )}

      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: bottomInset,
            height: maxHeight,
            backgroundColor: colors.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowColor: '#0B0F1A',
            shadowOpacity: 0.1,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: -4 },
            elevation: 12,
          },
          sheetStyle,
        ]}
      >
        {/* Le geste n'est attaché qu'à la poignée : l'attacher à la feuille
            entière volerait le défilement d'une liste placée à l'intérieur. */}
        <GestureDetector gesture={pan}>
          <View className="items-center pb-2 pt-3">
            <View
              style={{ backgroundColor: colors.border }}
              className="h-1.5 w-12 rounded-full"
            />
          </View>
        </GestureDetector>
        {children}
      </Animated.View>
    </>
  );
}
