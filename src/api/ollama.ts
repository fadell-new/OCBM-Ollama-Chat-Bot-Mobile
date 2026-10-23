import { fetch as expoFetch } from 'expo/fetch';

import { parseNdjsonChunk } from '@/lib/ndjson';
import { normalizeBaseUrl } from '@/lib/validation';
import type {
  ModelDetails,
  OllamaMessage,
  OllamaModel,
  PullProgress,
  TestResult,
} from '@/types';

export type OllamaErrorCode =
  | 'network'
  | 'timeout'
  | 'model_not_found'
  | 'server'
  | 'bad_request'
  | 'aborted'
  | 'unknown';

export class OllamaError extends Error {
  readonly code: OllamaErrorCode;
  readonly status?: number;

  constructor(code: OllamaErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'OllamaError';
    this.code = code;
    this.status = status;
    Object.setPrototypeOf(this, OllamaError.prototype);
  }
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type ChatRequest = {
  model: string;
  messages: OllamaMessage[];
};

export type ChatHandlers = {
  onToken: (token: string) => void;
  signal?: AbortSignal;
};

export type PullHandlers = {
  onProgress: (progress: PullProgress) => void;
  signal?: AbortSignal;
};

const TEST_TIMEOUT_MS = 8_000;
const CHAT_TIMEOUT_MS = 120_000;

type TagsResponse = {
  models?: Array<{
    name?: string;
    size?: number;
    modified_at?: string;
    capabilities?: string[];
    details?: {
      parameter_size?: string;
      quantization_level?: string;
    };
  }>;
};

export class OllamaClient {
  readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(baseUrl: string, fetchImpl?: FetchLike) {
    const normalized = normalizeBaseUrl(baseUrl);
    if (!normalized) {
      throw new OllamaError(
        'bad_request',
        'Enter a valid Ollama address starting with http:// or https://.'
      );
    }
    this.baseUrl = normalized;
    this.fetchImpl = fetchImpl ?? (expoFetch as unknown as FetchLike);
  }

  async testConnection(): Promise<TestResult> {
    const startedAt = Date.now();
    const models = await this.listModels();
    return { latencyMs: Date.now() - startedAt, modelCount: models.length };
  }

  async listModels(): Promise<OllamaModel[]> {
    const response = await this.request('/api/tags', { method: 'GET' }, TEST_TIMEOUT_MS);
    let data: TagsResponse;
    try {
      data = (await response.json()) as TagsResponse;
    } catch {
      throw new OllamaError('server', 'Ollama returned an unreadable model list.');
    }

    return (data.models ?? []).map((model) => ({
      name: model.name ?? 'unknown',
      size: model.size ?? 0,
      modifiedAt: model.modified_at,
      parameterSize: model.details?.parameter_size,
      quantization: model.details?.quantization_level,
      capabilities: model.capabilities ?? [],
    }));
  }

