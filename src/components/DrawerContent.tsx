import { Ionicons } from '@expo/vector-icons';
import type { DrawerContentComponentProps } from 'expo-router/drawer';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/useAppTheme';
import { formatRelativeTime } from '@/lib/format';
import { useChatsStore } from '@/store/chatsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';

import { AppButton } from './AppButton';
import { Avatar } from './Avatar';

export function DrawerContent(props: DrawerContentComponentProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const index = useChatsStore((state) => state.index);
  const activeChat = useChatsStore((state) => state.activeChat);
  const createChat = useChatsStore((state) => state.createChat);
  const openChat = useChatsStore((state) => state.openChat);
  const settings = useSettingsStore((state) => state.settings);

  const close = () => props.navigation.closeDrawer();

  const handleNewChat = async () => {
    await createChat();
    close();
    router.replace('/(drawer)');
  };

  const handleOpenChat = async (id: string) => {
    await openChat(id);
    close();
    router.replace('/(drawer)');
  };

  const openSettings = () => {
    close();
    router.push('/settings');
  };

  const openSearch = () => {
    close();
    router.push('/search');
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.bg,
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing.md,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.brand, { color: theme.text }]}>OCBM</Text>
        <Text style={[styles.tagline, { color: theme.textMuted }]}>
          Private. Local. Yours.
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton label="New chat" onPress={() => void handleNewChat()} icon={
          <Ionicons name="add" size={18} color={theme.onAccent} />
        } />

        <Pressable
          accessibilityRole="button"
          onPress={openSearch}
          style={({ pressed }) => [
            styles.search,
            { backgroundColor: pressed ? theme.surface : 'transparent' },
          ]}
        >
          <Ionicons name="search" size={18} color={theme.textMuted} />
          <Text style={[styles.searchLabel, { color: theme.textMuted }]}>Search chats</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Recent</Text>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {index.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textMuted }]}>
            No chats yet. Start a conversation.
          </Text>
        ) : (
          index.map((chat) => {
            const isActive = activeChat?.id === chat.id;
            return (
              <Pressable
                key={chat.id}
                accessibilityRole="button"
                onPress={() => void handleOpenChat(chat.id)}
                style={({ pressed }) => [
                  styles.chatRow,
                  {
                    backgroundColor: isActive
                      ? theme.accent
                      : pressed
                        ? theme.surface
                        : 'transparent',
                  },
                ]}
              >
                <View style={styles.chatText}>
                  <Text
                    style={[styles.chatTitle, { color: isActive ? theme.onAccent : theme.text }]}
                    numberOfLines={1}
                  >
                    {chat.title}
                  </Text>
                  <Text
                    style={[
                      styles.chatPreview,
                      { color: isActive ? theme.onAccent : theme.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {chat.preview}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.chatTime,
                    { color: isActive ? theme.onAccent : theme.textMuted },
                  ]}
                >
                  {formatRelativeTime(chat.updatedAt)}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        onPress={openSettings}
        style={({ pressed }) => [
          styles.profile,
          {
            borderTopColor: theme.border,
            backgroundColor: pressed ? theme.surface : 'transparent',
          },
        ]}
      >
        <Avatar name={settings.profile.name} size={40} />
        <View style={styles.profileText}>
          <Text style={[styles.profileName, { color: theme.text }]} numberOfLines={1}>
            {settings.profile.name}
          </Text>
          <Text style={[styles.profileEmail, { color: theme.textMuted }]} numberOfLines={1}>
            {settings.profile.email || 'Local profile'}
          </Text>
        </View>
        <Ionicons name="settings-outline" size={20} color={theme.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.xxl,
  },
  brand: {
    fontFamily: fonts.heading,
    fontSize: 30,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    letterSpacing: 0.4,
  },
  actions: {
    gap: spacing.sm,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
  },
  searchLabel: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: typeScale.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 20,
    paddingVertical: spacing.lg,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.bubble,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  chatText: {
    flex: 1,
    gap: 2,
  },
  chatTitle: {
    fontFamily: fonts.medium,
    fontSize: typeScale.label,
  },
  chatPreview: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
  },
  chatTime: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.lg,
    minHeight: 64,
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontFamily: fonts.medium,
    fontSize: typeScale.label,
  },
  profileEmail: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
  },
});
