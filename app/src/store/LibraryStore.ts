import {create} from 'zustand';
import {
  getAllTracks,
  getTracksByArtist,
  getTracksByRecent,
  searchTracks,
  getTracksByGenre,
  getGenres,
  type Track,
} from '../db';

type SortMode = 'title' | 'artist' | 'recent';

interface LibraryState {
  tracks: Track[];
  sortMode: SortMode;
  genres: {label: string; hue: number; count: number}[];
  loaded: boolean;

  loadLibrary: () => void;
  setSortMode: (mode: SortMode) => void;
  search: (query: string) => Track[];
  getByGenre: (genre: string) => Track[];
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  tracks: [],
  sortMode: 'title',
  genres: [],
  loaded: false,

  loadLibrary: () => {
    const mode = get().sortMode;
    const tracks =
      mode === 'artist'
        ? getTracksByArtist()
        : mode === 'recent'
          ? getTracksByRecent()
          : getAllTracks();
    const genres = getGenres();
    set({tracks, genres, loaded: true});
  },

  setSortMode: (mode) => {
    set({sortMode: mode});
    const tracks =
      mode === 'artist'
        ? getTracksByArtist()
        : mode === 'recent'
          ? getTracksByRecent()
          : getAllTracks();
    set({tracks});
  },

  search: (query) => searchTracks(query),
  getByGenre: (genre) => getTracksByGenre(genre),
}));
