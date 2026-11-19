// Fixed scenes for screenshots: ?shot=cover shows the best landscape cover
// with the editor still visible; ?shot=editor shows the editor with photos
// loaded; ?shot=portrait shows the portrait cover; ?shot=square the square
// cover. Each scene loads the free sample photos and sets a fixed state, so
// every screenshot is a real render of the running app. window.__shotReady
// is set once the scene has painted.
export const SHOT_SCENES = {
  cover: { layout: 'hero-three', grade: 'sunset', size: 'wide', title: 'LEONIDA NIGHTS', subtitle: 'Vice City, baby', badge: 'EST. 2026' },
  editor: { layout: 'quad', grade: 'neon', size: 'wide', title: 'NEON COAST', subtitle: 'drive all night', badge: 'VICE CITY' },
  portrait: { layout: 'hero-top', grade: 'gold', size: 'portrait', title: 'PALM HEIST', subtitle: 'sunset crew', badge: 'EST. 2026' },
  square: { layout: 'triptych', grade: 'coral', size: 'square', title: 'CORAL DAWN', subtitle: 'three ways home', badge: 'LEONIDA' },
};

/** Applies a shot scene: loads both samples, sets the state, repaints. */
export async function runShot(shot, query, applyScene) {
  const scene = SHOT_SCENES[shot] ?? SHOT_SCENES.cover;
  const overrides = {
    title: query.get('caption') ?? scene.title,
    layout: query.get('layout') ?? scene.layout,
    grade: query.get('grade') ?? scene.grade,
    size: query.get('size') ?? scene.size,
  };
  await applyScene({ ...scene, ...overrides });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
