# Duke Online — Roadmap

A living document. Priorities and scope will shift as the project evolves — this is a reference for direction, not a commitment.

---

## Build Sequence

Online experience before gameplay expansion — with one exception.

The base game is already complete and fun. The more important architectural reason to go online-experience-first is that **auth is load-bearing**: the current PIN system is a dead end. Every feature that follows (persistent history, ratings, match records, notifications) requires real account ownership underneath it. Doing the auth upgrade late means migrating data and retrofitting every feature that touches user identity.

Gameplay expansions are also more invasive to the engine than they appear. Board size variants require auditing every hardcoded `6` in rendering, move generation, setup logic, and Firestore serialization. Terrain adds a new state layer. Bag customization changes game initialization and the document shape. Those changes get riskier as more depends on them — better to tackle them after the online layer is stable and tested with real players, who will tell you which variants they actually want.

**The exception:** Jarl and Centurion come first. They require new action types in the game engine, and the engine is simplest to change now, before the online layer adds more complexity.

### Sequence

1. **Jarl + Centurion** — engine work; do it while the engine is clean
2. **Auth upgrade** — PIN → Firebase Email Magic Link; unlocks everything that follows
3. **Persistent game history + rematch** — builds on real account ownership
4. **Time controls + async / correspondence mode**
5. **Ratings + leaderboards**
6. **Gameplay expansion** — bag customization, board size variants, terrain
7. **Custom tiles** — stretch goal; complex to build and moderate

---

## Where We Are

The core engine is complete: full base-game rules, all 15 standard tiles, online multiplayer via Firebase, a client-side AI opponent, hotseat mode, and a game timeline with move history. The foundation is solid enough to start layering on the features below.

---

## Phase 1 — Game Completeness

Everything needed to call the base game fully implemented.

- **Full tile roster** — Verify all tiles from the published base game are in `tiles.js`. Add any missing.
- **Jarl and Centurion** — Full expansion tile sets, each compatible with the base Duke game and playable against each other. Implementation is phased by mechanic complexity; see the dedicated section below.
- **Rules edge cases** — Audit against the rulebook: e.g., draw-when-no-adjacent-square behavior, simultaneous-guard resolution, what happens if both Dukes are threatened on the same turn.
- **Rulebook / help overlay** — An in-app reference (tile movement cards, turn summary) so players don't need to look up the physical rulebook.

---

## Jarl + Centurion — Expansion Implementation Plan

Both Jarl and Centurion are complete tile sets compatible with the base Duke game. They can be played pure vs. pure, or mixed against the Duke set (e.g., a Jarl bag vs. a Duke bag). Centurion also changes the starting setup: the Centurion tile replaces the Duke, and two Legionnaires replace both starting Footmen.

The implementation is split into six phases, ordered by mechanical complexity and engine invasiveness. Each phase is independently shippable — the game remains fully playable after each one.

### Tile sets

**Jarl** (19 tiles per player — 3 start on board, 16 in bag):
Jarl (1, on board), Freeman (3: 2 on board, 1 in bag), Spearman (3, in bag), Chieftain (1), Vala (1), Berserker (1), Shield Maiden (1), Archer (1), Huscarl (1), Warlord (1), Gothi (1), Axe Warrior (1), Sword Warrior (1), Huntsman (1), Ulberht (1)

**Centurion** (19 tiles per player — 3 start on board, 16 in bag):
Centurion (1, on board), Legionnaire (6: 2 on board, 4 in bag), Onager (1), Hastati (1), War Dogs (1), Primus Pilus (1), Optio (1), Slingers (1), Tribune (1), Velites (1), Explorator (1), Triarii (1), Equites (2)

**Non-starting-side tiles:** Some tiles have no designated starting side — the player chooses which side faces up when the tile is first placed (from bag or during setup). In Jarl: Huscarl, Shield Maiden, Huntsman. In Centurion: War Dogs. These are noted in the tile data with `noStartingSide: true`.

