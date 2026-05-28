import {runMigrations} from './schema';
import {seedIfEmpty} from './seed';

export {getDb} from './connection';
export {runMigrations} from './schema';
export {seedIfEmpty} from './seed';

export type {Track} from './tracks';
export {
  getAllTracks,
  getTracksByArtist,
  getTracksByRecent,
  getTrackById,
  getTracksByIds,
  searchTracks,
  getTracksByGenre,
  getGenres,
  insertTrack,
} from './tracks';

export type {Playlist, PlaylistWithTracks} from './playlists';
export {
  getAllPlaylists,
  getPlaylist,
  getPlaylistTracks,
  createPlaylist,
  renamePlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
  getPlaylistTrackHues,
} from './playlists';

export {
  getLikedTrackIds,
  getLikedTracks,
  getLikedCount,
  isLiked,
  toggleLike,
} from './liked';

export function initDatabase(): void {
  runMigrations();
  seedIfEmpty();
}
