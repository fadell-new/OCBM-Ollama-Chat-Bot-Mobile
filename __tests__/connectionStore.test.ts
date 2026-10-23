import { useConnectionStore } from '@/store/connectionStore';

const mockClient = {
  testConnection: jest.fn().mockResolvedValue({ latencyMs: 12, modelCount: 2 }),
  listModels: jest.fn().mockResolvedValue([
    { name: 'qwen2.5:3b', size: 1000, parameterSize: '3B', capabilities: ['completion'] },
  ]),
  pullModel: jest.fn().mockImplementation(async (_name, handlers) => {
    handlers.onProgress({ status: 'pulling manifest' });
    handlers.onProgress({ status: 'downloading', completed: 50, total: 100 });
    handlers.onProgress({ status: 'success' });
  }),
  deleteModel: jest.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  jest.clearAllMocks();
  useConnectionStore.setState({
    status: 'unknown',
    models: [],
    error: undefined,
    latencyMs: undefined,
    pulling: null,
  });
});

describe('connectionStore', () => {
  test('test success sets online + latency', async () => {
    await useConnectionStore.getState().test('http://x', mockClient as never);
    const state = useConnectionStore.getState();
    expect(state.status).toBe('online');
    expect(state.latencyMs).toBe(12);
    expect(state.error).toBeUndefined();
  });

  test('test failure sets offline + error', async () => {
    const failing = {
      testConnection: jest.fn().mockRejectedValue({ code: 'network', message: 'no route' }),
    };
    await useConnectionStore.getState().test('http://x', failing as never);
    const state = useConnectionStore.getState();
    expect(state.status).toBe('offline');
    expect(state.error).toContain('no route');
  });

  test('refresh loads models and marks the connection online', async () => {
    const models = await useConnectionStore.getState().refresh('http://x', mockClient as never);
    expect(models).toHaveLength(1);
    expect(useConnectionStore.getState().models[0].name).toBe('qwen2.5:3b');
    expect(useConnectionStore.getState().status).toBe('online');
  });

  test('startPull reports progress and refreshes on success', async () => {
    await useConnectionStore.getState().startPull('http://x', 'qwen2.5:3b', mockClient as never);
    expect(useConnectionStore.getState().pulling).toBeNull();
    expect(useConnectionStore.getState().models).toHaveLength(1);
    expect(mockClient.pullModel).toHaveBeenCalled();
  });

  test('removeModel deletes and refreshes', async () => {
    await useConnectionStore.getState().removeModel('http://x', 'qwen2.5:3b', mockClient as never);
    expect(mockClient.deleteModel).toHaveBeenCalledWith('qwen2.5:3b');
    expect(mockClient.listModels).toHaveBeenCalled();
  });
});
