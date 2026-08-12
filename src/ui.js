/* =========================================================================
   Panel rendering: the grade row, topic list, vocabulary list and the
   definition panel.

   Every choice is a real <button> with an accessible name and pressed
   state. In the first version these were bare <div onclick> elements, which
   meant the whole app had exactly three keyboard-reachable controls and a
   screen reader saw none of the 189 words.
   ========================================================================= */

// ---- progress ------------------------------------------------------------

const visitedTerms = loadVisited();

function loadVisited() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.visited);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (e) {
    return new Set();
  }
}

function markVisited(id) {
  if (visitedTerms.has(id)) return;
  visitedTerms.add(id);
  try {
    localStorage.setItem(STORAGE_KEYS.visited, JSON.stringify([...visitedTerms]));
  } catch (e) { /* private browsing — progress just won't persist */ }
}

function gradeProgress(g) {
  const terms = byGrade(g);
  if (!terms.length) return { seen: 0, total: 0, percent: 0 };
  const seen = terms.filter((t) => visitedTerms.has(t.id)).length;
  return { seen, total: terms.length, percent: Math.round((seen / terms.length) * 100) };
}

// ---- screen reader announcements ----------------------------------------

let announceTimer = null;

function announce(message) {
  const region = document.getElementById('srAnnounce');
  if (!region) return;
  clearTimeout(announceTimer);
  // Clearing first makes repeat announcements of the same text speak again.
  region.textContent = '';
  announceTimer = setTimeout(() => { region.textContent = message; }, 60);
}

// ---- roving tabindex ----------------------------------------------------

/* Tab moves between the three groups; arrow keys move within a group. With
   189 vocabulary buttons, plain tab-through-everything would be unusable. */
