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
};

// ---- data helpers -------------------------------------------------------

function byGrade(g) { return DATA.filter((d) => d.grade === g); }

function domainsForGrade(g) {
  const set = {};
  byGrade(g).forEach((d) => { set[d.domainCode] = d.domain; });
  return DOMAIN_ORDER.filter((code) => set[code]).map((code) => ({ code, name: set[code] }));
}

function termsFor(g, code) { return byGrade(g).filter((d) => d.domainCode === code); }

function termById(id) { return DATA.find((d) => d.id === id); }

function gradeLabel(g) { return GRADE_NAMES[g] || `Grade ${g}`; }

/* User-authored vocabulary is trusted, but it still flows into the DOM, so
   escape it rather than relying on that staying true if the bank is ever
   opened up to contributors. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
