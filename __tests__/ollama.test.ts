import { OllamaClient, OllamaError } from '@/api/ollama';

const encoder = new TextEncoder();

function streamResponse(chunks: string[], status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    body: {
      getReader: () => {
        let index = 0;
        return {
          read: async () =>
            index < chunks.length
              ? { done: false, value: encoder.encode(chunks[index++]) }
              : { done: true, value: undefined },
        };
      },
    },
    text: async () => chunks.join(''),
  } as unknown as Response;
}

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as unknown as Response;
}

describe('OllamaClient', () => {
  test('rejects an invalid base URL', () => {
    expect(() => new OllamaClient('192.168.1.10:11434')).toThrow(OllamaError);
  });

  test('parses NDJSON split across chunks', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      streamResponse([
        '{"message":{"content":"Hel',
        'lo"},"done":false}\n{"message":{"content":" world"},"done":true}\n',
      ])
    );
    const client = new OllamaClient('http://x', fetchMock as never);
    const tokens: string[] = [];
    const result = await client.chat(
      { model: 'm', messages: [{ role: 'user', content: 'Hi' }] },
      { onToken: (token) => tokens.push(token) }
    );
    expect(result.content).toBe('Hello world');
    expect(tokens.join('')).toBe('Hello world');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://x/api/chat',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('throws a server error when the stream reports an error', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(streamResponse(['{"error":"model not loaded"}\n']));
    const client = new OllamaClient('http://x', fetchMock as never);
    await expect(
      client.chat({ model: 'm', messages: [] }, { onToken: () => {} })
    ).rejects.toMatchObject({ code: 'server' });
  });

  test('maps 404 responses to model_not_found', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(jsonResponse({ error: 'not found' }, 404));
    const client = new OllamaClient('http://x', fetchMock as never);
    await expect(client.listModels()).rejects.toMatchObject({ code: 'model_not_found' });
  });

  test('maps network failures to network', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    const client = new OllamaClient('http://x', fetchMock as never);
    await expect(client.listModels()).rejects.toMatchObject({ code: 'network' });
  });

  test('maps aborts to aborted', async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
    const client = new OllamaClient('http://x', fetchMock as never);
    await expect(client.listModels()).rejects.toMatchObject({ code: 'aborted' });
  });

  test('maps /api/tags into models', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      jsonResponse({
        models: [
          {
            name: 'qwen2.5:3b',
            size: 1929911040,
            modified_at: '2026-01-01T00:00:00Z',
            details: { parameter_size: '3.1B', quantization_level: 'Q4_K_M' },
            capabilities: ['completion'],
          },
        ],
      })
    );
    const client = new OllamaClient('http://x', fetchMock as never);
    const models = await client.listModels();
    expect(models).toEqual([
      {
        name: 'qwen2.5:3b',
        size: 1929911040,
        modifiedAt: '2026-01-01T00:00:00Z',
        parameterSize: '3.1B',
        quantization: 'Q4_K_M',
        capabilities: ['completion'],
      },
    ]);
  });

  test('testConnection returns latency and model count', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      jsonResponse({ models: [{ name: 'a' }, { name: 'b' }] })
    );
    const client = new OllamaClient('http://x', fetchMock as never);
    const result = await client.testConnection();
    expect(result.modelCount).toBe(2);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  test('pullModel reports progress', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      streamResponse([
        '{"status":"pulling manifest"}\n',
        '{"status":"downloading","completed":50,"total":100}\n',
        '{"status":"success"}\n',
      ])
    );
    const client = new OllamaClient('http://x', fetchMock as never);
    const events: string[] = [];
    await client.pullModel('qwen2.5:3b', {
      onProgress: (progress) => events.push(progress.status),
    });
    expect(events).toEqual(['pulling manifest', 'downloading', 'success']);
  });

  test('deleteModel sends the model name', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({}));
    const client = new OllamaClient('http://x', fetchMock as never);
    await client.deleteModel('qwen2.5:3b');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.model).toBe('qwen2.5:3b');
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
  });

  test('showModel reads capabilities', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      jsonResponse({ capabilities: ['completion', 'vision'], details: { family: 'qwen' } })
    );
    const client = new OllamaClient('http://x', fetchMock as never);
    const details = await client.showModel('llava');
    expect(details.capabilities).toEqual(['completion', 'vision']);
  });
});
