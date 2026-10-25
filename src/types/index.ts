export type Role = 'system' | 'user' | 'assistant';

export type MessageStatus = 'sending' | 'streaming' | 'done' | 'error';

export type AttachmentKind = 'image' | 'text';

export type Attachment = {
  id: string;
  kind: AttachmentKind;
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};

export type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  status?: MessageStatus;
  error?: string;
  attachments?: Attachment[];
  images?: string[];
};

export type Chat = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};

export type ChatSummary = {
  id: string;
  title: string;
  preview: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
};

export type Profile = {
  name: string;
  email: string;
  phone: string;
};

export type ThemeMode = 'light' | 'dark' | 'system';

export type AiSource = 'auto' | 'ollama' | 'local';

export type DateTimeMode = 'device' | 'custom';

export type Settings = {
  baseUrl: string;
  defaultModel: string;
  theme: ThemeMode;
  systemPrompt: string;
  personalContext: string;
  profile: Profile;
  onboardingComplete: boolean;
  aiSource: AiSource;
  dateTimeMode: DateTimeMode;
  dateTimeOverride: string;
  dateTimeTimeZone: string;
};

export type OllamaModel = {
  name: string;
  size: number;
  parameterSize?: string;
  quantization?: string;
  capabilities: string[];
  modifiedAt?: string;
};

export type OllamaMessage = {
  role: Role;
  content: string;
  images?: string[];
};

export type PullProgress = {
  status: string;
  completed?: number;
  total?: number;
};

export type TestResult = {
  latencyMs: number;
  modelCount: number;
};

export type ModelDetails = {
  modelfile?: string;
  parameters?: string;
  template?: string;
  details?: {
    format?: string;
    family?: string;
    parameter_size?: string;
    quantization_level?: string;
  };
  capabilities?: string[];
};
