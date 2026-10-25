import { zipSync } from 'fflate';

import type { GeneratedFile } from './fileArtifacts';

export function createZipBase64(files: GeneratedFile[]): string {
  const input: Record<string, Uint8Array> = {};
  for (const file of files) {
    input[file.name] = new TextEncoder().encode(file.content);
  }

  const encoded = zipSync(input, { level: 6 });
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  let i = 0;

  for (; i + 2 < encoded.length; i += 3) {
    const chunk = (encoded[i] << 16) | (encoded[i + 1] << 8) | encoded[i + 2];
    output += chars[(chunk >> 18) & 63];
    output += chars[(chunk >> 12) & 63];
    output += chars[(chunk >> 6) & 63];
    output += chars[chunk & 63];
  }

  const remaining = encoded.length - i;
  if (remaining === 1) {
    const chunk = encoded[i] << 16;
    output += chars[(chunk >> 18) & 63];
    output += chars[(chunk >> 12) & 63];
    output += '==';
  } else if (remaining === 2) {
    const chunk = (encoded[i] << 16) | (encoded[i + 1] << 8);
    output += chars[(chunk >> 18) & 63];
    output += chars[(chunk >> 12) & 63];
    output += chars[(chunk >> 6) & 63];
    output += '=';
  }

  return output;
}
