/* =========================================================================
   The first-visit guided tour.

   Runs once, ever, on a given browser: the cat offers to show a child around,
   and if they say yes it walks the three numbered steps in order — grade,
   topic, word — perching on the real element each step is about and tapping
   at it, then finishes on the definition panel and returns to its corner.

   Two rules shape the whole thing:

   - The cat never advances the app itself. It lands, it points, and then it
     waits for the child to make the choice. Each step is unblocked by a real
     selection arriving through onStateChange(), whether that came from the
     list, the search box or a tap on the 3D graph.

   - Every perch is measured off the live element (see perchOn/perchPoint in
     src/cat.js), never off hard-coded coordinates, so the cat stays on the
     right card when the panels are resized, the curriculum filter changes the
     list, or the page is opened at any window size.
   ========================================================================= */

const CatTour = (function () {
  const STORAGE_KEY = 'mathVocabCatTourDone';

  /* A beat between landing on a step and speaking about it, so the two do not
     arrive at once and the child's eye can follow the cat down. */
  const SETTLE_MS = 420;
  // Long enough after load that the tour is not competing with the graph
  // fading in, and the page has settled where it is going to be.
  const OPENING_MS = 1600;

  let step = 'idle';
  let timer = null;

  // ---- persistence --------------------------------------------------------

  function alreadyTaken() {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      // Private browsing: better to skip the tour than to replay it forever.
      return true;
    }
  }

  function markTaken() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* private browsing */ }
  }

  // ---- targets ------------------------------------------------------------

  /* Each step names the element the cat should stand on and which part of its
     top edge to stand on. Looked up fresh every time, because these lists are
     rebuilt from scratch on every render. */
  const TARGETS = {
    grade: () => document.querySelector('#gradeRow .grade-node'),
    topic: () => document.querySelector('#topicList .topic-node'),
    word: () => document.querySelector('#vocabList .vocab-row'),
    detail: () => document.getElementById('listenBtn'),
  };

  const ALIGN = { grade: 'centre', topic: 'right', word: 'right', detail: 'centre' };

  /* What the bubble has to stay off at each stop. Usually just the element
     the cat is standing on, but the grade step guards the whole row of
     buttons: the cat perches on the first one and the child needs to be able
     to see and tap any of the six. contentRect() (src/ui.js) measures the
     buttons themselves rather than their full-width container. */
  const AVOID = {
    grade: () => contentRect(document.getElementById('gradeRow'), '.grade-node'),
    topic: () => document.getElementById('topicList').getBoundingClientRect(),
    word: () => document.getElementById('vocabList').getBoundingClientRect(),
    detail: () => document.getElementById('listenBtn').getBoundingClientRect(),
  };

  const LINES = {
    grade: 'Start here. Tap any grade — they all work.',
    topic: 'Now a topic. Pick whichever one you like the sound of.',
    word: 'And now a word. Any of them.',
    detailA: 'Everything about your word lands over here.',
    detailB: 'You can hear it read out loud, and see it used in a real example.',
    farewell: 'I will stay right here from now on.',
  };

  // ---- flow ---------------------------------------------------------------

  function isActive() {
    return step !== 'idle' && step !== 'done';
  }

  function after(ms, fn) {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  }

  /* Lands on the step's element, taps at it, then says its line and waits.
     The line persists rather than timing out — it is asking for something, so
     it should still be there whenever the child looks up. */
  function goToStep(name) {
    const el = TARGETS[name]();
    if (!el) return finish();

    step = name;
    CatWidget.tour.perchOn(el, ALIGN[name], AVOID[name], () => {
      after(SETTLE_MS, () => {
        if (step !== name) return;
        CatWidget.tour.say(LINES[name], { persist: true });
      });
    });
  }

  /* The last stop is the only one the cat talks through rather than waits at,
     because there is nothing here the child has to choose — so it explains,
     then hands control back with a button. */
  function goToDetail() {
    const el = TARGETS.detail();
    if (!el) return finish();

    step = 'detail';
    CatWidget.tour.perchOn(el, ALIGN.detail, AVOID.detail, () => {
      after(SETTLE_MS, () => {
        if (step !== 'detail') return;
        CatWidget.tour.say(LINES.detailA, {}, () => {
          if (step !== 'detail') return;
          CatWidget.tour.say(LINES.detailB, {
            actions: [{ label: 'Next', onClick: finish }],
          });
        });
      });
    });
  }

  function finish() {
    clearTimeout(timer);
    step = 'done';
    markTaken();
    CatWidget.tour.exit(() => {
      // Said from the strip it has just landed back on, so "here" means something.
      CatWidget.say(LINES.farewell);
    });
  }

  function decline() {
    clearTimeout(timer);
    step = 'done';
    markTaken();
    CatWidget.tour.exit(() => {
      CatWidget.say('No problem. Explore anything you like — I am here either way.');
    });
  }

  // ---- hooks --------------------------------------------------------------

  /* Called at the end of every renderAll(). Each waiting step is unblocked by
     its own part of the selection appearing, so it does not matter whether the
     child used the list, the search box or the graph to get there. */
  function onStateChange(state) {
    if (!isActive()) return;

    // Someone who starts exploring before answering has answered.
    if (step === 'prompt') {
      if (state.grade) decline();
      return;
    }

    if (step === 'grade' && state.grade) return after(SETTLE_MS, () => goToStep('topic'));
    if (step === 'topic' && state.domainCode) return after(SETTLE_MS, () => goToStep('word'));
    if (step === 'word' && state.term) return after(SETTLE_MS, goToDetail);
    return undefined;
  }

  /* Whether a tour is going to happen this page load — checked by the cat so
     it can hold back its usual greeting and let the offer go first. */
  function isPending() {
    return step === 'pending';
  }

  /* Re-run on demand from the Cat menu. Clears the once-ever flag so the
     normal path applies, then arms it again — including the offer, because
     someone who asked for the walkthrough should still get to back out. */
  function restart() {
    clearTimeout(timer);
    step = 'idle';
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* private browsing */ }
    if (!CatWidget.isVisible()) return;

    step = 'prompt';
    CatWidget.tour.enter();
    CatWidget.tour.say('Want the walkthrough again?', {
      actions: [
        { label: 'Yes, please', onClick: () => goToStep('grade') },
        { label: 'Not now', primary: false, onClick: decline },
      ],
    });
  }

  function init() {
    // A browser that has seen it, a child who has already explored words, or
    // a hidden cat: all reasons to leave the page alone.
    if (alreadyTaken() || !CatWidget.isVisible() || visitedTerms.size > 0) {
      step = 'done';
      return;
    }

    step = 'pending';
    after(OPENING_MS, () => {
      if (step !== 'pending') return;
      // Turning the cat off during the opening delay counts as a no.
      if (!CatWidget.isVisible()) { step = 'done'; return; }

      step = 'prompt';
      CatWidget.tour.enter();
      CatWidget.tour.say('First time here? I can show you around.', {
        actions: [
          { label: 'Yes, show me', onClick: () => goToStep('grade') },
          { label: 'No thanks', primary: false, onClick: decline },
        ],
      });
    });
  }

  return { init, restart, onStateChange, isActive, isPending };
}());
