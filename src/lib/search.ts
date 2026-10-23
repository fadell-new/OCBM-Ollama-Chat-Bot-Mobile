import type { Chat, ChatSummary } from '@/types';

const SNIPPET_CONTEXT = 40;

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function searchChats(index: ChatSummary[], query: string): ChatSummary[] {
  const normalized = normalizeQuery(query);
  if (!normalized) return index;

  return index.filter(
    (chat) =>
      chat.title.toLowerCase().includes(normalized) ||
      chat.preview.toLowerCase().includes(normalized)
  );
}

export function searchMessages(
  chat: Chat,
  query: string
): { messageId: string; snippet: string }[] {
  const normalized = normalizeQuery(query);
  if (!normalized) return [];

  const results: { messageId: string; snippet: string }[] = [];

  for (const message of chat.messages) {
    if (!message.content) continue;

    const matchIndex = message.content.toLowerCase().indexOf(normalized);
    if (matchIndex === -1) continue;

    const start = Math.max(0, matchIndex - SNIPPET_CONTEXT);
    const end = Math.min(
      message.content.length,
      matchIndex + normalized.length + SNIPPET_CONTEXT
    );
    const snippet = message.content
      .slice(start, end)
      .replace(/\s+/g, ' ')
      .trim();

    results.push({
      messageId: message.id,
      snippet: `${start > 0 ? '…' : ''}${snippet}${end < message.content.length ? '…' : ''}`,
    });
  }

  return results;
}
