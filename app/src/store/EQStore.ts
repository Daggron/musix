import {create} from 'zustand';
import {MMKV} from 'react-native-mmkv';
import {EQModule} from '@musix/audio-engine';

const storage = new MMKV({id: 'eq'});

export const EQ_BANDS = ['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'] as const;

export const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Vinyl: [3, 2, 1, 0, -1, -2, -2, -1, -2, -3],
  Studio: [0, 0, 0, 0, 0, 1, 1, 2, 2, 1],
  Warm: [4, 3, 2, 1, 0, -1, -2, -3, -3, -2],
  Vocal: [-2, -2, -1, 1, 3, 4, 3, 1, 0, -1],
  'Jazz Club': [2, 2, 1, 0, 0, 1, 2, 2, 3, 2],
};

function readLevels(): number[] {
  const raw = storage.getString('levels');
  if (!raw) return [...EQ_PRESETS.Studio];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 10) return parsed;
  } catch {}
  return [...EQ_PRESETS.Studio];
}

function syncToNative(enabled: boolean, levels: number[]): void {
  EQModule.setEnabled(enabled);
  EQModule.setBandGains(levels);
}

interface EQState {
  enabled: boolean;
  preset: string;
  levels: number[];

  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  applyPreset: (name: string) => void;
  setLevel: (bandIndex: number, value: number) => void;
  hydrate: () => void;
}

export const useEQStore = create<EQState>((set, get) => ({
  enabled: storage.getBoolean('enabled') ?? true,
  preset: storage.getString('preset') ?? 'Studio',
  levels: readLevels(),

  setEnabled: (enabled) => {
    storage.set('enabled', enabled);
    EQModule.setEnabled(enabled);
    set({enabled});
  },

  toggleEnabled: () => {
    const next = !get().enabled;
    storage.set('enabled', next);
    EQModule.setEnabled(next);
    set({enabled: next});
  },

  applyPreset: (name) => {
    const levels = EQ_PRESETS[name] ? [...EQ_PRESETS[name]] : get().levels;
    storage.set('preset', name);
    storage.set('levels', JSON.stringify(levels));
    EQModule.setBandGains(levels);
    set({preset: name, levels});
  },

  setLevel: (bandIndex, value) => {
    const levels = [...get().levels];
    levels[bandIndex] = value;
    storage.set('levels', JSON.stringify(levels));
    storage.set('preset', 'Custom');
    EQModule.setBandGains(levels);
    set({levels, preset: 'Custom'});
  },

  hydrate: () => {
    const {enabled, levels} = get();
    syncToNative(enabled, levels);
  },
}));
