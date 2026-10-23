import { InknutAntiqua_400Regular } from '@expo-google-fonts/inknut-antiqua/400Regular';
import { InknutAntiqua_600SemiBold } from '@expo-google-fonts/inknut-antiqua/600SemiBold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';

export const fontAssets = {
  InknutAntiqua_400Regular,
  InknutAntiqua_600SemiBold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
};

export const fonts = {
  heading: 'InknutAntiqua_600SemiBold',
  headingRegular: 'InknutAntiqua_400Regular',
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

export const type = {
  display: 32,
  title: 24,
  subtitle: 20,
  body: 16,
  label: 14,
  caption: 12,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  pill: 999,
  card: 28,
  input: 40,
  sheet: 28,
  bubble: 20,
  bubbleTail: 6,
} as const;
