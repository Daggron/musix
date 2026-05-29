import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  setEnabled(enabled: boolean): void;
  setBandGains(gains: number[]): void;
  getBandGains(): number[];
}

export default TurboModuleRegistry.getEnforcing<Spec>('MusixEQModule');
