import { buildContextMessages } from '@/lib/context';
import type { Chat, OllamaMessage, Settings } from '@/types';

export type ComposedRequest = {
  model: string;
  messages: OllamaMessage[];
};

/**
 * Build the exact payload for one chat turn.
 *
 * The system prompt and the personal-context notes are always sent first;
 * conversation history then follows within the context budget.
 */
export function composeRequest(chat: Chat, settings: Settings): ComposedRequest {
  const system = [settings.systemPrompt, settings.personalContext]
    .map((value) => value.trim())
    .filter(Boolean)
    .join('\n\n');

  return {
    model: settings.defaultModel,
    messages: buildContextMessages(chat.messages, system),
  };
}
