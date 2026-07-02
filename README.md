# Math Vocabulary Knowledge Graph (K–5, Common Core aligned)

An open-access, interactive vocabulary bank for elementary math word-problem terms — 189 terms across all 6 grade bands (K–5) and every Common Core math domain (Counting & Cardinality, Operations & Algebraic Thinking, Number & Operations in Base Ten, Number & Operations—Fractions, Measurement & Data, Geometry).

## How to use it

Open `index.html` in any browser. A yellow pulsing highlight walks you through the flow: it starts on the grade row up top, moves to the topic list once a grade is picked, then to the vocabulary list once a topic is picked. The 3D graph in the center auto-rotates on its own and can also be freely dragged (mouse or touch/iPad) at any time. As you drill down, the camera flies to frame the grade → topic → word you picked, and a glowing label pops onto that node (grade letter on the blue node, topic name + icon on the pink node, word + a symbol on the green node) — the same info also appears in full on the right-hand definition panel.

## Files

- `index.html` — the interactive app (self-contained, single file). Requires an internet connection the first time it's opened, since the 3D graph loads Three.js, an OrbitControls add-on, and GSAP from CDNs; if any of those fail, the graph area shows a fallback message (or degrades gracefully — e.g. no drag-rotate) while the rest of the app (topics, vocabulary, definitions, search) keeps working fully offline.
- Icons on the graph nodes use Unicode emoji — a free, open, dependency-free icon set that renders natively on every platform including iPad, with no external asset loading required. Swap in an SVG icon library later if a more custom look is wanted.
- `vocab_data.json` — the raw dataset (term, grade, Common Core domain/standard code, definition, example, misconception) that powers the app.
- `vocab_bank/grade-*.md` — the same content as human-readable Markdown, one file per grade. This is the source of truth for editing/reviewing content and the most git-friendly format for tracking changes over time.
- `build_data.py` — the script that generates `vocab_data.json` and the Markdown files from a single Python data structure. To edit or extend the vocabulary bank, edit the `DATA` dictionary in this file and re-run it (`python3 build_data.py`).
- `index_template.html` — the actual source code of the app (layout, styles, the 3D knowledge graph, the Listen button, etc.), with one placeholder (`__VOCAB_DATA__`) where the vocabulary data gets inserted.
- `build_html.py` — regenerates `index.html` by combining `index_template.html` with `vocab_data.json`. Run this after `build_data.py` whenever the content changes: `python3 build_data.py && python3 build_html.py`.
- `fish-audio-worker.js` — a small server-side proxy (Cloudflare Worker) that powers the "Listen to an explanation" button. See below for what it does and how to turn it on.

## Voice explanations (Fish Audio text-to-speech)

Each word's detail panel has a **Listen to an explanation** button that reads the term, its definition, and its example out loud, using Fish Audio's `s2.1-pro-free` voice model.

**Why this needs a separate piece (`fish-audio-worker.js`) instead of just calling Fish Audio from `index.html` directly:** this site is a public, open-access static page. Anything written directly into `index.html` — including an API key — is visible to literally anyone who views the page source or looks at the GitHub repo. If we put a Fish Audio API key straight into the page, anyone could copy it and use it under your account. So instead, the key lives only inside a small proxy service that you deploy yourself; `index.html` talks to *that* proxy, and the proxy is the only thing that ever sees the real key.

**First, rotate your API key.** The key that was shared while building this was typed into a chat conversation, which should be treated as exposed. Before deploying anything public, go to your Fish Audio dashboard and generate a new key. Use the new one in the steps that follow.

### Local setup

This is the fastest way to run the app with working voice on your own computer:

1. Copy `.env.example` to `.env.local`.
2. Put your rotated Fish Audio key in `.env.local` as `FISH_API_KEY=...`.
3. Run `node server.js`.
4. Open `http://localhost:4173`.

The page calls `/api/tts`, and `server.js` calls Fish Audio with your server-side key. `.env.local` is ignored by git so the key does not get committed.

### Vercel setup

Yes, you can deploy this directly on Vercel. Vercel serves the static app and runs `api/tts.js` as a server-side Function, so the browser still calls `/api/tts` without seeing your Fish Audio key.

1. Push this folder to GitHub.
2. In Vercel, create a new project from that GitHub repo.
3. Use the default **Other** framework/static settings. No build command is required because `index.html` is already generated.
4. In **Project Settings** -> **Environment Variables**, add:
   - `FISH_API_KEY` -> your rotated Fish Audio API key.
   - `FISH_VOICE_ID` -> `d38790551b0548ba9de248dbd10b74e1`.
   - Optional: `FISH_TTS_MODEL` -> `s2.1-pro-free`.
5. Deploy, open the Vercel URL, select a word, and click **Listen to an explanation**.

### Hosted setup with Cloudflare Worker

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and sign up for a free account if needed.
2. In **Workers & Pages**, create a Worker, then replace the sample code with `fish-audio-worker.js`.
3. In the Worker's **Settings** -> **Variables and Secrets**, add:
   - `FISH_API_KEY` -> your rotated Fish Audio API key, as a secret.
   - `FISH_VOICE_ID` -> `d38790551b0548ba9de248dbd10b74e1`.
   - Optional: `FISH_TTS_MODEL` -> `s2.1-pro-free`.
4. Copy the Worker URL, for example `https://fish-audio-proxy.<your-subdomain>.workers.dev`.
5. Open the app once with `?ttsProxy=<WORKER_URL>` appended to the page URL. The app stores that proxy URL in the browser and uses it for future Listen requests.

**A note on cost/abuse:** the free Cloudflare tier and Fish Audio's free model should comfortably cover ~10 casual users. The proxy caps requests at 2,000 characters and the app caches each word's audio in the browser so replaying the same word doesn't call the API again. If you ever want tighter protection, add Cloudflare rate limiting to the Worker route.

## Design notes

- **Model-agnostic by design.** This dataset doesn't depend on any particular AI model or vendor. It can back a chatbot (Estella or otherwise), a printed handout, an LMS plug-in, or stand alone as a reference — the content survives regardless of what platform is doing the "explaining."
- **Grounded in Common Core.** Each term is tagged with its grade and domain code (e.g. `3.NF` for Grade 3 Number & Operations—Fractions) so it maps directly onto standard curriculum scope-and-sequence documents.
- **Extensible.** Add rows to `build_data.py`, add new fields (e.g. Spanish translations, audio links, Polya-stage tags), or fork per district to match local curriculum pacing.

## License

Suggested: CC BY-NC 4.0, matching the Estella Explainer project, or CC BY 4.0 if the team wants a fully open (including commercial reuse) release — swap in whichever license fits before publishing the repo.
