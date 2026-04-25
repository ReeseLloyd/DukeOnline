/**
 * jarl-tiles-draft.js
 *
 * DRAFT — deep-extraction pass (v2). Every entry needs visual verification
 * against the printed Jarl PnP sheet before merging into tiles.js.
 *
 * Source: per-tile 290×290 images extracted from Jarl-Print-n-Play.pdf
 * (pdfimages -png -f 3 -l 4). Pattern interpretation done via subagent read
 * with icon-semantic guide. Some small-vs-large-circle distinctions
 * (move vs moveNC, jump vs jumpNC) are best-effort; review carefully.
 *
 * Coordinate system (matches tiles.js):
 *   dc = column offset from tile: positive = right, negative = left
 *   dr = row offset from tile:    positive = forward (toward opponent)
 *
 * Action types:
 *   move / moveNC         filled circle (cap) / small filled circle (no-cap)
 *   jump / jumpNC         open circle / small open circle
 *   strike                open star outline
 *   hammer                filled star / skull — strike that ignores defense
 *   command               corner triangles — command-another-tile action
 *   slide / slideNC       filled triangle, direction ray (vs small no-cap)
 *   jumpSlide / jumpSlideNC  open triangle, direction ray
 *   smash                 chevron — move ignoring defense
 *   formation             open diamond circumscribed in cell
 *   formationSingle       half-diamond (upper-right + lower-left edges)
 *   defense               filled square
 *   shieldDefense         stroked square (outline)
 *   dread                 skull icon — fear-based tile-blocking action
 *   ready                 X mark in name area — flip in place
 *
 * All entries are flagged as draft — `// verify` comments mark the most
 * uncertain reads.
 */

'use strict';

