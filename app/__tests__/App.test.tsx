import React from 'react';

jest.mock('@shopify/react-native-skia', () => ({
  Canvas: 'Canvas',
  RoundedRect: 'RoundedRect',
  Circle: 'Circle',
  Line: 'Line',
  Text: 'SkText',
  useFont: jest.fn(() => null),
  Rect: 'Rect',
  vec: jest.fn((x, y) => ({x, y})),
  Group: 'Group',
  LinearGradient: 'SkLinearGradient',
}));

jest.mock('@shopify/flash-list', () => ({
  FlashList: 'FlashList',
}));

jest.mock('../src/db', () => ({
  initDatabase: jest.fn(),
  getTrackById: jest.fn(),
  getAllTracks: jest.fn(() => []),
  searchTracks: jest.fn(() => []),
  getGenres: jest.fn(() => []),
  getAllPlaylists: jest.fn(() => []),
  getLikedTrackIds: jest.fn(() => new Set()),
  getLikedCount: jest.fn(() => 0),
}));

jest.mock('react-native-mmkv', () => {
  const store: Record<string, string | boolean | number> = {};
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      getString: (key: string) => store[key] as string | undefined,
      getBoolean: (key: string) => store[key] as boolean | undefined,
      set: (key: string, value: string | boolean | number) => {
        store[key] = value;
      },
      delete: (key: string) => {
        delete store[key];
      },
    })),
  };
});

jest.mock('@musix/audio-engine', () => ({
  PlayerModule: {
    loadTrack: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    seekToFrame: jest.fn(),
    getPositionMs: jest.fn(() => 0),
    getDurationMs: jest.fn(() => 0),
    isPlaying: jest.fn(() => false),
    hasTrackEnded: jest.fn(() => false),
    clearTrackEnded: jest.fn(),
    hasTrackTransitioned: jest.fn(() => false),
    clearTrackTransitioned: jest.fn(),
    wasInterrupted: jest.fn(() => false),
    clearInterrupted: jest.fn(),
    setNowPlaying: jest.fn(),
    updateNowPlayingElapsed: jest.fn(),
    hasRemotePlay: jest.fn(() => false),
    clearRemotePlay: jest.fn(),
    hasRemotePause: jest.fn(() => false),
    clearRemotePause: jest.fn(),
    hasRemoteNext: jest.fn(() => false),
    clearRemoteNext: jest.fn(),
    hasRemotePrev: jest.fn(() => false),
    clearRemotePrev: jest.fn(),
    hasRemoteSeek: jest.fn(() => false),
    clearRemoteSeek: jest.fn(),
    remoteSeekPositionMs: jest.fn(() => 0),
    preloadNext: jest.fn(),
  },
  ScannerModule: {
    importFiles: jest.fn(),
    getMetadata: jest.fn(),
    scanFolder: jest.fn(),
    addWatchedFolder: jest.fn(),
    removeWatchedFolder: jest.fn(),
    getWatchedFolders: jest.fn(() => []),
  },
  EQModule: {
    setEnabled: jest.fn(),
    setBandGains: jest.fn(),
    getBandGains: jest.fn(() => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
}));

test('App module exports a component', () => {
  const App = require('../App').default;
  expect(typeof App).toBe('function');
});
