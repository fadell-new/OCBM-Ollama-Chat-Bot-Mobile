import type { Settings } from '@/types';

export function isDateTimeQuestion(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return false;

  const patterns = [
    /วันนี้.*วัน/,
    /วันอะไร/,
    /วันที่/,
    /วันอะไรบ้าง/,
    /เวลาตอนนี้|vertime|current time|what time|today'?s date|what date|what day|day of week|date today/,
    /broadcast date/i,
  ];

  return patterns.some((pattern) => pattern.test(normalized));
}

export function getEffectiveDateTimeLabel(settings: Settings): string {
  const timeZone = settings.dateTimeTimeZone?.trim() || undefined;
  const mode = settings.dateTimeMode ?? 'device';

  const now =
    mode === 'custom' && settings.dateTimeOverride?.trim()
      ? new Date(settings.dateTimeOverride.trim())
      : new Date();

  const validNow = Number.isNaN(now.getTime()) ? new Date() : now;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    dateStyle: 'full',
    timeStyle: 'short',
  });

  try {
    return formatter.format(validNow);
  } catch {
    return validNow.toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  }
}
