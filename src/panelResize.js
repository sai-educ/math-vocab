/* =========================================================================
   Resizable side panels.

   A real WAI-ARIA "window splitter": role="separator" with a numeric value,
   draggable with a pointer and adjustable with the arrow keys, so resizing
   never depends on being able to see or operate a mouse. Widths persist per
   browser and are re-clamped against the current window on every drag, so
   two panels can never squeeze the graph down to nothing.
   ========================================================================= */

const STACKED_QUERY = '(max-width: 1100px)';
const MIN_GRAPH_WIDTH = 280;
const KEY_STEP = 24;

function initPanelResizers() {
  const leftPanel = document.getElementById('leftPanel');
  const detailPanel = document.getElementById('detail');
  const resizerLeft = document.getElementById('resizerLeft');
  const resizerDetail = document.getElementById('resizerDetail');
  if (!leftPanel || !detailPanel || !resizerLeft || !resizerDetail) return;

  setupResizer({
    handle: resizerLeft, panel: leftPanel, otherPanel: detailPanel,
    direction: 1, min: 220, max: 420, storageKey: STORAGE_KEYS.leftPanelWidth,
  });
  setupResizer({
    handle: resizerDetail, panel: detailPanel, otherPanel: leftPanel,
    direction: -1, min: 300, max: 560, storageKey: STORAGE_KEYS.detailPanelWidth,
  });
}

function setupResizer({ handle, panel, otherPanel, direction, min, max, storageKey }) {
  let dragging = false;
  let startX = 0;
  let startWidth = 0;

  applyStoredWidth();
  syncAria();

  handle.addEventListener('pointerdown', (event) => {
    if (isStacked() || event.button !== 0) return;
    dragging = true;
    startX = event.clientX;
    startWidth = panel.getBoundingClientRect().width;
    handle.classList.add('dragging');
    handle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  handle.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const delta = (event.clientX - startX) * direction;
    applyWidth(startWidth + delta);
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    persist(panel.getBoundingClientRect().width);
  };
  handle.addEventListener('pointerup', endDrag);
  handle.addEventListener('pointercancel', endDrag);
  handle.addEventListener('lostpointercapture', endDrag);

  handle.addEventListener('keydown', (event) => {
    let sign = 0;
    if (event.key === 'ArrowLeft') sign = -1;
    else if (event.key === 'ArrowRight') sign = 1;
    else return;
    event.preventDefault();
    const next = panel.getBoundingClientRect().width + KEY_STEP * sign * direction;
    applyWidth(next);
    persist(panel.getBoundingClientRect().width);
  });

  function effectiveMax() {
    const otherWidth = otherPanel.getBoundingClientRect().width;
    const available = window.innerWidth - otherWidth - MIN_GRAPH_WIDTH;
    return Math.max(min, Math.min(max, available));
  }

  function applyWidth(px) {
    const clamped = Math.min(effectiveMax(), Math.max(min, px));
    panel.style.flexBasis = `${clamped}px`;
    panel.style.width = `${clamped}px`;
    syncAria(clamped);
  }

  function syncAria(px) {
    const width = px || panel.getBoundingClientRect().width;
    handle.setAttribute('aria-valuemin', String(min));
    handle.setAttribute('aria-valuemax', String(max));
    handle.setAttribute('aria-valuenow', String(Math.round(width)));
  }

  function persist(px) {
    try { localStorage.setItem(storageKey, String(Math.round(px))); } catch (e) { /* private browsing */ }
  }

  function applyStoredWidth() {
    let stored = null;
    try { stored = localStorage.getItem(storageKey); } catch (e) { /* private browsing */ }
    const px = Number(stored);
    if (Number.isFinite(px) && px > 0) applyWidth(px);
  }
}

function isStacked() {
  return window.matchMedia && window.matchMedia(STACKED_QUERY).matches;
}
