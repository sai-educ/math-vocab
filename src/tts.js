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

// termId -> object URL, so replaying a word doesn't call the API again.
const ttsCache = {};

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

function speechScriptFor(t) {
  let script = `${t.term}. ${t.definition}`;
  if (t.example) script += ` For example: ${t.example}`;
  return script;
}

async function speakTerm(t) {
  const btn = document.getElementById('listenBtn');
  const btnText = document.getElementById('listenBtnText');
  const status = document.getElementById('listenStatus');
  const audioEl = document.getElementById('listenAudio');
  if (!btn || !audioEl) return;

  if (ttsCache[t.id]) {
    audioEl.src = ttsCache[t.id];
    playQuietly(audioEl, status);
    return;
  }

  btn.disabled = true;
  btn.classList.add('loading');
  btnText.textContent = 'Loading audio…';
  status.textContent = '';
  status.className = '';

  try {
    const res = await fetch(TTS_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: speechScriptFor(t), reference_id: TTS_VOICE_ID }),
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
    audioEl.src = url;
    await audioEl.play();
  } catch (error) {
    const hint = TTS_PROXY_URL === DEFAULT_TTS_PROXY_URL
      ? ' Start the local voice server with node server.js, or configure a Worker URL with ?ttsProxy=…'
      : '';
    status.textContent = `Could not load audio: ${error.message}${hint}`;
    status.className = 'err';
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
    btnText.textContent = 'Listen to an explanation';
  }
}

function playQuietly(audioEl, status) {
  const attempt = audioEl.play();
  if (!attempt || !attempt.catch) return;
  attempt.catch((error) => {
    status.textContent = `Could not play audio: ${error.message}`;
    status.className = 'err';
  });
}

// Object URLs live for the whole session; release them when the page closes.
window.addEventListener('pagehide', () => {
  Object.values(ttsCache).forEach((url) => URL.revokeObjectURL(url));
});
