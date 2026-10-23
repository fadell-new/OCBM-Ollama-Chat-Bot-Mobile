import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from './AppButton';
import { ConfirmDialog } from './ConfirmDialog';
import { useAppTheme } from '@/hooks/useAppTheme';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';
import type { OllamaModel } from '@/types';

export type ModelRowProps = {
  model: OllamaModel;
  defaultSelected?: boolean;
  onSelect?: (model: OllamaModel) => void;
  onDelete?: (model: OllamaModel) => void;
};

export function ModelRow({
  model,
  defaultSelected = false,
  onSelect,
  onDelete,
}: ModelRowProps) {
  const { theme } = useAppTheme();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const hasDelete = Boolean(onDelete);
  const hasSelect = Boolean(onSelect);

  const meta = [
    model.parameterSize ? `Parameters: ${model.parameterSize}` : null,
    model.quantization ? `Quantization: ${model.quantization}` : null,
    typeof model.size === 'number' ? `${Math.round(model.size / (1024 * 1024))} MB` : null,
    model.modifiedAt ? new Date(model.modifiedAt).toLocaleDateString() : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const deleteModel = () => {
    setConfirmVisible(false);
    onDelete?.(model);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      <View style={styles.content}>
        {hasSelect ? (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: defaultSelected }}
            aria-checked={defaultSelected}
            accessibilityLabel={`${model.name} default model`}
            onPress={() => onSelect?.(model)}
            style={({ pressed }) => [
              styles.radio,
              {
                borderColor: defaultSelected ? theme.accentStrong : theme.border,
                backgroundColor: defaultSelected ? theme.accentStrong : theme.surface,
              },
              pressed && styles.radioPressed,
            ]}
          >
            {defaultSelected ? <View style={[styles.radioDot, { backgroundColor: theme.bg }]} /> : null}
          </Pressable>
        ) : (
          <View style={[styles.radio, { borderColor: theme.border, backgroundColor: theme.surface }]} />
        )}

        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]}>{model.name}</Text>
          {meta ? <Text style={[styles.meta, { color: theme.textMuted }]}>{meta}</Text> : null}
          {model.capabilities && model.capabilities.length > 0 ? (
            <View style={styles.badges}>
              {model.capabilities.map((capability) => (
                <View
                  key={capability}
                  style={[styles.badge, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Text style={[styles.badgeText, { color: theme.textMuted }]}>{capability}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {hasDelete ? (
          <AppButton
            label="Delete"
            variant="danger"
            onPress={() => setConfirmVisible(true)}
            style={styles.deleteButton}
          />
        ) : null}
      </View>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete model?"
        message={`Delete ${model.name} from Ollama? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmVisible(false)}
        onConfirm={deleteModel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  radioPressed: {
    opacity: 0.7,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontFamily: fonts.medium,
    fontSize: typeScale.body,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: 16,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badge: {
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
  },
  deleteButton: {
    alignSelf: 'center',
  },
});
