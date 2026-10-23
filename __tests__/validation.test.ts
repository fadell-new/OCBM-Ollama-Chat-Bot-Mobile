import { isValidEmail, isValidPhone, normalizeBaseUrl } from '@/lib/validation';

describe('email validation', () => {
  test('accepts a normal email', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
  });

  test('rejects incomplete emails', () => {
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('no-at-sign.com')).toBe(false);
  });
});

describe('phone validation', () => {
  test('accepts local and international formats', () => {
    expect(isValidPhone('0812345678')).toBe(true);
    expect(isValidPhone('+66 81-234-5678')).toBe(true);
    expect(isValidPhone('(081) 234 5678')).toBe(true);
  });

  test('rejects letters and too-short numbers', () => {
    expect(isValidPhone('abc')).toBe(false);
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });
});

describe('base URL normalization', () => {
  test('trims and removes trailing slash', () => {
    expect(normalizeBaseUrl('http://192.168.1.10:11434/')).toBe('http://192.168.1.10:11434');
    expect(normalizeBaseUrl('  https://host:11434  ')).toBe('https://host:11434');
  });

  test('rejects a missing protocol', () => {
    expect(normalizeBaseUrl('192.168.1.10:11434')).toBeNull();
    expect(normalizeBaseUrl('')).toBeNull();
  });

  test('keeps a path prefix without a trailing slash', () => {
    expect(normalizeBaseUrl('http://host:11434/ollama/')).toBe('http://host:11434/ollama');
  });
});
