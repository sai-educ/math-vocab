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
      + 'That leaves Ivy with 3 balloons. This example helps us see what subtract means.',
  );
  assert.notEqual(story, subtract.example);
});

test('creates an inviting, complete narration for a noun concept', () => {
  const fraction = DATA.find((term) => term.id === '3-nf-fraction');

  assert.equal(
    speechScriptFor(fraction),
    'Let’s explore fraction. Fraction is a number that names part of a whole. '
      + 'Picture this: Nina cuts a pie into 4 equal slices and takes 1. '
      + 'In the end, she ate 1/4 of the pie. '
      + 'This example helps us see what fraction means.',
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

test('keeps every narration within the Fish Audio text limit', () => {
  for (const term of DATA) {
    const script = speechScriptFor(term);
    assert.ok(script.length > term.definition.length, term.id);
    assert.ok(script.length <= 2000, `${term.id} is ${script.length} characters`);
    assert.doesNotMatch(script, /\s{2,}/, term.id);
    assert.doesNotMatch(script, /\.\./, term.id);
  }
});
