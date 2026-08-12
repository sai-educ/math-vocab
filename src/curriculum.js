/* =========================================================================
   Curriculum picker: choose which standards populate the graph.

   A small popover off the "Curriculum" button, top-right of the graph panel
   (see #graphTopRight in app_template.html). Checking a box adds that
   curriculum's terms everywhere at once — topic badges and counts, the word
   list, search, the 3D graph — by changing one shared filter (activeStandards
   in constants.js) that every render function already reads.
   ========================================================================= */

const Curriculum = (function () {
  let btn, panel, countEl, checkboxes, lastFocused;

  const FOCUSABLE = 'input:not([disabled]),button:not([disabled])';

  function init() {
    btn = document.getElementById('curriculumBtn');
    panel = document.getElementById('curriculumPanel');
    countEl = document.getElementById('curriculumCount');
    checkboxes = [...panel.querySelectorAll('input[type="checkbox"]')];

    panel.querySelectorAll('[data-flag]').forEach((el) => {
      el.innerHTML = flagSvg(el.dataset.flag);
    });

    checkboxes.forEach((cb) => {
      cb.checked = activeStandards.has(cb.value);
      cb.addEventListener('change', onChange);
    });
    syncButton();

    btn.addEventListener('click', () => (panel.hidden ? open() : close()));

    document.addEventListener('click', (event) => {
      if (panel.hidden) return;
      if (!panel.contains(event.target) && event.target !== btn && !btn.contains(event.target)) close();
    });

    document.addEventListener('keydown', (event) => {
      if (panel.hidden) return;
      if (event.key === 'Escape') { close(); btn.focus(); return; }
      if (event.key === 'Tab') trapFocus(event);
    });
  }

  function trapFocus(event) {
    const items = [...panel.querySelectorAll(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function open() {
    lastFocused = document.activeElement;
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => panel.classList.add('open'));
    checkboxes[0].focus();
    Sound.play('open');
  }

  function close() {
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    Sound.play('close');
    const finish = () => { panel.hidden = true; };
    if (REDUCED_MOTION) finish();
    else setTimeout(finish, 180);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function onChange() {
    const next = new Set(checkboxes.filter((cb) => cb.checked).map((cb) => cb.value));
    // Refuse to leave every curriculum off — re-check the box that would
    // have emptied the set rather than stranding the app with nothing to
    // show, since there is no other control on this panel to recover from it.
    if (!next.size) {
      this.checked = true;
      return;
    }
    setActiveStandards(next);
    syncButton();
    Sound.play('toggle');
    applyStandardsChange();
  }

  function syncButton() {
    countEl.textContent = String(activeStandards.size);
    btn.setAttribute(
      'aria-label',
      `Curriculum. ${[...activeStandards].map((c) => STANDARD_LABELS[c]).join(', ')} selected. Choose which curricula to show.`,
    );
  }

  return { init };
}());
