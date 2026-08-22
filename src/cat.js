/* =========================================================================
   Pixel cat — a pedagogical companion that lives in the page's right corner.

   Art: KINGS-MZ/PixelCat (github.com/KINGS-MZ/PixelCat), MIT licensed. Only
   the cat sprite sheet is reused (assets/cat/cat_sheet.png); none of that
   extension's game systems — coins, fish, spiders, quests — come with it,
   since this cat's job is to coach a child through a vocabulary tool rather
   than to be played with.

   The sheet is 8 columns x 10 rows of 32px cells, one animation per row.
   This file is the engine: it steps the sheet, moves the cat along the strip
   of floor above the footer, and decides what it should be doing. What it
   *says* lives in src/catDialogue.js.

   Two deliberate constraints:

   - It never moves off the right-hand corner. The cat roams a short patch of
     floor anchored to the right edge and walks home when it strays, so a
     child always knows where to look for it.

   - It stays out of the accessibility tree. The bubble only ever repeats
     what the panels already show, and every hint it gives is also reachable
     from the "Tip" button in the Cat menu, which is a real focusable
     control. A screen reader user therefore loses nothing by not hearing a
     decorative cat narrate the page a second time (see #srAnnounce).
   ========================================================================= */

const CatWidget = (function () {
  // ---- sprite sheet -------------------------------------------------------

  const CELL = 32;
  const SHEET_COLS = 8;
  const SHEET_ROWS = 10;
  const SCALE = 3;            // 96px on screen
  const SCALE_SMALL = 2.25;   // 72px under 640px wide
  /* The art sits in the lower 26 of each 32px cell — the same inset the
     source project applies as its yOffset. The cell is drawn whole (so the
     feet land on the floor line), and this is only used to tuck the speech
     bubble down to the cat's actual head instead of the empty cell top. */
  const CELL_TOP_PADDING = 6;

  /* One entry per row of the sheet. `fps` drives the gestures that play in
     place; the two travelling gaits ignore it and advance on distance
     covered instead (see `pxPerFrame`) so the paws never slide on the floor. */
  const ANIMS = {
    idle1: { row: 0, frames: 4, fps: 2 },
    idle2: { row: 1, frames: 4, fps: 2 },
    groom: { row: 2, frames: 4, fps: 3 },
    groom2: { row: 3, frames: 4, fps: 3 },
    walk: { row: 4, frames: 8, fps: 8, pxPerFrame: 7 },
    run: { row: 5, frames: 8, fps: 11, pxPerFrame: 11 },
    sleep: { row: 6, frames: 4, fps: 1.5 },
    tap: { row: 7, frames: 6, fps: 6 },
    cheer: { row: 8, frames: 7, fps: 10 },
    perk: { row: 9, frames: 8, fps: 6 },
  };

  const GAIT_SPEED_PX_S = { walk: 30, run: 105 };

  // ---- behaviour timing ---------------------------------------------------

  const MIN_IDLE_MS = 7000;
  const MAX_IDLE_MS = 14000;
  // How long a gesture that plays in place holds before the cat settles.
  const GESTURE_MS = { tap: 2400, cheer: 2100, groom: 4200, groom2: 4200, perk: 1500 };
  const MIN_MOVE_MS = 450;
  const MAX_MOVE_MS = 9000;

  /* Weighted pick for "what should the cat do next" when nothing in the app
     has happened. Walking wins most of the time; running is the rare treat
     that makes a child look up. */
  const AMBIENT_WEIGHTS = { walk: 5, tap: 3, groom: 2, cheer: 1, run: 1 };

  // Quiet for this long and the cat offers a hint about the tool.
  const TIP_AFTER_MS = 38000;
  // Quiet for *this* long and it curls up instead. Any activity wakes it.
  const SLEEP_AFTER_MS = 95000;

  // ---- speech -------------------------------------------------------------

  /* Reading time. `hold` starts when the last character has been typed, so
     MIN_HOLD_MS is a floor on how long a *finished* line stays readable —
     five seconds even for a three-word one. Short lines were vanishing in
     about two seconds before this, which is nowhere near enough for a child
     who is still decoding the sentence.

     A typical line lands around seven seconds all in: roughly a second and
     a half of typing plus the five-second floor. Longer sentences earn more
     hold per character, up to the cap. */
  const TYPE_MS_PER_CHAR = 24;
  const MIN_HOLD_MS = 5000;
  const MAX_HOLD_MS = 9000;
  const HOLD_MS_PER_CHAR = 60;
  const BUBBLE_GAP_PX = 10;

  // ---- click-rate coaching (step 3, the word list) ------------------------

  /* Four consecutive words opened at an average of less than a second and a
     half apart. At that pace nobody is reading the definition panel, so the
     cat steps in — but it is a *rate* over several picks, never one quick
     click, so a child who knows exactly which word they want is not scolded
     for going straight to it.

     The cooldown is longer than a slow-down scene takes to play (two beats,
     around thirteen seconds), so the coaching can never stack on itself. */
  const RAPID_CLICK_WINDOW = 4;
  const RAPID_CLICK_AVG_MS = 1500;
  const RAPID_CLICK_COOLDOWN_MS = 25000;

  // ---- element + state ----------------------------------------------------

  let root, unit, sprite, bubble, bubbleText, bubbleSizer, bubbleTail;

  let skin = 'white';
  let visible = true;
  let started = false;

  // Current animation.
  let anim = 'idle1';
  let frame = 0;
  let frameClock = 0;
  let facingRight = false;

  // Current position along the floor strip, in px from the strip's left edge.
  let x = 0;
  let homeX = 0;
  let move = null;      // { from, to, duration, elapsed } while travelling
  let rafId = null;
  let lastTime = 0;

  // What the cat is currently committed to, and until when.
  let busyUntil = 0;
  let asleep = false;
  let lastActivityAt = 0;
  let tipShownAt = 0;

  // Speech.
  let scene = null;     // { beats, index }
  let typeTimer = null;
  let holdTimer = null;
  let hideTimer = null;
  let skinAnimation = null;

  // Context bookkeeping.
  let lastSpokenKey = null;
  let lastMilestone = 0;
  let introduced = { grade: false, topic: false, term: false };
  let wordClickTimes = [];
  let lastRapidWarnAt = -Infinity;
  /* How this session has been paced. In memory for the session only —
     nothing about how a child clicks is written to storage or sent
     anywhere. Read it with CatWidget.getPacing(). */
  const pacing = { opens: 0, lastAvgGapMs: null, fastestAvgGapMs: null, coached: 0 };
  let lastSearchKey = null;
  // Set by noteWordOpened() just before renderAll() runs, because
  // markVisited() inside it will already have marked the term by then.
  let wasRevisit = false;

  // ---- persistence --------------------------------------------------------

  function loadSkin() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.catSkin);
      return CAT_SKINS.includes(raw) ? raw : 'white';
    } catch (e) {
      return 'white';
    }
  }

  function loadVisible() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.showCat);
      return raw === null ? true : raw === '1';   // visible on a first visit
    } catch (e) {
      return true;
    }
  }

  function save(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private browsing */ }
  }

  // ---- sprite rendering ---------------------------------------------------

  function scale() {
    return window.innerWidth <= 640 ? SCALE_SMALL : SCALE;
  }

  function spriteSize() {
    return CELL * scale();
  }

  /* Re-lays the sprite box whenever the scale changes (a rotated iPad
     crossing the 640px breakpoint), then repaints the current cell. */
  function layoutSprite() {
    const s = scale();
    sprite.style.width = `${CELL * s}px`;
    sprite.style.height = `${CELL * s}px`;
    sprite.style.backgroundSize = `${SHEET_COLS * CELL * s}px ${SHEET_ROWS * CELL * s}px`;
    paint();
  }

  function paint() {
    const s = scale();
    const def = ANIMS[anim] || ANIMS.idle1;
    sprite.style.backgroundPosition = `${-frame * CELL * s}px ${-def.row * CELL * s}px`;
    sprite.classList.toggle('face-right', facingRight);
  }

  function setAnim(name) {
    if (!ANIMS[name] || anim === name) return;
    anim = name;
    frame = 0;
    frameClock = 0;
    paint();
  }

  // ---- the floor strip ----------------------------------------------------

  /* The cat's world is the widget box — a short strip pinned to the right
     edge of the footer's top border. Half a sprite is kept clear of each end
     so it never walks out of its own box. */
  function bounds() {
    const total = root.clientWidth || 0;
    const half = spriteSize() / 2;
    return { min: half, max: Math.max(half, total - half) };
  }

  function place(px) {
    x = px;
    unit.style.left = `${px}px`;
  }

  /* Home is the right end of the strip: the corner itself. Everything else
     the cat does is an excursion it comes back from. */
  function goHome() {
    homeX = bounds().max;
    place(homeX);
  }

  /* A resize moves the goalposts mid-walk: the target the cat set off for
     may now be outside the strip, so the trip is abandoned rather than
     clamped — stopping where it stands reads as a cat pausing, while
     retargeting mid-stride reads as a glitch. */
  function clampToBounds() {
    const { min, max } = bounds();
    homeX = max;
    move = null;
    place(Math.min(Math.max(x, min), max));
    layoutSprite();
    if (scene) positionBubble();
  }

  // ---- movement -----------------------------------------------------------

  function easeInOut(p) {
    // Cubic in-out: the cat leans into a walk and settles out of it rather
    // than snapping to full speed, matching every other motion in the app.
    return p < 0.5 ? 4 * p * p * p : 1 - ((-2 * p + 2) ** 3) / 2;
  }

  function pickTarget() {
    const { min, max } = bounds();
    const span = max - min;
    if (span <= 1) return x;

    // Drifted most of the way across the strip? Head back to the corner, so
    // the cat is never far from where a child last saw it.
    if (Math.abs(x - homeX) > span * 0.55) return homeX;

    const minTravel = span * 0.2;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const target = min + Math.random() * span;
      if (Math.abs(target - x) >= minTravel) return target;
    }
    return homeX;
  }

  function beginMove(gait) {
    const target = pickTarget();
    const distance = Math.abs(target - x);
    if (distance < 2) return beginGesture('tap');

    const speed = GAIT_SPEED_PX_S[gait] || 30;
    const duration = Math.min(MAX_MOVE_MS, Math.max(MIN_MOVE_MS, (distance / speed) * 1000));
    facingRight = target > x;
    setAnim(gait);
    move = { from: x, to: target, duration, elapsed: 0 };
    busyUntil = performance.now() + duration;
    return duration;
  }

  function beginGesture(name) {
    move = null;
    setAnim(name);
    const duration = GESTURE_MS[name] || 2000;
    busyUntil = performance.now() + duration;
    return duration;
  }

  /* The two sitting idles alternate so a cat left alone does not loop one
     four-frame twitch forever. */
  function settle() {
    move = null;
    setAnim(Math.random() < 0.5 ? 'idle1' : 'idle2');
    busyUntil = performance.now() + MIN_IDLE_MS + Math.random() * (MAX_IDLE_MS - MIN_IDLE_MS);
  }

  // ---- the loop -----------------------------------------------------------

  function tick(now) {
    // Clamped: coming back to a backgrounded tab must not teleport the cat
    // across the strip in one enormous frame.
    const dt = Math.min(64, now - lastTime);
    lastTime = now;

    stepMotion(dt);
    stepFrame(dt);
    if (!scene) stepBehaviour(now);

    rafId = requestAnimationFrame(tick);
  }

  function stepMotion(dt) {
    if (!move) return;
    move.elapsed += dt;
    const p = Math.min(1, move.elapsed / move.duration);
    place(move.from + (move.to - move.from) * easeInOut(p));
    if (p >= 1) move = null;
  }

  function stepFrame(dt) {
    const def = ANIMS[anim] || ANIMS.idle1;

    if (move && def.pxPerFrame) {
      // Distance-driven: eight walk frames per stride of ground, whatever
      // speed the easing happens to be running at right now.
      const travelled = Math.abs(x - move.from);
      frame = Math.floor(travelled / def.pxPerFrame) % def.frames;
      paint();
      return;
    }

    frameClock += dt;
    const step = 1000 / def.fps;
    if (frameClock < step) return;
    frameClock -= step;
    frame = (frame + 1) % def.frames;
    paint();
  }

  /* Chooses the next ambient behaviour once the current one has run out, and
     escalates through hint -> sleep when the app itself has gone quiet. */
  function stepBehaviour(now) {
    if (now < busyUntil) return;

    const quietFor = now - lastActivityAt;

    if (asleep) { setAnim('sleep'); busyUntil = now + 4000; return; }

    if (quietFor > SLEEP_AFTER_MS) {
      asleep = true;
      move = null;
      setAnim('sleep');
      busyUntil = now + 4000;
      return;
    }

    // One unprompted hint per quiet stretch — enough to be useful, not
    // enough to nag a child who is reading.
    if (quietFor > TIP_AFTER_MS && now - tipShownAt > TIP_AFTER_MS) {
      tipShownAt = now;
      playScene(CatDialogue.idleScene());
      return;
    }

    const gesture = weightedPick(AMBIENT_WEIGHTS);
    if (gesture === 'walk' || gesture === 'run') beginMove(gesture);
    else if (gesture === 'groom') beginGesture(Math.random() < 0.5 ? 'groom' : 'groom2');
    else beginGesture(gesture);
  }

  function weightedPick(weights) {
    const names = Object.keys(weights);
    const total = names.reduce((sum, n) => sum + weights[n], 0);
    let roll = Math.random() * total;
    for (let i = 0; i < names.length; i += 1) {
      roll -= weights[names[i]];
      if (roll <= 0) return names[i];
    }
    return names[0];
  }

  function startLoop() {
    if (rafId !== null || REDUCED_MOTION) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  // ---- speech bubble ------------------------------------------------------

  /* Anchored to the cat but clamped inside the strip, with the tail tracking
     the cat separately — so a bubble spoken from the far corner still points
     at the right animal instead of sliding off the page. */
  /* Centred on the cat, then clamped so the bubble stays on screen. The
     clamp is against the viewport rather than against the strip, because the
     strip is only as wide as the cat's patch of floor — on a narrow screen
     that is 200px, and a bubble confined to it would be a column of one-word
     lines. This lets it overhang the strip and still never leave the page. */
  function positionBubble() {
    const stripRect = root.getBoundingClientRect();
    const bubbleWidth = bubble.getBoundingClientRect().width;
    const edge = 6;

    /* documentElement.clientWidth, not window.innerWidth: innerWidth counts
       the classic scrollbar gutter as usable page, so clamping to it lets
       the right-hand end of the bubble slide under the scrollbar — and in an
       embedded frame the two can disagree by far more than that. clientWidth
       is the layout viewport the bubble is actually laid out in. */
    const viewportWidth = document.documentElement.clientWidth;

    // Both bounds are in the strip's own coordinate space, which is what
    // `left` is set in.
    const minLeft = edge - stripRect.left;
    const maxLeft = viewportWidth - stripRect.left - bubbleWidth - edge;
    const left = Math.min(Math.max(x - bubbleWidth / 2, minLeft), Math.max(minLeft, maxLeft));

    bubble.style.left = `${left}px`;
    bubble.style.bottom = `${spriteSize() - CELL_TOP_PADDING * scale() + BUBBLE_GAP_PX}px`;

    // Keep the tail inside the bubble's rounded corners.
    const tailX = Math.min(Math.max(x - left, 16), Math.max(16, bubbleWidth - 16));
    bubbleTail.style.left = `${tailX}px`;
  }

  function clearSpeechTimers() {
    clearTimeout(typeTimer);
    clearTimeout(holdTimer);
    typeTimer = null;
    holdTimer = null;
  }

  /* The fade-out is deferred, so its timer has to be cancellable: a new
     scene starting inside that window would otherwise be hidden by the
     previous scene's timer firing after it. */
  function hideBubble() {
    bubble.classList.remove('show');
    clearTimeout(hideTimer);
    const finish = () => {
      bubble.hidden = true;
      bubbleSizer.textContent = '';
      bubbleText.textContent = '';
    };
    if (REDUCED_MOTION) finish();
    else hideTimer = setTimeout(finish, 240);
  }

  /* A scene is the cat's whole turn in the conversation: one or more beats,
     each with its own line and its own gesture, played in order. Starting a
     new scene always interrupts the old one — the newest thing that happened
     in the app is the thing worth talking about. */
  function playScene(beats) {
    if (!visible || !beats || !beats.length) return;
    wake();
    clearSpeechTimers();
    scene = { beats, index: -1 };
    nextBeat();
  }

  function nextBeat() {
    if (!scene) return;
    scene.index += 1;

    if (scene.index >= scene.beats.length) {
      scene = null;
      hideBubble();
      settle();
      return;
    }

    const beat = scene.beats[scene.index];

    // The cat stops walking to talk to you, and faces into the page while it
    // does — a line is easier to read when the text is not sliding sideways.
    move = null;
    facingRight = false;
    setAnim(beat.gesture && ANIMS[beat.gesture] ? beat.gesture : 'idle2');
    // setAnim() short-circuits when the gesture has not changed between two
    // beats, so the turn-to-face-you is repainted here rather than relying
    // on it.
    paint();
    busyUntil = Infinity;

    speak(beat.text, nextBeat);
  }

  function speak(text, done) {
    clearTimeout(hideTimer);
    bubble.hidden = false;

    /* The invisible sizer carries the whole line, so the box opens at the
       size the finished sentence needs and holds it steady while the visible
       copy types in. Nothing is measured and nothing is locked, which is why
       the text can no longer outgrow its own bubble. */
    bubbleSizer.textContent = text;
    bubbleText.textContent = REDUCED_MOTION ? text : '';

    positionBubble();
    /* getBoundingClientRect() in positionBubble() has already flushed layout
       at the pre-`show` state, so the transition has a start value to run
       from and the class can go on synchronously. Deferring this to
       requestAnimationFrame would leave the bubble invisible whenever frames
       are not being scheduled — a backgrounded tab, or one restored
       mid-scene. */
    bubble.classList.add('show');

    const hold = Math.min(MAX_HOLD_MS, Math.max(MIN_HOLD_MS, text.length * HOLD_MS_PER_CHAR));

    if (REDUCED_MOTION) {
      holdTimer = setTimeout(done, hold);
      return;
    }

    let i = 0;
    const type = () => {
      if (i >= text.length) {
        holdTimer = setTimeout(done, hold);
        return;
      }
      bubbleText.textContent += text[i];
      i += 1;
      typeTimer = setTimeout(type, TYPE_MS_PER_CHAR);
    };
    type();
  }

  function wake() {
    lastActivityAt = performance.now();
    if (!asleep) return;
    asleep = false;
    if (!REDUCED_MOTION) beginGesture('perk');
  }

  // ---- context awareness --------------------------------------------------

  /* Reads the same `state` object ui.js just rendered from, so the bubble
     always matches what is actually on screen. Only speaks on a real change
     (see lastSpokenKey), so a debounced search or an unrelated re-render
     stays quiet. */
  function reactToState(state, stats) {
    if (!visible) return;
    wake();

    const seen = (stats && stats.seen) || 0;

    // A milestone outranks whatever was selected to reach it.
    const milestone = CatDialogue.milestoneFor(seen);
    if (milestone && seen > lastMilestone) {
      lastMilestone = seen;
      lastSpokenKey = `${state.grade || ''}:${state.domainCode || ''}:${state.term || ''}`;
      return playScene(milestone);
    }

    const key = `${state.grade || ''}:${state.domainCode || ''}:${state.term || ''}`;
    if (key === lastSpokenKey) return;
    lastSpokenKey = key;

    if (state.term) {
      const t = termById(state.term);
      if (!t) return;
      const first = !introduced.term;
      introduced.term = true;
      // markVisited() has already run for this term by the time renderAll()
      // reaches here, so "was this already explored" is captured one step
      // earlier, in noteWordOpened().
      const beats = CatDialogue.termScene(t, !first && wasRevisit);
      // The very first word a child opens is also where the detail panel and
      // the Listen button appear, so that beat is appended once, ever.
      if (first) beats.push(...CatDialogue.firstTermHint());
      return playScene(beats);
    }

    if (state.domainCode) {
      const name = DOMAIN_FULLNAME[state.domainCode] || 'This topic';
      const first = !introduced.topic;
      introduced.topic = true;
      return playScene(CatDialogue.topicScene(name, first));
    }

    if (state.grade) {
      const first = !introduced.grade;
      introduced.grade = true;
      return playScene(CatDialogue.gradeScene(gradeLabel(state.grade), first));
    }

    return undefined;
  }

  /* Two hooks, because they have to straddle renderAll().

     noteWordOpened() runs *before* it, since markVisited() inside renderAll()
     is what makes a first look indistinguishable from a revisit — the cat
     greets those differently, so the answer has to be captured first.

     trackWordClick() runs *after* it, so that a fast click-through streak in
     the word list overrides the routine word scene reactToState() just
     started, rather than being immediately overwritten by it. */
  function noteWordOpened(seenBefore) {
    wasRevisit = !!seenBefore;
    if (!visible) return;
    wake();
    pacing.opens += 1;
    wordClickTimes.push(performance.now());
    if (wordClickTimes.length > RAPID_CLICK_WINDOW) wordClickTimes.shift();
  }

  /* Measures the click-through *rate* — the average gap over the last few
     picks — rather than any single quick click, so one snap decision does
     not trip it; and only speaks up once per cooldown, so a real streak is
     not scolded on every word.

     The rate is recorded on every full window, whether or not it turns out
     to be fast enough to act on, so `pacing` is a real record of how this
     session went rather than only of the moments the cat interrupted. */
  function trackWordClick() {
    if (!visible || wordClickTimes.length < RAPID_CLICK_WINDOW) return;

    const span = wordClickTimes[wordClickTimes.length - 1] - wordClickTimes[0];
    const avgGap = span / (RAPID_CLICK_WINDOW - 1);
    pacing.lastAvgGapMs = Math.round(avgGap);
    if (pacing.fastestAvgGapMs === null || avgGap < pacing.fastestAvgGapMs) {
      pacing.fastestAvgGapMs = Math.round(avgGap);
    }

    if (avgGap >= RAPID_CLICK_AVG_MS) return;

    const now = performance.now();
    if (now - lastRapidWarnAt < RAPID_CLICK_COOLDOWN_MS) return;

    lastRapidWarnAt = now;
    pacing.coached += 1;
    playScene(CatDialogue.slowDownScene());
  }

  /* Search is the one place a child can get a genuinely empty screen, so the
     cat covers it. Keyed so the debounced input does not re-speak the same
     result set on every keystroke. */
  function onSearch(query, count) {
    if (!visible || !query) return;
    wake();
    const key = `${query}:${count}`;
    if (key === lastSearchKey) return;
    lastSearchKey = key;
    playScene(CatDialogue.searchScene(query, count));
  }

  function onStandardsChange() {
    if (!visible) return;
    wake();
    playScene(CatDialogue.standardsScene());
  }

  // ---- skin ---------------------------------------------------------------

  function applySkin(name) {
    if (skinAnimation) {
      try { skinAnimation.cancel(); } catch (e) { /* not animating */ }
      skinAnimation = null;
    }
    sprite.style.filter = CAT_SKIN_FILTERS[name] || 'none';

    // The rainbow shifts hue continuously, which is exactly the kind of
    // motion "Reduce Motion" is asking us to stop — so it holds one colour.
    if (name !== 'rainbow' || REDUCED_MOTION || typeof sprite.animate !== 'function') return;
    const hues = [0, 72, 144, 216, 288, 360];
    skinAnimation = sprite.animate(
      hues.map((deg) => ({
        filter: `sepia(1) saturate(7) hue-rotate(${deg}deg) brightness(1.08) contrast(1.08)`,
      })),
      { duration: 6000, iterations: Infinity },
    );
  }

  function setSkin(name) {
    if (!CAT_SKINS.includes(name)) return;
    skin = name;
    save(STORAGE_KEYS.catSkin, skin);
    applySkin(skin);
  }

  // ---- show / hide --------------------------------------------------------

  /* Stopping the loop rather than letting it spin invisibly matters on the
     iPads this runs on: a hidden cat should cost nothing. */
  function applyVisibility() {
    root.classList.toggle('cat-widget-hidden', !visible);
    root.setAttribute('aria-hidden', 'true');

    if (!visible) {
      stopLoop();
      clearSpeechTimers();
      clearTimeout(hideTimer);
      scene = null;
      bubble.hidden = true;
      bubble.classList.remove('show');
      return;
    }

    // Sized synchronously: a page that opens in a background tab never gets
    // a requestAnimationFrame callback, so deferring the *layout* to one
    // leaves the cat as a zero-by-zero box until the tab is first looked at.
    layoutSprite();
    goHome();
    settle();
    startLoop();

    // #stats may still be mid-layout on that first synchronous pass, so the
    // corner is measured once more after it settles.
    requestAnimationFrame(goHome);
  }

  function setVisible(on) {
    visible = !!on;
    save(STORAGE_KEYS.showCat, visible ? '1' : '0');
    applyVisibility();
  }

  // ---- page-level listeners -----------------------------------------------

  function bindPage() {
    window.addEventListener('resize', clampToBounds);

    /* Nothing animates in a hidden tab — rAF is suspended there — so the loop
       is stopped outright rather than left to be throttled, and the strip is
       re-measured on the way back in case the tab was never painted at all. */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { stopLoop(); return; }
      lastTime = performance.now();
      lastActivityAt = performance.now();
      if (!visible) return;
      const neverPainted = sprite.offsetWidth === 0;
      clampToBounds();
      if (neverPainted) goHome();
      startLoop();
    });

    /* Any real interaction counts as company. wake() no-ops when the cat is
       already up, so this stays cheap on every keystroke — and dragging the
       graph or scrolling rouses it, not only the clicks that happen to start
       a scene. */
    ['pointerdown', 'keydown'].forEach((type) => {
      document.addEventListener(type, wake, { passive: true });
    });
  }

  // ---- boot ---------------------------------------------------------------

  function whenPageVisible(fn) {
    if (!document.hidden) return fn();
    const onShow = () => {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', onShow);
      fn();
    };
    return document.addEventListener('visibilitychange', onShow);
  }

  function init() {
    root = document.getElementById('catWidget');
    unit = document.getElementById('catUnit');
    sprite = document.getElementById('catSprite');
    bubble = document.getElementById('catBubble');
    bubbleText = document.getElementById('catBubbleText');
    bubbleSizer = document.getElementById('catBubbleSizer');
    bubbleTail = document.getElementById('catBubbleTail');
    if (!root || started) return;
    started = true;

    skin = loadSkin();
    visible = loadVisible();
    lastActivityAt = performance.now();

    // A returning child should not be congratulated again for the ten words
    // they explored last week.
    lastMilestone = CatDialogue.milestoneFloor(visitedTerms.size);

    // Seeded to the empty-selection key so boot()'s first renderAll() — state
    // is always {grade:null,domainCode:null,term:null} there — stays quiet
    // and lets the greeting below open the conversation.
    lastSpokenKey = '::';

    applySkin(skin);
    bindPage();
    applyVisibility();

    // Late enough that the greeting does not compete with page-load motion,
    // and held back entirely if the page opened in a background tab — an
    // introduction nobody was there for is an introduction wasted.
    setTimeout(() => {
      whenPageVisible(() => { if (visible) playScene(CatDialogue.greeting()); });
    }, 1400);
  }

  return {
    init,
    reactToState,
    trackWordClick,
    noteWordOpened,
    onSearch,
    onStandardsChange,
    // Used by the Cat menu (src/catSettings.js).
    setVisible,
    isVisible: () => visible,
    setSkin,
    getSkin: () => skin,
    // A copy, so a caller reading the record cannot edit it.
    getPacing: () => ({ ...pacing }),
    tip: () => { tipShownAt = performance.now(); playScene(CatDialogue.idleScene()); },
    say: (text) => playScene([{ text, gesture: 'tap' }]),
  };
}());
