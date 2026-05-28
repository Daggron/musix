import type { EQModule, EQPreset } from './types';

const PRESET_VALUES: Record<EQPreset, number[]> = {
  default: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  studio: [0, 0, 0, 0, 0, 1, 1, 2, 2, 1],
  vinyl: [3, 2, 1, 0, -1, -2, -2, -1, -2, -3],
};

let currentPreset: EQPreset = 'default';

const stub: EQModule = {
  setEnabled(_enabled: boolean): void {},
  setPreset(preset: EQPreset): void {
    currentPreset = preset;
  },
  getBandValues(): number[] {
    return [...PRESET_VALUES[currentPreset]];
  },
};

export default stub;
