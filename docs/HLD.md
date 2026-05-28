# Musix — High-Level Design

## 1. System Overview

Musix is an audiophile-grade lossless music player for iOS 16+ and Android 10+. It plays local FLAC, ALAC, and WAV files with a custom native DSP pipeline, wrapped in a warm analog UI with vinyl/cassette player visualizations.

```
┌─────────────────────────────────────────────────────────┐
│                   React Native App                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐             │
│  │  Zustand  │  │  React   │  │  Reanimated│             │
│  │  Store    │  │  Nav     │  │  + Skia    │             │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘             │
│       │              │              │                    │
│  ─────┴──────────────┴──────────────┴──────── JSI ───── │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Turbo Modules (Native)                 │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │  │
│  │  │  Player   │  │  Scanner  │  │  EQ              │ │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────────────┘ │  │
│  └───────┼──────────────┼─────────────┼───────────────┘  │
│          │              │             │                   │
│  ┌───────┴──────────────┴─────────────┴───────────────┐  │
│  │            Audio Engine (C++ core)                  │  │
│  │  TagLib │ FLAC decoder │ Parametric EQ │ Gain stage │  │
│  └────────────────────┬───────────────────────────────┘  │
│                       │                                  │
│          ┌────────────┴────────────┐                     │
│          │  Oboe (Android)         │                     │
│          │  AVAudioEngine (iOS)    │                     │
│          └─────────────────────────┘                     │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │  OP-SQLite    │  │  MMKV        │                     │
│  │  (library,    │  │  (prefs,     │                     │
│  │   playlists)  │  │   resume)    │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

## 2. Monorepo Layout

```
musix/
├── app/                          # React Native application
│   ├── src/
│   │   ├── screens/              # Songs, Search, Playlists, NowPlaying
│   │   ├── components/           # TrackRow, AlbumCover, MiniPlayer, TabBar, etc.
│   │   ├── modals/               # Equalizer, AddMusic
│   │   ├── navigation/           # React Navigation config
│   │   ├── store/                # Zustand stores
│   │   ├── db/                   # OP-SQLite schema, queries, MMKV keys
│   │   ├── theme/                # Design tokens, palette definitions, dark/light
│   │   ├── hooks/                # usePlayer, useLibrary, useTheme, etc.
│   │   └── assets/               # Fonts (Instrument Serif, DM Sans, JetBrains Mono)
│   ├── android/
│   ├── ios/
│   └── package.json
├── packages/
│   └── audio-engine/             # Native audio module
│       ├── src/
│       │   ├── cpp/              # Shared C++ core (decoder, DSP, gapless buffer)
│       │   ├── android/          # Oboe integration, Kotlin Turbo Module bindings
│       │   └── ios/              # AVAudioEngine integration, Swift Turbo Module bindings
│       ├── js/                   # TypeScript interface definitions
│       └── package.json
└── package.json                  # Workspace root
```

## 3. Turbo Module Interfaces

Three separate Turbo Modules — split by concern so the JS side imports only what it needs and native code stays focused.

### 3.1 PlayerModule

```typescript
interface PlayerModule {
  // Lifecycle
  loadTrack(filePath: string): Promise<void>;
  preloadNext(filePath: string): Promise<void>;   // gapless pre-buffer

  // Transport
  play(): void;
  pause(): void;
  stop(): void;
  seekToFrame(positionMs: number): void;           // snaps to nearest FLAC frame

  // State (synchronous via JSI)
  getPositionMs(): number;
  getDurationMs(): number;
  isPlaying(): boolean;

  // Events (emitted to JS)
  // "onTrackEnd"        — current track finished, triggers gapless handoff
  // "onPositionUpdate"  — throttled position updates (~4/sec for progress bar)
  // "onAudioFocusChange" — duck | pause | resume
  // "onHeadphoneDisconnect"
  // "onError"           — decode failure, file not found, etc.
}
```

### 3.2 ScannerModule

```typescript
interface ScannerModule {
  // Full device scan — streams results via events
  startFullScan(): Promise<void>;
  cancelScan(): void;

  // Single file metadata extraction
  getMetadata(filePath: string): Promise<TrackMetadata>;

  // Events
  // "onScanProgress"    — { found: number, current: string }
  // "onScanComplete"    — { totalFound: number }
  // "onScanError"       — { path: string, error: string }
}

interface TrackMetadata {
  title: string | null;
  artist: string | null;
  album: string | null;
  year: number | null;
  duration: number;            // ms
  bitrate: number;             // kbps
  sampleRate: number;          // Hz
  bitDepth: number;            // 16, 24, 32
  codec: "flac" | "alac" | "wav";
  coverArt: string | null;     // base64 encoded, or null
  filePath: string;
  fileSize: number;            // bytes
}
```

### 3.3 EQModule

```typescript
interface EQModule {
  setEnabled(enabled: boolean): void;
  setPreset(preset: "default" | "studio" | "vinyl"): void;
  getBandValues(): number[];    // current 10-band values, [-6, +6] dB each

