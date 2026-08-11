/* =========================================================================
   Resizable panels.

   A real WAI-ARIA "window splitter": role="separator" with a numeric value,
   draggable with a pointer and adjustable with the arrow keys, so resizing
   never depends on being able to see or operate a mouse. Sizes persist per
   browser and are re-clamped against the current available space on every
   drag, so two panels can never squeeze a third down to nothing.

   Two of the three splitters resize width (the sidebar and the definition
   panel, either side of the graph); one resizes height (the topic list
   against the word list, inside the sidebar). `axis` picks between them.
   ========================================================================= */

const STACKED_QUERY = '(max-width: 1100px)';
const STACKED_TOPICS_QUERY = '(max-width: 760px)';
const MIN_GRAPH_WIDTH = 280;
const MIN_VOCAB_HEIGHT = 90;
const KEY_STEP = 24;

const AXES = {
  x: { size: 'width', pointerPos: 'clientX', flexProp: 'flexBasis', styleProp: 'width', keyNeg: 'ArrowLeft', keyPos: 'ArrowRight' },
  y: { size: 'height', pointerPos: 'clientY', flexProp: 'flexBasis', styleProp: 'height', keyNeg: 'ArrowUp', keyPos: 'ArrowDown' },
};

function initPanelResizers() {
  const leftPanel = document.getElementById('leftPanel');
  const detailPanel = document.getElementById('detail');
  const resizerLeft = document.getElementById('resizerLeft');
  const resizerDetail = document.getElementById('resizerDetail');
  const topicsSection = document.getElementById('topicsSection');
  const vocabSection = document.getElementById('vocabSection');
  const resizerTopics = document.getElementById('resizerTopics');

  if (leftPanel && detailPanel && resizerLeft && resizerDetail) {
    setupResizer({
      handle: resizerLeft, panel: leftPanel, axis: 'x', direction: 1,
      min: 220, max: 420, storageKey: STORAGE_KEYS.leftPanelWidth,
      isDisabled: isStacked,
      effectiveMax: () => availableAcross(window.innerWidth, MIN_GRAPH_WIDTH, 220, 420),
    });
    setupResizer({
      handle: resizerDetail, panel: detailPanel, axis: 'x', direction: -1,
      min: 300, max: 560, storageKey: STORAGE_KEYS.detailPanelWidth,
      isDisabled: isStacked,
      effectiveMax: () => availableAcross(window.innerWidth, MIN_GRAPH_WIDTH, 300, 560),
    });
  }

  if (topicsSection && vocabSection && resizerTopics) {
    setupResizer({
      handle: resizerTopics, panel: topicsSection, axis: 'y', direction: 1,
      min: 100, max: 480, storageKey: STORAGE_KEYS.topicsSectionHeight,
      isDisabled: isTopicsStacked,
      effectiveMax: () => availableAcross(leftPanel.getBoundingClientRect().height, MIN_VOCAB_HEIGHT, 100, 480),
    });
  }
}

/* The container's total size is fixed (flex always fills it exactly), so
   the other panel's size is never an independent quantity — it is always
   `total - panel`. The only thing that actually constrains how big `panel`
   can grow is the other panel's own minimum, not its current size; folding
   the current size into this formula as well would double-subtract it. */
function availableAcross(totalSpace, minOther, min, max) {
  return Math.max(min, Math.min(max, totalSpace - minOther));
}

function setupResizer({ handle, panel, axis, direction, min, max, storageKey, isDisabled, effectiveMax }) {
  const a = AXES[axis];
  let dragging = false;
  let startPos = 0;
  let startSize = 0;

  applyStoredSize();
  syncAria();

  handle.addEventListener('pointerdown', (event) => {
    if (isDisabled() || event.button !== 0) return;
    dragging = true;
    startPos = event[a.pointerPos];
    startSize = panel.getBoundingClientRect()[a.size];
    handle.classList.add('dragging');
    handle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  handle.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const delta = (event[a.pointerPos] - startPos) * direction;
    applySize(startSize + delta);
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    persist(panel.getBoundingClientRect()[a.size]);
  };
  handle.addEventListener('pointerup', endDrag);
  handle.addEventListener('pointercancel', endDrag);
  handle.addEventListener('lostpointercapture', endDrag);

  handle.addEventListener('keydown', (event) => {
    let sign = 0;
    if (event.key === a.keyNeg) sign = -1;
    else if (event.key === a.keyPos) sign = 1;
    else return;
    event.preventDefault();
    const next = panel.getBoundingClientRect()[a.size] + KEY_STEP * sign * direction;
    applySize(next);
    persist(panel.getBoundingClientRect()[a.size]);
  });

  function applySize(px) {
    const clamped = Math.min(effectiveMax(), Math.max(min, px));
    panel.style[a.flexProp] = `${clamped}px`;
    panel.style[a.styleProp] = `${clamped}px`;
    syncAria(clamped);
  }

  function syncAria(px) {
    const size = px || panel.getBoundingClientRect()[a.size];
    handle.setAttribute('aria-valuemin', String(min));
    handle.setAttribute('aria-valuemax', String(max));
    handle.setAttribute('aria-valuenow', String(Math.round(size)));
  }

  function persist(px) {
    try { localStorage.setItem(storageKey, String(Math.round(px))); } catch (e) { /* private browsing */ }
  }

  function applyStoredSize() {
    let stored = null;
    try { stored = localStorage.getItem(storageKey); } catch (e) { /* private browsing */ }
    const px = Number(stored);
    if (Number.isFinite(px) && px > 0) applySize(px);
  }
}

function isStacked() {
  return window.matchMedia && window.matchMedia(STACKED_QUERY).matches;
}

function isTopicsStacked() {
  return window.matchMedia && window.matchMedia(STACKED_TOPICS_QUERY).matches;
}
