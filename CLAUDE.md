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
- **Auth**: Firebase Authentication (Google sign-in or anonymous to start)
- **Hosting**: Firebase Hosting
- **AI**: Client-side minimax with alpha-beta pruning — no server component
- **Firebase SDK**: Loaded via CDN (Firebase JS SDK v9+ modular)

## File Structure

Multi-file project (not single `.html`). Structure TBD, but expected:

```
/public
  index.html        # Entry point / lobby
  game.html         # Game board
  css/
  js/
    game.js         # Core game logic and state
    tiles.js        # Tile definitions (movement data)
    ai.js           # Minimax AI
    firebase.js     # Firebase init and Firestore helpers
    ui.js           # Rendering and event handling
firebase.json       # Firebase Hosting config
.firebaserc         # Firebase project alias
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

Architecture decided. No code yet. See `_resources/` for reference materials (rulebook, tile diagrams, etc.).

## What's Next

1. Initialize Firebase project and link to this repo (`firebase init`)
2. Define tile movement data format
3. Define full base game tile roster (both sides of each tile)
4. Sketch UI layout and board rendering approach
5. Begin coding: game state → rendering → Firebase sync → AI

## Decisions Log

[2026-04-08] Moved away from single-file / `file://` constraint — Firebase SDK requires a proper web app context. Multi-file structure adopted.

[2026-04-08] Firebase (Firestore + Auth + Hosting) chosen for real-time multiplayer state sync. User has an existing GCP account. No custom server needed.

[2026-04-08] AI opponent will run client-side (minimax + alpha-beta pruning). Adequate for The Duke's branching factor; no server compute required.

[2026-04-08] No server-side move validation in v1. Client is trusted. Can add Cloud Functions for validation in a later phase if needed.

[2026-04-08] Starting scope: online multiplayer + AI opponent + hotseat. Online multiplayer is the primary target, not deferred.

[2026-04-08] Auth: anonymous auth only for now. Players get an anonymous Firebase identity automatically — no sign-in required to play. Can upgrade to Google sign-in later if account persistence / match history becomes a requirement.

## What Hasn't Worked

<!-- Populate as development proceeds -->
