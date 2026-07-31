/* =========================================================================
   Icon set.

   Replaces the emoji the first version used. Emoji render differently on
   every platform, carry cartoon styling that fights the rest of the UI, and
   several of the mathematical ones (❱ ⬠ ⁵⁄₄) are really just characters in a
   fallback font. These are drawn on one 24x24 grid with a single stroke
   weight, inherit `currentColor`, and look the same everywhere.

   Every glyph is geometric and says something about the maths: the fraction
   icon is a divided circle, the array icon is a real grid, the symmetry icon
   is a mirrored pair. Nothing is decorative.
   ========================================================================= */

const ICON_PATHS = {
  // --- interface -------------------------------------------------------
  speaker: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
  soundOff: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6"/><path d="m21 9-5 6"/>',
  soundOn: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5h.01"/>',
  close: '<path d="m7 7 10 10"/><path d="m17 7-10 10"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4 4"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
  check: '<path d="m5 13 4 4L19 7"/>',
  arrowRight: '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
  cap: '<path d="M2 8.5 12 4l10 4.5L12 13z"/><path d="M6 10.7V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.3"/>',
  spark: '<path d="M12 3v5"/><path d="M12 16v5"/><path d="M3 12h5"/><path d="M16 12h5"/><path d="m6.3 6.3 3 3"/><path d="m14.7 14.7 3 3"/><path d="m17.7 6.3-3 3"/><path d="m9.3 14.7-3 3"/>',

  // --- number & counting ----------------------------------------------
  countGroup: '<circle cx="7" cy="8" r="2.3"/><circle cx="15" cy="6.5" r="2.3"/><circle cx="9.5" cy="16" r="2.3"/><circle cx="17.5" cy="14.5" r="2.3"/>',
  tally: '<path d="M5 5v14"/><path d="M9.5 5v14"/><path d="M14 5v14"/><path d="M18.5 5v14"/><path d="M3 17 20 7"/>',
  hash: '<path d="M5 9h14"/><path d="M5 15h14"/><path d="M10 4 8 20"/><path d="M17 4l-2 16"/>',
  zero: '<ellipse cx="12" cy="12" rx="6" ry="8"/>',
  one: '<path d="M9 8l3-3v14"/><path d="M9 19h6"/>',
  two: '<path d="M8 8a4 4 0 1 1 7 2.7L8 19h8"/>',
  ten: '<circle cx="7" cy="12" r="3.5"/><circle cx="17" cy="12" r="3.5"/><path d="M7 12h10"/>',
  hundred: '<circle cx="6" cy="12" r="3"/><circle cx="12" cy="12" r="3"/><circle cx="18" cy="12" r="3"/>',
  sequence: '<path d="M4 18v-3"/><path d="M9.3 18v-6"/><path d="M14.7 18v-9"/><path d="M20 18v-12"/>',
  numberLine: '<path d="M3 12h18"/><path d="M6 9v6"/><path d="M12 9v6"/><path d="M18 9v6"/>',
  countOn: '<path d="M3 12h13"/><path d="m12 8 4 4-4 4"/><path d="M20 8v8"/>',

  // --- operations ------------------------------------------------------
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  times: '<path d="m6 6 12 12"/><path d="m18 6-12 12"/>',
  divide: '<path d="M5 12h14"/><circle cx="12" cy="7" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="17" r="1.4" fill="currentColor" stroke="none"/>',
  equals: '<path d="M5 9h14"/><path d="M5 15h14"/>',
  greater: '<path d="m9 5 7 7-7 7"/>',
  less: '<path d="m15 5-7 7 7 7"/>',
  balance: '<path d="M12 4v16"/><path d="M7 20h10"/><path d="M4 8h16"/><path d="M4 8 1.5 14h5z"/><path d="M20 8l2.5 6h-5z"/>',
  sum: '<path d="M17 5H7l6 7-6 7h10"/>',
  merge: '<path d="M5 5v5a4 4 0 0 0 4 4h6"/><path d="M19 19v-5a4 4 0 0 0-4-4H9"/><path d="m12 11 3 3-3 3"/>',
  split: '<path d="M12 4v6"/><path d="M12 10 6 16"/><path d="m12 10 6 6"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>',
  unknown: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 1 1 3 2.6v1.4"/><path d="M12.5 17h.01"/>',
  repeat: '<path d="M4 9h12a4 4 0 0 1 0 8H8"/><path d="m8 5-4 4 4 4"/>',
  factorTree: '<circle cx="12" cy="5" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="m10.7 6.7-3.4 9.6"/><path d="m13.3 6.7 3.4 9.6"/>',
  steps: '<path d="M3 19h5v-5h5V9h5V4"/>',
  variable: '<path d="m7 7 10 10"/><path d="m17 7-10 10"/><circle cx="12" cy="12" r="9"/>',

  // --- place value & base ten -----------------------------------------
  placeValue: '<rect x="3" y="5" width="5" height="14" rx="1"/><rect x="9.5" y="9" width="5" height="10" rx="1"/><rect x="16" y="13" width="5" height="6" rx="1"/>',
  expand: '<path d="M4 12h4"/><path d="M10 12h4"/><path d="M16 12h4"/><path d="M6 8v8"/><path d="M12 8v8"/><path d="M18 8v8"/>',
  regroup: '<path d="M8 4v6"/><path d="m5 7 3-3 3 3"/><path d="M16 20v-6"/><path d="m13 17 3 3 3-3"/>',
  round: '<path d="M4 16a8 8 0 0 1 16 0"/><path d="M12 16v-6"/><path d="m9 13 3-3 3 3"/>',
  exponent: '<path d="M5 18 13 8"/><path d="M5 8l8 10"/><path d="M17 4h2.5a1.5 1.5 0 0 1 0 3H17.5L17 9h3"/>',

  // --- fractions & decimals -------------------------------------------
  fraction: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16"/><path d="M4 12h8"/>',
  fractionBar: '<rect x="3" y="8" width="18" height="8" rx="1.5"/><path d="M9 8v8"/><path d="M15 8v8"/><path d="M3 8h6v8H3z" fill="currentColor" stroke="none" opacity=".45"/>',
  numerator: '<path d="M5 12h14"/><rect x="8" y="3" width="8" height="5" rx="1" fill="currentColor" stroke="none" opacity=".7"/><rect x="8" y="16" width="8" height="5" rx="1"/>',
  denominator: '<path d="M5 12h14"/><rect x="8" y="3" width="8" height="5" rx="1"/><rect x="8" y="16" width="8" height="5" rx="1" fill="currentColor" stroke="none" opacity=".7"/>',
  half: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" opacity=".45"/>',
  equivalent: '<path d="M4 8h16"/><path d="M4 12h16"/><path d="M4 16h16"/>',
  whole: '<circle cx="12" cy="12" r="8"/>',
  decimal: '<path d="M4 16h4"/><path d="M11.5 16h.01"/><path d="M15 8v8"/><path d="M19 8v8"/><path d="M15 8h4"/><path d="M15 16h4"/>',
  reciprocal: '<path d="m8 6-4 6 4 6"/><path d="m16 6 4 6-4 6"/><path d="m14 7-4 10"/>',
  simplify: '<path d="M12 5v10"/><path d="m8 11 4 4 4-4"/><path d="M6 19h12"/>',

  // --- measurement & data ---------------------------------------------
  ruler: '<rect x="2" y="8" width="20" height="8" rx="1.5"/><path d="M7 8v3"/><path d="M12 8v4"/><path d="M17 8v3"/>',
  weight: '<path d="M6 8h12l2 12H4z"/><path d="M9.5 8a2.5 2.5 0 1 1 5 0"/>',
  feather: '<path d="M19 5c-7 0-12 4-12 10v4"/><path d="M7 15h6"/><path d="M5 19 19 5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  timer: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4"/><path d="M9.5 2.5h5"/>',
  beaker: '<path d="M9 3v6L4.5 18a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L15 9V3"/><path d="M8 3h8"/><path d="M6.8 14h10.4"/>',
  barChart: '<path d="M4 20V11"/><path d="M10 20V5"/><path d="M16 20v-6"/><path d="M3 20h18"/>',
  pictureGraph: '<rect x="3" y="4" width="5" height="5" rx="1"/><rect x="10" y="4" width="5" height="5" rx="1"/><rect x="3" y="12" width="5" height="5" rx="1"/><path d="M3 20h18"/>',
  linePlot: '<path d="M3 19h18"/><path d="M7 15v.01"/><path d="M7 11v.01"/><path d="M12 15v.01"/><path d="M12 11v.01"/><path d="M12 7v.01"/><path d="M17 15v.01"/>',
  estimate: '<path d="M4 14c3-5 6-5 8 0s5 5 8 0"/><path d="M4 19h16"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8"/><path d="M14.5 9.5a2.5 2 0 0 0-5 0c0 2.5 5 1 5 3.5a2.5 2 0 0 1-5 0"/>',
  dollar: '<path d="M12 3v18"/><path d="M16.5 7.5A3.5 3 0 0 0 12 6h-.5a3.5 3 0 0 0 0 6h1a3.5 3 0 0 1 0 6H12a3.5 3 0 0 1-4.5-1.5"/>',
  sort: '<path d="M4 6h16"/><path d="M6 12h12"/><path d="M9 18h6"/>',
  category: '<rect x="3" y="4" width="7" height="7" rx="1.5"/><rect x="14" y="4" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><circle cx="17.5" cy="17.5" r="3.5"/>',
  convert: '<path d="M4 8h13"/><path d="m14 5 3 3-3 3"/><path d="M20 16H7"/><path d="m10 13-3 3 3 3"/>',
  volume3d: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m12 3 8 4.5-8 4.5-8-4.5z"/><path d="M12 12v9"/>',
  cubeUnit: '<path d="M4 8h16v12H4z"/><path d="m4 8 3-4h16l-3 4"/><path d="M20 8v12l3-4V4"/>',

  // --- geometry ---------------------------------------------------------
  shapes: '<circle cx="7" cy="7" r="4"/><rect x="13" y="13" width="8" height="8" rx="1"/><path d="M17 3l4 7h-8z"/>',
  circle: '<circle cx="12" cy="12" r="8"/>',
  triangle: '<path d="M12 4 21 19H3z"/>',
  square: '<rect x="5" y="5" width="14" height="14" rx="1"/>',
  rectangle: '<rect x="2.5" y="7" width="19" height="10" rx="1"/>',
  pentagon: '<path d="m12 3 9 6.5-3.4 10.5H6.4L3 9.5z"/>',
  hexagon: '<path d="m12 3 7.8 4.5v9L12 21l-7.8-4.5v-9z"/>',
  quadrilateral: '<path d="m12 3 9 7-3 11H6L3 10z" opacity="0"/><path d="M4 8 12 3l8 5-3 12H7z"/>',
  cube: '<path d="m12 2 9 5v10l-9 5-9-5V7z"/><path d="m3 7 9 5 9-5"/><path d="M12 12v10"/>',
  sphere: '<circle cx="12" cy="12" r="8.5"/><ellipse cx="12" cy="12" rx="4" ry="8.5"/><path d="M3.5 12h17"/>',
  point: '<circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="7.5" opacity=".45"/>',
  lineInf: '<path d="M3 12h18"/><path d="m6 9-3 3 3 3"/><path d="m18 9 3 3-3 3"/>',
  ray: '<circle cx="5" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M5 12h16"/><path d="m18 9 3 3-3 3"/>',
  angle: '<path d="M4 19h16"/><path d="M4 19 16 5"/><path d="M10.5 19a7 7 0 0 0-1.4-4"/>',
  rightAngle: '<path d="M5 19h15"/><path d="M5 19V5"/><path d="M5 14h5v5"/>',
  acute: '<path d="M4 19h16"/><path d="M4 19 19 9"/><path d="M12 19a8 8 0 0 0-.6-3"/>',
  obtuse: '<path d="M4 19h16"/><path d="M4 19 13 4"/><path d="M11 19a7 7 0 0 0-1.7-4.5"/>',
  protractor: '<path d="M3 17a9 9 0 0 1 18 0z"/><path d="M12 17V8"/><path d="m7 10 1.5 2"/><path d="m17 10-1.5 2"/>',
  parallel: '<path d="M6 4 3 20"/><path d="M15 4 12 20"/><path d="M21 4l-3 16" opacity="0"/>',
  perpendicular: '<path d="M12 3v18"/><path d="M3 21h18"/><path d="M12 16h5v5"/>',
  symmetry: '<path d="M12 3v18" stroke-dasharray="3 3"/><path d="M9 7 4 12l5 5z"/><path d="m15 7 5 5-5 5z"/>',
  corner: '<path d="M5 5v14h14"/><path d="M5 10h5V5"/>',
  above: '<path d="M12 20V6"/><path d="m7 11 5-5 5 5"/><path d="M4 3h16" opacity=".5"/>',
  below: '<path d="M12 4v14"/><path d="m7 13 5 5 5-5"/><path d="M4 21h16" opacity=".5"/>',
  beside: '<path d="M4 12h16"/><path d="m8 8-4 4 4 4"/><path d="m16 8 4 4-4 4"/>',
  partition: '<rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M9 6v12"/><path d="M15 6v12"/>',
  array: '<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/>',
  areaModel: '<rect x="3" y="6" width="18" height="12" rx="1"/><path d="M11 6v12"/><path d="M3 12h18"/><path d="M3 6h8v6H3z" fill="currentColor" stroke="none" opacity=".35"/>',
  perimeter: '<rect x="4" y="6" width="16" height="12" rx="1" stroke-dasharray="3 2.5"/>',
  areaFill: '<rect x="4" y="6" width="16" height="12" rx="1"/><path d="M4 10h16"/><path d="M4 14h16"/><path d="M9 6v12"/><path d="M15 6v12"/>',
  grid: '<path d="M3 3v18h18"/><path d="M8 21V8"/><path d="M13 21v-8"/><path d="M18 21V5"/>',
  coordinate: '<path d="M4 20V4"/><path d="M4 20h16"/><circle cx="14" cy="10" r="2" fill="currentColor" stroke="none"/><path d="M4 10h10" stroke-dasharray="2 2"/><path d="M14 20V10" stroke-dasharray="2 2"/>',
  axisX: '<path d="M3 16h18"/><path d="m17 12 4 4-4 4"/><path d="M6 4v12" opacity=".4"/>',
  axisY: '<path d="M8 21V3"/><path d="m4 7 4-4 4 4"/><path d="M8 18h12" opacity=".4"/>',
  hierarchy: '<rect x="8" y="3" width="8" height="5" rx="1"/><rect x="2" y="16" width="8" height="5" rx="1"/><rect x="14" y="16" width="8" height="5" rx="1"/><path d="M12 8v4"/><path d="M6 16v-4h12v4"/>',
};

