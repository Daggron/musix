import {create} from 'zustand';
import {
  getAllPlaylists,
  getPlaylist,
  getPlaylistTracks,
  createPlaylist as dbCreatePlaylist,
  renamePlaylist as dbRenamePlaylist,
  deletePlaylist as dbDeletePlaylist,
  addTrackToPlaylist as dbAddTrack,
  removeTrackFromPlaylist as dbRemoveTrack,
  reorderPlaylistTracks as dbReorder,
  getLikedTrackIds,
  getLikedTracks,
  getLikedCount,
  toggleLike as dbToggleLike,
  type Playlist,
  type Track,
} from '../db';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface PlaylistState {
  playlists: Playlist[];
  likedIds: Set<string>;
  likedCount: number;

  loadPlaylists: () => void;
  loadLiked: () => void;

  createPlaylist: (name: string, note?: string) => string;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;

  addTrack: (playlistId: string, trackId: string) => void;
  removeTrack: (playlistId: string, trackId: string) => void;
  reorderTracks: (playlistId: string, trackIds: string[]) => void;
  getPlaylistDetail: (id: string) => {name: string; note: string; tracks: Track[]} | undefined;

  toggleLike: (trackId: string) => void;
  isLiked: (trackId: string) => boolean;
  getLikedTracks: () => Track[];
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  likedIds: new Set<string>(),
  likedCount: 0,

  loadPlaylists: () => {
    set({playlists: getAllPlaylists()});
  },

  loadLiked: () => {
    set({likedIds: getLikedTrackIds(), likedCount: getLikedCount()});
  },

  createPlaylist: (name, note = '') => {
    const id = uuid();
    dbCreatePlaylist(id, name, note);
    set({playlists: getAllPlaylists()});
    return id;
  },

  renamePlaylist: (id, name) => {
    dbRenamePlaylist(id, name);
    set({playlists: getAllPlaylists()});
  },

  deletePlaylist: (id) => {
    dbDeletePlaylist(id);
    set({playlists: getAllPlaylists()});
  },

  addTrack: (playlistId, trackId) => {
    dbAddTrack(playlistId, trackId);
    set({playlists: getAllPlaylists()});
  },

  removeTrack: (playlistId, trackId) => {
    dbRemoveTrack(playlistId, trackId);
    set({playlists: getAllPlaylists()});
  },

  reorderTracks: (playlistId, trackIds) => {
    dbReorder(playlistId, trackIds);
  },

  getPlaylistDetail: (id) => {
    const pl = getPlaylist(id);
    if (!pl) return undefined;
    const tracks = getPlaylistTracks(id);
    return {name: pl.name, note: pl.note, tracks};
  },

  toggleLike: (trackId) => {
    dbToggleLike(trackId);
    set({likedIds: getLikedTrackIds(), likedCount: getLikedCount()});
  },

  isLiked: (trackId) => get().likedIds.has(trackId),

  getLikedTracks: () => getLikedTracks(),
}));
