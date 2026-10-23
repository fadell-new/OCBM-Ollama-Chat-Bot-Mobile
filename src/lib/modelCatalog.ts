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
  thinking?: boolean;
};

/**
 * On-device model catalog. Every entry is capped at 2B parameters so it can
 * run on a phone with llama.cpp (Q4_K_M quantization).
 *
 * Order matters: `recommendModel` picks the last entry whose recommended RAM
 * fits, so within a tier the most preferred model goes last.
 */
export const LOCAL_MODELS: DeviceModel[] = [
  {
    id: 'qwen3-0.6b',
    name: 'Qwen3 0.6B',
    params: '0.6B',
    sizeBytes: 396_705_472,
    url: 'https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q4_K_M.gguf',
    fileName: 'Qwen3-0.6B-Q4_K_M.gguf',
    minRamBytes: 3 * GB,
    recommendedRamBytes: 3.5 * GB,
    tier: 1,
    description: 'เล็กมาก เปิดได้ทุกเครื่อง',
    languages: 'ไทย / อังกฤษ',
    stopTokens: ['<|im_end|>', '<|endoftext|>'],
    thinking: true,
  },
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
    description: 'เบาที่สุด ตอบไว',
    languages: 'ไทย / อังกฤษ',
    stopTokens: ['<|im_end|>', '<|endoftext|>'],
  },
  {
    id: 'gemma-3-1b',
    name: 'Gemma 3 1B',
    params: '1B',
    sizeBytes: 806_058_272,
    url: 'https://huggingface.co/unsloth/gemma-3-1b-it-GGUF/resolve/main/gemma-3-1b-it-Q4_K_M.gguf',
    fileName: 'gemma-3-1b-it-Q4_K_M.gguf',
    minRamBytes: 4 * GB,
    recommendedRamBytes: 5 * GB,
    tier: 2,
    description: 'หลายภาษา ภาษาไทยใช้ได้',
    languages: 'หลายภาษา',
    stopTokens: ['<end_of_turn>', '<eos>'],
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
    id: 'typhoon2-1b',
    name: 'Typhoon2 1B (Thai)',
    params: '1B',
    sizeBytes: 807_692_448,
    url: 'https://huggingface.co/Float16-cloud/llama3.2-typhoon2-1b-instruct-gguf/resolve/main/llama3.2-typhoon2-1b-instruct-q4_k_m.gguf',
    fileName: 'llama3.2-typhoon2-1b-instruct-q4_k_m.gguf',
    minRamBytes: 4 * GB,
    recommendedRamBytes: 5 * GB,
    tier: 2,
    description: 'เทรนภาษาไทยโดยเฉพาะ',
    languages: 'ไทยเป็นหลัก',
    stopTokens: ['<|eot_id|>', '<|end_of_text|>'],
  },
  {
    id: 'qwen3-1.7b',
    name: 'Qwen3 1.7B',
    params: '1.7B',
    sizeBytes: 1_107_409_472,
    url: 'https://huggingface.co/unsloth/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q4_K_M.gguf',
    fileName: 'Qwen3-1.7B-Q4_K_M.gguf',
    minRamBytes: 6 * GB,
    recommendedRamBytes: 7 * GB,
    tier: 3,
    description: 'Thinking model ใช้เหตุผลดีขึ้น',
    languages: 'ไทย / อังกฤษ',
    stopTokens: ['<|im_end|>', '<|endoftext|>'],
    thinking: true,
  },
  {
    id: 'smollm2-1.7b',
    name: 'SmolLM2 1.7B',
    params: '1.7B',
    sizeBytes: 1_055_609_824,
    url: 'https://huggingface.co/bartowski/SmolLM2-1.7B-Instruct-GGUF/resolve/main/SmolLM2-1.7B-Instruct-Q4_K_M.gguf',
    fileName: 'SmolLM2-1.7B-Instruct-Q4_K_M.gguf',
    minRamBytes: 6 * GB,
    recommendedRamBytes: 7 * GB,
    tier: 3,
    description: 'กะทัดรัด ตอบไว',
    languages: 'อังกฤษเป็นหลัก',
    stopTokens: ['<|im_end|>', '<|endoftext|>'],
  },
  {
    id: 'deepseek-r1-1.5b',
    name: 'DeepSeek R1 1.5B',
    params: '1.5B',
    sizeBytes: 1_117_321_312,
    url: 'https://huggingface.co/unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf',
    fileName: 'DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf',
    minRamBytes: 6 * GB,
    recommendedRamBytes: 7 * GB,
    tier: 3,
    description: 'Reasoning model แสดงการคิดก่อนตอบ',
    languages: 'อังกฤษ / จีน',
    stopTokens: ['<|im_end|>', '<|endoftext|>'],
    thinking: true,
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
    description: 'สมดุลดี ภาษาไทยดีที่สุด',
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
  return LOCAL_MODELS.find((model) => model.id === 'qwen2.5-0.5b') ?? LOCAL_MODELS[0];
}
