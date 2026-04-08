/**
 * tileRenderer.js
 * Procedural Canvas rendering for The Duke tile pieces.
 *
 * Mirrors the physical tile layout:
 *
 *  ┌──────────────────────────┬────────┐
 *  │                          │        │
 *  │      5 × 5 move grid     │ illus- │
 *  │                          │ tration│
 *  │  [Tile Name]             │        │
 *  └──────────────────────────┴────────┘
 *         ≈ 77.5% of width       ≈22.5%
 *
 * Depends on: tiles.js (TILES must be in scope)
 *
 * Public API:
 *   drawTile(ctx, x, y, size, type, side, player)
 *
 *   ctx    — CanvasRenderingContext2D
 *   x, y   — top-left corner of the tile in canvas coordinates
 *   size   — tile side length in pixels (tile is always square)
 *   type   — tile key matching TILES, e.g. 'knight'
 *   side   — 0 = starting/pawn side, 1 = flip side
 *   player — 0 = white/cream (player 1), 1 = warm brown (player 2)
 */

'use strict';

// ─── Color themes ─────────────────────────────────────────────────────────────

const TILE_COLORS = {
  0: { bg: '#f4ede0', line: '#1a1208' },   // player 1 — cream / off-white
  1: { bg: '#b5a088', line: '#1a1208' },   // player 2 — warm brown
};

// ─── Display names ────────────────────────────────────────────────────────────

const TILE_DISPLAY_NAMES = {
  duke:       'Duke',
  footman:    'Footman',
  assassin:   'Assassin',
  bowman:     'Bowman',
  champion:   'Champion',
  dragoon:    'Dragoon',
  general:    'General',
  knight:     'Knight',
  longbowman: 'Longbowman',
  marshall:   'Marshall',
  pikeman:    'Pikeman',
  priest:     'Priest',
  ranger:     'Ranger',
  seer:       'Seer',
  wizard:     'Wizard',
  duchess:    'Duchess',
  oracle:     'Oracle',
};

// ─── Layout proportions (relative to tile size) ───────────────────────────────

const LP = {
  leftFrac: 0.775,   // left zone as fraction of total width
  gridPad:  0.025,   // margin from tile edge to grid edge
  border:   0.018,   // outer border line weight
  sep:      0.024,   // vertical separator line weight
};

// ─── Main API ─────────────────────────────────────────────────────────────────

/**
 * Draw a complete tile onto ctx at (x, y) with side length size.
 */
function drawTile(ctx, x, y, size, type, side, player) {
  const C = TILE_COLORS[player] ?? TILE_COLORS[0];
  const L = _layout(size);

  _drawBackground(ctx, x, y, size, L, C);
  _drawSeparator(ctx, x, y, size, L, C);
  _drawGrid(ctx, x + L.gridX, y + L.gridY, L, C);
  _drawIcons(ctx, x + L.gridX, y + L.gridY, L, type, side, C);
  _drawName(ctx, x + L.nameX, y + L.nameY, L.nameW, L.nameH, type, C);
  _drawIllustration(ctx, x + L.illX, y, L.illW, size, type, C);
}

// ─── Layout computation ───────────────────────────────────────────────────────

function _layout(size) {
  const borderW = Math.max(1,   size * LP.border);
  const sepW    = Math.max(1.5, size * LP.sep);
  const leftW   = size * LP.leftFrac;
  const illW    = size - leftW;

  const pad      = size * LP.gridPad;
  const cellSize = (leftW - 2 * pad) / 5;
  const gridH    = cellSize * 5;

  const gridX  = pad;
  const gridY  = pad;
  const nameX  = pad;
  const nameY  = gridY + gridH + pad * 0.4;
  const nameW  = leftW - 2 * pad;
  const nameH  = size - nameY - pad * 0.5;

  const sepX = leftW;
  const illX = leftW + sepW * 0.5;

  return { borderW, sepW, leftW, illW, pad, cellSize, gridX, gridY,
           gridH, nameX, nameY, nameW, nameH, sepX, illX };
}

// ─── Background and borders ───────────────────────────────────────────────────

function _drawBackground(ctx, x, y, size, L, C) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(x, y, size, size);

  ctx.strokeStyle = C.line;
  ctx.lineWidth = L.borderW;
  ctx.strokeRect(
    x + L.borderW / 2,
    y + L.borderW / 2,
    size - L.borderW,
    size - L.borderW
  );
}

