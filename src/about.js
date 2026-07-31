/* =========================================================================
   About dialog: attribution and licence.

   Implemented as a modal dialog rather than a link so the credit is always
   one tap away without navigating a child off the page. Focus is trapped
   while it is open and returned to the trigger when it closes.
   ========================================================================= */

const About = (function () {
  let overlay, dialog, lastFocused;

  const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function init() {
    overlay = document.getElementById('aboutOverlay');
    dialog = document.getElementById('aboutDialog');

    document.getElementById('aboutBtn').addEventListener('click', open);
    document.getElementById('statsAboutBtn').addEventListener('click', open);
    document.getElementById('aboutClose').addEventListener('click', close);

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
    // One frame before adding .open so the CSS transition has a start state.
    requestAnimationFrame(() => overlay.classList.add('open'));
    document.getElementById('aboutClose').focus();
  }

  function close() {
    overlay.classList.remove('open');
    const finish = () => {
      overlay.hidden = true;
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    };
    if (REDUCED_MOTION) finish();
    else setTimeout(finish, 220);
  }

  return { init, open, close };
}());
