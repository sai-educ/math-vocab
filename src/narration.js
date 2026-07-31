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
  divide: 'dividing',
  draw: 'drawing',
  estimate: 'estimating',
  find: 'finding',
  group: 'grouping',
  look: 'looking',
  make: 'making',
  measure: 'measuring',
  move: 'moving',
  multiply: 'multiplying',
  name: 'naming',
  order: 'ordering',
  put: 'putting',
  round: 'rounding',
  share: 'sharing',
  show: 'showing',
  sort: 'sorting',
  split: 'splitting',
  subtract: 'subtracting',
  take: 'taking',
  tell: 'telling',
  use: 'using',
  write: 'writing',
};

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
  const commonStart = /^(?:a|an|each|he|her|his|it|one|she|some|that|the|their|they|this|two|we|you)\b/i;
  return commonStart.test(text) ? lowerNarrationStart(text) : text;
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
  const nounPhrase = /^(?:a|an|the|one|two|part|how|when|where)\b/i.test(first);

  let explanation;
  if (actionGerund) {
    explanation = `${spokenConceptName(term.term)} means ${actionGerund}${action[2]}`;
  } else if (nounPhrase) {
    explanation = `${spokenConceptName(term.term)} is ${lowerNarrationStart(first)}`;
  } else {
    explanation = `${spokenConceptName(term.term)} means ${lowerNarrationStart(first)}`;
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
  const namedOpening = first.match(/^([A-Z][a-z]+)\b/);
  let story;

  if (hasOpening) {
    storySubject = hasOpening[1];
    story = `Picture ${storySubject} with ${hasOpening[2]}.`;
  } else {
    storySubject = namedOpening ? namedOpening[1] : '';
    story = `Picture this: ${narrationPeriod(first)}`;
  }

  parts.forEach((part, index) => {
    const isLast = index === parts.length - 1;
    const remaining = part.match(/^Now (.+?) (?:is|are) left$/i);
    const firstStep = part.match(/^First,?\s+(.+)$/i);
    const nextStep = part.match(/^Then,?\s+(.+)$/i);
    const actionConcept = NARRATION_ACTION_GERUNDS[String(term.term).toLowerCase()];
    let sentence;

    if (remaining) {
      const owner = storySubject ? `${storySubject} with ` : '';
      sentence = `That leaves ${owner}${remaining[1]}`;
    } else if (firstStep) {
      sentence = `First, ${storyConnectorStart(firstStep[1])}`;
    } else if (nextStep) {
      sentence = `${isLast ? 'Finally' : 'Next'}, ${storyConnectorStart(nextStep[1])}`;
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