const JARL_TILES_DRAFT = {

  // -------------------------------------------------------------------------
  // JARL  (1 copy; starts on board — leader tile, replaces the Duke)
  // Source: jarl-021.png / jarl-024.png
  // -------------------------------------------------------------------------
  jarl: {
    count: 1,
    startOnBoard: 1,
    sides: [
      // Side 0 — starting side
      [
        { type: 'defense', sq: [ 0,  2] }, // verify
        { type: 'jump',    sq: [-2,  1] },
        { type: 'jump',    sq: [ 2,  1] },
        { type: 'move',    sq: [-1,  0] },
        { type: 'move',    sq: [ 1,  0] },
        { type: 'jump',    sq: [-2, -1] },
        { type: 'jump',    sq: [ 2, -1] },
      ],
      // Side 1
      [
        { type: 'jump',    sq: [-1,  2] },
        { type: 'jump',    sq: [ 1,  2] },
        { type: 'defense', sq: [-1,  1] },
        { type: 'move',    sq: [ 0,  1] },
        { type: 'defense', sq: [ 1,  1] },
        { type: 'move',    sq: [ 0, -1] },
        { type: 'jump',    sq: [-1, -2] },
        { type: 'jump',    sq: [ 1, -2] },
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // WARLORD  (1 copy)  — jarl-000.png / jarl-001.png
  // -------------------------------------------------------------------------
  warlord: {
    count: 1,
    sides: [
      [
        { type: 'strike', sq: [ 0,  2] },
        { type: 'move',   sq: [-1,  0] },
        { type: 'move',   sq: [ 1,  0] },
        { type: 'jump',   sq: [ 0, -2] },
      ],
      [
        { type: 'moveNC', sq: [-1,  2] }, // verify — small dots flanking center
        { type: 'move',   sq: [ 0,  2] },
        { type: 'moveNC', sq: [ 1,  2] }, // verify
        { type: 'move',   sq: [-1, -1] },
        { type: 'move',   sq: [ 1, -1] },
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // ARCHER  (1 copy)  — jarl-002.png / jarl-005.png
  // -------------------------------------------------------------------------
  archer: {
    count: 1,
    sides: [
      [
        { type: 'move',    sq: [-1,  1] },
        { type: 'move',    sq: [ 1,  1] },
        { type: 'defense', sq: [-1,  0] },
        { type: 'defense', sq: [ 1,  0] },
        { type: 'move',    sq: [-1, -1] },
        { type: 'move',    sq: [ 1, -1] },
      ],
      [
        { type: 'strike',  sq: [-2,  2] },
        { type: 'strike',  sq: [ 0,  2] },
        { type: 'strike',  sq: [ 2,  2] },
        { type: 'move',    sq: [-1,  1] },
        { type: 'move',    sq: [ 1,  1] },
        { type: 'defense', sq: [ 0, -1] },
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // AXE WARRIOR  (1 copy)  — jarl-003.png / jarl-006.png
  // -------------------------------------------------------------------------
  axeWarrior: {
    count: 1,
    sides: [
      [
        { type: 'move',    sq: [-1,  1] },
        { type: 'defense', sq: [ 0,  1] },
        { type: 'move',    sq: [ 1,  1] },
        { type: 'move',    sq: [-2,  0] },
        { type: 'move',    sq: [ 2,  0] },
        { type: 'jumpNC',  sq: [-2, -1] }, // verify small vs large
        { type: 'moveNC',  sq: [-1, -1] }, // verify
        { type: 'jumpNC',  sq: [ 2, -1] }, // verify
        { type: 'moveNC',  sq: [ 0, -2] }, // verify
      ],
      [
        { type: 'jumpNC',  sq: [-2,  2] }, // verify
        { type: 'strike',  sq: [ 0,  2] },
        { type: 'jumpNC',  sq: [ 2,  2] }, // verify
        { type: 'defense', sq: [ 0,  0] },
        { type: 'moveNC',  sq: [-2, -1] }, // verify
        { type: 'move',    sq: [ 0, -1] },
        { type: 'moveNC',  sq: [ 2, -1] }, // verify
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // BERSERKER  (1 copy)  — jarl-004.png / jarl-007.png
  // Skull icons = hammer (strike-through-defense).
  // -------------------------------------------------------------------------
  berserker: {
    count: 1,
    sides: [
      [
        { type: 'move',   sq: [ 0,  2] },
        { type: 'hammer', sq: [-1,  1] },
        { type: 'move',   sq: [ 0,  1] },
        { type: 'hammer', sq: [ 1,  1] },
        { type: 'move',   sq: [-1,  0] },
        { type: 'move',   sq: [ 1,  0] },
        { type: 'moveNC', sq: [ 0, -2] }, // verify
      ],
      [
        { type: 'move',   sq: [-2,  2] },
        { type: 'move',   sq: [ 2,  2] },
        { type: 'hammer', sq: [-1,  1] },
        { type: 'strike', sq: [ 0,  1] },
        { type: 'hammer', sq: [ 1,  1] },
        { type: 'move',   sq: [-2,  0] },
        { type: 'strike', sq: [-1,  0] },
        { type: 'strike', sq: [ 1,  0] },
        { type: 'move',   sq: [ 2,  0] },
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // CHIEFTAIN  (1 copy)  — jarl-008.png / jarl-011.png
  // Command markers (corner triangles) present.
  // -------------------------------------------------------------------------
  chieftain: {
    count: 1,
    sides: [
      [
        { type: 'move',    sq: [-1,  2] },
        { type: 'move',    sq: [ 1,  2] },
        { type: 'jumpNC',  sq: [-1,  1] }, // verify
        { type: 'jumpNC',  sq: [ 1,  1] }, // verify
        { type: 'move',    sq: [-1, -1] },
        { type: 'command', sq: [ 0, -1] },
        { type: 'move',    sq: [ 1, -1] },
        { type: 'jumpNC',  sq: [-1, -2] }, // verify
        { type: 'jumpNC',  sq: [ 1, -2] }, // verify
      ],
      [
        { type: 'jump',    sq: [ 0,  2] },
        { type: 'move',    sq: [-1,  1] },
        { type: 'move',    sq: [ 1,  1] },
        { type: 'command', sq: [ 0,  0] }, // verify — command on tile itself
        { type: 'jumpNC',  sq: [-2, -1] }, // verify
        { type: 'move',    sq: [-1, -1] },
        { type: 'move',    sq: [ 1, -1] },
        { type: 'jumpNC',  sq: [ 2, -1] }, // verify
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // FREEMAN  (3 copies)  — jarl-009/010/014 side0, jarl-012/013/018 side1
  // -------------------------------------------------------------------------
  freeman: {
    count: 3,
    sides: [
      [
        { type: 'moveNC',  sq: [ 0,  2] }, // verify
        { type: 'move',    sq: [-1,  1] },
        { type: 'defense', sq: [ 0,  1] },
        { type: 'move',    sq: [ 1,  1] },
        { type: 'moveNC',  sq: [ 0, -1] }, // verify
      ],
      [
        { type: 'move',   sq: [ 0,  2] },
        { type: 'moveNC', sq: [-1,  1] }, // verify
        { type: 'moveNC', sq: [ 1,  1] }, // verify
        { type: 'move',   sq: [-1, -1] },
        { type: 'move',   sq: [ 1, -1] },
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // GOTHI  (1 copy)  — jarl-015.png / jarl-019.png
  // -------------------------------------------------------------------------
  gothi: {
    count: 1,
    sides: [
      [
        { type: 'move', sq: [ 0,  2] },
        { type: 'jump', sq: [-2,  1] },
        { type: 'jump', sq: [ 2,  1] },
        { type: 'jump', sq: [-2, -1] },
        { type: 'jump', sq: [ 2, -1] },
        { type: 'move', sq: [ 0, -2] },
      ],
      [
        { type: 'move', sq: [-2,  2] },
        { type: 'jump', sq: [-1,  2] },
        { type: 'jump', sq: [ 1,  2] },
        { type: 'move', sq: [ 2,  2] },
        { type: 'move', sq: [-2, -2] },
        { type: 'jump', sq: [-1, -2] },
        { type: 'jump', sq: [ 1, -2] },
        { type: 'move', sq: [ 2, -2] },
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // HUNTSMAN  (1 copy, noStartingSide)  — jarl-016.png / jarl-020.png
  // -------------------------------------------------------------------------
  huntsman: {
    count: 1,
    noStartingSide: true,
    sides: [
      [
        { type: 'strike',  sq: [-2,  2] },
        { type: 'move',    sq: [ 0,  2] },
        { type: 'move',    sq: [ 0,  1] },
        { type: 'jumpNC',  sq: [-2,  0] }, // verify
        { type: 'defense', sq: [ 1,  0] },
        { type: 'move',    sq: [ 2,  0] },
        { type: 'moveNC',  sq: [ 2, -1] }, // verify
      ],
      [
        { type: 'move',    sq: [ 0,  2] },
        { type: 'move',    sq: [ 0,  1] },
        { type: 'strike',  sq: [ 2,  2] },
        { type: 'defense', sq: [-1,  0] },
        { type: 'jumpNC',  sq: [ 2,  0] }, // verify
        { type: 'move',    sq: [-2,  0] },
        { type: 'moveNC',  sq: [-2, -1] }, // verify
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // HUSCARL  (1 copy, noStartingSide)  — jarl-020.png / jarl-023.png
  // NOTE: jarl-020 overlaps huntsman's file list — verify mapping.
  // -------------------------------------------------------------------------
  huscarl: {
    count: 1,
    noStartingSide: true,
    sides: [
      [
        { type: 'strike',  sq: [-1,  2] },
        { type: 'jump',    sq: [ 1,  2] },
        { type: 'defense', sq: [-1,  1] },
        { type: 'defense', sq: [ 0,  1] },
        { type: 'move',    sq: [-1, -1] },
        { type: 'move',    sq: [ 1, -1] },
        { type: 'jumpNC',  sq: [-2, -2] }, // verify
        { type: 'moveNC',  sq: [ 0, -2] }, // verify
      ],
      [
        { type: 'jump',    sq: [-2,  2] },
        { type: 'strike',  sq: [ 0,  2] },
        { type: 'defense', sq: [ 0,  1] },
        { type: 'defense', sq: [ 1,  1] },
        { type: 'move',    sq: [-1, -1] },
        { type: 'move',    sq: [ 1, -1] },
        { type: 'moveNC',  sq: [ 0, -2] }, // verify
        { type: 'jumpNC',  sq: [ 2, -2] }, // verify
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // SHIELD MAIDEN  (1 copy, noStartingSide)  — jarl-022.png / jarl-025.png
  // Nested-square = shieldDefense.
  // -------------------------------------------------------------------------
  shieldMaiden: {
    count: 1,
    noStartingSide: true,
    sides: [
      [
        { type: 'shieldDefense', sq: [-1,  2] },
        { type: 'shieldDefense', sq: [ 0,  1] },
        { type: 'jump',          sq: [-2,  1] },
        { type: 'move',          sq: [ 1,  1] },
        { type: 'move',          sq: [ 0, -1] },
      ],
      [
        { type: 'move',          sq: [ 0,  1] },
        { type: 'move',          sq: [-1,  0] },
        { type: 'shieldDefense', sq: [ 1,  0] },
        { type: 'jump',          sq: [ 2,  0] },
        { type: 'shieldDefense', sq: [ 1, -1] },
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // SWORD WARRIOR  (1 copy)  — jarl-026.png / jarl-029.png
  // -------------------------------------------------------------------------
  swordWarrior: {
    count: 1,
    sides: [
      [
        { type: 'defense', sq: [ 0,  2] },
        { type: 'move',    sq: [-1,  1] },
        { type: 'move',    sq: [ 1,  1] },
        { type: 'jumpNC',  sq: [-2,  0] }, // verify
        { type: 'jumpNC',  sq: [ 2,  0] }, // verify
        { type: 'moveNC',  sq: [ 0, -1] }, // verify
        { type: 'moveNC',  sq: [ 0, -2] }, // verify
      ],
      [
        { type: 'jumpNC',  sq: [-2,  2] }, // verify
        { type: 'jumpNC',  sq: [ 2,  2] }, // verify
        { type: 'strike',  sq: [ 0,  1] },
        { type: 'move',    sq: [ 0, -1] },
        { type: 'moveNC',  sq: [ 0, -2] }, // verify
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // ULBERHT  (1 copy)  — jarl-027.png / jarl-030.png
  // -------------------------------------------------------------------------
  ulberht: {
    count: 1,
    sides: [
      [
        { type: 'move',    sq: [ 0,  2] },
        { type: 'defense', sq: [-1,  1] },
        { type: 'defense', sq: [ 1,  1] },
        { type: 'move',    sq: [ 0,  1] },
        { type: 'jumpNC',  sq: [-2,  0] }, // verify
        { type: 'jumpNC',  sq: [ 2,  0] }, // verify
      ],
      [
        { type: 'strike',  sq: [-2,  2] },
        { type: 'strike',  sq: [-1,  2] },
        { type: 'defense', sq: [ 0,  2] },
        { type: 'strike',  sq: [ 1,  2] },
        { type: 'strike',  sq: [ 2,  2] },
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // VALA  (1 copy)  — jarl-028.png / jarl-031.png
  // Side 1 has dread skull on top center.
  // -------------------------------------------------------------------------
  vala: {
    count: 1,
    sides: [
      [
        { type: 'jumpNC', sq: [-2,  2] }, // verify
        { type: 'jumpNC', sq: [ 2,  2] }, // verify
        { type: 'move',   sq: [ 0,  1] },
        { type: 'move',   sq: [-1,  0] },
        { type: 'move',   sq: [ 1,  0] },
      ],
      [
        { type: 'dread',  sq: [ 0,  2] },
        { type: 'jumpNC', sq: [-2,  1] }, // verify
        { type: 'move',   sq: [-1,  1] },
        { type: 'move',   sq: [ 1,  1] },
        { type: 'jumpNC', sq: [ 2,  1] }, // verify
        { type: 'move',   sq: [ 0, -1] },
        { type: 'jumpNC', sq: [-1, -2] }, // verify
        { type: 'jumpNC', sq: [ 1, -2] }, // verify
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // SPEARMAN  (3 copies)
  // jarl-032/033/034 side0; jarl-035/036/037 side1
  // -------------------------------------------------------------------------
  spearman: {
    count: 3,
    sides: [
      [
        { type: 'strike', sq: [-1,  2] },
        { type: 'strike', sq: [ 1,  2] },
        { type: 'jumpNC', sq: [-2,  2] }, // verify
        { type: 'jumpNC', sq: [ 2,  2] }, // verify
        { type: 'move',   sq: [ 0,  1] },
        { type: 'moveNC', sq: [ 0, -1] }, // verify
      ],
      [
        { type: 'strike', sq: [ 0,  2] },
        { type: 'strike', sq: [ 0,  1] },
        { type: 'move',   sq: [-1,  0] },
        { type: 'move',   sq: [ 1,  0] },
        { type: 'moveNC', sq: [ 0, -1] }, // verify
      ],
    ],
  },

};
