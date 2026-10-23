import { formatBytes, formatRelativeTime, makeChatTitle } from '@/lib/format';

describe('formatBytes', () => {
  test('formats common sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe('2.0 GB');
  });
});

describe('formatRelativeTime', () => {
  const now = 1_700_000_000_000;

  test('formats recent times', () => {
    expect(formatRelativeTime(now - 30_000, now)).toBe('now');
    expect(formatRelativeTime(now - 5 * 60_000, now)).toBe('5m');
    expect(formatRelativeTime(now - 3 * 3_600_000, now)).toBe('3h');
    expect(formatRelativeTime(now - 2 * 86_400_000, now)).toBe('2d');
  });

  test('falls back to a date beyond a week', () => {
    const result = formatRelativeTime(now - 10 * 86_400_000, now);
    expect(result).not.toMatch(/^\d+[mhd]$/);
    expect(result.length).toBeGreaterThan(2);
  });
});

describe('makeChatTitle', () => {
  test('collapses whitespace and trims', () => {
    expect(makeChatTitle('  hello   world  ')).toBe('hello world');
    expect(makeChatTitle('line one\nline two')).toBe('line one line two');
  });

  test('truncates to the requested length', () => {
    expect(makeChatTitle('a'.repeat(80), 40)).toHaveLength(40);
  });

  test('returns a fallback for empty input', () => {
    expect(makeChatTitle('   ')).toBe('New chat');
  });
});
