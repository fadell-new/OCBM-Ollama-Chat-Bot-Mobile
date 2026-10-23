import * as FileSystem from 'expo-file-system/legacy';

import type { Attachment, AttachmentKind } from '@/types';

export const MAX_IMAGES = 4;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_TEXT_BYTES = 100 * 1024;

const ATTACHMENTS_DIR = `${FileSystem.documentDirectory ?? ''}attachments/`;

export type ValidateInput = {
  kind: AttachmentKind;
  size: number;
  mimeType: string;
};

export type ValidationResult =
  | { ok: true }
  | { ok: false; code: 'too_many' | 'too_large' | 'unsupported'; message: string };

export function validateAttachment(
  input: ValidateInput,
  current: Attachment[]
): ValidationResult {
  if (input.kind === 'image') {
    const currentImages = current.filter((attachment) => attachment.kind === 'image').length;

    if (currentImages + 1 > MAX_IMAGES) {
      return {
        ok: false,
        code: 'too_many',
        message: `You can attach up to ${MAX_IMAGES} images.`,
      };
    }

    if (input.size > MAX_IMAGE_BYTES) {
      return {
        ok: false,
        code: 'too_large',
        message: 'Image is too large (max 10 MB).',
      };
    }

    if (!input.mimeType.startsWith('image/')) {
      return {
        ok: false,
        code: 'unsupported',
        message: 'Unsupported image type.',
      };
    }

    return { ok: true };
  }

  if (input.kind === 'text') {
    if (input.size > MAX_TEXT_BYTES) {
      return {
        ok: false,
        code: 'too_large',
        message: 'Text file is too large (max 100 KB).',
      };
    }

    const isText =
      input.mimeType.startsWith('text/') || input.mimeType === 'application/json';

    if (!isText) {
      return {
        ok: false,
        code: 'unsupported',
        message: 'Unsupported text file type.',
      };
    }

    return { ok: true };
  }

  return {
    ok: false,
    code: 'unsupported',
    message: 'Unsupported attachment type.',
  };
}

export async function ensureAttachmentsDir(): Promise<string> {
  const info = await FileSystem.getInfoAsync(ATTACHMENTS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(ATTACHMENTS_DIR, { intermediates: true });
  }
  return ATTACHMENTS_DIR;
}

export async function copyToAttachments(sourceUri: string, name: string): Promise<string> {
  await ensureAttachmentsDir();
  const safeName = `${Date.now()}-${name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const destination = `${ATTACHMENTS_DIR}${safeName}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
}

export async function readTextFile(uri: string): Promise<string> {
  const content = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return content.slice(0, MAX_TEXT_BYTES);
}

export async function toOllamaImages(attachments: Attachment[]): Promise<string[]> {
  const images = attachments.filter((attachment) => attachment.kind === 'image');
  const result: string[] = [];

  for (const attachment of images) {
    const base64 = await FileSystem.readAsStringAsync(attachment.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    result.push(base64);
  }

  return result;
}
