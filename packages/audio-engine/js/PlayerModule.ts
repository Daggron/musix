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

  wasInterrupted(): boolean {
    return native?.wasInterrupted() ?? false;
  },

  clearInterrupted(): void {
    native?.clearInterrupted();
  },

  setNowPlaying(title: string, artist: string, album: string, durationSec: number): void {
    native?.setNowPlaying(title, artist, album, durationSec);
  },

  updateNowPlayingElapsed(elapsedSec: number, rate: number): void {
    native?.updateNowPlayingElapsed(elapsedSec, rate);
  },

  hasRemotePlay(): boolean { return native?.hasRemotePlay() ?? false; },
  clearRemotePlay(): void { native?.clearRemotePlay(); },
  hasRemotePause(): boolean { return native?.hasRemotePause() ?? false; },
  clearRemotePause(): void { native?.clearRemotePause(); },
  hasRemoteNext(): boolean { return native?.hasRemoteNext() ?? false; },
  clearRemoteNext(): void { native?.clearRemoteNext(); },
  hasRemotePrev(): boolean { return native?.hasRemotePrev() ?? false; },
  clearRemotePrev(): void { native?.clearRemotePrev(); },
  hasRemoteSeek(): boolean { return native?.hasRemoteSeek() ?? false; },
  clearRemoteSeek(): void { native?.clearRemoteSeek(); },
  remoteSeekPositionMs(): number { return native?.remoteSeekPositionMs() ?? 0; },
};

export default playerModule;
