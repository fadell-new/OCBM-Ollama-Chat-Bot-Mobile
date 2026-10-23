import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { fonts, spacing, type as typeScale } from '@/theme/typography';

export type SettingsRowProps = {
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  chevron?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function SettingsRow({
  label,
  value,
  onPress,
  destructive = false,
  chevron = true,
  icon,
  style,
  testID,
}: SettingsRowProps) {
  const { theme } = useAppTheme();
  const labelColor = destructive ? theme.danger : theme.text;

  const content = (
    <View style={styles.content}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: theme.surfaceAlt }]}>
          <Ionicons name={icon} size={18} color={destructive ? theme.danger : theme.text} />
        </View>
      ) : null}

      <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
        {label}
      </Text>

      {value ? (
        <Text style={[styles.value, { color: theme.textMuted }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}

      {onPress && chevron && !destructive ? (
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      ) : null}
    </View>
  );

  if (!onPress) {
    return (
      <View style={[styles.row, { borderBottomColor: theme.border }, style]} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor: theme.border,
          backgroundColor: pressed ? theme.surfaceAlt : 'transparent',
        },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typeScale.body,
  },
  value: {
    maxWidth: '45%',
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    textAlign: 'right',
  },
});
