# Musix — Implementation Plan

## Phase 0: Scaffold (Days 1–2)

**Goal:** Monorepo skeleton, build tooling, CI green on empty app.

- Initialize React Native 0.76+ (New Architecture enabled) via `npx @react-native-community/cli init`
- Set up monorepo: `app/` + `packages/audio-engine/`
- Configure Yarn/npm workspaces
- Install core dependencies: React Navigation, Zustand, Reanimated 3, MMKV, OP-SQLite
- Add fonts: Instrument Serif, DM Sans, JetBrains Mono
- Stub the three Turbo Module specs (PlayerModule, ScannerModule, EQModule) — TypeScript interfaces only, native side returns mock values
- Verify app builds and runs on both iOS simulator and Android emulator
- Set up Jest with React Native Testing Library

**Deliverable:** App launches on both platforms showing a placeholder screen. Turbo Module stubs callable from JS.

**Gate:** `yarn ios` and `yarn android` both build clean. Jest runs.

---

## Phase 1: Design System + Static Shells (Days 3–5)

**Goal:** All screens navigable with correct theming, no real data or playback.

**Depends on:** Phase 0

### 1a. Theme Infrastructure
- Implement design tokens (PALETTE, LIGHT, DARK, FONTS) as a theme module
- Build ThemeStore (Zustand + MMKV persistence)
- Create `useTheme` hook that returns resolved colors for current mode + accent

### 1b. Navigation
- Bottom tabs: Songs, Search, Playlists
- Modal stack: NowPlaying, Equalizer, AddMusic
- MiniPlayer rendered above tab bar (persistent when track loaded)
- Onboarding flow (conditional on `scan.completed` MMKV key)

### 1c. Screen Shells
- SongsScreen: header, sort tabs (title/artist/recent), shuffle-all button, empty track list
- SearchScreen: search bar, genre browse tiles, empty results
- PlaylistsScreen: liked-songs card, playlist list, create button
- PlaylistDetailScreen: header with rename/delete, track list with drag-reorder placeholder
- NowPlayingModal: transport controls, progress bar, like/shuffle/repeat buttons, EQ button
- EqualizerModal: 10-band sliders, preset selector, enable toggle
- AddMusicModal: file picker button, scan trigger

### 1d. Shared Components
- TrackRow (album art with gradient fallback, title, artist, duration, FLAC badge)
- AlbumCover (hue-driven gradient + initials when no art)
- MiniPlayer (track info, play/pause, next)
- TabBar with mono labels

**Deliverable:** Full navigation working. All screens rendered with mock/hardcoded data. Theme switching (light/dark × 5 accents) works end-to-end.

**Gate:** Every screen reachable. Theme changes propagate instantly. No native module calls needed.

---

## Phase 2: Data Layer (Days 6–8)

**Goal:** SQLite schema live, library populated from mock data, all screens data-driven.

**Depends on:** Phase 1

### 2a. Database
- Define OP-SQLite schema (tracks, playlists, playlist_tracks, liked_tracks)
- Write typed query helpers: `getAllTracks`, `searchTracks`, `getPlaylistTracks`, `toggleLike`, `createPlaylist`, `reorderPlaylistTracks`, etc.
- Seed with mock data for development (the 40 songs from design reference)

### 2b. Stores
- LibraryStore: loads tracks/albums/artists from SQLite, exposes `loadLibrary()`
- PlaylistStore: CRUD playlists, manage liked tracks, all persisted to SQLite
- PlayerStore: queue management, shuffle/repeat logic, current track, position — no actual playback yet, just state

### 2c. MMKV Integration
- Persist theme preferences, EQ state, resume state (trackId, positionMs, queue)
- Hydrate stores from MMKV on app launch

### 2d. Wire Screens to Stores
- SongsScreen reads from LibraryStore
- SearchScreen filters LibraryStore
- PlaylistsScreen/Detail reads from PlaylistStore
- NowPlaying reads from PlayerStore

**Deliverable:** All screens show real data from SQLite. Playlists create/rename/delete/reorder work. Like toggle works. Search filters live. State survives app restart via MMKV.

**Gate:** Create playlist → add songs → reorder → kill app → reopen → playlist intact.

---

## Phase 3: Audio Engine — Decoding + Playback (Days 9–16)

**Goal:** Play FLAC/ALAC/WAV files through native audio output. This is the critical path.

**Depends on:** Phase 0 (Turbo Module stubs)

