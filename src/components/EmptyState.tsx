import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { fonts, spacing, type as typeScale } from '@/theme/typography';

import { AppButton } from './AppButton';

export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  icon = 'chatbubble-ellipses-outline',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.root}>
      <View style={[styles.iconWrap, { backgroundColor: theme.accent }]}>
        <Ionicons name={icon} size={30} color={theme.onAccent} />
      </View>

      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

      {description ? (
        <Text style={[styles.description, { color: theme.textMuted }]}>{description}</Text>
      ) : null}

      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: typeScale.title,
    textAlign: 'center',
  },
  description: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 21,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xxxl,
  },
});
