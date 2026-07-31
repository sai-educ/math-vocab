# Math Vocabulary Knowledge Graph (K–5, Common Core aligned)

An open-access, interactive vocabulary bank for elementary math word-problem terms — 189 terms across all 6 grade bands (K–5) and every Common Core math domain (Counting & Cardinality, Operations & Algebraic Thinking, Number & Operations in Base Ten, Number & Operations—Fractions, Measurement & Data, Geometry).

## How to use it

Open `index.html` in any browser. A yellow pulsing highlight walks you through the flow: it starts on the grade row up top, moves to the topic list once a grade is picked, then to the vocabulary list once a topic is picked. The 3D graph in the center auto-rotates on its own and can also be freely dragged (mouse or touch/iPad) at any time. **Nodes in the graph are tappable** — touching a word, topic or grade sphere selects it and syncs the panels. As you drill down, the camera flies to frame the grade → topic → word you picked and labels it — the same info also appears in full on the right-hand definition panel.

Everything is reachable from the keyboard: `Tab` moves between the grade row, the topic list and the word list; arrow keys (plus `Home`/`End`) move within a list; `Enter`/`Space` selects. Selections are announced to screen readers.

## Files

- `index.html` — the built app: a single self-contained file with all CSS and JS inlined, so it can be opened straight from disk or dropped on any static host. **Generated — do not edit by hand.** Edit `src/` and re-run `build_html.py`.
- `src/` — the actual source, split by concern:
  - `styles.css` — layout, theme, responsive breakpoints, reduced-motion rules.
  - `constants.js` — grade/domain ordering, icons, motion and storage settings, data helpers.
  - `graph3d.js` — the Three.js knowledge graph (instanced nodes, merged edges, HTML labels, picking, camera framing).
  - `ui.js` — panel rendering, keyboard roving-tabindex groups, screen-reader announcements, progress tracking.
  - `tts.js` — the "Listen to an explanation" button.
  - `about.js` — the About/licence dialog.
  - `main.js` — application state and wiring.
- `index_template.html` — the HTML shell, with three placeholders (`__STYLES__`, `__SCRIPTS__`, `__VOCAB_DATA__`) that the build fills in.
- `build_html.py` — regenerates `index.html` from the template + `src/` + `vocab_data.json`. Run after `build_data.py` whenever anything changes: `python3 build_data.py && python3 build_html.py`.
- `vocab_data.json` — the raw dataset (term, grade, Common Core domain/standard code, definition, example, misconception) that powers the app.
- `vocab_bank/grade-*.md` — the same content as human-readable Markdown, one file per grade. This is the source of truth for editing/reviewing content and the most git-friendly format for tracking changes over time.
- `build_data.py` — generates `vocab_data.json` and the Markdown files from a single Python data structure. To edit or extend the vocabulary bank, edit the `DATA` dictionary in this file and re-run it (`python3 build_data.py`).
- `fish-audio-worker.js` — a small server-side proxy (Cloudflare Worker) that powers the "Listen to an explanation" button. See below for what it does and how to turn it on.

The 3D graph loads Three.js, an OrbitControls add-on, and GSAP from CDNs, so it needs an internet connection the first time. If any of those fail the graph area shows a fallback message and the rest of the app — topics, vocabulary, definitions, search, the About dialog — keeps working fully offline. (Verified: with all three CDN tags removed the app still runs with no console errors.)

Icons in the lists and labels use Unicode emoji — a free, open, dependency-free icon set that renders natively on every platform including iPad, with no external asset loading. Common Core domains are additionally distinguished in 3D by *shape* (icosahedron, octahedron, cube, torus, cylinder, dodecahedron) so the branches are still tellable apart without relying on colour.

## Accessibility

The app targets WCAG 2.1 AA:

- **Keyboard**: every grade, topic and word is a real `<button>` with an accessible name and `aria-pressed` state. Roving tabindex keeps the tab order to one stop per group, so 189 words don't mean 189 tab presses.
- **Screen readers**: selecting a word announces the term, its definition and its example through a polite live region, since the definition panel is visually far from the list being operated.
- **Zoom**: the viewport meta no longer sets `maximum-scale`/`user-scalable=no`, so pinch-zoom works (WCAG 1.4.4).
- **Contrast**: all text meets AA (measured 5.09:1 or better against its own background).
- **Touch targets**: interactive rows and buttons are at least 44 px tall, per Apple's HIG.
- **Reduced motion**: with the OS "Reduce Motion" setting on, the graph stops auto-rotating, camera flights become cuts, and all pulses and transitions are disabled.

## Performance

The graph draws 224 nodes and 223 edges. Nodes are drawn with `InstancedMesh` (one draw call per level, plus one per domain shape) and every edge lives in a single merged `LineSegments`, which takes the scene from roughly 450 draw calls to about a dozen. Highlighting is a frame-rate-independent lerp in the render loop rather than a per-click storm of tweens (the earlier version fired ~700 simultaneous GSAP tweens on every selection). This is what keeps it smooth on an iPad.

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

## Credits and licence

Developed by the **Usable Math** team at the University of Massachusetts Amherst ([usablemath.org](https://usablemath.org)), in collaboration with the **Society & AI** research group ([societyandai.org](https://societyandai.org)).

Released as an Open Educational Resource under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) — share and adapt for non-commercial purposes with attribution.

This is surfaced in the app itself via the **About** button in the header (and the **About & licence** link in the footer), which opens a dialog with both organisation links and the licence.
