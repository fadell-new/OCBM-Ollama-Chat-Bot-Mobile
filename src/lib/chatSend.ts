import { buildContextMessages } from '@/lib/context';
import type { Chat, OllamaMessage, Settings } from '@/types';

export type ComposedRequest = {
  model: string;
  messages: OllamaMessage[];
};

export type BuildSystemPromptInput = Pick<Settings, 'systemPrompt' | 'personalContext'> & {
  now?: Date;
};

/**
 * Combine the user's system prompt and Personal Intelligence notes exactly as
 * they are sent to Ollama. Keeping this in one place lets the settings screens
 * preview the real payload.
 *
 * A local date/time hint is always included so even smaller on-device models can
 * answer questions like "what day is it today?" instead of hallucinating the date.
 */
export function buildSystemPrompt(input: BuildSystemPromptInput): string {
  const now = input.now ?? new Date();

  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const localDateTime = now.toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const dateTimeHint = `Current local date and time on the user's device: ${localDateTime} (local ISO date: ${localDate}). If the user asks about today's date, the day of the week, or the current time, answer directly using this value.`;

  return [input.systemPrompt, input.personalContext, dateTimeHint]
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
