// Draws the whole cover onto a canvas: dense multi-panel photos, a strong
// sunset/neon grade, halftone title block, tilted snapshot strip, bold title
// lettering with a dark stroke, badge ribbon, film grain and vignette. v2
// renders LOUDER than v1: the title is bigger and stroked, the halftone is
// denser, the ribbon is larger, and the grade bites harder — so the cover
// reads as a poster at a glance, not a filtered snapshot. Pure drawing: no
// network, no DOM writes.
import { panelRectsForLayout } from './layouts.js';
import { applyGradeOverlay, gradeFor, titleGradient } from './grades.js';

// Deterministic grain: the same seed every run, so two exports match.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let grainPattern = null;
function getGrainPattern(ctx) {
  if (grainPattern) return grainPattern;
  const tile = document.createElement('canvas');
  tile.width = 160;
  tile.height = 160;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(160, 160);
  const rnd = mulberry32(20261121);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 24;
  }
  tctx.putImageData(img, 0, 0);
  grainPattern = ctx.createPattern(tile, 'repeat');
  return grainPattern;
}

/** Draws one photo into a panel rect, honouring its zoom and drag offsets. */
export function drawPanelPhoto(ctx, photo, rect, panel) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.fillStyle = '#241533';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  if (photo) {
    const zoom = panel?.zoom ?? 1;
    const base = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight);
    const scale = base * zoom;
    const pw = photo.naturalWidth * scale;
    const ph = photo.naturalHeight * scale;
    const ox = panel?.ox ?? 0;
    const oy = panel?.oy ?? 0;
    ctx.drawImage(photo, rect.x + (rect.w - pw) / 2 + ox, rect.y + (rect.h - ph) / 2 + oy, pw, ph);
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.lineWidth = Math.max(2, rect.w * 0.004);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

/** Draws the halftone dot field behind the title block (denser than v1). */
export function drawHalftoneTitleBlock(ctx, x, y, w, h, accent) {
  ctx.save();
  ctx.fillStyle = 'rgba(12, 4, 24, 0.9)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = accent;
  const step = Math.max(11, w * 0.012);
  for (let gy = y + step / 2; gy < y + h; gy += step) {
    for (let gx = x + step / 2; gx < x + w; gx += step) {
      const fade = 1 - (gy - y) / h;
      const r = Math.max(0.6, (step * 0.24) * fade + 0.4);
      ctx.globalAlpha = 0.14 + 0.55 * fade;
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, w, Math.max(4, h * 0.05));
  ctx.restore();
}

/** Draws three tilted snapshot thumbnails overlapping the title block's top edge. */
export function drawTiltedSnapshotStrip(ctx, photos, x, y, w, h) {
  const loaded = photos.filter(Boolean);
  if (loaded.length === 0) return;
  // Cycle the loaded photos so the strip always shows three snapshots.
  const shots = [loaded[0], loaded[1 % loaded.length], loaded[0]];
  const thumbW = w / 3.4;
  const thumbH = h;
  const tilts = [-0.1, 0.07, -0.05];
  shots.forEach((photo, i) => {
    const cx = x + (i + 0.5) * (w / 3);
    const cy = y + h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilts[i % tilts.length]);
    ctx.fillStyle = '#fff8e7';
    ctx.fillRect(-thumbW / 2 - 6, -thumbH / 2 - 6, thumbW + 12, thumbH + 12);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-thumbW / 2, -thumbH / 2, thumbW, thumbH);
    ctx.clip();
    const scale = Math.max(thumbW / photo.naturalWidth, thumbH / photo.naturalHeight);
    ctx.drawImage(
      photo,
      (-photo.naturalWidth * scale) / 2,
      (-photo.naturalHeight * scale) / 2,
      photo.naturalWidth * scale,
      photo.naturalHeight * scale,
    );
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-thumbW / 2 - 6, -thumbH / 2 - 6, thumbW + 12, thumbH + 12);
    ctx.restore();
  });
}

/**
 * Draws the big Anton title with a sunset gradient, a dark stroke outline and
 * the Pacifico subtitle. The title is larger than v1 and honours the state's
 * title offset (tx, ty) so the user can drag it to a new spot.
 */
