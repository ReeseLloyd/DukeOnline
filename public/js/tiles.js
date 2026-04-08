/**
 * tiles.js
 * Tile movement data for The Duke — base game.
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
 * command    Small triangle. One square in the set of squares this tile can
 *            command from/to. On the tile's turn, instead of moving this tile
 *            the player may move any friendly tile from one command sq to another.
 *            The commanded tile flips. Cannot end on a friendly tile.
 *
 * slide      Filled arrow.   Slide any number of squares in direction dir [dc,dr].
 *            Stops when blocked by a friendly (stops before it) or enemy (captures).
 *
 * jumpSlide  Open arrow.     Same as slide, but ignores any piece at the first
 *            adjacent square in the slide direction.
 *
 * DATA SHAPE
 * ----------
 * Each tile entry:
 *   count        {number}   Copies of this tile in each player's bag/setup.
 *   startOnBoard {boolean}  If true, placed on board at game start, not in bag.
 *   enhanced     {boolean}  Optional. Enhanced tiles — optional variant rules.
 *   sides        {Array}    Two side definitions. Index 0 = starting side (pawn icon).
 *
 * Each side is an array of action objects: { type, sq } or { type, dir }
 *
 * VERIFICATION NOTES
 * ------------------
 * Tiles marked // VERIFY have movement patterns derived from lower-confidence
 * image reads. Cross-check against a physical copy or the official reference sheet
 * before treating as authoritative.
 */

