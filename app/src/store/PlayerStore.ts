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
  durationMs: number;
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

function preloadNextInQueue(queue: string[], queueIndex: number, repeat: RepeatMode, shuffle: boolean): void {
  if (queue.length <= 1) return;

  let nextIdx: number;
  if (repeat === 'one') {
    nextIdx = queueIndex;
  } else if (shuffle) {
    nextIdx = Math.floor(Math.random() * queue.length);
  } else {
    nextIdx = queueIndex + 1;
    if (nextIdx >= queue.length) {
      if (repeat === 'all') {
        nextIdx = 0;
      } else {
        return;
      }
    }
  }

  const nextTrack = getTrackById(queue[nextIdx]);
  if (nextTrack?.filePath) {
    PlayerModule.preloadNext(nextTrack.filePath).catch(() => {});
  }
}

let syncInterval: ReturnType<typeof setInterval> | null = null;

function setNowPlayingForTrack(track: Track, durationMs: number): void {
  PlayerModule.setNowPlaying(
    track.title,
    track.artist,
    track.album,
    durationMs / 1000,
  );
}

function startSync(get: () => PlayerState): void {
  stopSync();
  syncInterval = setInterval(() => {
    const state = get();

    if (PlayerModule.hasRemotePlay()) {
      PlayerModule.clearRemotePlay();
      if (!state.isPlaying) {
        usePlayerStore.getState().resume();
      }
      return;
    }

    if (PlayerModule.hasRemotePause()) {
      PlayerModule.clearRemotePause();
      if (state.isPlaying) {
        usePlayerStore.getState().pause();
      }
      return;
    }

    if (PlayerModule.hasRemoteNext()) {
      PlayerModule.clearRemoteNext();
      usePlayerStore.getState().next();
      return;
    }

    if (PlayerModule.hasRemotePrev()) {
      PlayerModule.clearRemotePrev();
      usePlayerStore.getState().prev();
      return;
    }

    if (PlayerModule.hasRemoteSeek()) {
      PlayerModule.clearRemoteSeek();
      const seekMs = PlayerModule.remoteSeekPositionMs();
      usePlayerStore.getState().seekTo(seekMs);
      return;
    }

    if (!state.isPlaying) return;

    const positionMs = PlayerModule.getPositionMs();
    const durationMs = PlayerModule.getDurationMs();

    if (PlayerModule.hasTrackTransitioned()) {
      PlayerModule.clearTrackTransitioned();
      const {queue, queueIndex, repeat, shuffle: isShuffle} = state;
      let nextIndex: number;
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
      } else {
        nextIndex = queueIndex + 1;
        if (nextIndex >= queue.length) {
          nextIndex = repeat === 'all' ? 0 : queueIndex;
        }
      }
      const nextTrack = getTrackById(queue[nextIndex]);
      if (nextTrack) {
        usePlayerStore.setState({
          currentTrack: nextTrack,
          queueIndex: nextIndex,
          positionMs: 0,
          durationMs: PlayerModule.getDurationMs(),
        });
        setNowPlayingForTrack(nextTrack, PlayerModule.getDurationMs());
        preloadNextInQueue(queue, nextIndex, repeat, isShuffle);
        saveResume(usePlayerStore.getState());
      }
      return;
    }

    if (PlayerModule.hasTrackEnded()) {
      PlayerModule.clearTrackEnded();
      usePlayerStore.getState().next();
      return;
    }

    if (PlayerModule.wasInterrupted()) {
      PlayerModule.clearInterrupted();
      stopSync();
      usePlayerStore.setState({isPlaying: false});
      PlayerModule.updateNowPlayingElapsed(positionMs / 1000, 0);
      saveResume(usePlayerStore.getState());
      return;
    }

    PlayerModule.updateNowPlayingElapsed(positionMs / 1000, 1);
    usePlayerStore.setState({positionMs, durationMs});
  }, 250);
}

function stopSync(): void {
  if (syncInterval !== null) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  const persist = () => saveResume(get());

  return {
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    positionMs: 0,
    durationMs: 0,
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

      if (track?.filePath) {
        PlayerModule.loadTrack(track.filePath)
          .then(() => {
            PlayerModule.seekToFrame(r.positionMs);
            const dur = PlayerModule.getDurationMs();
            set({durationMs: dur});
            setNowPlayingForTrack(track, dur);
            PlayerModule.updateNowPlayingElapsed(r.positionMs / 1000, 0);
            startSync(get);
          })
          .catch(() => {});
      }
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
          .then(() => {
            PlayerModule.play();
            const dur = PlayerModule.getDurationMs();
            set({durationMs: dur});
            setNowPlayingForTrack(track, dur);
            startSync(get);
            const s = get();
            preloadNextInQueue(s.queue, s.queueIndex, s.repeat, s.shuffle);
          })
          .catch(() => {
            const {queue: q} = get();
            if (q.length > 1) {
              get().next();
            } else {
              set({isPlaying: false});
            }
          });
      }
    },

    pause: () => {
      PlayerModule.pause();
      const pos = PlayerModule.getPositionMs();
      PlayerModule.updateNowPlayingElapsed(pos / 1000, 0);
      set({isPlaying: false});
      persist();
    },
    resume: () => {
      PlayerModule.play();
      const pos = PlayerModule.getPositionMs();
      PlayerModule.updateNowPlayingElapsed(pos / 1000, 1);
      set({isPlaying: true});
      startSync(get);
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
            PlayerModule.updateNowPlayingElapsed(0, 0);
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
            .then(() => {
              PlayerModule.play();
              const dur = PlayerModule.getDurationMs();
              set({durationMs: dur});
              setNowPlayingForTrack(track, dur);
              startSync(get);
              preloadNextInQueue(queue, nextIndex, repeat, isShuffle);
            })
            .catch(() => {
              if (queue.length > 1 && nextIndex < queue.length - 1) {
                get().next();
              } else {
                set({isPlaying: false});
              }
            });
        }
      }
    },

    prev: () => {
      const {queue, queueIndex, positionMs} = get();
      if (queue.length === 0) return;

      if (positionMs > 3000 || queueIndex === 0) {
        set({positionMs: 0});
        PlayerModule.seekToFrame(0);
        PlayerModule.updateNowPlayingElapsed(0, get().isPlaying ? 1 : 0);
        persist();
        return;
      }

      const prevIndex = queueIndex - 1;
      const track = getTrackById(queue[prevIndex]);
      if (track) {
        set({currentTrack: track, queueIndex: prevIndex, positionMs: 0});
        persist();
        if (track.filePath) {
          const {repeat: r, shuffle: sh} = get();
          PlayerModule.loadTrack(track.filePath)
            .then(() => {
              PlayerModule.play();
              const dur = PlayerModule.getDurationMs();
              set({durationMs: dur});
              setNowPlayingForTrack(track, dur);
              startSync(get);
              preloadNextInQueue(queue, prevIndex, r, sh);
            })
            .catch(() => {
              set({isPlaying: false});
              stopSync();
            });
        }
      }
    },

    seekTo: (ms) => {
      PlayerModule.seekToFrame(ms);
      PlayerModule.updateNowPlayingElapsed(ms / 1000, get().isPlaying ? 1 : 0);
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
      stopSync();
      set({
        currentTrack: null,
        queue: [],
        queueIndex: -1,
        isPlaying: false,
        positionMs: 0,
        durationMs: 0,
      });
      persist();
    },
  };
});