export function drawTitleLettering(ctx, state, grade, w, h, blockY, blockH) {
  const pad = w * 0.035;
  const title = (state.title || 'LEONIDA').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const tx = state.titleX ?? 0;
  const ty = state.titleY ?? 0;
  let size = blockH * 0.62;
  ctx.textBaseline = 'alphabetic';
  const fit = () => {
    ctx.font = `${size}px Anton, sans-serif`;
    return ctx.measureText(title).width <= w * 0.66;
  };
  while (!fit() && size > 16) size -= 2;
  ctx.font = `${size}px Anton, sans-serif`;
  const titleY = blockY + blockH * 0.58 + ty;
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = size * 0.14;
  ctx.shadowOffsetY = size * 0.05;
  // Dark stroke first so the gradient letters pop off any photo behind them.
  ctx.lineWidth = Math.max(2, size * 0.07);
  ctx.strokeStyle = 'rgba(10, 2, 20, 0.9)';
  ctx.lineJoin = 'round';
  ctx.strokeText(title, pad + tx, titleY);
  ctx.fillStyle = titleGradient(ctx, grade, pad, titleY - size, size);
  ctx.fillText(title, pad + tx, titleY);
  ctx.restore();
  if (subtitle) {
    const subSize = Math.max(18, blockH * 0.22);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = grade.glow;
    ctx.save();
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = subSize * 0.55;
    ctx.fillText(subtitle, pad + 4 + tx, titleY + subSize * 1.2);
    ctx.restore();
  }
}

/** Draws the diagonal badge ribbon in the top-right corner (larger than v1). */
export function drawBadgeRibbon(ctx, badge, grade, w, h) {
  const text = (badge || '').trim().toUpperCase();
  if (!text) return;
  const ribbonH = Math.max(30, h * 0.045);
  ctx.save();
  ctx.translate(w, 0);
  ctx.rotate(Math.PI / 4);
  const ribbonW = Math.max(w * 0.26, text.length * ribbonH * 0.72);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(-ribbonW / 2, -ribbonH / 2 + w * 0.1, ribbonW, ribbonH);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(ribbonH * 0.58)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, -ribbonH / 2 + w * 0.1 + ribbonH / 2 + 1);
  ctx.restore();
}

/** Darkens the cover's corners so the title and panels read as one poster. */
export function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Draws the full cover for a state onto the canvas at its own size. */
export function drawCoverArt(canvas, state, photos, options = {}) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = gradeFor(state.grade);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#12081d';
  ctx.fillRect(0, 0, w, h);

  const rects = panelRectsForLayout(state.layout, w, h);
  rects.forEach((r, i) => {
    const panel = state.panels[i] ?? { photo: i % Math.max(1, photos.length), zoom: 1, ox: 0, oy: 0 };
    drawPanelPhoto(ctx, photos[panel.photo] ?? photos[0] ?? null, r, panel);
  });

  applyGradeOverlay(ctx, grade, w, h);

  // Title block across the foot, snapshot strip tilted over its top edge.
  const blockH = Math.round(h * 0.26);
  const blockY = h - blockH;
  const stripW = Math.min(w * 0.34, 460);
  const stripH = Math.round(blockH * 0.62);
  drawTiltedSnapshotStrip(ctx, photos, w - stripW - w * 0.03, blockY - stripH * 0.55, stripW, stripH);
  drawHalftoneTitleBlock(ctx, 0, blockY, w, blockH, grade.accent);
  drawTitleLettering(ctx, state, grade, w, h, blockY, blockH);
  drawBadgeRibbon(ctx, state.badge, grade, w, h);

  if (state.grain !== false) {
    ctx.fillStyle = getGrainPattern(ctx);
    ctx.fillRect(0, 0, w, h);
  }
  if (state.vignette !== false) drawVignette(ctx, w, h);

  // Preview-only selection outline, never baked into an export.
  if (options.selectedPanel != null && rects[options.selectedPanel]) {
    const r = rects[options.selectedPanel];
    ctx.save();
    ctx.strokeStyle = grade.glow;
    ctx.lineWidth = Math.max(3, w * 0.004);
    ctx.setLineDash([14, 8]);
    ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    ctx.restore();
  }
}
