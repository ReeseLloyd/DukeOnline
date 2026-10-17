/**
 * tiles.js
 * Tile movement data for The Duke — base game.
 * @version 2026.10.16.06
 *
 * COORDINATE SYSTEM
 * -----------------
 * All squares are expressed as [dc, dr] offsets from the tile's current position:
 *   dc  column offset: positive = right, negative = left
 *   dr  row offset:    positive = forward (toward opponent), negative = backward
 *
 * Tiles always face their owner's opponent, regardless of board position.
 * The game engine applies a per-player transform when computing legal moves;
 * the data here is always expressed in the tile's own reference frame.
 *
 * ACTION TYPES
 * ------------
 * move       Filled circle.  Move to sq [dc,dr] if path is clear.
 *            Captures enemy at destination. Cannot land on a friendly tile.
 *
 * jump       Open circle.    Jump to sq [dc,dr], ignoring intervening pieces.
 *            Captures enemy at destination. Cannot land on a friendly tile.
 *
 * strike     Star.           Capture an enemy at sq [dc,dr] without moving.
 *            The tile stays in place and flips. No effect on friendly tiles.
 *
 * command    Corner triangles. One square in the set of squares this tile can
 *            command from/to. Rendered as two small right-angle triangles in
 *            the top-left and bottom-right corners of the cell, pointing away
 *            from the cell center — allowing a move/jump icon to occupy the
 *            same cell simultaneously.
 *            On the tile's turn, instead of moving this tile the player may
 *            move any friendly tile from one command sq to another. The
 *            commanded tile flips. Cannot end on a friendly tile.
 *
 * slide      Filled arrow.   Slide any number of squares in direction dir [dc,dr].
 *            Stops when blocked by a friendly (stops before it) or enemy (captures).
 *            dir is a unit direction vector, e.g. [-1, 1] = forward-left.
 *            The icon is placed in the first cell along the direction from the tile.
 *
 * jumpSlide  Open arrow.     Same as slide, but ignores any piece at the first
 *            adjacent square in the slide direction.
 *            dir may have components of magnitude > 1 when the first-cell position
 *            in the display grid is not adjacent (e.g. dir [0, 2] places the icon
 *            at the top-center cell of a tile with tileGridPos [2, 2]).
 *
 * summon     Roman numeral I. Passive ability marker (no sq/dir). Instead of moving
 *            or drawing, the player may flip their Duke (it stays put) and take
 *            a tile bearing this ability from anywhere on the board to an open
 *            square orthogonally adjacent to the Duke; the tile keeps its side.
 *            Not a Command move; cannot capture. (Duchess, both sides.)
 *
 * divination Roman numeral II. Passive ability marker (no sq/dir) on the Oracle's
 *            non-starting side. The player may flip the tile back to its starting
 *            side in place, then reveal three tiles from their bag, place one
 *            adjacent to the Duke, and return or destroy each of the other two.
 *
 * DATA SHAPE
 * ----------
 * Each tile entry:
 *   count        {number}   Total copies of this tile per player (bag + board).
 *   startOnBoard {number}   How many copies start on the board rather than in the
 *                           bag. Omit (or 0) for bag-only tiles.
 *   enhanced     {boolean}  Optional. Enhanced tiles (special abilities) — optional;
 *                           excluded from the default bag.
 *   promo        {boolean}  Optional. Promo / exclusive tile — optional;
 *                           excluded from the default bag.
 *   tileGridPos  {[col,row]} Position of the tile's own square within the 5×5
 *                           display grid (0-indexed, top-left = [0,0]).
 *                           Defaults to [2, 2] (center). Only needed for tiles
 *                           with a non-standard grid offset (e.g. Longbowman).
 *   sides        {Array}    Two side definitions. Index 0 = starting side (pawn icon).
 *   playerSides  {object}   Optional. { 1: [side0, side1] } — faces used instead of
 *                           `sides` for player 1, for tiles whose two players'
 *                           tiles differ (Swashbuckler). Read via getTileActions().
 *
 * Each side is an array of action objects: { type, sq } or { type, dir }
 *
 */