### New action types (summary)

| Type | Mechanic | Complexity | Phase |
|---|---|---|---|
| `moveNC` | Non-capture move — path clear + destination empty; no capture | Low | A |
| `jumpNC` | Non-capture jump — destination empty; ignores pieces in path | Low | A |
| `slideNC` | Non-capture slide — stops before any occupied square; no capture | Low | A |
| `hammer` | Strike ignoring Defense icons | Low (alias of `strike` until Phase B) | A |
| `smash` | Move ignoring Defense icons | Low (alias of `move` until Phase B) | A |
| `ready` | Flip-in-place — tile flips to its other side without moving; uses the full turn | Low | A |
| `defense` | Passive — blocks captures of this tile when the attacker's path crosses a marked square | Medium | B |
| `shieldDefense` | Passive — protects the friendly tile in the indicated square as though it had defense icons on all sides | Medium | B |
| `dread` | Passive — freezes any tile (friendly or enemy) in the covered square | Medium-High | C |
| `formation` | Active tile moves and drags nominated friendly tiles along with it | High | D |

---

### Phase 0A — Jarl tile pattern extraction (prerequisite for Phase A)

Extract all Jarl tile movement patterns from `_resources/Jarl-Print-n-Play.pdf` and produce draft `tiles.js` entries ready for encoding. This is a research task, not a coding task. Centurion follows in Phase 0B after Jarl is verified.

**Approach:** Claude reads the PDF and transcribes each tile's two sides into the `tiles.js` action format (`sq` or `dir` per action). Cells where icon size is ambiguous — particularly NC icons, which are smaller versions of the standard icons — are flagged with a `/* NC? */` comment. The user then prints the print-n-play sheet and verifies flagged cells against the physical reference, spot-checking the rest.

**Deliverable:** Verified, ready-to-encode `tiles.js` entries for all 15 Jarl tile types.

**Checklist (15 tile types):**
- [ ] Jarl
- [ ] Freeman
- [ ] Spearman
- [ ] Chieftain
- [ ] Vala
- [ ] Berserker
- [ ] Shield Maiden *(no starting side)*
- [ ] Archer
- [ ] Huscarl *(no starting side)*
- [ ] Warlord
- [ ] Gothi
- [ ] Axe Warrior
- [ ] Sword Warrior
- [ ] Huntsman *(no starting side)*
- [ ] Ulberht

---

### Phase 0B — Centurion tile pattern extraction (prerequisite for Phase A)

Same approach as Phase 0A, applied to `_resources/Centurion-Print-n-Play.pdf`. Centurion tiles are denser — more icon types per tile, formation diamonds, defense squares — so expect more flagged cells than Jarl.

**Deliverable:** Verified, ready-to-encode `tiles.js` entries for all 13 Centurion tile types.

**Checklist (13 tile types):**
- [ ] Centurion
- [ ] Legionnaire *(has `ready` icon)*
- [ ] Onager
- [ ] Hastati
- [ ] War Dogs *(no starting side)*
- [ ] Primus Pilus *(has `formationSingle` icon)*
- [ ] Optio
- [ ] Slingers
- [ ] Tribune
- [ ] Velites
- [ ] Explorator
- [ ] Triarii
- [ ] Equites

---

### Phase A — Non-capture icons + tile data + color scheme

The new active icon types that require no passive mechanics, plus `ready` (flip-in-place), plus applying the chosen visual design to the renderer. Safe to ship as the first increment.

**New action types:** `moveNC`, `jumpNC`, `slideNC`, `hammer` (= strike for now), `smash` (= move for now), `ready`

#### `tiles.js`

- Add `noStartingSide: true` to tiles that have no designated starting side (Huscarl, Shield Maiden, Huntsman; War Dogs). The engine uses this flag to generate two draw moves (one per side) for these tiles.
- Add all Jarl tile entries. Most Jarl tiles use only NC icons alongside existing types.
- Add all Centurion tile entries. Tiles that use Formation or Defense icons should have those icons present in the data but they will be inert until Phases B–D.
- Patterns must be verified in Phase 0 before encoding.

