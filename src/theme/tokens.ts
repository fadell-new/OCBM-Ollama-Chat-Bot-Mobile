export type Theme = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  control: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  accentStrong: string;
  onAccent: string;
  danger: string;
  success: string;
  overlay: string;
};

export const themes: Record<'light' | 'dark', Theme> = {
  light: {
    bg: '#FFFFFF',
    surface: '#EBEBEB',
    surfaceAlt: '#F5F5F5',
    control: '#D9D9D9',
    text: '#111111',
    textMuted: 'rgba(17,17,17,0.55)',
    border: 'rgba(0,0,0,0.08)',
    accent: '#D6F5E3',
    accentStrong: '#5FCB93',
    onAccent: '#111111',
    danger: '#D9534F',
    success: '#2E9E6B',
    overlay: 'rgba(0,0,0,0.45)',
  },
  dark: {
    bg: '#121212',
    surface: '#1E1E1E',
    surfaceAlt: '#262626',
    control: '#333333',
    text: '#F5F5F5',
    textMuted: 'rgba(245,245,245,0.60)',
    border: 'rgba(255,255,255,0.10)',
    accent: '#244A39',
    accentStrong: '#7ED9A8',
    onAccent: '#F5F5F5',
    danger: '#FF6B6B',
    success: '#5FD3A0',
    overlay: 'rgba(0,0,0,0.65)',
  },
};