function bindRovingGroup(containerEl, orientation) {
  containerEl.addEventListener('keydown', (event) => {
    const items = [...containerEl.querySelectorAll('button')];
    if (!items.length) return;
    const current = items.indexOf(document.activeElement);
    if (current === -1) return;

    const nextKeys = orientation === 'horizontal' ? ['ArrowRight', 'ArrowDown'] : ['ArrowDown', 'ArrowRight'];
    const prevKeys = orientation === 'horizontal' ? ['ArrowLeft', 'ArrowUp'] : ['ArrowUp', 'ArrowLeft'];

    let next = null;
    if (nextKeys.includes(event.key)) next = (current + 1) % items.length;
    else if (prevKeys.includes(event.key)) next = (current - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    if (next === null) return;

    event.preventDefault();
    items.forEach((el, i) => { el.tabIndex = i === next ? 0 : -1; });
    items[next].focus();
  });
}

/* Exactly one button per group is in the tab order — the selected one, or
   the first if nothing is selected yet. */
function syncTabStops(containerEl) {
  const items = [...containerEl.querySelectorAll('button')];
  if (!items.length) return;
  const selected = items.find((el) => el.getAttribute('aria-pressed') === 'true');
  items.forEach((el) => { el.tabIndex = -1; });
  (selected || items[0]).tabIndex = 0;

  // The topic and word lists are short scroll regions; without this the
  // selected item can sit half-clipped at the edge of its panel.
  if (selected) {
    selected.scrollIntoView({ block: 'nearest', behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
  }
}

// ---- grade row ----------------------------------------------------------

function renderGrades() {
  const row = document.getElementById('gradeRow');
  row.innerHTML = '';
  GRADES.forEach((g) => {
    const progress = gradeProgress(g);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'grade-node';
    btn.textContent = g;
    btn.setAttribute('aria-pressed', state.grade === g ? 'true' : 'false');
    btn.style.setProperty('--progress', progress.percent);
    if (progress.seen > 0) btn.dataset.started = '1';
    btn.setAttribute('aria-label', progress.seen > 0
      ? `${gradeLabel(g)}. ${progress.seen} of ${progress.total} words explored.`
      : `${gradeLabel(g)}. ${progress.total} words.`);
    btn.addEventListener('click', () => selectGrade(g));
    row.appendChild(btn);
  });
  syncTabStops(row);
}

// ---- topic list ---------------------------------------------------------

function renderTopics() {
  const headingText = document.getElementById('topicsHeadingText');
  const heading = document.getElementById('topicsHeading');
  const list = document.getElementById('topicList');
  list.innerHTML = '';

  if (!state.grade) {
    headingText.textContent = 'Select a grade above';
    heading.classList.add('dim');
    list.innerHTML = '<p class="placeholder-text">Topics for the selected grade will appear here.</p>';
    return;
  }

  heading.classList.remove('dim');
  const domains = domainsForGrade(state.grade);

  if (!domains.length) {
    headingText.textContent = 'Select a topic';
    list.innerHTML = '<p class="placeholder-text">'
      + `No topics for ${escapeHtml(gradeLabel(state.grade))} under the curricula you’ve selected. `
      + 'Turn on another curriculum above the graph to see more.</p>';
    announce(`No topics for ${gradeLabel(state.grade)} under the current curriculum selection.`);
    return;
  }

  headingText.textContent = 'Select a topic';
  domains.forEach(({ code, name }) => {
    const count = termsFor(state.grade, code).length;
    const badges = standardBadgesFor(state.grade, code);
    const badgesHtml = badges.map((b) => `<span class="standard-badge standard-badge-${b.country.toLowerCase()}">${escapeHtml(b.label)}</span>`).join('');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'topic-node';
    btn.setAttribute('aria-pressed', state.domainCode === code ? 'true' : 'false');
    btn.innerHTML = `<span class="topic-icon" aria-hidden="true">${domainIconSvg(code, { size: 20 })}</span>`
      + `<span class="topic-text">`
      + `<span class="topic-label">${escapeHtml(name)}</span>`
      + `<span class="topic-badges">${badgesHtml}</span>`
      + `<span class="topic-count">${count} terms</span>`
      + `</span>`;
    btn.setAttribute('aria-label', `${name}. ${badges.map((b) => b.label).join(', ')}. ${count} terms.`);
    btn.addEventListener('click', () => selectDomain(code));
    list.appendChild(btn);
  });
  syncTabStops(list);
}

// ---- vocabulary list ----------------------------------------------------

function renderVocabList() {
  const headingText = document.getElementById('vocabHeadingText');
  const heading = document.getElementById('vocabHeading');
  const list = document.getElementById('vocabList');
  list.innerHTML = '';

  if (searchQuery) {
    renderSearchResults(list, heading, headingText);
    return;
  }

  if (!state.grade || !state.domainCode) {
    headingText.textContent = state.grade ? 'Select a topic first' : 'Select a grade first';
    heading.classList.add('dim');
    list.innerHTML = '<p class="placeholder-text">Vocabulary words will appear here once you pick a topic.</p>';
    return;
  }

  heading.classList.remove('dim');
  headingText.textContent = 'Select a vocabulary word';
  termsFor(state.grade, state.domainCode).forEach((t) => {
    list.appendChild(vocabButton(t, false));
  });
  syncTabStops(list);
}

function renderSearchResults(list, heading, headingText) {
  const query = searchQuery.toLowerCase();
  // Search covers definitions and examples too, not just the term itself —
  // a child who remembers "the top number" should still find "numerator".
  // Scoped to the active curricula, same as every other list in the app.
  const matches = DATA.filter((d) => isTermVisible(d) && (d.term.toLowerCase().includes(query)
    || d.definition.toLowerCase().includes(query)
    || (d.example || '').toLowerCase().includes(query)));

  heading.classList.remove('dim');
  headingText.textContent = `Search results (${matches.length})`;

  if (!matches.length) {
    list.innerHTML = '<p class="placeholder-text">No terms match your search.</p>';
    announce('No terms match your search.');
    return;
  }
  matches.slice(0, 150).forEach((t) => { list.appendChild(vocabButton(t, true)); });
  syncTabStops(list);
  announce(`${matches.length} ${matches.length === 1 ? 'result' : 'results'}.`);
}

function vocabButton(t, showGrade) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'vocab-row';
  btn.setAttribute('aria-pressed', state.term === t.id ? 'true' : 'false');

  const seen = visitedTerms.has(t.id);
  btn.innerHTML = `<span class="vocab-icon" aria-hidden="true">${termIconSvg(t, { size: 19 })}</span>`
    + `<span class="vocab-name">${escapeHtml(t.term)}</span>`
    + (showGrade ? `<span class="vocab-grade">${escapeHtml(gradeLabel(t.grade))}</span>` : '')
    + (!showGrade && seen
      ? `<span class="vocab-seen" aria-hidden="true">${iconSvg('check', { size: 16 })}</span>`
      : '');

  btn.setAttribute('aria-label', showGrade
    ? `${t.term}. ${gradeLabel(t.grade)}.`
    : `${t.term}.${seen ? ' Already explored.' : ''}`);

  btn.addEventListener('click', () => (showGrade ? jumpToTerm(t) : selectTerm(t.id)));
  return btn;
}

// ---- definition panel ---------------------------------------------------

function renderDetail() {
  const detail = document.getElementById('detail');
  // The panel is about to be replaced wholesale — including #listenAudio —
  // so anything still playing or in flight has to be stopped here, not left
  // to keep running on an element that is no longer even on screen.
  stopSpeaking();
  if (!state.term) {
    detail.innerHTML = '<p class="placeholder">Select a grade, then a topic, then a word to see its definition here.</p>';
    return;
  }
  const t = termById(state.term);
  if (!t) return;

  detail.innerHTML = `
    <p class="breadcrumb">
      <span class="crumb-icon" aria-hidden="true">${domainIconSvg(t.domainCode, { size: 15 })}</span>
      ${escapeHtml(gradeLabel(t.grade))} · ${escapeHtml(t.domain)}
    </p>

    <div class="term-head">
      <span class="term-mark" aria-hidden="true">${termIconSvg(t, { size: 30 })}</span>
      <div>
        <h2>${escapeHtml(t.term)}</h2>
        <span class="standard">${t.standards.map((s) => `<span class="standard-badge standard-badge-${s.country.toLowerCase()}">${escapeHtml(s.country)} · ${escapeHtml(s.code)}</span>`).join('')}</span>
      </div>
    </div>

    <button id="listenBtn" type="button" aria-describedby="listenStatus"
            aria-label="Listen to an explanation of the word ${escapeHtml(t.term)}">
      <span class="icon" aria-hidden="true">${iconSvg('speaker', { size: 20 })}</span>
      <span id="listenBtnText">Listen to an explanation</span>
    </button>
    <p id="listenStatus" role="status" aria-live="polite"></p>
    <audio id="listenAudio" preload="none"></audio>

    <div class="block">
      <h3 class="block-label">What it means</h3>
      <p class="block-body">${escapeHtml(t.definition)}</p>
    </div>

    <section class="story" aria-labelledby="storyHeading">
      <h3 class="story-heading" id="storyHeading">
        <span aria-hidden="true">${iconSvg('spark', { size: 17 })}</span>
        See it in an example
      </h3>
      <p class="story-body">${escapeHtml(t.example)}</p>
    </section>

    ${t.misconception ? `<div class="block">
      <h3 class="block-label">Watch out for</h3>
      <p class="block-body misconception">${escapeHtml(t.misconception)}</p>
    </div>` : ''}
  `;
  document.getElementById('listenBtn').addEventListener('click', () => speakTerm(t));
}

// ---- onboarding hint + spotlight ---------------------------------------

function updateInstruction() {
  const hint = document.getElementById('graphHint');
  const resetBtn = document.getElementById('resetViewBtn');
  const breadcrumb = document.getElementById('breadcrumbFloat');

  resetBtn.hidden = !state.grade;

  if (state.term) {
    const t = termById(state.term);
    breadcrumb.hidden = false;
    breadcrumb.textContent = `${gradeLabel(t.grade)} → ${t.domain} → ${t.term}`;
  } else {
    breadcrumb.hidden = true;
  }

  if (onboarded) { hint.hidden = true; return; }

  if (!state.grade) {
    hint.hidden = false;
    hint.textContent = 'Pick a grade above to start exploring ↑';
  } else if (!state.domainCode) {
    hint.hidden = false;
    hint.textContent = 'Now pick a topic on the left ←';
  } else if (!state.term) {
    hint.hidden = false;
    hint.textContent = 'Now pick a vocabulary word on the left ←';
  } else {
    hint.hidden = true;
  }
}

function updateSpotlight() {
  const ring = document.getElementById('spotlightRing');
  const hide = () => {
    ring.classList.remove('active');
    ring.style.opacity = '0';
  };
  if (onboarded) return hide();

  let target = null;
  if (!state.grade) target = document.getElementById('gradeRow');
  else if (!state.domainCode) target = document.getElementById('topicsSection');
  else if (!state.term) target = document.getElementById('vocabSection');
  if (!target) return hide();

  const r = target.getBoundingClientRect();
  ring.classList.add('active');
  ring.style.opacity = '1';
  const vars = {
    left: `${r.left - 6}px`, top: `${r.top - 6}px`,
    width: `${r.width + 12}px`, height: `${r.height + 12}px`,
  };
  if (REDUCED_MOTION || typeof gsap === 'undefined') {
    Object.assign(ring.style, vars);
  } else {
    gsap.to(ring, {
      left: r.left - 6, top: r.top - 6, width: r.width + 12, height: r.height + 12,
      duration: 0.55, ease: EASE_INOUT, overwrite: true,
    });
  }
}

// ---- footer -------------------------------------------------------------

function renderStats() {
  const total = DATA.filter(isTermVisible).length;
  const seen = visitedTerms.size;
  const curricula = STANDARD_COUNTRIES.filter((c) => activeStandards.has(c))
    .map((c) => STANDARD_LABELS[c]).join(', ');
  document.getElementById('statsText').textContent =
    `${total} words · ${GRADES.length} grades · Standards covered: ${curricula}`
    + ` · ${seen} explored · CC BY-NC 4.0`;

  // The header count and search copy track the same live, filtered total —
  // both are user-facing claims about how many words are here right now.
  document.getElementById('headerWordCount').textContent = total;
  const searchLabel = document.getElementById('searchLabel');
  const searchInput = document.getElementById('search');
  searchLabel.textContent = `Search all ${total} math words, Kindergarten through Grade 5`;
  searchInput.placeholder = `Search all ${total} words, K–5…`;
}
