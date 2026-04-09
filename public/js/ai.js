/**
 * ai.js
 * Minimax AI with alpha-beta pruning for The Duke — base game.
 *
 * Depends on: tiles.js, game.js (globals must be in scope before this file).
 *
 * Public API:
 *   getBestMove(state, maxDepth)  → move object | null
 *
 * Design notes:
 *   - Uses negamax (unified minimax variant): always returns score from the
 *     perspective of the current player; callers negate the child's score.
 *   - Evaluation is intentionally cheap (material + development) so search
 *     reaches depth 4 without blocking the UI thread for long.
 *   - Move ordering (captures first) dramatically improves alpha-beta cutoffs.
 *   - Root moves are shuffled before ordering so equal-scored moves vary between
 *     games, making the AI feel less robotic.
 */

'use strict';

// ─── Piece values (relative material worth) ───────────────────────────────────
//
// The Duke itself is not counted here — its capture is the win condition and is
// handled separately via WIN_SCORE.  Approximate values by mobility/flexibility.

const TILE_VALUES = {
  footman:    3,
  pikeman:    4,
  longbowman: 4,
  bowman:     5,
  assassin:   5,
  dragoon:    5,
  knight:     6,
  seer:       6,
  ranger:     6,
  general:    6,
  champion:   7,
  priest:     7,
  marshall:   7,
  wizard:     8,
};

const WIN_SCORE = 1_000_000;

// ─── Static evaluation ────────────────────────────────────────────────────────

/**
 * Evaluate a non-terminal state from player 1's perspective.
 * Positive = good for player 1 (AI), negative = good for player 0 (human).
 *
 * Only called at leaf nodes (depth 0); win/loss is handled separately in
 * _negamax by checking state.phase === 'gameover'.
 */
function _evaluate(state) {
  let score = 0;

  // Material: sum of on-board tile values (Duke excluded)
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      const cell = state.board[r][c];
      if (!cell || cell.type === 'duke') continue;
      const val = TILE_VALUES[cell.type] ?? 4;
      score += cell.player === 1 ? val : -val;
    }
  }

  // Development: tiles still in the bag are wasted potential.
  // Favour states where the opponent has more undeveloped tiles.
  score += (state.bags[0].length - state.bags[1].length) * 0.4;

  return score;
}

// ─── Move ordering ────────────────────────────────────────────────────────────

function _moveOrderScore(move, board) {
  // Capture moves: Duke capture first, then most-valuable-victim
  if (move.action === 'move') {
    const t = board[move.to[1]][move.to[0]];
    if (t) return t.type === 'duke' ? 900_000 : 1000 + (TILE_VALUES[t.type] ?? 4);
  }
  if (move.action === 'strike') {
    const t = board[move.target[1]][move.target[0]];
    if (t) return t.type === 'duke' ? 900_000 : 1000 + (TILE_VALUES[t.type] ?? 4);
  }
  if (move.action === 'command') return 30;
  if (move.action === 'draw')    return 20;
  return 10;
}

/**
 * Sort moves for alpha-beta efficiency.
 * Shuffles equal-priority moves so the AI varies its play across games.
 */
function _orderMoves(moves, board) {
  // Shuffle first to randomise tie-breaking
  for (let i = moves.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = moves[i]; moves[i] = moves[j]; moves[j] = tmp;
  }
  return moves.sort((a, b) => _moveOrderScore(b, board) - _moveOrderScore(a, board));
}

// ─── Negamax with alpha-beta pruning ─────────────────────────────────────────

/**
 * Returns the search score from the perspective of state.currentPlayer.
 * Higher is better for the current player.
 *
 * @param {object} state
 * @param {number} depth    Remaining search depth.
 * @param {number} alpha    Lower bound (current player's best guaranteed score).
 * @param {number} beta     Upper bound (opponent's best guaranteed score).
 */
function _negamax(state, depth, alpha, beta) {
  // Terminal: the player who just moved won → current player lost
  if (state.phase === 'gameover') {
    return -(WIN_SCORE + depth);   // depth bonus rewards finding wins faster
  }

  // Leaf node: return static evaluation from current player's perspective
  if (depth === 0) {
    const raw = _evaluate(state);
    return state.currentPlayer === 1 ? raw : -raw;
  }

  const moves = _orderMoves(getLegalMoves(state), state.board);

  if (moves.length === 0) {
    return -(WIN_SCORE + depth);   // no legal moves treated as a loss
  }

  let best = -Infinity;

  for (const move of moves) {
    const child = applyMove(state, move);
    const score = -_negamax(child, depth - 1, -beta, -alpha);
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;      // beta cutoff — prune remaining siblings
  }

  return best;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Return the best move for state.currentPlayer, searching to maxDepth plies.
 *
 * @param {object} state
 * @param {number} [maxDepth=4]
 * @returns {object|null}  Move object (same shape as getLegalMoves output), or
 *                         null if no moves are available.
 */
function getBestMove(state, maxDepth = 4) {
  const moves = _orderMoves(getLegalMoves(state), state.board);
  if (moves.length === 0) return null;

  let bestMove  = moves[0];
  let bestScore = -Infinity;
  let alpha     = -Infinity;
  const beta    = Infinity;

  for (const move of moves) {
    const child = applyMove(state, move);
    const score = -_negamax(child, maxDepth - 1, -beta, -alpha);
    if (score > bestScore) {
      bestScore = score;
      bestMove  = move;
    }
    if (score > alpha) alpha = score;
  }

  return bestMove;
}
