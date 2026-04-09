/**
 * game.js
 * Core game logic for The Duke — base game.
 *
 * Depends on: tiles.js  (TILES and buildBag must be in scope before this file)
 *
 * ─── Public API ───────────────────────────────────────────────────────────────
 *
 *   createGame(opts)              → state     Create a fresh game (setup phase).
 *   applySetupPlacement(state,c,r) → state     Setup: place next piece (Duke, then Footmen).
 *   getSetupInfo(state)           → object    Setup phase metadata for the UI.
 *   getLegalMoves(state)          → Move[]    All legal moves for currentPlayer (Guard-filtered).
 *   applyMove(state, move)        → state     Execute a move; returns new state object.
 *   peekBag(state, player)        → string|null   Next tile type in player's bag.
 *   getWinner(state)              → 0|1|null  Winner, or null if game is still active.
 *   isDukeInGuard(state)          → boolean   True if currentPlayer's Duke is threatened.
 *
 * ─── State shape ──────────────────────────────────────────────────────────────
 *
 *   board:         Array[6][6]          board[row][col].  row 0 = player 0's back row.
 *   bags:          [string[], string[]] Ordered draw piles.  bags[p][0] = next draw.
 *   currentPlayer: 0|1
 *   phase:         'setup'|'active'|'gameover'
 *   setupStep:     0–5|null             Setup sub-step (0–2 = P0, 3–5 = P1; see getSetupInfo).
 *   winner:        0|1|null
 *   turn:          number               Increments after each completed move.
 *   seed:          number               PRNG seed stored for Firestore / replay.
 *
 *   Each board cell: null  or  { type: string, player: 0|1, side: 0|1 }
 *
 * ─── Move shapes ──────────────────────────────────────────────────────────────
 *
 *   { action: 'move',    from: [c,r], to: [c,r] }
 *   { action: 'strike',  from: [c,r], target: [c,r] }
 *   { action: 'command', commander: [c,r], from: [c,r], to: [c,r] }
 *   { action: 'draw',    pos: [c,r] }
 *
 * ─── Coordinate system ────────────────────────────────────────────────────────
 *
 *   Board positions:  [col, row], col 0–5 left→right, row 0–5 player0-back→player1-back.
 *   Tile data uses:   [dc, dr] in tile-local frame — dr+ means toward opponent.
 *   playerTransform() converts tile-local deltas to board deltas per player.
 *     Player 0 (row 0, faces row 5): board_dc = dc,  board_dr = dr
 *     Player 1 (row 5, faces row 0): board_dc = -dc, board_dr = -dr
 *
 * ─── Notes / known deviations ─────────────────────────────────────────────────
 *
 *   Implemented: threatened-Duke move filtering; no-legal-moves loss detection.
 */

'use strict';

// ─── Seeded PRNG (Mulberry32) ─────────────────────────────────────────────────

/**
 * Returns a deterministic PRNG function seeded with `seed`.
 * Each call to the returned function yields a float in [0, 1).
 */
function _mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 0x100000000;
  };
}

/** Fisher-Yates shuffle using the provided PRNG. Mutates arr. */
function _shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

// ─── State creation ───────────────────────────────────────────────────────────

/**
 * Create a fresh game state.
 * @param {object} [opts]
 * @param {number} [opts.seed]  PRNG seed for bag shuffles. Defaults to Date.now().
 */
function createGame({ seed = Date.now() } = {}) {
  const rng = _mulberry32(seed);

  // Shuffle each player's bag independently using the same seeded RNG.
  // buildBag() (from tiles.js) returns only the tiles that belong in the bag —
  // startOnBoard copies are excluded and placed directly during setup.
  const bag0 = _shuffle(buildBag(), rng);
  const bag1 = _shuffle(buildBag(), rng);

  const board       = Array.from({ length: 6 }, () => Array(6).fill(null));
  const firstPlayer = Math.floor(rng() * 2);   // randomly determined; also sets setup order

  return {
    board,
    bags: [bag0, bag1],
    currentPlayer: firstPlayer,   // firstPlayer sets up first and moves first
    phase: 'setup',
    firstPlayer,
    // setupStep 0–2 = firstPlayer places (duke, footman, footman)
    // setupStep 3–5 = the other player places; null when active
    setupStep: 0,
    winner: null,
    turn: 0,
    seed,
  };
}