function _drawSeparator(ctx, x, y, size, L, C) {
  ctx.strokeStyle = C.line;
  ctx.lineWidth = L.sepW;
  ctx.beginPath();
  ctx.moveTo(x + L.sepX, y);
  ctx.lineTo(x + L.sepX, y + size);
  ctx.stroke();
}

// ─── Movement grid ────────────────────────────────────────────────────────────

function _drawGrid(ctx, gx, gy, L, C) {
  const { cellSize } = L;
  const span = cellSize * 5;
  const lw   = Math.max(0.5, cellSize * 0.055);

  ctx.strokeStyle = C.line;
  ctx.lineWidth   = lw;

  for (let i = 0; i <= 5; i++) {
    // horizontal
    ctx.beginPath();
    ctx.moveTo(gx,        gy + i * cellSize);
    ctx.lineTo(gx + span, gy + i * cellSize);
    ctx.stroke();
    // vertical
    ctx.beginPath();
    ctx.moveTo(gx + i * cellSize, gy);
    ctx.lineTo(gx + i * cellSize, gy + span);
    ctx.stroke();
  }
}

// ─── Icon dispatch ────────────────────────────────────────────────────────────

function _drawIcons(ctx, gx, gy, L, type, side, C) {
  const { cellSize } = L;
  const actions = (typeof TILES !== 'undefined') ? TILES[type]?.sides[side] : null;
  if (!actions) return;

  for (const action of actions) {
    // Derive grid cell from action coordinates.
    // sq/dir is [dc, dr]: dc positive = right, dr positive = forward (up on screen).
    // Grid 0-indexed: col = 2 + dc, row = 2 - dr.
    const [dc, dr] = action.sq ?? action.dir;
    const col = 2 + dc;
    const row = 2 - dr;
    if (col < 0 || col > 4 || row < 0 || row > 4) continue;

    const cx = gx + col * cellSize + cellSize / 2;
    const cy = gy + row * cellSize + cellSize / 2;

    switch (action.type) {
      case 'move':      _iconMove(ctx, cx, cy, cellSize, C);                  break;
      case 'jump':      _iconJump(ctx, cx, cy, cellSize, C);                  break;
      case 'strike':    _iconStrike(ctx, cx, cy, cellSize, C);                break;
      case 'command':   _iconCommand(ctx, cx, cy, cellSize, action.sq, C);   break;
      case 'slide':     _iconArrow(ctx, cx, cy, cellSize, action.dir, true,  C); break;
      case 'jumpSlide': _iconArrow(ctx, cx, cy, cellSize, action.dir, false, C); break;
    }
  }

  // Center pawn — always drawn last so it sits on top
  _iconPawn(ctx,
    gx + 2 * cellSize + cellSize / 2,
    gy + 2 * cellSize + cellSize / 2,
    cellSize, C
  );
}

// ─── Individual icons ─────────────────────────────────────────────────────────

// Filled circle — Move
function _iconMove(ctx, cx, cy, cs, C) {
  ctx.fillStyle = C.line;
  ctx.beginPath();
  ctx.arc(cx, cy, cs * 0.30, 0, Math.PI * 2);
  ctx.fill();
}

// Open circle — Jump
function _iconJump(ctx, cx, cy, cs, C) {
  ctx.strokeStyle = C.line;
  ctx.lineWidth = Math.max(1, cs * 0.09);
  ctx.beginPath();
  ctx.arc(cx, cy, cs * 0.30, 0, Math.PI * 2);
  ctx.stroke();
}

