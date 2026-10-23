import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';

import { AppButton } from './AppButton';

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { theme } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.backdrop, { backgroundColor: theme.overlay }]}>
        <Pressable
          accessibilityLabel="Close dialog"
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
        />

        <View style={[styles.card, { backgroundColor: theme.bg }]}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

          {message ? (
            <Text style={[styles.message, { color: theme.textMuted }]}>{message}</Text>
          ) : null}

          <View style={styles.actions}>
            <AppButton
              label={cancelLabel}
              variant="secondary"
              onPress={onCancel}
              style={styles.action}
            />
            <AppButton
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              style={styles.action}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radii.card,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: typeScale.subtitle,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  action: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
});
