export interface TrackMetadata {
  title: string;
  artist: string;
  album: string;
  year: number;
  genre: string;
  duration: number;
  bitrate: number;
  codec: 'flac' | 'alac' | 'wav';
  filePath: string;
  fileSize: number;
  hue: number;
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
  wasInterrupted(): boolean;
  clearInterrupted(): void;
}

export interface WatchedFolder {
  id: string;
  path: string;
}

export interface ScannerModule {
  importFiles(): Promise<string[]>;
  getMetadata(filePath: string): Promise<TrackMetadata>;
  scanFolder(bookmarkId: string): Promise<string[]>;
  addWatchedFolder(): Promise<string>;
  removeWatchedFolder(bookmarkId: string): void;
  getWatchedFolders(): WatchedFolder[];
}

export type EQPreset = 'default' | 'studio' | 'vinyl';

export interface EQModule {
  setEnabled(enabled: boolean): void;
  setPreset(preset: EQPreset): void;
  getBandValues(): number[];
}
