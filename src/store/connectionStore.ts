import { create } from 'zustand';

import { OllamaClient, OllamaError, type PullHandlers } from '@/api/ollama';
import type { OllamaModel, PullProgress, TestResult } from '@/types';

export type ConnectionStatus = 'unknown' | 'testing' | 'online' | 'offline';

export type PullingState = {
  name: string;
  status: string;
  completed?: number;
  total?: number;
} | null;

export type ConnectionClient = Pick<
  OllamaClient,
  'testConnection' | 'listModels' | 'pullModel' | 'deleteModel'
>;

function messageFrom(error: unknown): string {
  if (error instanceof OllamaError) return error.message;

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return 'Could not reach Ollama. Check the address and make sure the server is running.';
}

type ConnectionState = {
  status: ConnectionStatus;
  latencyMs?: number;
  models: OllamaModel[];
  error?: string;
  pulling: PullingState;
  lastCheckedAt?: number;
  test: (baseUrl: string, client?: ConnectionClient) => Promise<boolean>;
  refresh: (baseUrl: string, client?: ConnectionClient) => Promise<OllamaModel[]>;
  startPull: (baseUrl: string, name: string, client?: ConnectionClient) => Promise<void>;
  cancelPull: () => void;
  removeModel: (baseUrl: string, name: string, client?: ConnectionClient) => Promise<void>;
  reset: () => void;
};

let activePull: AbortController | null = null;

const initialState = {
  status: 'unknown' as ConnectionStatus,
  latencyMs: undefined,
  models: [] as OllamaModel[],
  error: undefined,
  pulling: null as PullingState,
  lastCheckedAt: undefined,
};

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  ...initialState,

  test: async (baseUrl, client) => {
    set({ status: 'testing', error: undefined });

    try {
      const resolved = client ?? new OllamaClient(baseUrl);
      const result: TestResult = await resolved.testConnection();
      set({
        status: 'online',
        latencyMs: result.latencyMs,
        error: undefined,
        lastCheckedAt: Date.now(),
      });
      return true;
    } catch (error) {
      set({
        status: 'offline',
        latencyMs: undefined,
        error: messageFrom(error),
        lastCheckedAt: Date.now(),
      });
      return false;
    }
  },

  refresh: async (baseUrl, client) => {
    try {
      const resolved = client ?? new OllamaClient(baseUrl);
      const models = await resolved.listModels();
      set({ models, status: 'online', error: undefined });
      return models;
    } catch (error) {
      set({ status: 'offline', error: messageFrom(error) });
      return [];
    }
  },

  startPull: async (baseUrl, name, client) => {
    activePull?.abort();
    const controller = new AbortController();
    activePull = controller;

    set({ pulling: { name, status: 'starting' }, error: undefined });

    try {
      const resolved = client ?? new OllamaClient(baseUrl);

      await resolved.pullModel(name, {
        signal: controller.signal,
        onProgress: (progress: PullProgress) => {
          set({ pulling: { name, ...progress } });
        },
      });

      activePull = null;
      set({ pulling: null });
      await get().refresh(baseUrl, client);
    } catch (error) {
      activePull = null;

      const aborted =
        controller.signal.aborted ||
        (error instanceof OllamaError && error.code === 'aborted');

      if (aborted) {
        set({ pulling: null });
        return;
      }

      set({ pulling: null, error: messageFrom(error) });
    }
  },

  cancelPull: () => {
    activePull?.abort();
    activePull = null;
    set({ pulling: null });
  },

  removeModel: async (baseUrl, name, client) => {
    try {
      const resolved = client ?? new OllamaClient(baseUrl);
      await resolved.deleteModel(name);
      await get().refresh(baseUrl, client);
    } catch (error) {
      set({ error: messageFrom(error) });
    }
  },

  reset: () => {
    activePull?.abort();
    activePull = null;
    set(initialState);
  },
}));

export { messageFrom as connectionErrorMessage };
