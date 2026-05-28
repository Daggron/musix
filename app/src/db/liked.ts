import {getDb} from './connection';
import type {Track} from './tracks';

export function getLikedTrackIds(): Set<string> {
  const {rows} = getDb().executeSync('SELECT track_id FROM liked_tracks');
  return new Set(rows.map((r) => r.track_id as string));
}

export function getLikedTracks(): Track[] {
  const {rows} = getDb().executeSync(
    `SELECT t.*, t.file_path, t.added_at
     FROM liked_tracks lt
     JOIN tracks t ON t.id = lt.track_id
     ORDER BY lt.liked_at DESC`,
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
    addedAt: r.added_at as number,
  }));
}

export function getLikedCount(): number {
  const {rows} = getDb().executeSync(
    'SELECT COUNT(*) AS count FROM liked_tracks',
  );
  return (rows[0]?.count as number) ?? 0;
}

export function isLiked(trackId: string): boolean {
  const {rows} = getDb().executeSync(
    'SELECT 1 FROM liked_tracks WHERE track_id = ?',
    [trackId],
  );
  return rows.length > 0;
}

export function toggleLike(trackId: string): boolean {
  const db = getDb();
  if (isLiked(trackId)) {
    db.executeSync('DELETE FROM liked_tracks WHERE track_id = ?', [trackId]);
    return false;
  }
  db.executeSync('INSERT INTO liked_tracks (track_id) VALUES (?)', [trackId]);
  return true;
}