// ─── Setup phase ──────────────────────────────────────────────────────────────

/**
 * Return metadata about the current setup step, for use by the UI.
 *
 * Returns:
 *   { player, subStep, targets }
 *   player:   0 or 1 — which player is currently placing
 *   subStep:  0 = place Duke, 1 = place first Footman, 2 = place second Footman
 *   targets:  Array of valid [col, row] positions for this step
 *
 * Returns null if state.phase !== 'setup'.
 */
function getSetupInfo(state) {
  if (state.phase !== 'setup') return null;
  const step    = state.setupStep;
  const player  = step < 3 ? state.firstPlayer : 1 - state.firstPlayer;
  const subStep = step % 3;               // 0=duke, 1=footman1, 2=footman2
  const backRow = player === 0 ? 0 : 5;

  let targets;
  if (subStep === 0) {
    targets = [[2, backRow], [3, backRow]];
  } else {
    const duke = _findDuke(state.board, player);
    targets = duke ? _adjacentEmpty(state.board, duke[0], duke[1]) : [];
  }

  return { player, subStep, targets };
}

/**
 * Place the next setup piece for the current player.
 * Call getSetupInfo() first to determine valid [col, row] positions.
 *
 * @param {object} state
 * @param {number} col
 * @param {number} row
 * @returns {object}  New state.
 */
function applySetupPlacement(state, col, row) {
  if (state.phase !== 'setup') throw new Error('applySetupPlacement called outside setup phase');

  const next    = _copyState(state);
  const step    = next.setupStep;
  const player  = step < 3 ? next.firstPlayer : 1 - next.firstPlayer;
  const subStep = step % 3;

  if (subStep === 0) {
    next.board[row][col] = { type: 'duke',    player, side: 0 };
  } else {
    next.board[row][col] = { type: 'footman', player, side: 0 };
  }

  next.setupStep++;

  if (next.setupStep >= 6) {
    next.phase         = 'active';
    next.setupStep     = null;
    next.currentPlayer = next.firstPlayer;  // winner of the coin flip goes first
  } else {
    next.currentPlayer = next.setupStep < 3 ? next.firstPlayer : 1 - next.firstPlayer;
  }

  return next;
}

// ─── Move generation ──────────────────────────────────────────────────────────

/**
 * Return all candidate moves for state.currentPlayer without any Guard
 * filtering.  Used internally by getLegalMoves and _hasAnyLegalMove.
 * @param {object} state
 * @returns {Array}  Array of move objects.
 */
function _getRawLegalMoves(state) {
  if (state.phase !== 'active') return [];

  const p     = state.currentPlayer;
  const moves = [];

  // ── Option A: Draw a tile from the bag ──────────────────────────────────────
  if (state.bags[p].length > 0) {
    const duke = _findDuke(state.board, p);
    if (duke) {
      for (const pos of _adjacentEmpty(state.board, duke[0], duke[1])) {
        moves.push({ action: 'draw', pos });
      }
    }
  }

  // ── Option B: Move, strike, or command an existing tile ────────────────────
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      const cell = state.board[r][c];
      if (!cell || cell.player !== p) continue;
      for (const m of _movesForTile(state.board, c, r, cell, p)) {
        moves.push(m);
      }
    }
  }

  return moves;
}

/**
 * Return all legal moves for state.currentPlayer, excluding any move that
 * would leave the current player's Duke exposed to capture ("in Guard").
 * @param {object} state
 * @returns {Array}  Array of move objects.
 */
function getLegalMoves(state) {
  if (state.phase !== 'active') return [];
  const p   = state.currentPlayer;
  const raw = _getRawLegalMoves(state);
  return raw.filter(function (move) {
    const next = _applyMoveCore(state, move);
    if (next.phase === 'gameover') return true;   // winning move — always legal
    return !_isDukeThreatenedBy(next.board, p);
  });
}

