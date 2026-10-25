export type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
};

const SEARCH_TIMEOUT_MS = 10_000;
const ALWAYS_SEARCH_MIN_LENGTH = 8;

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtmlTags(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, ''));
}

export function shouldSearchWeb(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length >= ALWAYS_SEARCH_MIN_LENGTH;
}

export async function searchWeb(
  query: string,
  maxResults = 5,
  signal?: AbortSignal
): Promise<WebSearchResult[] | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  const combinedSignal = signal ?? controller.signal;

  let abortHandler: (() => void) | null = null;
  if (signal) {
    abortHandler = () => controller.abort();
    signal.addEventListener('abort', abortHandler, { once: true });
  }

  const url = 'https://html.duckduckgo.com/html/';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 13; OCBM) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      body: `q=${encodeURIComponent(trimmed)}`,
      signal: combinedSignal,
    });

    if (!response.ok) return null;

    const html = await response.text();
    return parseDuckDuckGoResults(html, maxResults);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    if (signal && abortHandler) signal.removeEventListener('abort', abortHandler);
  }
}

function parseDuckDuckGoResults(html: string, maxResults: number): WebSearchResult[] {
  const results: WebSearchResult[] = [];

  // DuckDuckGo wraps each result in a .result block.
  const blocks = html.split(/<div class="result(?:__body| result_[^"]*)?"/i);

  for (const block of blocks) {
    if (results.length >= maxResults) break;

    const titleMatch = block.match(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!titleMatch) continue;

    const rawUrl = titleMatch[1];
    const url = unwrapDuckDuckGoUrl(rawUrl);
    const title = stripHtmlTags(titleMatch[2]);
    if (!title || !url) continue;

    const snippetMatch =
      block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i) ||
      block.match(/<div[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/div>/i);

    const snippet = snippetMatch ? stripHtmlTags(snippetMatch[1]) : '';

    results.push({ title, url, snippet });
  }

  return results;
}

function unwrapDuckDuckGoUrl(rawUrl: string): string {
  try {
    if (rawUrl.startsWith('//')) {
      rawUrl = `https:${rawUrl}`;
    }

    const parsed = new URL(rawUrl);
    if (parsed.pathname === '/l/') {
      const redirect = parsed.searchParams.get('uddg');
      return redirect ? decodeURIComponent(redirect) : rawUrl;
    }

    return parsed.toString();
  } catch {
    try {
      return decodeURIComponent(rawUrl);
    } catch {
      return rawUrl;
    }
  }
}

export function formatSearchContext(results: WebSearchResult[]): string {
  if (!results.length) return '';

  return results
    .map((result, index) => {
      const snippet = result.snippet || 'No snippet available.';
      return `${index + 1}. ${result.title}\nURL: ${result.url}\n${snippet}`;
    })
    .join('\n\n');
}
