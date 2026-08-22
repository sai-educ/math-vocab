/* =========================================================================
   "Listen to an explanation" — Fish Audio text-to-speech.

   No API key lives in this file. By default the page calls the same-origin
   /api/tts endpoint (server.js locally, api/tts.js on Vercel). For a hosted
   static copy, pass ?ttsProxy=https://your-worker.workers.dev once; that URL
   is remembered in localStorage.
   ========================================================================= */

const DEFAULT_TTS_PROXY_URL = '/api/tts';
const TTS_VOICE_ID = 'd38790551b0548ba9de248dbd10b74e1';
const TTS_PROXY_URL = readTtsProxyUrl();

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

  if (ttsCache[t.id]) {
    audioEl.src = ttsCache[t.id];
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
      body: JSON.stringify({ text: speechScriptFor(t), reference_id: TTS_VOICE_ID }),
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
    ttsCache[t.id] = url;
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
