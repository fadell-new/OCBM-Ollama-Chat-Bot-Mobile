import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';

import { AppInput } from '@/components/AppInput';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatRelativeTime } from '@/lib/format';
import { searchChats, searchMessages } from '@/lib/search';
import { STORAGE_KEYS, storage } from '@/lib/storage';
import { useChatsStore } from '@/store/chatsStore';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';
import type { Chat, ChatSummary } from '@/types';

type SearchResult = {
  summary: ChatSummary;
  snippet: string;
  messageMatches: number;
};

type HighlightProps = {
  text: string;
  query: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

function Highlight({ text, query, style, numberOfLines }: HighlightProps) {
  const { theme } = useAppTheme();
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  const lower = text.toLowerCase();
  const parts: { value: string; match: boolean }[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const matchIndex = lower.indexOf(normalized, cursor);
    if (matchIndex === -1) {
      parts.push({ value: text.slice(cursor), match: false });
      break;
    }

    if (matchIndex > cursor) {
      parts.push({ value: text.slice(cursor, matchIndex), match: false });
    }

    parts.push({
      value: text.slice(matchIndex, matchIndex + normalized.length),
      match: true,
    });
    cursor = matchIndex + normalized.length;
  }

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, index) =>
        part.match ? (
          <Text
            key={index}
            style={{
              backgroundColor: theme.accent,
              color: theme.onAccent,
              fontFamily: fonts.semibold,
            }}
          >
            {part.value}
          </Text>
        ) : (
          <Text key={index}>{part.value}</Text>
        )
      )}
    </Text>
  );
}

export default function SearchScreen() {
  const { theme } = useAppTheme();
  const index = useChatsStore((state) => state.index);
  const activeChat = useChatsStore((state) => state.activeChat);
  const openChat = useChatsStore((state) => state.openChat);

  const [query, setQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const keys = await storage.keysWithPrefix(STORAGE_KEYS.chatPrefix);
        const loaded = await Promise.all(keys.map((key) => storage.get<Chat>(key)));

        if (!cancelled) {
          setChats(loaded.filter((chat): chat is Chat => Boolean(chat)));
        }
      } finally {
        if (!cancelled) {
          setLoadingChats(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const allChats = useMemo(() => {
    if (!activeChat) return chats;
    return [activeChat, ...chats.filter((chat) => chat.id !== activeChat.id)];
  }, [activeChat, chats]);

  const results = useMemo<SearchResult[]>(() => {
    const normalized = query.trim();
    if (!normalized) return [];

    const summaries = new Map(index.map((summary) => [summary.id, summary]));
    const titleMatches = new Set(searchChats(index, normalized).map((summary) => summary.id));
    const messageMatches = new Map<
      string,
      { snippet: string; count: number; role: 'user' | 'assistant' }
    >();

    for (const chat of allChats) {
      const matches = searchMessages(chat, normalized);
      if (matches.length === 0) continue;

      const firstMessage = chat.messages.find((message) => message.id === matches[0].messageId);
      messageMatches.set(chat.id, {
        snippet: matches[0].snippet,
        count: matches.length,
        role: firstMessage?.role === 'assistant' ? 'assistant' : 'user',
      });
    }

    return [...new Set([...titleMatches, ...messageMatches.keys()])]
      .map((id) => {
        const summary = summaries.get(id);
        if (!summary) return null;

        const messageMatch = messageMatches.get(id);
        return {
          summary,
          snippet: messageMatch
            ? `${messageMatch.role === 'assistant' ? 'OCBM' : 'You'}: ${messageMatch.snippet}`
            : summary.preview,
          messageMatches: messageMatch?.count ?? 0,
        };
      })
      .filter((result): result is SearchResult => result !== null)
      .sort((a, b) => b.summary.updatedAt - a.summary.updatedAt);
  }, [allChats, index, query]);

  const hasQuery = query.trim().length > 0;

  const handleOpen = async (id: string) => {
    await openChat(id);
    if (useChatsStore.getState().activeChat?.id === id) {
      router.replace('/(drawer)');
    }
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <ScreenHeader title="Search" onBack={() => router.back()} />
      </View>

      <View style={styles.body}>
        <AppInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search chats and messages"
          autoCapitalize="none"
          autoFocus
          returnKeyType="search"
        />

        {!hasQuery ? (
          <EmptyState
            title="Search your chats"
            description="Find a conversation by its title or by something you remember saying."
            icon="search-outline"
          />
        ) : loadingChats ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.accentStrong} />
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>Searching…</Text>
          </View>
        ) : results.length === 0 ? (
          <EmptyState
            title="No matches"
            description={`Nothing found for “${query.trim()}”.`}
            icon="search-outline"
          />
        ) : (
          <ScrollView
            style={styles.results}
            contentContainerStyle={styles.resultsContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.resultCount, { color: theme.textMuted }]}>
              {results.length} {results.length === 1 ? 'conversation' : 'conversations'}
            </Text>

            {results.map((result) => (
              <Pressable
                key={result.summary.id}
                accessibilityRole="button"
                accessibilityHint="Open conversation"
                onPress={() => void handleOpen(result.summary.id)}
                style={({ pressed }) => [
                  styles.result,
                  {
                    borderBottomColor: theme.border,
                    backgroundColor: pressed ? theme.surface : 'transparent',
                  },
                ]}
              >
                <View style={[styles.resultIcon, { backgroundColor: theme.surface }]}>
                  <Ionicons name="chatbubble-outline" size={16} color={theme.textMuted} />
                </View>

                <View style={styles.resultBody}>
                  <View style={styles.resultHeader}>
                    <Highlight
                      text={result.summary.title}
                      query={query}
                      style={[styles.resultTitle, { color: theme.text }]}
                      numberOfLines={1}
                    />
                    <Text style={[styles.resultTime, { color: theme.textMuted }]}>
                      {formatRelativeTime(result.summary.updatedAt)}
                    </Text>
                  </View>

                  <Highlight
                    text={result.snippet}
                    query={query}
                    style={[styles.resultSnippet, { color: theme.textMuted }]}
                    numberOfLines={2}
                  />

                  {result.messageMatches > 0 ? (
                    <Text style={[styles.resultMeta, { color: theme.textMuted }]}>
                      {result.messageMatches}{' '}
                      {result.messageMatches === 1 ? 'message match' : 'message matches'}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
  },
  results: {
    flex: 1,
    marginTop: spacing.lg,
  },
  resultsContent: {
    paddingBottom: spacing.xxl,
  },
  resultCount: {
    fontFamily: fonts.medium,
    fontSize: typeScale.caption,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  result: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.bubble,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  resultBody: {
    flex: 1,
    gap: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultTitle: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: typeScale.body,
  },
  resultTime: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
  },
  resultSnippet: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 20,
  },
  resultMeta: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    marginTop: 1,
  },
});
