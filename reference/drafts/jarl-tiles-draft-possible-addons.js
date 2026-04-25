/**
 * jarl-tiles-draft.js
 *
 * DRAFT — Phase 0A output. Do not merge into tiles.js until verified.
 *
 * Verify every entry against the printed Jarl PnP sheet before encoding.
 *
 * Coordinate system (matches tiles.js):
 *   dc = column offset from tile: positive = right, negative = left
 *   dr = row offset from tile:    positive = forward (toward opponent)
 *
 * Annotation key:
 *   // NC?      icon appears smaller than adjacent icons of same type;
 *               may be moveNC / jumpNC / slideNC rather than the type shown
 *   // hammer?  star icon — confirm strike vs hammer against printed legend
 *   // smash?   move/arrow icon — confirm whether this is a smash
 *               (filled heavy arrow, bypasses defense) rather than plain move
 *   // verify   position or type uncertain from PDF read alone
 *
 * New action types used below (all defined in ROADMAP Phase A):
 *   moveNC     non-capture move  (smaller filled circle)
 *   jumpNC     non-capture jump  (smaller open circle)
 *   slideNC    non-capture slide (smaller filled arrow)
 *   hammer     strike ignoring defense (alias of strike until Phase B)
 *   smash      move ignoring defense  (alias of move until Phase B)
 *   ready      flip in place          (Valknut mark — not seen in Jarl grids)
 */

'use strict';

