/* =========================================================================
   About dialog: attribution and licence.

   Implemented as a modal dialog rather than a link so the credit is always
   one tap away without navigating a child off the page. Focus is trapped
   while it is open and returned to the trigger when it closes.
   ========================================================================= */

const About = (function () {
  let overlay, dialog, scrollEl, closeXBtn, lastFocused;

  const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function init() {
    overlay = document.getElementById('aboutOverlay');
    dialog = document.getElementById('aboutDialog');
    scrollEl = document.getElementById('aboutScroll');
    closeXBtn = document.getElementById('aboutCloseX');

    const aboutBtn = document.getElementById('aboutBtn');
    aboutBtn.querySelector('.btn-icon').innerHTML = iconSvg('info', { size: 18 });
    document.getElementById('aboutClose').insertAdjacentHTML(
      'afterbegin', iconSvg('close', { size: 18 }),
    );
    closeXBtn.innerHTML = iconSvg('close', { size: 16 });

    aboutBtn.addEventListener('click', open);
    document.getElementById('statsAboutBtn').addEventListener('click', open);
    document.getElementById('aboutClose').addEventListener('click', close);
    closeXBtn.addEventListener('click', close);

    // Clicking the backdrop (but not the dialog itself) dismisses.
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });

    document.addEventListener('keydown', (event) => {
      if (overlay.hidden) return;
      if (event.key === 'Escape') { close(); return; }
      if (event.key === 'Tab') trapFocus(event);
    });
  }

  function trapFocus(event) {
    const items = [...dialog.querySelectorAll(FOCUSABLE)];
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
    overlay.hidden = false;
    // Reset scroll and focus the top-right close button (not the one at the
    // bottom) — focusing a control below the fold would otherwise scroll
    // the dialog straight past the heading to reveal it.
    scrollEl.scrollTop = 0;
    // One frame before adding .open so the CSS transition has a start state.
    requestAnimationFrame(() => overlay.classList.add('open'));
    closeXBtn.focus();
    Sound.play('open');
  }

  function close() {
    overlay.classList.remove('open');
    Sound.play('close');
    const finish = () => {
      overlay.hidden = true;
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    };
    if (REDUCED_MOTION) finish();
    else setTimeout(finish, 220);
  }

  return { init, open, close };
}());
