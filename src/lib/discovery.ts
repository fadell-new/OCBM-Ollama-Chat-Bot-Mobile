import { Platform } from 'react-native';

const PROBE_TIMEOUT_MS = 400;
const CONCURRENCY = 40;

const COMMON_SUBNETS = ['192.168.0', '192.168.1', '192.168.2', '10.0.0', '10.0.1'];

export type DiscoveredServer = {
  url: string;
  latencyMs: number;
};

async function probe(url: string, signal?: AbortSignal): Promise<number | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  const started = Date.now();
  try {
    const response = await fetch(`${url}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
    if (!response.ok) return null;
    return Date.now() - started;
  } catch {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
    return null;
  }
}

export async function scanForOllama(
  onFound?: (server: DiscoveredServer) => void,
  signal?: AbortSignal
): Promise<DiscoveredServer[]> {
  const found: DiscoveredServer[] = [];
  const candidates: string[] = [];

  // Android emulator host alias
  if (Platform.OS === 'android') {
    candidates.push('http://10.0.2.2:11434');
  }

  // Common single hosts
  for (const subnet of COMMON_SUBNETS) {
    candidates.push(`http://${subnet}.1:11434`);
    candidates.push(`http://${subnet}.2:11434`);
    candidates.push(`http://${subnet}.100:11434`);
    candidates.push(`http://${subnet}.254:11434`);
  }

  // Full subnet scan
  for (const subnet of COMMON_SUBNETS) {
    for (let i = 3; i <= 253; i++) {
      candidates.push(`http://${subnet}.${i}:11434`);
    }
  }

  // De-duplicate
  const unique = Array.from(new Set(candidates));

  for (let i = 0; i < unique.length; i += CONCURRENCY) {
    if (signal?.aborted) break;
    const batch = unique.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (url) => {
        const latency = await probe(url, signal);
        if (latency !== null) {
          const server = { url, latencyMs: latency };
          found.push(server);
          onFound?.(server);
        }
        return latency;
      })
    );
  }

  return found;
}
