import { parseNdjsonChunk } from '@/lib/ndjson';

describe('parseNdjsonChunk', () => {
  test('keeps a partial line in rest', () => {
    const result = parseNdjsonChunk('{"a":1}\n{"b":');
    expect(result.lines).toEqual(['{"a":1}']);
    expect(result.rest).toBe('{"b":');
  });

  test('splits multiple lines and ignores blanks', () => {
    const result = parseNdjsonChunk('{"a":1}\n\n{"b":2}\n');
    expect(result.lines).toEqual(['{"a":1}', '{"b":2}']);
    expect(result.rest).toBe('');
  });

  test('normalizes CRLF line endings', () => {
    const result = parseNdjsonChunk('{"a":1}\r\n{"b":2}\r\n');
    expect(result.lines).toEqual(['{"a":1}', '{"b":2}']);
    expect(result.rest).toBe('');
  });

  test('returns the whole buffer as rest when there is no newline', () => {
    const result = parseNdjsonChunk('{"a":1}');
    expect(result.lines).toEqual([]);
    expect(result.rest).toBe('{"a":1}');
  });
});
