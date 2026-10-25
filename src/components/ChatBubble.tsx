import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';

import { useAppTheme } from '@/hooks/useAppTheme';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';
import type { Message } from '@/types';

import { AttachmentChip } from './AttachmentChip';
import { GeneratedFiles } from './GeneratedFiles';

export type ChatBubbleProps = {
  message: Message;
  onRetry?: () => void;
  onRegenerate?: () => void;
  onCopied?: () => void;
  showActions?: boolean;
  showUserActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

function StreamingDots() {
  const { theme } = useAppTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.dots, { opacity }]}>
      {[0, 1, 2].map((dot) => (
        <View key={dot} style={[styles.dot, { backgroundColor: theme.textMuted }]} />
      ))}
    </Animated.View>
  );
}

export function ChatBubble({
  message,
  onRetry,
  onRegenerate,
  onCopied,
  showActions = false,
  showUserActions = false,
  onEdit,
  onDelete,
}: ChatBubbleProps) {
  const { theme } = useAppTheme();
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';
  const hasContent = message.content.trim().length > 0;

  const markdownStyles = useMemo(
    () => ({
      body: {
        color: theme.text,
        fontFamily: fonts.body,
        fontSize: typeScale.body,
        lineHeight: 24,
        flexShrink: 1,
        maxWidth: '100%',
        textBreakStrategy: 'balanced' as any,
      },
      paragraph: {
        marginTop: 0,
        marginBottom: spacing.sm,
      },
      heading1: {
        color: theme.text,
        fontFamily: fonts.heading,
        fontSize: 24,
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
      },
      heading2: {
        color: theme.text,
        fontFamily: fonts.heading,
        fontSize: 20,
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
      },
      heading3: {
        color: theme.text,
        fontFamily: fonts.semibold,
        fontSize: 17,
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
      },
      strong: {
        fontFamily: fonts.semibold,
      },
      em: {
        fontStyle: 'italic' as const,
      },
      link: {
        color: theme.accentStrong,
      },
      blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: theme.accentStrong,
        paddingLeft: spacing.md,
        marginVertical: spacing.xs,
        opacity: 0.9,
      },
      code_inline: {
        fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
        backgroundColor: theme.surfaceAlt,
        color: theme.text,
        borderRadius: 4,
        paddingHorizontal: 4,
        fontSize: 14,
      },
      code_block: {
        fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
        backgroundColor: theme.surfaceAlt,
        color: theme.text,
        borderRadius: 12,
        padding: spacing.md,
        fontSize: 13,
        lineHeight: 20,
      },
      fence: {
        fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
        backgroundColor: theme.surfaceAlt,
        color: theme.text,
        borderRadius: 12,
        padding: spacing.md,
        fontSize: 13,
        lineHeight: 20,
      },
      bullet_list: {
        marginVertical: spacing.xs,
      },
      ordered_list: {
        marginVertical: spacing.xs,
      },
      list_item: {
        marginVertical: 2,
      },
      hr: {
        backgroundColor: theme.border,
        height: 1,
        marginVertical: spacing.md,
      },
    }),
    [theme]
  );

  const copy = async () => {
    if (!hasContent) return;
    await Clipboard.setStringAsync(message.content);
    onCopied?.();
  };

  const showFooter =
    !isStreaming &&
    (isError || showActions || showUserActions);

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <Pressable
        accessibilityHint="Long press to copy this message"
        delayLongPress={350}
        onLongPress={() => void copy()}
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: theme.accent }]
            : [
                styles.assistantBubble,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ],
        ]}
      >
        {message.attachments && message.attachments.length > 0 ? (
          <View style={styles.attachments}>
            {message.attachments.map((attachment) => (
              <AttachmentChip key={attachment.id} attachment={attachment} />
            ))}
          </View>
        ) : null}

        {hasContent ? (
          isUser ? (
            <Text
              style={[styles.userText, { color: theme.onAccent, flexShrink: 1 }]}
              textBreakStrategy="balanced"
            >
              {message.content}
            </Text>
          ) : (
            <Markdown style={markdownStyles}>{message.content}</Markdown>
          )
        ) : null}

        {isStreaming ? <StreamingDots /> : null}

        {!isStreaming && hasContent && !isUser ? (
          <GeneratedFiles content={message.content} onCopied={onCopied} />
        ) : null}

        {isError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={theme.danger} />
            <Text style={[styles.errorText, { color: theme.danger }]}>
              {message.error ?? 'The response was interrupted.'}
            </Text>
          </View>
        ) : null}
      </Pressable>

      {showFooter ? (
        <View style={styles.footer}>
          {isError && onRetry ? (
            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              style={styles.footerButton}
            >
              <Ionicons name="refresh" size={14} color={theme.accentStrong} />
              <Text style={[styles.footerAction, { color: theme.accentStrong }]}>
                Retry
              </Text>
            </Pressable>
          ) : null}

          {showActions ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Copy message"
              onPress={() => void copy()}
              style={styles.footerButton}
            >
              <Ionicons name="copy-outline" size={14} color={theme.textMuted} />
              <Text style={[styles.footerLabel, { color: theme.textMuted }]}>Copy</Text>
            </Pressable>
          ) : null}

          {showActions && onRegenerate ? (
            <Pressable
              accessibilityRole="button"
              onPress={onRegenerate}
              style={styles.footerButton}
            >
              <Ionicons name="refresh-outline" size={14} color={theme.textMuted} />
              <Text style={[styles.footerLabel, { color: theme.textMuted }]}>
                Regenerate
              </Text>
            </Pressable>
          ) : null}

          {showUserActions && onEdit ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit message"
              onPress={onEdit}
              style={styles.footerButton}
            >
              <Ionicons name="create-outline" size={14} color={theme.textMuted} />
              <Text style={[styles.footerLabel, { color: theme.textMuted }]}>Edit</Text>
            </Pressable>
          ) : null}

          {showUserActions && onDelete ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete message"
              onPress={onDelete}
              style={styles.footerButton}
            >
              <Ionicons name="trash-outline" size={14} color={theme.danger} />
              <Text style={[styles.footerLabel, { color: theme.danger }]}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    gap: spacing.xs,
  },
  rowUser: {
    alignItems: 'flex-end',
  },
  rowAssistant: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '88%',
    flexShrink: 1,
    overflow: 'hidden',
    borderRadius: radii.bubble,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  userBubble: {
    borderBottomRightRadius: radii.bubbleTail,
  },
  assistantBubble: {
    borderBottomLeftRadius: radii.bubbleTail,
    borderWidth: StyleSheet.hairlineWidth,
  },
  userText: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: 24,
  },
  attachments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs + 2,
    marginTop: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 28,
  },
  footerAction: {
    fontFamily: fonts.medium,
    fontSize: typeScale.caption,
  },
  footerLabel: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
  },
});
