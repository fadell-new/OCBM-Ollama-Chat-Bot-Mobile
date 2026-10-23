import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';

export type ToastProps = {
  message: string | null;
  onHide: () => void;
  duration?: number;
};

export function Toast({ message, onHide, duration = 2600 }: ToastProps) {
  const { theme } = useAppTheme();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onHide, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onHide]);

  if (!message) return null;

  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={[styles.toast, { backgroundColor: theme.text }]}>
        <Text style={[styles.text, { color: theme.bg }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.xxxl + spacing.lg,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    maxWidth: '88%',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    textAlign: 'center',
  },
});
