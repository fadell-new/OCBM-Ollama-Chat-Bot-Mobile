import { buildSystemPrompt, composeRequest } from '@/lib/chatSend';
import type { Chat, Settings } from '@/types';

const settings = {
  defaultModel: 'qwen2.5:3b',
  systemPrompt: 'SYS',
  personalContext: 'P',
} as Settings;

const chat = {
  id: 'c1',
  title: 'T',
  createdAt: 1,
  updatedAt: 1,
  messages: [{ id: 'm1', role: 'user', content: 'Hi', createdAt: 1 }],
} as Chat;

const FIXED_NOW = new Date('2026-10-25T12:00:00');
const DATE_LINE =
  "Current date and time (the user's device): Sunday, October 25, 2026 at 12:00 PM (local ISO date: 2026-10-25). If the user asks about today's date, the day of the week, or the current time, answer directly using this value. Otherwise do not mention dates, weekdays, or times.";

describe('buildSystemPrompt', () => {
  test('joins trimmed prompt, personal context, and the current date/time hint', () => {
    expect(
      buildSystemPrompt({
        systemPrompt: '  SYS  ',
        personalContext: '  P  ',
        now: FIXED_NOW,
      })
    ).toBe(`SYS\n\nP\n\n${DATE_LINE}`);
  });

  test('returns only the date/time hint when both prompts are blank', () => {
    expect(
      buildSystemPrompt({
        systemPrompt: '  ',
        personalContext: '',
        now: FIXED_NOW,
      })
    ).toBe(DATE_LINE);
  });
});

describe('composeRequest', () => {
  test('includes system prompt, personal context, and model', () => {
    const out = composeRequest(chat, settings);
    expect(out.model).toBe('qwen2.5:3b');
    expect(out.messages[0].role).toBe('system');
    expect(out.messages[0].content).toContain('SYS');
    expect(out.messages[0].content).toContain('P');
    expect(out.messages.at(-1)?.content).toBe('Hi');
  });

  test('includes the system prompt, personal context, and date hint', () => {
    const out = composeRequest(chat, settings);
    expect(out.messages[0].content).toContain('SYS');
    expect(out.messages[0].content).toContain('P');
    expect(out.messages[0].content).toContain(
      "Current date and time (the user's device)"
    );
    expect(out.messages.at(-1)?.content).toBe('Hi');
  });

  test('sends a date/time hint system message when both prompts are empty', () => {
    const out = composeRequest(chat, {
      ...settings,
      systemPrompt: '',
      personalContext: '   ',
    } as Settings);
    expect(out.messages[0].role).toBe('system');
    expect(out.messages[0].content).toContain(
      "Current date and time (the user's device)"
    );
    expect(out.messages.at(-1)?.content).toBe('Hi');
  });
});
