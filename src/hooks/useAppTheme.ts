import { useContext } from 'react';

import { ThemeContext, type ThemeContextValue } from '@/theme/ThemeProvider';

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
