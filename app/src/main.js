// Wires the cover editor: photo upload, layout and grade pickers, caption
// editing, per-panel crop and position, undo/redo, and PNG export in the
// three post sizes. A `?shot=` query sets up a fixed scene for a screenshot
// instead (./shots.js). Photos never leave the machine: they are read with
// object URLs and drawn locally.
import { drawCoverArt } from './cover.js';
import { LAYOUTS, panelCountForLayout, panelRectsForLayout } from './layouts.js';
import { GRADES } from './grades.js';
import { EXPORT_SIZES, exportCheckedSizes, exportSizeFor } from './export.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const badgeInput = document.getElementById('badge');
const zoomInput = document.getElementById('zoom');
const panelPhotoSelect = document.getElementById('panel-photo');
const panelLabel = document.getElementById('panel-label');

const SAMPLES = [
  { name: 'Pier', url: 'samples/pier.jpg' },
  { name: 'Boulevard', url: 'samples/boulevard.jpg' },
];

let photos = [];
let photoNames = [];
let selectedPanel = 0;
let undoStack = [];
let redoStack = [];

function defaultState() {
  return {
    layout: 'hero-three',
    grade: 'sunset',
    size: 'wide',
    title: 'LEONIDA NIGHTS',
    subtitle: 'Vice City, baby',
    badge: 'EST. 2026',
    grain: true,
    vignette: true,
    panels: [
      { photo: 0, zoom: 1.05, ox: 0, oy: 0 },
      { photo: 1, zoom: 1.1, ox: 0, oy: 0 },
      { photo: 0, zoom: 1.15, ox: 0, oy: 0 },
      { photo: 1, zoom: 1.05, ox: 0, oy: 0 },
    ],
  };
}

let state = defaultState();

function snapshotState() {
  return JSON.stringify(state);
}

function pushHistory() {
  undoStack.push(snapshotState());
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}

function applySnapshot(json) {
  state = JSON.parse(json);
  syncControlsFromState();
  redraw();
}

