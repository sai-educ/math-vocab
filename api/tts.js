const MAX_TEXT_LENGTH = 2000;
const MAX_BODY_BYTES = 32 * 1024;
const DEFAULT_MODEL = "s2.1-pro-free";

module.exports = async function handler(request, response) {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method !== "POST") {
    return json(response, 405, { error: "Only POST requests are supported." });
  }

  if (!process.env.FISH_API_KEY) {
    return json(response, 500, {
      error: "Voice server is missing FISH_API_KEY. Add it in Vercel Project Settings -> Environment Variables.",
    });
  }

  let payload;
  try {
    payload = await jsonBody(request);
  } catch (error) {
    return json(response, error.code === "BODY_TOO_LARGE" ? 413 : 400, {
      error: error.code === "BODY_TOO_LARGE" ? "Request body is too large." : "Request body must be JSON.",
    });
  }

  const text = String((payload && payload.text) || "").trim();
  if (!text) {
    return json(response, 400, { error: "Missing 'text' field." });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return json(response, 400, { error: `'text' is too long (max ${MAX_TEXT_LENGTH} characters).` });
  }

  const fishBody = {
    text,
    format: "mp3",
  };

  const referenceId = stringOrEmpty((payload && payload.reference_id) || process.env.FISH_VOICE_ID);
  if (referenceId) {
    fishBody.reference_id = referenceId;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let fishResponse;
  try {
    fishResponse = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.FISH_API_KEY}`,
        "Content-Type": "application/json",
        model: process.env.FISH_TTS_MODEL || DEFAULT_MODEL,
      },
      body: JSON.stringify(fishBody),
    });
  } catch (error) {
    clearTimeout(timeout);
    return json(response, 502, {
      error: error.name === "AbortError" ? "Fish Audio request timed out." : "Could not reach Fish Audio.",
    });
  }
  clearTimeout(timeout);

  if (!fishResponse.ok) {
    const detail = await fishResponse.text().catch(() => "");
    return json(response, 502, {
      error: `Fish Audio returned an error (${fishResponse.status}).`,
      detail: safeDetail(detail),
    });
  }

  const audio = Buffer.from(await fishResponse.arrayBuffer());
  response.statusCode = 200;
  response.setHeader("Content-Type", "audio/mpeg");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Length", String(audio.length));
  response.end(audio);
};

async function jsonBody(request) {
  let body;

  try {
    body = request.body;
  } catch (error) {
    throw new Error("Request body must be JSON.");
  }

  if (body && typeof body === "object" && !Buffer.isBuffer(body)) {
    return body;
  }

  if (typeof body === "string") {
    return JSON.parse(body || "{}");
  }

  if (Buffer.isBuffer(body)) {
    return JSON.parse(body.toString("utf8") || "{}");
  }

  return JSON.parse(await readRequestBody(request, MAX_BODY_BYTES));
}

function readRequestBody(request, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let done = false;

    request.on("data", (chunk) => {
      if (done) return;
      size += chunk.length;
      if (size > limit) {
        done = true;
        const error = new Error("Request body is too large.");
        error.code = "BODY_TOO_LARGE";
        reject(error);
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on("end", () => {
      if (!done) resolve(Buffer.concat(chunks).toString("utf8"));
    });

    request.on("error", (error) => {
      if (!done) reject(error);
    });
  });
}

function stringOrEmpty(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function safeDetail(detail) {
  return String(detail || "").slice(0, 1000);
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}
