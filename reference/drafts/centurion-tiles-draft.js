/**
 * centurion-tiles-draft.js
 *
 * DRAFT — deep-extraction pass (v2). Every entry needs visual verification
 * against the printed Centurion PnP sheet before merging into tiles.js.
 *
 * Source: full-page rasterization of Centurion-Print-n-Play.pdf page 5 at
 * 500dpi, cropped into vertical column strips via pdftoppm. Resolution
 * in some strip regions is low — flagged entries deserve extra scrutiny.
 *
 * See jarl-tiles-draft.js for coordinate system and action type key.
 */

'use strict';

const CENTURION_TILES_DRAFT = {

  // -------------------------------------------------------------------------
  // CENTURION  (1 copy; starts on board — leader tile, replaces the Duke)
  // Side-effects: dread skull on top row; multiple formation diamonds.
  // Heavy uncertainty due to strip resolution.
  // -------------------------------------------------------------------------
  centurion: {
    count: 1,
    startOnBoard: 1,
    sides: [
      [
        { type: 'dread',     sq: [ 0,  2] }, // verify
        { type: 'formation', sq: [-1,  1] }, // verify
        { type: 'formation', sq: [ 1,  1] }, // verify
        { type: 'move',      sq: [-1,  0] },
        { type: 'move',      sq: [ 1,  0] },
        { type: 'formation', sq: [-1, -1] }, // verify
        { type: 'formation', sq: [ 1, -1] }, // verify
      ],
      [
        { type: 'dread',     sq: [ 0,  2] }, // verify
        { type: 'formation', sq: [-1,  1] }, // verify
        { type: 'move',      sq: [ 0,  1] },
        { type: 'formation', sq: [ 1,  1] }, // verify
        { type: 'move',      sq: [-2,  0] },
        { type: 'move',      sq: [ 2,  0] },
        { type: 'formation', sq: [-1, -1] }, // verify
        { type: 'formation', sq: [ 1, -1] }, // verify
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // LEGIONNAIRE  (6 copies)
  // Side 1 has the X 'ready' marker (flip in place).
  // -------------------------------------------------------------------------
  legionnaire: {
    count: 6,
    sides: [
      [
        { type: 'strike',  sq: [ 0,  2] },
        { type: 'move',    sq: [-1,  1] },
        { type: 'move',    sq: [ 0,  1] },
        { type: 'move',    sq: [ 1,  1] },
        { type: 'defense', sq: [-1,  0] },
        { type: 'defense', sq: [ 1,  0] },
      ],
      [
        { type: 'move',    sq: [-1,  2] },
        { type: 'move',    sq: [ 0,  2] },
        { type: 'move',    sq: [ 1,  2] },
        { type: 'defense', sq: [-1,  1] },
        { type: 'defense', sq: [ 1,  1] },
        { type: 'ready' },
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // SLINGERS  (1 copy)
  // -------------------------------------------------------------------------
  slingers: {
    count: 1,
    sides: [
      [
        { type: 'slideNC', dir: [-1,  0] }, // verify
        { type: 'moveNC',  sq:  [ 0,  2] }, // verify
        { type: 'slideNC', dir: [ 0, -1] }, // verify
      ],
      [
        { type: 'strike',  sq:  [ 0,  2] },
        { type: 'move',    sq:  [-1,  1] },
        { type: 'move',    sq:  [ 1,  1] },
        { type: 'move',    sq:  [-2, -1] },
        { type: 'move',    sq:  [ 2, -1] },
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // TRIBUNE  (1 copy)  — many command markers; resolution poor
  // -------------------------------------------------------------------------
  tribune: {
    count: 1,
    sides: [
      [
        { type: 'slideNC', dir: [ 0,  1] }, // verify
        { type: 'command', sq:  [-1,  0] },
        { type: 'command', sq:  [ 1,  0] },
        { type: 'move',    sq:  [ 0, -1] },
      ],
      [
        { type: 'command', sq:  [-1,  1] },
        { type: 'command', sq:  [ 1,  1] },
        { type: 'move',    sq:  [-2,  0] },
        { type: 'move',    sq:  [ 2,  0] },
        { type: 'command', sq:  [-1, -1] },
        { type: 'command', sq:  [ 1, -1] },
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // VELITES  (1 copy)
  // -------------------------------------------------------------------------
  velites: {
    count: 1,
    sides: [
      [
        { type: 'strike', sq: [-2,  2] },
        { type: 'strike', sq: [ 2,  2] },
        { type: 'move',   sq: [-1,  1] },
        { type: 'move',   sq: [ 1,  1] },
        { type: 'move',   sq: [ 0, -1] },
      ],
      [
        { type: 'strike', sq: [-2,  2] },
        { type: 'strike', sq: [ 2,  2] },
        { type: 'jump',   sq: [ 0,  0] }, // verify — jump on own square?
        { type: 'move',   sq: [-2, -2] },
        { type: 'move',   sq: [ 2, -2] },
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // EXPLORATOR  (1 copy)  — resolution very poor; pattern guessed
  // -------------------------------------------------------------------------
  explorator: {
    count: 1,
    sides: [
      [
        { type: 'move', sq: [ 0,  2] }, // verify
        { type: 'move', sq: [-1,  0] }, // verify
        { type: 'move', sq: [ 1,  0] }, // verify
        { type: 'move', sq: [ 0, -2] }, // verify
      ],
      [
        { type: 'move', sq: [-2,  2] }, // verify
        { type: 'move', sq: [ 2,  2] }, // verify
        { type: 'move', sq: [-2, -2] }, // verify
        { type: 'move', sq: [ 2, -2] }, // verify
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // TRIARII  (1 copy)  — heavy uncertainty
  // -------------------------------------------------------------------------
  triarii: {
    count: 1,
    sides: [
      [
        { type: 'move',    sq: [-2,  1] },
        { type: 'move',    sq: [ 0,  1] },
        { type: 'move',    sq: [ 2,  1] },
        { type: 'move',    sq: [-1,  0] },
        { type: 'move',    sq: [ 1,  0] },
        { type: 'defense', sq: [ 0, -1] },
      ],
      [
        { type: 'move',    sq: [-2,  1] }, // verify
        { type: 'move',    sq: [ 2,  1] }, // verify
        { type: 'defense', sq: [-1,  0] },
        { type: 'defense', sq: [ 1,  0] },
        { type: 'hammer',  sq: [ 0,  1] }, // verify — star edge unclear
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // EQUITES  (2 copies)  — knight-like jumps; resolution poor
  // -------------------------------------------------------------------------
  equites: {
    count: 2,
    sides: [
      [
        { type: 'jump', sq: [-1,  2] }, // verify
        { type: 'jump', sq: [ 1,  2] }, // verify
        { type: 'jump', sq: [-2, -1] }, // verify
        { type: 'jump', sq: [ 2, -1] }, // verify
      ],
      [
        { type: 'jump', sq: [-2,  1] }, // verify
        { type: 'jump', sq: [ 2,  1] }, // verify
        { type: 'jump', sq: [-1, -2] }, // verify
        { type: 'jump', sq: [ 1, -2] }, // verify
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // ONAGER  (1 copy)  — siege engine
  // -------------------------------------------------------------------------
  onager: {
    count: 1,
    sides: [
      [
        { type: 'moveNC', sq: [-1,  0] }, // verify
        { type: 'moveNC', sq: [ 1,  0] }, // verify
      ],
      [
        { type: 'strike', sq: [-1,  2] },
        { type: 'strike', sq: [ 0,  2] },
        { type: 'strike', sq: [ 1,  2] },
        { type: 'move',   sq: [-1,  1] },
        { type: 'move',   sq: [ 1,  1] },
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // HASTATI  (1 copy)
  // -------------------------------------------------------------------------
  hastati: {
    count: 1,
    sides: [
      [
        { type: 'jump',    sq: [-2,  0] },
        { type: 'defense', sq: [-1,  0] },
        { type: 'move',    sq: [ 1,  0] },
        { type: 'move',    sq: [ 2,  0] },
        { type: 'strike',  sq: [ 0,  1] },
        { type: 'jump',    sq: [ 0,  2] },
      ],
      [
        { type: 'jump',      sq: [-2,  0] },
        { type: 'defense',   sq: [-1,  0] },
        { type: 'formation', sq: [ 0,  0] }, // verify — formation on own square
        { type: 'jump',      sq: [ 2,  0] },
        { type: 'move',      sq: [ 0,  1] },
        { type: 'move',      sq: [ 0,  2] },
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // WAR DOGS  (1 copy, noStartingSide)
  // Slide directions inferred from filled-triangle arrows pointing outward.
  // -------------------------------------------------------------------------
  warDogs: {
    count: 1,
    noStartingSide: true,
    sides: [
      [
        { type: 'slide', dir: [-1,  0] },
        { type: 'move',  sq:  [ 0,  1] },
        { type: 'slide', dir: [ 1,  0] },
        { type: 'slide', dir: [ 0, -1] },
      ],
      [
        { type: 'slide', dir: [-1,  0] },
        { type: 'move',  sq:  [ 0,  1] },
        { type: 'move',  sq:  [ 0,  2] },
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // PRIMUS PILUS  (1 copy)  — side 1 uses formationSingle (half-diamond)
  // -------------------------------------------------------------------------
  primusPilus: {
    count: 1,
    sides: [
      [
        { type: 'strike',  sq: [ 0,  2] },
        { type: 'move',    sq: [-1,  1] },
        { type: 'move',    sq: [ 0,  1] },
        { type: 'move',    sq: [ 1,  1] },
        { type: 'moveNC',  sq: [-2,  0] }, // verify
        { type: 'defense', sq: [-1,  0] },
      ],
      [
        { type: 'strike',          sq: [ 0,  2] },
        { type: 'move',            sq: [-1,  1] },
        { type: 'formationSingle', sq: [ 0,  1] },
        { type: 'move',            sq: [ 1,  1] },
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // OPTIO  (1 copy)
  // Side 1 smashes (chevrons) flank a formationSingle.
  // -------------------------------------------------------------------------
  optio: {
    count: 1,
    sides: [
      [
        { type: 'strike',          sq: [ 0,  2] },
        { type: 'move',            sq: [-1,  1] },
        { type: 'move',            sq: [ 1,  1] },
        { type: 'formationSingle', sq: [ 0,  0] }, // verify — on own square
        { type: 'jump',            sq: [ 0, -1] },
      ],
      [
        { type: 'jump',            sq: [ 0,  2] },
        { type: 'smash',           sq: [-1,  1] }, // direction inferred
        { type: 'formationSingle', sq: [ 0,  1] },
        { type: 'smash',           sq: [ 1,  1] }, // direction inferred
        { type: 'moveNC',          sq: [-2,  0] }, // verify
      ],
    ],
  },

};
