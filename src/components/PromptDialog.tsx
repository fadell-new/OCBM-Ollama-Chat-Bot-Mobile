import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';

import { AppButton } from './AppButton';
import { AppInput } from './AppInput';

export type PromptDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onSubmit: (value: string) => void;
};

export function PromptDialog({
  visible,
  title,
  message,
  placeholder,
  initialValue = '',
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  onCancel,
  onSubmit,
}: PromptDialogProps) {
  const { theme } = useAppTheme();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
    }
  }, [visible, initialValue]);

  const trimmed = value.trim();

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

          <AppInput
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => {
              if (trimmed) onSubmit(trimmed);
            }}
          />

          <View style={styles.actions}>
            <AppButton
              label={cancelLabel}
              variant="secondary"
              onPress={onCancel}
              style={styles.action}
            />
            <AppButton
              label={submitLabel}
              onPress={() => {
                if (trimmed) onSubmit(trimmed);
              }}
              disabled={!trimmed}
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
    marginTop: spacing.sm,
  },
  action: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
});
