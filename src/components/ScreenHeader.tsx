import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { fonts, spacing, type as typeScale } from '@/theme/typography';

import { IconButton } from './IconButton';

export type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
};

export function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.root}>
      <View style={styles.side}>
        {onBack ? (
          <IconButton name="arrow-back" onPress={onBack} accessibilityLabel="Go back" />
        ) : null}
      </View>

      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {title}
      </Text>

      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    gap: spacing.sm,
  },
  side: {
    width: 44,
    alignItems: 'flex-start',
  },
  right: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    fontFamily: fonts.heading,
    fontSize: typeScale.subtitle,
    textAlign: 'center',
  },
});
