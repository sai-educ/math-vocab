/* =========================================================================
   The "Cat" menu in the header.

   Split out from src/cat.js so that file stays the sprite engine and this
   one stays ordinary UI chrome: a disclosure panel with a visibility toggle,
   a colour picker, and the tip button.

   That tip button is the accessibility hinge of the whole feature. The cat
   itself is decorative — aria-hidden, not focusable, offering its hints on
   its own timer — which is only defensible because everything it knows is
   also available here, from a real control that keyboard and screen reader
   users can reach.
   ========================================================================= */

const CatSettings = (function () {
  const FOCUSABLE = 'input:not([disabled]),button:not([disabled])';

  let panel, panelBtn, showCheckbox, skinPicker, tipBtn, lastFocused;

  /* Every swatch is the same 64px icon under the colourway's own CSS filter,
     the same way the sprite is tinted — so a swatch cannot drift out of sync
     with the cat it is promising. */
  function buildSkinPicker() {
    skinPicker.innerHTML = CAT_SKINS.map((name) => `
      <label class="cat-skin-option">
        <input type="radio" name="catSkin" value="${name}">
        <img src="assets/cat/cat_icon.png" alt="" width="22" height="22"
             style="filter:${CAT_SKIN_FILTERS[name] || 'none'}">
        <span>${CAT_SKIN_LABELS[name]}</span>
      </label>
    `).join('');

    skinPicker.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.checked = input.value === CatWidget.getSkin();
      input.addEventListener('change', () => {
        if (!input.checked) return;
        CatWidget.setSkin(input.value);
        Sound.play('toggle');
      });
    });
  }

  /* The colour picker and the tip button are meaningless with the cat turned
     off, so they go with it rather than sitting there inert. */
  function syncControls() {
    const on = CatWidget.isVisible();
    showCheckbox.checked = on;
    skinPicker.closest('.cat-skin-picker-wrap').hidden = !on;
    tipBtn.disabled = !on;
  }

  function open() {
    lastFocused = document.activeElement;
    panel.hidden = false;
    panelBtn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => panel.classList.add('open'));
    showCheckbox.focus();
    Sound.play('open');
  }

  function close() {
    panel.classList.remove('open');
    panelBtn.setAttribute('aria-expanded', 'false');
    Sound.play('close');
    const finish = () => { panel.hidden = true; };
    if (REDUCED_MOTION) finish();
    else setTimeout(finish, 180);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function trapFocus(event) {
    const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
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

  function bind() {
    panelBtn.addEventListener('click', () => (panel.hidden ? open() : close()));

    document.addEventListener('click', (event) => {
      if (panel.hidden) return;
      if (!panel.contains(event.target) && event.target !== panelBtn && !panelBtn.contains(event.target)) close();
    });

    document.addEventListener('keydown', (event) => {
      if (panel.hidden) return;
      if (event.key === 'Escape') { close(); panelBtn.focus(); return; }
      if (event.key === 'Tab') trapFocus(event);
    });

    showCheckbox.addEventListener('change', () => {
      CatWidget.setVisible(showCheckbox.checked);
      syncControls();
      Sound.play('toggle');
    });

    tipBtn.addEventListener('click', () => {
      CatWidget.tip();
      Sound.play('toggle');
    });
  }

  /* Runs after CatWidget.init(), which is what loads the stored colour and
     visibility this panel then reflects. */
  function init() {
    panelBtn = document.getElementById('catSettingsBtn');
    panel = document.getElementById('catSettingsPanel');
    showCheckbox = document.getElementById('catShowCheckbox');
    skinPicker = document.getElementById('catSkinPicker');
    tipBtn = document.getElementById('catTipBtn');
    if (!panelBtn || !panel) return;

    panelBtn.querySelector('.btn-icon').innerHTML = iconSvg('cat', { size: 18 });
    buildSkinPicker();
    syncControls();
    bind();
  }

  return { init };
}());
