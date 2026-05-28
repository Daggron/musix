import {create} from 'zustand';
import {MMKV} from 'react-native-mmkv';
import type {AccentName, PlayerKind} from './tokens';

const storage = new MMKV({id: 'theme'});

interface ThemeState {
  dark: boolean;
  accent: AccentName;
  playerKind: PlayerKind;
  setDark: (dark: boolean) => void;
  setAccent: (accent: AccentName) => void;
  setPlayerKind: (kind: PlayerKind) => void;
  toggleDark: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  dark: storage.getBoolean('dark') ?? false,
  accent: (storage.getString('accent') as AccentName) ?? 'oxblood',
  playerKind: (storage.getString('playerKind') as PlayerKind) ?? 'vinyl',

  setDark: (dark) => {
    storage.set('dark', dark);
    set({dark});
  },
  setAccent: (accent) => {
    storage.set('accent', accent);
    set({accent});
  },
  setPlayerKind: (kind) => {
    storage.set('playerKind', kind);
    set({playerKind: kind});
  },
  toggleDark: () =>
    set((s) => {
      const next = !s.dark;
      storage.set('dark', next);
      return {dark: next};
    }),
}));
