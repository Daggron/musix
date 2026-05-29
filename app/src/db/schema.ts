import {getDb} from './connection';

const SCHEMA_VERSION = 4;

const MIGRATIONS: Record<number, string[]> = {
  1: [
    `CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      album TEXT NOT NULL,
      year INTEGER NOT NULL DEFAULT 0,
      duration INTEGER NOT NULL DEFAULT 0,
      bitrate INTEGER NOT NULL DEFAULT 0,
      genre TEXT NOT NULL DEFAULT '',
      hue INTEGER NOT NULL DEFAULT 0,
      file_path TEXT,
      added_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    )`,
    `CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    )`,
    `CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
      track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      PRIMARY KEY (playlist_id, track_id)
    )`,
    `CREATE TABLE IF NOT EXISTS liked_tracks (
      track_id TEXT PRIMARY KEY NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
      liked_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist)`,
    `CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album)`,
    `CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre)`,
    `CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id, position)`,
  ],
  3: [
    `ALTER TABLE tracks ADD COLUMN artwork_path TEXT`,
  ],
};

export function runMigrations(): void {
  const db = getDb();

  const {rows} = db.executeSync('PRAGMA user_version');
  const currentVersion = (rows[0]?.user_version as number) ?? 0;

  if (currentVersion < SCHEMA_VERSION) {
    db.executeSync('PRAGMA foreign_keys = ON');

    for (let v = currentVersion + 1; v <= SCHEMA_VERSION; v++) {
      const stmts = MIGRATIONS[v];
      if (!stmts) continue;
      for (const sql of stmts) {
        db.executeSync(sql);
      }
    }

    db.executeSync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }

  ensureArtworkColumn(db);
  fixAbsolutePaths(db);
}

function ensureArtworkColumn(db: ReturnType<typeof getDb>): void {
  const {rows} = db.executeSync("PRAGMA table_info(tracks)");
  const hasCol = rows.some((r) => (r.name as string) === 'artwork_path');
  if (!hasCol) {
    db.executeSync('ALTER TABLE tracks ADD COLUMN artwork_path TEXT');
  }
}

function fixAbsolutePaths(db: ReturnType<typeof getDb>): void {
  const {rows} = db.executeSync(
    "SELECT id, file_path FROM tracks WHERE file_path LIKE '%/Documents/%'",
  );
  for (const row of rows) {
    const fp = row.file_path as string;
    const docsIdx = fp.indexOf('/Documents/');
    if (docsIdx >= 0) {
      const relative = fp.slice(docsIdx + '/Documents'.length);
      db.executeSync('UPDATE tracks SET file_path = ? WHERE id = ?', [
        relative,
        row.id as string,
      ]);
    }
  }
}
