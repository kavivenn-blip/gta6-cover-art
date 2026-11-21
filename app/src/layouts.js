// Panel layouts for the cover: each layout returns the rectangles its panels
// occupy inside a cover of width w and height h. Panel 0 is always the hero.
// Rectangles are { x, y, w, h } in cover pixels. v2 uses a tight 3 px gutter
// (v1 used 6 px) so the panels read as one dense poster, not loose tiles.
const GUTTER = 3;

function rect(x, y, w, h) {
  return { x, y, w, h };
}

/** Rectangles for the "hero-and-three" layout: big hero left, three stacked right. */
export function layoutHeroAndThree(w, h) {
  const heroW = Math.round(w * 0.62) - GUTTER;
  const sideX = heroW + GUTTER;
  const sideW = w - sideX;
  const thirdH = Math.round(h / 3) - GUTTER;
  return [
    rect(0, 0, heroW, h),
    rect(sideX, 0, sideW, thirdH),
    rect(sideX, thirdH + GUTTER, sideW, thirdH),
    rect(sideX, 2 * (thirdH + GUTTER), sideW, h - 2 * (thirdH + GUTTER)),
  ];
}

/** Rectangles for the "full-bleed" layout: one photo fills the whole cover. */
export function layoutFullBleed(w, h) {
  return [rect(0, 0, w, h)];
}

/** Rectangles for the "quad" layout: four equal panels in a 2 x 2 grid. */
export function layoutQuad(w, h) {
  const halfW = Math.round(w / 2) - GUTTER;
  const halfH = Math.round(h / 2) - GUTTER;
  return [
    rect(0, 0, halfW, halfH),
    rect(halfW + GUTTER, 0, w - halfW - GUTTER, halfH),
    rect(0, halfH + GUTTER, halfW, h - halfH - GUTTER),
    rect(halfW + GUTTER, halfH + GUTTER, w - halfW - GUTTER, h - halfH - GUTTER),
  ];
}

/** Rectangles for the "triptych" layout: three tall panels side by side. */
export function layoutTriptych(w, h) {
  const thirdW = Math.round(w / 3) - GUTTER;
  return [
    rect(0, 0, thirdW, h),
    rect(thirdW + GUTTER, 0, thirdW, h),
    rect(2 * (thirdW + GUTTER), 0, w - 2 * (thirdW + GUTTER), h),
  ];
}

/** Rectangles for the "hero-top" layout: wide hero on top, two panels below. */
export function layoutHeroTop(w, h) {
  const heroH = Math.round(h * 0.58) - GUTTER;
  const halfW = Math.round(w / 2) - GUTTER;
  return [
    rect(0, 0, w, heroH),
    rect(0, heroH + GUTTER, halfW, h - heroH - GUTTER),
    rect(halfW + GUTTER, heroH + GUTTER, w - halfW - GUTTER, h - heroH - GUTTER),
  ];
}

/** Rectangles for the "hero-right" layout: three stacked left, big hero right. */
export function layoutHeroRight(w, h) {
  const heroW = Math.round(w * 0.62) - GUTTER;
  const sideW = w - heroW - GUTTER;
  const thirdH = Math.round(h / 3) - GUTTER;
  return [
    rect(0, 0, sideW, thirdH),
    rect(0, thirdH + GUTTER, sideW, thirdH),
    rect(0, 2 * (thirdH + GUTTER), sideW, h - 2 * (thirdH + GUTTER)),
    rect(sideW + GUTTER, 0, heroW, h),
  ];
}

/**
 * Rectangles for the "poster-grid" layout (v2 hero): a big hero on the left
 * and six small panels in a 2 x 3 grid on the right — seven panels in all,
 * dense enough to read as a poster wall. The default layout for v2 covers.
 */
export function layoutPosterGrid(w, h) {
  const heroW = Math.round(w * 0.55) - GUTTER;
  const gridX = heroW + GUTTER;
  const gridW = w - gridX;
  const colW = Math.round(gridW / 2) - GUTTER;
  const rowH = Math.round(h / 3) - GUTTER;
  const small = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const y = row * (rowH + GUTTER);
      const x = gridX + col * (colW + GUTTER);
      const lastRow = row === 2;
      const lastCol = col === 1;
      small.push(rect(x, y, lastCol ? gridW - col * (colW + GUTTER) : colW, lastRow ? h - y : rowH));
    }
  }
  return [rect(0, 0, heroW, h), ...small];
}

/**
 * Rectangles for the "nine" layout: a tight 3 x 3 grid of nine equal panels.
 * The densest layout — a photo-mosaic wall for covers with many photos.
 */
export function layoutNine(w, h) {
  const colW = Math.round(w / 3) - GUTTER;
  const rowH = Math.round(h / 3) - GUTTER;
  const out = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const y = row * (rowH + GUTTER);
      const x = col * (colW + GUTTER);
      out.push(rect(x, y, col === 2 ? w - x : colW, row === 2 ? h - y : rowH));
    }
  }
  return out;
}

export const LAYOUTS = {
  'poster-grid': { name: 'Poster Grid', panels: 7, fn: layoutPosterGrid },
  'hero-three': { name: 'Hero + Three', panels: 4, fn: layoutHeroAndThree },
  'full-bleed': { name: 'Full Bleed', panels: 1, fn: layoutFullBleed },
  quad: { name: 'Quad 2x2', panels: 4, fn: layoutQuad },
  triptych: { name: 'Triptych', panels: 3, fn: layoutTriptych },
  'hero-top': { name: 'Hero Top', panels: 3, fn: layoutHeroTop },
  'hero-right': { name: 'Hero Right', panels: 4, fn: layoutHeroRight },
  nine: { name: 'Nine Grid', panels: 9, fn: layoutNine },
};

/** Returns the panel rectangles for a layout id at cover size w x h. */
export function panelRectsForLayout(layoutId, w, h) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS['poster-grid'];
  return layout.fn(w, h);
}

/** How many panels a layout shows. */
export function panelCountForLayout(layoutId) {
  return (LAYOUTS[layoutId] ?? LAYOUTS['poster-grid']).panels;
}
