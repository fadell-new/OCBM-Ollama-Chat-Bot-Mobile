import { searchChats, searchMessages } from '@/lib/search';
import type { Chat, ChatSummary } from '@/types';

const index: ChatSummary[] = [
  {
    id: '1',
    title: 'Recipe ideas',
    preview: 'pasta with garlic',
    createdAt: 1,
    updatedAt: 2,
    messageCount: 2,
  },
  {
    id: '2',
    title: 'Code help',
    preview: 'react native layout',
    createdAt: 1,
    updatedAt: 1,
    messageCount: 1,
  },
];

const chat: Chat = {
  id: '1',
  title: 'Recipe ideas',
  createdAt: 1,
  updatedAt: 2,
  messages: [
    {
      id: 'm1',
      role: 'user',
      content: 'I want to cook PASTA tonight.',
      createdAt: 1,
      status: 'done',
    },
    {
      id: 'm2',
      role: 'assistant',
      content: 'Try a simple garlic pasta with olive oil.',
      createdAt: 2,
      status: 'done',
    },
    {
      id: 'm3',
      role: 'user',
      content: 'What about dessert?',
      createdAt: 3,
      status: 'done',
    },
  ],
};

describe('searchChats', () => {
  test('matches title and preview case-insensitively', () => {
    expect(searchChats(index, 'PASTA').map((item) => item.id)).toEqual(['1']);
    expect(searchChats(index, 'RECIPE').map((item) => item.id)).toEqual(['1']);
    expect(searchChats(index, 'react').map((item) => item.id)).toEqual(['2']);
  });

  test('trims the query and returns every chat for an empty query', () => {
    expect(searchChats(index, '  pasta  ').map((item) => item.id)).toEqual(['1']);
    expect(searchChats(index, '   ')).toEqual(index);
    expect(searchChats(index, '')).toEqual(index);
  });

  test('returns no chats for an unknown query', () => {
    expect(searchChats(index, 'zzz')).toEqual([]);
  });
});

describe('searchMessages', () => {
  test('finds every matching message and returns its id and snippet', () => {
    expect(searchMessages(chat, 'pasta')).toEqual([
      { messageId: 'm1', snippet: 'I want to cook PASTA tonight.' },
      { messageId: 'm2', snippet: 'Try a simple garlic pasta with olive oil.' },
    ]);
  });

  test('trims the query and ignores case', () => {
    expect(searchMessages(chat, '  PASTA  ')).toHaveLength(2);
  });

  test('collapses whitespace in snippets', () => {
    const multiline: Chat = {
      ...chat,
      messages: [
        {
          id: 'm4',
          role: 'user',
          content: 'line one\n\nline two pasta',
          createdAt: 4,
          status: 'done',
        },
      ],
    };

    expect(searchMessages(multiline, 'pasta')).toEqual([
      { messageId: 'm4', snippet: 'line one line two pasta' },
    ]);
  });

  test('adds ellipses around a match in a long message', () => {
    const long: Chat = {
      ...chat,
      messages: [
        {
          id: 'm5',
          role: 'assistant',
          content: `${'A'.repeat(60)}needle${'B'.repeat(60)}`,
          createdAt: 5,
          status: 'done',
        },
      ],
    };

    const [result] = searchMessages(long, 'needle');
    expect(result.messageId).toBe('m5');
    expect(result.snippet.startsWith('…')).toBe(true);
    expect(result.snippet.endsWith('…')).toBe(true);
    expect(result.snippet).toContain('needle');
  });

  test('returns nothing for an empty query or no match', () => {
    expect(searchMessages(chat, '')).toEqual([]);
    expect(searchMessages(chat, '   ')).toEqual([]);
    expect(searchMessages(chat, 'zzz')).toEqual([]);
  });
});
