import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';

export type PromptPreviewProps = {
  label: string;
  value: string;
  emptyText: string;
  note?: string;
};

export function PromptPreview({ label, value, emptyText, note }: PromptPreviewProps) {
  const { theme } = useAppTheme();
  const hasValue = value.trim().length > 0;

  return (
    <View style={styles.root}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        ]}
      >
        <Text
          selectable
          style={[styles.value, { color: hasValue ? theme.text : theme.textMuted }]}
        >
          {hasValue ? value : emptyText}
        </Text>
      </View>

      {note ? (
        <Text style={[styles.note, { color: theme.textMuted }]}>{note}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: typeScale.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  value: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 22,
  },
  note: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: 18,
  },
});