#### `game.js` — `_movesForTile`

- `moveNC`: same as `move` but destination must be empty (no capture); path clear required.
- `jumpNC`: same as `jump` but destination must be empty; no capture.
- `slideNC`: pass a `noCapture` flag to `_resolveSlide` — stops before any occupied square rather than capturing and stopping.
- `hammer`: generate as `{ action: 'strike', ... }` (identical until Phase B).
- `smash`: generate as `{ action: 'move', ... }` (identical until Phase B).
- `ready`: when the active tile's current side has a `ready` icon, generate `{ action: 'ready', from: [col, row] }`. This is an alternative to moving — the player flips the tile in place and ends their turn.
- **Diagonal-origin slideNC (Legionnaire, Centurion tiles):** These tiles have `slideNC` icons whose display position is a diagonal square from the tile center, with the arrowhead pointing laterally. The engine already handles this via the existing `dir` magnitude normalisation (`Math.sign`) — a `dir` of `[-1, 1]` with a lateral slide is encoded the same way as the Assassin's `jumpSlide`. No engine change needed; note it here so the tile data is encoded correctly.

#### `game.js` — `_isDukeThreatenedBy`

- NC icons (`moveNC`, `jumpNC`, `slideNC`) cannot threaten the Duke — exclude them from threat detection.
- `ready` cannot threaten the Duke.

#### `game.js` — `_applyMoveCore`

- Add `ready` branch: flip the tile in place (`side: 1 - piece.side`), advance turn normally.

#### `game.js` — draw move + non-starting-side rule

- For tiles with `noStartingSide: true`, `_getRawLegalMoves` generates two draw moves — `{ action: 'draw', pos: [c,r], side: 0 }` and `{ action: 'draw', pos: [c,r], side: 1 }` — giving the player their choice.
- For all other tiles, the draw move uses `side: 0` as today.
- `_applyMoveCore` draw branch: use `move.side ?? 0` when placing the tile.

#### `game.js` — setup variant (engine only)

- Add a `variant` field to game state: `'duke'` | `'jarl'` | `'centurion'`. Defaults to `'duke'`.
- `applySetupPlacement`: place Centurion + Legionnaires when `variant === 'centurion'`; Jarl + Freemen when `variant === 'jarl'`; existing Duke + Footmen logic otherwise.
- `getSetupInfo`: return correct starting tile types per variant.
- **Scope note:** Phase A wires up the engine only. Until Phase E, the variant is set by directly constructing state (e.g., hotseat dev testing). The lobby UI for choosing a tile set is Phase E.

#### `tileRenderer.js`

- `moveNC` / `jumpNC`: same shapes as `move` / `jump`, drawn at ~60% radius (smaller filled/open circle).
- `slideNC`: same arrowhead shape as `slide`, drawn at ~60% size (smaller filled arrow).
- `hammer`: filled 6-pointed star (solid fill, vs. the outlined star used for `strike`).
- `smash`: filled directional arrowhead — same orientation logic as `slide` arrows (rotates to match movement direction), but broader/denser to distinguish it from the hollow `jumpSlide` arrow. Not a fixed upward shape.
- `ready`: an X mark (two crossing diagonal lines), centered in the cell.
- `TILE_DISPLAY_NAMES`: add entries for all new tile types.
- `_drawIllustration`: add illustration cases for all new tile types (placeholder `_illPole` acceptable for first pass; can be refined later).

#### Color scheme implementation

