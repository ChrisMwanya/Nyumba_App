import { Tiles, type TileName } from '@/constants/theme';
import type { ReactNode } from 'react';
import { View } from 'react-native';

/**
 * Bandeau d'aplats géométriques (cercle, demi-disque, quart de cercle), dans
 * l'esprit de la landing (style figma.com) : couleurs franches, jamais de
 * dégradé. Utilisé en tête des écrans d'authentification.
 */
type Props = {
  tile?: TileName;
  height?: number;
  children?: ReactNode;
};

export default function BrandHero({
  tile = 'mint',
  height = 220,
  children,
}: Props) {
  return (
    <View style={{ height, backgroundColor: Tiles[tile], overflow: 'hidden' }}>
      {/* Cercle jaune en haut à gauche */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -40,
          left: -40,
          width: 150,
          height: 150,
          borderRadius: 75,
          backgroundColor: Tiles.yellow,
        }}
      />
      {/* Demi-disque marine accroché au bord supérieur */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          right: '14%',
          width: 112,
          height: 56,
          borderBottomLeftRadius: 56,
          borderBottomRightRadius: 56,
          backgroundColor: '#183070',
        }}
      />
      {/* Quart de cercle lilas en bas à droite */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 96,
          height: 96,
          borderTopLeftRadius: 96,
          backgroundColor: Tiles.lilac,
        }}
      />
      {children}
    </View>
  );
}
