import * as FileSystem from 'expo-file-system/legacy';
import { initLlama, type LlamaContext } from 'llama.rn';

import { useLocalModelStore } from '@/store/localModelStore';

let context: LlamaContext | null = null;
let currentModelPath: string | null = null;

export async function isLocalModelReady(): Promise<boolean> {
  const state = useLocalModelStore.getState();
  if (state.status !== 'ready' || !state.path) return false;
  const info = await FileSystem.getInfoAsync(state.path);
  return info.exists;
}

export async function loadLocalModel(): Promise<LlamaContext | null> {
  const state = useLocalModelStore.getState();
  if (state.status !== 'ready' || !state.path) return null;

  if (context && currentModelPath === state.path) {
    return context;
  }

  // Unload previous
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
    context = await initLlama({ model: state.path, n_ctx: 2048, n_threads: 4 });
    currentModelPath = state.path;
    return context;
  } catch (error) {
    useLocalModelStore.getState().setError(
      error instanceof Error ? error.message : 'Failed to load local model'
    );
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
  prompt: string;
  onToken: (token: string) => void;
  signal?: AbortSignal;
};

export async function generateLocal(options: LocalGenerateOptions): Promise<string> {
  const ctx = await loadLocalModel();
  if (!ctx) {
    throw new Error('Local model is not ready');
  }

  if (options.signal?.aborted) {
    throw new Error('Aborted');
  }

  let accumulated = '';
  const result = await ctx.completion(
    {
      messages: [{ role: 'user', content: options.prompt }],
      n_predict: 512,
      temperature: 0.7,
      stop: ['</s>', '<|im_end|>', '<|endoftext|>'],
    },
    (data) => {
      if (data.token) {
        accumulated += data.token;
        options.onToken(data.token);
      }
    }
  );

  if (options.signal?.aborted) {
    try {
      await ctx.stopCompletion();
    } catch {
      // ignore
    }
  }

  return result?.text ?? accumulated;
}
