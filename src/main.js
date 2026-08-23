/* =========================================================================
   Application state and wiring.
   ========================================================================= */

let state = { grade: null, domainCode: null, term: null };
let searchQuery = '';

/* The yellow guided highlight is a one-time onboarding aid. Once someone has
   completed grade -> topic -> word once, it is marked done and never shown
   again on this browser. */
let onboarded = readOnboarded();

function readOnboarded() {
  try {
    return localStorage.getItem(STORAGE_KEYS.onboarded) === '1';
  } catch (e) {
    return false;
  }
}

function markOnboarded() {
  onboarded = true;
  try { localStorage.setItem(STORAGE_KEYS.onboarded, '1'); } catch (e) { /* ignore */ }
}

// ---- render -------------------------------------------------------------

function renderAll() {
  if (state.term) {
    markVisited(state.term);
    if (!onboarded) markOnboarded();
  }
  renderGrades();
  renderTopics();
  renderVocabList();
  renderDetail();
  renderStats();
  updateInstruction();
  updateSpotlight();
  Graph.focus(state);

  /* During the first-visit tour the cat is being driven step by step, so its
     usual running commentary would talk over the instructions. */
  if (CatTour.isActive()) CatTour.onStateChange(state);
  else CatWidget.reactToState(state, { seen: visitedTerms.size });
}

// ---- selection ----------------------------------------------------------

function selectGrade(g) {
  state = { grade: g, domainCode: null, term: null };
  clearSearch();
  renderAll();
  Sound.play('grade');
  announce(`${gradeLabel(g)} selected. Choose a topic.`);
}

function selectDomain(code) {
  state = { ...state, domainCode: code, term: null };
  renderAll();
  Sound.play('topic');
  announce(`${DOMAIN_FULLNAME[code]} selected. Choose a vocabulary word.`);
}

function selectTerm(id) {
  // Before renderAll(), whose markVisited() would otherwise erase the
  // difference between a first look and a revisit.
  CatWidget.noteWordOpened(visitedTerms.has(id));
  state = { ...state, term: id };
  renderAll();
  Sound.play('word');
  // After renderAll()'s own reactToState() bubble, so a fast click-through
  // streak in the word list (step 3) overrides the routine word-definition
  // line rather than getting immediately overwritten by it.
  CatWidget.trackWordClick();
  const t = termById(id);
  if (t) announce(`${t.term}. ${t.definition} For example: ${t.example}`);
}

function jumpToTerm(t) {
  CatWidget.noteWordOpened(visitedTerms.has(t.id));
  state = { grade: t.grade, domainCode: t.domainCode, term: t.id };
  clearSearch();
  renderAll();
  Sound.play('word');
  announce(`${t.term}. ${t.definition}`);
}

function resetAll() {
  state = { grade: null, domainCode: null, term: null };
  clearSearch();
  renderAll();
  Sound.play('back');
  announce('Showing the full knowledge graph.');
}

// ---- curriculum filter ---------------------------------------------------

/* Called after activeStandards changes (see curriculum.js). The current
   selection may no longer exist under the new filter — a term that just
   lost its only active curriculum, or a topic with nothing left in it — so
   it is dropped back to the deepest level that still resolves, rather than
   pointing at a word the panels can no longer show. */
function applyStandardsChange() {
  let { grade, domainCode, term } = state;

  if (term) {
    const t = termById(term);
    if (!t || !isTermVisible(t)) term = null;
  }
  if (domainCode && grade && !domainsForGrade(grade).some((d) => d.code === domainCode)) {
    domainCode = null;
    term = null;
  }

  state = { grade, domainCode, term };
  renderAll();
  CatWidget.onStandardsChange();
  const labels = [...activeStandards].map((c) => STANDARD_LABELS[c]).join(', ');
  announce(`Showing ${labels}.`);
}

function clearSearch() {
  searchQuery = '';
  const input = document.getElementById('search');
  if (input) input.value = '';
}

// ---- selection driven from the 3D graph ---------------------------------

/* Tapping a node picks the whole path down to it, so the panels and the
   camera always agree with what was touched. */
