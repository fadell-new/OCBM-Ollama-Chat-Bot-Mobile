import * as FileSystem from 'expo-file-system/legacy';

export type GeneratedFile = {
  id: string;
  name: string;
  language: string;
  content: string;
};

const LANGUAGE_EXTENSION: Record<string, string> = {
  bash: 'sh',
  css: 'css',
  go: 'go',
  html: 'html',
  htm: 'html',
  java: 'java',
  javascript: 'js',
  js: 'js',
  json: 'json',
  jsx: 'jsx',
  kotlin: 'kt',
  md: 'md',
  markdown: 'md',
  plaintext: 'txt',
  python: 'py',
  py: 'py',
  rust: 'rs',
  sh: 'sh',
  shell: 'sh',
  sql: 'sql',
  svg: 'svg',
  swift: 'swift',
  ts: 'ts',
  tsx: 'tsx',
  typescript: 'ts',
  xml: 'xml',
  yaml: 'yml',
  yml: 'yml',
};

function languageFromInfo(info: string): string {
  const clean = info.trim().toLowerCase();
  if (!clean) return 'plaintext';
  const parts = clean.split(/\s+/);
  return parts[0].replace(/^language-/, '');
}

function extensionFor(language: string): string {
  return LANGUAGE_EXTENSION[language.toLowerCase()] ?? 'txt';
}

function sanitizeFileName(name: string): string {
  const cleaned = name.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
  return cleaned.replace(/\.{2,}/g, '.').replace(/^\.+|\.+$/g, '') || 'file.txt';
}

function extractNamedFile(info: string): string | null {
  const trimmed = info.trim();
  if (!trimmed) return null;

  const patterns = [
    /(?:^|\s)(?:file|filename|title|name)\s*=\s*["']?([^"'\s]+)["']?/i,
    /#(.+\..{1,8})$/,
    /\/\/\s*file:\s*(.+)$/i,
    /#\s*file:\s*(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      const candidate = sanitizeFileName(match[1].trim().replace(/^["']|["']$/g, ''));
      if (candidate.includes('.')) return candidate;
    }
  }

  // Allow a trailing filename after the language, e.g. html index.html
  const chunks = trimmed.split(/\s+/);
  if (chunks.length > 1) {
    for (let i = chunks.length - 1; i >= 1; i -= 1) {
      const candidate = chunks[i];
      if (/^[A-Za-z0-9._-]+\.[A-Za-z0-9]{1,8}$/.test(candidate)) {
        return sanitizeFileName(candidate);
      }
    }
  }

  return null;
}

export function extractGeneratedFiles(content: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const fenceRegex = /```([^\n]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  let blockIndex = 1;

  // Also support explicit file blocks without a fenced code tag:
  // --- file: index.html ---
  // <html>...
  // --- end ---
  const explicitBlock = /(?:^|\n)---\s*file:\s*(.+?)\s*---\n?([\s\S]*?)(?:\n---\s*end\s*---|$)/gi;
  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = explicitBlock.exec(content)) !== null) {
    const name = sanitizeFileName(blockMatch[1]);
    const body = blockMatch[2].trim();
    if (body) {
      files.push({
        id: `file-${files.length + 1}`,
        name,
        language: 'plaintext',
        content: body,
      });
    }
  }

  while ((match = fenceRegex.exec(content)) !== null) {
    const info = match[1] ?? '';
    const body = match[2] ?? '';
    const language = languageFromInfo(info);
    const named = extractNamedFile(info);
    const extension = extensionFor(language);
    const name = named ?? `snippet-${blockIndex}.${extension}`;

    if (!body.trim()) {
      blockIndex += 1;
      continue;
    }

    files.push({
      id: `code-${blockIndex}`,
      name,
      language,
      content: body.replace(/\n$/, ''),
    });
    blockIndex += 1;
  }

  // De-duplicate identical file names by suffixing a counter.
  const seen = new Map<string, number>();
  return files.map((file) => {
    const count = (seen.get(file.name) ?? 0) + 1;
    seen.set(file.name, count);
    if (count === 1) return file;
    const dotIndex = file.name.lastIndexOf('.');
    if (dotIndex > 0) {
      const base = file.name.slice(0, dotIndex);
      const ext = file.name.slice(dotIndex);
      return { ...file, id: `${file.id}-${count}`, name: `${base}-${count}${ext}` };
    }
    return { ...file, id: `${file.id}-${count}`, name: `${file.name}-${count}` };
  });
}

export async function saveGeneratedFiles(files: GeneratedFile[]): Promise<string> {
  const dir = `${FileSystem.documentDirectory ?? ''}generated/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  if (files.length === 1) {
    const file = files[0];
    const path = `${dir}${file.name}`;
    await FileSystem.writeAsStringAsync(path, file.content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return path;
  }

  // ZIP is handled separately by callers; here we fall back to a text manifest
  // because saving multiple raw files needs zip support.
  const path = `${dir}generated-files.txt`;
  const manifest = files
    .map((file) => `--- file: ${file.name} ---\n${file.content}\n--- end ---`)
    .join('\n\n');
  await FileSystem.writeAsStringAsync(path, manifest, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return path;
}
