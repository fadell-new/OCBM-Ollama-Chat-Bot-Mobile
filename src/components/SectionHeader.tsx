import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { fonts, spacing, type as typeScale } from '@/theme/typography';

export type SectionHeaderProps = {
  title: string;
  style?: StyleProp<TextStyle>;
};

export function SectionHeader({ title, style }: SectionHeaderProps) {
  const { theme } = useAppTheme();

  return (
    <Text style={[styles.title, { color: theme.text }, style]}>
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.heading,
    fontSize: typeScale.subtitle,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
});
