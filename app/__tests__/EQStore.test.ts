jest.mock('react-native-mmkv', () => {
  const store: Record<string, string | boolean | number> = {};
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      getString: (key: string) => store[key] as string | undefined,
      getBoolean: (key: string) => store[key] as boolean | undefined,
      set: (key: string, value: string | boolean | number) => {
        store[key] = value;
      },
      delete: (key: string) => {
        delete store[key];
      },
    })),
  };
});

jest.mock('@musix/audio-engine', () => ({
  EQModule: {
    setEnabled: jest.fn(),
    setBandGains: jest.fn(),
    getBandGains: jest.fn(() => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
}));

import {useEQStore, EQ_PRESETS, EQ_BANDS} from '../src/store/EQStore';
import {EQModule} from '@musix/audio-engine';

beforeEach(() => {
  useEQStore.setState({
    enabled: true,
    preset: 'Studio',
    levels: [...EQ_PRESETS.Studio],
  });
  jest.clearAllMocks();
});

describe('EQStore', () => {
  it('has 10 bands', () => {
    expect(EQ_BANDS).toHaveLength(10);
  });

  it('initializes with Studio preset', () => {
    const {preset, levels} = useEQStore.getState();
    expect(preset).toBe('Studio');
    expect(levels).toEqual(EQ_PRESETS.Studio);
  });

  it('toggleEnabled flips the flag', () => {
    expect(useEQStore.getState().enabled).toBe(true);
    useEQStore.getState().toggleEnabled();
    expect(useEQStore.getState().enabled).toBe(false);
    expect(EQModule.setEnabled).toHaveBeenCalledWith(false);
  });

  it('applyPreset sets levels and calls native', () => {
    useEQStore.getState().applyPreset('Vinyl');
    const {preset, levels} = useEQStore.getState();
    expect(preset).toBe('Vinyl');
    expect(levels).toEqual(EQ_PRESETS.Vinyl);
    expect(EQModule.setBandGains).toHaveBeenCalledWith(EQ_PRESETS.Vinyl);
  });

  it('setLevel updates one band and sets preset to Custom', () => {
    useEQStore.getState().setLevel(3, 5);
    const {levels, preset} = useEQStore.getState();
    expect(levels[3]).toBe(5);
    expect(preset).toBe('Custom');
    expect(EQModule.setBandGains).toHaveBeenCalled();
  });

  it('setLevel does not mutate other bands', () => {
    const before = [...useEQStore.getState().levels];
    useEQStore.getState().setLevel(0, 8);
    const after = useEQStore.getState().levels;
    expect(after[0]).toBe(8);
    for (let i = 1; i < 10; i++) {
      expect(after[i]).toBe(before[i]);
    }
  });

  it('hydrate syncs state to native', () => {
    useEQStore.getState().hydrate();
    expect(EQModule.setEnabled).toHaveBeenCalledWith(true);
    expect(EQModule.setBandGains).toHaveBeenCalledWith(EQ_PRESETS.Studio);
  });

  it('all presets have exactly 10 bands', () => {
    for (const [name, levels] of Object.entries(EQ_PRESETS)) {
      expect(levels).toHaveLength(10);
    }
  });
});
