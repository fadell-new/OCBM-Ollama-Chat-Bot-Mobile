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

  let accumulated = '';

  const onTokenCallback = (data: { token?: string }) => {
    if (data.token) {
      accumulated += data.token;
      options.onToken(data.token);
    }
  };

  let result: Awaited<ReturnType<typeof ctx.completion>> | undefined;
  let usedFlattenedPrompt = false;

  let aborted = false;
  const onAbort = () => {
    aborted = true;
    void ctx.stopCompletion().catch(() => undefined);
  };
  options.signal?.addEventListener('abort', onAbort, { once: true });

  try {
    result = await ctx.completion(
      {
        messages: completionMessages,
        n_predict: 256,
        temperature: 0.65,
        stop: entry.model.stopTokens.concat(['\nUser:', '\nAssistant:', '\n\nUser:', '\n\nAssistant:']),
        ...(entry.model.thinking ? { enable_thinking: false } : {}),
      },
      onTokenCallback
    );
  } catch (firstError) {
    const message =
      firstError instanceof Error ? firstError.message.toLowerCase() : String(firstError).toLowerCase();

    if (
      /parser|template|format/i.test(message) ||
      /does not support chat/i.test(message)
    ) {
      // Fallback: bypass the model's chat template (which failed to render)
      // by flattening the conversation into a plain prompt. Less aligned to the
      // model's training format, but never crashes.
      usedFlattenedPrompt = true;
      const flatPrompt =
        completionMessages.map((message, index) => {
          const role =
            message.role === 'assistant'
              ? 'Assistant'
              : message.role === 'system'
                ? 'System'
                : 'User';
          return `${role}: ${message.content}`;
        })
          .join('\n') + '\nAssistant:';

      try {
        result = await ctx.completion(
          {
            prompt: flatPrompt,
            jinja: false,
            n_predict: 256,
            temperature: 0.65,
            stop: entry.model.stopTokens.concat(['\nUser:', '\nAssistant:', '\n\nUser:', '\n\nAssistant:']),
          },
          onTokenCallback
        );
      } catch (secondError) {
        throw secondError;
      }
    } else {
      throw firstError;
    }
  }

  options.signal?.removeEventListener('abort', onAbort);

  if (aborted || options.signal?.aborted) {
    throw new Error('Aborted');
  }

  if (usedFlattenedPrompt) {
    useLocalModelStore
      .getState()
      .setLastError(
        'Chat template unsupported; using basic prompt mode. Reply quality may drop.'
      );
  }

  return (result?.text ?? accumulated).trim() || accumulated;
}
