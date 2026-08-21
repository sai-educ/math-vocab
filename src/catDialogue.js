/* =========================================================================
   Everything the pixel cat says.

   Kept apart from src/cat.js on purpose: that file is the sprite engine and
   the behaviour scheduler, this one is the script. A teacher who wants to
   reword a cue should be able to work here without reading a line of
   animation code.

   WHAT THIS CAT IS FOR
   --------------------
   It is a motivational agent, not a second definition panel. The detail
   panel already shows the word, what it means and a worked example, and
   #srAnnounce already reads all three aloud — so the cat repeating any of
   that would be the third copy of the same sentence on one screen.

   Instead every line here does one of these jobs:

     - growth mindset: effort and struggle are how brains grow, "yet" is a
       real word, mistakes are information
     - vocabulary motivation: why owning a math word is worth the trouble
     - collaboration: ask someone, explain it to someone, math is social
     - pacing: slow down, it is okay, understanding beats speed
     - tool mastery: what this app can do that a child has not found yet

   A "scene" is an array of beats — { text, gesture } — played one after the
   other in the speech bubble, so the cat can hold a short exchange instead
   of only ever dropping a single line. Gesture names are the ones
   src/cat.js knows: idle1, idle2, groom, walk, run, sleep, tap, cheer, perk.

   VOICE RULES — read these before adding a line
   ---------------------------------------------
     - Never the words "good" or "bad". They are verdicts, and a verdict
       teaches a child that the point of the work is to be judged. Say what
       actually happened instead: "you went back to that one", "you kept
       going", "that took three tries". Descriptive beats evaluative, and it
       is the whole reason this cat exists.
     - For the same reason, no "smart", "clever" or "talented" pointed at the
       child. Praise the move, never the mind that made it.
     - Situational before generic. If the grade, topic or word is known, a
       line that names it lands harder than one that could appear anywhere.
     - Second person, present tense, one idea per line.
     - Short enough to read at a Grade-2 level; these are 5-to-11-year-olds.
     - Never state a definition, an example, or a word count. The panels own
       those.
   ========================================================================= */

