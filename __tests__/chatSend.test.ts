import { composeRequest } from '@/lib/chatSend';
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

describe('composeRequest', () => {
  test('includes system prompt, personal context, and model', () => {
    const out = composeRequest(chat, settings);
    expect(out.model).toBe('qwen2.5:3b');
    expect(out.messages[0].role).toBe('system');
    expect(out.messages[0].content).toContain('SYS');
    expect(out.messages[0].content).toContain('P');
    expect(out.messages.at(-1)?.content).toBe('Hi');
  });

  test('joins system prompt and personal context with a blank line', () => {
    const out = composeRequest(chat, settings);
    expect(out.messages[0].content).toBe('SYS\n\nP');
  });

  test('omits the system message when both prompts are empty', () => {
    const out = composeRequest(chat, {
      ...settings,
      systemPrompt: '',
      personalContext: '   ',
    } as Settings);
    expect(out.messages[0].role).toBe('user');
  });
});
