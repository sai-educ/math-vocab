const test = require('node:test');
const assert = require('node:assert/strict');

const DATA = require('../vocab_data.json');
const {
  definitionForSpeech,
  exampleForSpeech,
  speechScriptFor,
} = require('../src/narration.js');

test('turns the subtract definition into a connected spoken explanation', () => {
  const subtract = DATA.find((term) => term.id === 'k-oa-subtract');

  assert.equal(
    definitionForSpeech(subtract),
    'Subtract means taking some away, so you can find how many are left.',
  );
});

test('retells the subtract example as a short story rather than reading it verbatim', () => {
  const subtract = DATA.find((term) => term.id === 'k-oa-subtract');
  const story = exampleForSpeech(subtract);

  assert.equal(
    story,
    'Picture Ivy with 5 balloons. Then two of them pop. '
      + 'To make sense of what happened, she subtracts 2 from 5. '
      + 'That leaves Ivy with 3 balloons.',
  );
  assert.notEqual(story, subtract.example);
});

test('creates an inviting, complete narration for a noun concept', () => {
  const fraction = DATA.find((term) => term.id === '3-nf-fraction');

  assert.equal(
    speechScriptFor(fraction),
    'Let’s explore fraction. Fraction is a number that names part of a whole. '
      + 'Picture Nina as she cuts a pie into 4 equal slices and takes 1. '
      + 'In the end, she ate 1/4 of the pie.',
  );
});

test('preserves names and replaces written sequence words with spoken transitions', () => {
  const equal = DATA.find((term) => term.id === 'k-cc-equal');
  const multiStep = DATA.find((term) => term.id === '4-oa-multi-step-problem');

  assert.match(exampleForSpeech(equal), /Then Omar has 3 blue blocks\./);
  assert.match(exampleForSpeech(equal), /Notice that the groups are equal\./);
  assert.match(exampleForSpeech(multiStep), /First, he multiplies to get 24\./);
  assert.match(exampleForSpeech(multiStep), /Finally, he subtracts to get 19\./);
  assert.doesNotMatch(exampleForSpeech(multiStep), /Then first|end, then/i);
});

test('avoids mechanical transitions and uninflected definition verbs across the corpus', () => {
  for (const term of DATA) {
    const script = speechScriptFor(term);
    assert.doesNotMatch(script, /Then (?:Now|Every|First|Then|So)\b/i, term.id);
    assert.doesNotMatch(script, /In the end, (?:Now|Then|So)\b/i, term.id);
    assert.doesNotMatch(
      script,
      /means (?:say|join|start|line|trade|decide|work)\b/i,
      term.id,
    );
  }
});

test('keeps tricky definitions and story grammar natural', () => {
  const byId = (id) => DATA.find((term) => term.id === id);

  assert.equal(
    definitionForSpeech(byId('1-nbt-count-on')),
    'Count on means starting at one number and continuing to count up.',
  );
  assert.equal(
    definitionForSpeech(byId('2-g-rows-and-columns')),
    'Rows and columns describe two directions. Rows go across. Columns go up and down.',
  );
  assert.equal(
    definitionForSpeech(byId('1-g-halves')),
    'Halves are two equal parts of one whole.',
  );
  assert.match(exampleForSpeech(byId('k-cc-less-than')), /Picture Sam as they count 2 birds/);
  assert.match(exampleForSpeech(byId('k-oa-in-all')), /Now we can ask how many they have in all/);
  assert.match(
    exampleForSpeech(byId('5-oa-evaluate')),
    /First, the work inside the parentheses gives 5/,
  );
  assert.equal(
    definitionForSpeech(byId('1-md-half-hour')),
    'Half hour means thirty minutes, which is half of one hour.',
  );
  assert.equal(
    definitionForSpeech(byId('3-nf-whole')),
    'Whole means all of the parts together, forming one complete thing.',
  );
  assert.match(exampleForSpeech(byId('k-cc-number')), /how many stars there are/);
});

test('retells even one-sentence examples instead of embedding the displayed line verbatim', () => {
  const oneSentenceTerms = DATA.filter((term) => (
    term.example.replace(/([.!?])\s+(?=[A-Z])/g, '$1\n').split('\n').length === 1
  ));

  assert.ok(oneSentenceTerms.length > 0);
  for (const term of oneSentenceTerms) {
    assert.ok(!exampleForSpeech(term).includes(term.example), term.id);
  }
});

test('keeps every narration within the Fish Audio text limit', () => {
  for (const term of DATA) {
    const script = speechScriptFor(term);
    assert.ok(script.length > term.definition.length, term.id);
    assert.ok(script.length <= 2000, `${term.id} is ${script.length} characters`);
    assert.doesNotMatch(script, /\s{2,}/, term.id);
    assert.doesNotMatch(script, /\.\./, term.id);
  }
});
