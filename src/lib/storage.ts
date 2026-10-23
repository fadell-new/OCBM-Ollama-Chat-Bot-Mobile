import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_PREFIX = 'ocbm:';

export const STORAGE_KEYS = {
  settings: 'ocbm:settings',
  chatsIndex: 'ocbm:chats',
  chat: (id: string) => `ocbm:chat:${id}`,
  chatPrefix: 'ocbm:chat:',
  version: 'ocbm:version',
} as const;

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async removeMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await AsyncStorage.multiRemove(keys);
  },

  async keysWithPrefix(prefix: string): Promise<string[]> {
    const keys = await AsyncStorage.getAllKeys();
    return keys.filter((key) => key.startsWith(prefix));
  },

  async clearAll(): Promise<void> {
    const keys = await this.keysWithPrefix(STORAGE_PREFIX);
    await this.removeMany(keys);
  },
};
