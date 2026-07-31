/* =========================================================================
   Interaction sounds, via cuelume (MIT, bundled into this page by
   build_html.py — synthesized live, so there are no audio files to load and
   it still works with no network).

   The design rule here is that a sound reports *what happened*, so a child
   can tell a grade from a topic from a word without looking:

     grade   bloom    a warm swell — something big opened
     topic   droplet  a downward glide — you went one level deeper
     word    chime    the payoff, the brightest sound in the set
     back    page     a paper flick — you left, you did not arrive
     search  whisper  the quietest cue, because results fire while typing

   The Listen button is deliberately silent. Its job is speech, and a chime
   in front of the voice would step on the first word.

   Sound is on by default and the toggle is in the header, one tap away —
   thirty tablets in one room is exactly the case a mute button exists for.
   ========================================================================= */

const SOUND_STORAGE_KEY = 'mathVocabSoundOn';
const SOUND_VOLUME = 0.55;

const CUES = {
  grade: 'bloom',
  topic: 'droplet',
  word: 'chime',
  back: 'page',
  search: 'whisper',
  open: 'ready',
  close: 'press',
  toggle: 'toggle',
  launch: 'success',
  error: 'error',
};

const Sound = (function () {
  let on = true;

  function available() {
    return typeof Cuelume !== 'undefined' && Cuelume;
  }

  function load() {
    try {
      const stored = localStorage.getItem(SOUND_STORAGE_KEY);
      if (stored !== null) on = stored === '1';
    } catch (e) { /* private browsing — fall back to the default */ }
  }

  function persist() {
    try { localStorage.setItem(SOUND_STORAGE_KEY, on ? '1' : '0'); } catch (e) { /* ignore */ }
  }

  function apply() {
    if (available()) {
      Cuelume.setEnabled(on);
      Cuelume.setVolume(SOUND_VOLUME);
    }
  }

  return {
    init() {
      load();
      apply();
    },

    /** Play an app event's cue. Unknown names are ignored rather than throwing. */
    play(event) {
      const cue = CUES[event];
      if (cue && available()) Cuelume.play(cue);
    },

    isOn() { return on; },

    setOn(value) {
      on = !!value;
      persist();
      apply();
      // Play the confirmation *after* enabling, so turning sound back on is
      // audible and turning it off is silent.
      if (on) this.play('toggle');
    },

    toggle() {
      this.setOn(!on);
      return on;
    },
  };
}());
