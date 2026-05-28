import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  importFiles(): Promise<string[]>;
  getMetadata(filePath: string): Promise<string>;
  scanFolder(bookmarkId: string): Promise<string[]>;
  addWatchedFolder(): Promise<string>;
  removeWatchedFolder(bookmarkId: string): void;
  getWatchedFolders(): string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('MusixScannerModule');
