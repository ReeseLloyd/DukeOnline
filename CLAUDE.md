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

[2026-10-16] Bag customization: the game creator picks the bag at game start (Standard or Custom, 0–4 copies per non-Duke tile type, applied to both players; Duke + 2 Footmen start is fixed). Stored as `bagConfig` (`{ p0, p1 }` count maps, null = standard) on the Firestore game doc and in game state; `createGame({ seed, bagConfig })` builds bags from it, and clients fetch it via `getGameBagConfig` before building state (no fallback on failure — a wrong bag would desync). Local games pass it lobby → game page via `sessionStorage` + `?bags=custom`. Default-config bags are byte-identical to pre-change output for the same seed. Tiles flagged `enhanced` (Duchess, Oracle) stay out of the picker until their abilities (Summon, Divination) are implemented.

[2026-10-16] Online game-over sync: `_onGameSnapshot` (game.html) previously dropped two game-ending snapshots on the opponent's client — a Duke capture (`_applyMoveCore` doesn't increment `turn` on game over, so the `turn <= state.turn` stale-snapshot guard rejected it) and a resignation (`lastMove: null` was treated as a setup placement). Fixed in the handler (`gameJustEnded` bypass; `_applyRemoteResign`) rather than changing the engine, so `turn` / `_seq` semantics stay unchanged. Verified with two live tabs.

[2026-10-16] Duchess + Summon (2026.10.16.03). Rules per `reference/pdfs/The_Duke-Rulebook.pdf` (Enhanced Abilities): Summon is a turn option (alongside move / draw) — flip your own Duke in place and relocate a Duchess already on the board to an open orthogonally-adjacent square; she keeps her side; no capture. Implemented as move `{ action: 'summon', from, to }` generated in `_getRawLegalMoves` (not `_movesForTile`); tile sides carry passive ability markers `{ type: 'summon' }` / `{ type: 'divination' }` with no `sq`/`dir` (renderer and move generator skip them; renderer draws the Roman numeral I/II). `enhanced: true` now means "optional tile, excluded from the default bag" — `editableTileTypes()` includes enhanced tiles (so they appear in the bag editor), `defaultBagCounts()` excludes them. Tiles whose ability isn't built yet go in `UNRELEASED_TILES` (tiles.js) to stay out of bags and the editor. Duchess is drawn from the bag like any tile (default bag unchanged).

[2026-10-16] Oracle + Divination (2026.10.16.04). Oracle side 1 carries `{ type: 'divination' }`; `UNRELEASED_TILES` is now empty. Per the rulebook, with the Oracle on its non-starting side the player may use it as their turn: the Oracle flips back in place, the top 3 of the player's bag are revealed, one is placed adjacent to the Duke (starting side) and each of the other two is returned or destroyed. Move: `{ action: 'divine', from, pick, pos, destroy: [revealedIdx...] }` (indices into `bag.slice(0,3)`, so the opponent's client/replay recompute the same reveal). Returned tiles are re-mixed with `_reshuffleBag` seeded from game seed + turn + player — deterministic across clients and history replay; do not use `Math.random()` there. The UI commits on reveal (no Cancel, persisted in localStorage like Draw via `_saveDrawCommitted(extra)`); undo of the staged move returns to the reveal panel. AI search uses `getLegalMoves(state, true)` (aiPrune: no destroying, duplicate tile types collapsed) to limit branching; UI and legality checks use the full set.

[2026-10-16] Jester promo tile (2026.10.16.05). Patterns transcribed from `reference/pdfs/The_Duke_Expansion_Events-Print-n-Play.pdf` (movement/jump icons only, no new mechanics; the sheet's light and grey versions are just player colors). New tile flag `promo: true` = optional tile excluded from the default bag (like `enhanced`, but no special ability); the bag editor labels these "(promo)". Not yet done from the promo list: Specter (Events sheet) is an Expanded Play Terrain piece — auto-moves toward a token after each turn, enters after the first capture, captures any tile, uses Dread/skull icons — so it needs a terrain layer, not a bag tile. Swashbuckler, Shieldmaiden and Lancer still need pattern sources; the Jarl set's Shield Maiden uses Defense icons the engine lacks.

[2026-10-16] Swashbuckler promo tile (2026.10.16.06). Source: user-supplied image of the light and grey tiles — identical fronts (four corner jumps), left-right mirrored backs, one version per player (light = player 0, grey = player 1). New optional tile field `playerSides: { 1: [side0, side1] }` overrides `sides` for player 1; always read faces through `getTileActions(type, side, player)` (used by `_movesForTile` and the renderer) rather than `TILES[type].sides` directly. Promo tile, off by default. Remaining from the promo list: Shieldmaiden (may need Defense icons), Lancer (no evidence it exists), Specter (terrain piece).

[2026-10-16] Shieldmaiden promo tile + Defense mechanic (2026.10.16.07). Tile from user-supplied photos: mirror-image faces (moves left/forward with Defense on the right column, and the reverse), identical for both players; assumed left face (solid pawn) is the starting side. `{ type: 'defense', sq }` is a passive marker on the *protected* tile; `_defenseBlocks` in game.js (called for every capture in `_movesForTile`, never for Command) implements the base rulebook: the target cannot be captured if the attacker starts on a Defense square or its straight line crosses one; straight-line jumps/strikes must use that line; knight-like jumps/strikes are blocked only if BOTH L-shaped routes (x-first, y-first) cross a Defense square (our reading of the rulebook's two-path examples). Guard/threat detection inherits Defense automatically (built on generated moves). Not implemented: `shieldDefense`, hammer/smash, Dread, terrain — the same groundwork serves Robin Hood, Jarl and Centurion later.

[2026-10-16] Lancer promo tile (2026.10.16.08). Source: user-supplied photos (the earlier web search wrongly suggested it might not exist). Same pattern for both players. Side 0: move forward 1, jump-slide forward (skips the first square, like the Assassin's); side 1: strike 2 ahead, move forward 1, slide straight back. Both faces carry Roman numeral I = Summon, so it shares the Duchess's `summon` move; the button is now labelled just "Summon" and picks which tile when several are eligible. Flags `promo` + `enhanced` (bag editor label "(promo, enhanced)"). Renderer: faces with an ability numeral draw their art in the top 86% of the illustration column so the numeral never collides with it. Correction to the earlier Specter note: the user says the Specter is not a terrain piece (the Events sheet calls it an "Expanded Play Terrain tile"); revisit with the user's description before building it.

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
