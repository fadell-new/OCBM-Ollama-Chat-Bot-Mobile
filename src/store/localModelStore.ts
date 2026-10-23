import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LOCAL_MODEL_URL =
  'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf';
export const LOCAL_MODEL_NAME = 'Qwen 2.5 0.5B (Q4)';
export const LOCAL_MODEL_SIZE_BYTES = 400 * 1024 * 1024; // ~400 MB

export type LocalModelStatus = 'not_downloaded' | 'downloading' | 'ready' | 'error';

export type LocalModelState = {
  status: LocalModelStatus;
  path: string | null;
  progress: number; // 0..1
  error: string | null;
  downloadedAt: number | null;
  setDownloading: (progress: number) => void;
  setReady: (path: string) => void;
  setError: (message: string) => void;
  reset: () => void;
};

export const useLocalModelStore = create<LocalModelState>()(
  persist(
    (set) => ({
      status: 'not_downloaded',
      path: null,
      progress: 0,
      error: null,
      downloadedAt: null,
      setDownloading: (progress) =>
        set({ status: 'downloading', progress, error: null }),
      setReady: (path) =>
        set({ status: 'ready', path, progress: 1, error: null, downloadedAt: Date.now() }),
      setError: (message) =>
        set({ status: 'error', error: message, progress: 0 }),
      reset: () =>
        set({ status: 'not_downloaded', path: null, progress: 0, error: null, downloadedAt: null }),
    }),
    {
      name: 'ocbm-local-model',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
