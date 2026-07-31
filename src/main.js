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
}

// ---- selection ----------------------------------------------------------

function selectGrade(g) {
  state = { grade: g, domainCode: null, term: null };
  clearSearch();
  renderAll();
  announce(`${gradeLabel(g)} selected. Choose a topic.`);
}

function selectDomain(code) {
  state = { ...state, domainCode: code, term: null };
  renderAll();
  announce(`${DOMAIN_FULLNAME[code]} selected. Choose a vocabulary word.`);
}

function selectTerm(id) {
  state = { ...state, term: id };
  renderAll();
  const t = termById(id);
  if (t) announce(`${t.term}. ${t.definition} For example: ${t.example}`);
}

function jumpToTerm(t) {
  state = { grade: t.grade, domainCode: t.domainCode, term: t.id };
  clearSearch();
  renderAll();
  announce(`${t.term}. ${t.definition}`);
}

function resetAll() {
  state = { grade: null, domainCode: null, term: null };
  clearSearch();
  renderAll();
  announce('Showing the full knowledge graph.');
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
    state = { grade: parts[1], domainCode: parts[2], term: null };
    clearSearch();
    renderAll();
    announce(`${DOMAIN_FULLNAME[parts[2]]} selected. Choose a vocabulary word.`);
    return;
  }

  if (parts[0] === 'term') {
    const t = termById(nodeId.slice(5));
    if (t) jumpToTerm(t);
  }
}

// ---- boot ---------------------------------------------------------------

function bindControls() {
  document.getElementById('resetViewBtn').addEventListener('click', resetAll);

  let searchTimer = null;
  document.getElementById('search').addEventListener('input', (event) => {
    const value = event.target.value.trim();
    clearTimeout(searchTimer);
    // Debounced so typing doesn't rebuild a 150-row list on every keystroke.
    searchTimer = setTimeout(() => {
      searchQuery = value;
      renderVocabList();
    }, 140);
  });

  bindRovingGroup(document.getElementById('gradeRow'), 'horizontal');
  bindRovingGroup(document.getElementById('topicList'), 'vertical');
  bindRovingGroup(document.getElementById('vocabList'), 'vertical');

  window.addEventListener('resize', updateSpotlight);
}

function boot() {
  bindControls();
  About.init();
  renderAll();

  Graph.setOnSelect(selectFromGraphNode);
  Graph.init(
    document.getElementById('graphContainer'),
    document.getElementById('graphLabels'),
  );
  // The graph reads its framing from the panel size, so re-focus once it is up.
  Graph.focus(state);
}

boot();
