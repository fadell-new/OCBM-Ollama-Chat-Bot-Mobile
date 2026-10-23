import { buildContextMessages } from '@/lib/context';
import type { Message } from '@/types';

const msg = (id: string, role: Message['role'], content: string): Message => ({
  id,
  role,
  content,
  createdAt: Number(id),
});

describe('buildContextMessages', () => {
  test('always keeps the system prompt first', () => {
    const out = buildContextMessages([], 'SYS', { maxMessages: 24, maxChars: 1000 });
    expect(out[0]).toEqual({ role: 'system', content: 'SYS' });
  });

  test('omits an empty system prompt', () => {
    const out = buildContextMessages([msg('1', 'user', 'Hi')], '   ');
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({ role: 'user', content: 'Hi' });
  });

  test('trims oldest messages but keeps the newest', () => {
    const messages = Array.from({ length: 30 }, (_, i) =>
      msg(String(i), i % 2 ? 'assistant' : 'user', `m${i}`)
    );
    const out = buildContextMessages(messages, 'SYS', { maxMessages: 4, maxChars: 100000 });
    expect(out).toHaveLength(5);
    expect(out[0].content).toBe('SYS');
    expect(out.at(-1)?.content).toBe('m29');
    expect(out.map((m) => m.content)).toEqual(['SYS', 'm26', 'm27', 'm28', 'm29']);
  });

  test('respects the character budget', () => {
    const messages = [
      msg('1', 'user', 'a'.repeat(100)),
      msg('2', 'assistant', 'b'.repeat(100)),
    ];
    const out = buildContextMessages(messages, 'SYS', { maxMessages: 24, maxChars: 120 });
    expect(out[0].content).toBe('SYS');
    expect(out.length).toBeLessThan(3);
  });

  test('keeps a single oversized newest message but truncates it', () => {
    const messages = [msg('1', 'user', 'x'.repeat(500))];
    const out = buildContextMessages(messages, 'SYS', { maxMessages: 24, maxChars: 100 });
    expect(out).toHaveLength(2);
    expect(out[1].content.length).toBe(100);
  });
});
