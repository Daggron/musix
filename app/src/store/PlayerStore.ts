import {create} from 'zustand';
import {MMKV} from 'react-native-mmkv';
import {getTrackById, type Track} from '../db';
import {PlayerModule} from '@musix/audio-engine';

const storage = new MMKV({id: 'player'});

type RepeatMode = 'off' | 'all' | 'one';

interface ResumeState {
  trackId: string | null;
  positionMs: number;
  queue: string[];
  queueIndex: number;
  shuffle: boolean;
  repeat: RepeatMode;
}

function readResume(): ResumeState {
  const raw = storage.getString('resume');
  if (!raw) {
    return {trackId: null, positionMs: 0, queue: [], queueIndex: -1, shuffle: false, repeat: 'off'};
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {trackId: null, positionMs: 0, queue: [], queueIndex: -1, shuffle: false, repeat: 'off'};
  }
}

function saveResume(state: PlayerState): void {
  const resume: ResumeState = {
    trackId: state.currentTrack?.id ?? null,
    positionMs: state.positionMs,
    queue: state.queue,
    queueIndex: state.queueIndex,
    shuffle: state.shuffle,
    repeat: state.repeat,
  };
  storage.set('resume', JSON.stringify(resume));
}

interface PlayerState {
  currentTrack: Track | null;
  queue: string[];
  queueIndex: number;
  isPlaying: boolean;
  positionMs: number;
  shuffle: boolean;
  repeat: RepeatMode;

  play: (trackId: string, queue?: string[]) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  seekTo: (ms: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setQueue: (trackIds: string[], startIndex?: number) => void;
  clearQueue: () => void;
  hydrate: () => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  const persist = () => saveResume(get());

  return {
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    positionMs: 0,
    shuffle: false,
    repeat: 'off',

    hydrate: () => {
      const r = readResume();
      const track = r.trackId ? getTrackById(r.trackId) ?? null : null;
      set({
        currentTrack: track,
        queue: r.queue,
        queueIndex: r.queueIndex,
        positionMs: r.positionMs,
        shuffle: r.shuffle,
        repeat: r.repeat,
        isPlaying: false,
      });
    },

    play: (trackId, queue) => {
      const track = getTrackById(trackId);
      if (!track) return;

      if (queue) {
        const idx = queue.indexOf(trackId);
        set({
          currentTrack: track,
          queue,
          queueIndex: idx >= 0 ? idx : 0,
          isPlaying: true,
          positionMs: 0,
        });
      } else {
        set({
          currentTrack: track,
          isPlaying: true,
          positionMs: 0,
        });
      }
      persist();

      if (track.filePath) {
        PlayerModule.loadTrack(track.filePath)
          .then(() => PlayerModule.play())
          .catch(() => set({isPlaying: false}));
      }
    },

    pause: () => {
      PlayerModule.pause();
      set({isPlaying: false});
      persist();
    },
    resume: () => {
      PlayerModule.play();
      set({isPlaying: true});
    },

    next: () => {
      const {queue, queueIndex, repeat, shuffle: isShuffle} = get();
      if (queue.length === 0) return;

      let nextIndex: number;
      if (repeat === 'one') {
        nextIndex = queueIndex;
      } else if (isShuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
      } else {
        nextIndex = queueIndex + 1;
        if (nextIndex >= queue.length) {
          if (repeat === 'all') {
            nextIndex = 0;
          } else {
            set({isPlaying: false});
            persist();
            return;
          }
        }
      }

      const track = getTrackById(queue[nextIndex]);
      if (track) {
        set({currentTrack: track, queueIndex: nextIndex, positionMs: 0});
        persist();
        if (track.filePath) {
          PlayerModule.loadTrack(track.filePath)
            .then(() => PlayerModule.play())
            .catch(() => set({isPlaying: false}));
        }
      }
    },

    prev: () => {
      const {queue, queueIndex, positionMs} = get();
      if (queue.length === 0) return;

      if (positionMs > 3000 || queueIndex === 0) {
        set({positionMs: 0});
        persist();
        return;
      }

      const prevIndex = queueIndex - 1;
      const track = getTrackById(queue[prevIndex]);
      if (track) {
        set({currentTrack: track, queueIndex: prevIndex, positionMs: 0});
        persist();
        if (track.filePath) {
          PlayerModule.loadTrack(track.filePath)
            .then(() => PlayerModule.play())
            .catch(() => set({isPlaying: false}));
        }
      }
    },

    seekTo: (ms) => {
      PlayerModule.seekToFrame(ms);
      set({positionMs: ms});
      persist();
    },

    toggleShuffle: () => {
      const {shuffle: wasShuffle, queue, currentTrack} = get();
      if (wasShuffle) {
        set({shuffle: false});
      } else {
        const shuffled = shuffleArray(queue);
        if (currentTrack) {
          const idx = shuffled.indexOf(currentTrack.id);
          if (idx > 0) {
            [shuffled[0], shuffled[idx]] = [shuffled[idx], shuffled[0]];
          }
        }
        set({shuffle: true, queue: shuffled, queueIndex: 0});
      }
      persist();
    },

    cycleRepeat: () => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const {repeat} = get();
      const nextIdx = (modes.indexOf(repeat) + 1) % modes.length;
      set({repeat: modes[nextIdx]});
      persist();
    },

    setQueue: (trackIds, startIndex = 0) => {
      const track = getTrackById(trackIds[startIndex]);
      set({
        queue: trackIds,
        queueIndex: startIndex,
        currentTrack: track ?? null,
        isPlaying: !!track,
        positionMs: 0,
      });
      persist();
    },

    clearQueue: () => {
      PlayerModule.stop();
      set({
        currentTrack: null,
        queue: [],
        queueIndex: -1,
        isPlaying: false,
        positionMs: 0,
      });
      persist();
    },
  };
});