/**
 * Return true as soon as one legal (Guard-safe) move exists for
 * state.currentPlayer.  Short-circuits on the first safe move found.
 * Used inside applyMove to detect positions where the opponent has no reply.
 */
function _hasAnyLegalMove(state) {
  if (state.phase !== 'active') return false;
  const p   = state.currentPlayer;
  const raw = _getRawLegalMoves(state);
  for (const move of raw) {
    const next = _applyMoveCore(state, move);
    if (next.phase === 'gameover') return true;
    if (!_isDukeThreatenedBy(next.board, p)) return true;
  }
  return false;
}

// ─── Move application ─────────────────────────────────────────────────────────

/**
 * Apply a move to state and return the resulting state.
 * Does not mutate the input state.  Does NOT check for no-legal-moves;
 * that check is done in the public applyMove wrapper below.
 * @param {object} state
 * @param {object} move
 * @returns {object}  New state.
 */
function _applyMoveCore(state, move) {
  if (state.phase !== 'active') throw new Error('applyMove called outside active phase');

  const next = _copyState(state);
  const p    = next.currentPlayer;

  if (move.action === 'draw') {
    const tileType = next.bags[p].shift();
    next.board[move.pos[1]][move.pos[0]] = { type: tileType, player: p, side: 0 };

  } else if (move.action === 'move') {
    const [fc, fr] = move.from;
    const [tc, tr] = move.to;
    const piece    = next.board[fr][fc];
    const captured = next.board[tr][tc];
    next.board[tr][tc] = { ...piece, side: 1 - piece.side };
    next.board[fr][fc] = null;
    if (captured && captured.type === 'duke') {
      next.phase  = 'gameover';
      next.winner = p;
    }

  } else if (move.action === 'strike') {
    const [fc, fr] = move.from;
    const [tc, tr] = move.target;
    const striker  = next.board[fr][fc];
    const captured = next.board[tr][tc];
    next.board[tr][tc] = null;
    next.board[fr][fc] = { ...striker, side: 1 - striker.side };
    if (captured && captured.type === 'duke') {
      next.phase  = 'gameover';
      next.winner = p;
    }

  } else if (move.action === 'command') {
    const [cc, cr] = move.commander;
    const [fc, fr] = move.from;
    const [tc, tr] = move.to;
    const commander = next.board[cr][cc];
    const commanded = next.board[fr][fc];
    const captured  = next.board[tr][tc];
    // Commander flips (it used its turn); commanded tile does NOT flip (it was moved).
    next.board[cr][cc] = { ...commander, side: 1 - commander.side };
    next.board[tr][tc] = { ...commanded };
    next.board[fr][fc] = null;
    if (captured && captured.type === 'duke') {
      next.phase  = 'gameover';
      next.winner = p;
    }
  }

  if (next.phase !== 'gameover') {
    next.currentPlayer = 1 - p;
    next.turn++;
  }

  return next;
}

/**
 * Apply a move to state and return the resulting state.
 * Does not mutate the input state.
 *
 * After the move is applied, checks whether the new current player has any
 * legal (Guard-safe) reply.  If not, the game ends immediately — the player
 * who just moved wins.  This is the "checkmate" equivalent in The Duke.
 *
 * @param {object} state
 * @param {object} move
 * @returns {object}  New state.
 */
function applyMove(state, move) {
  const next = _applyMoveCore(state, move);
  if (next.phase !== 'gameover' && !_hasAnyLegalMove(next)) {
    next.phase  = 'gameover';
    next.winner = state.currentPlayer;   // the player who just moved wins
  }
  return next;
}

// ─── Convenience queries ──────────────────────────────────────────────────────

/** Return the next tile type in player's bag, or null if the bag is empty. */
function peekBag(state, player) {
  return state.bags[player][0] ?? null;
}

/** Return the winning player (0 or 1), or null if the game is not over. */
function getWinner(state) {
  return state.winner;
}

