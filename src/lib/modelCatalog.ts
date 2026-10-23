export const GB = 1024 ** 3;

export type DeviceModel = {
  id: string;
  name: string;
  params: string;
  sizeBytes: number;
  url: string;
  fileName: string;
  minRamBytes: number;
  recommendedRamBytes: number;
  tier: number;
  description: string;
  languages: string;
  stopTokens: string[];
};

/**
 * On-device model catalog. Every entry is capped at 2B parameters so it can
 * run on a phone with llama.cpp (Q4_K_M quantization).
 */
export const LOCAL_MODELS: DeviceModel[] = [
  {
    id: 'qwen2.5-0.5b',
    name: 'Qwen 2.5 0.5B',
    params: '0.5B',
    sizeBytes: 491_400_032,
    url: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf',
    fileName: 'qwen2.5-0.5b-instruct-q4_k_m.gguf',
    minRamBytes: 3 * GB,
    recommendedRamBytes: 3.5 * GB,
    tier: 1,
    description: 'เบาที่สุด เปิดได้เกือบทุกเครื่อง',
    languages: 'ไทย / อังกฤษ',
    stopTokens: ['<|im_end|>', '<|endoftext|>'],
  },
  {
    id: 'llama-3.2-1b',
    name: 'Llama 3.2 1B',
    params: '1B',
    sizeBytes: 807_694_368,
    url: 'https://huggingface.co/unsloth/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    fileName: 'Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    minRamBytes: 4 * GB,
    recommendedRamBytes: 5 * GB,
    tier: 2,
    description: 'เร็ว ภาษาอังกฤษดี',
    languages: 'อังกฤษเป็นหลัก',
    stopTokens: ['<|eot_id|>', '<|end_of_text|>'],
  },
  {
    id: 'qwen2.5-1.5b',
    name: 'Qwen 2.5 1.5B',
    params: '1.5B',
    sizeBytes: 1_117_320_736,
    url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
    fileName: 'qwen2.5-1.5b-instruct-q4_k_m.gguf',
    minRamBytes: 6 * GB,
    recommendedRamBytes: 7 * GB,
    tier: 3,
    description: 'สมดุลดี ภาษาไทยดีที่สุดในกลุ่ม',
    languages: 'ไทย / อังกฤษ',
    stopTokens: ['<|im_end|>', '<|endoftext|>'],
  },
  {
    id: 'gemma-2-2b',
    name: 'Gemma 2 2B',
    params: '2B',
    sizeBytes: 1_708_582_752,
    url: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
    fileName: 'gemma-2-2b-it-Q4_K_M.gguf',
    minRamBytes: 8 * GB,
    recommendedRamBytes: 10 * GB,
    tier: 4,
    description: 'คุณภาพสูงสุดในกลุ่ม ≤ 2B',
    languages: 'หลายภาษา',
    stopTokens: ['<end_of_turn>', '<eos>'],
  },
];

export function getModelById(id: string | null | undefined): DeviceModel | undefined {
  if (!id) return undefined;
  return LOCAL_MODELS.find((model) => model.id === id);
}

/**
 * Returns the highest-tier model the device has enough RAM for. Falls back to
 * the smallest model when RAM is unknown or too low for any recommendation.
 */
export function recommendModel(totalMemoryBytes: number | null): DeviceModel {
  const ram = totalMemoryBytes ?? 0;
  const candidates = LOCAL_MODELS.filter((model) => ram >= model.recommendedRamBytes);
  if (candidates.length > 0) {
    return candidates[candidates.length - 1];
  }
  return LOCAL_MODELS[0];
}
