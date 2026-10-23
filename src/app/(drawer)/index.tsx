import { useNavigation } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ConnectionBadge } from '@/components/ConnectionBadge';
import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useChatsStore } from '@/store/chatsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { fonts, spacing, type as typeScale } from '@/theme/typography';

export default function ChatScreen() {
  const navigation = useNavigation();
  const { theme } = useAppTheme();
  const createChat = useChatsStore((state) => state.createChat);
  const model = useSettingsStore((state) => state.settings.defaultModel);

  const openDrawer = () => {
    (navigation as unknown as { openDrawer: () => void }).openDrawer();
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <IconButton name="menu" onPress={openDrawer} accessibilityLabel="Open menu" />

        <View style={styles.headerCenter}>
          <Text style={[styles.model, { color: theme.text }]} numberOfLines={1}>
            {model || 'No model selected'}
          </Text>
          <ConnectionBadge status="unknown" />
        </View>

        <IconButton
          name="create-outline"
          onPress={() => void createChat()}
          accessibilityLabel="New chat"
        />
      </View>

      <EmptyState
        title="Ask anything"
        description="Start a conversation with the model running on your machine."
        actionLabel="New chat"
        onAction={() => void createChat()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  model: {
    fontFamily: fonts.heading,
    fontSize: typeScale.label,
  },
});
