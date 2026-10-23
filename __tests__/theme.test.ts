import { themes } from '@/theme/tokens';

describe('theme tokens', () => {
  test('light and dark expose identical keys', () => {
    expect(Object.keys(themes.light).sort()).toEqual(Object.keys(themes.dark).sort());
  });

  test('uses the spec values', () => {
    expect(themes.light.bg).toBe('#FFFFFF');
    expect(themes.light.surface).toBe('#EBEBEB');
    expect(themes.light.control).toBe('#D9D9D9');
    expect(themes.light.accent).toBe('#D6F5E3');
    expect(themes.dark.bg).toBe('#121212');
    expect(themes.dark.surface).toBe('#1E1E1E');
    expect(themes.dark.accent).toBe('#244A39');
  });
});
