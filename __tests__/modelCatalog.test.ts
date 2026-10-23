import { LOCAL_MODELS, recommendModel } from '@/lib/modelCatalog';

const GB = 1024 ** 3;

describe('LOCAL_MODELS', () => {
  test('contains only models up to 2B parameters', () => {
    for (const model of LOCAL_MODELS) {
      const params = Number.parseFloat(model.params);
      expect(Number.isFinite(params)).toBe(true);
      expect(params).toBeLessThanOrEqual(2);
    }
  });

  test('has unique ids and realistic sizes', () => {
    const ids = new Set(LOCAL_MODELS.map((model) => model.id));
    expect(ids.size).toBe(LOCAL_MODELS.length);
    for (const model of LOCAL_MODELS) {
      expect(model.sizeBytes).toBeGreaterThan(0);
      expect(model.url.startsWith('https://')).toBe(true);
      expect(model.fileName.endsWith('.gguf')).toBe(true);
    }
  });
});

describe('recommendModel', () => {
  test('picks the smallest model when RAM is unknown', () => {
    expect(recommendModel(null).id).toBe('qwen2.5-0.5b');
  });

  test('picks the smallest model on low-RAM devices', () => {
    expect(recommendModel(3 * GB).id).toBe('qwen2.5-0.5b');
    expect(recommendModel(4 * GB).id).toBe('qwen2.5-0.5b');
  });

  test('picks the Thai 1B model around 6GB', () => {
    expect(recommendModel(6 * GB).id).toBe('typhoon2-1b');
    expect(recommendModel(6.9 * GB).id).toBe('typhoon2-1b');
  });

  test('picks the 1.5B model around 8GB', () => {
    expect(recommendModel(8 * GB).id).toBe('qwen2.5-1.5b');
    expect(recommendModel(9.9 * GB).id).toBe('qwen2.5-1.5b');
  });

  test('picks the 2B model on high-RAM devices', () => {
    expect(recommendModel(12 * GB).id).toBe('gemma-2-2b');
    expect(recommendModel(16 * GB).id).toBe('gemma-2-2b');
  });
});
