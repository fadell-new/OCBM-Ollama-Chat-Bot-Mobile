import * as FileSystem from 'expo-file-system/legacy';
import { initLlama, type LlamaContext } from 'llama.rn';

import { getModelById, type DeviceModel } from '@/lib/modelCatalog';
import { useLocalModelStore } from '@/store/localModelStore';

let context: LlamaContext | null = null;
let currentModelPath: string | null = null;

type ActiveEntry = {
  model: DeviceModel;
  path: string;
};

function getActiveEntry(): ActiveEntry | null {
  const state = useLocalModelStore.getState();

  if (state.activeModelId) {
    const model = getModelById(state.activeModelId);
    const record = state.installed[state.activeModelId];
    if (model && record) {
      return { model, path: record.path };
    }
  }

  const firstId = Object.keys(state.installed)[0];
  if (!firstId) return null;

  const model = getModelById(firstId);
  const record = state.installed[firstId];
  if (!model || !record) return null;

  return { model, path: record.path };
}

export function getActiveModel(): DeviceModel | null {
  return getActiveEntry()?.model ?? null;
}

export async function isLocalModelReady(): Promise<boolean> {
  const entry = getActiveEntry();
  if (!entry) return false;
  const info = await FileSystem.getInfoAsync(entry.path);
  return info.exists;
}

export async function loadLocalModel(): Promise<LlamaContext | null> {
  const entry = getActiveEntry();
  if (!entry) return null;

  if (context && currentModelPath === entry.path) {
    return context;
  }

  if (context) {
    try {
      await context.release();
    } catch {
      // ignore
    }
    context = null;
    currentModelPath = null;
  }

  try {
    context = await initLlama({ model: entry.path, n_ctx: 2048, n_threads: 4 });
    currentModelPath = entry.path;
    useLocalModelStore.getState().setLastError(null);
    return context;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load local model';
    useLocalModelStore.getState().setLastError(message);
    context = null;
    currentModelPath = null;
    return null;
  }
}

export async function unloadLocalModel(): Promise<void> {
  if (context) {
    try {
      await context.release();
    } catch {
      // ignore
    }
    context = null;
    currentModelPath = null;
  }
}

export type LocalGenerateOptions = {
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  prompt?: string;
  onToken: (token: string) => void;
  signal?: AbortSignal;
};

export async function generateLocal(options: LocalGenerateOptions): Promise<string> {
  const entry = getActiveEntry();
  if (!entry) {
    throw new Error('No on-device model is installed');
  }

  const ctx = await loadLocalModel();
  if (!ctx) {
    throw new Error(useLocalModelStore.getState().lastError ?? 'Local model is not ready');
  }

  if (options.signal?.aborted) {
    throw new Error('Aborted');
  }

  const completionMessages =
    options.messages && options.messages.length > 0
      ? options.messages
      : options.prompt
        ? [{ role: 'user' as const, content: options.prompt }]
        : [];

  if (completionMessages.length === 0) {
    throw new Error('Nothing to generate.');
  }

  let aborted = false;
  const onAbort = () => {
    aborted = true;
    void ctx.stopCompletion().catch(() => undefined);
  };
  options.signal?.addEventListener('abort', onAbort, { once: true });

  let accumulated = '';

  try {
    const result = await ctx.completion(
      {
        messages: completionMessages,
        n_predict: 512,
        temperature: 0.7,
        stop: entry.model.stopTokens,
        ...(entry.model.thinking ? { enable_thinking: false } : {}),
      },
      (data) => {
        if (data.token) {
          accumulated += data.token;
          options.onToken(data.token);
        }
      }
    );

    if (aborted || options.signal?.aborted) {
      throw new Error('Aborted');
    }

    return result?.text ?? accumulated;
  } finally {
    options.signal?.removeEventListener('abort', onAbort);
  }
}