const TILES_VERSION = '2026.10.16.06';

const TILES = {

  // ---------------------------------------------------------------------------
  // DUKE  (1 copy; starts on board, never drawn from bag)
  // ---------------------------------------------------------------------------
  duke: {
    count: 1,
    startOnBoard: 1,
    sides: [
      // Side 0 — starting side
      [
        { type: 'slide', dir: [-1,  0] },   // slide left
        { type: 'slide', dir: [ 1,  0] },   // slide right
      ],
      // Side 1
      [
        { type: 'slide', dir: [ 0,  1] },   // slide forward
        { type: 'slide', dir: [ 0, -1] },   // slide backward
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // FOOTMAN  (3 copies per player: 2 start on board flanking the Duke, 1 in bag)
  // ---------------------------------------------------------------------------
  footman: {
    count: 3,
    startOnBoard: 2,
    sides: [
      // Side 0 — orthogonal cross
      [
        { type: 'move', sq: [ 0,  1] },
        { type: 'move', sq: [-1,  0] },
        { type: 'move', sq: [ 1,  0] },
        { type: 'move', sq: [ 0, -1] },
      ],
      // Side 1
      [
        { type: 'move', sq: [ 0,  2] },
        { type: 'move', sq: [-1,  1] },
        { type: 'move', sq: [ 1,  1] },
        { type: 'move', sq: [-1, -1] },
        { type: 'move', sq: [ 1, -1] },
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // ASSASSIN
  // ---------------------------------------------------------------------------
  assassin: {
    count: 1,
    sides: [
      // Side 0 — three jump-slides forming a Y-shape (forward + two back diagonals).
      // dir components may exceed 1: they position the icon at the visible corner
      // of the 5×5 grid and define the actual slide direction (normalized implicitly
      // by the game engine, e.g. [2,-2] → direction [1,-1]).
      [
        { type: 'jumpSlide', dir: [ 0,  2] },   // forward
        { type: 'jumpSlide', dir: [ 2, -2] },   // back-right diagonal
        { type: 'jumpSlide', dir: [-2, -2] },   // back-left diagonal
      ],
      // Side 1 — inverted Y-shape (backward + two front diagonals)
      [
        { type: 'jumpSlide', dir: [ 0, -2] },   // backward
        { type: 'jumpSlide', dir: [ 2,  2] },   // front-right diagonal
        { type: 'jumpSlide', dir: [-2,  2] },   // front-left diagonal
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // BOWMAN
  // ---------------------------------------------------------------------------
  bowman: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'move', sq: [ 0,  1] },   // move forward 1
        { type: 'move', sq: [-1,  0] },   // move left 1
        { type: 'move', sq: [ 1,  0] },   // move right 1
        { type: 'jump', sq: [-2,  0] },   // jump left 2
        { type: 'jump', sq: [ 2,  0] },   // jump right 2
        { type: 'jump', sq: [ 0, -2] },   // jump back 2
      ],
      // Side 1
      [
        { type: 'strike', sq: [ 0,  2] }, // strike forward 2
        { type: 'strike', sq: [-1,  1] }, // strike diagonal forward-left
        { type: 'strike', sq: [ 1,  1] }, // strike diagonal forward-right
        { type: 'move',   sq: [ 0,  1] }, // move forward 1
        { type: 'move',   sq: [-1, -1] }, // move back-left diagonal
        { type: 'move',   sq: [ 1, -1] }, // move back-right diagonal
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // CHAMPION
  // ---------------------------------------------------------------------------
  champion: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'jump', sq: [ 0,  2] },   // jump forward 2
        { type: 'move', sq: [ 0,  1] },   // move forward 1
        { type: 'move', sq: [-1,  0] },   // move left 1
        { type: 'move', sq: [ 1,  0] },   // move right 1
        { type: 'move', sq: [ 0, -1] },   // move back 1
        { type: 'jump', sq: [ 2,  0] },   // jump right 2
        { type: 'jump', sq: [-2,  0] },   // jump left 2
        { type: 'jump', sq: [ 0, -2] },   // jump back 2
      ],
      // Side 1 — orthogonal jumps at distance 2 + orthogonal strikes at distance 1
      [
        { type: 'jump',   sq: [ 0,  2] }, // jump forward 2
        { type: 'jump',   sq: [-2,  0] }, // jump left 2
        { type: 'jump',   sq: [ 2,  0] }, // jump right 2
        { type: 'jump',   sq: [ 0, -2] }, // jump back 2
        { type: 'strike', sq: [ 0,  1] }, // strike forward 1
        { type: 'strike', sq: [-1,  0] }, // strike left 1
        { type: 'strike', sq: [ 1,  0] }, // strike right 1
        { type: 'strike', sq: [ 0, -1] }, // strike back 1
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // DRAGOON
  // ---------------------------------------------------------------------------
  dragoon: {
    count: 1,
    sides: [
      // Side 0 — three forward strikes + lateral moves
      [
        { type: 'strike', sq: [-2,  2] }, // strike far forward-left
        { type: 'strike', sq: [ 0,  2] }, // strike forward 2
        { type: 'strike', sq: [ 2,  2] }, // strike far forward-right
        { type: 'move',   sq: [-1,  0] }, // move left 1
        { type: 'move',   sq: [ 1,  0] }, // move right 1
      ],
      // Side 1 — forward jumps, forward moves, backward diagonal slides
      [
        { type: 'jump',  sq: [-1,  2] },  // jump offset forward-left
        { type: 'jump',  sq: [ 1,  2] },  // jump offset forward-right
        { type: 'move',  sq: [ 0,  1] },  // move forward 1
        { type: 'move',  sq: [ 0,  2] },  // move forward 2
        { type: 'slide', dir: [-1, -1] }, // slide back-left diagonal
        { type: 'slide', dir: [ 1, -1] }, // slide back-right diagonal
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // GENERAL
  // ---------------------------------------------------------------------------
  general: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'jump', sq: [-1,  2] },   // jump forward-left (knight-ish)
        { type: 'jump', sq: [ 1,  2] },   // jump forward-right
        { type: 'move', sq: [ 0,  1] },   // move forward 1
        { type: 'move', sq: [-2,  0] },   // move left 2
        { type: 'move', sq: [ 2,  0] },   // move right 2
        { type: 'move', sq: [ 0, -1] },   // move back 1
      ],
      // Side 1 — forward jumps, wide horizontal moves, and command squares
      // below and to the sides. Command overlaps with move on [-1,0] and [1,0].
      [
        { type: 'jump',    sq: [-1,  2] },
        { type: 'jump',    sq: [ 1,  2] },
        { type: 'move',    sq: [ 0,  1] },
        { type: 'move',    sq: [-2,  0] },
        { type: 'move',    sq: [-1,  0] },
        { type: 'move',    sq: [ 1,  0] },
        { type: 'move',    sq: [ 2,  0] },
        { type: 'command', sq: [-1,  0] },
        { type: 'command', sq: [ 1,  0] },
        { type: 'command', sq: [-1, -1] },
        { type: 'command', sq: [ 0, -1] },
        { type: 'command', sq: [ 1, -1] },
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // KNIGHT
  // ---------------------------------------------------------------------------
  knight: {
    count: 1,
    sides: [
      // Side 0 — L-shape jumps forward + backward orthogonal moves
      [
        { type: 'jump', sq: [-1,  2] },   // L-jump forward-left
        { type: 'jump', sq: [ 1,  2] },   // L-jump forward-right
        { type: 'move', sq: [-1,  0] },
        { type: 'move', sq: [ 1,  0] },
        { type: 'move', sq: [ 0, -1] },
        { type: 'move', sq: [ 0, -2] },
      ],
      // Side 1 — forward slide + backward diagonal moves
      [
        { type: 'slide', dir: [ 0,  1] }, // slide forward
        { type: 'move',  sq:  [-1, -1] },
        { type: 'move',  sq:  [ 1, -1] },
        { type: 'move',  sq:  [-2, -2] },
        { type: 'move',  sq:  [ 2, -2] },
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // LONGBOWMAN
  //
  // This tile uses a non-standard grid offset: the tile's own square sits at
  // row 3 of the display grid (rather than the usual row 2), giving the grid
  // more forward range.  Grid corners: top-left (-2, +3), bottom-right (+2, -1).
  // tileGridPos reflects this so the renderer places the pawn and icons correctly.
  // ---------------------------------------------------------------------------
  longbowman: {
    count: 1,
    tileGridPos: [2, 3],
    sides: [
      // Side 0
      [
        { type: 'move', sq: [ 0,  1] },
        { type: 'move', sq: [-1,  0] },
        { type: 'move', sq: [ 1,  0] },
        { type: 'move', sq: [ 0, -1] },
      ],
      // Side 1 — long-range forward strikes + back-diagonal moves
      [
        { type: 'strike', sq: [ 0,  2] },
        { type: 'strike', sq: [ 0,  3] },
        { type: 'move',   sq: [-1, -1] },
        { type: 'move',   sq: [ 1, -1] },
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // MARSHALL
  // ---------------------------------------------------------------------------
  marshall: {
    count: 1,
    sides: [
      // Side 0 — forward jumps, lateral slides, back jump
      [
        { type: 'jump',  sq:  [ 2,  2] }, // jump forward-right
        { type: 'jump',  sq:  [-2,  2] }, // jump forward-left
        { type: 'slide', dir: [-1,  0] }, // slide left
        { type: 'slide', dir: [ 1,  0] }, // slide right
        { type: 'jump',  sq:  [ 0, -2] }, // jump back 2
      ],
      // Side 1 — dense move block with command squares across the forward row.
      // Command overlaps with move on [-1,1], [0,1], [1,1].
      [
        { type: 'move',    sq: [-2,  0] },
        { type: 'move',    sq: [-1,  1] },
        { type: 'move',    sq: [-1,  0] },
        { type: 'move',    sq: [-1, -1] },
        { type: 'move',    sq: [ 0,  1] },
        { type: 'move',    sq: [ 1,  1] },
        { type: 'move',    sq: [ 1,  0] },
        { type: 'move',    sq: [ 1, -1] },
        { type: 'move',    sq: [ 2,  0] },
        { type: 'command', sq: [-1,  1] },
        { type: 'command', sq: [ 0,  1] },
        { type: 'command', sq: [ 1,  1] },
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // PIKEMAN  (3 per player; all 3 go into the bag)
  // ---------------------------------------------------------------------------
  pikeman: {
    count: 3,
    sides: [
      // Side 0 — diagonal moves forming an X-shape
      [
        { type: 'move', sq: [-1,  1] },
        { type: 'move', sq: [-2,  2] },
        { type: 'move', sq: [ 1,  1] },
        { type: 'move', sq: [ 2,  2] },
      ],
      // Side 1 — forward strikes + orthogonal backward moves
      [
        { type: 'strike', sq: [-1,  2] }, // strike forward-left
        { type: 'strike', sq: [ 1,  2] }, // strike forward-right
        { type: 'move',   sq: [ 0,  1] },
        { type: 'move',   sq: [ 0, -1] },
        { type: 'move',   sq: [ 0, -2] },
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // PRIEST
  // ---------------------------------------------------------------------------
  priest: {
    count: 1,
    sides: [
      // Side 0 — four diagonal slides
      [
        { type: 'slide', dir: [-1,  1] },
        { type: 'slide', dir: [ 1,  1] },
        { type: 'slide', dir: [-1, -1] },
        { type: 'slide', dir: [ 1, -1] },
      ],
      // Side 1 — corner jumps + diagonal moves
      [
        { type: 'jump', sq: [-2,  2] },
        { type: 'jump', sq: [ 2,  2] },
        { type: 'jump', sq: [-2, -2] },
        { type: 'jump', sq: [ 2, -2] },
        { type: 'move', sq: [-1,  1] },
        { type: 'move', sq: [-1, -1] },
        { type: 'move', sq: [ 1,  1] },
        { type: 'move', sq: [ 1, -1] },
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // RANGER
  // ---------------------------------------------------------------------------
  ranger: {
    count: 1,
    sides: [
      // Side 0 — orthogonal slides + one back-diagonal jump
      [
        { type: 'slide', dir: [ 0,  1] }, // slide forward
        { type: 'slide', dir: [ 0, -1] }, // slide backward
        { type: 'jump',  sq:  [-2,  1] },
        { type: 'jump',  sq:  [-1,  2] },
        { type: 'jump',  sq:  [ 1,  2] },
        { type: 'jump',  sq:  [ 2,  1] },
      ],
      // Side 1 — forward diagonal slides + backward L-jumps
      [
        { type: 'slide', dir: [-1,  1] }, // slide forward left
        { type: 'slide', dir: [ 1,  1] }, // slide forward right
        { type: 'jump',  sq:  [-1, -2] },
        { type: 'jump',  sq:  [ 1, -2] },
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // SEER
  // ---------------------------------------------------------------------------
  seer: {
    count: 1,
    sides: [
      // Side 0 — diagonal moves + orthogonal jumps at distance 2
      [
        { type: 'move', sq: [-1,  1] },
        { type: 'move', sq: [-1, -1] },
        { type: 'move', sq: [ 1,  1] },
        { type: 'move', sq: [ 1, -1] },
        { type: 'jump', sq: [ 0,  2] },
        { type: 'jump', sq: [ 0, -2] },
        { type: 'jump', sq: [ 2,  0] },
        { type: 'jump', sq: [-2,  0] },
      ],
      // Side 1 — orthogonal moves + corner jumps at distance 2
      [
        { type: 'move', sq: [ 0,  1] },
        { type: 'move', sq: [-1,  0] },
        { type: 'move', sq: [ 1,  0] },
        { type: 'move', sq: [ 0, -1] },
        { type: 'jump', sq: [-2,  2] },
        { type: 'jump', sq: [-2, -2] },
        { type: 'jump', sq: [ 2,  2] },
        { type: 'jump', sq: [ 2, -2] },
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // WIZARD
  // ---------------------------------------------------------------------------
  wizard: {
    count: 1,
    sides: [
      // Side 0 — all 8 adjacent squares
      [
        { type: 'move', sq: [-1,  1] },
        { type: 'move', sq: [ 0,  1] },
        { type: 'move', sq: [ 1,  1] },
        { type: 'move', sq: [-1,  0] },
        { type: 'move', sq: [ 1,  0] },
        { type: 'move', sq: [-1, -1] },
        { type: 'move', sq: [ 0, -1] },
        { type: 'move', sq: [ 1, -1] },
      ],
      // Side 1 — jumps at all 8 outer-grid corners and mid-edges (distance 2)
      [
        { type: 'jump', sq: [-2,  2] },
        { type: 'jump', sq: [-2,  0] },
        { type: 'jump', sq: [-2, -2] },
        { type: 'jump', sq: [ 0,  2] },
        { type: 'jump', sq: [ 0, -2] },
        { type: 'jump', sq: [ 2,  2] },
        { type: 'jump', sq: [ 2,  0] },
        { type: 'jump', sq: [ 2, -2] },
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // DUCHESS  (enhanced tile — optional variant)
  // ---------------------------------------------------------------------------
  duchess: {
    count: 1,
    enhanced: true,
    sides: [
      // Side 0 — ability I: Summon (both sides)
      [
        { type: 'move',    sq: [ 1,  0] },
        { type: 'move',    sq: [-1,  0] },
        { type: 'move',    sq: [ 0, -2] },
        { type: 'command', sq: [-2,  0] },
        { type: 'command', sq: [-1,  0] },
        { type: 'command', sq: [ 1,  0] },
        { type: 'command', sq: [ 2,  0] },
        { type: 'summon' },
      ],
      // Side 1
      [
        { type: 'move',    sq: [ 1,  0] },
        { type: 'move',    sq: [-1,  0] },
        { type: 'move',    sq: [ 0, -2] },
        { type: 'command', sq: [-2,  0] },
        { type: 'command', sq: [-1,  0] },
        { type: 'command', sq: [ 1,  0] },
        { type: 'command', sq: [ 2,  0] },
        { type: 'summon' },
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // ORACLE  (enhanced tile — optional variant)
  // ---------------------------------------------------------------------------
  oracle: {
    count: 1,
    enhanced: true,
    sides: [
      // Side 0
      [
        { type: 'move', sq: [-1,  1] },
        { type: 'move', sq: [-1, -1] },
        { type: 'move', sq: [ 1, -1] },
        { type: 'move', sq: [ 1,  1] },
      ],
      // Side 1 — no movement; ability II: Divination (only usable with this side up)
      [
        { type: 'divination' },
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // JESTER  (promo tile — Kickstarter/event exclusive; optional, not in the
  // default bag). Patterns from the Events print-and-play sheet.
  // ---------------------------------------------------------------------------
  jester: {
    count: 1,
    promo: true,
    sides: [
      // Side 0 — forward-diagonal jumps; three moves back; two long back diagonals
      [
        { type: 'jump', sq: [-1,  1] },
        { type: 'jump', sq: [ 1,  1] },
        { type: 'move', sq: [-1, -1] },
        { type: 'move', sq: [ 0, -1] },
        { type: 'move', sq: [ 1, -1] },
        { type: 'move', sq: [-2, -2] },
        { type: 'move', sq: [ 2, -2] },
      ],
      // Side 1 — all jumps: forward diagonals, wide back sides, back row of three
      [
        { type: 'jump', sq: [-1,  1] },
        { type: 'jump', sq: [ 1,  1] },
        { type: 'jump', sq: [-2, -1] },
        { type: 'jump', sq: [ 2, -1] },
        { type: 'jump', sq: [-1, -2] },
        { type: 'jump', sq: [ 0, -2] },
        { type: 'jump', sq: [ 1, -2] },
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // SWASHBUCKLER  (promo tile — optional, not in the default bag)
  // The front is identical for both players; the backs are left-right mirror
  // images. `sides` is the light tile (player 0); `playerSides[1]` is the grey
  // tile (player 1), whose back swaps the strikes and moves across the tile.
  // ---------------------------------------------------------------------------
  swashbuckler: {
    count: 1,
    promo: true,
    sides: [
      // Side 0 — four corner jumps
      [
        { type: 'jump', sq: [-2,  2] },
        { type: 'jump', sq: [ 2,  2] },
        { type: 'jump', sq: [-2, -2] },
        { type: 'jump', sq: [ 2, -2] },
      ],
      // Side 1 (light) — strike forward-left / back-right, move forward-right / back-left
      [
        { type: 'strike', sq: [-1,  1] },
        { type: 'move',   sq: [ 1,  1] },
        { type: 'move',   sq: [-1, -1] },
        { type: 'strike', sq: [ 1, -1] },
      ],
    ],
    playerSides: {
      1: [
        // Side 0 — same as the light tile
        [
          { type: 'jump', sq: [-2,  2] },
          { type: 'jump', sq: [ 2,  2] },
          { type: 'jump', sq: [-2, -2] },
          { type: 'jump', sq: [ 2, -2] },
        ],
        // Side 1 (grey) — mirror image of the light back
        [
          { type: 'move',   sq: [-1,  1] },
          { type: 'strike', sq: [ 1,  1] },
          { type: 'strike', sq: [-1, -1] },
          { type: 'move',   sq: [ 1, -1] },
        ],
      ],
    },
  },

};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

// Bag customization limits.
const BAG_MAX_PER_TYPE = 4;

// Tiles whose special abilities are not implemented yet; kept out of bags and
// the bag editor until they are.
const UNRELEASED_TILES = [];

/**
 * Tile types a game creator may add to / remove from a bag, in TILES order.
 * The Duke is never in the bag. Enhanced tiles (Duchess, Oracle) are
 * editable but not part of the default bag.
 */
function editableTileTypes() {
  return Object.keys(TILES).filter(k => k !== 'duke' && !UNRELEASED_TILES.includes(k));
}

/**
 * The standard bag as a { type: count } map (bag copies only — startOnBoard
 * copies are placed during setup and are not part of the bag). Enhanced and
 * promo tiles are optional and excluded.
 */
function defaultBagCounts() {
  const counts = {};
  for (const key of editableTileTypes()) {
    if (TILES[key].enhanced || TILES[key].promo) continue;
    const n = TILES[key].count - (TILES[key].startOnBoard ?? 0);
    if (n > 0) counts[key] = n;
  }
  return counts;
}

/**
 * Clean an untrusted { type: count } map (Firestore / sessionStorage / UI).
 * Drops unknown or non-editable types, clamps counts to 0–BAG_MAX_PER_TYPE,
 * and returns null if the result is not a usable bag (nothing in it).
 */
function sanitizeBagCounts(counts) {
  if (!counts || typeof counts !== 'object') return null;
  const clean = {};
  let total = 0;
  for (const key of editableTileTypes()) {
    const n = Math.floor(Number(counts[key]));
    if (!(n > 0)) continue;
    clean[key] = Math.min(n, BAG_MAX_PER_TYPE);
    total += clean[key];
  }
  return total > 0 ? clean : null;
}

/**
 * Normalise a { p0, p1 } bag config. Returns null for the standard bag (so
 * stored/compared configs stay minimal), otherwise a sanitized config. Any
 * invalid side falls back to the standard bag.
 */
function sanitizeBagConfig(config) {
  if (!config || typeof config !== 'object') return null;
  const std    = JSON.stringify(defaultBagCounts());
  const p0     = sanitizeBagCounts(config.p0) ?? defaultBagCounts();
  const p1     = sanitizeBagCounts(config.p1) ?? defaultBagCounts();
  if (JSON.stringify(p0) === std && JSON.stringify(p1) === std) return null;
  return { p0, p1 };
}

/**
 * Returns the starting tile bag for one player.
 * Each entry is a tile type key. With no argument, uses the standard bag
 * (tiles with count > startOnBoard contribute count - startOnBoard copies;
 * enhanced tiles excluded). With a { type: count } map, contributes that many
 * copies per type, in TILES key order so the output is deterministic.
 */
function buildBag(counts) {
  const src = counts ?? defaultBagCounts();
  const bag = [];
  for (const key of editableTileTypes()) {
    for (let i = 0; i < (src[key] ?? 0); i++) {
      bag.push(key);
    }
  }
  return bag;
}

/**
 * Total copies of `type` one player owns under a bag config side
 * ({ type: count } or null for standard): board-start copies plus bag copies.
 */
function tileTotalCount(type, counts) {
  const onBoard = TILES[type].startOnBoard ?? 0;
  const inBag = (counts ?? defaultBagCounts())[type] ?? 0;
  return onBoard + inBag;
}

const _abilityCache = {};

/**
 * True if the given side of a tile carries the named ability marker
 * ('summon', 'divination'). Memoized — called inside AI search loops.
 */
function tileHasAbility(type, side, name) {
  const k = type + ':' + side + ':' + name;
  if (!(k in _abilityCache)) {
    _abilityCache[k] = !!TILES[type]?.sides[side]?.some(a => a.type === name);
  }
  return _abilityCache[k];
}

/**
 * Returns the action array for a tile's current side.
 * Tiles whose faces differ per player (e.g. the Swashbuckler's mirrored
 * backs) define `playerSides: { 1: [side0, side1] }`, used for player 1.
 * @param {string} type    - tile key (e.g. 'knight')
 * @param {number} side    - 0 or 1
 * @param {number} [player] - 0 or 1 (default 0)
 */
function getTileActions(type, side, player) {
  const t = TILES[type];
  return (player === 1 && t.playerSides?.[1] ? t.playerSides[1] : t.sides)[side];
}