function selectFromGraphNode(nodeId) {
  if (nodeId === 'root') return resetAll();

  const parts = nodeId.split(':');
  if (parts[0] === 'grade') return selectGrade(parts[1]);

  if (parts[0] === 'domain') {
    // The node exists structurally even when every term inside it is
    // filtered out (see graph3d.js's *All build) — faded almost to nothing
    // in that case, but still technically tappable, so this checks the
    // filtered list rather than trusting the tap.
    if (!domainsForGrade(parts[1]).some((d) => d.code === parts[2])) return;
    state = { grade: parts[1], domainCode: parts[2], term: null };
    clearSearch();
    renderAll();
    announce(`${DOMAIN_FULLNAME[parts[2]]} selected. Choose a vocabulary word.`);
    return;
  }

  if (parts[0] === 'term') {
    const t = termById(nodeId.slice(5));
    if (t && isTermVisible(t)) jumpToTerm(t);
  }
}

// ---- boot ---------------------------------------------------------------

function bindControls() {
  document.getElementById('backHomeLink').querySelector('.btn-icon').innerHTML = iconSvg('home', { size: 18 });
  document.getElementById('resetViewBtn').addEventListener('click', resetAll);
  document.getElementById('zoomInBtn').addEventListener('click', () => Graph.zoomIn());
  document.getElementById('zoomOutBtn').addEventListener('click', () => Graph.zoomOut());
  bindGradeLabelsToggle();

  let searchTimer = null;
  document.getElementById('search').addEventListener('input', (event) => {
    const value = event.target.value.trim();
    clearTimeout(searchTimer);
    // Debounced so typing doesn't rebuild a 150-row list on every keystroke.
    searchTimer = setTimeout(() => {
      const changed = searchQuery !== value;
      searchQuery = value;
      renderVocabList();
      if (changed && value) Sound.play('search');
    }, 140);
  });

  bindRovingGroup(document.getElementById('gradeRow'), 'horizontal');
  bindRovingGroup(document.getElementById('topicList'), 'vertical');
  bindRovingGroup(document.getElementById('vocabList'), 'vertical');

  bindSoundToggle();
  window.addEventListener('resize', updateSpotlight);
}

/* The toggle reflects state in its icon, its label and aria-pressed, so it
   reads correctly by sight and by screen reader. */
function bindSoundToggle() {
  const btn = document.getElementById('soundBtn');

  const sync = () => {
    const on = Sound.isOn();
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Sound on. Turn sound off.' : 'Sound off. Turn sound on.');
    btn.innerHTML = iconSvg(on ? 'soundOn' : 'soundOff', { size: 18 })
      + `<span class="btn-text">${on ? 'Sound' : 'Muted'}</span>`;
  };

  btn.addEventListener('click', () => {
    Sound.toggle();
    // "Sound" is meant as one switch for everything audible, including
    // whatever Fish Audio is mid-sentence on — not just the UI chimes.
    if (!Sound.isOn()) stopSpeaking();
    sync();
  });
  sync();
}

function bindGradeLabelsToggle() {
  const checkbox = document.getElementById('gradeLabelsCheckbox');
  let on = false;
  try { on = localStorage.getItem(STORAGE_KEYS.showGradeLabels) === '1'; } catch (e) { /* ignore */ }

  checkbox.checked = on;
  Graph.setShowGradeLabels(on);

  checkbox.addEventListener('change', () => {
    Graph.setShowGradeLabels(checkbox.checked);
    try {
      localStorage.setItem(STORAGE_KEYS.showGradeLabels, checkbox.checked ? '1' : '0');
    } catch (e) { /* private browsing */ }
  });
}

function boot() {
  Sound.init();
  bindControls();
  ResetProgress.init();
  Curriculum.init();
  CatWidget.init();
  // After CatWidget.init(), which loads the stored colour and visibility the
  // Cat menu reflects.
  CatSettings.init();
  // Before renderAll(), so a pending tour has already claimed the opening
  // line by the time the cat would otherwise greet.
  CatTour.init();
  if (CatTour.isPending()) CatWidget.suppressGreeting();
  initPanelResizers();
  renderAll();

  Graph.setOnSelect(selectFromGraphNode);
  Graph.init(
    document.getElementById('graphContainer'),
    document.getElementById('graphLabels'),
  );
  // The graph reads its framing from the panel size, so re-focus once it is up.
  Graph.focus(state);
  GraphIntro.run();
}

boot();