/**
 * Return true if the current player's Duke is threatened — i.e. the opponent
 * has at least one move on the current board that would capture it ("Guard").
 * Use this to trigger the Guard announcement in the UI after each move.
 * @param {object} state
 * @returns {boolean}
 */
function isDukeInGuard(state) {
  if (state.phase !== 'active') return false;
  return _isDukeThreatenedBy(state.board, state.currentPlayer);
}

// ─── Internal: state copy ─────────────────────────────────────────────────────

function _copyState(state) {
  return {
    board:         state.board.map(row => row.map(cell => cell ? { ...cell } : null)),
    bags:          [state.bags[0].slice(), state.bags[1].slice()],
    currentPlayer: state.currentPlayer,
    phase:         state.phase,
    setupStep:     state.setupStep,
    firstPlayer:   state.firstPlayer,
    winner:        state.winner,
    turn:          state.turn,
    seed:          state.seed,
  };
}

// ─── Internal: coordinate helpers ────────────────────────────────────────────

/**
 * Convert tile-local [dc, dr] into board deltas for the given player.
 * Player 0 faces increasing row; player 1 faces decreasing row.
 */
function _transform(player, dc, dr) {
  return player === 0 ? [dc, dr] : [-dc, -dr];
}

function _inBounds(c, r) {
  return c >= 0 && c < 6 && r >= 0 && r < 6;
}

/**
 * Return true if all squares strictly between [fromC, fromR] and [toC, toR]
 * along a straight line (orthogonal or diagonal) are empty.
 * Used for 'move' actions where pieces cannot slide through occupants.
 */
function _pathClear(board, fromC, fromR, toC, toR) {
  const stepC = Math.sign(toC - fromC);
  const stepR = Math.sign(toR - fromR);
  let c = fromC + stepC;
  let r = fromR + stepR;
  while (c !== toC || r !== toR) {
    if (board[r][c] !== null) return false;
    c += stepC;
    r += stepR;
  }
  return true;
}

/**
 * Return all squares reachable by a slide or jumpSlide in direction [bdc, bdr].
 * jumpSlide: the first square in the direction is skipped (jumped over, regardless
 * of occupancy); sliding resumes from the second square.
 */
function _resolveSlide(board, col, row, bdc, bdr, player, isJumpSlide) {
  const targets = [];
  let c = col + bdc;
  let r = row + bdr;

  if (isJumpSlide) {
    // Skip the first square entirely — jump over it
    c += bdc;
    r += bdr;
  }

  while (_inBounds(c, r)) {
    const cell = board[r][c];
    if (cell === null) {
      targets.push([c, r]);
    } else if (cell.player !== player) {
      targets.push([c, r]);   // capture and stop
      break;
    } else {
      break;                  // friendly — blocked, stop before
    }
    c += bdc;
    r += bdr;
  }
  return targets;
}

/** Find the Duke for `player` on the board. Returns [col, row] or null. */
function _findDuke(board, player) {
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      const cell = board[r][c];
      if (cell && cell.type === 'duke' && cell.player === player) return [c, r];
    }
  }
  return null;
}

/**
 * Return all empty squares orthogonally adjacent (4-directional) to [col, row].
 * New tiles drawn from the bag may only be placed on these squares.
 */
function _adjacentEmpty(board, col, row) {
  const result = [];
  for (const [dc, dr] of [[0,1],[0,-1],[1,0],[-1,0]]) {
    const c = col + dc;
    const r = row + dr;
    if (_inBounds(c, r) && board[r][c] === null) result.push([c, r]);
  }
  return result;
}

/**
 * Return true if the opponent has at least one move on the current board
 * that would capture attackedPlayer's Duke.
 * Used to filter out moves that leave the Duke exposed ("in check").
 *
 * @param {Array}  board
 * @param {number} attackedPlayer  The player whose Duke we are checking.
 */