  async chat(
    input: ChatRequest,
    handlers: ChatHandlers
  ): Promise<{ content: string }> {
    const response = await this.request(
      '/api/chat',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: input.model,
          messages: input.messages,
          stream: true,
        }),
        signal: handlers.signal,
      },
      CHAT_TIMEOUT_MS
    );

    let content = '';

    try {
      await this.readStream(
        response,
        (line) => {
          const event = this.parseEvent(line);
          if (event.error) {
            throw new OllamaError('server', String(event.error));
          }
          const token = event.message?.content;
          if (typeof token === 'string' && token.length > 0) {
            content += token;
            handlers.onToken(token);
          }
        },
        handlers.signal
      );
    } catch (error) {
      throw this.mapStreamError(error);
    }

    return { content };
  }

  async pullModel(name: string, handlers: PullHandlers): Promise<void> {
    const response = await this.request(
      '/api/pull',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: name, name, stream: true }),
        signal: handlers.signal,
      },
      0
    );

    try {
      await this.readStream(
        response,
        (line) => {
          const event = this.parseEvent(line);
          if (event.error) {
            throw new OllamaError('server', String(event.error));
          }
          handlers.onProgress({
            status: typeof event.status === 'string' ? event.status : 'working',
            completed: typeof event.completed === 'number' ? event.completed : undefined,
            total: typeof event.total === 'number' ? event.total : undefined,
          });
        },
        handlers.signal
      );
    } catch (error) {
      throw this.mapStreamError(error);
    }
  }

  async deleteModel(name: string): Promise<void> {
    await this.request(
      '/api/delete',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: name, name }),
      },
      TEST_TIMEOUT_MS
    );
  }

  async showModel(name: string): Promise<ModelDetails> {
    const response = await this.request(
      '/api/show',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: name, name }),
      },
      TEST_TIMEOUT_MS
    );

    try {
      return (await response.json()) as ModelDetails;
    } catch {
      throw new OllamaError('server', 'Ollama returned unreadable model details.');
    }
  }

  private async request(
    path: string,
    init: RequestInit = {},
    timeoutMs = CHAT_TIMEOUT_MS
  ): Promise<Response> {
    const controller = new AbortController();
    const externalSignal = init.signal ?? undefined;
    let timedOut = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);
    }

    const onExternalAbort = () => controller.abort();

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', onExternalAbort, { once: true });
      }
    }

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw await this.responseError(response);
      }

      return response;
    } catch (error) {
      if (error instanceof OllamaError) throw error;

      if ((error as Error | undefined)?.name === 'AbortError') {
        throw new OllamaError(
          timedOut ? 'timeout' : 'aborted',
          timedOut ? 'Ollama took too long to respond.' : 'Request cancelled.'
        );
      }

      throw new OllamaError(
        'network',
        'Cannot reach Ollama. Check the address and make sure Ollama is running.'
      );
    } finally {
      if (timer) clearTimeout(timer);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    }
  }

  private async readStream(
    response: Response,
    onLine: (line: string) => void,
    signal?: AbortSignal
  ): Promise<void> {
    if (!response.body) {
      throw new OllamaError('server', 'Ollama returned an empty response.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      for (;;) {
        if (signal?.aborted) {
          throw new OllamaError('aborted', 'Request cancelled.');
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parsed = parseNdjsonChunk(buffer);
        buffer = parsed.rest;

        for (const line of parsed.lines) {
          onLine(line);
        }
      }

      buffer += decoder.decode();
      const tail = buffer.trim();
      if (tail) onLine(tail);
    } finally {
      reader.releaseLock?.();
    }
  }

  private parseEvent(line: string): {
    error?: unknown;
    status?: unknown;
    completed?: unknown;
    total?: unknown;
    message?: { content?: string };
  } {
    try {
      return JSON.parse(line) as ReturnType<OllamaClient['parseEvent']>;
    } catch {
      return {};
    }
  }

  private mapStreamError(error: unknown): OllamaError {
    if (error instanceof OllamaError) return error;

    if ((error as Error | undefined)?.name === 'AbortError') {
      return new OllamaError('aborted', 'Request cancelled.');
    }

    return new OllamaError('server', 'The response stream was interrupted. Try again.');
  }

  private async responseError(response: Response): Promise<OllamaError> {
    let detail = '';
    try {
      detail = (await response.text()).slice(0, 300).trim();
    } catch {
      // Ignore bodies that cannot be read.
    }

    if (response.status === 404) {
      return new OllamaError(
        'model_not_found',
        'Model not found. Download it in Settings / Model Management.',
        404
      );
    }

    if (response.status === 400) {
      return new OllamaError('bad_request', detail || 'Ollama rejected the request.', 400);
    }

    if (response.status >= 500) {
      return new OllamaError('server', 'Ollama hit a server error. Try again.', response.status);
    }

    return new OllamaError(
      'unknown',
      detail || `Ollama returned status ${response.status}.`,
      response.status
    );
  }
}
