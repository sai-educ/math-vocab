/* =========================================================================
   Spoken narration.

   The text in the definition panel is deliberately concise. Fish Audio gets
   a separate script that connects those ideas into natural sentences and
   retells the example as a small story instead of reading the card verbatim.
   ========================================================================= */

const NARRATION_ACTION_GERUNDS = {
  add: 'adding',
  arrange: 'arranging',
  break: 'breaking',
  change: 'changing',
  compare: 'comparing',
  count: 'counting',
  cut: 'cutting',
  decide: 'deciding',
  divide: 'dividing',
  draw: 'drawing',
  estimate: 'estimating',
  find: 'finding',
  group: 'grouping',
  join: 'joining',
  keep: 'keeping',
  line: 'lining',
  look: 'looking',
  make: 'making',
  measure: 'measuring',
  move: 'moving',
  multiply: 'multiplying',
  name: 'naming',
  order: 'ordering',
  put: 'putting',
  round: 'rounding',
  say: 'saying',
  share: 'sharing',
  show: 'showing',
  sort: 'sorting',
  split: 'splitting',
  start: 'starting',
  subtract: 'subtracting',
  take: 'taking',
  tell: 'telling',
  trade: 'trading',
  use: 'using',
  work: 'working',
  write: 'writing',
};

const NARRATION_PRONOUNS = {
  Maya: 'she',
  Leo: 'he',
  Ana: 'she',
  Ivy: 'she',
  Zoe: 'she',
  Nina: 'she',
  Sam: 'they',
  Ben: 'he',
  Theo: 'he',
  Omar: 'he',
};

const PLURAL_NARRATION_CONCEPTS = new Set([
  'ones',
  'tens',
  'hundreds',
  'equal shares',
  'halves',
  'fourths',
  'quarters',
  'rows and columns',
  'equal groups',
  'equivalent fractions',
  'tenths',
  'hundredths',
  'parallel lines',
  'perpendicular lines',
  'parentheses',
]);

function narrationSentences(text) {
  return String(text || '')
    .replace(/([.!?])\s+(?=[A-Z])/g, '$1\n')
    .split('\n')
    .map((sentence) => sentence.trim().replace(/[.!?]+$/, ''))
    .filter(Boolean);
}

function lowerNarrationStart(text) {
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : '';
}

