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

const mockTrackDb: Record<string, {id: string; title: string; artist: string; album: string; year: number; duration: number; bitrate: number; genre: string; hue: number; filePath: string | null; artworkPath: string | null; addedAt: string}> = {
  t1: {id: 't1', title: 'Track 1', artist: 'Artist A', album: 'Album X', year: 2020, duration: 180, bitrate: 1411, genre: 'Jazz', hue: 200, filePath: '/docs/Music/track1.flac', artworkPath: null, addedAt: '2024-01-01'},
  t2: {id: 't2', title: 'Track 2', artist: 'Artist B', album: 'Album Y', year: 2021, duration: 240, bitrate: 1411, genre: 'Rock', hue: 30, filePath: '/docs/Music/track2.flac', artworkPath: null, addedAt: '2024-01-02'},
  t3: {id: 't3', title: 'Track 3', artist: 'Artist C', album: 'Album Z', year: 2022, duration: 300, bitrate: 1411, genre: 'Pop', hue: 120, filePath: '/docs/Music/track3.flac', artworkPath: null, addedAt: '2024-01-03'},
};

jest.mock('../src/db', () => ({
  getTrackById: (id: string) => mockTrackDb[id] ?? null,
}));

jest.mock('@musix/audio-engine', () => ({
  PlayerModule: {
    loadTrack: jest.fn().mockResolvedValue(undefined),
    preloadNext: jest.fn().mockResolvedValue(undefined),
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    seekToFrame: jest.fn(),
    getPositionMs: jest.fn(() => 0),
    getDurationMs: jest.fn(() => 180000),
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
  },
}));

import {usePlayerStore} from '../src/store/PlayerStore';

beforeEach(() => {
  jest.useFakeTimers();
  usePlayerStore.setState({
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    positionMs: 0,
    durationMs: 0,
    shuffle: false,
    repeat: 'off',
  });
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('PlayerStore', () => {
  describe('queue management', () => {
    it('setQueue sets track list and current track', () => {
      usePlayerStore.getState().setQueue(['t1', 't2', 't3'], 0);
      const s = usePlayerStore.getState();
      expect(s.queue).toEqual(['t1', 't2', 't3']);
      expect(s.queueIndex).toBe(0);
      expect(s.currentTrack?.id).toBe('t1');
    });

    it('setQueue with startIndex sets correct track', () => {
      usePlayerStore.getState().setQueue(['t1', 't2', 't3'], 2);
      expect(usePlayerStore.getState().currentTrack?.id).toBe('t3');
      expect(usePlayerStore.getState().queueIndex).toBe(2);
    });

    it('clearQueue resets all state', () => {
      usePlayerStore.getState().setQueue(['t1', 't2'], 0);
      usePlayerStore.getState().clearQueue();
      const s = usePlayerStore.getState();
      expect(s.currentTrack).toBeNull();
      expect(s.queue).toEqual([]);
      expect(s.queueIndex).toBe(-1);
      expect(s.isPlaying).toBe(false);
    });
  });

  describe('shuffle', () => {
    it('toggleShuffle enables shuffle and reorders queue', () => {
      usePlayerStore.setState({
        queue: ['t1', 't2', 't3'],
        queueIndex: 0,
        currentTrack: mockTrackDb.t1,
        shuffle: false,
      });
      usePlayerStore.getState().toggleShuffle();
      const s = usePlayerStore.getState();
      expect(s.shuffle).toBe(true);
      expect(s.queue).toHaveLength(3);
      expect(s.queue[0]).toBe('t1');
    });

    it('toggleShuffle off preserves queue', () => {
      usePlayerStore.setState({
        queue: ['t1', 't3', 't2'],
        queueIndex: 0,
        currentTrack: mockTrackDb.t1,
        shuffle: true,
      });
      usePlayerStore.getState().toggleShuffle();
      expect(usePlayerStore.getState().shuffle).toBe(false);
    });
  });

  describe('repeat', () => {
    it('cycleRepeat cycles off → all → one → off', () => {
      expect(usePlayerStore.getState().repeat).toBe('off');
      usePlayerStore.getState().cycleRepeat();
      expect(usePlayerStore.getState().repeat).toBe('all');
      usePlayerStore.getState().cycleRepeat();
      expect(usePlayerStore.getState().repeat).toBe('one');
      usePlayerStore.getState().cycleRepeat();
      expect(usePlayerStore.getState().repeat).toBe('off');
    });
  });

  describe('prev', () => {
    it('prev restarts track if past 3 seconds', () => {
      usePlayerStore.setState({
        queue: ['t1', 't2', 't3'],
        queueIndex: 1,
        currentTrack: mockTrackDb.t2,
        positionMs: 5000,
      });
      usePlayerStore.getState().prev();
      expect(usePlayerStore.getState().positionMs).toBe(0);
      expect(usePlayerStore.getState().currentTrack?.id).toBe('t2');
    });

    it('prev restarts if at first track', () => {
      usePlayerStore.setState({
        queue: ['t1', 't2'],
        queueIndex: 0,
        currentTrack: mockTrackDb.t1,
        positionMs: 1000,
      });
      usePlayerStore.getState().prev();
      expect(usePlayerStore.getState().positionMs).toBe(0);
      expect(usePlayerStore.getState().currentTrack?.id).toBe('t1');
    });
  });

  describe('play', () => {
    it('play sets current track and isPlaying', () => {
      usePlayerStore.getState().play('t1', ['t1', 't2']);
      const s = usePlayerStore.getState();
      expect(s.currentTrack?.id).toBe('t1');
      expect(s.isPlaying).toBe(true);
      expect(s.queue).toEqual(['t1', 't2']);
    });

    it('play with unknown track is a no-op', () => {
      usePlayerStore.getState().play('nonexistent');
      expect(usePlayerStore.getState().currentTrack).toBeNull();
    });
  });
});
