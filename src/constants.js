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

const DOMAIN_ICONS = { CC: '🔢', OA: '➕', NBT: '🔟', NF: '🍕', MD: '📏', G: '📐' };

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

const TERM_ICONS = {
  'count':'🔢','number':'#️⃣','more':'➕','fewer':'➖','equal':'⚖️',
  'greater than':'❱','less than':'❰','one more':'➕','zero':'0️⃣','in order':'🔀',
  'add':'➕','subtract':'➖','sum':'➕','put together':'🧩','take apart':'✂️',
  'decompose':'🧩','equation':'⚖️','in all':'∑','left':'➖',
  'ten':'🔟','ones':'1️⃣','teen number':'🔢','compose':'🧩',
  'longer':'📏','shorter':'📏','taller':'📐','heavier':'⚖️','lighter':'🪶',
  'measure':'📏','compare':'⚖️','sort':'🗂️','category':'🗂️',
  'shape':'🔷','circle':'●','triangle':'▲','square':'■','rectangle':'▬',
  'hexagon':'⬡','cube':'🧊','sphere':'⚪','above':'⬆️','below':'⬇️',
  'beside':'↔️','corner':'📐',
  'addend':'➕','difference':'➖','unknown':'❓','fact family':'👪',
  'doubles':'✌️','how many more':'➕',
  'place value':'🔢','greater than (>)':'❱','less than (<)':'❰','equal to (=)':'=',
  'count on':'➡️','length':'📏','hour':'🕐','half hour':'🕧','data':'📊',
  'tally chart':'✓','graph':'📊',
  'partition':'🍰','equal shares':'🍰','halves':'½','fourths':'¼','quarters':'¼',
  'attribute':'🏷️','2D shape':'🔷','3D shape':'🧊',
  'repeated addition':'➕','array':'▦','even number':'🔷','odd number':'🔶',
  'two-step problem':'2️⃣','unknown number':'❓','hundreds':'💯','expanded form':'🔢',
  'regroup':'🔁','compare numbers':'⚖️','centimeter':'📏','meter':'📏',
  'estimate':'🤔','number line':'📏','bar graph':'📊','picture graph':'🖼️',
  'line plot':'📈','dollar':'💵','quarter (coin)':'🪙','quadrilateral':'◇',
  'pentagon':'⬠','rows and columns':'▦',
  'multiply':'✖️','factor':'✖️','product':'✖️','divide':'➗','quotient':'➗',
  'equal groups':'▦','area model':'▦','unknown factor':'❓','round':'🔄',
  'fraction':'½','numerator':'⬆️','denominator':'⬇️','unit fraction':'⅓',
  'equivalent fractions':'≈','whole':'⭕','compare fractions':'⚖️',
  'area':'▦','perimeter':'⬚','square unit':'▦','elapsed time':'⏱️',
  'liquid volume':'🧪','mass':'⚖️','scaled graph':'📊',
  'prime number':'🔒','composite number':'🔓','multi-step problem':'🔢',
  'remainder':'➗','variable':'𝑥','multi-digit':'🔢','standard algorithm':'🔢',
  'equivalent fraction':'≈','mixed number':'1½','improper fraction':'⁵⁄₄',
  'common denominator':'⬇️','decimal':'.','tenths':'.1','hundredths':'.01',
  'benchmark fraction':'½','angle':'📐','degree':'°','protractor':'📐',
  'formula':'🧮','conversion':'🔁','point':'•','line':'—','ray':'↗️',
  'acute angle':'📐','obtuse angle':'📐','right angle':'📐',
  'parallel lines':'∥','perpendicular lines':'⊥','line of symmetry':'🪞',
  'order of operations':'🔢','parentheses':'( )','expression':'🔢','evaluate':'🧮',
  'numerical pattern':'🔁','coordinate pair':'📍','exponent':'ⁿ','power of ten':'🔟',
  'round decimals':'🔄','multiply decimals':'✖️','divide decimals':'➗',
  'multiply fractions':'✖️','divide fractions':'➗','simplify':'↓','reciprocal':'🔃',
  'volume':'📦','cubic unit':'📦','convert units':'🔁','coordinate plane':'📊',
  'x-axis':'↔️','y-axis':'↕️','ordered pair':'📍','classify':'🗂️',
  'hierarchy of shapes':'🗂️',
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

function iconForTerm(t) {
  return TERM_ICONS[t.term] || DOMAIN_ICONS[t.domainCode] || '🔎';
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
