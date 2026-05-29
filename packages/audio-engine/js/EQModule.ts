import {Platform, TurboModuleRegistry} from 'react-native';
import type {EQModule} from './types';

function getNativeModule() {
  try {
    return TurboModuleRegistry.getEnforcing<any>('MusixEQModule');
  } catch {
    return null;
  }
}

const native = Platform.OS !== 'web' ? getNativeModule() : null;

const eqModule: EQModule = {
  setEnabled(enabled: boolean): void {
    native?.setEnabled(enabled);
  },

  setBandGains(gains: number[]): void {
    native?.setBandGains(gains);
  },

  getBandGains(): number[] {
    if (!native) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    return native.getBandGains();
  },
};

export default eqModule;
