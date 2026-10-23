import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';

export type ConnectionStatus = 'unknown' | 'testing' | 'online' | 'offline';

export type ConnectionBadgeProps = {
  status: ConnectionStatus;
  label?: string;
  onPress?: () => void;
};

const DEFAULT_LABELS: Record<ConnectionStatus, string> = {
  unknown: 'Not checked',
  testing: 'Checking…',
  online: 'Online',
  offline: 'Offline',
};

export function ConnectionBadge({ status, label, onPress }: ConnectionBadgeProps) {
  const { theme } = useAppTheme();

  const dotColor =
    status === 'online'
      ? theme.success
      : status === 'offline'
        ? theme.danger
        : status === 'testing'
          ? theme.accentStrong
          : theme.textMuted;

  const content = (
    <View style={styles.content}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.label, { color: theme.textMuted }]}>
        {label ?? DEFAULT_LABELS[status]}
      </Text>
    </View>
  );

  const containerStyle = [
    styles.root,
    { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
  ];

  if (!onPress) {
    return <View style={containerStyle}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: typeScale.caption,
  },
  pressed: {
    opacity: 0.7,
  },
});
