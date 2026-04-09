/**
 * ai-worker.js
 * Web Worker wrapper for the Duke AI.
 *
 * Runs in a background thread so the AI search never blocks the UI.
 *
 * Message in:  { state: object, depth: number }
 * Message out: { move: object | null }
 */

importScripts('tiles.js', 'game.js', 'ai.js');

self.onmessage = function (evt) {
  const { state, depth } = evt.data;
  const move = getBestMove(state, depth ?? 4);
  self.postMessage({ move });
};
