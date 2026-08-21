/* =========================================================================
   Shared constants: grade/domain ordering, icons, motion settings.
   Inlined into index.html by build_html.py.
   ========================================================================= */

const DATA = JSON.parse(document.getElementById('vocab-data').textContent);
const GRADES = ["K", "1", "2", "3", "4", "5"];
const GRADE_NAMES = {
  K: 'Kindergarten', 1: 'Grade 1', 2: 'Grade 2',
  3: 'Grade 3', 4: 'Grade 4', 5: 'Grade 5',
};
const DOMAIN_ORDER = ["CC", "OA", "NBT", "NF", "MD", "G"];

const DOMAIN_FULLNAME = {};
DATA.forEach((d) => { DOMAIN_FULLNAME[d.domainCode] = d.domain; });

/* Each Common Core domain gets its own solid in the 3D graph, so a grade's
   branches are told apart by shape as well as by colour — shape survives
   colour-blindness and small screens where colour alone does not. */
const DOMAIN_SHAPES = {
  CC: 'icosahedron',
  OA: 'octahedron',
  NBT: 'box',
  NF: 'torus',
  MD: 'cylinder',
  G: 'dodecahedron',
};

/* Motion. The OS-level "Reduce Motion" preference switches every camera
   flight to an instant cut and stops the idle auto-rotation. */
const REDUCED_MOTION = window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

/* Every eased motion in the app is in-out — nothing starts or stops abruptly. */
const EASE_INOUT = 'power2.inOut';
const EASE_INOUT_STRONG = 'power3.inOut';

const STORAGE_KEYS = {
  onboarded: 'mathGraphOnboarded',
  visited: 'mathVocabVisitedTerms',
  ttsProxy: 'mathVocabTtsProxyUrl',
  leftPanelWidth: 'mathVocabLeftPanelWidth',
  detailPanelWidth: 'mathVocabDetailPanelWidth',
  topicsSectionHeight: 'mathVocabTopicsSectionHeight',
  showGradeLabels: 'mathVocabShowGradeLabels',
  activeStandards: 'mathVocabActiveStandards',
  showCat: 'mathVocabShowCat',
  catSkin: 'mathVocabCatSkin',
};

// ---- pixel cat mascot -------------------------------------------------

/* Sprite sheet from KINGS-MZ/PixelCat (github.com/KINGS-MZ/PixelCat), MIT
   licensed — see assets/cat/cat_sheet.png, src/cat.js for the engine and
   src/catDialogue.js for what it says.

   The sheet is drawn as a gray tabby; the other colourways are the source
   project's own CSS filters over that same art, so three skins cost one
   39KB image rather than three. */
const CAT_SKINS = ['white', 'orange', 'rainbow'];
const CAT_SKIN_LABELS = { white: 'Gray tabby', orange: 'Ginger', rainbow: 'Rainbow' };
const CAT_SKIN_FILTERS = {
  white: 'none',
  orange: 'sepia(1) saturate(8) hue-rotate(-35deg) brightness(0.95) contrast(1.1)',
  // The still frame of the animated cycle in cat.js, and the whole of it
  // when the OS asks for reduced motion.
  rainbow: 'sepia(1) saturate(7) hue-rotate(200deg) brightness(1.08) contrast(1.08)',
};

// ---- curricula ------------------------------------------------------------

/* Every term carries one or more { country, code } citations (see
   build_data.py). "US" alone is the historical default — the 189 original
   Common Core words — so a first visit shows exactly what it always has;
   turning on UK/India brings in the terms sourced from those curricula. */
const STANDARD_COUNTRIES = ['US', 'UK', 'IN'];
const STANDARD_LABELS = {
  US: 'Common Core',
  UK: 'UK National Curriculum',
  IN: 'India NCERT',
};

/* Flag artwork from flagcdn.com (free, open flag icon set), inlined rather
   than hot-linked — three small SVGs cost nothing to bundle and keep the
   curriculum picker working offline, the same as everything else here. Each
   flag's internal ids are prefixed (usf-/gbf-/inf-) so they cannot collide
   with each other once several are inlined into the same page. */
