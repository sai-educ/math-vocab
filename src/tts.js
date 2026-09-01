/* =========================================================================
   "Listen to an explanation" — Fish Audio text-to-speech.

   No API key lives in this file. By default the page calls the same-origin
   /api/tts endpoint (server.js locally, api/tts.js on Vercel). For a hosted
   static copy, pass ?ttsProxy=https://your-worker.workers.dev once; that URL
   is remembered in localStorage.
   ========================================================================= */

const DEFAULT_TTS_PROXY_URL = '/api/tts';

// Fish Audio "Voice Library" voices (fish.audio/app/m/<id>) offered in the
// header's Voice settings panel. "Random voice each time" draws only from
// this pool — keep it English-only: applying a non-English voice model to
// this app's English narration script would say English words in that
// voice's accent, not actually speak another language.
const TTS_VOICES = [
  { id: 'a71f0b05f92b4b749b477f5b1001c95f', label: 'Friendly Teen Voice' },
  { id: '933563129e564b19a115bedd57b7406a', label: 'Sarah' },
  { id: '5f9dc1849c7644eaa48df363d988ad0e', label: 'Storyteller' },
  { id: 'bd799bad679e4b259b7f21607590c00c', label: 'Snoop Dogg' },
  { id: 'ed2f0fe411dd4362bf9dfbd71544b258', label: 'Neil deGrasse Tyson' },
];
const TTS_VOICE_MODE_RANDOM = 'random';

// Not part of TTS_VOICES / the random pool above — see the comment on that
// array. Only reachable by picking it explicitly in the Voice settings
// panel, and only then does speakTerm() send Japanese text at all.
const TTS_VOICE_JA = { id: '35c8e5ae5239435f8d9c26c86802b86d', label: 'Japanese (Female)' };

const TTS_PROXY_URL = readTtsProxyUrl();
let ttsVoiceMode = readTtsVoiceMode();

// Fish Audio's own mp3s come back quiet — well under 0dBFS even at this
// voice's natural level — and an <audio> element's `.volume` tops out at 1
// (its own 100%), which still isn't loud enough. A Web Audio GainNode has no
// such ceiling, so playback is routed through one turned up past unity to
// compensate. Tuned for headroom against clipping on louder lines; raise it
// if words are still too quiet, lower it if loud ones start to crackle.
const TTS_GAIN = 2.4;

// termId -> object URL, so replaying a word doesn't call the API again.
const ttsCache = {};

let gainAudioCtx = null;
let gainNode = null;

/* Lazily creates one persistent AudioContext + GainNode for the page, then
   routes a given <audio> element's output through it. Safe to call more than
   once for the same element — createMediaElementSource() throws if called
   twice on one element, so a dataset flag guards the repeat call a cached
   replay (see the `ttsCache` branch below) would otherwise trigger. */
function routeThroughGain(audioEl) {
  if (audioEl.dataset.gainRouted) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return; // No Web Audio support — falls back to the element's own (quieter) output.

  if (!gainAudioCtx) {
    gainAudioCtx = new AudioCtx();
    gainNode = gainAudioCtx.createGain();
    gainNode.gain.value = TTS_GAIN;
    gainNode.connect(gainAudioCtx.destination);
  }
  if (gainAudioCtx.state === 'suspended') gainAudioCtx.resume();

  gainAudioCtx.createMediaElementSource(audioEl).connect(gainNode);
  audioEl.dataset.gainRouted = '1';
}

// Tracks whatever is currently in flight or playing, so a stale response —
// or a mute toggle, or picking a different word — can actually stop it
// instead of leaving a detached button's audio playing into the void.
let activeAbortController = null;
let activeAudioEl = null;

function stopSpeaking() {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
  if (activeAudioEl) {
    activeAudioEl.pause();
    activeAudioEl = null;
  }
}

function readTtsProxyUrl() {
  let configured = '';
  try {
    const params = new URLSearchParams(window.location.search);
    const hasParam = params.has('ttsProxy');
    const queryUrl = (params.get('ttsProxy') || '').trim();

    if (queryUrl) {
      localStorage.setItem(STORAGE_KEYS.ttsProxy, queryUrl);
      configured = queryUrl;
    } else if (hasParam) {
      // An explicitly empty ?ttsProxy= clears a previously stored override.
      // Without this escape hatch a single visit with a stale Worker URL
      // would keep hijacking /api/tts in that browser forever.
      localStorage.removeItem(STORAGE_KEYS.ttsProxy);
    } else {
      configured = (localStorage.getItem(STORAGE_KEYS.ttsProxy) || '').trim();
    }
  } catch (e) { /* storage unavailable — fall back to the default endpoint */ }
  return configured || DEFAULT_TTS_PROXY_URL;
}