function updateUndoButtons() {
  document.getElementById('undo').disabled = undoStack.length === 0;
  document.getElementById('redo').disabled = redoStack.length === 0;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${url}`));
    img.src = url;
  });
}

async function loadSamples() {
  for (const sample of SAMPLES) {
    try {
      const img = await loadImage(sample.url);
      photos.push(img);
      photoNames.push(sample.name);
    } catch {
      // A missing sample just leaves that slot empty; the editor still works.
    }
  }
}

function redraw() {
  const size = exportSizeFor(state.size);
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawCoverArt(canvas, state, photos, { selectedPanel });
  canvas.setAttribute('aria-label', `Cover preview: ${state.title}, ${size.name}`);
}

function setStatus(text) {
  statusEl.textContent = text;
}

function syncControlsFromState() {
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  badgeInput.value = state.badge;
  document.getElementById('grain').checked = state.grain !== false;
  document.getElementById('vignette').checked = state.vignette !== false;
  document.querySelectorAll('.layout-btn').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('.grade-btn').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
  syncPanelControls();
}

function syncPanelControls() {
  const count = panelCountForLayout(state.layout);
  if (selectedPanel >= count) selectedPanel = 0;
  const panel = state.panels[Math.max(0, selectedPanel)];
  panelLabel.textContent = selectedPanel < 0 ? 'Click a panel in the preview' : `Panel ${selectedPanel + 1} of ${count}`;
  panelPhotoSelect.innerHTML = '';
  photoNames.forEach((name, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `${i + 1}. ${name}`;
    panelPhotoSelect.appendChild(opt);
  });
  panelPhotoSelect.value = String(panel.photo ?? 0);
  zoomInput.value = String(panel.zoom ?? 1);
  document.getElementById('zoom-value').textContent = `${Math.round((panel.zoom ?? 1) * 100)}%`;
}

function buildPickers() {
  const layoutRow = document.getElementById('layouts');
  for (const [id, layout] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'layout-btn';
    b.dataset.layout = id;
    b.textContent = layout.name;
    b.addEventListener('click', () => {
      pushHistory();
      state.layout = id;
      syncControlsFromState();
      redraw();
    });
    layoutRow.appendChild(b);
  }
  const gradeRow = document.getElementById('grades');
  for (const [id, grade] of Object.entries(GRADES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'grade-btn';
    b.dataset.grade = id;
    b.textContent = grade.name;
    b.style.setProperty('--swatch', grade.accent);
    b.addEventListener('click', () => {
      pushHistory();
      state.grade = id;
      syncControlsFromState();
      redraw();
    });
    gradeRow.appendChild(b);
  }
  const sizeRow = document.getElementById('sizes');
  for (const size of EXPORT_SIZES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'size-btn';
    b.dataset.size = size.id;
    b.textContent = size.name;
    b.addEventListener('click', () => {
      pushHistory();
      state.size = size.id;
      syncControlsFromState();
      redraw();
    });
    sizeRow.appendChild(b);
  }
}

function wireInputs() {
  document.getElementById('photo').addEventListener('change', async (e) => {
    const files = [...(e.target.files ?? [])];
    if (files.length === 0) return;
    for (const file of files) {
      try {
        const img = await loadImage(URL.createObjectURL(file));
        photos.push(img);
        photoNames.push(file.name);
      } catch {
        setStatus(`Could not read ${file.name}.`);
      }
    }
    pushHistory();
    syncPanelControls();
    redraw();
    setStatus(`${files.length} photo${files.length > 1 ? 's' : ''} loaded. Pick a layout, then Export PNG.`);
  });

  document.getElementById('load-samples').addEventListener('click', async () => {
    if (photos.length > 0) return;
    await loadSamples();
    syncPanelControls();
    redraw();
    setStatus('Sample photos loaded: Pier and Boulevard.');
  });

  titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
  subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
  badgeInput.addEventListener('input', () => { state.badge = badgeInput.value; redraw(); });
  document.getElementById('grain').addEventListener('change', (e) => { pushHistory(); state.grain = e.target.checked; redraw(); });
  document.getElementById('vignette').addEventListener('change', (e) => { pushHistory(); state.vignette = e.target.checked; redraw(); });

  panelPhotoSelect.addEventListener('change', () => {
    pushHistory();
    state.panels[selectedPanel].photo = Number(panelPhotoSelect.value);
    redraw();
  });
  zoomInput.addEventListener('input', () => {
    state.panels[selectedPanel].zoom = Number(zoomInput.value);
    document.getElementById('zoom-value').textContent = `${Math.round(Number(zoomInput.value) * 100)}%`;
    redraw();
  });
  zoomInput.addEventListener('change', () => pushHistory());
  document.getElementById('reset-panel').addEventListener('click', () => {
    pushHistory();
    state.panels[selectedPanel] = { photo: selectedPanel % Math.max(1, photos.length), zoom: 1, ox: 0, oy: 0 };
    syncPanelControls();
    redraw();
  });

  document.getElementById('undo').addEventListener('click', () => {
    if (undoStack.length === 0) return;
    redoStack.push(snapshotState());
    applySnapshot(undoStack.pop());
    updateUndoButtons();
  });
  document.getElementById('redo').addEventListener('click', () => {
    if (redoStack.length === 0) return;
    undoStack.push(snapshotState());
    applySnapshot(redoStack.pop());
    updateUndoButtons();
  });

  document.getElementById('export').addEventListener('click', async () => {
    const checked = [...document.querySelectorAll('.export-size:checked')].map((c) => c.value);
    if (checked.length === 0) {
      setStatus('Tick at least one export size first.');
      return;
    }
    setStatus(`Exporting ${checked.length} PNG${checked.length > 1 ? 's' : ''}...`);
    try {
      const done = await exportCheckedSizes(state, photos, checked, setStatus);
      setStatus(`Saved: ${done.join(' · ')}.`);
    } catch (err) {
      setStatus(`Export failed: ${err.message}`);
    }
  });

  wireCanvasDrag();
}

function canvasPoint(event) {
  const box = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - box.left) / box.width) * canvas.width,
    y: ((event.clientY - box.top) / box.height) * canvas.height,
  };
}

function panelAt(point) {
  const rects = panelRectsForLayout(state.layout, canvas.width, canvas.height);
  return rects.findIndex((r) => point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h);
}

function wireCanvasDrag() {
  let dragging = null;
  canvas.addEventListener('pointerdown', (e) => {
    const point = canvasPoint(e);
    const hit = panelAt(point);
    if (hit === -1) return;
    selectedPanel = hit;
    syncPanelControls();
    redraw();
    dragging = { panel: hit, last: point, moved: false, before: snapshotState() };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const point = canvasPoint(e);
    const panel = state.panels[dragging.panel];
    const scale = canvas.width / canvas.getBoundingClientRect().width;
    panel.ox += (point.x - dragging.last.x) * 1;
    panel.oy += (point.y - dragging.last.y) * 1;
    dragging.last = point;
    dragging.moved = true;
    void scale;
    redraw();
  });
  canvas.addEventListener('pointerup', () => {
    if (dragging?.moved) {
      undoStack.push(dragging.before);
      redoStack = [];
      updateUndoButtons();
    }
    dragging = null;
  });
}

buildPickers();
wireInputs();
syncControlsFromState();
updateUndoButtons();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), async (scene) => {
    await loadSamples();
    state = { ...defaultState(), ...scene, panels: defaultState().panels };
    // Cover shots show the art clean; the editor shot keeps a panel selected.
    selectedPanel = shot === 'editor' ? 0 : -1;
    syncControlsFromState();
    redraw();
  });
} else {
  loadSamples().then(() => {
    syncPanelControls();
    redraw();
  });
  redraw();
}

// Redraw once the display fonts arrive, so the title is Anton, not a fallback.
if (document.fonts) {
  Promise.all([
    document.fonts.load('80px Anton'),
    document.fonts.load('40px Pacifico'),
  ]).then(redraw).catch(() => redraw());
  document.fonts.ready.then(redraw);
}
