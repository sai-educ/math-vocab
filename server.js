/*
 * Local static server + Fish Audio TTS proxy.
 *
 * Run with:
 *   node server.js
 *
 * Secrets are read from the environment or from .env.local / .env.
 */

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");

const ROOT = __dirname;
const MAX_TEXT_LENGTH = 2000;
const MAX_BODY_BYTES = 32 * 1024;
const DEFAULT_MODEL = "s2.1-pro-free";

loadEnvFile(path.join(ROOT, ".env.local"));
loadEnvFile(path.join(ROOT, ".env"));

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";

// Mirrors vercel.json's "cleanUrls": true for local dev — every page is
// reachable at its extensionless path, and a request for the .html file
// itself redirects there, so a browser's address bar never shows the
// extension either way.
const CLEAN_ROUTES = {
  "/": "index.html",
  "/app": "app.html",
  "/roadmap": "roadmap.html",
  "/mapping": "mapping.html",
};
const HTML_TO_CLEAN_PATH = Object.fromEntries(
  Object.entries(CLEAN_ROUTES)
    .filter(([clean]) => clean !== "/")
    .map(([clean, file]) => [`/${file}`, clean])
);
HTML_TO_CLEAN_PATH["/index.html"] = "/";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".glb": "model/gltf-binary",
};

const server = http.createServer(async (request, response) => {
  let url;
  try {
    url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  } catch (error) {
    return json(response, 400, { error: "Invalid request URL." });
  }

  if (url.pathname === "/api/tts") {
    return handleTts(request, response);
  }

  return serveStatic(request, response, url.pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`Math Vocabulary app: http://${HOST}:${PORT}`);
  console.log("Fish Audio proxy:   /api/tts");
});

async function handleTts(request, response) {
  if (request.method === "OPTIONS") {
    response.writeHead(204, corsHeaders());
    response.end();
    return;
  }

  if (request.method !== "POST") {
    return json(response, 405, { error: "Only POST requests are supported." });
  }

  if (!process.env.FISH_API_KEY) {
    return json(response, 500, {
      error: "Voice server is missing FISH_API_KEY. Add it to .env.local or the process environment.",
    });
  }

  let payload;
  try {
    payload = JSON.parse(await readRequestBody(request, MAX_BODY_BYTES));
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

  const requestBody = {
    text,
    format: "mp3",
  };

  const referenceId = stringOrEmpty((payload && payload.reference_id) || process.env.FISH_VOICE_ID);
  if (referenceId) {
    requestBody.reference_id = referenceId;
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
      body: JSON.stringify(requestBody),
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
  response.writeHead(200, {
    ...corsHeaders(),
    "Content-Type": "audio/mpeg",
    "Cache-Control": "no-store",
    "Content-Length": String(audio.length),
  });
  response.end(audio);
}

function serveStatic(request, response, pathname) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(response, 405, { error: "Only GET and HEAD requests are supported." });
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch (error) {
    return json(response, 400, { error: "Invalid path." });
  }

  if (HTML_TO_CLEAN_PATH[decodedPath]) {
    response.writeHead(308, { Location: HTML_TO_CLEAN_PATH[decodedPath] });
    response.end();
    return;
  }

  const relativePath = CLEAN_ROUTES[decodedPath] ? `./${CLEAN_ROUTES[decodedPath]}` : `.${decodedPath}`;
  const filePath = path.resolve(ROOT, relativePath);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    return json(response, 403, { error: "Forbidden." });
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const headers = {
      "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Content-Length": String(stats.size),
      "Cache-Control": "no-store",
    };
    response.writeHead(200, headers);
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    fs.createReadStream(filePath).pipe(response);
  });
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

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function stringOrEmpty(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function safeDetail(detail) {
  return String(detail || "").slice(0, 1000);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(response, status, body) {
  const text = JSON.stringify(body);
  response.writeHead(status, {
    ...corsHeaders(),
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": String(Buffer.byteLength(text)),
  });
  response.end(text);
}
