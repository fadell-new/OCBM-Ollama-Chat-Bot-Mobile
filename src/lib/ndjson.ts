export type NdjsonChunk = {
  lines: string[];
  rest: string;
};

/**
 * Split a buffered NDJSON chunk into complete lines and the unfinished tail.
 * Callers must feed `rest` back in with the next chunk.
 */
export function parseNdjsonChunk(buffer: string): NdjsonChunk {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const parts = normalized.split('\n');
  const rest = parts.pop() ?? '';
  const lines = parts.map((line) => line.trim()).filter((line) => line.length > 0);
  return { lines, rest };
}