// 6-pointed star outline — Strike
function _iconStrike(ctx, cx, cy, cs, C) {
  const outer = cs * 0.34;
  const inner = outer * 0.48;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = Math.max(1, cs * 0.07);
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 - Math.PI / 2;
    const r = (i % 2 === 0) ? outer : inner;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    (i === 0) ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

// Small filled triangle pointing toward center — Command
function _iconCommand(ctx, cx, cy, cs, sq, C) {
  // sq = [dc, dr] — position of this command square relative to tile center.
  // Screen vector toward grid center: screen-x decreases by dc, screen-y increases by dr
  // (because dr positive = forward = up = decreasing screen-y, so toward-center y = +dr).
  const angle = Math.atan2(dr_screen(sq[1]), -sq[0]);
  const r = cs * 0.24;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = C.line;
  ctx.beginPath();
  ctx.moveTo(r,  0);
  ctx.lineTo(-r, -r * 0.62);
  ctx.lineTo(-r,  r * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Convert tile dr to screen dy (positive dr = up = negative screen dy, so toward-center = +dr)
function dr_screen(dr) { return dr; }

// Filled arrowhead (slide) or open arrowhead (jumpSlide) pointing in dir
function _iconArrow(ctx, cx, cy, cs, dir, filled, C) {
  // dir = [dc, dr].  In screen coords, right is +x, down is +y.
  // Forward (dr=+1) maps to screen up (dy=-1), so angle = atan2(-dir[1], dir[0]).
  const angle = Math.atan2(-dir[1], dir[0]);
  const r = cs * 0.30;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Chevron-style arrowhead: pointy tip at +r, two wings at -r, slight notch at tail
  ctx.beginPath();
  ctx.moveTo( r,      0);
  ctx.lineTo(-r * 0.6, -r * 0.72);
  ctx.lineTo(-r * 0.15, 0);
  ctx.lineTo(-r * 0.6,  r * 0.72);
  ctx.closePath();

  if (filled) {
    ctx.fillStyle = C.line;
    ctx.fill();
  } else {
    ctx.strokeStyle = C.line;
    ctx.lineWidth = Math.max(1, cs * 0.09);
    ctx.stroke();
  }

  ctx.restore();
}

// Chess pawn silhouette — marks the tile's own square at grid center
function _iconPawn(ctx, cx, cy, cs, C) {
  ctx.fillStyle = C.line;
  const s = cs * 0.44;

  // Head
  const headR = s * 0.27;
  const headCY = cy - s * 0.30;
  ctx.beginPath();
  ctx.arc(cx, headCY, headR, 0, Math.PI * 2);
  ctx.fill();

  // Body — trapezoid, narrower at top
  const bodyTopY = headCY + headR * 0.85;
  const bodyBotY = cy + s * 0.40;
  const topHW    = headR * 0.75;
  const botHW    = headR * 1.65;
  ctx.beginPath();
  ctx.moveTo(cx - topHW, bodyTopY);
  ctx.lineTo(cx + topHW, bodyTopY);
  ctx.lineTo(cx + botHW, bodyBotY);
  ctx.lineTo(cx - botHW, bodyBotY);
  ctx.closePath();
  ctx.fill();

  // Base — wider flat rectangle
  const baseHW = headR * 2.05;
  const baseH  = cs * 0.09;
  ctx.fillRect(cx - baseHW, bodyBotY, baseHW * 2, baseH);
}

// ─── Tile name ────────────────────────────────────────────────────────────────

function _drawName(ctx, nx, ny, nw, nh, type, C) {
  const name = TILE_DISPLAY_NAMES[type] ?? type;
  if (!name) return;

  const first = name[0];
  const rest  = name.slice(1).toUpperCase();

  const capSz  = nh * 0.75;
  const restSz = nh * 0.48;
  const serif  = "Georgia, 'Times New Roman', serif";

  ctx.fillStyle   = C.line;
  ctx.textBaseline = 'bottom';
  const baseY = ny + nh;

  // Measure
  ctx.font = `bold italic ${capSz}px ${serif}`;
  const capW = ctx.measureText(first).width;

  ctx.font = `bold ${restSz}px ${serif}`;
  const restW = ctx.measureText(rest).width;

  // Center within name zone, with a small gap between first letter and rest
  const gap    = nw * 0.015;
  const totalW = capW + gap + restW;
  const startX = nx + Math.max(0, (nw - totalW) / 2);

  // Draw drop-cap first letter
  ctx.font = `bold italic ${capSz}px ${serif}`;
  ctx.fillText(first, startX, baseY);

  // Draw remainder — allow squishing if it overflows
  ctx.font = `bold ${restSz}px ${serif}`;
  ctx.fillText(rest, startX + capW + gap, baseY, nw - capW - gap);
}

// ─── Right-zone illustrations ─────────────────────────────────────────────────
//
// Each illustration is drawn in a rectangle of width illW × size,
// with the left edge at x=illX within the tile.
// All drawing is in the line color on the tile background.

function _drawIllustration(ctx, ix, iy, iw, ih, type, C) {
  const cx  = ix + iw / 2;
  const mg  = ih * 0.055;           // top/bottom margin
  const top = iy + mg;
  const bot = iy + ih - mg;
  const w   = iw * 0.78;            // constrained width within zone

  ctx.fillStyle   = C.line;
  ctx.strokeStyle = C.line;

  switch (type) {
    case 'duke':       _illSword(ctx, cx, top, bot, w, C);       break;
    case 'footman':    _illShield(ctx, cx, top, bot, w, C);      break;
    case 'assassin':   _illDagger(ctx, cx, top, bot, w, C);      break;
    case 'bowman':     _illBow(ctx, cx, top, bot, w, C);         break;
    case 'champion':   _illHeaterShield(ctx, cx, top, bot, w, C); break;
    case 'dragoon':    _illLance(ctx, cx, top, bot, w, C);       break;
    case 'general':    _illFlag(ctx, cx, top, bot, w, C);        break;
    case 'knight':     _illArrowUp(ctx, cx, top, bot, w, C);     break;
    case 'longbowman': _illBow(ctx, cx, top, bot, w * 0.85, C);  break;
    case 'marshall':   _illHammer(ctx, cx, top, bot, w, C);      break;
    case 'pikeman':    _illPole(ctx, cx, top, bot, w, C);        break;
    case 'priest':     _illCross(ctx, cx, top, bot, w, C);       break;
    case 'ranger':     _illArrowUp(ctx, cx, top, bot, w * 0.72, C); break;
    case 'seer':       _illOrbStaff(ctx, cx, top, bot, w, C);   break;
    case 'wizard':     _illWand(ctx, cx, top, bot, w, C);        break;
    case 'duchess':    _illCrown(ctx, cx, top, bot, w, C);       break;
    case 'oracle':     _illCrescent(ctx, cx, top, bot, w, C);    break;
    default:           _illPole(ctx, cx, top, bot, w, C);        break;
  }
}

// Sword with crossguard (Duke)
function _illSword(ctx, cx, top, bot, w, C) {
  const h       = bot - top;
  const bladeW  = w * 0.20;
  const guardW  = w;
  const guardH  = h * 0.07;
  const guardY  = top + h * 0.22;

  // Blade — tapers to a point at top
  ctx.beginPath();
  ctx.moveTo(cx,              top);
  ctx.lineTo(cx + bladeW / 2, guardY);
  ctx.lineTo(cx + bladeW / 2, bot);
  ctx.lineTo(cx - bladeW / 2, bot);
  ctx.lineTo(cx - bladeW / 2, guardY);
  ctx.closePath();
  ctx.fill();

  // Crossguard
  ctx.fillRect(cx - guardW / 2, guardY - guardH / 2, guardW, guardH);
}

// Round shield with central boss (Footman)
function _illShield(ctx, cx, top, bot, w, C) {
  const h  = bot - top;
  const r  = Math.min(w * 0.52, h * 0.40);
  const sy = top + h * 0.42;

  ctx.beginPath();
  ctx.arc(cx, sy, r, 0, Math.PI * 2);
  ctx.fill();

  // Boss cutout
  ctx.fillStyle = C.bg;
  ctx.beginPath();
  ctx.arc(cx, sy, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.line;
}

// Dagger with pommel (Assassin)
function _illDagger(ctx, cx, top, bot, w, C) {
  const h       = bot - top;
  const bladeW  = w * 0.19;
  const guardW  = w * 0.84;
  const guardH  = h * 0.055;
  const guardY  = top + h * 0.32;
  const handleW = w * 0.26;
  const handleH = (bot - guardY - guardH) * 0.68;

  // Blade
  ctx.beginPath();
  ctx.moveTo(cx,               top);
  ctx.lineTo(cx + bladeW / 2,  guardY);
  ctx.lineTo(cx - bladeW / 2,  guardY);
  ctx.closePath();
  ctx.fill();

  // Guard
  ctx.fillRect(cx - guardW / 2, guardY, guardW, guardH);

  // Handle
  ctx.fillRect(cx - handleW / 2, guardY + guardH, handleW, handleH);

  // Pommel
  const pomR = handleW * 0.90;
  ctx.beginPath();
  ctx.arc(cx, guardY + guardH + handleH + pomR * 0.8, pomR, 0, Math.PI * 2);
  ctx.fill();
}

// Bow — C-curve with string (Bowman / Longbowman)
function _illBow(ctx, cx, top, bot, w, C) {
  const h   = bot - top;
  const lw  = Math.max(2, w * 0.20);
  const bR  = h * 0.46;  // bow radius
  const bCX = cx + w * 0.22;  // center of the arc circle

  ctx.lineWidth = lw;
  ctx.lineCap   = 'round';
  ctx.strokeStyle = C.line;

  // Bow arc (opening to the right, so arc faces left into the zone)
  const a1 = Math.PI * 0.55;
  const a2 = Math.PI * 1.45;
  ctx.beginPath();
  ctx.arc(bCX, top + h / 2, bR, a1, a2);
  ctx.stroke();

  // Bowstring — connects the two tips
  const tx1 = bCX + bR * Math.cos(a1);
  const ty1 = top + h / 2 + bR * Math.sin(a1);
  const tx2 = bCX + bR * Math.cos(a2);
  const ty2 = top + h / 2 + bR * Math.sin(a2);
  ctx.lineWidth = Math.max(1, lw * 0.38);
  ctx.beginPath();
  ctx.moveTo(tx1, ty1);
  ctx.lineTo(tx2, ty2);
  ctx.stroke();

  ctx.lineCap = 'butt';
}

// Heater shield — flat top, curved to point at bottom (Champion)
function _illHeaterShield(ctx, cx, top, bot, w, C) {
  const h = bot - top;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, top);
  ctx.lineTo(cx + w / 2, top);
  ctx.lineTo(cx + w / 2, top + h * 0.52);
  ctx.quadraticCurveTo(cx + w / 2, top + h * 0.84, cx, bot);
  ctx.quadraticCurveTo(cx - w / 2, top + h * 0.84, cx - w / 2, top + h * 0.52);
  ctx.closePath();
  ctx.fill();
}

// Cavalry lance — vertical with spear tip (Dragoon)
function _illLance(ctx, cx, top, bot, w, C) {
  const h      = bot - top;
  const shaftW = w * 0.20;
  const tipH   = h * 0.14;
  const tipW   = w * 0.60;

  // Shaft
  ctx.fillRect(cx - shaftW / 2, top + tipH, shaftW, h - tipH);

  // Diamond spear tip
  ctx.beginPath();
  ctx.moveTo(cx,             top);
  ctx.lineTo(cx + tipW / 2,  top + tipH * 0.6);
  ctx.lineTo(cx,             top + tipH * 1.1);
  ctx.lineTo(cx - tipW / 2,  top + tipH * 0.6);
  ctx.closePath();
  ctx.fill();
}

// Flag on vertical staff (General)
function _illFlag(ctx, cx, top, bot, w, C) {
  const h      = bot - top;
  const staffX = cx - w * 0.18;
  const staffW = w * 0.14;
  const flagH  = h * 0.34;

  // Staff
  ctx.fillRect(staffX - staffW / 2, top, staffW, h);

  // Pennant triangle
  ctx.beginPath();
  ctx.moveTo(staffX + staffW / 2, top + h * 0.04);
  ctx.lineTo(staffX + staffW / 2 + w * 0.72, top + h * 0.04 + flagH * 0.5);
  ctx.lineTo(staffX + staffW / 2, top + h * 0.04 + flagH);
  ctx.closePath();
  ctx.fill();
}

// Large solid upward arrow — all-in-one arrowhead + shaft (Knight / Ranger)
function _illArrowUp(ctx, cx, top, bot, w, C) {
  const h      = bot - top;
  const headH  = h * 0.42;
  const shaftW = w * 0.30;

  ctx.beginPath();
  ctx.moveTo(cx,           top);             // tip
  ctx.lineTo(cx + w / 2,   top + headH);    // right wing
  ctx.lineTo(cx + shaftW / 2, top + headH);
  ctx.lineTo(cx + shaftW / 2, bot);
  ctx.lineTo(cx - shaftW / 2, bot);
  ctx.lineTo(cx - shaftW / 2, top + headH);
  ctx.lineTo(cx - w / 2,   top + headH);    // left wing
  ctx.closePath();
  ctx.fill();
}

// War hammer — T-shape (Marshall)
function _illHammer(ctx, cx, top, bot, w, C) {
  const h       = bot - top;
  const shaftW  = w * 0.18;
  const headH   = h * 0.24;
  const headY   = top + h * 0.18;

  // Shaft
  ctx.fillRect(cx - shaftW / 2, headY + headH * 0.5, shaftW, bot - headY - headH * 0.5);

  // Hammer head
  ctx.fillRect(cx - w / 2, headY, w, headH);
}

// Simple pole with spear tip (Pikeman)
function _illPole(ctx, cx, top, bot, w, C) {
  const h      = bot - top;
  const shaftW = w * 0.18;
  const tipH   = h * 0.09;
  const tipW   = w * 0.48;

  // Shaft
  ctx.fillRect(cx - shaftW / 2, top + tipH, shaftW, h - tipH);

  // Pointed tip
  ctx.beginPath();
  ctx.moveTo(cx,            top);
  ctx.lineTo(cx + tipW / 2, top + tipH);
  ctx.lineTo(cx - tipW / 2, top + tipH);
  ctx.closePath();
  ctx.fill();
}

// Latin cross (Priest)
function _illCross(ctx, cx, top, bot, w, C) {
  const h  = bot - top;
  const vW = w * 0.28;   // vertical bar width
  const hH = h * 0.20;   // horizontal bar height
  const hY = top + h * 0.28;  // horizontal bar top

  ctx.fillRect(cx - vW / 2, top, vW, h);          // vertical
  ctx.fillRect(cx - w / 2,  hY,  w,  hH);         // horizontal
}

// Crystal-ball orb on staff (Seer)
function _illOrbStaff(ctx, cx, top, bot, w, C) {
  const h      = bot - top;
  const orbR   = w * 0.47;
  const orbCY  = top + orbR + h * 0.04;
  const shaftW = w * 0.16;

  // Orb ring
  ctx.beginPath();
  ctx.arc(cx, orbCY, orbR, 0, Math.PI * 2);
  ctx.fill();

  // Cutout — gives open-ring look
  ctx.fillStyle = C.bg;
  ctx.beginPath();
  ctx.arc(cx, orbCY, orbR * 0.50, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.line;

  // Staff below orb
  const staffTop = orbCY + orbR;
  ctx.fillRect(cx - shaftW / 2, staffTop, shaftW, bot - staffTop);
}

// Wand with 5-pointed star at top (Wizard)
function _illWand(ctx, cx, top, bot, w, C) {
  const h       = bot - top;
  const starR   = w * 0.50;
  const starCY  = top + starR + h * 0.02;
  const wandW   = w * 0.16;

  // 5-pointed star
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a  = (i * Math.PI) / 5 - Math.PI / 2;
    const r  = (i % 2 === 0) ? starR : starR * 0.40;
    const px = cx + Math.cos(a) * r;
    const py = starCY + Math.sin(a) * r;
    (i === 0) ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Wand shaft below star
  const wTop = starCY + starR * 0.25;
  ctx.fillRect(cx - wandW / 2, wTop, wandW, bot - wTop);
}

// Crown with three peaks (Duchess)
function _illCrown(ctx, cx, top, bot, w, C) {
  const h       = bot - top;
  const cBot    = top + h * 0.68;
  const cTop    = top + h * 0.18;
  const peakH   = (cBot - cTop) * 0.55;

  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cBot);
  ctx.lineTo(cx - w / 2, cTop + peakH);
  ctx.lineTo(cx - w / 4, cTop);              // left peak
  ctx.lineTo(cx - w / 10, cTop + peakH * 0.5);
  ctx.lineTo(cx,           cTop - peakH * 0.12); // center peak (taller)
  ctx.lineTo(cx + w / 10, cTop + peakH * 0.5);
  ctx.lineTo(cx + w / 4, cTop);              // right peak
  ctx.lineTo(cx + w / 2, cTop + peakH);
  ctx.lineTo(cx + w / 2, cBot);
  ctx.closePath();
  ctx.fill();
}

// Crescent moon (Oracle)
function _illCrescent(ctx, cx, top, bot, w, C) {
  const h  = bot - top;
  const r  = Math.min(w * 0.52, h * 0.38);
  const cy = top + h * 0.40;

  // Outer circle
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Offset inner cutout to create crescent
  ctx.fillStyle = C.bg;
  ctx.beginPath();
  ctx.arc(cx + r * 0.36, cy - r * 0.10, r * 0.76, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.line;
}
