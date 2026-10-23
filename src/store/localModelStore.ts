import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type InstalledModel = {
  path: string;
  downloadedAt: number;
};

export type ModelDownload = {
  status: 'downloading' | 'error';
  progress: number;
  error: string | null;
};

type PersistedState = {
  installed: Record<string, InstalledModel>;
  activeModelId: string | null;
};

export type LocalModelState = PersistedState & {
  downloads: Record<string, ModelDownload>;
  lastError: string | null;

  startDownload: (id: string) => void;
  setProgress: (id: string, progress: number) => void;
  setInstalled: (id: string, path: string) => void;
  setDownloadError: (id: string, message: string) => void;
  clearDownload: (id: string) => void;
  removeInstalled: (id: string) => void;
  setActive: (id: string | null) => void;
  setLastError: (message: string | null) => void;
  reset: () => void;
};

const LEGACY_MODEL_ID = 'qwen2.5-0.5b';

export const useLocalModelStore = create<LocalModelState>()(
  persist(
    (set) => ({
      installed: {},
      activeModelId: null,
      downloads: {},
      lastError: null,

      startDownload: (id) =>
        set((state) => ({
          downloads: {
            ...state.downloads,
            [id]: { status: 'downloading', progress: 0, error: null },
          },
          lastError: null,
        })),

      setProgress: (id, progress) =>
        set((state) => ({
          downloads: {
            ...state.downloads,
            [id]: { status: 'downloading', progress, error: null },
          },
        })),

      setInstalled: (id, path) =>
        set((state) => {
          const downloads = { ...state.downloads };
          delete downloads[id];
          return {
            installed: {
              ...state.installed,
              [id]: { path, downloadedAt: Date.now() },
            },
            activeModelId: state.activeModelId ?? id,
            downloads,
            lastError: null,
          };
        }),

      setDownloadError: (id, message) =>
        set((state) => ({
          downloads: {
            ...state.downloads,
            [id]: { status: 'error', progress: 0, error: message },
          },
        })),

      clearDownload: (id) =>
        set((state) => {
          const downloads = { ...state.downloads };
          delete downloads[id];
          return { downloads };
        }),

      removeInstalled: (id) =>
        set((state) => {
          const installed = { ...state.installed };
          delete installed[id];
          const downloads = { ...state.downloads };
          delete downloads[id];
          return {
            installed,
            downloads,
            activeModelId: state.activeModelId === id ? null : state.activeModelId,
          };
        }),

      setActive: (id) => set({ activeModelId: id }),

      setLastError: (message) => set({ lastError: message }),

      reset: () =>
        set({ installed: {}, activeModelId: null, downloads: {}, lastError: null }),
    }),
    {
      name: 'ocbm-local-model',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        installed: state.installed,
        activeModelId: state.activeModelId,
      }),
      migrate: (persistedState, version): PersistedState => {
        const data = (persistedState ?? {}) as Record<string, unknown>;

        if (version < 2) {
          const path = typeof data.path === 'string' ? data.path : null;
          const downloadedAt =
            typeof data.downloadedAt === 'number' ? data.downloadedAt : Date.now();
          const wasReady = data.status === 'ready' && path !== null;
          return {
            installed: wasReady ? { [LEGACY_MODEL_ID]: { path, downloadedAt } } : {},
            activeModelId: wasReady ? LEGACY_MODEL_ID : null,
          };
        }

        return {
          installed: (data.installed as Record<string, InstalledModel>) ?? {},
          activeModelId: (data.activeModelId as string | null) ?? null,
        };
      },
    }
  )
);