/* Common Core domains. These also appear on the 3D domain nodes, whose
   solids already differ by domain - the icon reinforces that pairing. */
const DOMAIN_ICON_NAMES = {
  CC: 'countGroup', OA: 'plus', NBT: 'placeValue',
  NF: 'fraction', MD: 'ruler', G: 'shapes',
};

/* Term -> icon. Anything unmapped falls back to its domain icon, so adding a
   vocabulary word never leaves a blank space. */
const TERM_ICON_NAMES = {
  'count': 'tally', 'number': 'hash', 'more': 'plus', 'fewer': 'minus',
  'equal': 'equals', 'greater than': 'greater', 'less than': 'less',
  'one more': 'countOn', 'zero': 'zero', 'in order': 'sequence',
  'add': 'plus', 'subtract': 'minus', 'sum': 'sum', 'put together': 'merge',
  'take apart': 'split', 'decompose': 'split', 'equation': 'balance',
  'in all': 'sum', 'left': 'minus',
  'ten': 'ten', 'ones': 'one', 'teen number': 'sequence', 'compose': 'merge',
  'longer': 'ruler', 'shorter': 'ruler', 'taller': 'above',
  'heavier': 'weight', 'lighter': 'feather', 'measure': 'ruler',
  'compare': 'balance', 'sort': 'sort', 'category': 'category',
  'shape': 'shapes', 'circle': 'circle', 'triangle': 'triangle',
  'square': 'square', 'rectangle': 'rectangle', 'hexagon': 'hexagon',
  'cube': 'cube', 'sphere': 'sphere', 'above': 'above', 'below': 'below',
  'beside': 'beside', 'corner': 'corner',
  'addend': 'plus', 'difference': 'minus', 'unknown': 'unknown',
  'fact family': 'factorTree', 'doubles': 'two', 'how many more': 'greater',
  'place value': 'placeValue', 'tens': 'ten',
  'greater than (>)': 'greater', 'less than (<)': 'less', 'equal to (=)': 'equals',
  'count on': 'countOn',
  'length': 'ruler', 'order by length': 'sequence', 'hour': 'clock',
  'half hour': 'clock', 'data': 'barChart', 'tally chart': 'tally', 'graph': 'barChart',
  'partition': 'partition', 'equal shares': 'partition', 'halves': 'half',
  'fourths': 'fraction', 'quarters': 'fraction', 'attribute': 'category',
  '2D shape': 'square', '3D shape': 'cube',
  'repeated addition': 'repeat', 'array': 'array', 'even number': 'two',
  'odd number': 'one', 'two-step problem': 'steps', 'unknown number': 'unknown',
  'hundreds': 'hundred', 'expanded form': 'expand', 'regroup': 'regroup',
  'compare numbers': 'balance',
  'centimeter': 'ruler', 'meter': 'ruler', 'estimate': 'estimate',
  'number line': 'numberLine', 'bar graph': 'barChart',
  'picture graph': 'pictureGraph', 'line plot': 'linePlot',
  'dollar': 'dollar', 'quarter (coin)': 'coin',
  'quadrilateral': 'quadrilateral', 'pentagon': 'pentagon',
  'rows and columns': 'array',
  'multiply': 'times', 'factor': 'factorTree', 'product': 'times',
  'divide': 'divide', 'quotient': 'divide', 'equal groups': 'array',
  'area model': 'areaModel', 'unknown factor': 'unknown',
  'round': 'round',
  'fraction': 'fraction', 'numerator': 'numerator', 'denominator': 'denominator',
  'unit fraction': 'fractionBar', 'equivalent fractions': 'equivalent',
  'whole': 'whole', 'compare fractions': 'balance',
  'area': 'areaFill', 'perimeter': 'perimeter', 'square unit': 'array',
  'elapsed time': 'timer', 'liquid volume': 'beaker', 'mass': 'weight',
  'scaled graph': 'barChart',
  'multiple': 'repeat', 'prime number': 'point', 'composite number': 'factorTree',
  'multi-step problem': 'steps', 'remainder': 'divide', 'variable': 'variable',
  'multi-digit': 'placeValue', 'standard algorithm': 'steps',
  'equivalent fraction': 'equivalent', 'mixed number': 'fractionBar',
  'improper fraction': 'fraction', 'common denominator': 'denominator',
  'decimal': 'decimal', 'tenths': 'fractionBar', 'hundredths': 'array',
  'benchmark fraction': 'half',
  'angle': 'angle', 'degree': 'protractor', 'protractor': 'protractor',
  'formula': 'variable', 'conversion': 'convert',
  'point': 'point', 'line': 'lineInf', 'ray': 'ray',
  'acute angle': 'acute', 'obtuse angle': 'obtuse', 'right angle': 'rightAngle',
  'parallel lines': 'parallel', 'perpendicular lines': 'perpendicular',
  'line of symmetry': 'symmetry',
  'order of operations': 'steps', 'parentheses': 'merge', 'expression': 'hash',
  'evaluate': 'equals', 'numerical pattern': 'sequence',
  'coordinate pair': 'coordinate',
  'exponent': 'exponent', 'power of ten': 'ten', 'round decimals': 'round',
  'multiply decimals': 'times', 'divide decimals': 'divide',
  'multiply fractions': 'times', 'divide fractions': 'divide',
  'simplify': 'simplify', 'reciprocal': 'reciprocal',
  'volume': 'volume3d', 'cubic unit': 'cubeUnit', 'convert units': 'convert',
  'coordinate plane': 'grid', 'x-axis': 'axisX', 'y-axis': 'axisY',
  'ordered pair': 'coordinate', 'classify': 'category',
  'hierarchy of shapes': 'hierarchy',
};

/** SVG markup for an icon. Decorative by default; pass a label to expose it. */
function iconSvg(name, { size = 20, className = '', label = '' } = {}) {
  const paths = ICON_PATHS[name] || ICON_PATHS.circle;
  const a11y = label
    ? `role="img" aria-label="${escapeHtml(label)}"`
    : 'aria-hidden="true" focusable="false"';
  return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24"`
    + ` fill="none" stroke="currentColor" stroke-width="1.8"`
    + ` stroke-linecap="round" stroke-linejoin="round" ${a11y}>${paths}</svg>`;
}

function iconNameForTerm(t) {
  return TERM_ICON_NAMES[t.term] || DOMAIN_ICON_NAMES[t.domainCode] || 'circle';
}

function termIconSvg(t, options) {
  return iconSvg(iconNameForTerm(t), options);
}

function domainIconSvg(domainCode, options) {
  return iconSvg(DOMAIN_ICON_NAMES[domainCode] || 'shapes', options);
}
