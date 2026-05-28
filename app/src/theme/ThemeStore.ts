import {create} from 'zustand';
import type {AccentName, PlayerKind} from './tokens';

interface ThemeState {
  dark: boolean;
  accent: AccentName;
  playerKind: PlayerKind;
  setDark: (dark: boolean) => void;
  setAccent: (accent: AccentName) => void;
  setPlayerKind: (kind: PlayerKind) => void;
  toggleDark: () => void;
}

// TODO: Phase 2 — persist with MMKV once native JSI setup is verified
export const useThemeStore = create<ThemeState>((set) => ({
  dark: false,
  accent: 'oxblood',
  playerKind: 'vinyl',

  setDark: (dark) => set({dark}),
  setAccent: (accent) => set({accent}),
  setPlayerKind: (kind) => set({playerKind: kind}),
  toggleDark: () => set((s) => ({dark: !s.dark})),
}));
