import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatBytes } from '@/lib/format';
import { useAppTheme } from '@/hooks/useAppTheme';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';
import type { Attachment } from '@/types';

export type AttachmentChipProps = {
  attachment: Attachment;
  onRemove?: () => void;
};

export function AttachmentChip({ attachment, onRemove }: AttachmentChipProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {attachment.kind === 'image' ? (
        <Image source={{ uri: attachment.uri }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.fileThumb, { backgroundColor: theme.accent }]}>
          <Ionicons name="document-text-outline" size={20} color={theme.onAccent} />
        </View>
      )}

      <View style={styles.meta}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {attachment.name}
        </Text>
        <Text style={[styles.size, { color: theme.textMuted }]}>
          {formatBytes(attachment.size)}
        </Text>
      </View>

      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${attachment.name}`}
          hitSlop={8}
          onPress={onRemove}
          style={styles.remove}
        >
          <Ionicons name="close" size={16} color={theme.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingRight: spacing.md,
    borderRadius: radii.bubble,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 260,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  fileThumb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fonts.medium,
    fontSize: typeScale.caption,
  },
  size: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption - 1,
  },
  remove: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
