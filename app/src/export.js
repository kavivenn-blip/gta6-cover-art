// Exports the cover as PNGs in the three common post sizes. Each size is
// rendered fresh from the same state, so every file is the same cover. v2
// adds exportAllSizes: one click renders all three sizes in order, the
// fastest path from photo to a full set of posts.
import { drawCoverArt } from './cover.js';

export const EXPORT_SIZES = [
  { id: 'square', name: 'Square 1080 x 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  { id: 'wide', name: 'Wide 1920 x 1080', w: 1920, h: 1080 },
];

/** Returns the export-size entry for an id, falling back to Wide. */
export function exportSizeFor(id) {
  return EXPORT_SIZES.find((s) => s.id === id) ?? EXPORT_SIZES[2];
}

/** Renders the cover at one export size and resolves to its PNG blob. */
export function renderCoverPng(state, photos, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCoverArt(canvas, state, photos);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG render failed'))), 'image/png');
  });
}

/** Downloads one PNG blob under a file name. */
export function downloadPng(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Renders and downloads every checked export size, in order. */
export async function exportCheckedSizes(state, photos, checkedIds, onProgress) {
  const done = [];
  for (const id of checkedIds) {
    const size = exportSizeFor(id);
    onProgress?.(`Rendering ${size.name}...`);
    const blob = await renderCoverPng(state, photos, size);
    downloadPng(blob, `cover-${size.w}x${size.h}.png`);
    done.push(size.name);
    onProgress?.(`Saved cover-${size.w}x${size.h}.png`);
  }
  return done;
}

/** Renders and downloads all three post sizes, in order — one click, full set. */
export async function exportAllSizes(state, photos, onProgress) {
  return exportCheckedSizes(state, photos, EXPORT_SIZES.map((s) => s.id), onProgress);
}