Apply the chosen visual design from the README to the renderer and board:
- **Tile colors (Earthy Harmony):** Add Jarl and Centurion entries to `TILE_COLORS` in `tileRenderer.js`, keyed by player and tile set. Jarl P0: `#d6dde6` / `#181c26`; Jarl P1: `#3e4a5c` / `#d6dde6`; Centurion P0: `#ece4d2` / `#301408`; Centurion P1: `#6a3420` / `#ece4d2`.
- **Board (Cooler Slate):** Apply `#eaeaee` (light) / `#d2d2d8` (dark) to the board renderer.
- The color lookup must be variant-aware: `TILE_COLORS[variant][player]` rather than `TILE_COLORS[player]`.

---

### Phase B — Defense mechanics

Passive icons that affect the legality of capture moves targeting other tiles. No new state; the check runs inline during move generation.

**New action types:** `defense`, `shieldDefense`; `hammer` and `smash` become distinct from `strike` / `move`.

**Key semantic:** Defense icons live on the **tile being protected**, not along the path. A tile with a `defense` icon at offset `[0, -1]` means "I cannot be captured by anything whose straight line of approach passes through the square one step in front of me — even if the attacker is already adjacent to me." The `_isDefended` function checks the **target tile's** own defense icon positions, not a scan of intermediate squares.

#### `game.js` — new helper `_isDefended(board, attackerC, attackerR, targetC, targetR, targetPlayer)`

- Retrieve the target tile's current-side actions. For each `defense` action, apply the target player's transform to get the defended board square. If the straight line from attacker to target passes through that square — or if the attacker starts on that square — return true.
- For `shieldDefense`: scan all friendly tiles adjacent to the target. For each such tile that has a `shieldDefense` icon covering the target square, return true.
- `defense` does not protect the tile that displays it.
- `shieldDefense` does not protect the tile that displays it.
- Command always ignores defense (Command can always move a tile even through defense).
- `hammer` and `smash` always bypass `_isDefended`.

#### `game.js` — `_movesForTile`

- `move` and `jump` targeting an enemy: skip if `_isDefended`.
- `strike` targeting an enemy: same straight-line path rule applies; skip if `_isDefended`.
- `smash`: bypass `_isDefended`.
- `hammer`: bypass `_isDefended`.

#### `game.js` — `_isDukeThreatenedBy`

- Apply `_isDefended` when checking attacker moves/strikes targeting the Duke.

---

### Phase C — Dread

Tiles with a `dread` icon freeze any tile (friendly or enemy) in the covered square after every move or draw. The freeze is re-evaluated dynamically — no persistent state needed.

**New action type:** `dread` (passive display icon; generates no moves of its own).

#### `game.js` — new helper `_computeFrozenSquares(board)`

- Scans all tiles on the board. For each `dread` action on the tile's current side, apply the player transform to get the covered board square.
- Returns a `Set` of `'col,row'` strings.
- Immunity is a tile-type property, not board state: derive it from the tile's TILES definition. A tile type is immune if either of its sides contains a `dread` action, or if it is a leader tile (`duke`, `jarl`, `centurion`). Compute once per tile type at startup and cache.

#### `game.js` — `_movesForTile`

- Compute `frozenSquares` at the top of `_getRawLegalMoves` and pass it down.
- Skip frozen tiles (they cannot move, strike, or command).
- Skip command targets that are frozen.
- Frozen tiles cannot be captured — skip any move/strike/formation targeting a frozen square.

#### `game.js` — `_isDukeThreatenedBy`

- Frozen attacker tiles do not threaten the Duke.

---

### Phase D — Formation

The most complex mechanic. The active tile moves and may simultaneously drag any friendly tiles in its Formation squares along with it, using the same movement vector. Only the active tile flips.

**New action types:** `formation` (Full Formation); `formationSingle` (Primus Pilus — only one Formation icon may be used per turn).

**New move shape:**
```
{ action: 'formation', from: [c,r], to: [c,r], pairs: [{ from: [c,r], to: [c,r] }] }
```

