# Duke Online — Roadmap

A living document. Priorities and scope will shift as the project evolves — this is a reference for direction, not a commitment.

---

## Where We Are

The core engine is complete: full base-game rules, all 15 standard tiles, online multiplayer via Firebase, a client-side AI opponent, hotseat mode, and a game timeline with move history. The foundation is solid enough to start layering on the features below.

---

## Phase 1 — Game Completeness

Everything needed to call the base game fully implemented.

- **Full tile roster** — Verify all tiles from the published base game are in `tiles.js`. Add any missing.
- **Jarl and Centurion** — These have unique mechanics (Jarl: move-or-command hybrid; Centurion: conditional strike range). Requires new action types or action extensions.
- **Rules edge cases** — Audit against the rulebook: e.g., draw-when-no-adjacent-square behavior, simultaneous-guard resolution, what happens if both Dukes are threatened on the same turn.
- **Rulebook / help overlay** — An in-app reference (tile movement cards, turn summary) so players don't need to look up the physical rulebook.

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
