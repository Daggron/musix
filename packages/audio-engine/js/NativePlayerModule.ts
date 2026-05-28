import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  loadTrack(filePath: string): Promise<boolean>;
  play(): void;
  pause(): void;
  stop(): void;
  seekTo(positionMs: number): void;
  getPositionMs(): number;
  getDurationMs(): number;
  getIsPlaying(): boolean;
  getDocumentsPath(): string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('MusixPlayerModule');
