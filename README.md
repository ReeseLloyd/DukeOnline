# DukeOnline

A browser-based implementation of **The Duke** by Catalyst Game Labs.

The Duke is a two-player abstract strategy game played on a 6×6 grid. Players draw tiles from a bag and move them according to unique movement patterns printed on each tile — which flip to reveal a new pattern after every move. Capture your opponent's Duke to win.

## Status

Active development — base game with online multiplayer, AI opponent, and hotseat mode.

## How to Play

Open `duke.html` in any modern browser. No server or installation required.

## Rules Reference

Official rules: [Catalyst Game Labs](https://www.catalystgamelabs.com/brands/the-duke)

## Visual Design

### Tile color schemes

Each expansion set has its own tile palette. **Option 2 — Earthy Harmony** is the chosen scheme (marked ✓ below). All options are documented for reference.

The three sets share a warm earthy register. Set identity comes from temperature: Duke is neutral, Jarl is cool-shifted, Centurion is warm-shifted. On a mixed board everything reads as belonging to the same game.

**Mixed games:** Each player uses their own set's colors — the visual mismatch is intentional and helps players track which tiles belong to which set.

---

#### Duke (all options — unchanged)

| Player | BG | Line |
|---|---|---|
| 0 (light) | `#f4ede0` warm cream | `#1a1208` |
| 1 (dark) | `#b5a088` warm brown | `#1a1208` |

---

#### Jarl

| Option | Player | BG | Line | Notes |
|---|---|---|---|---|
| 1 — Faithful Muted | 0 | `#d8d6ce` | `#1c1c20` | Physical set, saturation ~40% |
| | 1 | `#484850` | `#e0ddd6` | |
| **2 — Earthy Harmony ✓** | **0** | **`#d6dde6`** | **`#181c26`** | **Cool light stone** |
| | **1** | **`#3e4a5c`** | **`#d6dde6`** | **Deep blue-slate** |
| 3 — Neutral + Accent Lines | 0 | `#dddbd4` | `#2a3040` | Slate-blue accent in lines |
| | 1 | `#42464e` | `#cdd4e0` | |

#### Centurion

| Option | Player | BG | Line | Notes |
|---|---|---|---|---|
| 1 — Faithful Muted | 0 | `#ede4d4` | `#3e1a16` | Physical set, saturation ~40% |
| | 1 | `#6a3430` | `#ede4d4` | |
| **2 — Earthy Harmony ✓** | **0** | **`#ece4d2`** | **`#301408`** | **Warm parchment** |
| | **1** | **`#6a3420`** | **`#ece4d2`** | **Deep burnt sienna** |
| 3 — Neutral + Accent Lines | 0 | `#e8e2d8` | `#5a1e16` | Terracotta accent in lines |
| | 1 | `#4a3830` | `#e8d4c8` | |

*See `dev/color-schemes.html` to preview all options rendered on Knight tiles.*

---

### Board color scheme

A single board is used for all tile sets. The alternating square contrast is kept intentionally tight so the board recedes behind the pieces.

| Option | Light square | Dark square | Notes |
|---|---|---|---|
| A — Warm Stone | `#eceae4` | `#d6d4cd` | Slight warmth; sits naturally with Duke + Centurion |
| B — True Neutral | `#ebebeb` | `#d4d4d4` | Pure grey, completely unbiased |
| C — Near-White Minimal | `#f2f1ee` | `#e0dedb` | Very subtle separation; tiles dominate |
| **D — Cooler Slate ✓** | **`#eaeaee`** | **`#d2d2d8`** | **Slight cool push; contrasts well with all three tile sets** |

---

## Development

See `CLAUDE.md` for architecture decisions, constraints, and development notes.
