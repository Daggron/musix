import {Platform, TurboModuleRegistry} from 'react-native';
import type {ScannerModule, TrackMetadata, WatchedFolder} from './types';

function getNativeModule() {
  try {
    return TurboModuleRegistry.getEnforcing<any>('MusixScannerModule');
  } catch {
    return null;
  }
}

const native = Platform.OS !== 'web' ? getNativeModule() : null;

const scannerModule: ScannerModule = {
  async importFiles(): Promise<string[]> {
    if (!native) return [];
    return native.importFiles();
  },

  async getMetadata(filePath: string): Promise<TrackMetadata> {
    if (!native) {
      return {
        title: 'Unknown',
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        year: 0,
        genre: 'Other',
        duration: 0,
        bitrate: 0,
        codec: 'flac',
        filePath,
        fileSize: 0,
        hue: 0,
        artworkPath: null,
      };
    }
    const json = await native.getMetadata(filePath);
    return JSON.parse(json) as TrackMetadata;
  },

  async scanFolder(bookmarkId: string): Promise<string[]> {
    if (!native) return [];
    return native.scanFolder(bookmarkId);
  },

  async addWatchedFolder(): Promise<string> {
    if (!native) return '';
    return native.addWatchedFolder();
  },

  removeWatchedFolder(bookmarkId: string): void {
    native?.removeWatchedFolder(bookmarkId);
  },

  getWatchedFolders(): WatchedFolder[] {
    if (!native) return [];
    const json = native.getWatchedFolders();
    return JSON.parse(json) as WatchedFolder[];
  },
};

export default scannerModule;