const FLAG_SVG = {
  US: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 7410 3900"><path fill="#b31942" d="M0 0h7410v3900H0"/><path stroke="#FFF" stroke-width="300" d="M0 450h7410m0 600H0m0 600h7410m0 600H0m0 600h7410m0 600H0"/><path fill="#0a3161" d="M0 0h2964v2100H0"/><g fill="#FFF"><g id="usf-d"><g id="usf-c"><g id="usf-e"><g id="usf-b"><path id="usf-a" d="m247 90 70.534 217.082-184.66-134.164h228.253L176.466 307.082z"/><use xlink:href="#usf-a" y="420"/><use xlink:href="#usf-a" y="840"/><use xlink:href="#usf-a" y="1260"/></g><use xlink:href="#usf-a" y="1680"/></g><use xlink:href="#usf-b" x="247" y="210"/></g><use xlink:href="#usf-c" x="494"/></g><use xlink:href="#usf-d" x="988"/><use xlink:href="#usf-c" x="1976"/><use xlink:href="#usf-e" x="2470"/></g></svg>',
  UK: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30"><clipPath id="gbf-a"><path d="M0 0v30h60V0z"/></clipPath><clipPath id="gbf-b"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath><g clip-path="url(#gbf-a)"><path d="M0 0v30h60V0z" fill="#012169"/><path d="m0 0 60 30m0-30L0 30" stroke="#fff" stroke-width="6"/><path d="m0 0 60 30m0-30L0 30" clip-path="url(#gbf-b)" stroke="#C8102E" stroke-width="4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></g></svg>',
  IN: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#07038D" viewBox="-45 -30 90 60"><path fill="#FFF" d="M-45-30h90v60h-90z"/><path fill="#FF6820" d="M-45-30h90v20h-90z"/><path fill="#046A38" d="M-45 10h90v20h-90z"/><circle r="9.25"/><circle r="8" fill="#FFF"/><circle r="1.6"/><g id="inf-d"><g id="inf-c"><g id="inf-b"><g id="inf-a"><path d="m0-8 .3 4.814L0-.802l-.3-2.384z"/><circle cy="-8" r=".35" transform="rotate(7.5)"/></g><use xlink:href="#inf-a" transform="scale(-1)"/></g><use xlink:href="#inf-b" transform="rotate(15)"/></g><use xlink:href="#inf-c" transform="rotate(30)"/></g><use xlink:href="#inf-d" transform="rotate(60)"/><use xlink:href="#inf-d" transform="rotate(120)"/></svg>',
};

function flagSvg(country) {
  return FLAG_SVG[country] || '';
}

let activeStandards = loadActiveStandards();

function loadActiveStandards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.activeStandards);
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr)) {
      const valid = arr.filter((c) => STANDARD_COUNTRIES.includes(c));
      if (valid.length) return new Set(valid);
    }
  } catch (e) { /* private browsing */ }
  return new Set(['US']);
}

function setActiveStandards(nextSet) {
  // At least one curriculum must stay on — an empty graph is a dead end,
  // not a valid state a student can navigate out of on their own.
  activeStandards = nextSet.size ? nextSet : new Set(['US']);
  try {
    localStorage.setItem(STORAGE_KEYS.activeStandards, JSON.stringify([...activeStandards]));
  } catch (e) { /* private browsing */ }
}

function isTermVisible(t) {
  return t.standards.some((s) => activeStandards.has(s.country));
}

// ---- data helpers -----------------------------------------------------

/* Filtered by the active curriculum selection — what the topic list, word
   list, search and progress counters show. */
function byGrade(g) { return DATA.filter((d) => d.grade === g && isTermVisible(d)); }

function domainsForGrade(g) {
  const set = {};
  byGrade(g).forEach((d) => { set[d.domainCode] = d.domain; });
  return DOMAIN_ORDER.filter((code) => set[code]).map((code) => ({ code, name: set[code] }));
}

function termsFor(g, code) { return byGrade(g).filter((d) => d.domainCode === code); }

/* Unfiltered — every term regardless of curriculum. The 3D graph is built
   from these once and stays structurally stable; turning a curriculum on or
   off fades its nodes in or out rather than rebuilding the scene, so toggling
   never risks the WebGL resources the graph already allocated. */
function byGradeAll(g) { return DATA.filter((d) => d.grade === g); }

function domainsForGradeAll(g) {
  const set = {};
  byGradeAll(g).forEach((d) => { set[d.domainCode] = d.domain; });
  return DOMAIN_ORDER.filter((code) => set[code]).map((code) => ({ code, name: set[code] }));
}

function termsForAll(g, code) { return byGradeAll(g).filter((d) => d.domainCode === code); }

function termById(id) { return DATA.find((d) => d.id === id); }

/* One badge per active curriculum that actually contributes a term to this
   grade + topic — e.g. US always shows the clean "3.OA" form, while UK/India
   show their own citation when every term in the bucket agrees on one, or
   just the country tag when the terms cite several different codes. */
function standardBadgesFor(grade, domainCode) {
  const byCountry = {};
  termsFor(grade, domainCode).forEach((t) => {
    t.standards.forEach((s) => {
      if (!activeStandards.has(s.country)) return;
      (byCountry[s.country] || (byCountry[s.country] = new Set())).add(s.code);
    });
  });
  return STANDARD_COUNTRIES.filter((c) => byCountry[c]).map((country) => ({
    country,
    label: country === 'US'
      ? `${grade}.${domainCode}`
      : (byCountry[country].size === 1 ? [...byCountry[country]][0] : country),
  }));
}

function gradeLabel(g) { return GRADE_NAMES[g] || `Grade ${g}`; }

/* User-authored vocabulary is trusted, but it still flows into the DOM, so
   escape it rather than relying on that staying true if the bank is ever
   opened up to contributors. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
