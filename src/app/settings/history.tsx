import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SettingsPage } from '@/components/SettingsPage';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useChatsStore } from '@/store/chatsStore';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';

export default function ChatHistoryScreen() {
  const { theme } = useAppTheme();
  const index = useChatsStore((state) => state.index);
  const clearAllChats = useChatsStore((state) => state.clearAllChats);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [error, setError] = useState<string>();

  const count = index.length;
  const messages = index.reduce((total, chat) => total + chat.messageCount, 0);

  const clear = async () => {
    setConfirmVisible(false);
    setClearing(true);
    setCleared(false);
    setError(undefined);

    try {
      await clearAllChats();
      setCleared(true);
    } catch {
      setError('Could not clear chat history. Try again.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <SettingsPage title="Chat History">
      <Text style={[styles.lead, { color: theme.textMuted }]}>
        Conversations are stored only on this device. Clearing them keeps your
        settings, local profile, and Personal Intelligence intact.
      </Text>

      <View
        style={[
          styles.stats,
          { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        ]}
      >
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: theme.text }]}>{count}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>
            {count === 1 ? 'Conversation' : 'Conversations'}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: theme.text }]}>{messages}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>
            {messages === 1 ? 'Message' : 'Messages'}
          </Text>
        </View>
      </View>

      <AppButton
        label="Clear chat history"
        variant="danger"
        onPress={() => setConfirmVisible(true)}
        disabled={count === 0 || clearing}
        loading={clearing}
      />

      <Text style={[styles.note, { color: theme.textMuted }]}>
        This cannot be undone. Your settings and profile are not affected.
      </Text>

      {cleared ? (
        <Text style={[styles.message, { color: theme.success }]}>
          Chat history cleared.
        </Text>
      ) : null}

      {error ? (
        <Text style={[styles.message, { color: theme.danger }]}>{error}</Text>
      ) : null}

      <ConfirmDialog
        visible={confirmVisible}
        title="Clear chat history?"
        message={`This removes all ${count} ${
          count === 1 ? 'conversation' : 'conversations'
        } from this device. Your settings, profile, and Personal Intelligence stay.`}
        confirmLabel="Clear"
        destructive
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => void clear()}
      />
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: 24,
    marginTop: spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.xl,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: fonts.semibold,
    fontSize: 30,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 40,
  },
  note: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: 18,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 20,
    textAlign: 'center',
  },
});
