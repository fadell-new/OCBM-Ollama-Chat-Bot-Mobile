import type { Message, OllamaMessage } from '@/types';

export type ContextOptions = {
  maxMessages?: number;
  maxChars?: number;
};

export const DEFAULT_MAX_MESSAGES = 24;
export const DEFAULT_MAX_CHARS = 24_000;

/**
 * Build the message array sent to Ollama.
 *
 * The system prompt is always included, then the newest messages are added
 * until the message-count or character budget is reached. If the newest
 * message alone is larger than the budget it is truncated rather than dropped.
 */
export function buildContextMessages(
  messages: Message[],
  systemPrompt: string,
  options: ContextOptions = {}
): OllamaMessage[] {
  const maxMessages = options.maxMessages ?? DEFAULT_MAX_MESSAGES;
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const result: OllamaMessage[] = [];

  const system = systemPrompt.trim();
  if (system) {
    result.push({ role: 'system', content: system });
  }

  const selected: OllamaMessage[] = [];
  let usedChars = 0;

  for (let index = messages.length - 1; index >= 0 && selected.length < maxMessages; index -= 1) {
    const message = messages[index];
    if (message.role === 'system') continue;

    let content = message.content ?? '';
    const remaining = maxChars - usedChars;
    if (remaining <= 0) break;

    if (content.length > remaining) {
      if (selected.length > 0) break;
      content = content.slice(0, remaining);
    }

    selected.unshift({ role: message.role, content, images: message.images });
    usedChars += content.length;
  }

  return [...result, ...selected];
}
