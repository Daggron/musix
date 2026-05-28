export const FONTS = {
  serif: 'Instrument Serif',
  serifItalic: 'Instrument Serif',
  sans: 'DM Sans',
  mono: 'JetBrains Mono',
} as const;

export const ACCENT_PALETTE = {
  oxblood: {color: '#8a2e1f', soft: '#b85543', label: 'Oxblood'},
  brass: {color: '#a8771a', soft: '#d29840', label: 'Brass'},
  forest: {color: '#1f5a3c', soft: '#3d8261', label: 'Forest'},
  indigo: {color: '#2c3e72', soft: '#5167a3', label: 'Indigo'},
  plum: {color: '#5e2049', soft: '#894270', label: 'Plum'},
} as const;

export type AccentName = keyof typeof ACCENT_PALETTE;
export type PlayerKind = 'vinyl' | 'cassette';

export interface ThemeColors {
  paper: string;
  paper2: string;
  paper3: string;
  card: string;
  cardSoft: string;
  ink: string;
  ink2: string;
  ink3: string;
  ink4: string;
  rule: string;
  ruleStrong: string;
  wood1: string;
  wood2: string;
  wood3: string;
  flac: string;
}

const LIGHT: ThemeColors = {
  paper: '#f1e6cf',
  paper2: '#ebdcc1',
  paper3: '#e3d0ad',
  card: '#faf2dd',
  cardSoft: '#f6ead0',
  ink: '#2a1e14',
  ink2: '#4a3526',
  ink3: '#7a5d44',
  ink4: '#a08769',
  rule: 'rgba(42, 30, 20, 0.12)',
  ruleStrong: 'rgba(42, 30, 20, 0.22)',
  wood1: '#4a2a14',
  wood2: '#3a1f0e',
  wood3: '#2a1408',
  flac: '#1f5a4a',
};

const DARK: ThemeColors = {
  paper: '#1a1208',
  paper2: '#221810',
  paper3: '#2c1f15',
  card: '#251a10',
  cardSoft: '#2d2117',
  ink: '#f1e6cf',
  ink2: '#d6c4a5',
  ink3: '#a18866',
  ink4: '#76624a',
  rule: 'rgba(241, 230, 207, 0.10)',
  ruleStrong: 'rgba(241, 230, 207, 0.20)',
  wood1: '#1a0e05',
  wood2: '#120a03',
  wood3: '#0a0501',
  flac: '#1f5a4a',
};

export function getColors(dark: boolean): ThemeColors {
  return dark ? DARK : LIGHT;
}

export function hueToGradient(
  hue: number,
  tone: 'light' | 'dark' = 'light',
): [string, string] {
  const s = 55;
  if (tone === 'light') {
    return [`hsl(${hue}, ${s}%, 58%)`, `hsl(${hue}, ${s}%, 38%)`];
  }
  return [`hsl(${hue}, ${s}%, 45%)`, `hsl(${hue}, ${s}%, 25%)`];
}
