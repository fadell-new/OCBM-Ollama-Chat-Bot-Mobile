import { validateAttachment, MAX_IMAGES } from '@/lib/attachments';

test('rejects too many images', () => {
  const current = Array.from({ length: MAX_IMAGES }, (_, i) => ({
    id: String(i),
    kind: 'image' as const,
    uri: 'x',
    name: 'x',
    mimeType: 'image/png',
    size: 10,
  }));
  expect(
    validateAttachment({ kind: 'image', size: 10, mimeType: 'image/png' }, current)
  ).toMatchObject({ ok: false, code: 'too_many' });
});

test('rejects oversized image and text', () => {
  expect(
    validateAttachment({ kind: 'image', size: 11 * 1024 * 1024, mimeType: 'image/png' }, [])
  ).toMatchObject({ ok: false, code: 'too_large' });
  expect(
    validateAttachment({ kind: 'text', size: 101 * 1024, mimeType: 'text/plain' }, [])
  ).toMatchObject({ ok: false, code: 'too_large' });
});

test('rejects unsupported mime', () => {
  expect(
    validateAttachment({ kind: 'image', size: 100, mimeType: 'application/pdf' }, [])
  ).toMatchObject({ ok: false, code: 'unsupported' });
});

test('accepts valid image and text', () => {
  expect(
    validateAttachment({ kind: 'image', size: 100, mimeType: 'image/png' }, [])
  ).toMatchObject({ ok: true });
  expect(
    validateAttachment({ kind: 'text', size: 100, mimeType: 'text/plain' }, [])
  ).toMatchObject({ ok: true });
  expect(
    validateAttachment({ kind: 'text', size: 100, mimeType: 'application/json' }, [])
  ).toMatchObject({ ok: true });
});
