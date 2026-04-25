/**
 * centurion-tiles-draft.js
 *
 * DRAFT — Phase 0B output. Do not merge into tiles.js until verified.
 *
 * Coordinate system matches tiles.js:
 *   dc = column offset: positive = right, negative = left
 *   dr = row offset:    positive = forward (toward opponent)
 *
 * Annotation key:
 *   // NC?        icon appears smaller; may be moveNC/jumpNC/slideNC vs standard
 *   // hammer?    star icon — confirm strike vs hammer against printed legend
 *   // smash?     triangle icon — confirm smash vs plain move
 *   // verify     position or type uncertain from PDF read
 *   // Phase B    defense / shieldDefense icon — inert until Phase B engine work
 *   // Phase C    dread icon — inert until Phase C engine work
 *   // Phase D    formation / formationSingle icon — inert until Phase D engine work
 *
 * New action types used (all defined in ROADMAP):
 *   moveNC / jumpNC / slideNC   non-capture variants (smaller icons)
 *   hammer                      strike ignoring defense (filled star)
 *   smash                       move ignoring defense (filled triangle)
 *   ready                       flip in place (X mark)
 *   defense                     passive: blocks capture approach (Phase B)
 *   shieldDefense               passive: fully protects a friendly tile (Phase B)
 *   dread                       passive: freezes tile in covered square (Phase C)
 *   formation                   full formation — any/all per turn (Phase D)
 *   formationSingle             single formation — one per turn (Phase D)
 *
 * Rules confirmed from PDF pages 1–3:
 *   Full Formation tiles:   Centurion, Legionnaire, Tribune, Hastati, Optio
 *   Single Formation tile:  Primus Pilus (only)
 *   Ready tile:             Legionnaire (only)
 *   noStartingSide tile:    War Dogs (only)
 *   Diagonal-origin slideNC: Centurion and Legionnaire — encoded per ROADMAP as
 *     { type: 'slideNC', dir: [-1, 1] } and { type: 'slideNC', dir: [1, 1] }.
 *     The engine normalises dir via Math.sign; no engine change needed.
 *     Rules clarification (p. 2): the tile first moves into the diagonal square
 *     indicated, then may slide further — flag for precise behaviour verification.
 *   ShieldDefense:          Legionnaire confirmed (Example 2: "Shield Defense from
 *     his opponent's Legionnaire Tile protecting the Velites Tile")
 *   Defense:                Triarii confirmed (Examples 1 & 2)
 */

'use strict';

