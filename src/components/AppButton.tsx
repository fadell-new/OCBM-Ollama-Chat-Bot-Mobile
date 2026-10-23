import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { fonts, radii, type as typeScale } from '@/theme/typography';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type AppButtonSize = 'md' | 'lg';

export type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  testID,
}: AppButtonProps) {
  const { theme } = useAppTheme();
  const inactive = disabled || loading;

  const backgroundColor =
    variant === 'primary'
      ? theme.accent
      : variant === 'secondary'
        ? theme.control
        : variant === 'danger'
          ? theme.danger
          : 'transparent';

  const textColor =
    variant === 'primary'
      ? theme.onAccent
      : variant === 'danger'
        ? theme.bg
        : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      testID={testID}
      onPress={inactive ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        {
          backgroundColor,
          opacity: inactive ? 0.45 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text
            numberOfLines={1}
            style={[
              styles.label,
              { color: textColor, fontSize: size === 'lg' ? 16 : typeScale.label },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    paddingHorizontal: 24,
  },
  md: {
    minHeight: 48,
  },
  lg: {
    minHeight: 56,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontFamily: fonts.heading,
    textAlign: 'center',
  },
});
