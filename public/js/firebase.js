/**
 * firebase.js
 * Firebase initialisation and Firestore helpers for DukeOnline multiplayer.
 *
 * Depends on: Firebase compat SDK v10+ (app, firestore) loaded via CDN
 * before this file.  Firebase Auth is NOT used — identity is established
 * via username + PIN hash (see lookupOrCreateUser).
 *
 * ─── Public API ───────────────────────────────────────────────────────────────
 *
 *   initFirebase()                                            → Promise<void>
 *
 *   lookupOrCreateUser(username, userId)
 *     → Promise<{ ok, created?, displayName?, error? }>
 *     Checks Firestore for username.  Creates account if new; verifies PIN
 *     hash if existing.  error: 'incorrect_pin' on mismatch.
 *
 *   getUserGames(username)                                    → Promise<Array>
 *     Returns the stored game list for the user, newest-first.
 *
 *   addGameToUser(username, userId, game)                     → Promise<void>
 *     Adds/updates { code, player, seed } in the user's game list.
 *     userId must be echoed to satisfy the Firestore update rule.
 *
 *   createOnlineGame(seed, firstPlayer, playerName, userId)   → Promise<{ code }>
 *   joinOnlineGame(code, playerName, userId)                  → Promise<{ seed, firstPlayer }|null>
 *   listenToGame(code, callback)                              → unsubscribe()
 *   writeGameState(code, state, move)                         → Promise<void>
 *
 * ─── Firestore collections ────────────────────────────────────────────────────
 *
 *   games/{code}
 *     status:      'waiting' | 'active' | 'gameover'
 *     player0uid:  string   SHA-256 hash of player 0's username+PIN
 *     player0name: string
 *     player1uid:  string | null
 *     player1name: string
 *     seed:        number
 *     firstPlayer: 0 | 1
 *     state:       object | null
 *     lastMove:    object | null
 *     createdAt:   Timestamp
 *     updatedAt:   Timestamp
 *
 *   users/{username_lowercase}
 *     userId:      string   SHA-256 hash (the identity key)
 *     displayName: string   original-casing username
 *     games:       Array<{ code, player, seed }>   newest-first, capped at 50
 *     createdAt:   Timestamp
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

let _db          = null;
let _initPromise = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

/**
 * Initialise Firebase and Firestore.
 * Safe to call multiple times — resolves immediately on subsequent calls.
 * No Firebase Auth required; identity is established via username+PIN hash.
 */
async function initFirebase() {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    firebase.initializeApp(_FIREBASE_CONFIG);
    _db = firebase.firestore();
  })();
  return _initPromise;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _genCode() {
  let s = '';
  for (let i = 0; i < 6; i++) s += _CODE_CHARS[Math.floor(Math.random() * _CODE_CHARS.length)];
  return s;
}

function _gamesRef() { return _db.collection('games'); }
function _usersRef() { return _db.collection('users'); }

// ─── User identity ────────────────────────────────────────────────────────────

/**
 * Look up an existing user or create a new one.
 *
 * First-come-first-served username claim: the first player to register a
 * given username (case-insensitive) owns it.  Subsequent logins with the
 * same username must provide a matching userId (hash) to gain access.
 *
 * @param {string} username   Display name as entered (casing preserved)
 * @param {string} userId     SHA-256(username.lower + ':' + pin + ':' + salt)
 * @returns {Promise<{ ok: boolean, created?: boolean, displayName?: string, error?: string }>}
 */
