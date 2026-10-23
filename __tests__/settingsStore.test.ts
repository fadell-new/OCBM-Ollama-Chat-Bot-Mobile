import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_SETTINGS, useSettingsStore } from '@/store/settingsStore';

beforeEach(async () => {
  await AsyncStorage.clear();
  useSettingsStore.setState({ settings: DEFAULT_SETTINGS, hydrated: false });
});

describe('settingsStore', () => {
  test('hydrate returns defaults when storage is empty', async () => {
    await useSettingsStore.getState().hydrate();
    expect(useSettingsStore.getState().settings.baseUrl).toBe('');
    expect(useSettingsStore.getState().settings.profile.name).toBe('You');
    expect(useSettingsStore.getState().hydrated).toBe(true);
  });

  test('hydrate merges stored values with defaults', async () => {
    await AsyncStorage.setItem(
      'ocbm:settings',
      JSON.stringify({ baseUrl: 'http://x:11434', profile: { email: 'a@b.com' } })
    );
    await useSettingsStore.getState().hydrate();
    const settings = useSettingsStore.getState().settings;
    expect(settings.baseUrl).toBe('http://x:11434');
    expect(settings.profile.email).toBe('a@b.com');
    expect(settings.profile.name).toBe('You');
  });

  test('update persists merged settings', async () => {
    await useSettingsStore.getState().update({ baseUrl: 'http://x:11434' });
    expect(useSettingsStore.getState().settings.baseUrl).toBe('http://x:11434');

    const raw = await AsyncStorage.getItem('ocbm:settings');
    expect(JSON.parse(raw!).baseUrl).toBe('http://x:11434');
  });

  test('update merges profile fields instead of replacing them', async () => {
    await useSettingsStore.getState().update({ profile: { name: 'Fadel', email: 'f@x.com', phone: '' } });
    await useSettingsStore.getState().update({ profile: { name: 'Fadel', email: 'f@x.com', phone: '0812345678' } });
    expect(useSettingsStore.getState().settings.profile).toEqual({
      name: 'Fadel',
      email: 'f@x.com',
      phone: '0812345678',
    });
  });

  test('reset restores defaults and removes storage', async () => {
    await useSettingsStore.getState().update({ baseUrl: 'http://x:11434' });
    await useSettingsStore.getState().reset();
    expect(useSettingsStore.getState().settings.baseUrl).toBe('');
    expect(await AsyncStorage.getItem('ocbm:settings')).toBeNull();
  });
});
