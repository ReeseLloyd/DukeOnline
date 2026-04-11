/**
 * firebase.js
 * Firebase initialisation and Firestore helpers for DukeOnline multiplayer.
 *
 * Depends on: Firebase compat SDK v10+ (app, auth, firestore) loaded via CDN
 * before this file.
 *
 * Public API (all globally accessible):
 *   initFirebase()                          → Promise<void>
 *   createOnlineGame(seed, firstPlayer)     → Promise<{ code }>
 *   joinOnlineGame(code)                    → Promise<{ seed, firstPlayer }|null>
 *   listenToGame(code, callback)            → unsubscribe()
 *   writeGameState(code, state, move)       → Promise<void>
 *   getUid()                                → string|null
 *
 * Firestore document shape  (games/{code}):
 *   status:      'waiting' | 'active' | 'gameover'
 *   player0uid:  string
 *   player1uid:  string | null
 *   seed:        number          shared PRNG seed — both clients call createGame({ seed })
 *   firstPlayer: 0 | 1          derived from seed, stored for quick reference
 *   state:       object | null   full serialised GameState (null until first placement)
 *   lastMove:    object | null   move that produced current state (null for setup steps)
 *   createdAt:   Timestamp
 *   updatedAt:   Timestamp
 */

'use strict';

const _FIREBASE_CONFIG = {
  apiKey:            'AIzaSyA_zWfQPC6Ij2y-9Z0ZmfNKKFWr1RQ33p0',
  authDomain:        'dukeonline-71c49.firebaseapp.com',
  projectId:         'dukeonline-71c49',
  storageBucket:     'dukeonline-71c49.firebasestorage.app',
  messagingSenderId: '987154767276',
  appId:             '1:987154767276:web:5a892bce1e301ac9ce6e09',
};

// Code alphabet: 23 uppercase letters, ambiguous chars removed (I, L, O)
const _CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ';

let _db  = null;
let _uid = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

/**
 * Initialise Firebase and sign in anonymously.
 * Safe to call multiple times — resolves immediately after the first call.
 */
async function initFirebase() {
  if (_uid) return;
  firebase.initializeApp(_FIREBASE_CONFIG);
  const cred = await firebase.auth().signInAnonymously();
  _uid = cred.user.uid;
  _db  = firebase.firestore();
}

/** Returns the current anonymous user uid, or null if not yet initialised. */
function getUid() { return _uid; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _genCode() {
  let s = '';
  for (let i = 0; i < 6; i++) s += _CODE_CHARS[Math.floor(Math.random() * _CODE_CHARS.length)];
  return s;
}

function _gamesRef() { return _db.collection('games'); }

// ─── Game CRUD ────────────────────────────────────────────────────────────────

/**
 * Create a new game document and return its code.
 * Retries until a code that isn't already in use is found.
 *
 * @param {number} seed          PRNG seed (from createGame() in game.js)
 * @param {number} firstPlayer   0 or 1 (from state.firstPlayer after createGame())
 * @returns {Promise<{ code: string }>}
 */
async function createOnlineGame(seed, firstPlayer) {
  if (!_db) throw new Error('initFirebase() not called');

  let code, ref, snap;
  do {
    code = _genCode();
    ref  = _gamesRef().doc(code);
    snap = await ref.get();
  } while (snap.exists);

  await ref.set({
    status:     'waiting',
    player0uid: _uid,
    player1uid: null,
    seed,
    firstPlayer,
    state:      null,
    lastMove:   null,
    createdAt:  firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt:  firebase.firestore.FieldValue.serverTimestamp(),
  });

  return { code };
}

/**
 * Join an existing game as player 1.
 * @param   {string} code  6-letter game code (case-insensitive)
 * @returns {Promise<{ seed: number, firstPlayer: number }|null>}
 *          null if the game is not found, already full, or not waiting.
 */
async function joinOnlineGame(code) {
  if (!_db) throw new Error('initFirebase() not called');

  const ref  = _gamesRef().doc(code.toUpperCase().trim());
  const snap = await ref.get();
  if (!snap.exists)              return null;

  const d = snap.data();
  if (d.status !== 'waiting')    return null;
  if (d.player1uid !== null)     return null;

  await ref.update({
    player1uid: _uid,
    status:     'active',
    updatedAt:  firebase.firestore.FieldValue.serverTimestamp(),
  });

  return { seed: d.seed, firstPlayer: d.firstPlayer };
}

/**
 * Subscribe to realtime updates for a game.
 * callback(data) fires immediately with the current doc and on every change.
 * @returns {function} unsubscribe — call to stop listening.
 */
// ─── State serialisation ──────────────────────────────────────────────────────
//
// Firestore does not support nested arrays.  GameState has two:
//   board  — Array[6][6]         → stored as a flat 36-element array
//   bags   — [string[], string[]] → stored as { p0: [...], p1: [...] }

function _serializeState(state) {
  return {
    ...state,
    board: state.board.flat(),                      // 2-D → 1-D (36 cells)
    bags:  { p0: state.bags[0], p1: state.bags[1] }, // array-of-arrays → object
  };
}

function _deserializeState(data) {
  const flat = data.board;
  return {
    ...data,
    board: Array.from({ length: 6 }, (_, r) => flat.slice(r * 6, r * 6 + 6)),
    bags:  [data.bags.p0, data.bags.p1],
  };
}

// ─── Realtime listener ────────────────────────────────────────────────────────

/**
 * Subscribe to realtime updates for a game.
 * Deserialises state before handing data to the callback.
 * callback(data) fires immediately with the current doc and on every change.
 * @returns {function} unsubscribe — call to stop listening.
 */
function listenToGame(code, callback) {
  if (!_db) throw new Error('initFirebase() not called');
  return _gamesRef().doc(code).onSnapshot(snap => {
    if (!snap.exists) return;
    const data = snap.data();
    if (data.state) data.state = _deserializeState(data.state);
    callback(data);
  });
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Write the current game state to Firestore after a move or setup placement.
 * Serialises nested arrays before writing.
 * @param {string}      code   Game code
 * @param {object}      state  Current GameState (post-move)
 * @param {object|null} move   The move that produced this state, or null for
 *                             setup-phase placements (which don't animate).
 */
async function writeGameState(code, state, move) {
  if (!_db) throw new Error('initFirebase() not called');
  await _gamesRef().doc(code).update({
    state:     _serializeState(state),
    lastMove:  move ?? null,
    status:    state.phase === 'gameover' ? 'gameover' : 'active',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}
