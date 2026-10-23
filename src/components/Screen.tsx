import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme/typography';

export type ScreenProps = {
  children: ReactNode;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Screen({ children, edges = ['top', 'bottom'], padded = true, style }: ScreenProps) {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, { backgroundColor: theme.bg }, padded && styles.padded, style]}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.xl,
  },
});
