import {getDb} from './connection';
import type {Track} from './tracks';

export interface Playlist {
  id: string;
  name: string;
  note: string;
  createdAt: number;
  updatedAt: number;
  trackCount: number;
}

export interface PlaylistWithTracks extends Playlist {
  trackIds: string[];
}

function rowToPlaylist(row: Record<string, unknown>): Playlist {
  return {
    id: row.id as string,
    name: row.name as string,
    note: row.note as string,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
    trackCount: (row.track_count as number) ?? 0,
  };
}

export function getAllPlaylists(): Playlist[] {
  const {rows} = getDb().executeSync(
    `SELECT p.*, COUNT(pt.track_id) AS track_count
     FROM playlists p
     LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
     GROUP BY p.id
     ORDER BY p.updated_at DESC`,
  );
  return rows.map(rowToPlaylist);
}

export function getPlaylist(id: string): PlaylistWithTracks | undefined {
  const {rows: pRows} = getDb().executeSync(
    `SELECT p.*, COUNT(pt.track_id) AS track_count
     FROM playlists p
     LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
     WHERE p.id = ?
     GROUP BY p.id`,
    [id],
  );
  if (pRows.length === 0) return undefined;

  const {rows: tRows} = getDb().executeSync(
    `SELECT track_id FROM playlist_tracks
     WHERE playlist_id = ? ORDER BY position`,
    [id],
  );

  return {
    ...rowToPlaylist(pRows[0]),
    trackIds: tRows.map((r) => r.track_id as string),
  };
}

export function getPlaylistTracks(playlistId: string): Track[] {
  const {rows} = getDb().executeSync(
    `SELECT t.*, t.file_path, t.added_at
     FROM playlist_tracks pt
     JOIN tracks t ON t.id = pt.track_id
     WHERE pt.playlist_id = ?
     ORDER BY pt.position`,
    [playlistId],
  );
  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    artist: r.artist as string,
    album: r.album as string,
    year: r.year as number,
    duration: r.duration as number,
    bitrate: r.bitrate as number,
    genre: r.genre as string,
    hue: r.hue as number,
    filePath: (r.file_path as string) ?? null,
    artworkPath: (r.artwork_path as string) ?? null,
    addedAt: r.added_at as number,
  }));
}

export function createPlaylist(
  id: string,
  name: string,
  note: string = '',
): void {
  getDb().executeSync(
    'INSERT INTO playlists (id, name, note) VALUES (?, ?, ?)',
    [id, name, note],
  );
}

export function renamePlaylist(id: string, name: string): void {
  getDb().executeSync(
    "UPDATE playlists SET name = ?, updated_at = strftime('%s','now') WHERE id = ?",
    [name, id],
  );
}

export function deletePlaylist(id: string): void {
  const db = getDb();
  db.executeSync('DELETE FROM playlist_tracks WHERE playlist_id = ?', [id]);
  db.executeSync('DELETE FROM playlists WHERE id = ?', [id]);
}

export function addTrackToPlaylist(
  playlistId: string,
  trackId: string,
): void {
  const db = getDb();
  const {rows} = db.executeSync(
    'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM playlist_tracks WHERE playlist_id = ?',
    [playlistId],
  );
  const nextPos = (rows[0]?.next_pos as number) ?? 0;
  db.executeSync(
    'INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)',
    [playlistId, trackId, nextPos],
  );
  db.executeSync(
    "UPDATE playlists SET updated_at = strftime('%s','now') WHERE id = ?",
    [playlistId],
  );
}

export function removeTrackFromPlaylist(
  playlistId: string,
  trackId: string,
): void {
  const db = getDb();
  db.executeSync(
    'DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
    [playlistId, trackId],
  );
  db.executeSync(
    "UPDATE playlists SET updated_at = strftime('%s','now') WHERE id = ?",
    [playlistId],
  );
}

export function reorderPlaylistTracks(
  playlistId: string,
  trackIds: string[],
): void {
  const db = getDb();
  db.executeSync('DELETE FROM playlist_tracks WHERE playlist_id = ?', [
    playlistId,
  ]);
  for (let i = 0; i < trackIds.length; i++) {
    db.executeSync(
      'INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)',
      [playlistId, trackIds[i], i],
    );
  }
  db.executeSync(
    "UPDATE playlists SET updated_at = strftime('%s','now') WHERE id = ?",
    [playlistId],
  );
}

export function getPlaylistTrackHues(
  playlistId: string,
  limit: number = 4,
): number[] {
  const {rows} = getDb().executeSync(
    `SELECT t.hue FROM playlist_tracks pt
     JOIN tracks t ON t.id = pt.track_id
     WHERE pt.playlist_id = ?
     ORDER BY pt.position LIMIT ?`,
    [playlistId, limit],
  );
  return rows.map((r) => r.hue as number);
}