  // Future v2: manual band control
  // setBand(index: number, gainDb: number): void;
}
```

## 4. DSP Signal Chain

```
Audio Thread (real-time, high priority)
─────────────────────────────────────────────────────────

  File on disk
       │
  ┌────┴─────┐
  │  Decoder  │   FLAC/ALAC/WAV → PCM float32
  │  (TagLib   │   Runs ahead of playback to fill ring buffer
  │   decode)  │
  └────┬─────┘
       │
  ┌────┴──────────┐
  │  Ring Buffer   │   ~200ms pre-buffered PCM
  │  (lock-free)   │   Next track pre-decoded into secondary buffer
  └────┬──────────┘   for gapless handoff
       │
  ┌────┴──────────┐
  │  Parametric EQ │   10-band IIR biquad filters
  │                │   Preset = array of 10 gain values
  │  Default:  all 0 dB (bypass)
  │  Studio:   [0,0,0,0,0,+1,+1,+2,+2,+1]
  │  Vinyl:    [+3,+2,+1,0,-1,-2,-2,-1,-2,-3]
  └────┬──────────┘
       │
  ┌────┴──────────┐
  │  Gain Stage    │   Volume normalization
  └────┬──────────┘
       │
  ┌────┴────────────────────────┐
  │  Platform Output             │
  │  Android: Oboe AAudio/OpenSL │
  │  iOS: AVAudioEngine           │
  └──────────────────────────────┘
```

Decoder runs on a background thread, feeds a lock-free ring buffer. The audio callback (Oboe/AVAudioEngine) pulls from the buffer, applies EQ + gain, and writes to output. This ensures the audio callback never blocks on I/O.

## 5. Data Model

### 5.1 SQLite Schema (OP-SQLite)

```sql
CREATE TABLE tracks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path   TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,            -- parsed or "Unknown Title"
  artist      TEXT NOT NULL,            -- parsed or "Unknown Artist"
  album       TEXT NOT NULL,            -- parsed or "Unknown Album"
  year        INTEGER,
  duration_ms INTEGER NOT NULL,
  bitrate     INTEGER NOT NULL,
  sample_rate INTEGER NOT NULL,
  bit_depth   INTEGER NOT NULL,
  codec       TEXT NOT NULL,            -- "flac", "alac", "wav"
  file_size   INTEGER NOT NULL,
  cover_art   BLOB,                     -- embedded album art, nullable
  hue         INTEGER DEFAULT 30,       -- derived from album name hash, for gradient fallback
  created_at  INTEGER NOT NULL          -- epoch ms, for "recent" sort
);

CREATE INDEX idx_tracks_artist ON tracks(artist);
CREATE INDEX idx_tracks_album ON tracks(album);
CREATE INDEX idx_tracks_title ON tracks(title);

CREATE TABLE playlists (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  note        TEXT,
  cover_uri   TEXT,                     -- custom cover, nullable
  position    INTEGER NOT NULL,         -- ordering
  created_at  INTEGER NOT NULL
);

CREATE TABLE playlist_tracks (
  playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id    INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,         -- ordering within playlist
  PRIMARY KEY (playlist_id, track_id)
);

CREATE TABLE liked_tracks (
  track_id    INTEGER PRIMARY KEY REFERENCES tracks(id) ON DELETE CASCADE,
  liked_at    INTEGER NOT NULL
);
```

### 5.2 MMKV Keys

```
theme.mode          "light" | "dark"
theme.accent        "oxblood" | "brass" | "forest" | "indigo" | "plum"
player.kind         "vinyl" | "cassette"
eq.preset           "default" | "studio" | "vinyl"
eq.enabled          boolean
resume.trackId      number | null
resume.positionMs   number
resume.queue        JSON string of track IDs
scan.completed      boolean        -- has initial scan been done
```

## 6. Zustand Store Shape

```typescript
// Player store — global playback state
interface PlayerStore {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  positionMs: number;
  shuffle: boolean;
  repeat: boolean;

  play: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  seek: (ms: number) => void;
  shuffleAll: (tracks: Track[]) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setQueue: (tracks: Track[]) => void;
}

// Library store — scanned music index
interface LibraryStore {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  isScanning: boolean;
  scanProgress: number;

  loadLibrary: () => Promise<void>;
  startScan: () => Promise<void>;
}

// Playlist store
interface PlaylistStore {
  playlists: Playlist[];
  likedIds: Set<number>;

  create: (name: string) => void;
  rename: (id: number, name: string) => void;
  remove: (id: number) => void;
  reorder: (id: number, trackIds: number[]) => void;
  toggleLike: (trackId: number) => void;
}