async function lookupOrCreateUser(username, userId) {
  if (!_db) throw new Error('initFirebase() not called');

  const key  = username.toLowerCase();
  const ref  = _usersRef().doc(key);
  const snap = await ref.get();

  if (!snap.exists) {
    // New username — claim it.
    await ref.set({
      userId,
      displayName: username,
      games:       [],
      createdAt:   firebase.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true, created: true, displayName: username };
  }

  const data = snap.data();
  if (data.userId !== userId) return { ok: false, error: 'incorrect_pin' };
  return { ok: true, created: false, displayName: data.displayName };
}

/**
 * Return the stored game list for a user (newest-first).
 * Returns [] if the user document doesn't exist or has no games yet.
 */
async function getUserGames(username) {
  if (!_db) throw new Error('initFirebase() not called');
  const snap = await _usersRef().doc(username.toLowerCase()).get();
  if (!snap.exists) return [];
  return snap.data().games || [];
}

/**
 * Add (or update) a game entry in the user's Firestore game list.
 * Deduplicates by code; keeps newest-first; caps at 50 entries.
 * userId must be included in the update to satisfy the Firestore security rule.
 *
 * @param {string} username
 * @param {string} userId
 * @param {{ code: string, player: number, seed: number }} game
 */
async function addGameToUser(username, userId, game) {
  if (!_db) throw new Error('initFirebase() not called');

  const ref  = _usersRef().doc(username.toLowerCase());
  const snap = await ref.get();
  if (!snap.exists) return;

  const games    = snap.data().games || [];
  const filtered = games.filter(g => g.code !== game.code);
  filtered.unshift(game);   // newest first

  await ref.update({
    userId,                          // echoed to satisfy Firestore update rule
    games: filtered.slice(0, 50),
  });
}

// ─── Game CRUD ────────────────────────────────────────────────────────────────

/**
 * Create a new game document and return its code.
 * Retries with a new code if a collision is found.
 *
 * @param {number} seed
 * @param {number} firstPlayer   0 or 1
 * @param {string} playerName    Display name shown to opponent
 * @param {string} userId        Hash identity of player 0
 * @returns {Promise<{ code: string }>}
 */
async function createOnlineGame(seed, firstPlayer, playerName, userId) {
  if (!_db) throw new Error('initFirebase() not called');

  let code, ref, snap;
  do {
    code = _genCode();
    ref  = _gamesRef().doc(code);
    snap = await ref.get();
  } while (snap.exists);

  await ref.set({
    status:      'waiting',
    player0uid:  userId || '',
    player0name: playerName || '',
    player1uid:  null,
    player1name: '',
    seed,
    firstPlayer,
    state:       null,
    lastMove:    null,
    createdAt:   firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt:   firebase.firestore.FieldValue.serverTimestamp(),
  });

  return { code };
}

/**
 * Join an existing game as player 1.
 * @param   {string} code
 * @param   {string} playerName
 * @param   {string} userId     Hash identity of player 1
 * @returns {Promise<{ seed: number, firstPlayer: number }|null>}
 *          null if the game is not found, already full, or not in 'waiting' status.
 */
async function joinOnlineGame(code, playerName, userId) {
  if (!_db) throw new Error('initFirebase() not called');

  const ref  = _gamesRef().doc(code.toUpperCase().trim());
  const snap = await ref.get();
  if (!snap.exists)           return null;

  const d = snap.data();
  if (d.status !== 'waiting') return null;
  if (d.player1uid !== null)  return null;

  await ref.update({
    player1uid:  userId || '',
    player1name: playerName || '',
    status:      'active',
    updatedAt:   firebase.firestore.FieldValue.serverTimestamp(),
  });

  return { seed: d.seed, firstPlayer: d.firstPlayer };
}

// ─── State serialisation ──────────────────────────────────────────────────────
//
// Firestore does not support nested arrays.  GameState has two:
//   board  — Array[6][6]          → stored as a flat 36-element array
//   bags   — [string[], string[]] → stored as { p0: [...], p1: [...] }

function _serializeState(state) {
  return {
    ...state,
    board: state.board.flat(),
    bags:  { p0: state.bags[0], p1: state.bags[1] },
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
 * @param {string}      code
 * @param {object}      state   Current GameState (post-move)
 * @param {object|null} move    Move that produced this state; null for setup steps
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
