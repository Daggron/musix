import {Platform, TurboModuleRegistry} from 'react-native';
import type {PlayerModule} from './types';

function getNativeModule() {
  try {
    return TurboModuleRegistry.getEnforcing<any>('MusixPlayerModule');
  } catch {
    return null;
  }
}

const native = Platform.OS !== 'web' ? getNativeModule() : null;

const playerModule: PlayerModule = {
  async loadTrack(filePath: string): Promise<void> {
    if (native) {
      const ok = await native.loadTrack(filePath);
      if (!ok) {
        throw new Error(`Failed to load track: ${filePath}`);
      }
    }
  },

  async preloadNext(filePath: string): Promise<void> {
    if (native) {
      await native.preloadNext(filePath);
    }
  },

  play(): void {
    native?.play();
  },

  pause(): void {
    native?.pause();
  },

  stop(): void {
    native?.stop();
  },

  seekToFrame(positionMs: number): void {
    native?.seekTo(positionMs);
  },

  getPositionMs(): number {
    return native?.getPositionMs() ?? 0;
  },

  getDurationMs(): number {
    return native?.getDurationMs() ?? 0;
  },

  isPlaying(): boolean {
    return native?.getIsPlaying() ?? false;
  },

  hasTrackEnded(): boolean {
    return native?.hasTrackEnded() ?? false;
  },

  clearTrackEnded(): void {
    native?.clearTrackEnded();
  },

  hasTrackTransitioned(): boolean {
    return native?.hasTrackTransitioned() ?? false;
  },

  clearTrackTransitioned(): void {
    native?.clearTrackTransitioned();
  },
};

export default playerModule;
