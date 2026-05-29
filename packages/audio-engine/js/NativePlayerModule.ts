import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  loadTrack(filePath: string): Promise<boolean>;
  preloadNext(filePath: string): Promise<boolean>;
  play(): void;
  pause(): void;
  stop(): void;
  seekTo(positionMs: number): void;
  getPositionMs(): number;
  getDurationMs(): number;
  getIsPlaying(): boolean;
  hasTrackEnded(): boolean;
  clearTrackEnded(): void;
  hasTrackTransitioned(): boolean;
  clearTrackTransitioned(): void;
  wasInterrupted(): boolean;
  clearInterrupted(): void;
  getDocumentsPath(): string;

  setNowPlaying(title: string, artist: string, album: string, durationSec: number): void;
  updateNowPlayingElapsed(elapsedSec: number, rate: number): void;

  hasRemotePlay(): boolean;
  clearRemotePlay(): void;
  hasRemotePause(): boolean;
  clearRemotePause(): void;
  hasRemoteNext(): boolean;
  clearRemoteNext(): void;
  hasRemotePrev(): boolean;
  clearRemotePrev(): void;
  hasRemoteSeek(): boolean;
  clearRemoteSeek(): void;
  remoteSeekPositionMs(): number;
}

export default TurboModuleRegistry.getEnforcing<Spec>('MusixPlayerModule');
