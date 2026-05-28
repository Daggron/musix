import type { PlayerModule } from './types';

const stub: PlayerModule = {
  async loadTrack(_filePath: string): Promise<void> {},
  async preloadNext(_filePath: string): Promise<void> {},
  play(): void {},
  pause(): void {},
  stop(): void {},
  seekToFrame(_positionMs: number): void {},
  getPositionMs(): number {
    return 0;
  },
  getDurationMs(): number {
    return 0;
  },
  isPlaying(): boolean {
    return false;
  },
};

export default stub;