**Rules:**
- Player activates a tile with a Formation icon and nominates any friendly tiles on Formation squares.
- Player then chooses a Movement icon from the active tile (not Strike / Hammer / Dread / Defense / ShieldDefense).
- Active tile and all paired tiles move simultaneously using that movement vector, each independently validating legality as if moving alone.
- If a paired tile cannot legally complete the move, it is excluded — the move remains legal for the active tile.
- Both active and paired tiles may capture at their destinations per the chosen movement icon's normal rules.
- Only the active tile flips at end of turn.
- Dread-frozen tiles cannot be nominated as pairs.

#### `game.js` — `_movesForTile`

- For each Formation icon, identify friendly tiles on that Formation square (sources).
- For each valid movement icon (non-Strike/non-passive), enumerate destinations for the active tile.
- For each destination, determine which sources can legally reach their paired destination (same delta, independently validated).
- Generate one move object per (destination × valid source subset) combination.
- Combinatorial cap: in practice N Formation squares ≤ 2 per icon, so worst case is 4 subsets × M destinations — manageable. If a tile has both Full and Single Formation icons, generate moves accordingly.

#### `game.js` — `_applyMoveCore`

- New `formation` branch: move active tile to `to`, move each pair, capture any enemies at destinations, flip active tile only.

#### `game.js` — `_isDukeThreatenedBy`

- Formation moves can threaten the Duke — check if `to` or any `pair.to` equals the Duke's square.

#### `ai.js` — piece value update

- The AI evaluator almost certainly scores board positions using per-tile-type piece values. All new tile types from Jarl and Centurion need entries. Without them the AI has no idea how to value any new piece and will play blind against these sets. Assign initial values based on mobility and threat profile; tune during playtesting.

#### UI (`ui.js` or equivalent)

- Formation requires multi-step selection: select active tile → system highlights Formation squares → player nominates pairs → player picks movement icon → confirm.
- Design TBD; implement alongside Phase D engine work.

---

### Phase E — Setup variant (UI/lobby)

Connect the `variant` field (added in Phase A) to the game creation UI so players can choose their tile set. Prerequisite for online play with expansion sets.

- Lobby: tile set selector (Duke / Jarl / Centurion / mixed) at game creation.
- Mixed games: each player independently selects their set. Player 1 sets their choice during game creation; Player 2 sets theirs when joining.
- Bag initialisation and setup placement use each player's chosen set.
- Firestore game document stores `variant` (or per-player `tileSet`) so both clients use the same tile data.
- Non-starting-side tiles (flagged in Phase A): when drawing one of these tiles the UI prompts the active player to choose a side before placement.

---

## Phase 2 — Customization

Making the game your own. Each of these is independent and can ship separately.

### Bag Customization
- **Standard presets** — e.g., "Base Game," "All Footmen," "Aggressive" (high-value tiles only)
- **Draft mode** — Players alternately pick tiles from a shared pool before the game starts
- **Fully custom bags** — Free selection of any tiles up to the standard count; useful for handicapping and experimentation
- Bags stored in the game document so both players see what was agreed on

### Board Setup Customization
- **Alternate starting configurations** — Variants where more tiles begin on the board (e.g., pre-deployed pieces)
- **Terrain tiles** — Mountains (impassable), Forts (defensive bonus), Dragon (roaming hazard or obstacle). These require a terrain layer added to game state and move-generation changes.
- Terrain presets selectable at game creation; custom layouts a stretch goal

### Board Size Variants
- **5×5** — Faster, more tactical; good for learning
- **7×7** — More room to maneuver; changes the balance of ranged vs. melee tiles significantly
- Board size stored in game state; rendering already scales dynamically so this is mostly a game-logic and UI change

### Custom Tiles *(stretch)*
- Define movement patterns via a tile editor (grid click to set cells, choose action type per cell)
- Export/import as JSON; share codes with friends
- Community tile library — submit, rate, and download fan-made tiles
- This is genuinely complex to balance and moderate; treat as a long-term goal

---

## Phase 3 — Online Experience