// Theme store — persisted via MMKV
interface ThemeStore {
  mode: "light" | "dark";
  accent: "oxblood" | "brass" | "forest" | "indigo" | "plum";
  playerKind: "vinyl" | "cassette";

  setMode: (mode: "light" | "dark") => void;
  setAccent: (accent: string) => void;
  setPlayerKind: (kind: "vinyl" | "cassette") => void;
}
```

## 7. Navigation Tree

```
BottomTabs
├── SongsScreen            # Track list with sort (title/artist/recent), shuffle all
├── SearchScreen           # Search bar, recent searches, genre browse tiles, results
└── PlaylistsScreen        # Playlist list, liked songs
    └── PlaylistDetailScreen   # [stack push] Track list, rename, delete, reorder

Modal stack (over everything)
├── NowPlayingModal        # Full-screen player (vinyl/cassette), progress, transport
│   └── EqualizerModal     # 10-band EQ, 3 presets, enable/disable toggle
└── AddMusicModal          # File picker + scan trigger

MiniPlayer                 # Persistent above tab bar when not in NowPlaying

OnboardingFlow             # First launch only: welcome → permissions → scan progress
```

## 8. Audio Focus State Machine

```
                  ┌──────────┐
         app start│          │
         ─────────►  IDLE    │
                  │ (no track)│
                  └─────┬────┘
                        │ play()
                        ▼
                  ┌──────────┐
            ┌─────│ PLAYING  │◄──── resume after call
            │     └──┬───┬───┘      headphone reconnect
            │        │   │
   phone    │  hdphn │   │ notification
   call     │  disc. │   │ sound
            ▼        ▼   ▼
      ┌─────────┐  ┌─────────┐
      │ PAUSED  │  │ DUCKED  │
      │(by focus)│  │(lowered)│
      └─────────┘  └────┬────┘
           │             │ notification ends
           │             ▼
           │       ┌──────────┐
           │       │ PLAYING  │
           │       └──────────┘
           │
           │ call ends → auto-resume → PLAYING
           │ hdphn disc. → stays PAUSED (user must resume)
```

## 9. Design Tokens

```typescript
const PALETTE = {
  oxblood: { color: "#8a2e1f", soft: "#b85543" },
  brass:   { color: "#a8771a", soft: "#d29840" },
  forest:  { color: "#1f5a3c", soft: "#3d8261" },
  indigo:  { color: "#2c3e72", soft: "#5167a3" },
  plum:    { color: "#5e2049", soft: "#894270" },
};

const LIGHT = {
  paper:     "#f1e6cf",
  paper2:    "#ebdcc1",
  paper3:    "#e3d0ad",
  card:      "#faf2dd",
  cardSoft:  "#f6ead0",
  ink:       "#2a1e14",
  ink2:      "#4a3526",
  ink3:      "#7a5d44",
  ink4:      "#a08769",
  rule:      "rgba(42, 30, 20, 0.12)",
  ruleStrong:"rgba(42, 30, 20, 0.22)",
  flac:      "#1f5a4a",
};

const DARK = {
  paper:     "#1a1208",
  paper2:    "#221810",
  paper3:    "#2c1f15",
  card:      "#251a10",
  cardSoft:  "#2d2117",
  ink:       "#f1e6cf",
  ink2:      "#d6c4a5",
  ink3:      "#a18866",
  ink4:      "#76624a",
  rule:      "rgba(241, 230, 207, 0.10)",
  ruleStrong:"rgba(241, 230, 207, 0.20)",
  flac:      "#1f5a4a",
};

const FONTS = {
  serif: "Instrument Serif",   // display: titles, track names
  sans:  "DM Sans",            // body: metadata, buttons
  mono:  "JetBrains Mono",     // data: bitrate, duration, tab labels
};
```

## 10. Key Constraints & Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Oboe + AVAudioEngine parity | Audio behavior differs across platforms | Shared C++ core for DSP, platform-specific only for I/O |
| FLAC seeking latency on large files | Seek feels sluggish on 24-bit/192kHz files | Pre-decode seek table on scan, cache in SQLite |
| Storage permission fragmentation (Android 10-13+) | Scanner fails silently on some devices | Dual permission path: READ_EXTERNAL_STORAGE + READ_MEDIA_AUDIO |
| Reanimated + Skia interop | Animation jank if worklets and Skia canvas fight for UI thread | Vinyl (Reanimated only) and Cassette (Skia canvas) never render simultaneously |
| TagLib C++ build on both platforms | Complex cross-compilation setup | Use pre-built TagLib static libraries per architecture |
| Cover art memory pressure | Large embedded art (5MB+) on many tracks causes OOM | Extract + resize to max 500x500 on scan, store thumbnail |
