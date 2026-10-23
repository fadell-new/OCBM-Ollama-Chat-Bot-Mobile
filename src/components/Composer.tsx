import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef, useState, type ComponentRef } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';
import type { Attachment } from '@/types';

import { AttachmentChip } from './AttachmentChip';

export type ComposerProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  streaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onAttach?: () => void;
  attachments?: Attachment[];
  onRemoveAttachment?: (id: string) => void;
  keyboardType?: KeyboardTypeOptions;
};

export const Composer = forwardRef<ComponentRef<typeof TextInput>, ComposerProps>(
  function Composer(
    {
      value,
      onChangeText,
      onSend,
      onStop,
      streaming = false,
      disabled = false,
      placeholder = 'Write anything…',
      onAttach,
      attachments = [],
      onRemoveAttachment,
      keyboardType,
    },
    ref
  ) {
    const { theme } = useAppTheme();
    const [focused, setFocused] = useState(false);

    const canSend = value.trim().length > 0 && !disabled && !streaming;

    return (
      <View style={[styles.root, { borderTopColor: theme.border }]}>
        {attachments.length > 0 ? (
          <View style={styles.attachments}>
            {attachments.map((attachment) => (
              <AttachmentChip
                key={attachment.id}
                attachment={attachment}
                onRemove={
                  onRemoveAttachment
                    ? () => onRemoveAttachment(attachment.id)
                    : undefined
                }
              />
            ))}
          </View>
        ) : null}

        <View style={styles.row}>
          {onAttach ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add attachment"
              hitSlop={8}
              onPress={onAttach}
              style={({ pressed }) => [
                styles.attach,
                { backgroundColor: pressed ? theme.surface : 'transparent' },
              ]}
            >
              <Ionicons name="attach" size={22} color={theme.textMuted} />
            </Pressable>
          ) : null}

          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: theme.surface,
                borderColor: focused ? theme.accentStrong : theme.border,
              },
            ]}
          >
            <TextInput
              ref={ref}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={theme.textMuted}
              multiline
              keyboardType={keyboardType}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={[styles.input, { color: theme.text }]}
            />
          </View>

          {streaming ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Stop generating"
              onPress={onStop}
              style={({ pressed }) => [
                styles.send,
                { backgroundColor: theme.danger, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="stop" size={20} color={theme.bg} />
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{ disabled: !canSend }}
              disabled={!canSend}
              onPress={onSend}
              style={({ pressed }) => [
                styles.send,
                {
                  backgroundColor: canSend ? theme.accent : theme.control,
                  opacity: canSend ? (pressed ? 0.82 : 1) : 0.55,
                },
              ]}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={canSend ? theme.onAccent : theme.textMuted}
              />
            </Pressable>
          )}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  attachments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  attach: {
    width: 44,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    minHeight: 48,
    maxHeight: 132,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md - 2,
    justifyContent: 'center',
  },
  input: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: 22,
    maxHeight: 108,
    paddingVertical: 0,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