const JARL_TILES_DRAFT = {

  // -------------------------------------------------------------------------
  // JARL  (1 copy; starts on board — leader tile, replaces the Duke)
  //
  // Side 0: cross of standard move icons (cardinal ×4) + two smaller filled
  //   circles at the forward diagonals.
  // Side 1: similar cardinal pattern but the forward and backward cells look
  //   like open circles (jump) rather than filled (move). Verify.
  // -------------------------------------------------------------------------
  jarl: {
    count: 1,
    startOnBoard: 1,
    sides: [
      // Side 0 — starting side
      [
        { type: 'moveNC', sq: [-1,  1] }, // NC?  forward-left diagonal
        { type: 'move',   sq: [ 0,  1] },
        { type: 'moveNC', sq: [ 1,  1] }, // NC?  forward-right diagonal
        { type: 'move',   sq: [-1,  0] },
        { type: 'move',   sq: [ 1,  0] },
        { type: 'move',   sq: [ 0, -1] },
      ],
      // Side 1
      [
        { type: 'jump',   sq: [ 0,  2] }, // verify — or move [0,2]?
        { type: 'move',   sq: [ 0,  1] },
        { type: 'move',   sq: [-1,  0] }, // verify
        { type: 'move',   sq: [ 1,  0] }, // verify
        { type: 'move',   sq: [ 0, -1] },
        { type: 'jump',   sq: [ 0, -2] }, // verify — or move [0,-2]?
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // FREEMAN  (3 copies: 2 start on board, 1 in bag)
  //
  // All three copies appear identical on the sheet.
  // Side 0: plain orthogonal cross — clear. Identical to base-game Footman.
  // Side 1: forward element at top-center (looks like an arrow, so slide or
  //   slideNC rather than move [0,2] — confirm on sheet) + four diagonal moves.
  // -------------------------------------------------------------------------
  freeman: {
    count: 3,
    startOnBoard: 2,
    sides: [
      // Side 0 — orthogonal cross (identical to base-game Footman)
      [
        { type: 'move', sq: [ 0,  1] },
        { type: 'move', sq: [-1,  0] },
        { type: 'move', sq: [ 1,  0] },
        { type: 'move', sq: [ 0, -1] },
      ],
      // Side 1
      [
        { type: 'slideNC', dir: [ 0,  1] }, // NC?  or standard slide, or move [0,2]?
        { type: 'move',    sq:  [-1,  1] }, // verify
        { type: 'move',    sq:  [ 1,  1] }, // verify
        { type: 'move',    sq:  [-1, -1] }, // verify
        { type: 'move',    sq:  [ 1, -1] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // SPEARMAN  (3 copies; all in bag)
  //
  // All three copies appear identical on the sheet.
  // Side 0: two open circles at far forward corners (NC?) + star icons at
  //   near forward diagonals (strike or hammer?) + lateral NC moves.
  // Side 1: forward slide (long spear thrust) + backward move.
  // -------------------------------------------------------------------------
  spearman: {
    count: 3,
    sides: [
      // Side 0
      [
        { type: 'jumpNC', sq: [-2,  2] }, // NC?  open circles at far forward corners
        { type: 'jumpNC', sq: [ 2,  2] }, // NC?
        { type: 'strike', sq: [-1,  1] }, // hammer?
        { type: 'strike', sq: [ 1,  1] }, // hammer?
        { type: 'moveNC', sq: [-1,  0] }, // NC?
        { type: 'moveNC', sq: [ 1,  0] }, // NC?
        { type: 'move',   sq: [ 0, -1] }, // verify
      ],
      // Side 1 — long forward slide
      [
        { type: 'slide',  dir: [ 0,  1] },
        { type: 'moveNC', sq:  [-1,  0] }, // NC?  or absent entirely?
        { type: 'moveNC', sq:  [ 1,  0] }, // NC?
        { type: 'move',   sq:  [ 0, -1] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // CHIEFTAIN  (1 copy)
  //
  // Command-heavy tile — triangle corner marks (command icons) visible at
  // multiple squares. Specific positions and which squares are command-only
  // vs move-only vs both are uncertain at PDF resolution.
  // -------------------------------------------------------------------------
  chieftain: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'move',    sq: [ 0,  1] }, // verify
        { type: 'move',    sq: [ 0, -1] }, // verify
        { type: 'command', sq: [-1,  1] }, // verify — move too?
        { type: 'command', sq: [ 1,  1] }, // verify — move too?
        { type: 'command', sq: [-1,  0] }, // verify
        { type: 'command', sq: [ 1,  0] }, // verify
        { type: 'command', sq: [-1, -1] }, // verify
        { type: 'command', sq: [ 1, -1] }, // verify
      ],
      // Side 1
      [
        { type: 'move',    sq: [-1,  1] }, // verify
        { type: 'move',    sq: [ 0,  1] }, // verify
        { type: 'move',    sq: [ 1,  1] }, // verify
        { type: 'move',    sq: [-1, -1] }, // verify
        { type: 'move',    sq: [ 1, -1] }, // verify
        { type: 'command', sq: [-1,  0] }, // verify
        { type: 'command', sq: [ 1,  0] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // VALA  (1 copy)
  //
  // Illustration is a Fehu rune mark. Reads as NC moves at close range +
  // larger open-circle jumps at lateral/backward distance-2 positions on
  // Side 0, inverted on Side 1. High uncertainty — verify all.
  // -------------------------------------------------------------------------
  vala: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'moveNC', sq: [ 0,  1] }, // NC?
        { type: 'moveNC', sq: [-1,  0] }, // NC?
        { type: 'moveNC', sq: [ 1,  0] }, // NC?
        { type: 'jump',   sq: [-2,  0] }, // verify
        { type: 'jump',   sq: [ 2,  0] }, // verify
        { type: 'jump',   sq: [ 0, -2] }, // verify
      ],
      // Side 1
      [
        { type: 'jump',   sq: [ 0,  2] }, // verify
        { type: 'jump',   sq: [-1,  1] }, // verify
        { type: 'jump',   sq: [ 1,  1] }, // verify
        { type: 'moveNC', sq: [-1,  0] }, // NC?
        { type: 'moveNC', sq: [ 1,  0] }, // NC?
        { type: 'moveNC', sq: [ 0, -1] }, // NC?
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // BERSERKER  (1 copy)
  //
  // Wolf illustration. Star icons dominate the forward area — likely hammer
  // (bypass-defense strike) given the berserker theme, but confirm against
  // the printed legend. Side 1 forward moves may be smash (heavy arrow).
  // -------------------------------------------------------------------------
  berserker: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'strike', sq: [-2,  2] }, // hammer?  far forward-left
        { type: 'strike', sq: [ 0,  2] }, // hammer?  far forward-center
        { type: 'strike', sq: [ 2,  2] }, // hammer?  far forward-right
        { type: 'move',   sq: [-1,  0] }, // verify — smash?
        { type: 'move',   sq: [ 1,  0] }, // verify — smash?
      ],
      // Side 1
      [
        { type: 'move',   sq: [-1,  1] }, // verify — smash?
        { type: 'move',   sq: [ 0,  1] }, // verify — smash?
        { type: 'move',   sq: [ 1,  1] }, // verify — smash?
        { type: 'strike', sq: [-1,  0] }, // hammer?  verify position
        { type: 'strike', sq: [ 1,  0] }, // hammer?  verify position
        { type: 'move',   sq: [ 0, -1] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // SHIELD MAIDEN  (1 copy; noStartingSide)
  //
  // Both tile images show bow/shield illustration; no pawn marker designates
  // a starting side. The shieldDefense icon (Phase B) appears to be present
  // in the grid — position uncertain at PDF resolution, left as a comment.
  // -------------------------------------------------------------------------
  shieldMaiden: {
    count: 1,
    noStartingSide: true,
    sides: [
      // Side A
      [
        { type: 'move', sq: [ 0,  1] }, // verify
        { type: 'move', sq: [-1,  0] }, // verify
        { type: 'move', sq: [ 1,  0] }, // verify
        { type: 'move', sq: [ 0, -1] }, // verify
        // shieldDefense icon is present — confirm sq offset on sheet (Phase B)
        // { type: 'shieldDefense', sq: [ ?, ? ] },
      ],
      // Side B
      [
        { type: 'jump', sq: [-1,  2] }, // verify
        { type: 'jump', sq: [ 1,  2] }, // verify
        { type: 'move', sq: [-1,  0] }, // verify
        { type: 'move', sq: [ 1,  0] }, // verify
        { type: 'move', sq: [ 0, -1] }, // verify
        // shieldDefense icon — confirm sq offset on sheet (Phase B)
        // { type: 'shieldDefense', sq: [ ?, ? ] },
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // ARCHER  (1 copy)
  //
  // Bow illustration. Pattern is close to the base-game Bowman but may
  // differ in NC status of lateral moves. Verify each icon size on sheet.
  // -------------------------------------------------------------------------
  archer: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'move', sq: [ 0,  1] },
        { type: 'move', sq: [-1,  0] }, // verify — NC?
        { type: 'move', sq: [ 1,  0] }, // verify — NC?
        { type: 'jump', sq: [-2,  0] }, // verify
        { type: 'jump', sq: [ 2,  0] }, // verify
        { type: 'jump', sq: [ 0, -2] }, // verify
      ],
      // Side 1
      [
        { type: 'strike', sq: [ 0,  2] },
        { type: 'strike', sq: [-1,  1] }, // verify
        { type: 'strike', sq: [ 1,  1] }, // verify
        { type: 'move',   sq: [ 0,  1] }, // verify
        { type: 'move',   sq: [-1, -1] }, // verify
        { type: 'move',   sq: [ 1, -1] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // HUSCARL  (1 copy; noStartingSide)
  //
  // Curved-blade illustration; no pawn marker. Low confidence on all
  // positions — verify entire tile against sheet.
  // -------------------------------------------------------------------------
  huscarl: {
    count: 1,
    noStartingSide: true,
    sides: [
      // Side A
      [
        { type: 'move', sq: [-1,  1] }, // verify
        { type: 'move', sq: [ 0,  1] }, // verify
        { type: 'move', sq: [ 1,  1] }, // verify
        { type: 'jump', sq: [ 0,  2] }, // verify
        { type: 'move', sq: [ 0, -1] }, // verify
      ],
      // Side B
      [
        { type: 'slide', dir: [ 0,  1] }, // verify — NC?
        { type: 'move',  sq:  [-1,  0] }, // verify
        { type: 'move',  sq:  [ 1,  0] }, // verify
        { type: 'move',  sq:  [ 0, -1] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // WARLORD  (1 copy)
  //
  // Dragon/wolf-head illustration. Reads as a command tile with forward moves
  // and corner jumps. Specific command squares are uncertain — verify all.
  // The [0,0] command entry on Side 1 is suspicious; may be an artifact.
  // -------------------------------------------------------------------------
  warlord: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'move',    sq: [-1,  1] }, // verify
        { type: 'move',    sq: [ 0,  1] }, // verify
        { type: 'move',    sq: [ 1,  1] }, // verify
        { type: 'command', sq: [-1,  0] }, // verify — move too?
        { type: 'command', sq: [ 1,  0] }, // verify — move too?
        { type: 'move',    sq: [-1, -1] }, // verify
        { type: 'move',    sq: [ 1, -1] }, // verify
      ],
      // Side 1
      [
        { type: 'jump',    sq: [-2,  2] }, // verify
        { type: 'jump',    sq: [ 2,  2] }, // verify
        { type: 'move',    sq: [ 0,  1] }, // verify
        { type: 'command', sq: [-1,  0] }, // verify
        { type: 'command', sq: [ 1,  0] }, // verify
        { type: 'jump',    sq: [-2, -2] }, // verify
        { type: 'jump',    sq: [ 2, -2] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // GOTHI  (1 copy)
  //
  // Runic-staff illustration. Primarily a jump tile — open circles dominate.
  // Side 0: orthogonal jumps at distance 2 + one forward NC move.
  // Side 1: offset/L-shaped jumps + one backward NC move.
  // -------------------------------------------------------------------------
  gothi: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'jump',   sq: [ 0,  2] },
        { type: 'jump',   sq: [-2,  0] }, // verify
        { type: 'jump',   sq: [ 2,  0] }, // verify
        { type: 'jump',   sq: [ 0, -2] }, // verify
        { type: 'moveNC', sq: [ 0,  1] }, // NC?
      ],
      // Side 1
      [
        { type: 'jump',   sq: [-1,  2] }, // verify
        { type: 'jump',   sq: [ 1,  2] }, // verify
        { type: 'jump',   sq: [-2,  1] }, // verify
        { type: 'jump',   sq: [ 2,  1] }, // verify
        { type: 'moveNC', sq: [ 0, -1] }, // NC?
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // AXE WARRIOR  (1 copy)
  //
  // Axe illustration. Forward-biased move pattern + a star icon (strike or
  // hammer) at an offset far-forward position on Side 0. Very uncertain on
  // all positions — treat entire tile as needing verification.
  // -------------------------------------------------------------------------
  axeWarrior: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'move',   sq: [-1,  2] }, // verify
        { type: 'move',   sq: [ 0,  1] }, // verify
        { type: 'move',   sq: [-1,  0] }, // verify
        { type: 'strike', sq: [ 2,  2] }, // hammer?  verify position
        { type: 'move',   sq: [ 1,  0] }, // verify
        { type: 'move',   sq: [ 0, -1] }, // verify
      ],
      // Side 1
      [
        { type: 'strike', sq: [ 0,  2] }, // hammer?
        { type: 'move',   sq: [-1,  1] }, // verify
        { type: 'move',   sq: [ 1,  1] }, // verify
        { type: 'move',   sq: [ 0,  1] }, // verify
        { type: 'move',   sq: [ 0, -1] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // SWORD WARRIOR  (1 copy)
  //
  // Sword illustration. Side 0: forward jump + orthogonal moves.
  // Side 1: forward-diagonal strikes + lateral slides.
  // -------------------------------------------------------------------------
  swordWarrior: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'jump', sq: [ 0,  2] }, // verify
        { type: 'move', sq: [ 0,  1] }, // verify
        { type: 'move', sq: [-1,  0] }, // verify
        { type: 'move', sq: [ 1,  0] }, // verify
        { type: 'move', sq: [ 0, -1] }, // verify
      ],
      // Side 1
      [
        { type: 'strike', sq: [-1,  1] }, // hammer?
        { type: 'strike', sq: [ 1,  1] }, // hammer?
        { type: 'move',   sq: [ 0,  1] }, // verify
        { type: 'slide',  dir: [-1,  0] }, // verify — NC?
        { type: 'slide',  dir: [ 1,  0] }, // verify — NC?
        { type: 'move',   sq: [ 0, -1] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // HUNTSMAN  (1 copy; noStartingSide)
  //
  // Bow/arrow illustration; no pawn marker. Reads as NC forward moves
  // (stalking) + a range strike on Side A, slideNC on Side B.
  // All positions uncertain — verify entire tile.
  // -------------------------------------------------------------------------
  huntsman: {
    count: 1,
    noStartingSide: true,
    sides: [
      // Side A
      [
        { type: 'strike', sq: [ 0,  2] }, // verify — NC strike variant?
        { type: 'moveNC', sq: [-1,  1] }, // NC?
        { type: 'moveNC', sq: [ 0,  1] }, // NC?
        { type: 'moveNC', sq: [ 1,  1] }, // NC?
        { type: 'move',   sq: [ 0, -1] }, // verify
      ],
      // Side B
      [
        { type: 'slideNC', dir: [ 0,  1] }, // NC?
        { type: 'move',    sq:  [-1,  0] }, // verify
        { type: 'move',    sq:  [ 1,  0] }, // verify
        { type: 'move',    sq:  [ 0, -1] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // ULBERHT  (1 copy)
  //
  // Ulfberht blade illustration. Strike-heavy tile. Stars throughout —
  // confirm hammer vs strike against printed legend.
  // -------------------------------------------------------------------------
  ulberht: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'strike', sq: [-1,  1] }, // hammer?
        { type: 'strike', sq: [ 0,  1] }, // hammer?
        { type: 'strike', sq: [ 1,  1] }, // hammer?
        { type: 'move',   sq: [-1,  0] }, // verify
        { type: 'move',   sq: [ 1,  0] }, // verify
        { type: 'move',   sq: [ 0, -1] }, // verify
      ],
      // Side 1
      [
        { type: 'jump',   sq: [ 0,  2] }, // verify
        { type: 'jump',   sq: [-2,  0] }, // verify
        { type: 'jump',   sq: [ 2,  0] }, // verify
        { type: 'strike', sq: [-1,  1] }, // hammer?
        { type: 'strike', sq: [ 1,  1] }, // hammer?
        { type: 'move',   sq: [ 0, -1] }, // verify
      ],
    ],
  },

};
