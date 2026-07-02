/**
 * Fish Audio TTS proxy — Cloudflare Worker
 * ------------------------------------------------------------------
 * Purpose: keeps the Fish Audio API key OFF the public website.
 * The static site (index.html) calls THIS worker; this worker calls
 * Fish Audio using a secret key that only lives here, never in the
 * public repo.
 *
 * Deployment: see the "Voice explanations" section in README.md for
 * plain-language, step-by-step instructions (no coding required
 * beyond copy/paste).
 * ------------------------------------------------------------------
 */

const MAX_TEXT_LENGTH = 2000;

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== "POST") {
      return json({ error: "Only POST requests are supported." }, 405);
    }

    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      return json({ error: "Request body must be JSON." }, 400);
    }

    const text = (payload && payload.text || "").toString().trim();
    if (!text) {
      return json({ error: "Missing 'text' field." }, 400);
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return json({ error: `'text' is too long (max ${MAX_TEXT_LENGTH} characters).` }, 400);
    }

    // env.FISH_API_KEY and env.FISH_VOICE_ID are set as Worker secrets
    // in the Cloudflare dashboard — see README.md. They are never sent
    // to, or visible from, the browser.
    if (!env.FISH_API_KEY) {
      return json({ error: "Server is not configured yet (missing FISH_API_KEY secret)." }, 500);
    }

    const referenceId = (payload && payload.reference_id) || env.FISH_VOICE_ID;

    let fishRes;
    try {
      fishRes = await fetch("https://api.fish.audio/v1/tts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.FISH_API_KEY}`,
          "Content-Type": "application/json",
          "model": "s2.1-pro-free",
        },
        body: JSON.stringify({
          text,
          reference_id: referenceId,
          format: "mp3",
        }),
      });
    } catch (e) {
      return json({ error: "Could not reach Fish Audio.", detail: String(e) }, 502);
    }

    if (!fishRes.ok) {
      const detail = await fishRes.text().catch(() => "");
      return json({ error: `Fish Audio returned an error (${fishRes.status}).`, detail }, 502);
    }

    const audioBuffer = await fishRes.arrayBuffer();
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        ...corsHeaders(),
      },
    });
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}