### 3a. C++ Core (Days 9–12)
- Integrate TagLib as static library (pre-built per architecture)
- Implement decoder: FLAC → PCM float32 (TagLib + libFLAC), ALAC (AudioToolbox on iOS, FFmpeg on Android), WAV (direct PCM read)
- Implement lock-free ring buffer (~200ms)
- Implement gapless pre-buffer: secondary ring buffer for next track, swap on track end
- Frame-boundary seeking with seek table (built during decode init)

### 3b. Platform Output (Days 12–14)
- **iOS:** AVAudioEngine source node pulling from ring buffer
- **Android:** Oboe AAudio callback pulling from ring buffer
- Audio session configuration: category, interruption handling
- Background playback entitlement (iOS) + foreground service (Android)

### 3c. PlayerModule Turbo Module (Days 14–16)
- Replace stubs with real native bindings via JSI
- `loadTrack`, `preloadNext`, `play`, `pause`, `stop`, `seekToFrame`
- Synchronous getters: `getPositionMs`, `getDurationMs`, `isPlaying`
- Events: `onTrackEnd`, `onPositionUpdate` (4Hz), `onAudioFocusChange`, `onHeadphoneDisconnect`, `onError`

**Deliverable:** Select a track in the app → hear audio. Gapless transition between tracks. Seek works. Background playback works.

**Gate:** Play a 24-bit/192kHz FLAC file. Seek mid-track. Let it transition gaplessly to next track. Lock phone — audio continues. Unplug headphones — playback pauses.

---

## Phase 4: Scanner + Metadata (Days 14–18)

**Goal:** Scan device for audio files, extract metadata, populate library.

**Depends on:** Phase 3a (TagLib integration)

> Note: Days 14–16 overlap with Phase 3b/3c. Scanner and platform output can be developed in parallel since scanner only needs TagLib (from 3a), not the playback pipeline.

### 4a. ScannerModule Native
- Android: MediaStore query for FLAC/ALAC/WAV + fallback to filesystem walk for Android 10+
- iOS: Document picker integration + app sandbox scanning
- Permission handling: `READ_MEDIA_AUDIO` (Android 13+) / `READ_EXTERNAL_STORAGE` (Android 10–12)

### 4b. Metadata Extraction
- TagLib for title, artist, album, year, duration, bitrate, sample rate, bit depth, codec
- Cover art extraction: embedded art → resize to 500×500 → store as BLOB
- Fallback: filename parsing for missing tags
- Hue derivation from album name hash for gradient fallback

### 4c. ScannerModule Turbo Module
- `startFullScan()` with progress events (`onScanProgress`, `onScanComplete`, `onScanError`)
- `getMetadata(filePath)` for single-file extraction
- `cancelScan()`

### 4d. Onboarding Flow
- Welcome screen → permission request → scan progress → done
- Wire to LibraryStore: scan results insert into SQLite, UI updates reactively

**Deliverable:** First launch scans device, populates library. Subsequent launches show existing library instantly.

**Gate:** Copy 50 FLAC files to device. Launch app fresh. Onboarding completes. All 50 tracks appear with correct metadata and album art.

---

## Phase 5: DSP — Equalizer (Days 17–19)

**Goal:** 10-band parametric EQ with 3 presets, applied in real-time.

**Depends on:** Phase 3 (audio pipeline running)

### 5a. EQ DSP
- 10-band IIR biquad filter chain in C++ (inserted between ring buffer and gain stage)
- Preset definitions: Default (all 0dB), Studio, Vinyl
- Smooth coefficient interpolation on preset change (avoid clicks)

### 5b. EQModule Turbo Module
- `setEnabled(boolean)`, `setPreset(preset)`, `getBandValues()`
- Wire to EQ UI (sliders already built in Phase 1)

### 5c. Gain Stage
- Volume normalization after EQ to prevent clipping

**Deliverable:** Toggle EQ on/off while playing. Switch presets — hear the difference immediately. No audio artifacts on switch.

**Gate:** Play track → enable EQ → switch between all 3 presets → disable. No clicks, pops, or volume jumps.

---

## Phase 6: Player Visualizations (Days 18–21)

**Goal:** Vinyl and cassette players animate in sync with playback.

**Depends on:** Phase 3 (playback state), Phase 1 (NowPlaying shell)

### 6a. Vinyl Player (Reanimated)
- Record spins at 33⅓ RPM (shared value driving rotation)
- Tonearm swings to playing position, returns on pause
- Grooves + sheen + center label with album info
- Album art on record surface

### 6b. Cassette Player (Skia)
- Tape reels: supply reel empties, take-up reel fills based on progress
- Hub rotation speed inversely proportional to reel radius (physics-correct)
- Colored shell with label showing track info
- Tape visible through window

