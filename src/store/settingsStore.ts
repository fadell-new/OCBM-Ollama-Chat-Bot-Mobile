import { create } from 'zustand';

import { STORAGE_KEYS, storage } from '@/lib/storage';
import type { Settings } from '@/types';

export const DEFAULT_SETTINGS: Settings = {
  baseUrl: '',
  defaultModel: '',
  theme: 'system',
  systemPrompt: '',
  personalContext: '',
  profile: {
    name: 'You',
    email: '',
    phone: '',
  },
  onboardingComplete: false,
  aiSource: 'auto',
  dateTimeMode: 'device',
  dateTimeOverride: '',
  dateTimeTimeZone: '',
};

function mergeSettings(raw: Partial<Settings> | null): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...(raw ?? {}),
    profile: {
      ...DEFAULT_SETTINGS.profile,
      ...(raw?.profile ?? {}),
    },
  };
}

type SettingsState = {
  settings: Settings;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  update: (partial: Partial<Settings>) => Promise<void>;
  reset: () => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const stored = await storage.get<Partial<Settings>>(STORAGE_KEYS.settings);
    set({ settings: mergeSettings(stored), hydrated: true });
  },

  update: async (partial) => {
    const current = get().settings;
    const next = mergeSettings({
      ...current,
      ...partial,
      profile: {
        ...current.profile,
        ...(partial.profile ?? {}),
      },
    });

    set({ settings: next });
    await storage.set(STORAGE_KEYS.settings, next);
  },

  reset: async () => {
    set({ settings: DEFAULT_SETTINGS, hydrated: true });
    await storage.remove(STORAGE_KEYS.settings);
  },
}));
