# Math Word Explorer

**A free tool that explains the 189 math words children meet from Kindergarten
to Grade 5 — in language they can actually read.**

Word problems are often hard for a reason that has nothing to do with the
maths. They are full of words like *denominator*, *perimeter* and *regroup*. A
child can know how to subtract and still be stuck, simply because they are not
sure what *how many are left* is asking.

This tool explains every one of those words twice over: once as a short, plain
definition, and once as a small story showing the word doing its job in a real
situation.

Aligned to the Common Core State Standards for Mathematics. Free, open source,
and it collects no data about anyone.

---

## Contents

- [Try it](#try-it)
- [Who it is for](#who-it-is-for)
- [What you get for every word](#what-you-get-for-every-word)
- [Run it on your own computer](#run-it-on-your-own-computer)
- [Turning on the read-aloud voice](#turning-on-the-read-aloud-voice)
- [Putting it online](#putting-it-online)
- [Editing the words](#editing-the-words)
- [How the project is put together](#how-the-project-is-put-together)
- [Accessibility](#accessibility)
- [Privacy](#privacy)
- [Credits and licence](#credits-and-licence)

---

## Try it

Open `index.html` in any browser. That is the welcome page; the **Open the
Explorer** button takes you into the tool itself (`app.html`).

Nothing to install and no sign-in. It works on a tablet, laptop or phone.

**How a child uses it — three steps:**

1. **Pick a grade** along the top.
2. **Pick a topic** on the left (these are the Common Core domains).
3. **Pick a word** — its explanation appears on the right.

The 3D map in the middle shows where that word sits among all the others. You
can spin it by dragging, and tapping any dot in it jumps straight to that word.

---

## Who it is for

| Who | How they use it |
| --- | --- |
| **Children** | Look a word up on their own. Big buttons, a read-aloud button, and a tick beside every word already explored. |
| **Teachers** | Put a new word on the board, or let children look words up during independent work. Words are grouped by grade and Common Core domain. |
| **Tutors** | Quickly tell whether a child is stuck on the vocabulary or on the method. |
| **Parents and carers** | Help with homework without needing to remember the maths yourself — the explanation is written for both of you. |

---

## What you get for every word

Each of the 189 words has four parts:

- **What it means** — a plain definition, one or two short sentences.
- **See it in an example** — a short story with a named child and a real
  situation, showing the word being used.
- **Watch out for** — the mistake children usually make with this word.
- **Listen** — a button that reads the whole thing aloud.

Here is one entry, as a child sees it:

> ### denominator
> **What it means** — The bottom number. It tells how many equal parts make the whole.
>
> **See it in an example** — Maya writes 3/8. The denominator 8 means the whole pie was cut into 8 equal parts.

**Every explanation is checked for reading difficulty when the site is built.**
The build prints a Flesch report, so the language stays within reach of the age
it is written for instead of quietly drifting harder over time. The current
bank averages a Flesch Reading Ease of about **90** ("very easy") and a
Flesch-Kincaid grade level of about **2.5**.

---

## Run it on your own computer

You only need this if you want to change something. To simply *use* the tool,
open `index.html`.

**What you need:** Python 3 and Node.js (version 18 or newer).

```bash
npm install
```

```bash
npm run build
```

```bash
npm start
```

Then open <http://localhost:4173>.

`npm run build` regenerates everything: the word data, the Markdown copies, and
the two HTML pages. Run it after any change to the words or the code.

---

## Turning on the read-aloud voice

The **Listen to an explanation** button uses [Fish Audio](https://fish.audio)
for speech. It needs an API key, and that key must never go in the page itself —
this is a public site, so anything in the page is visible to everybody. Instead
the key lives on the server, and the page asks the server to do the talking.

**If you see "Could not load audio: Voice server is missing FISH_API_KEY"**,
that is not a bug. It is the server telling you no key is set up yet. Set one:

1. Copy `.env.example` to `.env.local`.
2. Put your Fish Audio key in it as `FISH_API_KEY=...`.
3. Restart the server (`npm start`) — the file is only read at startup.

To check what is happening, call the endpoint directly:

```bash
curl -s -X POST http://127.0.0.1:4173/api/tts -H 'Content-Type: application/json' -d '{"text":"hello"}'
```

| What comes back | What it means |
| --- | --- |
| `missing FISH_API_KEY` | No key is set up. |
| `Fish Audio returned an error (401)` | A key is set, but Fish Audio rejected it. |
| Binary gibberish | It is working. |

Everything else in the tool works fine without a key. Only the Listen button
needs it.

---

## Putting it online

The site is two plain HTML files, so almost any host will do.

**On Vercel** (what this project uses):

1. Connect the GitHub repo to a new Vercel project.
2. Use the default **Other** preset. No build command is needed — the HTML is
   already built and committed.
3. Under **Settings → Environment Variables**, add `FISH_API_KEY` and
   `FISH_VOICE_ID`. Tick all three environments.
4. **Redeploy.** Environment variables are only picked up at deploy time, so an
   existing deployment keeps saying "missing FISH_API_KEY" until you redeploy.

Vercel turns `api/tts.js` into the server-side function automatically.
`.vercelignore` keeps `.env*` out of the upload.

> **Before you make the URL public**, read
> [Cost and abuse](#cost-and-abuse) below. The voice endpoint currently accepts
> any text from anybody, which is fine for a private link and risky for a public
> one.

### Cost and abuse

`/api/tts` accepts arbitrary text (up to 2,000 characters) from anyone, with
`Access-Control-Allow-Origin: *`. Once the address is public, anyone who finds
it has a free text-to-speech API billed to your Fish Audio account.

Fixes, cheapest first:

1. Set `CORS_ORIGIN` to your real site address instead of leaving it `*`.
2. Add rate limiting (Vercel firewall rules, or Cloudflare on the Worker route).
3. **The durable fix:** make the endpoint take a word id (`{"termId":
   "k-cc-count"}`) instead of free text, and build the sentence server-side from
   `vocab_data.json`. It could then only ever say one of 189 fixed things, which
   also makes the audio cacheable and nearly free. This needs changes in
   `server.js`, `api/tts.js`, `fish-audio-worker.js` and `src/tts.js`.

Also prefer a key limited to the free `s2.1-pro-free` model, so a leak cannot
run up a bill.

---

## Editing the words

**All 189 words live in one place: the `DATA` table at the top of
`build_data.py`.** Each entry is four pieces of text:

```python
("denominator",
 "The bottom number. It tells how many equal parts make the whole.",
 "Maya writes 3/8. The denominator 8 means the whole pie was cut into 8 equal parts.",
 ""),   # <- the "watch out for" note, or "" if there isn't one
```

Change it, then run `npm run build`. That rewrites `vocab_data.json`, the
Markdown files in `vocab_bank/`, and both HTML pages.

**Writing guidance** (also at the top of `build_data.py`):

- Keep sentences short. Sentence length matters more for readability than
  anything else.
- Use everyday words *around* the hard word. "Denominator" is five syllables and
  cannot be avoided; everything else in the sentence can be one or two.
- Examples should be *situated*: a named child, a real setting, and the thinking
  made visible. There is a small recurring cast (Maya, Leo, Ana, Ben, Ivy, Zoe,
  Theo, Nina, Omar, Sam) so the bank reads as one world.
- Name the mistake children actually make, not the abstract error.

The build prints a readability report and flags anything that drifted too hard.

---

## How the project is put together

The two HTML files are **built**, not hand-edited. Edit the sources, then run
the build.

```
build_data.py        the 189 words + the writing guidance   <- edit words here
readability.py       the Flesch reading-level checker
build_html.py        assembles the two HTML pages

src/                 the app's source                       <- edit code here
  styles.css           layout, theme, responsive rules
  landing.css          the welcome page's styles
  constants.js         grades, domains, shared helpers
  icons.js             the SVG icon set
  sound.js             interaction sounds
  graph3d.js           the 3D map (Three.js)
  ui.js                panels, keyboard support, announcements
  tts.js               the Listen button
  about.js             the About dialog
  main.js              app state and wiring

landing_template.html  page shell for the welcome page
app_template.html      page shell for the tool

index.html           BUILT - the welcome page
app.html             BUILT - the tool
vocab_data.json      BUILT - the word data
vocab_bank/*.md      BUILT - one readable Markdown file per grade

server.js            local web server + voice proxy
api/tts.js           the same voice proxy, for Vercel
fish-audio-worker.js  the same voice proxy, for Cloudflare
```

`index.html` and `app.html` are each a single self-contained file with all the
CSS and JavaScript inlined. That means you can email one to a teacher, put it on
a USB stick, or drop it on any static host, and it just works.

**What loads from the internet:** the 3D map uses Three.js and GSAP from a CDN.
If those cannot load — no internet, a school firewall — the map area shows a
short message and *everything else keeps working*: the words, the definitions,
the examples, the search, the sounds, the About dialog. This is tested.

**Performance.** The map draws 224 dots and 223 connecting lines. They are drawn
with instancing and a single merged line object, so the whole scene is about a
dozen draw calls rather than 450. Highlighting is a smooth per-frame blend
rather than hundreds of simultaneous animations. This is what keeps it smooth on
a school iPad.

**Sounds.** Clicking makes a small sound that tells you *what* happened — a warm
swell for a grade, a downward drop for a topic, a bright chime for a word, a
paper flick for going back. They are synthesized live by
[cuelume](https://github.com/Danilaa1/cuelume), so there are no audio files to
download and they work offline. The Listen button is deliberately silent, so
nothing steps on the first word of the speech. **Sound can be turned off with
the button in the header**, and the choice is remembered.

---

## Accessibility

Built to WCAG 2.1 AA.

- **Keyboard** — every grade, topic and word is a real button. `Tab` moves
  between the three lists; arrow keys (and `Home`/`End`) move within a list;
  `Enter` or `Space` selects.
- **Screen readers** — choosing a word reads out the word, its meaning and its
  example, because the explanation appears far from the list you are using.
- **Zoom** — pinch-to-zoom works. Nothing blocks it.
- **Contrast** — all text is at least 5:1 against its background.
- **Touch targets** — every button is at least 44px tall.
- **Reduced motion** — with the system "Reduce Motion" setting on, the map stops
  spinning, camera moves become instant, and animations are switched off.
- **Colour is never the only signal** — each Common Core domain also has its own
  3D shape and its own icon.

---

## Privacy

**This site collects no data at all.** No sign-in, no analytics, no cookies, no
advertising, no tracking of any kind. Nothing about a child is sent anywhere or
stored on any server.

Two things are saved on your own device, in your own browser: which words have
been opened, and whether sound is on. Clearing your browser data erases both.

The one time anything leaves your device is when you press **Listen** — the
sentence to be spoken is sent to the voice server so it can be turned into
audio. Nothing is stored.

---

## Credits and licence

Made by the **Usable Math** team at the University of Massachusetts Amherst
([usablemath.org](https://usablemath.org)), with the **Society & AI** research
group ([societyandai.org](https://societyandai.org)).

Released as an Open Educational Resource under
[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) — share it and
adapt it for non-commercial use, with credit.

Source: [github.com/sai-educ/math-vocab](https://github.com/sai-educ/math-vocab)

Also uses [Three.js](https://threejs.org) and [GSAP](https://gsap.com) for the
3D map, and [cuelume](https://github.com/Danilaa1/cuelume) (MIT) for the sounds.
