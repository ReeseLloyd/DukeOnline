# DukeOnline — CLAUDE.md

## What We're Building

A browser-based implementation of **The Duke** by Catalyst Game Labs. The Duke is a two-player abstract strategy game on a 6×6 grid. Each player has a bag of tiles; on your turn you either pull a new tile from your bag (placing it adjacent to your Duke) or move/strike with an existing tile. Every tile has two sides with different movement patterns, and the tile flips each time it moves. The goal is to capture the opponent's Duke tile.

Base game only (no expansions). Supports:
- Online multiplayer (two remote players via Firebase)
- AI opponent (client-side minimax, no server required)
- Hotseat mode (two local players, no account needed)

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, and JavaScript — no frameworks, no build tools, no transpilation
- **Realtime / state sync**: Firebase Firestore (real-time listeners)
- **Auth**: Username + PIN identity (SHA-256 hash, no Firebase Auth — see Decisions Log)
- **Hosting**: Firebase Hosting
- **AI**: Client-side minimax with alpha-beta pruning — no server component
- **Firebase SDK**: Loaded via CDN (Firebase compat SDK v10+)

## File Structure

```
/public
  index.html          # Lobby — login, create/join game, My Games list
  game.html           # Game board, all in-game UI and logic
  .htaccess           # No-cache headers for HTML/JS/CSS
  js/
    tiles.js          # Tile definitions and movement data
    tileRenderer.js   # Canvas rendering for tile pieces
    game.js           # Core game logic and state (createGame, applyMove, etc.)
    ai.js             # Minimax AI with alpha-beta pruning
    ai-worker.js      # Web Worker wrapper for AI (keeps UI thread unblocked)
    firebase.js       # Firebase init and Firestore helpers
firebase.json         # Firebase Hosting config
firestore.rules       # Firestore security rules
firestore.indexes.json
dev/                  # Development utilities (color preview, etc.)
reference/            # Rulebook and tile reference materials
```

## Architecture Notes

- Game state is a plain JS object. For online games, this object is synced to a Firestore document.
- Only the active player writes their move to Firestore; both clients listen for changes.
- No server-side move validation in v1 — client is trusted (cheating not a concern for now).
- Tile movement patterns are stored as data, not hardcoded logic. Each tile has a side-A and side-B definition.
- Use a seeded PRNG for bag draws — deterministic replay is desirable. No `Math.random()` in game logic.

## Tile Movement Pattern Format

TBD — to be designed before coding begins. Must represent: slide, jump, strike, command, and jump-slide movement types across a grid relative to the tile's current position and facing.

## Firebase Project

GCP/Firebase project ID: `dukeonline-71c49`

## Current State

Fully playable. Online multiplayer, AI opponent, and hotseat mode all working. Deployed to Firebase Hosting. Active development continues with bug fixes and polish.

## What's Next

- Diagnose and fix incomplete `moveHistory` in Firestore for online games (player 1's setup moves may not be written — root cause unconfirmed, likely a silent Firestore write failure)
- Improve error surfacing for Firestore write failures (currently `.catch(console.error)` only — user sees nothing)
- Consider adding `player` field to move objects in Firestore for easier debugging

## Decisions Log

[2026-04-08] Moved away from single-file / `file://` constraint — Firebase SDK requires a proper web app context. Multi-file structure adopted.

[2026-04-08] Firebase (Firestore + Auth + Hosting) chosen for real-time multiplayer state sync. User has an existing GCP account. No custom server needed.

[2026-04-08] AI opponent will run client-side (minimax + alpha-beta pruning). Adequate for The Duke's branching factor; no server compute required.

[2026-04-08] No server-side move validation in v1. Client is trusted. Can add Cloud Functions for validation in a later phase if needed.

[2026-04-08] Starting scope: online multiplayer + AI opponent + hotseat. Online multiplayer is the primary target, not deferred.

[2026-04-08] Auth: anonymous auth only for now. Players get an anonymous Firebase identity automatically — no sign-in required to play. Can upgrade to Google sign-in later if account persistence / match history becomes a requirement.

[2026-04-14] Auth replaced with username + PIN identity. Anonymous Firebase Auth removed entirely. Identity is SHA-256(username.lower + ':' + pin + ':' + 'duke-online-v1') — deterministic across devices, no server needed. Firestore `users/{username}` stores userId hash + game list. Firestore security rules: game writes are open (trusted client); user doc updates require the client to echo the stored userId (lightweight PIN enforcement without server-side crypto). No backward compatibility with pre-existing anonymous-auth games.

[2026-04-14] Auth Option B noted for future: Firebase Email Magic Link (passwordless). Zero-friction, real Firebase Auth, proper account ownership. Upgrade path if the game grows beyond a small friend group. Implementation: enable Email Link sign-in in Firebase console, call sendSignInLinkToEmail / signInWithEmailLink — Firebase handles everything, no Cloud Functions needed.

[2026-05-12] Version scheme: `YYYY.MM.DD.NN`. Each JS file exports a named VERSION constant (`TILES_VERSION`, `TILE_RENDERER_VERSION`, `GAME_VERSION`, `AI_VERSION`, `FIREBASE_VERSION`). `<script src>` tags use `?v=VERSION` query strings for cache-busting. Both HTML files include a runtime version check that triggers a one-time reload (with `?_cb=timestamp` + `sessionStorage` guard) if any loaded version doesn't match `EXPECTED`.

## Version Bump Checklist

When bumping the version, update all of the following:

1. JSDoc `@version` comment in each JS file
2. Named `*_VERSION` constant in each JS file
3. `?v=` query string on every `<script src>` tag in `game.html` and `index.html`
4. `EXPECTED` version string in the runtime check block in `game.html` and `index.html`
5. `<div class="version">` display string in `game.html` and `index.html`
6. `README.md` if it carries a version reference

Then: commit all changed files, merge to `main`, push, deploy with `firebase deploy`.

## What Hasn't Worked

- **Stale cached JS (2026-05)**: Remote players (especially on mobile or repeat visitors) were loading old JS files from browser cache, causing version mismatches and unplayable games. Fixed with `?v=` cache-busting query strings on all script tags and a runtime version check that forces a reload when versions don't match.
- **Incomplete moveHistory in Firestore (2026-05, unresolved)**: For online games, `moveHistory` sometimes only contains player 0's setup moves — player 1's placements reach `lastMove` (an overwrite) but don't appear in `moveHistory` (which uses `arrayUnion`). Root cause not confirmed; likely a silent Firestore write failure on player 1's client. The symptom is a broken game state after reconnect, since `_replayMoveHistory` reconstructs from the incomplete array.