function _isDukeThreatenedBy(board, attackedPlayer) {
  const attacker = 1 - attackedPlayer;
  const dukePos  = _findDuke(board, attackedPlayer);
  if (!dukePos) return true;   // Duke already gone — treat as threatened
  const [dc, dr] = dukePos;

  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      const cell = board[r][c];
      if (!cell || cell.player !== attacker) continue;
      for (const m of _movesForTile(board, c, r, cell, attacker)) {
        if (m.action === 'move'    && m.to[0]     === dc && m.to[1]     === dr) return true;
        if (m.action === 'strike'  && m.target[0] === dc && m.target[1] === dr) return true;
        if (m.action === 'command' && m.to[0]     === dc && m.to[1]     === dr) return true;
      }
    }
  }
  return false;
}

// ─── Internal: per-tile move generation ──────────────────────────────────────

/**
 * Generate all legal moves for the piece at [col, row].
 * @param {Array}  board
 * @param {number} col
 * @param {number} row
 * @param {object} piece   { type, player, side }
 * @param {number} player  Current player (same as piece.player).
 * @returns {Array}  Move objects.
 */
function _movesForTile(board, col, row, piece, player) {
  const moves   = [];
  const actions = TILES[piece.type].sides[piece.side];

  // ── Collect command squares (transformed to board coords) ─────────────────
  const commandSqs = [];
  for (const action of actions) {
    if (action.type !== 'command') continue;
    const [bdc, bdr] = _transform(player, action.sq[0], action.sq[1]);
    const tc = col + bdc;
    const tr = row + bdr;
    if (_inBounds(tc, tr)) commandSqs.push([tc, tr]);
  }

  // ── Command moves ─────────────────────────────────────────────────────────
  // Any friendly tile sitting on a command square can be moved to any other
  // command square that isn't occupied by a friendly.
  if (commandSqs.length > 0) {
    const sources = commandSqs.filter(([c, r]) => {
      const cell = board[r][c];
      return cell && cell.player === player;
    });
    const dests = commandSqs.filter(([c, r]) => {
      const cell = board[r][c];
      return !cell || cell.player !== player;
    });

    for (const from of sources) {
      for (const to of dests) {
        if (from[0] === to[0] && from[1] === to[1]) continue;
        moves.push({ action: 'command', commander: [col, row], from, to });
      }
    }
  }

  // ── Regular moves (move, jump, strike, slide, jumpSlide) ──────────────────
  for (const action of actions) {
    if (action.type === 'command') continue;  // already handled above

    if (action.type === 'slide' || action.type === 'jumpSlide') {
      // Normalize dir to a unit step, then apply player transform.
      // dir magnitudes > 1 are used only for icon placement — the actual
      // slide direction is the normalized unit vector.
      const [bdc, bdr] = _transform(
        player,
        Math.sign(action.dir[0]),
        Math.sign(action.dir[1])
      );
      const targets = _resolveSlide(board, col, row, bdc, bdr, player, action.type === 'jumpSlide');
      for (const [tc, tr] of targets) {
        moves.push({ action: 'move', from: [col, row], to: [tc, tr] });
      }

    } else if (action.type === 'strike') {
      const [bdc, bdr] = _transform(player, action.sq[0], action.sq[1]);
      const tc = col + bdc;
      const tr = row + bdr;
      if (!_inBounds(tc, tr)) continue;
      const target = board[tr][tc];
      if (target && target.player !== player) {
        moves.push({ action: 'strike', from: [col, row], target: [tc, tr] });
      }

    } else {
      // 'move' or 'jump'
      const [bdc, bdr] = _transform(player, action.sq[0], action.sq[1]);
      const tc = col + bdc;
      const tr = row + bdr;
      if (!_inBounds(tc, tr)) continue;
      const target = board[tr][tc];
      if (target && target.player === player) continue;  // friendly blocks

      if (action.type === 'jump') {
        moves.push({ action: 'move', from: [col, row], to: [tc, tr] });
      } else {
        // 'move' — all intermediate squares must be clear
        if (_pathClear(board, col, row, tc, tr)) {
          moves.push({ action: 'move', from: [col, row], to: [tc, tr] });
        }
      }
    }
  }

  return moves;
}