function isSelectableVoiceId(id) {
  return id === TTS_VOICE_JA.id || TTS_VOICES.some((voice) => voice.id === id);
}

function readTtsVoiceMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ttsVoiceMode);
    if (stored === TTS_VOICE_MODE_RANDOM) return TTS_VOICE_MODE_RANDOM;
    if (stored && isSelectableVoiceId(stored)) return stored;
  } catch (e) { /* storage unavailable — fall back to random */ }
  return TTS_VOICE_MODE_RANDOM;
}

function setTtsVoiceMode(mode) {
  ttsVoiceMode = isSelectableVoiceId(mode) ? mode : TTS_VOICE_MODE_RANDOM;
  try { localStorage.setItem(STORAGE_KEYS.ttsVoiceMode, ttsVoiceMode); } catch (e) { /* private browsing */ }
}

function getTtsVoiceMode() {
  return ttsVoiceMode;
}

// Re-rolled on every call — that's the whole point of "random each time"
// rather than once per session.
function pickVoiceId() {
  if (ttsVoiceMode !== TTS_VOICE_MODE_RANDOM) return ttsVoiceMode;
  return TTS_VOICES[Math.floor(Math.random() * TTS_VOICES.length)].id;
}

async function speakTerm(t) {
  const btn = document.getElementById('listenBtn');
  const status = document.getElementById('listenStatus');
  const audioEl = document.getElementById('listenAudio');
  if (!btn || !audioEl) return;
  routeThroughGain(audioEl);

  // A second tap — or a fresh word — always cancels whatever came before,
  // rather than letting two requests race for the same audio element.
  stopSpeaking();

  if (!Sound.isOn()) {
    status.textContent = 'Sound is off — turn it on to listen.';
    status.className = '';
    return;
  }

  // Picked once per tap, up front, so the same voice is used for both the
  // cache lookup and (on a miss) the request that fills it.
  const voiceId = pickVoiceId();
  const cacheKey = `${t.id}:${voiceId}`;

  if (ttsCache[cacheKey]) {
    audioEl.src = ttsCache[cacheKey];
    activeAudioEl = audioEl;
    playQuietly(audioEl, status);
    return;
  }

  const controller = new AbortController();
  activeAbortController = controller;

  btn.disabled = true;
  // The button itself never changes — no spin, no label swap. The loading
  // state lives entirely in this status line, which is already wired up to
  // be announced to screen readers.
  status.textContent = 'Loading, please wait…';
  status.className = '';

  try {
    const res = await fetch(TTS_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: voiceId === TTS_VOICE_JA.id ? speechScriptForJapanese(t) : speechScriptFor(t),
        reference_id: voiceId,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      let message = `Request failed (${res.status}).`;
      try {
        const body = await res.json();
        if (body && body.error) message = body.error;
      } catch (e) { /* non-JSON error body — keep the status-code message */ }
      throw new Error(message);
    }
    const url = URL.createObjectURL(await res.blob());
    ttsCache[cacheKey] = url;
    // Superseded while the request was in flight (a newer word, a mute, a
    // second tap) — the fetch finished, but nothing should play it.
    if (activeAbortController !== controller) return;
    audioEl.src = url;
    activeAudioEl = audioEl;
    status.textContent = '';
    await audioEl.play();
  } catch (error) {
    if (error.name === 'AbortError') return;
    const hint = TTS_PROXY_URL === DEFAULT_TTS_PROXY_URL
      ? ' Start the local voice server with node server.js, or configure a Worker URL with ?ttsProxy=…'
      : '';
    status.textContent = `Could not load audio: ${error.message}${hint}`;
    status.className = 'err';
    Sound.play('error');
  } finally {
    if (activeAbortController === controller) activeAbortController = null;
    btn.disabled = false;
  }
}

function playQuietly(audioEl, status) {
  const attempt = audioEl.play();
  if (!attempt || !attempt.catch) return;
  attempt.catch((error) => {
    if (error.name === 'AbortError') return;
    status.textContent = `Could not play audio: ${error.message}`;
    status.className = 'err';
  });
}

// Object URLs live for the whole session; release them when the page closes.
window.addEventListener('pagehide', () => {
  Object.values(ttsCache).forEach((url) => URL.revokeObjectURL(url));
});
