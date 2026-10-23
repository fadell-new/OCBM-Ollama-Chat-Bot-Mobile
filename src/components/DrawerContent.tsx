import Ionicons from '@expo/vector-icons/Ionicons';
import type { DrawerContentComponentProps } from 'expo-router/drawer';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/useAppTheme';
import { formatRelativeTime } from '@/lib/format';
import { useChatsStore } from '@/store/chatsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';
import type { ChatSummary } from '@/types';

import { AppButton } from './AppButton';
import { Avatar } from './Avatar';
import { ConfirmDialog } from './ConfirmDialog';
import { PromptDialog } from './PromptDialog';

export function DrawerContent(props: DrawerContentComponentProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const index = useChatsStore((state) => state.index);
  const activeChat = useChatsStore((state) => state.activeChat);
  const createChat = useChatsStore((state) => state.createChat);
  const openChat = useChatsStore((state) => state.openChat);
  const renameChat = useChatsStore((state) => state.renameChat);
  const deleteChat = useChatsStore((state) => state.deleteChat);
  const settings = useSettingsStore((state) => state.settings);

  const [actionsFor, setActionsFor] = useState<ChatSummary | null>(null);
  const [renameFor, setRenameFor] = useState<ChatSummary | null>(null);
  const [deleteFor, setDeleteFor] = useState<ChatSummary | null>(null);
  const longPressAtRef = useRef(0);

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

  const handleChatPress = (id: string) => {
    if (Date.now() - longPressAtRef.current < 800) return;
    void handleOpenChat(id);
  };

  const handleChatLongPress = (chat: ChatSummary) => {
    longPressAtRef.current = Date.now();
    setActionsFor(chat);
  };

  const startRename = () => {
    const chat = actionsFor;
    setActionsFor(null);
    if (chat) setRenameFor(chat);
  };

  const startDelete = () => {
    const chat = actionsFor;
    setActionsFor(null);
    if (chat) setDeleteFor(chat);
  };

  const submitRename = (value: string) => {
    const chat = renameFor;
    setRenameFor(null);
    if (chat) void renameChat(chat.id, value);
  };

  const confirmDelete = () => {
    const chat = deleteFor;
    setDeleteFor(null);
    if (chat) void deleteChat(chat.id);
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
                accessibilityHint="Long press to rename or delete"
                onPress={() => handleChatPress(chat.id)}
                onLongPress={() => handleChatLongPress(chat)}
                delayLongPress={380}
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

      <Modal
        visible={actionsFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActionsFor(null)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}>
          <Pressable
            accessibilityLabel="Close chat actions"
            style={StyleSheet.absoluteFill}
            onPress={() => setActionsFor(null)}
          />

          <View
            style={[
              styles.actionSheet,
              {
                backgroundColor: theme.bg,
                borderColor: theme.border,
                paddingBottom: insets.bottom + spacing.md,
              },
            ]}
          >
            <Text style={[styles.actionTitle, { color: theme.textMuted }]} numberOfLines={1}>
              {actionsFor?.title}
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={startRename}
              style={({ pressed }) => [
                styles.actionRow,
                { backgroundColor: pressed ? theme.surface : 'transparent' },
              ]}
            >
              <Ionicons name="pencil-outline" size={20} color={theme.text} />
              <Text style={[styles.actionLabel, { color: theme.text }]}>Rename</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={startDelete}
              style={({ pressed }) => [
                styles.actionRow,
                { backgroundColor: pressed ? theme.surface : 'transparent' },
              ]}
            >
              <Ionicons name="trash-outline" size={20} color={theme.danger} />
              <Text style={[styles.actionLabel, { color: theme.danger }]}>Delete</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setActionsFor(null)}
              style={({ pressed }) => [
                styles.actionRow,
                styles.cancelRow,
                {
                  borderTopColor: theme.border,
                  backgroundColor: pressed ? theme.surface : 'transparent',
                },
              ]}
            >
              <Text style={[styles.cancelLabel, { color: theme.textMuted }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <PromptDialog
        visible={renameFor !== null}
        title="Rename chat"
        message="Choose a short name for this conversation."
        placeholder="Chat title"
        initialValue={renameFor?.title ?? ''}
        submitLabel="Save"
        onCancel={() => setRenameFor(null)}
        onSubmit={submitRename}
      />

      <ConfirmDialog
        visible={deleteFor !== null}
        title="Delete chat?"
        message={
          deleteFor ? `“${deleteFor.title}” will be removed from this device.` : undefined
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleteFor(null)}
        onConfirm={confirmDelete}
      />
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
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  actionSheet: {
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
  },
  actionTitle: {
    fontFamily: fonts.medium,
    fontSize: typeScale.caption,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  actionRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.bubble,
    paddingHorizontal: spacing.md,
  },
  actionLabel: {
    fontFamily: fonts.medium,
    fontSize: typeScale.body,
  },
  cancelRow: {
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xs,
    minHeight: 48,
  },
  cancelLabel: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
  },
});