Quality-of-life for the multiplayer game. Most of these are independent.

- **Auth upgrade** — Move from username+PIN to Firebase Email Magic Link (passwordless, zero friction, real account ownership). Existing PIN-based identities can be migrated. See decisions log in `CLAUDE.md` for notes on this.
- **Friends / invite system** — Send a game link directly to a named player; accept/decline flow
- **Rematch** — One-click "play again" at game over that reuses the same two players and negotiates who goes first
- **In-game chat** — Simple text chat synced via Firestore alongside the game document; profanity filter for public play
- **Time controls** — Per-turn timer (e.g., 30 s / 2 min / unlimited); flagging on timeout. The current 60 s auto-confirm is a precursor to this.
- **Resign and draw offers** — Resign is already in; add a formal draw-offer flow
- **Spectator mode** — Allow additional clients to join a game as read-only viewers; useful for watching friends play
- **Persistent game history** — Store the full move list in Firestore so completed games are replayable from the lobby, not just during a live session
- **Notifications** — Push or email notifications when it's your turn (useful for async / slow play)
- **Async / correspondence mode** — No time pressure; players take their turn whenever; good for international time zones

---

## Phase 4 — Competitive and Social

Features that make Duke Online a community, not just a game.

- **Rating system** — Glicko-2 or Elo; separate ratings per game variant (standard, 7×7, etc.)
- **Leaderboards** — Global and friends-only rankings; updated after each rated game
- **Match history** — Per-player record of all past games with outcome, opponent, variant, and full replay
- **Tournament support** — Bracket or Swiss-system tournaments; bracket generation, scheduling, and result tracking
- **Achievements / milestones** — Optional; "Won with only Footmen," "Captured Duke in 10 moves," etc.
- **Clubs / groups** — Private leaderboards and tournaments for friend groups or communities

---

## Phase 5 — Public Launch Readiness

Things that need to be solid before opening to strangers.

- **Mobile experience** — Full touch support, responsive layout tested on phones; the board interaction (tap-to-select, tap-to-move) needs tuning for small screens
- **Performance and scaling** — Firestore cost controls; pagination on game history; AI worker pool considerations if server-side AI is ever added
- **Moderation tools** — Report system for abusive chat; admin ability to ban accounts; rate limiting on game creation
- **Terms of service and privacy policy** — Required for public user accounts that store any identifying data
- **Landing / marketing page** — A real home page that explains the game, shows screenshots, and routes new players to sign up
- **Custom domain** — Move off the default Firebase hosting URL
- **Analytics** — Basic funnel tracking: sign-up → first game → return visit; used to guide feature prioritization

---

## Ongoing / Cross-Cutting

- **Test coverage** — Unit tests for `game.js` (move generation, guard detection, win conditions); snapshot tests for tile data integrity
- **Accessibility** — Keyboard navigation of the board; screen-reader labels for board state; color-blind-safe highlight palette
- **Localization** — Tile names and UI strings extracted to a locale file; at minimum English + one other language to test the pipeline
- **Open source** — If the project goes public, consider MIT-licensing the game engine (`game.js`, `tiles.js`, `ai.js`) while keeping the Firebase config and user data private

---

*Last updated: 2026-04-23*

<!-- Changelog
2026-04-23: Added full Jarl + Centurion expansion plan (Phases 0A, 0B, A–E). Phase 0 split into 0A (Jarl) and 0B (Centurion) with PDF-extraction approach: Claude drafts patterns, flags ambiguous NC icons, user verifies against printed reference. Added: `ready` action type, non-starting-side rule, color scheme implementation task, diagonal-origin slideNC clarification, corrected smash icon description, defense semantics precision, AI evaluator update in Phase D, mixed-game tile set selection in Phase E. Bag counts confirmed (19 tiles / 3 on board / 16 in bag for both sets). Chosen visual design: Earthy Harmony tile palette, Cooler Slate board.
-->
