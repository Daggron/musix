import type { ScannerModule, TrackMetadata } from './types';

const stub: ScannerModule = {
  async startFullScan(): Promise<void> {},
  cancelScan(): void {},
  async getMetadata(_filePath: string): Promise<TrackMetadata> {
    return {
      title: null,
      artist: null,
      album: null,
      year: null,
      duration: 0,
      bitrate: 0,
      sampleRate: 0,
      bitDepth: 0,
      codec: 'flac',
      coverArt: null,
      filePath: _filePath,
      fileSize: 0,
    };
  },
};

export default stub;
