import AsyncStorage from '@react-native-async-storage/async-storage';

import { useChatsStore } from '@/store/chatsStore';

beforeEach(async () => {
  await AsyncStorage.clear();
  useChatsStore.setState({ index: [], activeChat: null, hydrated: false });
});

describe('chatsStore', () => {
  test('createChat adds to the index and persists', async () => {
    const chat = await useChatsStore.getState().createChat();
    expect(useChatsStore.getState().index).toHaveLength(1);
    expect(chat.title).toBe('New chat');
    expect(await AsyncStorage.getItem(`ocbm:chat:${chat.id}`)).not.toBeNull();
  });

  test('appendMessage updates the preview and title', async () => {
    const chat = await useChatsStore.getState().createChat();
    await useChatsStore.getState().appendMessage(chat.id, {
      id: 'm1',
      role: 'user',
      content: 'Hello there',
      createdAt: Date.now(),
    });

    const state = useChatsStore.getState();
    expect(state.activeChat?.messages).toHaveLength(1);
    expect(state.activeChat?.title).toBe('Hello there');
    expect(state.index[0].preview).toBe('Hello there');
    expect(state.index[0].messageCount).toBe(1);
  });

  test('preview falls back to the error text instead of No messages', async () => {
    const chat = await useChatsStore.getState().createChat();
    await useChatsStore.getState().appendMessage(chat.id, {
      id: 'm1',
      role: 'user',
      content: 'Hello there',
      createdAt: 1,
      status: 'done',
    });
    await useChatsStore.getState().appendMessage(chat.id, {
      id: 'm2',
      role: 'assistant',
      content: '',
      createdAt: 2,
      status: 'sending',
    });
    await useChatsStore.getState().updateMessage(
      chat.id,
      'm2',
      { status: 'error', error: 'Model not found.' },
      { persist: true }
    );

    const state = useChatsStore.getState();
    expect(state.index[0].preview).toBe('Model not found.');
    expect(state.index[0].messageCount).toBe(2);
  });

  test('preview uses the last message with content while a response is empty', async () => {
    const chat = await useChatsStore.getState().createChat();
    await useChatsStore.getState().appendMessage(chat.id, {
      id: 'm1',
      role: 'user',
      content: 'Hello there',
      createdAt: 1,
      status: 'done',
    });
    await useChatsStore.getState().appendMessage(chat.id, {
      id: 'm2',
      role: 'assistant',
      content: '',
      createdAt: 2,
      status: 'streaming',
    });
    await useChatsStore.getState().persistChat(chat.id);

    expect(useChatsStore.getState().index[0].preview).toBe('Hello there');
  });

  test('renameChat updates the title and index', async () => {
    const chat = await useChatsStore.getState().createChat();
    await useChatsStore.getState().renameChat(chat.id, 'Renamed');
    expect(useChatsStore.getState().activeChat?.title).toBe('Renamed');
    expect(useChatsStore.getState().index[0].title).toBe('Renamed');
  });

  test('deleteChat removes the chat and clears active chat', async () => {
    const chat = await useChatsStore.getState().createChat();
    await useChatsStore.getState().deleteChat(chat.id);
    expect(useChatsStore.getState().index).toHaveLength(0);
    expect(useChatsStore.getState().activeChat).toBeNull();
    expect(await AsyncStorage.getItem(`ocbm:chat:${chat.id}`)).toBeNull();
  });

  test('hydrate marks stale streaming messages as error on open', async () => {
    const chat = await useChatsStore.getState().createChat('Test');
    await useChatsStore.getState().appendMessage(chat.id, {
      id: 'm1',
      role: 'assistant',
      content: 'partial',
      createdAt: Date.now(),
      status: 'streaming',
    });

    useChatsStore.setState({ activeChat: null, index: [], hydrated: false });
    await useChatsStore.getState().hydrate();
    await useChatsStore.getState().openChat(chat.id);

    expect(useChatsStore.getState().activeChat?.messages[0].status).toBe('error');
    expect(useChatsStore.getState().activeChat?.messages[0].error).toBeTruthy();
  });

  test('clearAllChats removes every chat', async () => {
    const first = await useChatsStore.getState().createChat();
    const second = await useChatsStore.getState().createChat();
    await useChatsStore.getState().clearAllChats();
    expect(useChatsStore.getState().index).toHaveLength(0);
    expect(useChatsStore.getState().activeChat).toBeNull();
    expect(await AsyncStorage.getItem(`ocbm:chat:${first.id}`)).toBeNull();
    expect(await AsyncStorage.getItem(`ocbm:chat:${second.id}`)).toBeNull();
  });
});
