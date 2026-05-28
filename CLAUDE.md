# Musix

Audiophile-grade lossless music player for iOS 16+ and Android 10+. React Native New Architecture with Turbo Modules and a shared C++ audio engine.

- Architecture: `docs/HLD.md`
- Implementation phases: `docs/PLAN.md`

## Hard Rules

- **Always consult the user before architecture decisions** — new patterns, structural changes, interface modifications, or anything that affects how components interact
- **Never add dependencies without asking first**
- Follow the monorepo layout in HLD.md: `app/` for the RN app, `packages/audio-engine/` for native code
- Turbo Module interfaces (PlayerModule, ScannerModule, EQModule) are the contract between JS and native — changes require discussion
- Use the exact design tokens from HLD.md (palette, fonts, spacing)
- No Expo

## Stack

- **Package manager:** pnpm 11 with `pnpm-workspace.yaml`
- **React Native:** 0.79 (New Architecture)
- **State:** Zustand stores (Player, Library, Playlist, Theme)
- **Persistence:** OP-SQLite for library/playlists, MMKV v2 for preferences/resume state
- **Animation:** Reanimated 3 for vinyl, Skia for cassette — never render both simultaneously
- **Audio:** C++ core (TagLib, FLAC decoder, parametric EQ, gain stage) → Oboe (Android) / AVAudioEngine (iOS)
- **Navigation:** React Navigation 7 (bottom tabs + modal stack)

## Commands

- `pnpm install` — install all workspace dependencies (run from repo root)
- `cd app && npx react-native run-ios` — build and run on iOS simulator
- `cd app && npx react-native run-android` — build and run on Android emulator
- `cd app && npx tsc --noEmit` — type check
- `cd app && npx jest` — run tests

## Conventions

- TypeScript strict mode, no `any`
- No comments unless explaining a non-obvious "why"
- Prefer editing existing files over creating new ones
- Keep functions small and focused

## Testing

- Jest + React Native Testing Library for JS
- XCTest for iOS native, JUnit for Android native
- Run tests before committing

## Workflow

- Commit after each logical unit of work, keep commits focused
- Reference the relevant PLAN.md phase in commit messages (e.g., "Phase 1: ...")
