/* =========================================================================
   Reset progress: a small text control in the footer (where "About &
   licence" used to live — that's now reachable from the header instead)
   that clears explored-word history and the onboarding flag.

   Two-step (idle -> confirm) in place, rather than a modal, so it stays a
   single quiet line in the footer until someone actually means to use it.
   ========================================================================= */

const ResetProgress = (function () {
  function init() {
    const btn = document.getElementById('resetProgressBtn');
    const confirm = document.getElementById('resetProgressConfirm');
    const yesBtn = document.getElementById('resetProgressYes');
    const noBtn = document.getElementById('resetProgressNo');

    btn.addEventListener('click', () => {
      btn.hidden = true;
      confirm.hidden = false;
      announce('Reset progress? This clears every word you have explored. Yes or no?');
      noBtn.focus();
    });

    noBtn.addEventListener('click', cancel);

    yesBtn.addEventListener('click', () => {
      try {
        localStorage.removeItem(STORAGE_KEYS.onboarded);
        localStorage.removeItem(STORAGE_KEYS.visited);
      } catch (e) { /* private browsing — nothing was persisted anyway */ }
      location.reload();
    });

    function cancel() {
      confirm.hidden = true;
      btn.hidden = false;
      btn.focus();
    }
  }

  return { init };
}());
