import { buildContextMessages } from '@/lib/context';
import type { Chat, OllamaMessage, Settings } from '@/types';

export type ComposedRequest = {
  model: string;
  messages: OllamaMessage[];
};

/**
 * Combine the user's system prompt and Personal Intelligence notes exactly as
 * they are sent to Ollama. Keeping this in one place lets the settings screens
 * preview the real payload.
 */
export function buildSystemPrompt(
  settings: Pick<Settings, 'systemPrompt' | 'personalContext'>
): string {
  return [settings.systemPrompt, settings.personalContext]
    .map((value) => value.trim())
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Build the exact payload for one chat turn.
 *
 * The system prompt and the personal-context notes are always sent first;
 * conversation history then follows within the context budget.
 */
export function composeRequest(chat: Chat, settings: Settings): ComposedRequest {
  return {
    model: settings.defaultModel,
    messages: buildContextMessages(chat.messages, buildSystemPrompt(settings)),
  };
}