### 6c. Toggle
- Inline toggle in NowPlaying to switch vinyl ↔ cassette
- Persisted in MMKV via ThemeStore (`player.kind`)

**Deliverable:** NowPlaying shows spinning vinyl or moving cassette. Toggle switches live. Progress accurately reflected in reel fill.

**Gate:** Play track. Watch vinyl spin. Toggle to cassette. Reels move. Seek — reels jump to correct fill level. Pause — animation stops.

---

## Phase 7: Polish + Integration (Days 22–25)

**Goal:** Wire everything together, handle edge cases, ship-ready.

**Depends on:** All previous phases

### 7a. Audio Focus State Machine
- Phone call → pause, auto-resume on end
- Headphone disconnect → pause, stay paused
- Notification → duck volume, restore on end
- Lock screen controls (MediaSession on Android, MPNowPlayingInfoCenter on iOS)

### 7b. Resume State
- On app kill: save current trackId, positionMs, queue to MMKV
- On relaunch: restore queue and position, don't auto-play

### 7c. Add Music Flow
- File picker integration (document picker)
- Import selected files → run scanner on them → add to library
- Handle duplicates (skip if file_path already in DB)

### 7d. Edge Cases
- Empty library state (instructions + file picker)
- Track deleted from filesystem while in library (graceful error on play attempt, option to remove)
- Very long track names (ellipsis)
- Large libraries (1000+ tracks) — verify list performance with FlashList

### 7e. Testing
- Jest unit tests for stores, query helpers, utility functions
- RNTL component tests for key interactions
- XCTest for iOS audio engine (decode, seek, gapless)
- JUnit for Android audio engine

**Deliverable:** App handles all real-world scenarios gracefully. Tests pass.

**Gate:** Full user flow: fresh install → onboarding → scan → browse → play → EQ → create playlist → add songs → background play → kill app → reopen → resume.

---

## Phase 8: Distribution (Days 26–28)

**Goal:** TestFlight and Google Play Internal Testing builds.

**Depends on:** Phase 7, Apple Developer + Google Play accounts (not yet set up)

- App icons and splash screen
- iOS: Archive → TestFlight upload
- Android: Signed AAB → Play Console internal track
- Basic crash reporting (Sentry or similar)

---

## Dependency Graph

```
Phase 0 ─────┬──── Phase 1 ──── Phase 2
              │                      │
              │                      ├──── Phase 7 ──── Phase 8
              │                      │
              └──── Phase 3a ──┬── Phase 3b/3c ──── Phase 5
                               │                       │
                               └── Phase 4             │
                                                       │
                          Phase 1 + Phase 3 ──── Phase 6
```

**Critical path:** Phase 0 → Phase 3 (audio engine) → Phase 5 (EQ) → Phase 7 (integration)

The audio engine is the highest-risk, longest-lead item. Phase 1 (UI shells) and Phase 3a (C++ core) can run in parallel after Phase 0 if two developers are available.

---

## Risk Mitigation

| Phase | Risk | Mitigation |
|-------|------|------------|
| 3 | C++ cross-compilation complexity | Use pre-built TagLib static libs. Test CMake config early on both platforms. |
| 3 | Gapless playback edge cases | Test with tracks of different sample rates, bit depths. Handle resampling at buffer swap. |
| 4 | Android storage permission maze | Implement both READ_EXTERNAL_STORAGE and READ_MEDIA_AUDIO paths. Test on Android 10, 12, 13, 14. |
| 5 | EQ coefficient changes causing audio artifacts | Smooth interpolation over ~10ms window when switching presets. |
| 6 | Reanimated + Skia frame drops | Profile early. Vinyl uses only Reanimated worklets (no Skia). Cassette uses only Skia canvas. Never both simultaneously. |
| 7 | Large library performance | Use FlashList for all track lists. Paginate SQLite queries if needed. |

---

## Timeline Summary

| Phase | Days | Duration | Parallelizable With |
|-------|------|----------|---------------------|
| 0 — Scaffold | 1–2 | 2 days | — |
| 1 — Design + Shells | 3–5 | 3 days | Phase 3a (if 2 devs) |
| 2 — Data Layer | 6–8 | 3 days | — |
| 3 — Audio Engine | 9–16 | 8 days | Phase 4 (from day 14) |
| 4 — Scanner | 14–18 | 5 days | Phase 3b/3c |
| 5 — EQ DSP | 17–19 | 3 days | Phase 6 |
| 6 — Visualizations | 18–21 | 4 days | Phase 5 |
| 7 — Polish | 22–25 | 4 days | — |
| 8 — Distribution | 26–28 | 3 days | — |

**Total: ~28 working days** with parallelization. ~35 days sequential.
