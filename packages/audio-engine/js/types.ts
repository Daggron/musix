export interface TrackMetadata {
  title: string | null;
  artist: string | null;
  album: string | null;
  year: number | null;
  duration: number;
  bitrate: number;
  sampleRate: number;
  bitDepth: number;
  codec: 'flac' | 'alac' | 'wav';
  coverArt: string | null;
  filePath: string;
  fileSize: number;
}

export interface PlayerModule {
  loadTrack(filePath: string): Promise<void>;
  preloadNext(filePath: string): Promise<void>;
  play(): void;
  pause(): void;
  stop(): void;
  seekToFrame(positionMs: number): void;
  getPositionMs(): number;
  getDurationMs(): number;
  isPlaying(): boolean;
  hasTrackEnded(): boolean;
  clearTrackEnded(): void;
  hasTrackTransitioned(): boolean;
  clearTrackTransitioned(): void;
}

export interface ScannerModule {
  startFullScan(): Promise<void>;
  cancelScan(): void;
  getMetadata(filePath: string): Promise<TrackMetadata>;
}

export type EQPreset = 'default' | 'studio' | 'vinyl';

export interface EQModule {
  setEnabled(enabled: boolean): void;
  setPreset(preset: EQPreset): void;
  getBandValues(): number[];
}