function storyConnectorStart(text) {
  if (!text) return '';
  const properName = /^(?:Maya|Leo|Ana|Ivy|Zoe|Nina|Sam|Ben|Theo|Omar)(?:'s)?\b/;
  return properName.test(text) ? text : lowerNarrationStart(text);
}

function narrationPeriod(text) {
  const clean = String(text || '').trim().replace(/[.!?]+$/, '');
  return clean ? clean + '.' : '';
}

function spokenConceptName(term) {
  const value = String(term || '').trim();
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'This word';
}

function definitionForSpeech(term) {
  const parts = narrationSentences(term && term.definition);
  if (!parts.length) return `${spokenConceptName(term && term.term)} is a math idea.`;

  const first = parts.shift();
  const action = first.match(/^([A-Za-z]+)\b(.*)$/);
  const actionGerund = action && NARRATION_ACTION_GERUNDS[action[1].toLowerCase()];
  const conceptName = spokenConceptName(term.term);
  const termKey = String(term.term).toLowerCase();
  const nounPhrase = /^(?:a|an|the|one|two|part|how|when|where)\b/i.test(first);

  let explanation;
  if (/^Words in a problem\b/i.test(first)) {
    explanation = `${conceptName} is wording in a problem${first.slice('Words in a problem'.length)}`;
  } else if (/^Another word for\b/i.test(first)) {
    explanation = `${conceptName} is ${lowerNarrationStart(first)}`;
  } else if (termKey === 'rows and columns') {
    explanation = `${conceptName} describe two directions. ${first}`;
  } else if (termKey === 'tenths' || termKey === 'hundredths') {
    explanation = `${conceptName} are the equal parts made when ${lowerNarrationStart(first)}`;
  } else if (actionGerund) {
    const actionDetails = action[2]
      .replace(/\band keep counting\b/i, 'and continuing to count')
      .replace(/,\s+or find\b/i, ', or finding');
    explanation = `${conceptName} means ${actionGerund}${actionDetails}`;
  } else if (PLURAL_NARRATION_CONCEPTS.has(termKey)) {
    explanation = `${conceptName} are ${lowerNarrationStart(first)}`;
  } else if (nounPhrase) {
    explanation = `${conceptName} is ${lowerNarrationStart(first)}`;
  } else if (/^(?:goes|takes|weighs)\b/i.test(first)) {
    explanation = `${conceptName} describes something that ${lowerNarrationStart(first)}`;
  } else {
    explanation = `${conceptName} means ${lowerNarrationStart(first)}`;
  }

  parts.forEach((part, index) => {
    const you = part.match(/^You (?:can )?(.+)$/i);
    if (index === 0 && you) {
      explanation += `, so you can ${lowerNarrationStart(you[1])}`;
    } else if (/^Not\b/i.test(part)) {
      explanation += `. It is ${lowerNarrationStart(part)}`;
    } else {
      explanation += `. ${part}`;
    }
  });

  return narrationPeriod(explanation);
}

function exampleForSpeech(term) {
  const parts = narrationSentences(term && term.example);
  if (!parts.length) {
    return `This example helps us see what ${term.term} means.`;
  }

  let storySubject = '';
  const first = parts.shift();
  const hasOpening = first.match(/^([A-Z][a-z]+) has (.+)$/);
  const namedOpening = first.match(/^([A-Z][a-z]+)\s+(.+)$/);
  let story;

  if (hasOpening) {
    storySubject = hasOpening[1];
    const pronoun = NARRATION_PRONOUNS[storySubject] || 'they';
    const splitAction = hasOpening[2].match(/^(.+?) and (eats|gets|needs|shares) (.+)$/i);
    if (splitAction) {
      story = `Picture ${storySubject} with ${splitAction[1]}. `
        + `Then ${pronoun} ${splitAction[2].toLowerCase()} ${splitAction[3]}.`;
    } else {
      story = `Picture ${storySubject} with ${hasOpening[2]}.`;
    }
  } else if (namedOpening && NARRATION_PRONOUNS[namedOpening[1]]) {
    storySubject = namedOpening[1];
    story = `Picture ${storySubject} as ${NARRATION_PRONOUNS[storySubject]} `
      + `${narrationPeriod(namedOpening[2])}`;
  } else {
    story = `Imagine a situation where ${narrationPeriod(lowerNarrationStart(first))}`;
  }

  parts.forEach((part, index) => {
    const isLast = index === parts.length - 1;
    const thereRemaining = part.match(/^Now there (?:is|are) (.+?) left$/i);
    const remaining = part.match(/^Now (.+?) (?:is|are) left$/i);
    const firstStep = part.match(/^First,?\s+(.+)$/i);
    const nextStep = part.match(/^Then,?\s+(.+)$/i);
    const nowStep = part.match(/^Now,?\s+(.+)$/i);
    const soStep = part.match(/^So,?\s+(.+)$/i);
    const observation = part.match(/^(?:Every|Only)\b/i);
    const actionConcept = NARRATION_ACTION_GERUNDS[String(term.term).toLowerCase()];
    let sentence;

    if (thereRemaining) {
      sentence = `That leaves ${thereRemaining[1]}`;
    } else if (remaining) {
      const owner = storySubject ? `${storySubject} with ` : '';
      sentence = `That leaves ${owner}${remaining[1]}`;
    } else if (firstStep) {
      sentence = `First, ${storyConnectorStart(firstStep[1])}`;
    } else if (nextStep) {
      sentence = `${isLast ? 'Finally' : 'Next'}, ${storyConnectorStart(nextStep[1])}`;
    } else if (nowStep) {
      sentence = `Now, ${storyConnectorStart(nowStep[1])}`;
    } else if (soStep) {
      sentence = `So, ${storyConnectorStart(soStep[1])}`;
    } else if (observation) {
      sentence = `Notice how ${lowerNarrationStart(part)}`;
    } else if (part.toLowerCase().includes(String(term.term).toLowerCase())) {
      sentence = actionConcept
        ? `To make sense of what happened, ${storyConnectorStart(part)}`
        : `Notice that ${lowerNarrationStart(part)}`;
    } else if (isLast) {
      sentence = `In the end, ${storyConnectorStart(part)}`;
    } else {
      sentence = `Then ${storyConnectorStart(part)}`;
    }
    story += ` ${narrationPeriod(sentence)}`;
  });

  story += ` This example helps us see what ${term.term} means.`;
  return story;
}

function speechScriptFor(term) {
  return `Let’s explore ${term.term}. ${definitionForSpeech(term)} ${exampleForSpeech(term)}`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    definitionForSpeech,
    exampleForSpeech,
    speechScriptFor,
  };
}