const CENTURION_TILES_DRAFT = {

  // -------------------------------------------------------------------------
  // CENTURION  (1 copy; starts on board — leader tile, replaces the Duke)
  //
  // Confirmed from rules/examples:
  //   Full Formation icons (multiple — Examples 1 & 2 show it pairing with
  //     tiles at different board positions simultaneously)
  //   Smash icons (Example 1: "left-side Smash icon", "right-side Smash icon")
  //   Diagonal-origin slideNC left and right (Example 2: "horizontal
  //     Non-Capture Slide icons to the left or right")
  //
  // Side 0 reads: formation at far forward corners + forward-diagonal smash +
  //   diagonal-origin NC slides + backward move.
  // Side 1 reads: formation at nearer positions + lateral smash + NC slides.
  // All positions uncertain — verify entire tile against sheet.
  // -------------------------------------------------------------------------
  centurion: {
    count: 1,
    startOnBoard: 1,
    sides: [
      // Side 0 — starting side
      [
        { type: 'formation', sq: [-2,  2] }, // Phase D — verify position
        { type: 'formation', sq: [ 2,  2] }, // Phase D — verify position
        { type: 'smash',     sq: [-1,  1] }, // smash? — verify: or [-1,0]?
        { type: 'smash',     sq: [ 1,  1] }, // smash? — verify: or [+1,0]?
        { type: 'slideNC', dir: [-1,  1] },  // diagonal-origin NC slide left
        { type: 'slideNC', dir: [ 1,  1] },  // diagonal-origin NC slide right
        { type: 'move',    sq: [ 0, -1] },   // verify
      ],
      // Side 1
      [
        { type: 'formation', sq: [-1,  1] }, // Phase D — verify position
        { type: 'formation', sq: [ 1,  1] }, // Phase D — verify position
        { type: 'smash',     sq: [-1,  0] }, // smash? — verify position
        { type: 'smash',     sq: [ 1,  0] }, // smash? — verify position
        { type: 'slideNC', dir: [-1,  1] },  // diagonal-origin NC slide left
        { type: 'slideNC', dir: [ 1,  1] },  // diagonal-origin NC slide right
        { type: 'move',    sq: [ 0,  1] },   // verify
        { type: 'move',    sq: [ 0, -1] },   // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // LEGIONNAIRE  (6 copies: 2 start on board, 4 in bag)
  //
  // Confirmed from rules/examples:
  //   Full Formation icon
  //   Ready icon — "see the Legionnaire tile" (p. 2)
  //   Diagonal-origin slideNC left and right
  //   ShieldDefense icon — Example 2: "Shield Defense from his opponent's
  //     Legionnaire Tile protecting the Velites Tile" (Phase B)
  //
  // Side 0 reads: strike at range 2 forward + move forward + formation +
  //   diagonal-origin NC slides + backward move.
  // Side 1 reads: ready + similar move/formation/NC slide pattern.
  // All copies appear identical on the sheet.
  // -------------------------------------------------------------------------
  legionnaire: {
    count: 6,
    startOnBoard: 2,
    sides: [
      // Side 0 — starting side
      [
        { type: 'strike',       sq: [ 0,  2] }, // verify
        { type: 'move',         sq: [ 0,  1] },
        { type: 'formation',    sq: [ 1,  1] }, // Phase D — verify: or [+1,0]?
        { type: 'slideNC',    dir: [-1,  1] },  // diagonal-origin NC slide left
        { type: 'slideNC',    dir: [ 1,  1] },  // diagonal-origin NC slide right
        // shieldDefense position TBD — verify sq on sheet (Phase B)
        // { type: 'shieldDefense', sq: [ ?, ? ] },
        { type: 'move',         sq: [ 0, -1] }, // verify
      ],
      // Side 1
      [
        { type: 'ready' },                       // flip in place; no sq needed
        { type: 'move',         sq: [ 0,  1] }, // verify
        { type: 'formation',    sq: [ 1,  1] }, // Phase D — verify
        { type: 'slideNC',    dir: [-1,  1] },  // diagonal-origin NC slide left
        { type: 'slideNC',    dir: [ 1,  1] },  // diagonal-origin NC slide right
        // shieldDefense position TBD (Phase B)
        // { type: 'shieldDefense', sq: [ ?, ? ] },
        { type: 'move',         sq: [ 0, -1] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // ONAGER  (1 copy; in bag)
  //
  // Roman catapult. Side 0: repositioning moves. Side 1: long-range strike
  // spread across the forward row at dr=+2 — three stars clearly visible.
  // -------------------------------------------------------------------------
  onager: {
    count: 1,
    sides: [
      // Side 0 — movement / repositioning
      [
        { type: 'moveNC', sq: [-1,  2] }, // NC?  or standard move?
        { type: 'moveNC', sq: [ 1,  2] }, // NC?
        { type: 'move',   sq: [ 0,  1] }, // verify
        { type: 'move',   sq: [-1,  0] }, // verify
        { type: 'move',   sq: [ 1,  0] }, // verify
        { type: 'move',   sq: [ 0, -1] }, // verify
      ],
      // Side 1 — long-range catapult spread
      [
        { type: 'strike', sq: [-2,  2] }, // hammer?
        { type: 'strike', sq: [ 0,  2] }, // hammer?
        { type: 'strike', sq: [ 2,  2] }, // hammer?
        { type: 'move',   sq: [ 0, -1] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // HASTATI  (1 copy; in bag)
  //
  // Roman front-line spearman (javelin).
  // Confirmed: Full Formation icon.
  // Reads: forward jumps + near-diagonal strikes + formation squares +
  //   NC backward move.
  // -------------------------------------------------------------------------
  hastati: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'jumpNC',    sq: [ 0,  2] }, // NC?  or standard jump?
        { type: 'strike',    sq: [-1,  1] }, // hammer?
        { type: 'strike',    sq: [ 1,  1] }, // hammer?
        { type: 'formation', sq: [-1,  0] }, // Phase D — verify
        { type: 'formation', sq: [ 1,  0] }, // Phase D — verify
        { type: 'moveNC',    sq: [ 0, -1] }, // NC?
      ],
      // Side 1
      [
        { type: 'jump',      sq: [-2,  0] }, // verify
        { type: 'jump',      sq: [ 2,  0] }, // verify
        { type: 'move',      sq: [ 0,  1] }, // verify
        { type: 'formation', sq: [-1,  0] }, // Phase D — verify
        { type: 'moveNC',    sq: [ 0, -1] }, // NC?
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // WAR DOGS  (1 copy; noStartingSide)
  //
  // Confirmed: noStartingSide (rules p. 1).
  // From Example 1: War Dogs have a Slide icon (blocked by Triarii's defense).
  // Side A reads: diagonal smash icons (all four diagonal directions).
  // Side B reads: forward slide + lateral moves.
  // -------------------------------------------------------------------------
  warDogs: {
    count: 1,
    noStartingSide: true,
    sides: [
      // Side A — diagonal smash
      [
        { type: 'smash', sq: [-1,  1] }, // smash?  verify
        { type: 'smash', sq: [ 1,  1] }, // smash?  verify
        { type: 'smash', sq: [-1, -1] }, // smash?  verify
        { type: 'smash', sq: [ 1, -1] }, // smash?  verify
      ],
      // Side B — forward slide + lateral moves
      [
        { type: 'slide', dir: [ 0,  1] },
        { type: 'move',  sq:  [-1,  0] }, // verify
        { type: 'move',  sq:  [ 1,  0] }, // verify
        { type: 'move',  sq:  [ 0, -1] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // PRIMUS PILUS  (1 copy; in bag)
  //
  // Most senior centurion. Confirmed: Single Formation icon (rules p. 1).
  // Reads: hammer/strike at multiple forward positions + formationSingle +
  //   moves. Both sides heavily flagged — verify entire tile.
  // -------------------------------------------------------------------------
  primusPilus: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'strike',          sq: [-2,  2] }, // hammer?
        { type: 'strike',          sq: [ 0,  2] }, // hammer?
        { type: 'strike',          sq: [ 2,  2] }, // hammer?
        { type: 'formationSingle', sq: [-1,  0] }, // Phase D — verify: or [0,+1]?
        { type: 'move',            sq: [ 0,  1] }, // verify
        { type: 'move',            sq: [ 0, -1] }, // verify
      ],
      // Side 1
      [
        { type: 'strike',          sq: [-2,  2] }, // hammer?  verify
        { type: 'strike',          sq: [ 2,  2] }, // hammer?  verify
        { type: 'formationSingle', sq: [ 1,  0] }, // Phase D — verify
        { type: 'move',            sq: [-1,  0] }, // verify
        { type: 'move',            sq: [ 1,  0] }, // verify
        { type: 'move',            sq: [ 0, -1] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // OPTIO  (1 copy; in bag)
  //
  // Second-in-command centurion. Confirmed: Full Formation icon.
  // Reads: formation + moves forward + lateral jumps at distance 2.
  // Entire tile is low confidence — verify.
  // -------------------------------------------------------------------------
  optio: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'formation', sq: [ 0,  1] }, // Phase D — verify: or [-1,0]/[+1,0]?
        { type: 'moveNC',    sq: [ 0,  1] }, // NC?  or standard move?
        { type: 'move',      sq: [-1,  0] }, // verify
        { type: 'move',      sq: [ 1,  0] }, // verify
        { type: 'jump',      sq: [ 0, -2] }, // verify
      ],
      // Side 1
      [
        { type: 'formation', sq: [-1,  0] }, // Phase D — verify
        { type: 'move',      sq: [ 0,  1] }, // verify
        { type: 'jump',      sq: [-2,  0] }, // verify
        { type: 'jump',      sq: [ 2,  0] }, // verify
        { type: 'move',      sq: [ 0, -1] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // SLINGERS  (1 copy; in bag)
  //
  // Roman light infantry with slings. Side 0: forward NC moves + lateral.
  // Side 1: forward strikes at range 2 (sling range).
  // -------------------------------------------------------------------------
  slingers: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'moveNC', sq: [ 0,  2] }, // NC?
        { type: 'move',   sq: [ 0,  1] },
        { type: 'move',   sq: [-1,  0] }, // verify
        { type: 'move',   sq: [ 1,  0] }, // verify
        { type: 'move',   sq: [ 0, -1] }, // verify
      ],
      // Side 1 — sling attack spread
      [
        { type: 'strike', sq: [-1,  2] }, // verify
        { type: 'strike', sq: [ 0,  2] },
        { type: 'strike', sq: [ 1,  2] }, // verify
        { type: 'move',   sq: [ 0,  1] }, // verify
        { type: 'move',   sq: [ 0, -1] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // TRIBUNE  (1 copy; in bag)
  //
  // Roman officer. Confirmed: Full Formation icon.
  // Reads: formation + NC moves + forward diagonal moves.
  // Entire tile is low confidence — verify.
  // -------------------------------------------------------------------------
  tribune: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'formation', sq: [-1,  0] }, // Phase D — verify
        { type: 'formation', sq: [ 1,  0] }, // Phase D — verify
        { type: 'moveNC',    sq: [ 0,  1] }, // NC?
        { type: 'move',      sq: [-1,  1] }, // verify
        { type: 'move',      sq: [ 1,  1] }, // verify
        { type: 'move',      sq: [ 0, -1] }, // verify
      ],
      // Side 1
      [
        { type: 'formation', sq: [ 0,  1] }, // Phase D — verify
        { type: 'moveNC',    sq: [-1,  0] }, // NC?
        { type: 'moveNC',    sq: [ 1,  0] }, // NC?
        { type: 'move',      sq: [ 0,  1] }, // verify
        { type: 'move',      sq: [ 0, -1] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // VELITES  (1 copy; in bag)
  //
  // Roman light skirmisher. From Example 2: has a Strike icon threatening a
  // distant square. Tile image shows an eye-like symbol — possible Dread icon
  // (Phase C), flagged for verification.
  // -------------------------------------------------------------------------
  velites: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'moveNC', sq: [-1,  1] }, // NC?
        { type: 'moveNC', sq: [ 0,  1] }, // NC?
        { type: 'moveNC', sq: [ 1,  1] }, // NC?
        // dread icon may be present — verify position on sheet (Phase C)
        // { type: 'dread', sq: [ ?, ? ] },
        { type: 'move',   sq: [ 0, -1] }, // verify
      ],
      // Side 1 — strike range (confirmed via Example 2)
      [
        { type: 'strike', sq: [ 0,  2] }, // verify — or diagonal?
        { type: 'strike', sq: [-1,  1] }, // verify
        { type: 'strike', sq: [ 1,  1] }, // verify
        { type: 'moveNC', sq: [ 0,  1] }, // NC?
        { type: 'move',   sq: [ 0, -1] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // EXPLORATOR  (1 copy; in bag)
  //
  // Roman scout. Reads as a high-mobility NC-move tile — small circles
  // throughout both sides suggest NC moves in a wide pattern.
  // Entire tile is low confidence — verify.
  // -------------------------------------------------------------------------
  explorator: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'moveNC', sq: [-1,  1] }, // NC?
        { type: 'moveNC', sq: [ 0,  1] }, // NC?
        { type: 'moveNC', sq: [ 1,  1] }, // NC?
        { type: 'move',   sq: [-1,  0] }, // verify
        { type: 'move',   sq: [ 1,  0] }, // verify
        { type: 'moveNC', sq: [ 0, -1] }, // NC?
      ],
      // Side 1
      [
        { type: 'moveNC', sq: [-1,  2] }, // NC?  verify
        { type: 'moveNC', sq: [ 1,  2] }, // NC?  verify
        { type: 'jump',   sq: [-2,  0] }, // verify
        { type: 'jump',   sq: [ 2,  0] }, // verify
        { type: 'move',   sq: [ 0, -1] }, // verify
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // TRIARII  (1 copy; in bag)
  //
  // Veteran Roman soldiers — last line of defence. Defense icons confirmed
  // by Examples 1 and 2. Tile image shows a large star-like symbol near
  // center — possibly a Dread icon (Phase C); flagged for verification.
  // Defense icon positions are inert until Phase B engine work.
  // -------------------------------------------------------------------------
  triarii: {
    count: 1,
    sides: [
      // Side 0
      [
        { type: 'move', sq: [ 0,  1] }, // verify
        { type: 'move', sq: [-1,  0] }, // verify
        { type: 'move', sq: [ 1,  0] }, // verify
        { type: 'move', sq: [ 0, -1] }, // verify
        // defense icons — positions TBD; verify on sheet (Phase B)
        // { type: 'defense', sq: [ ?, ? ] },
        // { type: 'defense', sq: [ ?, ? ] },
        // dread icon may be present — verify on sheet (Phase C)
        // { type: 'dread', sq: [ ?, ? ] },
      ],
      // Side 1
      [
        { type: 'move', sq: [-1,  1] }, // verify
        { type: 'move', sq: [ 1,  1] }, // verify
        { type: 'move', sq: [-1, -1] }, // verify
        { type: 'move', sq: [ 1, -1] }, // verify
        // defense icons — positions TBD (Phase B)
        // { type: 'defense', sq: [ ?, ? ] },
        // { type: 'defense', sq: [ ?, ? ] },
      ],
    ],
  },


  // -------------------------------------------------------------------------
  // EQUITES  (2 copies; in bag)
  //
  // Roman cavalry. Both copies appear identical on the sheet.
  // Reads: Smash icons for forward/backward charge + lateral jumps for
  // flanking mobility.
  // Entire tile is low confidence — verify.
  // -------------------------------------------------------------------------
  equites: {
    count: 2,
    sides: [
      // Side 0
      [
        { type: 'smash', sq: [ 0,  2] }, // smash?  verify
        { type: 'move',  sq: [-1,  1] }, // verify
        { type: 'move',  sq: [ 1,  1] }, // verify
        { type: 'jump',  sq: [-2,  0] }, // verify
        { type: 'jump',  sq: [ 2,  0] }, // verify
        { type: 'move',  sq: [ 0, -1] }, // verify
      ],
      // Side 1
      [
        { type: 'smash', sq: [ 0,  2] }, // smash?  verify
        { type: 'jump',  sq: [-1,  2] }, // verify
        { type: 'jump',  sq: [ 1,  2] }, // verify
        { type: 'move',  sq: [-1,  0] }, // verify
        { type: 'move',  sq: [ 1,  0] }, // verify
        { type: 'move',  sq: [ 0, -1] }, // verify
      ],
    ],
  },

};