const TILES = {

  // ---------------------------------------------------------------------------
  // DUKE  (starts on board, not drawn from bag)
  // ---------------------------------------------------------------------------
  duke: {
    count: 1,
    startOnBoard: true,
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
  // FOOTMAN  (2 per player; both start on board flanking the Duke)
  // ---------------------------------------------------------------------------
  footman: {
    count: 2,
    startOnBoard: true,
    sides: [
      // Side 0 — orthogonal cross
      [
        { type: 'move', sq: [ 0,  1] },
        { type: 'move', sq: [-1,  0] },
        { type: 'move', sq: [ 1,  0] },
        { type: 'move', sq: [ 0, -1] },
      ],
      // Side 1 — VERIFY: diagonal staircase; image was ambiguous
      [
        { type: 'move', sq: [-1,  2] },
        { type: 'move', sq: [-1,  1] },
        { type: 'move', sq: [-2,  0] },
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
      // Side 0 — four diagonal jump-slides + step forward
      [
        { type: 'jumpSlide', dir: [-1,  1] },   // jump-slide forward-left
        { type: 'jumpSlide', dir: [ 1,  1] },   // jump-slide forward-right
        { type: 'jumpSlide', dir: [-1, -1] },   // jump-slide back-left
        { type: 'jumpSlide', dir: [ 1, -1] },   // jump-slide back-right
        { type: 'move',      sq:  [ 0,  1] },   // step forward
      ],
      // Side 1 — same four diagonals + step backward
      [
        { type: 'jumpSlide', dir: [-1,  1] },
        { type: 'jumpSlide', dir: [ 1,  1] },
        { type: 'jumpSlide', dir: [-1, -1] },
        { type: 'jumpSlide', dir: [ 1, -1] },
        { type: 'move',      sq:  [ 0, -1] },   // step backward
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
        { type: 'move', sq: [ 0,  2] },   // move forward 2
        { type: 'move', sq: [-1,  0] },   // move left 1
        { type: 'move', sq: [ 1,  0] },   // move right 1
        { type: 'jump', sq: [-2,  0] },   // jump left 2
        { type: 'jump', sq: [ 2,  0] },   // jump right 2
        { type: 'jump', sq: [ 0, -1] },   // jump back 1
      ],
      // Side 1
      [
        { type: 'strike', sq: [ 0,  2] }, // strike forward 2
        { type: 'strike', sq: [-1,  1] }, // strike diagonal forward-left
        { type: 'strike', sq: [ 1,  1] }, // strike diagonal forward-right
        { type: 'move',   sq: [ 0, -1] }, // move back 1
        { type: 'move',   sq: [ 0, -2] }, // move back 2
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
        { type: 'jump', sq: [-2,  0] },   // jump left 2
        { type: 'jump', sq: [ 0, -2] },   // jump back 2
      ],
      // Side 1
      [
        { type: 'jump',   sq: [ 0,  2] }, // jump forward 2
        { type: 'jump',   sq: [-2,  0] }, // jump left 2
        { type: 'jump',   sq: [ 2,  0] }, // jump right 2
        { type: 'jump',   sq: [ 0, -2] }, // jump back 2
        { type: 'strike', sq: [-1,  0] }, // strike left 1
        { type: 'strike', sq: [ 1,  0] }, // strike right 1
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // DRAGOON
  // ---------------------------------------------------------------------------
  dragoon: {
    count: 1,
    sides: [
      // Side 0 — strikes in a forward arc + lateral moves
      [
        { type: 'strike', sq: [-2,  2] }, // strike far forward-left
        { type: 'strike', sq: [ 0,  2] }, // strike forward 2
        { type: 'strike', sq: [ 2,  2] }, // strike far forward-right
        { type: 'move',   sq: [-1,  0] }, // move left 1
        { type: 'move',   sq: [ 1,  0] }, // move right 1
      ],
      // Side 1 — VERIFY: diagonal back slides uncertain (could be command icons)
      [
        { type: 'jump',  sq: [-1,  1] },  // jump diagonal forward-left
        { type: 'jump',  sq: [ 1,  1] },  // jump diagonal forward-right
        { type: 'move',  sq: [ 0,  1] },  // move forward 1
        { type: 'slide', dir: [-1, -1] }, // slide back-left diagonal — VERIFY
        { type: 'slide', dir: [ 1, -1] }, // slide back-right diagonal — VERIFY
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // GENERAL
  // ---------------------------------------------------------------------------
  general: {
    count: 1,
    sides: [
      // Side 0 — VERIFY: lateral positions (±1 or ±2?)
      [
        { type: 'jump', sq: [-1,  2] },   // jump forward-left (knight-ish)
        { type: 'jump', sq: [ 1,  2] },   // jump forward-right
        { type: 'move', sq: [ 0,  1] },   // move forward 1
        { type: 'move', sq: [-2,  0] },   // move left 2 — VERIFY
        { type: 'move', sq: [ 2,  0] },   // move right 2 — VERIFY
        { type: 'move', sq: [ 0, -1] },   // move back 1
      ],
      // Side 1 — dense forward spread
      [
        { type: 'jump', sq: [-1,  2] },
        { type: 'jump', sq: [ 1,  2] },
        { type: 'move', sq: [-1,  1] },
        { type: 'move', sq: [ 0,  1] },
        { type: 'move', sq: [ 1,  1] },
        { type: 'move', sq: [-2,  0] },   // VERIFY outer extent
        { type: 'move', sq: [-1,  0] },
        { type: 'move', sq: [ 1,  0] },
        { type: 'move', sq: [ 2,  0] },   // VERIFY
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // KNIGHT
  // ---------------------------------------------------------------------------
  knight: {
    count: 1,
    sides: [
      // Side 0 — L-jumps forward + backward cluster of moves
      [
        { type: 'jump', sq: [-1,  2] },   // L-jump forward-left
        { type: 'jump', sq: [ 1,  2] },   // L-jump forward-right
        { type: 'move', sq: [-1,  0] },
        { type: 'move', sq: [ 1,  0] },
        { type: 'move', sq: [-1, -1] },
        { type: 'move', sq: [ 0, -1] },
        { type: 'move', sq: [ 0, -2] },
      ],
      // Side 1 — forward slide + L-jumps backward
      [
        { type: 'slide', dir: [ 0,  1] }, // slide forward
        { type: 'move',  sq:  [ 0,  1] }, // move forward 1
        { type: 'move',  sq:  [-1,  0] },
        { type: 'move',  sq:  [ 1,  0] },
        { type: 'jump',  sq:  [-2, -1] }, // L-jump back-left
        { type: 'jump',  sq:  [ 2, -1] }, // L-jump back-right
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // LONGBOWMAN
  // ---------------------------------------------------------------------------
  longbowman: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'move', sq: [ 0,  2] },   // move forward 2
        { type: 'move', sq: [-1,  0] },
        { type: 'move', sq: [ 1,  0] },
        { type: 'move', sq: [ 0, -1] },
      ],
      // Side 1
      [
        { type: 'strike', sq: [-1,  2] }, // strike top-left
        { type: 'strike', sq: [ 0,  2] }, // strike top-center
        { type: 'move',   sq: [ 0,  1] }, // move forward 1
        { type: 'jump',   sq: [-1,  0] }, // jump left
        { type: 'jump',   sq: [ 1,  0] }, // jump right
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // MARSHALL
  // ---------------------------------------------------------------------------
  marshall: {
    count: 1,
    sides: [
      // Side 0 — lateral slides + scattered jumps
      // VERIFY: exact jump positions; image showed top-right and bottom areas
      [
        { type: 'jump',  sq:  [ 1,  2] }, // jump forward-right — VERIFY
        { type: 'slide', dir: [-1,  0] }, // slide left
        { type: 'slide', dir: [ 1,  0] }, // slide right
        { type: 'jump',  sq:  [ 0, -2] }, // jump back 2 — VERIFY
      ],
      // Side 1 — dense move block; VERIFY outer extents
      [
        { type: 'move', sq: [-2,  1] },
        { type: 'move', sq: [-1,  1] },
        { type: 'move', sq: [ 0,  1] },
        { type: 'move', sq: [ 1,  1] },
        { type: 'move', sq: [-2,  0] },
        { type: 'move', sq: [-1,  0] },
        { type: 'move', sq: [ 1,  0] },
        { type: 'move', sq: [ 2,  0] },
        { type: 'move', sq: [-1, -1] },
        { type: 'move', sq: [ 0, -1] },
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // PIKEMAN  (3 per player)
  // ---------------------------------------------------------------------------
  pikeman: {
    count: 3,
    sides: [
      // Side 0 — VERIFY: positions unclear from images
      [
        { type: 'move', sq: [-1,  2] },   // VERIFY
        { type: 'move', sq: [ 1,  2] },   // VERIFY
        { type: 'move', sq: [-1,  0] },   // VERIFY
      ],
      // Side 1
      [
        { type: 'strike', sq: [-2,  2] }, // strike far forward-left
        { type: 'strike', sq: [ 2,  2] }, // strike far forward-right
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
      // Side 0 — four diagonal command squares
      [
        { type: 'command', sq: [-1,  1] },
        { type: 'command', sq: [ 1,  1] },
        { type: 'command', sq: [-1, -1] },
        { type: 'command', sq: [ 1, -1] },
      ],
      // Side 1 — corner jumps + lateral moves; VERIFY back-corner positions
      [
        { type: 'jump', sq: [-1,  2] },
        { type: 'jump', sq: [ 1,  2] },
        { type: 'move', sq: [-1,  0] },
        { type: 'move', sq: [ 1,  0] },
        { type: 'jump', sq: [-2, -2] },   // VERIFY
        { type: 'jump', sq: [ 2, -2] },   // VERIFY
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // RANGER
  // ---------------------------------------------------------------------------
  ranger: {
    count: 1,
    sides: [
      // Side 0 — wide lateral jumps + orthogonal slides
      [
        { type: 'jump',  sq:  [-2,  1] }, // jump far forward-left
        { type: 'jump',  sq:  [ 2,  1] }, // jump far forward-right
        { type: 'slide', dir: [ 0,  1] }, // slide forward
        { type: 'slide', dir: [ 0, -1] }, // slide backward
      ],
      // Side 1 — VERIFY: diagonal command squares + diagonal jumps back
      [
        { type: 'command', sq: [-1,  1] }, // VERIFY type (command vs move/jump?)
        { type: 'command', sq: [ 1,  1] },
        { type: 'jump',    sq: [-1, -1] },
        { type: 'jump',    sq: [ 1, -1] },
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // SEER  — VERIFY: both sides; low confidence from image analysis
  // ---------------------------------------------------------------------------
  seer: {
    count: 1,
    sides: [
      // Side 0 — asymmetric layout; left-column moves + orthogonal jumps
      [
        { type: 'move', sq: [-1,  1] },   // VERIFY
        { type: 'move', sq: [-1,  0] },   // VERIFY
        { type: 'move', sq: [-1, -1] },   // VERIFY
        { type: 'jump', sq: [-2,  0] },   // VERIFY
        { type: 'jump', sq: [ 0, -2] },   // VERIFY
      ],
      // Side 1
      [
        { type: 'move', sq: [ 0,  1] },
        { type: 'move', sq: [-1,  0] },
        { type: 'move', sq: [ 1,  0] },
        { type: 'move', sq: [ 0, -1] },
        { type: 'jump', sq: [-2, -2] },   // VERIFY
        { type: 'jump', sq: [ 2, -2] },   // VERIFY
      ],
    ],
  },

  // ---------------------------------------------------------------------------
  // WIZARD
  // ---------------------------------------------------------------------------
  wizard: {
    count: 1,
    sides: [
      // Side 0 — all 8 adjacent squares + extended horizontal
      [
        { type: 'move', sq: [-1,  1] },
        { type: 'move', sq: [ 0,  1] },
        { type: 'move', sq: [ 1,  1] },
        { type: 'move', sq: [-2,  0] },
        { type: 'move', sq: [-1,  0] },
        { type: 'move', sq: [ 1,  0] },
        { type: 'move', sq: [ 2,  0] },
        { type: 'move', sq: [-1, -1] },
        { type: 'move', sq: [ 0, -1] },
        { type: 'move', sq: [ 1, -1] },
      ],
      // Side 1 — jumps at ±2 columns across 3 rows
      [
        { type: 'jump', sq: [-2,  1] },
        { type: 'jump', sq: [ 2,  1] },
        { type: 'jump', sq: [-2,  0] },
        { type: 'jump', sq: [ 2,  0] },
        { type: 'jump', sq: [-2, -1] },
        { type: 'jump', sq: [ 2, -1] },
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
      // Side 0
      [
        { type: 'move', sq: [ 0,  1] },
        { type: 'move', sq: [-1,  0] },
        { type: 'move', sq: [ 1,  0] },
        { type: 'move', sq: [ 0, -1] },
        { type: 'jump', sq: [ 0,  1] },   // VERIFY: jump forward or same as move?
      ],
      // Side 1
      [
        { type: 'slide', dir: [ 0,  1] }, // slide forward
        { type: 'move',  sq:  [-1,  0] },
        { type: 'move',  sq:  [ 1,  0] },
        { type: 'move',  sq:  [ 0, -1] },
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
        { type: 'move', sq: [ 0,  1] },
        { type: 'move', sq: [-1, -1] },
        { type: 'move', sq: [ 1, -1] },
        { type: 'move', sq: [ 0, -1] },
      ],
      // Side 1
      [
        { type: 'move', sq: [ 0,  1] },
        { type: 'move', sq: [-1,  0] },
        { type: 'move', sq: [ 1,  0] },
        { type: 'move', sq: [ 0, -1] },
      ],
    ],
  },

};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Returns the starting tile bag for one player.
 * Bag tiles are tile type keys, one entry per copy.
 * Does not include startOnBoard tiles.
 */
function buildBag() {
  const bag = [];
  for (const [key, tile] of Object.entries(TILES)) {
    if (tile.startOnBoard || tile.enhanced) continue;
    for (let i = 0; i < tile.count; i++) {
      bag.push(key);
    }
  }
  return bag;
}

/**
 * Returns the starting board pieces for one player (tiles that begin on the board).
 * Each entry is { type: key, side: 0 }.
 */
function getStartingPieces() {
  const pieces = [];
  for (const [key, tile] of Object.entries(TILES)) {
    if (!tile.startOnBoard) continue;
    for (let i = 0; i < tile.count; i++) {
      pieces.push({ type: key, side: 0 });
    }
  }
  return pieces;
}

/**
 * Returns the action array for a tile's current side.
 * @param {string} type  - tile key (e.g. 'knight')
 * @param {number} side  - 0 or 1
 */
function getTileActions(type, side) {
  return TILES[type].sides[side];
}
