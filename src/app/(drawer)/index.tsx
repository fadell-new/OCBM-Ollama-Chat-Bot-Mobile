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
  Alert,
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
import { generateLocal } from '@/lib/localInference';
import { reconcileInstalledModels } from '@/lib/modelDownload';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { copyToAttachments, readTextFile, toOllamaImages, validateAttachment } from '@/lib/attachments';
import { useChatsStore } from '@/store/chatsStore';
import { useConnectionStore } from '@/store/connectionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useLocalModelStore } from '@/store/localModelStore';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';
import type { Attachment, Message } from '@/types';

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
  const models = useConnectionStore((state) => state.models);
  const localModelReady = useLocalModelStore((state) =>
    Boolean(state.activeModelId && state.installed[state.activeModelId])
  );

  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
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
    void reconcileInstalledModels();
  }, []);

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

  const handleSend = async (ignoreVisionWarning = false) => {
    const text = input.trim();
    const hasAttachments = attachments.length > 0;
    if ((!text && !hasAttachments) || sendingRef.current) return;

    const useLocal =
      settings.aiSource === 'local'
        ? localModelReady
        : settings.aiSource === 'auto'
          ? localModelReady
          : false;

    if (settings.aiSource === 'local' && !localModelReady) {
      showToast('Download and select an on-device model in Settings.');
      return;
    }

    if (!useLocal) {
      if (!settings.baseUrl) {
        showToast('Add your Ollama address in Settings, or download an on-device model.');
        return;
      }

      if (!settings.defaultModel) {
        showToast('Choose a model in Settings, or download an on-device model.');
        return;
      }

      const selected = models.find((model) => model.name === settings.defaultModel);
      if (
        selected &&
        selected.capabilities.length > 0 &&
        !selected.capabilities.includes('completion')
      ) {
        showToast('That model does not support chat. Pick another in Settings.');
        return;
      }
    }
    if (!ignoreVisionWarning && attachments.some((attachment) => attachment.kind === 'image')) {
      if (useLocal) {
        Alert.alert(
          'On-device model cannot read images',
          'The on-device model works with text only. Switch to the PC model to send images, or send the text without them.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Send anyway', onPress: () => void handleSend(true) },
          ]
        );
        return;
      }

      const currentModel = models.find((model) => model.name === settings.defaultModel);
      const hasVision = currentModel?.capabilities?.includes('vision') ?? false;
      if (!hasVision) {
        Alert.alert('Model may not support images', 'The selected model may not handle images. Send anyway?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send anyway', onPress: () => void handleSend(true) },
        ]);
        return;
      }
    }

    let content = text;
    const textAttachments = attachments.filter((attachment) => attachment.kind === 'text');
    for (const attachment of textAttachments) {
      try {
        const fileContent = await readTextFile(attachment.uri);
        content += `\n\n---\nFile: ${attachment.name}\n${fileContent}`;
      } catch {
        content += `\n\n---\nFile: ${attachment.name}\n(unreadable)`;
      }
    }

    const imageAttachments = attachments.filter((attachment) => attachment.kind === 'image');
    const images =
      imageAttachments.length > 0 ? await toOllamaImages(imageAttachments) : undefined;

    const pendingAttachments = attachments;
    setAttachments([]);
    setInput('');

    let chat = useChatsStore.getState().activeChat;
    if (!chat) {
      chat = await createChat();
    }

    const userMessage: Message = {
      id: makeId('m'),
      role: 'user',
      content,
      createdAt: Date.now(),
      status: 'done',
      attachments: pendingAttachments,
      images,
    };

    await appendMessage(chat.id, userMessage);

    const withUser = useChatsStore.getState().activeChat;
    if (!withUser) return;
    const assistantId = makeId('m');

    await appendMessage(chat.id, {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      status: 'streaming',
    });

    if (useLocal) {
      try {
        await generateLocal({
          prompt: content,
          onToken: (token) => {
            const current = useChatsStore.getState().activeChat;
            if (!current) return;
            const msg = current.messages.find((m) => m.id === assistantId);
            if (!msg) return;
            void updateMessage(chat.id, assistantId, { content: (msg.content ?? '') + token });
          },
        });
        await updateMessage(chat.id, assistantId, { status: 'done' });
      } catch (error) {
        await updateMessage(chat.id, assistantId, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Generation failed.',
        });
      }
      return;
    }

    const request = composeRequest(withUser, settings);
    const controller = new AbortController();
    await runCompletion(chat.id, assistantId, request, controller);
    await runCompletion(chat.id, assistantId, request, controller);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id));
  };

  const handleAttach = () => {
    Alert.alert('Add attachment', 'Choose a source', [
      { text: 'Photo', onPress: () => void pickPhoto() },
      { text: 'File', onPress: () => void pickFile() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const validation = validateAttachment(
      {
        kind: 'image',
        size: asset.fileSize ?? 0,
        mimeType: asset.mimeType ?? 'image/jpeg',
      },
      attachments
    );
    if (!validation.ok) {
      showToast(validation.message);
      return;
    }

    try {
      const uri = await copyToAttachments(asset.uri, asset.fileName ?? 'image.jpg');
      const attachment: Attachment = {
        id: makeId('a'),
        kind: 'image',
        uri,
        name: asset.fileName ?? 'image.jpg',
        mimeType: asset.mimeType ?? 'image/jpeg',
        size: asset.fileSize ?? 0,
      };
      setAttachments((current) => [...current, attachment]);
    } catch {
      showToast('Could not add the photo.');
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/*', 'application/json'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'text/plain';
    const size = asset.size ?? 0;
    const validation = validateAttachment({ kind: 'text', size, mimeType }, attachments);
    if (!validation.ok) {
      showToast(validation.message);
      return;
    }

    try {
      const uri = await copyToAttachments(asset.uri, asset.name ?? 'file.txt');
      const attachment: Attachment = {
        id: makeId('a'),
        kind: 'text',
        uri,
        name: asset.name ?? 'file.txt',
        mimeType,
        size,
      };
      setAttachments((current) => [...current, attachment]);
    } catch {
      showToast('Could not add the file.');
    }
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
            onAttach={handleAttach}
            attachments={attachments}
            onRemoveAttachment={handleRemoveAttachment}
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
