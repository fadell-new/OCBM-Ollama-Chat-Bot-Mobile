import { buildContextMessages } from '@/lib/context';
import type { Chat, DateTimeMode, OllamaMessage, Settings } from '@/types';

export type ComposedRequest = {
  model: string;
  messages: OllamaMessage[];
};

export type BuildSystemPromptInput = Pick<Settings, 'systemPrompt' | 'personalContext'> & {
  now?: Date;
  dateTimeMode?: DateTimeMode;
  dateTimeOverride?: string;
  dateTimeTimeZone?: string;
};

// Keep the Settings-derived type visible for callers that pass a full Settings object.
export type BuildSystemPromptSettingsInput = Pick<
  Settings,
  'systemPrompt' | 'personalContext' | 'dateTimeMode' | 'dateTimeOverride' | 'dateTimeTimeZone'
> & {
  now?: Date;
};

/**
 * Combine the user's system prompt and Personal Intelligence notes exactly as
 * they are sent to Ollama. Keeping this in one place lets the settings screens
 * preview the real payload.
 *
 * A date/time hint is always included so even smaller on-device models can
 * answer questions like "what day is it today?" instead of hallucinating the date.
 *
 * Settings may override the device clock (or use a time zone) without changing
 * the operating system clock.
 */
export function buildSystemPrompt(input: BuildSystemPromptInput): string {
  return [input.systemPrompt, input.personalContext]
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
export type ComposeRequestOptions = {
  searchContext?: string;
};

export function composeRequest(
  chat: Chat,
  settings: Settings,
  options: ComposeRequestOptions = {}
): ComposedRequest {
  const systemPrompt = [buildSystemPrompt(settings), options.searchContext?.trim()]
    .filter(Boolean)
    .join('\n\n');

  return {
    model: settings.defaultModel,
    messages: buildContextMessages(chat.messages, systemPrompt),
  };
}
