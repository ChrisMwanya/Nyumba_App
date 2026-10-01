import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

/**
 * Bouton pilule, repris des boutons de la landing et de l'admin :
 *  - `primary`   : pilule encre (noire en clair, blanche en sombre), action principale
 *  - `outline`   : filet discret, action secondaire
 *  - `secondary` : aplat teal doux
 *  - `danger`    : aplat rouge
 */
type Variant = 'primary' | 'outline' | 'secondary' | 'danger';
type Size = 'md' | 'lg';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
  iconRight?: ComponentProps<typeof Ionicons>['name'];
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  className = '',
  style,
}: Props) {
  const { colors } = useTheme();

  const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.cta, fg: colors.ctaText, border: colors.cta },
    outline: { bg: 'transparent', fg: colors.text, border: colors.input },
    secondary: {
      bg: colors.tealSoft,
      fg: colors.tealInk,
      border: colors.tealSoft,
    },
    danger: { bg: colors.error, fg: '#FFFFFF', border: colors.error },
  };
  const { bg, fg, border } = palette[variant];
  const inactive = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.85}
      style={[
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      className={`flex-row items-center justify-center rounded-full border ${size === 'lg' ? 'px-6 py-4' : 'px-4 py-2.5'} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View className="flex-row items-center">
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'lg' ? 18 : 16}
              color={fg}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={{ color: fg }}
            className={`font-body-semibold ${size === 'lg' ? 'text-base' : 'text-sm'}`}
          >
            {title}
          </Text>
          {iconRight && (
            <Ionicons
              name={iconRight}
              size={size === 'lg' ? 18 : 16}
              color={fg}
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
