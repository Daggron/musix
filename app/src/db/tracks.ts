import {getDb} from './connection';
import {toRelativePath, toAbsolutePath} from '../utils';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  year: number;
  duration: number;
  bitrate: number;
  genre: string;
  hue: number;
  filePath: string | null;
  artworkPath: string | null;
  addedAt: number;
}

function rowToTrack(row: Record<string, unknown>): Track {
  return {
    id: row.id as string,
    title: row.title as string,
    artist: row.artist as string,
    album: row.album as string,
    year: row.year as number,
    duration: row.duration as number,
    bitrate: row.bitrate as number,
    genre: row.genre as string,
    hue: row.hue as number,
    filePath: row.file_path ? toAbsolutePath(row.file_path as string) : null,
    artworkPath: (row.artwork_path as string) ?? null,
    addedAt: row.added_at as number,
  };
}

export function getAllTracks(): Track[] {
  const {rows} = getDb().executeSync('SELECT * FROM tracks ORDER BY title');
  return rows.map(rowToTrack);
}

export function getTracksByArtist(): Track[] {
  const {rows} = getDb().executeSync(
    'SELECT * FROM tracks ORDER BY artist, album, title',
  );
  return rows.map(rowToTrack);
}

export function getTracksByRecent(): Track[] {
  const {rows} = getDb().executeSync(
    'SELECT * FROM tracks ORDER BY added_at DESC, title',
  );
  return rows.map(rowToTrack);
}

export function getTrackById(id: string): Track | undefined {
  const {rows} = getDb().executeSync('SELECT * FROM tracks WHERE id = ?', [id]);
  return rows.length > 0 ? rowToTrack(rows[0]) : undefined;
}

export function getTracksByIds(ids: string[]): Track[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  const {rows} = getDb().executeSync(
    `SELECT * FROM tracks WHERE id IN (${placeholders})`,
    ids,
  );
  const map = new Map(rows.map((r) => [r.id as string, rowToTrack(r)]));
  return ids.flatMap((id) => {
    const t = map.get(id);
    return t ? [t] : [];
  });
}

export function searchTracks(query: string): Track[] {
  const q = `%${query}%`;
  const {rows} = getDb().executeSync(
    `SELECT * FROM tracks
     WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
     ORDER BY title`,
    [q, q, q],
  );
  return rows.map(rowToTrack);
}

export function getTracksByGenre(genre: string): Track[] {
  const {rows} = getDb().executeSync(
    'SELECT * FROM tracks WHERE genre = ? ORDER BY title',
    [genre],
  );
  return rows.map(rowToTrack);
}

export function getGenres(): {label: string; hue: number; count: number}[] {
  const {rows} = getDb().executeSync(
    `SELECT genre AS label, MIN(hue) AS hue, COUNT(*) AS count
     FROM tracks GROUP BY genre ORDER BY genre`,
  );
  return rows.map((r) => ({
    label: r.label as string,
    hue: r.hue as number,
    count: r.count as number,
  }));
}

export function insertTrack(track: Omit<Track, 'addedAt'>): void {
  getDb().executeSync(
    `INSERT OR REPLACE INTO tracks (id, title, artist, album, year, duration, bitrate, genre, hue, file_path, artwork_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      track.id,
      track.title,
      track.artist,
      track.album,
      track.year,
      track.duration,
      track.bitrate,
      track.genre,
      track.hue,
      track.filePath ? toRelativePath(track.filePath) : null,
      track.artworkPath ?? null,
    ],
  );
}
