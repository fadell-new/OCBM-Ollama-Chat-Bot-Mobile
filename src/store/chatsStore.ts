import { create } from 'zustand';

import { makeChatTitle } from '@/lib/format';
import { STORAGE_KEYS, storage } from '@/lib/storage';
import type { Chat, ChatSummary, Message } from '@/types';

function sortIndex(index: ChatSummary[]): ChatSummary[] {
  return [...index].sort((a, b) => b.updatedAt - a.updatedAt);
}

function toSummary(chat: Chat): ChatSummary {
  const last = chat.messages[chat.messages.length - 1];
  const preview = (last?.content ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);

  return {
    id: chat.id,
    title: chat.title,
    preview: preview || 'No messages',
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    messageCount: chat.messages.length,
  };
}

function upsertSummary(index: ChatSummary[], chat: Chat): ChatSummary[] {
  return sortIndex([toSummary(chat), ...index.filter((item) => item.id !== chat.id)]);
}

const INTERRUPTED_MESSAGE = 'Response interrupted. Tap retry to try again.';

function repairInterruptedMessages(chat: Chat): { chat: Chat; changed: boolean } {
  let changed = false;

  const messages = chat.messages.map((message) => {
    if (message.status !== 'streaming' && message.status !== 'sending') {
      return message;
    }

    changed = true;
    return {
      ...message,
      status: 'error' as const,
      error: message.error ?? INTERRUPTED_MESSAGE,
    };
  });

  return { chat: changed ? { ...chat, messages } : chat, changed };
}

type UpdateMessageOptions = {
  persist?: boolean;
};

type ChatsState = {
  index: ChatSummary[];
  activeChat: Chat | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  createChat: (title?: string) => Promise<Chat>;
  openChat: (id: string) => Promise<void>;
  closeChat: () => void;
  renameChat: (id: string, title: string) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  appendMessage: (chatId: string, message: Message) => Promise<void>;
  updateMessage: (
    chatId: string,
    messageId: string,
    patch: Partial<Message>,
    options?: UpdateMessageOptions
  ) => Promise<void>;
  persistChat: (chatId: string) => Promise<void>;
  clearAllChats: () => Promise<void>;
};

async function loadChat(chatId: string): Promise<Chat | null> {
  return storage.get<Chat>(STORAGE_KEYS.chat(chatId));
}

export const useChatsStore = create<ChatsState>((set, get) => ({
  index: [],
  activeChat: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const stored = await storage.get<ChatSummary[]>(STORAGE_KEYS.chatsIndex);
    const index = Array.isArray(stored) ? sortIndex(stored) : [];
    set({ index, hydrated: true });
  },

  createChat: async (title) => {
    const now = Date.now();
    const id = `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const chat: Chat = {
      id,
      title: title?.trim() || 'New chat',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    const index = upsertSummary(get().index, chat);
    set({ activeChat: chat, index });

    await Promise.all([
      storage.set(STORAGE_KEYS.chat(chat.id), chat),
      storage.set(STORAGE_KEYS.chatsIndex, index),
    ]);

    return chat;
  },

  openChat: async (id) => {
    const stored = await loadChat(id);
    if (!stored) return;

    const { chat, changed } = repairInterruptedMessages(stored);
    if (changed) {
      await storage.set(STORAGE_KEYS.chat(chat.id), chat);
    }

    set({ activeChat: chat });
  },

  closeChat: () => set({ activeChat: null }),

  renameChat: async (id, title) => {
    const active = get().activeChat;
    const stored = active?.id === id ? active : await loadChat(id);
    if (!stored) return;

    const next: Chat = {
      ...stored,
      title: title.trim() || 'New chat',
      updatedAt: Date.now(),
    };

    const index = upsertSummary(get().index, next);
    set({
      activeChat: active?.id === id ? next : active,
      index,
    });

    await Promise.all([
      storage.set(STORAGE_KEYS.chat(next.id), next),
      storage.set(STORAGE_KEYS.chatsIndex, index),
    ]);
  },

  deleteChat: async (id) => {
    const index = get().index.filter((item) => item.id !== id);
    const activeChat = get().activeChat?.id === id ? null : get().activeChat;

    set({ index, activeChat });

    await Promise.all([
      storage.remove(STORAGE_KEYS.chat(id)),
      storage.set(STORAGE_KEYS.chatsIndex, index),
    ]);
  },

  appendMessage: async (chatId, message) => {
    const active = get().activeChat;
    const stored = active?.id === chatId ? active : await loadChat(chatId);
    if (!stored) return;

    const isFirstUserMessage =
      stored.messages.length === 0 && message.role === 'user';

    const next: Chat = {
      ...stored,
      title:
        isFirstUserMessage && stored.title === 'New chat'
          ? makeChatTitle(message.content)
          : stored.title,
      messages: [...stored.messages, message],
      updatedAt: Date.now(),
    };

    const index = upsertSummary(get().index, next);
    set({ activeChat: next, index });

    await Promise.all([
      storage.set(STORAGE_KEYS.chat(next.id), next),
      storage.set(STORAGE_KEYS.chatsIndex, index),
    ]);
  },

  updateMessage: async (chatId, messageId, patch, options = {}) => {
    const active = get().activeChat;
    if (!active || active.id !== chatId) return;

    let changed = false;
    const messages = active.messages.map((message) => {
      if (message.id !== messageId) return message;
      changed = true;
      return { ...message, ...patch };
    });

    if (!changed) return;

    const next: Chat = { ...active, messages, updatedAt: Date.now() };
    set({ activeChat: next });

    if (options.persist) {
      await get().persistChat(chatId);
    }
  },

  persistChat: async (chatId) => {
    const active = get().activeChat;
    const chat = active?.id === chatId ? active : await loadChat(chatId);
    if (!chat) return;

    const index = upsertSummary(get().index, chat);
    set({ index });

    await Promise.all([
      storage.set(STORAGE_KEYS.chat(chat.id), chat),
      storage.set(STORAGE_KEYS.chatsIndex, index),
    ]);
  },

  clearAllChats: async () => {
    const keys = await storage.keysWithPrefix(STORAGE_KEYS.chatPrefix);
    await Promise.all([
      storage.removeMany(keys),
      storage.remove(STORAGE_KEYS.chatsIndex),
    ]);
    set({ index: [], activeChat: null });
  },
}));
