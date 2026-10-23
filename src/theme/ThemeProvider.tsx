import { useFonts } from 'expo-font';
import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import type { ThemeMode } from '@/types';

import { themes, type Theme } from './tokens';
import { fontAssets } from './typography';

export type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
};

export const ThemeContext = createContext<ThemeContextValue>({
  theme: themes.light,
  mode: 'light',
  setMode: () => {},
  isDark: false,
});

export type ThemeProviderProps = {
  children: ReactNode;
  mode?: ThemeMode;
  onModeChange?: (mode: ThemeMode) => void;
};

export function ThemeProvider({
  children,
  mode: controlledMode,
  onModeChange,
}: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [localMode, setLocalMode] = useState<ThemeMode>('system');
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  const mode = controlledMode ?? localMode;
  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const theme = isDark ? themes.dark : themes.light;

  const setMode = useCallback(
    (next: ThemeMode) => {
      if (controlledMode === undefined) {
        setLocalMode(next);
      }
      onModeChange?.(next);
    },
    [controlledMode, onModeChange]
  );

  const value = useMemo(
    () => ({ theme, mode, setMode, isDark }),
    [theme, mode, setMode, isDark]
  );

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
