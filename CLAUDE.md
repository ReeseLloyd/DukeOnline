# DukeOnline — CLAUDE.md

## What We're Building

A browser-based implementation of **The Duke** by Catalyst Game Labs. The Duke is a two-player abstract strategy game on a 6×6 grid. Each player has a bag of tiles; on your turn you either pull a new tile from your bag (placing it adjacent to your Duke) or move/strike with an existing tile. Every tile has two sides with different movement patterns, and the tile flips each time it moves. The goal is to capture the opponent's Duke tile.

This project starts with the base game only (no expansions). Initial target is a fully playable local/hotseat version (two players on one screen), with online multiplayer considered for a later phase.

## Tech Constraints

- Vanilla HTML, CSS, and JavaScript only — no frameworks, no libraries, no build tools
- Single `.html` file — do not split into multiple files unless explicitly decided otherwise
- No npm, no build process, no transpilation
- Must work when opened directly as a local file (`file://`) with no server required
- Version number incremented with every change; commit version bumps automatically per global CLAUDE.md rules

## Architecture Notes

- All game state lives in a plain JS object (no external state management)
- Tile movement patterns stored as data (not hardcoded logic) — each tile has a side-A and side-B definition
- Use a seeded PRNG for any randomness (bag draws) — deterministic replay is desirable
- No `Math.random()` in game logic — breaking determinism is a critical bug

## Tile Movement Pattern Format

TBD — to be designed before coding begins. Will represent the movement grid for each tile side (slide, jump, strike, command, etc.).

## Current State

Project initialized. No code yet. See `_resources/` for reference materials (rulebook, tile diagrams, etc.).

## What's Next

1. Define the tile movement data format
2. Define the full tile roster for the base game (both sides of each tile)
3. Sketch the UI layout / board rendering approach
4. Begin coding game state and rendering

## Decisions Log

[2026-04-08] Starting with hotseat (local two-player) only — online multiplayer requires a backend and is out of scope for the initial build. Can revisit once the core game is solid.

[2026-04-08] Single `.html` file constraint adopted, consistent with other projects in this repo family. Can revisit if complexity demands splitting.

## What Hasn't Worked

<!-- Populate as development proceeds -->
