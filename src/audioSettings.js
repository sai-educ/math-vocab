/* =========================================================================
   The "Voice" menu in the header.

   Split out the same way src/catSettings.js is split from src/cat.js: this
   file is only the disclosure-panel UI. The voice list, the "random each
   time" logic, and persistence all live in src/tts.js — this just reflects
   and edits that state.
   ========================================================================= */

const AudioSettings = (function () {
  const FOCUSABLE = 'input:not([disabled]),button:not([disabled])';

  let panel, panelBtn, voicePicker;

  /* "Random voice each time" sits in the same flat radio group as the named
     voices, rather than behind a separate mode toggle — one list, every
     option reachable the same way, nothing hidden pending a prior choice.
     TTS_VOICE_JA is listed here but never in "random each time" — see the
     comment on it in src/tts.js for why. */
  function buildVoicePicker() {
    const options = [
      { id: TTS_VOICE_MODE_RANDOM, label: 'Random voice each time' },
      ...TTS_VOICES,
      TTS_VOICE_JA,
    ];
    voicePicker.innerHTML = options.map((voice) => `
      <label class="audio-voice-option">
        <input type="radio" name="ttsVoice" value="${voice.id}">
        <span>${voice.label}</span>
      </label>
    `).join('');

    voicePicker.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.checked = input.value === getTtsVoiceMode();
      input.addEventListener('change', () => {
        if (!input.checked) return;
        setTtsVoiceMode(input.value);
        Sound.play('toggle');
      });
    });
  }

  function open() {
    panel.hidden = false;
    panelBtn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => panel.classList.add('open'));
    voicePicker.querySelector('input:checked').focus();
    Sound.play('open');
  }

  function close() {
    panel.classList.remove('open');
    panelBtn.setAttribute('aria-expanded', 'false');
    Sound.play('close');
    const finish = () => { panel.hidden = true; };
    if (REDUCED_MOTION) finish();
    else setTimeout(finish, 180);
    panelBtn.focus();
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
      if (event.key === 'Escape') { close(); return; }
      if (event.key === 'Tab') trapFocus(event);
    });
  }

  function init() {
    panelBtn = document.getElementById('audioSettingsBtn');
    panel = document.getElementById('audioSettingsPanel');
    voicePicker = document.getElementById('audioVoicePicker');
    if (!panelBtn || !panel) return;

    panelBtn.querySelector('.btn-icon').innerHTML = iconSvg('speaker', { size: 18 });
    buildVoicePicker();
    bind();
  }

  return { init };
}());
