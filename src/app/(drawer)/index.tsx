import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { OllamaClient, OllamaError } from '@/api/ollama';
import { ChatBubble } from '@/components/ChatBubble';
import { Composer } from '@/components/Composer';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { Toast } from '@/components/Toast';
import { useAppTheme } from '@/hooks/useAppTheme';
import { composeRequest, type ComposedRequest } from '@/lib/chatSend';
import { makeId } from '@/lib/id';
import { useChatsStore } from '@/store/chatsStore';
import { useConnectionStore } from '@/store/connectionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';
import type { Message } from '@/types';

const SUGGESTIONS = [
  'Explain a hard idea in simple words',
  'Help me debug a React Native screen',
  'Draft a friendly reply to a message',
];

export default function ChatScreen() {
  const navigation = useNavigation();
  const { theme } = useAppTheme();

  const activeChat = useChatsStore((state) => state.activeChat);
  const createChat = useChatsStore((state) => state.createChat);
  const appendMessage = useChatsStore((state) => state.appendMessage);
  const updateMessage = useChatsStore((state) => state.updateMessage);

  const settings = useSettingsStore((state) => state.settings);
  const status = useConnectionStore((state) => state.status);
  const latencyMs = useConnectionStore((state) => state.latencyMs);
  const testConnection = useConnectionStore((state) => state.test);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const sendingRef = useRef(false);
  const streamingChatIdRef = useRef<string | null>(null);

  const messages = activeChat?.messages ?? [];

  const openDrawer = () => {
    (navigation as unknown as { openDrawer: () => void }).openDrawer();
  };

  const showToast = (message: string) => setToast(message);

  useFocusEffect(
    useCallback(() => {
      if (settings.baseUrl) {
        void testConnection(settings.baseUrl);
      }
      return undefined;
    }, [settings.baseUrl, testConnection])
  );

  useEffect(() => {
    setInput('');
  }, [activeChat?.id]);

  useEffect(() => {
    if (
      streamingChatIdRef.current &&
      activeChat?.id !== streamingChatIdRef.current
    ) {
      controllerRef.current?.abort();
    }
  }, [activeChat?.id]);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
    },
    []
  );

  const lastAssistantId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].role === 'assistant') return messages[index].id;
    }
    return null;
  }, [messages]);

  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  const runCompletion = useCallback(
    async (
      chatId: string,
      assistantId: string,
      request: ComposedRequest,
      controller: AbortController
    ) => {
      let accumulated = '';

      streamingChatIdRef.current = chatId;
      controllerRef.current = controller;
      sendingRef.current = true;
      setSending(true);

      try {
        const client = new OllamaClient(settings.baseUrl);

        await client.chat(request, {
          signal: controller.signal,
          onToken: (token) => {
            accumulated += token;
            void updateMessage(
              chatId,
              assistantId,
              { content: accumulated, status: 'streaming' },
              { persist: false }
            );
          },
        });

        await updateMessage(
          chatId,
          assistantId,
          { status: 'done' },
          { persist: true }
        );
      } catch (error) {
        const aborted =
          controller.signal.aborted ||
          (error instanceof OllamaError && error.code === 'aborted');

        if (aborted) {
          await updateMessage(
            chatId,
            assistantId,
            {
              status: 'done',
              content: accumulated.trim() ? accumulated : 'Stopped.',
            },
            { persist: true }
          );
        } else {
          const message =
            error instanceof OllamaError
              ? error.message
              : 'Something went wrong while generating a reply.';

          await updateMessage(
            chatId,
            assistantId,
            { status: 'error', error: message },
            { persist: true }
          );

          if (error instanceof OllamaError && error.code === 'network') {
            showToast('Could not reach Ollama. Check your connection settings.');
          }
        }
      } finally {
        streamingChatIdRef.current = null;
        controllerRef.current = null;
        sendingRef.current = false;
        setSending(false);
      }
    },
    [settings.baseUrl, updateMessage]
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sendingRef.current) return;

    if (!settings.baseUrl) {
      showToast('Add your Ollama address in Settings.');
      return;
    }

    if (!settings.defaultModel) {
      showToast('Choose a model in Settings.');
      return;
    }

    setInput('');

    let chat = useChatsStore.getState().activeChat;
    if (!chat) {
      chat = await createChat();
    }

    const userMessage: Message = {
      id: makeId('m'),
      role: 'user',
      content: text,
      createdAt: Date.now(),
      status: 'done',
    };

    await appendMessage(chat.id, userMessage);

    const withUser = useChatsStore.getState().activeChat;
    if (!withUser) return;

    const request = composeRequest(withUser, settings);
    const assistantId = makeId('m');

    await appendMessage(chat.id, {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      status: 'streaming',
    });

    const controller = new AbortController();
    await runCompletion(chat.id, assistantId, request, controller);
  };

  const handleRerun = async (assistantMessage: Message) => {
    if (sendingRef.current) return;

    if (!settings.baseUrl) {
      showToast('Add your Ollama address in Settings.');
      return;
    }

    if (!settings.defaultModel) {
      showToast('Choose a model in Settings.');
      return;
    }

    const chat = useChatsStore.getState().activeChat;
    if (!chat) return;

    const index = chat.messages.findIndex(
      (message) => message.id === assistantMessage.id
    );
    if (index < 1) return;

    const history = chat.messages.slice(0, index);
    const request = composeRequest({ ...chat, messages: history }, settings);

    await updateMessage(chat.id, assistantMessage.id, {
      content: '',
      status: 'streaming',
      error: undefined,
    });

    const controller = new AbortController();
    await runCompletion(chat.id, assistantMessage.id, request, controller);
  };

  const handleStop = () => {
    controllerRef.current?.abort();
  };

  const handleNewChat = async () => {
    controllerRef.current?.abort();

    const current = useChatsStore.getState().activeChat;
    if (current && current.messages.length === 0) {
      setInput('');
      inputRef.current?.focus();
      return;
    }

    await createChat();
    setInput('');
    inputRef.current?.focus();
  };

  const openSettings = () => {
    router.push('/settings');
  };

  const badgeLabel =
    status === 'online' && latencyMs !== undefined ? `${latencyMs} ms` : undefined;

  const banner = !settings.baseUrl
    ? {
        icon: 'server-outline' as const,
        text: 'Add your Ollama address to start',
        action: 'Set up',
      }
    : status === 'offline'
      ? {
          icon: 'cloud-offline-outline' as const,
          text: 'Cannot reach Ollama',
          action: 'Settings',
        }
      : !settings.defaultModel
        ? {
            icon: 'cube-outline' as const,
            text: 'Choose a model to start chatting',
            action: 'Models',
          }
        : null;

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <IconButton
            name="menu"
            onPress={openDrawer}
            accessibilityLabel="Open menu"
          />

          <View style={styles.headerCenter}>
            <Text style={[styles.model, { color: theme.text }]} numberOfLines={1}>
              {settings.defaultModel || 'No model selected'}
            </Text>
            <ConnectionBadge status={status} label={badgeLabel} onPress={openSettings} />
          </View>

          <IconButton
            name="create-outline"
            onPress={() => void handleNewChat()}
            accessibilityLabel="New chat"
          />
        </View>

        {messages.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.accent }]}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={30}
                color={theme.onAccent}
              />
            </View>

            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Ask anything
            </Text>
            <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
              Your model runs on your machine. Nothing leaves it.
            </Text>

            <View style={styles.suggestions}>
              {SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  accessibilityRole="button"
                  onPress={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  style={({ pressed }) => [
                    styles.suggestion,
                    {
                      backgroundColor: pressed ? theme.control : theme.surfaceAlt,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.suggestionText, { color: theme.text }]}>
                    {suggestion}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={15}
                    color={theme.textMuted}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            inverted
            data={reversedMessages}
            keyExtractor={(message) => message.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <ChatBubble
                message={item}
                showActions={item.id === lastAssistantId && item.status === 'done'}
                onRetry={
                  item.status === 'error' ? () => void handleRerun(item) : undefined
                }
                onRegenerate={
                  item.id === lastAssistantId && item.status === 'done'
                    ? () => void handleRerun(item)
                    : undefined
                }
                onCopied={() => showToast('Copied to clipboard')}
              />
            )}
          />
        )}

        <View style={styles.bottom}>
          {banner ? (
            <Pressable
              accessibilityRole="button"
              onPress={openSettings}
              style={({ pressed }) => [
                styles.banner,
                {
                  backgroundColor: pressed ? theme.control : theme.surfaceAlt,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons name={banner.icon} size={18} color={theme.textMuted} />
              <Text style={[styles.bannerText, { color: theme.text }]}>
                {banner.text}
              </Text>
              <Text style={[styles.bannerAction, { color: theme.accentStrong }]}>
                {banner.action}
              </Text>
            </Pressable>
          ) : null}

          <Composer
            ref={inputRef}
            value={input}
            onChangeText={setInput}
            onSend={() => void handleSend()}
            onStop={handleStop}
            streaming={sending}
            placeholder="Write anything…"
          />
        </View>

        <Toast
          message={toast}
          onHide={() => setToast(null)}
          bottomOffset={banner ? 128 : 80}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  model: {
    fontFamily: fonts.heading,
    fontSize: typeScale.label,
    maxWidth: '100%',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 28,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 300,
  },
  suggestions: {
    width: '100%',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.bubble,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  suggestionText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  bottom: {
    paddingBottom: spacing.xs,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.bubble,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bannerText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
  },
  bannerAction: {
    fontFamily: fonts.medium,
    fontSize: typeScale.caption,
  },
});
