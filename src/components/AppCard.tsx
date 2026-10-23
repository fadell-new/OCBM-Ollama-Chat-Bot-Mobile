import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { radii, spacing } from '@/theme/typography';

export type AppCardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function AppCard({ children, onPress, style }: AppCardProps) {
  const { theme } = useAppTheme();
  const cardStyle = [
    styles.card,
    { backgroundColor: theme.surface, borderColor: theme.border },
    style,
  ];

  if (!onPress) {
    return <View style={cardStyle}>{children}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xl,
  },
  pressed: {
    opacity: 0.85,
  },
});