const CatDialogue = (function () {
  /* Picks at random but never twice running from the same bank, so a child
     clicking through ten words does not hear one line three times. Each
     bank passes its own key; the last index used for that key is skipped. */
  const lastPicked = {};

  function pick(list, key) {
    if (!list.length) return '';
    if (list.length === 1) return list[0];
    let idx = Math.floor(Math.random() * list.length);
    if (idx === lastPicked[key]) idx = (idx + 1) % list.length;
    lastPicked[key] = idx;
    return list[idx];
  }

  // ---- the motivational banks --------------------------------------------

  /* Effort, struggle and "yet". The core of the thing — this is what the cat
     reaches for most often. */
  const GROWTH_MINDSET = [
    'Mistakes grow your brain. That is really how it works.',
    'You do not know this one yet. Yet is a powerful word.',
    'Tricky means your brain is building something new.',
    'Hard is not the same as impossible.',
    'Every mathematician was puzzled by these words once.',
    'Your brain is stretching right now. Can you feel it?',
    'Getting stuck is part of the work. Keep going.',
    'You are not behind. You are early.',
    'The struggle is where the learning happens.',
    'Puzzled today, sure of it next week. That is the pattern.',
    'Effort is the secret ingredient. Not talent.',
    'Your math brain gets stronger the more you use it.',
    'Nobody was born knowing these words. Nobody.',
    'One more try is usually when it clicks.',
    'Progress is not a straight line. Zigzags still count.',
    'If it were easy, it would not be worth learning.',
    'Brains change when they work hard. Yours is changing.',
    'You kept going. That is the part that matters.',
    'Hard things get easier. That is what practice is for.',
    'A wrong answer tells you something. Listen to it.',
    'Being puzzled is not being lost.',
    'You are doing the hard part right now.',
    'Small steps still get you all the way there.',
    'Learning feels slow from the inside. Trust it.',
    'You are allowed to find this hard.',
    'Brave is trying the one you are unsure about.',
    'Your brain grows most on the words that fight back.',
    'Not yet just means not yet.',
    'Confusion is the sound of your brain working.',
    'The second time through is always clearer.',
  ];

  /* Why a math word is worth owning — the vocabulary-specific half. */
  const VOCAB_MOTIVATION = [
    'Math words are keys. Each one opens more problems.',
    'When you own a word, you own the idea inside it.',
    'Say it out loud. Words stick better that way.',
    'A word you can explain is a word you really know.',
    'Math has its own language. You are learning to speak it.',
    'Every word you collect makes the next problem easier.',
    'Use this word today and it becomes yours.',
    'You just picked up another tool for your math toolbox.',
    'Can you say what this means without reading it?',
    'The more words you know, the friendlier word problems get.',
    'Words are how mathematicians share what they think.',
    'Try building a sentence with this word.',
    'Knowing the word means you can join the conversation.',
    'A new word today is an easier problem tomorrow.',
    'Where else have you seen this word? Have a think.',
    'Math words are not extra. They are the math.',
    'Draw it. Some words make more sense as a picture.',
  ];

  /* Math is social. The supportive, collaborative climate half. */
  const COLLABORATION = [
    'Stuck? Asking for help is a math skill too.',
    'Explaining it to a friend makes it clearer for you.',
    'Two heads solve problems faster than one.',
    'Math is better out loud, with somebody else.',
    'Ask a classmate what they think this one means.',
    'Teach this word to someone. That is how you keep it.',
    'Your teacher likes being asked about words.',
    'Working it out together is not cheating. It is how math works.',
    'Share this one with the person next to you.',
    'Mathematicians disagree, then work it out together.',
    'Someone near you is wondering the same thing.',
  ];

  /* Openers. The first one a child ever sees says what this cat is for. */
  const GREETINGS = [
    [
      { text: 'Hi! I am here to cheer you on, not to do the math for you.', gesture: 'cheer' },
      { text: 'Explore anything you like. I will be right here.', gesture: 'idle2' },
    ],
    [
      { text: 'Back again! I saved your spot.', gesture: 'cheer' },
      { text: 'Every word you look at makes your math brain bigger.', gesture: 'tap' },
    ],
    [
      { text: 'Ready when you are.', gesture: 'idle2' },
      { text: 'No rush and no test in here. Just words worth knowing.', gesture: 'tap' },
    ],
    [
      { text: 'Hello again!', gesture: 'cheer' },
      { text: 'Learning a word takes a few visits. That is normal.', gesture: 'idle2' },
    ],
    [
      { text: 'There you are.', gesture: 'idle2' },
      { text: 'Take your time in here. Slow is how it sticks.', gesture: 'tap' },
    ],
  ];

  /* Tool mastery. Each names a real control and what it gets you — the one
     kind of line that is new information rather than a repeat. */
  const TOOL_TIPS = [
    'Drag the big graph to spin it. Every dot is a word.',
    'Pinch the graph to zoom — or use the + and − buttons.',
    'The Listen button reads a word out loud. Try it.',
    'The search box looks inside meanings too, not just names.',
    "Forgot a word's name? Search what it does instead.",
    'Words you have opened keep a little mark, so you can see your trail.',
    'The Curriculum menu adds UK and India words to the graph.',
    'Tap a dot in the graph to jump straight to that word.',
    'The Cat button up top is me. You can change my colour there.',
    'Stuck? The yellow ring shows you where to tap next.',
    'The Listen button helps if a word is hard to say.',
  ];

  /* Pacing. Warm, never scolding — a child clicking fast is engaged, just
     moving quicker than reading allows. */
  const SLOW_DOWN_OPENERS = [
    'Slow down, slow down. It is okay.',
    'Whoa, speedy paws! There is no race here.',
    'Take a breath. The words are not going anywhere.',
    'Hold on — that was quick!',
    'Easy does it.',
    'Careful, you are outrunning me!',
    'Pause here. Just for a second.',
    'That is a lot of clicking!',
    'Nobody is timing you. Promise.',
    'Wait for me!',
    'Slow down a little. It is okay, really.',
    'You are moving faster than these words can land.',
  ];

  const SLOW_DOWN_FOLLOWUPS = [
    'One word at a time is plenty.',
    'Slow is how it sticks.',
    'Racing past a word means missing it.',
    'Your brain needs a second to catch up.',
    'Speed is not the goal. Understanding is.',
    'Pick one and read it all the way through.',
    'Fast clicking, slow learning. Try it the other way.',
    'It is okay to go slowly. That is how it works.',
    'Let this one sink in before the next one.',
    'Deep beats quick, every time.',
    'Give this word a proper look.',
    'There is no prize for finishing first.',
  ];

  /* Milestones. Every line names the effort or the count, never the child's
     ability. */
  const MILESTONES = {
    5: [
      { text: 'Five words! Look at you go.', gesture: 'cheer' },
      { text: 'You showed up and did the work. That is the whole trick.', gesture: 'tap' },
    ],
    10: [
      { text: 'Ten words explored!', gesture: 'cheer' },
      { text: 'Your math vocabulary is bigger than it was this morning.', gesture: 'idle2' },
    ],
    25: [
      { text: 'Twenty-five words!', gesture: 'cheer' },
      { text: 'That is not luck. That is persistence.', gesture: 'tap' },
    ],
    50: [
      { text: 'Fifty words!', gesture: 'cheer' },
      { text: 'You have built something real here.', gesture: 'cheer' },
      { text: 'Every one of those took effort. Yours.', gesture: 'idle2' },
    ],
    100: [
      { text: 'ONE HUNDRED WORDS!', gesture: 'cheer' },
      { text: 'You kept going, over and over. That is the skill.', gesture: 'cheer' },
      { text: 'Go tell somebody. I will wait right here.', gesture: 'idle2' },
    ],
  };
  const MILESTONE_STEPS = Object.keys(MILESTONES).map(Number).sort((a, b) => a - b);

  /* Openers for a word being opened. Naming the word is a nod, not a
     definition, and it is what makes the line feel aimed at this moment
     rather than pasted in from anywhere. */
  const TERM_OPENERS_NAMED = [
    (w) => `"${w}" is yours now.`,
    (w) => `You went for "${w}".`,
    (w) => `"${w}" — say it out loud once.`,
    (w) => `Ah, "${w}".`,
    (w) => `"${w}" is worth knowing.`,
    (w) => `New word: "${w}".`,
    (w) => `"${w}". Take your time with this one.`,
    (w) => `So — "${w}".`,
    (w) => `"${w}" turns up everywhere once you know it.`,
  ];

  const TERM_OPENERS_PLAIN = [
    'Take your time with this one.',
    'Have a proper read.',
    'This one rewards a slow look.',
    'Here we go.',
    'Give this a moment.',
  ];

  /* Revisiting a word. Worth naming out loud, because it is the part that
     actually builds memory and usually feels like going backwards. */
  const REVISIT = [
    'Back again? Reviewing is what makes it stick.',
    'Second look. That is exactly how memory works.',
    'Returning to a word is not going backwards.',
    'You came back to this one on purpose. That works.',
    'Repeats build memory. Keep doing that.',
    'Coming back is a strategy, not a mistake.',
  ];

  const SEARCH_EMPTY_OPENERS = [
    'Nothing matched that one.',
    'Hmm, no luck there.',
    'That search came up empty.',
  ];

  const SEARCH_EMPTY_FOLLOWUPS = [
    'Try a shorter piece of the word.',
    'Not finding it is not failing. Try again.',
    'Spelling is tricky. Try just the first few letters.',
    'Try describing what it does instead.',
  ];

  const SEARCH_FOUND = [
    'There we go.',
    'Found something. Have a look.',
    'That is what searching well looks like.',
    'Your search worked.',
  ];

  /* Situational openers that weave in the grade or topic actually chosen, so
     roughly half of those moments are about *this* choice rather than a line
     that could have appeared anywhere. */
  const GRADE_LINES = [
    (l) => `${l}. Pick whatever looks interesting.`,
    (l) => `${l} words, coming up.`,
    (l) => `${l} has some sturdy words in it.`,
    (l) => `Straight into ${l}, then.`,
  ];

  const TOPIC_LINES = [
    (n) => `${n}. Take these one at a time.`,
    (n) => `${n} words are worth saying out loud.`,
    (n) => `Into ${n} we go.`,
    (n) => `${n}. Pick the one you know least.`,
  ];

  /* One short orientation the first time a child reaches each step. This is
     the only instructional copy left, and it fires once per session. */
  const FIRST_TIME = {
    grade: (label) => [
      { text: `${label} it is.`, gesture: 'cheer' },
      { text: 'Now pick a topic in box 2 on the left.', gesture: 'tap' },
    ],
    topic: (name) => [
      { text: `${name}!`, gesture: 'cheer' },
      { text: 'The words for it show up in box 3, just below.', gesture: 'tap' },
    ],
    term: () => [
      { text: 'The meaning is over on the right whenever you want it.', gesture: 'tap' },
    ],
  };

  // ---- scene builders -----------------------------------------------------

  /* Rotates across the three motivational banks so a session does not turn
     into all growth-mindset or all collaboration. Growth mindset carries the
     most weight because it is the one that generalises beyond vocabulary. */
  function motivationalLine() {
    const roll = Math.random();
    if (roll < 0.55) return pick(GROWTH_MINDSET, 'growth');
    if (roll < 0.85) return pick(VOCAB_MOTIVATION, 'vocab');
    return pick(COLLABORATION, 'collab');
  }

  /* A word opening is the app's main event. Two beats: a nod to the choice,
     then something to carry away. Deliberately no definition and no example
     — the panel on the right is already showing both, and the screen reader
     announcement is already speaking them. */
  function termScene(term, isRevisit) {
    const opener = isRevisit
      ? pick(REVISIT, 'revisit')
      : (Math.random() < 0.75
        ? pick(TERM_OPENERS_NAMED, 'termNamed')(term.term)
        : pick(TERM_OPENERS_PLAIN, 'termPlain'));

    return [
      { text: opener, gesture: isRevisit ? 'tap' : 'cheer' },
      { text: motivationalLine(), gesture: 'idle2' },
    ];
  }

  function firstTermHint() {
    return FIRST_TIME.term();
  }

  function gradeScene(label, isFirst) {
    if (isFirst) return FIRST_TIME.grade(label);
    const text = Math.random() < 0.5
      ? pick(GRADE_LINES, 'gradeLine')(label)
      : motivationalLine();
    return [{ text, gesture: 'tap' }];
  }

  function topicScene(name, isFirst) {
    if (isFirst) return FIRST_TIME.topic(name);
    const text = Math.random() < 0.5
      ? pick(TOPIC_LINES, 'topicLine')(name)
      : motivationalLine();
    return [{ text, gesture: 'tap' }];
  }

  function searchScene(query, count) {
    if (count === 0) {
      return [
        { text: pick(SEARCH_EMPTY_OPENERS, 'searchNoneA'), gesture: 'perk' },
        { text: pick(SEARCH_EMPTY_FOLLOWUPS, 'searchNoneB'), gesture: 'tap' },
      ];
    }
    return [{ text: pick(SEARCH_FOUND, 'searchFound'), gesture: 'cheer' }];
  }

  /* Two beats: name what is happening, then make it okay. The point is that
     a child who slows down should feel supported, not caught. */
  function slowDownScene() {
    return [
      { text: pick(SLOW_DOWN_OPENERS, 'slowA'), gesture: 'perk' },
      { text: pick(SLOW_DOWN_FOLLOWUPS, 'slowB'), gesture: 'tap' },
    ];
  }

  function milestoneFor(count) {
    return MILESTONES[count] || null;
  }

  /* The largest milestone at or below `count`, used at boot to work out which
     celebrations a returning child has already had, so a second visit does
     not replay "Ten words!" for a child who is on ninety. */
  function milestoneFloor(count) {
    let floor = 0;
    MILESTONE_STEPS.forEach((step) => { if (step <= count) floor = step; });
    return floor;
  }

  /* The quiet-page line. Mostly encouragement, with about a third of the
     rotation kept for tool tips — the cat should still be the one who knows
     where everything is. */
  function idleScene() {
    const useTip = Math.random() < 0.34;
    return [{
      text: useTip ? pick(TOOL_TIPS, 'tips') : motivationalLine(),
      gesture: 'tap',
    }];
  }

  function greeting() {
    return pick(GREETINGS, 'greeting');
  }

  function standardsScene() {
    return [{ text: motivationalLine(), gesture: 'tap' }];
  }

  return {
    greeting,
    idleScene,
    termScene,
    firstTermHint,
    gradeScene,
    topicScene,
    searchScene,
    slowDownScene,
    standardsScene,
    milestoneFor,
    milestoneFloor,
  };
}());
