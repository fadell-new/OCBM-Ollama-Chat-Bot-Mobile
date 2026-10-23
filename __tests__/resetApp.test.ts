import AsyncStorage from '@react-native-async-storage/async-storage';

import { resetApp } from '@/lib/resetApp';
import { useChatsStore } from '@/store/chatsStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/store/settingsStore';

beforeEach(async () => {
  await AsyncStorage.clear();
  useSettingsStore.setState({ settings: DEFAULT_SETTINGS, hydrated: false });
  useChatsStore.setState({ index: [], activeChat: null, hydrated: false });
});

describe('resetApp', () => {
  test('removes stored data and resets both stores', async () => {
    await useSettingsStore.getState().update({
      onboardingComplete: true,
      theme: 'dark',
      personalContext: 'Remember this',
    });
    const chat = await useChatsStore.getState().createChat('Test');
    await useChatsStore.getState().appendMessage(chat.id, {
      id: 'm1',
      role: 'user',
      content: 'Hello',
      createdAt: 1,
      status: 'done',
    });

    expect((await AsyncStorage.getAllKeys()).length).toBeGreaterThan(0);

    await resetApp();

    expect(await AsyncStorage.getAllKeys()).toEqual([]);
    expect(useSettingsStore.getState().settings).toEqual(DEFAULT_SETTINGS);
    expect(useSettingsStore.getState().hydrated).toBe(true);
    expect(useChatsStore.getState().index).toEqual([]);
    expect(useChatsStore.getState().activeChat).toBeNull();
  });
});
