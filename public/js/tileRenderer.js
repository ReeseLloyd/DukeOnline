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
  // Illustration zone starts sepW/2 past the separator centre (illX) and
  // ends sepW/2 before the tile right edge — symmetric padding on both sides.
  const illW    = size - leftW - sepW * 0.5;

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

  // Tile's own square within the 5×5 display grid.
  // Most tiles sit at [2,2] (center); some (e.g. Longbowman) use a different row.
  const tilePos = (typeof TILES !== 'undefined') ? (TILES[type]?.tileGridPos ?? [2, 2]) : [2, 2];
  const [tileCol, tileRow] = tilePos;

  for (const action of actions) {
    // Derive grid cell from action coordinates.
    // sq/dir is [dc, dr]: dc positive = right, dr positive = forward (up on screen).
    // Grid 0-indexed: col = tileCol + dc, row = tileRow - dr.
    const [dc, dr] = action.sq ?? action.dir;
    const col = tileCol + dc;
    const row = tileRow - dr;
    if (col < 0 || col > 4 || row < 0 || row > 4) continue;

    const cx = gx + col * cellSize + cellSize / 2;
    const cy = gy + row * cellSize + cellSize / 2;

    switch (action.type) {
      case 'move':      _iconMove(ctx, cx, cy, cellSize, C);                      break;
      case 'jump':      _iconJump(ctx, cx, cy, cellSize, C);                      break;
      case 'strike':    _iconStrike(ctx, cx, cy, cellSize, C);                    break;
      case 'command':   _iconCommand(ctx, cx, cy, cellSize, C);                   break;
      case 'slide':     _iconArrow(ctx, cx, cy, cellSize, action.dir, true,  C);  break;
      case 'jumpSlide': _iconArrow(ctx, cx, cy, cellSize, action.dir, false, C);  break;
    }
  }

  // Center pawn — drawn last so it sits on top of any icons in its cell.
  // Filled on side 0 (starting side); hollow/stroked on side 1.
  _iconPawn(ctx,
    gx + tileCol * cellSize + cellSize / 2,
    gy + tileRow * cellSize + cellSize / 2,
    cellSize, side === 0, C
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

// Two right-angle corner triangles — Command marker.
// Fills the top-left and bottom-right corners of the cell, pointing away
// from the cell center. This allows a move or jump icon to occupy the
// cell center simultaneously without visual overlap.
function _iconCommand(ctx, cx, cy, cs, C) {
  const s = cs * 0.34;   // triangle leg length
  const h = cs * 0.50;   // half cell size — distance from center to cell edge

  ctx.fillStyle = C.line;

  // Top-left corner: right-angle at the top-left corner of the cell
  ctx.beginPath();
  ctx.moveTo(cx - h,     cy - h);      // corner vertex
  ctx.lineTo(cx - h + s, cy - h);      // along top edge
  ctx.lineTo(cx - h,     cy - h + s);  // along left edge
  ctx.closePath();
  ctx.fill();

  // Bottom-right corner: right-angle at the bottom-right corner of the cell
  ctx.beginPath();
  ctx.moveTo(cx + h,     cy + h);      // corner vertex
  ctx.lineTo(cx + h - s, cy + h);      // along bottom edge
  ctx.lineTo(cx + h,     cy + h - s);  // along right edge
  ctx.closePath();
  ctx.fill();
}

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

// Chess pawn silhouette — marks the tile's own square at grid center.
// filled=true  (side 0): solid dark silhouette.
// filled=false (side 1): hollow outline only, matching the flip-side convention.
function _iconPawn(ctx, cx, cy, cs, filled, C) {
  const s = cs * 0.44;

  const headR  = s * 0.27;
  const headCY = cy - s * 0.30;

  const bodyTopY = headCY + headR * 0.85;
  const bodyBotY = cy + s * 0.40;
  const topHW    = headR * 0.75;
  const botHW    = headR * 1.65;

  const baseHW = headR * 2.05;
  const baseH  = cs * 0.09;

  if (filled) {
    ctx.fillStyle = C.line;

    ctx.beginPath();
    ctx.arc(cx, headCY, headR, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - topHW, bodyTopY);
    ctx.lineTo(cx + topHW, bodyTopY);
    ctx.lineTo(cx + botHW, bodyBotY);
    ctx.lineTo(cx - botHW, bodyBotY);
    ctx.closePath();
    ctx.fill();

    ctx.fillRect(cx - baseHW, bodyBotY, baseHW * 2, baseH);
  } else {
    const lw = Math.max(0.8, cs * 0.06);
    ctx.strokeStyle = C.line;
    ctx.lineWidth   = lw;

    // Stroke head (inset by lw/2 so the line sits inside the target radius)
    ctx.beginPath();
    ctx.arc(cx, headCY, headR - lw / 2, 0, Math.PI * 2);
    ctx.stroke();

    // Stroke body trapezoid
    ctx.beginPath();
    ctx.moveTo(cx - topHW, bodyTopY);
    ctx.lineTo(cx + topHW, bodyTopY);
    ctx.lineTo(cx + botHW, bodyBotY);
    ctx.lineTo(cx - botHW, bodyBotY);
    ctx.closePath();
    ctx.stroke();

    // Stroke base rectangle
    ctx.strokeRect(cx - baseHW, bodyBotY, baseHW * 2, baseH);
  }
}

// ─── Tile name ────────────────────────────────────────────────────────────────

function _drawName(ctx, nx, ny, nw, nh, type, C) {
  const name = TILE_DISPLAY_NAMES[type] ?? type;
  if (!name) return;

  // MedievalSharp is Regular weight — bold/italic modifiers have no effect.
  // Fall back through Georgia for pre-load frames or missing font.
  const font = "'MedievalSharp', Georgia, 'Times New Roman', serif";
  const sz   = nh * 0.72;

  ctx.fillStyle    = C.line;
  ctx.textBaseline = 'middle';
  ctx.textAlign    = 'center';
  ctx.font         = `${sz}px ${font}`;

  const measured = ctx.measureText(name).width;
  const cx = nx + nw / 2;
  const cy = ny + nh / 2;

  if (measured > nw * 0.96) {
    // Squish horizontally to fit the name zone — preserves vertical scale
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale((nw * 0.96) / measured, 1);
    ctx.fillText(name, 0, 0);
    ctx.restore();
  } else {
    ctx.fillText(name, cx, cy);
  }

  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ─── Right-zone illustrations ─────────────────────────────────────────────────
//
// Each _ill* function draws in a [0,1]×[0,1] normalized unit square.
// _drawIllustration applies ctx.scale(iw, ih) so the unit square maps to the
// exact pixel zone with independent x/y scaling (non-uniform).  This guarantees
// every illustration fills its zone without overflow, regardless of tile size.
//
// Because the illustration zone is portrait (iw ≪ ih), shapes naturally stretch
// tall — which matches physical tile art.  Strokes look wrong under non-uniform
// scale, so all illustration drawing uses fills only; the bow is a filled
// annular arc rather than a stroked arc.

// Shared normalized constants
const _ILL_MG = 0.055;   // top/bottom margin (fraction of zone height)
const _ILL_W  = 0.82;    // usable width fraction (small side gutters)

function _drawIllustration(ctx, ix, iy, iw, ih, type, C) {
  ctx.save();

  // Clip to illustration zone so any rounding can't bleed into the grid area
  ctx.beginPath();
  ctx.rect(ix, iy, iw, ih);
  ctx.clip();

  // Map normalized [0,1]×[0,1] → pixel zone with independent x/y scaling
  ctx.translate(ix, iy);
  ctx.scale(iw, ih);

  ctx.fillStyle   = C.line;
  ctx.strokeStyle = C.line;

  switch (type) {
    case 'duke':       _illSword(ctx, C);         break;
    case 'footman':    _illShield(ctx, C);        break;
    case 'assassin':   _illDagger(ctx, C);        break;
    case 'bowman':
    case 'longbowman': _illBow(ctx, C);           break;
    case 'champion':   _illHeaterShield(ctx, C);  break;
    case 'dragoon':    _illLance(ctx, C);         break;
    case 'general':    _illFlag(ctx, C);          break;
    case 'knight':
    case 'ranger':     _illArrowUp(ctx, C);       break;
    case 'marshall':   _illHammer(ctx, C);        break;
    case 'pikeman':    _illPole(ctx, C);          break;
    case 'priest':     _illCross(ctx, C);         break;
    case 'seer':       _illOrbStaff(ctx, C);      break;
    case 'wizard':     _illWand(ctx, C);          break;
    case 'duchess':    _illCrown(ctx, C);         break;
    case 'oracle':     _illCrescent(ctx, C);      break;
    default:           _illPole(ctx, C);          break;
  }

  ctx.restore();
}

// ─── Illustration helpers ─────────────────────────────────────────────────────

// Sword with crossguard (Duke)
function _illSword(ctx, C) {
  const cx = 0.5, mg = _ILL_MG, w = _ILL_W;
  const top = mg, bot = 1 - mg, h = bot - top;

  const bladeW = w * 0.20;
  const guardW = w;
  const guardH = h * 0.07;
  const guardY = top + h * 0.22;

  ctx.fillStyle = C.line;
  ctx.beginPath();
  ctx.moveTo(cx,              top);
  ctx.lineTo(cx + bladeW / 2, guardY);
  ctx.lineTo(cx + bladeW / 2, bot);
  ctx.lineTo(cx - bladeW / 2, bot);
  ctx.lineTo(cx - bladeW / 2, guardY);
  ctx.closePath();
  ctx.fill();

  ctx.fillRect(cx - guardW / 2, guardY - guardH / 2, guardW, guardH);
}

// Round shield with central boss (Footman)
function _illShield(ctx, C) {
  const cx = 0.5, mg = _ILL_MG, w = _ILL_W;
  const top = mg, bot = 1 - mg, h = bot - top;

  const r  = Math.min(w * 0.52, h * 0.40);
  const sy = top + h * 0.42;

  ctx.fillStyle = C.line;
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
function _illDagger(ctx, C) {
  const cx = 0.5, mg = _ILL_MG, w = _ILL_W;
  const top = mg, bot = 1 - mg, h = bot - top;

  const bladeW  = w * 0.19;
  const guardW  = w * 0.84;
  const guardH  = h * 0.055;
  const guardY  = top + h * 0.32;
  const handleW = w * 0.26;
  const handleH = (bot - guardY - guardH) * 0.68;
  const pomR    = handleW * 0.90;

  ctx.fillStyle = C.line;

  // Blade
  ctx.beginPath();
  ctx.moveTo(cx,               top);
  ctx.lineTo(cx + bladeW / 2,  guardY);
  ctx.lineTo(cx - bladeW / 2,  guardY);
  ctx.closePath();
  ctx.fill();

  ctx.fillRect(cx - guardW  / 2, guardY,           guardW,  guardH);
  ctx.fillRect(cx - handleW / 2, guardY + guardH,  handleW, handleH);

  ctx.beginPath();
  ctx.arc(cx, guardY + guardH + handleH + pomR * 0.8, pomR, 0, Math.PI * 2);
  ctx.fill();
}

// Bow — filled annular arc stave + thin filled bowstring (Bowman, Longbowman).
// Uses filled shapes throughout to avoid stroke-width distortion under the
// non-uniform ctx.scale transform applied by _drawIllustration.
function _illBow(ctx, C) {
  const mg = _ILL_MG;
  const top = mg, bot = 1 - mg, h = bot - top;
  const cy = top + h / 2;   // vertical centre of the zone

  // Arc center sits right-of-centre so the opening faces the grid zone.
  // Radius spans almost the full normalized height; after ctx.scale(iw, ih)
  // the circle stretches into a tall ellipse — appropriate for a longbow.
  const arcX  = 0.68;
  const R     = h * 0.47;    // outer radius (normalized)
  const thick = R * 0.22;    // stave thickness
  const r     = R - thick;   // inner radius

  // Sweep from ~101° to ~259° (the left semicircle, opening right)
  const a1 = Math.PI * 0.56;   // bottom tip angle (≈ 100.8°)
  const a2 = Math.PI * 1.44;   // top    tip angle (≈ 259.2°)

  // Filled bow stave: outer arc forward, inner arc back
  ctx.fillStyle = C.line;
  ctx.beginPath();
  ctx.arc(arcX, cy, R, a1, a2, false);   // outer arc, clockwise
  ctx.arc(arcX, cy, r, a2, a1, true);    // inner arc, counter-clockwise
  ctx.closePath();
  ctx.fill();

  // Bowstring — both tips share nearly the same x; draw as a thin filled rect
  const tipX    = arcX + R * Math.cos(a1);
  const tipTopY = cy   + R * Math.sin(a2);
  const tipBotY = cy   + R * Math.sin(a1);
  const strW    = thick * 0.28;
  ctx.fillRect(tipX - strW / 2, tipTopY, strW, tipBotY - tipTopY);
}

// Heater shield — flat top, curved to point at bottom (Champion)
function _illHeaterShield(ctx, C) {
  const cx = 0.5, mg = _ILL_MG, w = _ILL_W;
  const top = mg, bot = 1 - mg, h = bot - top;

  ctx.fillStyle = C.line;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, top);
  ctx.lineTo(cx + w / 2, top);
  ctx.lineTo(cx + w / 2, top + h * 0.52);
  ctx.quadraticCurveTo(cx + w / 2, top + h * 0.84, cx, bot);
  ctx.quadraticCurveTo(cx - w / 2, top + h * 0.84, cx - w / 2, top + h * 0.52);
  ctx.closePath();
  ctx.fill();
}

// Cavalry lance — vertical with diamond spear tip (Dragoon)
function _illLance(ctx, C) {
  const cx = 0.5, mg = _ILL_MG, w = _ILL_W;
  const top = mg, bot = 1 - mg, h = bot - top;

  const shaftW = w * 0.20;
  const tipH   = h * 0.14;
  const tipW   = w * 0.60;

  ctx.fillStyle = C.line;
  ctx.fillRect(cx - shaftW / 2, top + tipH, shaftW, h - tipH);

  ctx.beginPath();
  ctx.moveTo(cx,             top);
  ctx.lineTo(cx + tipW / 2,  top + tipH * 0.6);
  ctx.lineTo(cx,             top + tipH * 1.1);
  ctx.lineTo(cx - tipW / 2,  top + tipH * 0.6);
  ctx.closePath();
  ctx.fill();
}

// Flag on vertical staff (General)
function _illFlag(ctx, C) {
  const cx = 0.5, mg = _ILL_MG, w = _ILL_W;
  const top = mg, bot = 1 - mg, h = bot - top;

  const staffX = cx - w * 0.18;
  const staffW = w * 0.14;
  const flagH  = h * 0.34;

  ctx.fillStyle = C.line;
  ctx.fillRect(staffX - staffW / 2, top, staffW, h);

  ctx.beginPath();
  ctx.moveTo(staffX + staffW / 2,            top + h * 0.04);
  ctx.lineTo(staffX + staffW / 2 + w * 0.66, top + h * 0.04 + flagH * 0.5);
  ctx.lineTo(staffX + staffW / 2,            top + h * 0.04 + flagH);
  ctx.closePath();
  ctx.fill();
}

// Large solid upward arrow — arrowhead + shaft (Knight, Ranger)
function _illArrowUp(ctx, C) {
  const cx = 0.5, mg = _ILL_MG, w = _ILL_W;
  const top = mg, bot = 1 - mg, h = bot - top;

  const headH  = h * 0.42;
  const shaftW = w * 0.30;

  ctx.fillStyle = C.line;
  ctx.beginPath();
  ctx.moveTo(cx,               top);
  ctx.lineTo(cx + w / 2,       top + headH);
  ctx.lineTo(cx + shaftW / 2,  top + headH);
  ctx.lineTo(cx + shaftW / 2,  bot);
  ctx.lineTo(cx - shaftW / 2,  bot);
  ctx.lineTo(cx - shaftW / 2,  top + headH);
  ctx.lineTo(cx - w / 2,       top + headH);
  ctx.closePath();
  ctx.fill();
}

// War hammer — T-shape (Marshall)
function _illHammer(ctx, C) {
  const cx = 0.5, mg = _ILL_MG, w = _ILL_W;
  const top = mg, bot = 1 - mg, h = bot - top;

  const shaftW = w * 0.18;
  const headH  = h * 0.24;
  const headY  = top + h * 0.18;

  ctx.fillStyle = C.line;
  ctx.fillRect(cx - shaftW / 2, headY + headH * 0.5, shaftW, bot - headY - headH * 0.5);
  ctx.fillRect(cx - w / 2,      headY,                w,      headH);
}

// Simple pole with spear tip (Pikeman)
function _illPole(ctx, C) {
  const cx = 0.5, mg = _ILL_MG, w = _ILL_W;
  const top = mg, bot = 1 - mg, h = bot - top;

  const shaftW = w * 0.18;
  const tipH   = h * 0.09;
  const tipW   = w * 0.48;

  ctx.fillStyle = C.line;
  ctx.fillRect(cx - shaftW / 2, top + tipH, shaftW, h - tipH);

  ctx.beginPath();
  ctx.moveTo(cx,             top);
  ctx.lineTo(cx + tipW / 2,  top + tipH);
  ctx.lineTo(cx - tipW / 2,  top + tipH);
  ctx.closePath();
  ctx.fill();
}

// Latin cross (Priest)
function _illCross(ctx, C) {
  const cx = 0.5, mg = _ILL_MG, w = _ILL_W;
  const top = mg, bot = 1 - mg, h = bot - top;

  const vW = w * 0.28;
  const hH = h * 0.20;
  const hY = top + h * 0.28;

  ctx.fillStyle = C.line;
  ctx.fillRect(cx - vW / 2, top, vW, h);
  ctx.fillRect(cx - w  / 2, hY,  w,  hH);
}

// Crystal-ball orb ring on staff (Seer)
function _illOrbStaff(ctx, C) {
  const cx = 0.5, mg = _ILL_MG, w = _ILL_W;
  const top = mg, bot = 1 - mg, h = bot - top;

  const orbR   = w * 0.47;
  const orbCY  = top + orbR + h * 0.04;
  const shaftW = w * 0.16;

  ctx.fillStyle = C.line;
  ctx.beginPath();
  ctx.arc(cx, orbCY, orbR, 0, Math.PI * 2);
  ctx.fill();

  // Cutout — gives open-ring look
  ctx.fillStyle = C.bg;
  ctx.beginPath();
  ctx.arc(cx, orbCY, orbR * 0.50, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.line;

  const staffTop = orbCY + orbR;
  ctx.fillRect(cx - shaftW / 2, staffTop, shaftW, bot - staffTop);
}

// Wand with 5-pointed star at top (Wizard)
function _illWand(ctx, C) {
  const cx = 0.5, mg = _ILL_MG, w = _ILL_W;
  const top = mg, bot = 1 - mg, h = bot - top;

  const starR  = w * 0.50;
  const starCY = top + starR + h * 0.02;
  const wandW  = w * 0.16;

  ctx.fillStyle = C.line;
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

  const wTop = starCY + starR * 0.25;
  ctx.fillRect(cx - wandW / 2, wTop, wandW, bot - wTop);
}

// Crown with three peaks (Duchess)
function _illCrown(ctx, C) {
  const cx = 0.5, mg = _ILL_MG, w = _ILL_W;
  const top = mg, bot = 1 - mg, h = bot - top;

  const cBot  = top + h * 0.68;
  const cTop  = top + h * 0.18;
  const peakH = (cBot - cTop) * 0.55;

  ctx.fillStyle = C.line;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2,   cBot);
  ctx.lineTo(cx - w / 2,   cTop + peakH);
  ctx.lineTo(cx - w / 4,   cTop);
  ctx.lineTo(cx - w / 10,  cTop + peakH * 0.5);
  ctx.lineTo(cx,            cTop - peakH * 0.12);
  ctx.lineTo(cx + w / 10,  cTop + peakH * 0.5);
  ctx.lineTo(cx + w / 4,   cTop);
  ctx.lineTo(cx + w / 2,   cTop + peakH);
  ctx.lineTo(cx + w / 2,   cBot);
  ctx.closePath();
  ctx.fill();
}

// Crescent moon (Oracle)
function _illCrescent(ctx, C) {
  const cx = 0.5, mg = _ILL_MG, w = _ILL_W;
  const top = mg, bot = 1 - mg, h = bot - top;

  const r  = Math.min(w * 0.52, h * 0.38);
  const cy = top + h * 0.40;

  ctx.fillStyle = C.line;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Offset inner cutout to create crescent shape
  ctx.fillStyle = C.bg;
  ctx.beginPath();
  ctx.arc(cx + r * 0.36, cy - r * 0.10, r * 0.76, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.line;
}
