// Sunset and neon colour grades for the cover. Each grade is a gradient map:
// a list of colour stops painted over the panels, plus the title gradient and
// the neon accent used for the subtitle and the badge ribbon. v2 grades are
// deliberately STRONGER than v1 (the v1 grade read as a thin wash on daylight
// photos); the overlay now bites into the photos so the poster reads as a
// sunset/neon key-art, not a filtered snapshot.
export const GRADES = {
  sunset: {
    name: 'Sunset',
    overlay: [
      [0, 'rgba(255, 94, 98, 0.05)'],
      [0.4, 'rgba(255, 154, 0, 0.20)'],
      [0.75, 'rgba(255, 60, 120, 0.32)'],
      [1, 'rgba(236, 0, 140, 0.52)'],
    ],
    title: ['#ffd319', '#ff2975', '#8c1eff'],
    accent: '#ff2975',
    glow: '#ffd319',
  },
  blaze: {
    name: 'Vice Blaze',
    overlay: [
      [0, 'rgba(255, 180, 0, 0.08)'],
      [0.35, 'rgba(255, 110, 0, 0.26)'],
      [0.7, 'rgba(255, 40, 110, 0.40)'],
      [1, 'rgba(140, 30, 255, 0.58)'],
    ],
    title: ['#ffe66d', '#ff5e00', '#ff2975'],
    accent: '#ff5e00',
    glow: '#ffe66d',
  },
  neon: {
    name: 'Neon Vice',
    overlay: [
      [0, 'rgba(0, 255, 255, 0.06)'],
      [0.45, 'rgba(255, 0, 255, 0.22)'],
      [0.75, 'rgba(120, 0, 255, 0.34)'],
      [1, 'rgba(140, 30, 255, 0.55)'],
    ],
    title: ['#00f5ff', '#ff00e5', '#ffd319'],
    accent: '#00f5ff',
    glow: '#ff00e5',
  },
  gold: {
    name: 'Palm Gold',
    overlay: [
      [0, 'rgba(255, 215, 0, 0.06)'],
      [0.45, 'rgba(255, 140, 0, 0.22)'],
      [0.75, 'rgba(255, 90, 0, 0.34)'],
      [1, 'rgba(180, 60, 0, 0.52)'],
    ],
    title: ['#fff3b0', '#ffb703', '#fb8500'],
    accent: '#ffb703',
    glow: '#fff3b0',
  },
  midnight: {
    name: 'Midnight',
    overlay: [
      [0, 'rgba(20, 10, 60, 0.10)'],
      [0.45, 'rgba(90, 20, 160, 0.28)'],
      [0.75, 'rgba(140, 30, 200, 0.38)'],
      [1, 'rgba(10, 5, 40, 0.58)'],
    ],
    title: ['#c77dff', '#7b2cbf', '#ff5d8f'],
    accent: '#c77dff',
    glow: '#ff5d8f',
  },
  coral: {
    name: 'Coral Dawn',
    overlay: [
      [0, 'rgba(255, 200, 180, 0.06)'],
      [0.45, 'rgba(255, 110, 90, 0.22)'],
      [0.75, 'rgba(255, 60, 110, 0.32)'],
      [1, 'rgba(200, 30, 90, 0.50)'],
    ],
    title: ['#ffe66d', '#ff6b6b', '#c9184a'],
    accent: '#ff6b6b',
    glow: '#ffe66d',
  },
};

/** Returns the grade object for an id, falling back to Vice Blaze. */
export function gradeFor(id) {
  return GRADES[id] ?? GRADES.blaze;
}

/** Paints a grade's overlay gradient over the whole cover. */
export function applyGradeOverlay(ctx, grade, w, h) {
  const g = ctx.createLinearGradient(0, 0, w * 0.25, h);
  for (const [stop, color] of grade.overlay) g.addColorStop(stop, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Builds the vertical gradient used for the big title lettering. */
export function titleGradient(ctx, grade, x, y, h) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  const stops = grade.title;
  g.addColorStop(0, stops[0]);
  g.addColorStop(0.55, stops[1]);
  g.addColorStop(1, stops[2]);
  return g;
}
