import {Platform, TurboModuleRegistry, type TurboModule} from 'react-native';

export function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

let _docsPath: string | null = null;

export function getDocumentsPath(): string {
  if (_docsPath) return _docsPath;
  if (Platform.OS === 'web') return '';
  try {
    const mod = TurboModuleRegistry.getEnforcing<TurboModule & {getDocumentsPath(): string}>('MusixPlayerModule');
    _docsPath = mod.getDocumentsPath();
  } catch {
    _docsPath = '';
  }
  return _docsPath ?? '';
}

export function toRelativePath(absolutePath: string): string {
  const docs = getDocumentsPath();
  if (docs && absolutePath.startsWith(docs)) {
    return absolutePath.slice(docs.length);
  }
  return absolutePath;
}

export function toAbsolutePath(relativePath: string): string {
  if (!relativePath) return '';
  if (relativePath.startsWith('/')) {
    const docs = getDocumentsPath();
    if (docs && relativePath.startsWith(docs)) return relativePath;
    return docs + relativePath;
  }
  return getDocumentsPath() + '/' + relativePath;
}
