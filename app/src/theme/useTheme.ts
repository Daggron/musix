import {useMemo} from 'react';
import {useThemeStore} from './ThemeStore';
import {ACCENT_PALETTE, FONTS, getColors} from './tokens';
import type {ThemeColors} from './tokens';

export interface Theme extends ThemeColors {
  accent: string;
  accentSoft: string;
  fonts: typeof FONTS;
  dark: boolean;
}

export function useTheme(): Theme {
  const dark = useThemeStore((s) => s.dark);
  const accentName = useThemeStore((s) => s.accent);

  return useMemo(() => {
    const colors = getColors(dark);
    const pal = ACCENT_PALETTE[accentName];
    return {
      ...colors,
      accent: pal.color,
      accentSoft: pal.soft,
      fonts: FONTS,
      dark,
    };
  }, [dark, accentName]);
}
