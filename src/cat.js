/* =========================================================================
   Pixel cat — a pedagogical companion that lives on a short strip of floor
   near the top of the page (see .cat-widget in src/styles.css).

   Art: KINGS-MZ/PixelCat (github.com/KINGS-MZ/PixelCat), MIT licensed. Only
   the cat sprite sheet is reused (assets/cat/cat_sheet.png); none of that
   extension's game systems — coins, fish, spiders, quests — come with it,
   since this cat's job is to coach a child through a vocabulary tool rather
   than to be played with.

   The sheet is 8 columns x 10 rows of 32px cells, one animation per row.
   This file is the engine: it steps the sheet, moves the cat along its strip
   of floor, and decides what it should be doing. What it *says* lives in
   src/catDialogue.js.

   Two deliberate constraints:

   - It never wanders off its strip. On tablet/desktop widths that strip
     sits on the line under the "Choose a grade" row, in the gap between the
     grade circles and the search box (see .cat-widget in src/styles.css);
     phones pin it along the bottom of the viewport instead, where that gap
     doesn't exist. Either way the cat roams a short patch of floor and
     walks home when it strays, so a child always knows where to look for it.

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

  /* Tour flights cross the whole page rather than a corner of it, so they get
     their own pace — an ambling 105px/s would take ten seconds to reach the
     grade row and the child would lose the thread. */
  const TOUR_SPEED_PX_S = 460;
  const MIN_FLIGHT_MS = 480;
  const MAX_FLIGHT_MS = 1500;

  // Trail left behind a flight: one dot roughly every this many ms, each
  // stepping the hue on so a whole flight draws a short rainbow.
  const TRAIL_EVERY_MS = 38;
  const TRAIL_HUE_STEP = 26;

  // ---- behaviour timing ---------------------------------------------------

  const MIN_IDLE_MS = 7000;
  const MAX_IDLE_MS = 14000;
  // How long a gesture that plays in place holds before the cat settles.
  const GESTURE_MS = { tap: 2400, cheer: 2100, groom: 4200, groom2: 4200, perk: 1500 };
  const MIN_MOVE_MS = 450;
  const MAX_MOVE_MS = 9000;

  /* Weighted pick for "what should the cat do next" when nothing in the app
     has happened. No `run` here on purpose — a dash reads as exciting once,
     as a distraction on the tenth repeat in a room of kids trying to read —
     it stays reserved for tour flights and celebration beats (see flyTo()),
     never ambient wandering. In-place variety (groom/cheer/perk) outweighs
     walking, so the cat spends more time doing something a child can watch
     from where they are than crossing the strip. */
  const AMBIENT_WEIGHTS = { walk: 3, tap: 2, groom: 3, cheer: 2, perk: 2 };

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

  let root, unit, sprite, bubble, bubbleText, bubbleSizer, bubbleActions, bubbleTail;

  let skin = 'white';
  let visible = true;
  let started = false;
  // Set by the guided tour, whose offer should be the first thing a child on
  // their first visit hears — not a greeting talking over it.
  let greetingSuppressed = false;

  // Current animation.
  let anim = 'idle1';
  let frame = 0;
  let frameClock = 0;
  let facingRight = false;

  // Current position along the floor strip, in px from the strip's left edge.
  let x = 0;
  let homeX = 0;
  let move = null;      // see beginMove()/flyTo() for the shape
  let rafId = null;
  let lastTime = 0;

  /* Guided-tour mode (src/catTour.js). The widget becomes viewport-sized, so
     `x` is a viewport coordinate and `y` — the cat's feet — comes into play;
     in ordinary corner mode the feet are always on the strip and `y` is
     unused. `anchor` is the element the cat is currently perched on, kept so
     it can be re-seated when the page scrolls or resizes under it. */
  let tourMode = false;
  let y = 0;
  let anchor = null;
  let trailClock = 0;
  let trailHue = 0;
  /* The corner, in viewport coordinates, captured on the way into the tour —
     while the widget is still laid out as its strip and can be measured
     honestly. Reading it mid-tour would mean toggling the tour class off and
     back for one measurement, and a rect taken while the element is switching
     between fixed and absolute layout comes back several pixels wrong. */
  let homeAnchor = null;

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

  /* Must match the max-width:760px breakpoint in styles.css that switches
     the strip from the graph-aligned one below to the phone tier's fixed
     full-width strip along the bottom of the viewport. */
  const NARROW_QUERY = '(max-width: 760px)';
  // Clearance from the graph panel's own edges, so the sprite and its
  // bubble never quite touch the panel border.
  const GRAPH_STRIP_INSET = 20;

  function isNarrowViewport() {
    return !!(window.matchMedia && window.matchMedia(NARROW_QUERY).matches);
  }

  /* Tablet/desktop only (phones get their CSS-only strip — see NARROW_QUERY
     above). Aligns the strip to the knowledge graph panel's own left/right
     borders, which is real, permanently empty canvas: never a grade circle,
     the search box, or a list, so the cat and its speech bubble can never
     land on top of a control. #graphPanel itself is one of a row of
     user-resizable panels (src/panelResize.js), so this is measured live off
     its current rect rather than assumed — see bindPage()'s ResizeObserver
     and clampToBounds() for what keeps it in sync as panels are dragged. */
  function syncStrip() {
    if (tourMode || isNarrowViewport()) {
      root.style.left = '';
      root.style.width = '';
      root.style.right = '';
      return;
    }
    const panel = document.getElementById('graphPanel');
    const r = panel && panel.getBoundingClientRect();
    if (!r || r.width < GRAPH_STRIP_INSET * 2 + 20) return; // not laid out yet, or too small to bother with
    root.style.right = 'auto';
    root.style.left = `${r.left + GRAPH_STRIP_INSET}px`;
    root.style.width = `${r.width - GRAPH_STRIP_INSET * 2}px`;
  }

  /* The cat's world is the widget box — see syncStrip() above and
     .cat-widget in src/styles.css for where that strip actually sits. Half a
     sprite is kept clear of each end so it never walks out of its own box. */
  function bounds() {
    const total = root.clientWidth || 0;
    const half = spriteSize() / 2;
    return { min: half, max: Math.max(half, total - half) };
  }

  /* `py` is the cat's FEET, not the top of its box, because every perch the
     tour uses is expressed as "stand on this edge". Ignored outside tour
     mode, where the feet are always on the strip. */
  function place(px, py) {
    x = px;
    unit.style.left = `${px}px`;
    if (!tourMode || typeof py !== 'number') return;
    y = py;
    unit.style.top = `${py - spriteSize()}px`;
  }

  /* Home is the right end of the strip: the corner itself. Everything else
     the cat does is an excursion it comes back from. */
  function goHome() {
    /* The tour owns the cat's position for as long as it runs. This matters
       because applyVisibility() defers a second goHome() through
       requestAnimationFrame: in a tab that loads in the background those
       callbacks are held until the page is first painted, which can land
       after the tour has already taken over — and it would drag the cat back
       to the corner mid-step, on the x axis only, leaving it stranded. */
    if (tourMode) return;
    homeX = bounds().max;
    place(homeX);
  }

  /* A resize moves the goalposts mid-walk: the target the cat set off for
     may now be outside the strip, so the trip is abandoned rather than
     clamped — stopping where it stands reads as a cat pausing, while
     retargeting mid-stride reads as a glitch. */
  function clampToBounds() {
    syncStrip();
    if (tourMode) { reseatOnAnchor(); if (scene) positionBubble(); return; }
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

  /* `explicitTarget` bypasses the random pickTarget() — used to send the cat
     somewhere specific (currently just the walk home before it sleeps, see
     stepBehaviour()) rather than wherever ambient wandering would take it. */
  function beginMove(gait, explicitTarget) {
    const target = typeof explicitTarget === 'number' ? explicitTarget : pickTarget();
    const distance = Math.abs(target - x);
    if (distance < 2) return beginGesture('tap');

    const speed = GAIT_SPEED_PX_S[gait] || 30;
    const duration = Math.min(MAX_MOVE_MS, Math.max(MIN_MOVE_MS, (distance / speed) * 1000));
    facingRight = target > x;
    setAnim(gait);
    move = { fromX: x, toX: target, fromY: y, toY: y, duration, elapsed: 0, arc: 0 };
    busyUntil = performance.now() + duration;
    return duration;
  }

  /* A tour flight: a single eased hop to an arbitrary point on the page, with
     the cat lifting off the straight line between the two and settling back
     onto it so it reads as a jump rather than a slide. */
  function flyTo(targetX, targetY, onDone) {
    const distance = Math.hypot(targetX - x, targetY - y);
    facingRight = targetX > x;

    if (REDUCED_MOTION || distance < 2) {
      place(targetX, targetY);
      if (onDone) onDone();
      return;
    }

    setAnim('run');
    move = {
      fromX: x, toX: targetX, fromY: y, toY: targetY,
      duration: Math.min(MAX_FLIGHT_MS, Math.max(MIN_FLIGHT_MS, (distance / TOUR_SPEED_PX_S) * 1000)),
      elapsed: 0,
      arc: Math.min(70, distance * 0.16),
      onDone,
    };
    busyUntil = Infinity;
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

  /* One dot at the cat's middle, left to fade out on its own CSS animation
     and remove itself. Nothing is pooled or tracked: a flight is under two
     seconds, so at most a few dozen exist at once. */
  function emitTrailDot() {
    const dot = document.createElement('span');
    dot.className = 'cat-trail-dot';
    const half = spriteSize() / 2;
    dot.style.left = `${x}px`;
    dot.style.top = `${y - half}px`;
    trailHue = (trailHue + TRAIL_HUE_STEP) % 360;
    const colour = `hsl(${trailHue} 95% 66%)`;
    dot.style.background = colour;
    dot.style.boxShadow = `0 0 14px 4px ${colour}`;
    /* animationend does the tidying, with a timer as backstop: CSS animations
       do not advance in a hidden tab, so a flight interrupted by a tab switch
       would otherwise leave its dots behind for good. */
    const drop = () => dot.remove();
    dot.addEventListener('animationend', drop);
    setTimeout(drop, 1500);
    root.appendChild(dot);
  }

  function stepTrail(dt) {
    // Only flights leave a trail; the ambient stroll along the strip does
    // not, and reduced motion gets none of it at all.
    if (!move || !move.arc || REDUCED_MOTION) { trailClock = 0; return; }
    trailClock += dt;
    if (trailClock < TRAIL_EVERY_MS) return;
    trailClock = 0;
    emitTrailDot();
  }

  function stepMotion(dt) {
    if (!move) return;
    stepTrail(dt);
    move.elapsed += dt;
    const p = Math.min(1, move.elapsed / move.duration);
    const eased = easeInOut(p);

    const nx = move.fromX + (move.toX - move.fromX) * eased;
    let ny = move.fromY + (move.toY - move.fromY) * eased;
    // sin() peaks at the midpoint and returns to zero at both ends, so the
    // arc never disturbs where the cat takes off from or lands.
    if (move.arc) ny -= Math.sin(Math.PI * p) * move.arc;
    place(nx, ny);

    if (p < 1) return;
    const arrived = move.onDone;
    move = null;
    if (arrived) arrived();
  }

  function stepFrame(dt) {
    const def = ANIMS[anim] || ANIMS.idle1;

    if (move && def.pxPerFrame) {
      // Distance-driven: eight walk frames per stride of ground, whatever
      // speed the easing happens to be running at right now.
      const travelled = tourMode
        ? Math.hypot(x - move.fromX, y - move.fromY)
        : Math.abs(x - move.fromX);
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
    // The tour drives the cat itself; ambient wandering would fight it.
    if (tourMode || now < busyUntil) return;

    const quietFor = now - lastActivityAt;

    if (asleep) { setAnim('sleep'); busyUntil = now + 4000; return; }

    if (quietFor > SLEEP_AFTER_MS) {
      /* Home first, sleep after: curling up wherever ambient wandering last
         left the cat would put it somewhere a child was not looking. Home is
         bounds().max — the far end of the strip, which on tablet/desktop is
         the graph panel's own top-right corner (see syncStrip()) — so this
         reads as "the cat went back to its usual spot and settled down,"
         the same corner it always returns to, rather than falling asleep at
         a random point mid-strip. beginMove() re-fires every idle tick while
         still walking (busyUntil keeps stepBehaviour out until each leg
         finishes), so this naturally keeps closing the distance. */
      if (Math.abs(x - homeX) > 2) { beginMove('walk', homeX); return; }
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
    if (gesture === 'walk') beginMove(gesture);
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
  /* Where a bubble may not go. During the tour the cat perches on something
     the child is being asked to tap, and a bubble that covers it defeats the
     whole point — so the perch supplies a rectangle to keep clear of. */
  function avoidRect() {
    if (!tourMode || !anchor || !anchor.avoid) return null;
    const r = typeof anchor.avoid === 'function' ? anchor.avoid() : anchor.avoid;
    return r && r.width >= 0 ? r : null;
  }

  function overlaps(a, b, pad) {
    return !(a.right + pad <= b.left || a.left - pad >= b.right
      || a.bottom + pad <= b.top || a.top - pad >= b.bottom);
  }

  /* Candidate placements, each in viewport coordinates plus which way its
     tail should point; positionBubble() tries them in order and takes the
     first that fits and stays clear of whatever must not be covered.

     "up" leads everywhere: the knowledge graph is the actual lesson content
     (a live, spinning, tappable map of words), not blank canvas, so a
     bubble dropped onto it would sit on top of the very thing the cat is
     meant to be pointing a child toward — never acceptable, tour or not.
     Ordinary (non-tour) mode on tablet/desktop stands the cat on the line
     between the grade row and the graph panel (see syncStrip()), where
     "up" opens onto the row's own empty stretch above the strip (the strip
     itself is kept clear of the grade circles and the search box, so
     directly above it is clear too) — so "down" is dropped from the
     rotation there entirely rather than kept as a fallback, and the
     horizontal graph-panel clamp in positionBubble() keeps "up"/"right"/
     "left" from sliding sideways into the search box or the definition
     panel. Tour and the phone strip both still fall through to "down" as a
     last resort — the tour perches on real elements where "below" usually
     means empty page rather than the graph, and the phone's cat has no
     graph beside it to protect either way. */
  function bubblePlacements(spriteRect, size, gap) {
    const catX = spriteRect.left + spriteRect.width / 2;
    const headY = spriteRect.top + CELL_TOP_PADDING * scale();
    const feetY = spriteRect.bottom;
    const middleY = (headY + feetY) / 2 - size.height / 2;

    const up = { name: 'up', tail: 'down', left: catX - size.width / 2, top: headY - size.height - gap };
    const right = { name: 'right', tail: 'left', left: spriteRect.right + gap, top: middleY };
    const left = { name: 'left', tail: 'right', left: spriteRect.left - size.width - gap, top: middleY };
    const down = { name: 'down', tail: 'up', left: catX - size.width / 2, top: feetY + gap };

    if (!tourMode && !isNarrowViewport()) return [up, right, left];
    return [up, right, left, down];
  }

  /* Worked out from the sprite's real rendered box rather than from `x`/`y`,
     so one implementation serves both the corner strip and the tour's
     viewport coordinates. */
  function positionBubble() {
    const widgetRect = root.getBoundingClientRect();
    const spriteRect = sprite.getBoundingClientRect();
    const box = bubble.getBoundingClientRect();
    const size = { width: box.width, height: box.height };
    const edge = 6;
    const gap = BUBBLE_GAP_PX;

    /* documentElement.clientWidth, not window.innerWidth: innerWidth counts
       the classic scrollbar gutter as usable page, so clamping to it lets
       the right-hand end of the bubble slide under the scrollbar — and in an
       embedded frame the two can disagree by far more than that. */
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const keepClear = avoidRect();

    /* Ordinary desktop-tier mode (see bubblePlacements() above) slides the
       bubble to stay inside the knowledge graph panel's own left/right
       borders rather than the whole viewport — sliding all the way to the
       viewport edge would let a bubble near either end of the strip spill
       sideways into the search box or the definition panel, exactly the
       overlap the graph-aligned strip exists to avoid. Falls back to the
       viewport when the graph is narrower than the bubble itself (a very
       small custom panel size), so the clamp range can never invert. */
    let slideLeft = edge;
    let slideRight = vw - edge;
    if (!tourMode && !isNarrowViewport()) {
      const panel = document.getElementById('graphPanel');
      const panelRect = panel && panel.getBoundingClientRect();
      if (panelRect && panelRect.width > size.width + edge * 2) {
        slideLeft = panelRect.left + edge;
        slideRight = panelRect.right - edge;
      }
    }

    const fitsHorizontally = (p) => p.left >= slideLeft && p.left + size.width <= slideRight;
    const fitsVertically = (p) => p.top >= edge && p.top + size.height <= vh - edge;

    const candidates = bubblePlacements(spriteRect, size, gap);
    let chosen = null;

    for (let i = 0; i < candidates.length; i += 1) {
      const p = candidates[i];
      // Sideways placements have to fit on their own terms; up/down may slide
      // along x to fit, so only their vertical room is decisive.
      const horizontalOk = (p.name === 'up' || p.name === 'down') || fitsHorizontally(p);
      if (!horizontalOk || !fitsVertically(p)) continue;

      const slid = { ...p, left: Math.min(Math.max(p.left, slideLeft), Math.max(slideLeft, slideRight - size.width)) };
      const rect = { left: slid.left, top: slid.top, right: slid.left + size.width, bottom: slid.top + size.height };
      if (keepClear && overlaps(rect, keepClear, 4)) continue;

      chosen = slid;
      break;
    }

    // Nothing was clean: keep it on screen and accept the overlap rather than
    // leaving the line somewhere it cannot be read.
    if (!chosen) {
      const p = candidates[0];
      chosen = {
        ...p,
        left: Math.min(Math.max(p.left, slideLeft), Math.max(slideLeft, slideRight - size.width)),
        top: Math.min(Math.max(p.top, edge), Math.max(edge, vh - size.height - edge)),
      };
    }

    bubble.classList.remove('tail-down', 'tail-up', 'tail-left', 'tail-right');
    bubble.classList.add(`tail-${chosen.tail}`);

    bubble.style.left = `${chosen.left - widgetRect.left}px`;
    bubble.style.top = `${chosen.top - widgetRect.top}px`;
    bubble.style.bottom = 'auto';

    // The tail tracks the cat along whichever edge it lives on.
    const catX = spriteRect.left + spriteRect.width / 2;
    const catY = (spriteRect.top + CELL_TOP_PADDING * scale() + spriteRect.bottom) / 2;
    if (chosen.tail === 'left' || chosen.tail === 'right') {
      const offset = Math.min(Math.max(catY - chosen.top, 16), Math.max(16, size.height - 16));
      bubbleTail.style.top = `${offset}px`;
      bubbleTail.style.left = '';
    } else {
      const offset = Math.min(Math.max(catX - chosen.left, 16), Math.max(16, size.width - 16));
      bubbleTail.style.left = `${offset}px`;
      bubbleTail.style.top = '';
    }
  }

  /* The bubble is decorative for its own chatter and stays out of the
     accessibility tree for it; the moment it holds buttons that is no longer
     true, so it is exposed and the offer is announced. */
  function renderBubbleActions(actions) {
    bubbleActions.innerHTML = '';

    if (!actions || !actions.length) {
      bubble.setAttribute('aria-hidden', 'true');
      bubble.removeAttribute('role');
      bubble.removeAttribute('aria-label');
      return;
    }

    bubble.removeAttribute('aria-hidden');
    bubble.setAttribute('role', 'group');
    bubble.setAttribute('aria-label', 'Guided tour');

    actions.forEach((action) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `cat-bubble-action${action.primary === false ? ' secondary' : ''}`;
      btn.textContent = action.label;
      btn.addEventListener('click', () => {
        Sound.play('toggle');
        action.onClick();
      });
      bubbleActions.appendChild(btn);
    });

    /* Announced rather than focused. The offer arrives on its own timing a
       second after load, and pulling focus out from under someone who did not
       ask for it is disorienting (WCAG 3.2.5). The buttons are real, reachable
       and the line never times out, so nobody is shut out by leaving focus
       where the child put it. */
    announce(`${bubbleSizer.textContent} ${actions.map((a) => a.label).join(', or ')}.`);
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
      renderBubbleActions(null);
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

  /* opts.actions — [{ label, primary, onClick }] — turns the bubble into
     something a child answers rather than just reads, and is the only time it
     enters the accessibility tree. opts.persist keeps a line up until the
     child does the thing it is asking for, instead of timing out. */
  function speak(text, done, opts) {
    const actions = (opts && opts.actions) || null;
    const persist = !!(opts && opts.persist);
    clearTimeout(hideTimer);
    bubble.hidden = false;

    /* The invisible sizer carries the whole line, so the box opens at the
       size the finished sentence needs and holds it steady while the visible
       copy types in. Nothing is measured and nothing is locked, which is why
       the text can no longer outgrow its own bubble. */
    bubbleSizer.textContent = text;
    bubbleText.textContent = REDUCED_MOTION ? text : '';
    // After the sizer is filled: the buttons are part of the box being sized,
    // and the announcement reads the line that is actually up.
    renderBubbleActions(actions);

    positionBubble();
    /* getBoundingClientRect() in positionBubble() has already flushed layout
       at the pre-`show` state, so the transition has a start value to run
       from and the class can go on synchronously. Deferring this to
       requestAnimationFrame would leave the bubble invisible whenever frames
       are not being scheduled — a backgrounded tab, or one restored
       mid-scene. */
    bubble.classList.add('show');

    const hold = Math.min(MAX_HOLD_MS, Math.max(MIN_HOLD_MS, text.length * HOLD_MS_PER_CHAR));
    // A line with buttons, or one waiting on the child to tap something on
    // the page, has no business timing out underneath them.
    const settle = persist || actions ? () => {} : done;

    if (REDUCED_MOTION) {
      holdTimer = setTimeout(settle, hold);
      return;
    }

    let i = 0;
    const type = () => {
      if (i >= text.length) {
        holdTimer = setTimeout(settle, hold);
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
    if (!asleep || tourMode) return;
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
    // Mid-tour the fast clicks are the tour's own prompting, not a child
    // racing, and a slow-down scene would talk over the step.
    if (!visible || tourMode || wordClickTimes.length < RAPID_CLICK_WINDOW) return;

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

    if (!visible) {
      stopLoop();
      clearSpeechTimers();
      clearTimeout(hideTimer);
      scene = null;
      bubble.hidden = true;
      bubble.classList.remove('show');
      return;
    }

    // Mid-tour the cat is somewhere on the page by design, so re-seating it
    // in its corner is exactly the wrong thing to do.
    if (tourMode) { startLoop(); return; }

    // Sized synchronously: a page that opens in a background tab never gets
    // a requestAnimationFrame callback, so deferring the *layout* to one
    // leaves the cat as a zero-by-zero box until the tab is first looked at.
    syncStrip();
    layoutSprite();
    goHome();
    settle();
    startLoop();

    // The page may still be mid-layout on that first synchronous pass, so
    // the strip and home are both measured once more after it settles.
    requestAnimationFrame(() => { syncStrip(); goHome(); });
  }

  function setVisible(on) {
    visible = !!on;
    save(STORAGE_KEYS.showCat, visible ? '1' : '0');
    applyVisibility();
  }

  // ---- guided tour --------------------------------------------------------

  /* Where the cat should stand to be perched on `el`. `align` picks which
     part of the top edge — the tour uses 'right' for cards it should sit on
     the corner of, 'centre' for things it is pointing straight down at. */
  function perchPoint(el, align) {
    const r = el.getBoundingClientRect();
    const half = spriteSize() / 2;
    let px;
    if (align === 'right') px = r.right - Math.min(30, r.width * 0.14);
    else if (align === 'left') px = r.left + Math.min(30, r.width * 0.5);
    else px = r.left + r.width / 2;

    const viewportWidth = document.documentElement.clientWidth;
    px = Math.min(Math.max(px, half), Math.max(half, viewportWidth - half));
    // Never let a perch near the top of the page cut the cat's head off.
    const py = Math.max(r.top, spriteSize() + 4);
    return { x: px, y: py };
  }

  function reseatOnAnchor() {
    if (!tourMode || !anchor || !anchor.el.isConnected || move) return;
    const point = perchPoint(anchor.el, anchor.align);
    place(point.x, point.y);
  }

  function enterTour() {
    if (tourMode) return;
    clearSpeechTimers();
    clearTimeout(hideTimer);
    scene = null;
    bubble.classList.remove('show');
    bubble.hidden = true;

    /* Take off from wherever the cat is standing now, so it lifts out of its
       corner instead of blinking to the top of the page. Read before
       tourMode flips: this rect still reflects the ordinary strip's real
       (JS-set, inline) bounds, which syncStrip() is about to clear. */
    const from = sprite.getBoundingClientRect();
    const strip = root.getBoundingClientRect();
    homeAnchor = { x: strip.right - spriteSize() / 2, y: strip.bottom };
    tourMode = true;
    move = null;
    /* syncStrip() no-ops on width/left/right while tourMode is true, but it
       still has to run once right here to clear the *previous* (ordinary
       mode) inline left/width it set — those are inline styles, so left
       alone they would outrank .cat-widget-tour's own left:0;width:100% and
       pin the tour to a strip-sized sliver instead of the full viewport. */
    syncStrip();
    root.classList.add('cat-widget-tour');
    place(from.left + from.width / 2, from.bottom);
    setAnim('idle2');
    busyUntil = Infinity;
    startLoop();
  }

  function exitTour(done) {
    if (!tourMode) { if (done) done(); return; }
    anchor = null;
    /* Only ever an approximate destination — goHome() below re-measures the
       corner exactly once the widget is back in strip layout, so a stale
       homeAnchor (the window was resized mid-tour) costs a few pixels on the
       last frame of the flight and nothing after it. */
    const home = homeAnchor || { x, y };
    flyTo(home.x, home.y, () => {
      tourMode = false;
      root.querySelectorAll('.cat-trail-dot').forEach((dot) => dot.remove());
      root.classList.remove('cat-widget-tour');
      unit.style.top = '';
      syncStrip();
      layoutSprite();
      goHome();
      settle();
      lastActivityAt = performance.now();
      if (done) done();
    });
  }

  /* Fly to an element and stay put on it, following it if the page scrolls
     or reflows underneath. */
  function perchOn(el, align, avoid, done) {
    if (!el || !el.isConnected) { if (done) done(); return; }
    anchor = { el, align, avoid: avoid || (() => el.getBoundingClientRect()) };
    const point = perchPoint(el, align);
    flyTo(point.x, point.y, () => {
      setAnim('tap');
      busyUntil = Infinity;
      if (done) done();
    });
  }

  function tourSay(text, opts, done) {
    if (!tourMode) return;
    clearSpeechTimers();
    // Scenes and the tour must not both own the bubble; the tour wins for as
    // long as it is running.
    scene = null;
    speak(text, done || (() => {}), opts);
  }

  // ---- page-level listeners -----------------------------------------------

  function bindPage() {
    window.addEventListener('resize', clampToBounds);

    /* The graph panel can change width without a window resize — dragging
       #resizerLeft or #resizerDetail (src/panelResize.js) resizes it
       directly — so the strip needs its own observer to stay aligned with
       the panel's current borders instead of a stale measurement from load
       or from before the drag. */
    const graphPanel = document.getElementById('graphPanel');
    if (graphPanel && typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(clampToBounds).observe(graphPanel);
    }

    /* Only matters mid-tour, where the cat is standing on a real element that
       can slide out from under it — the left panel scrolls independently, so
       this listens in the capture phase to catch scrolls on any container. */
    window.addEventListener('scroll', () => {
      if (!tourMode) return;
      reseatOnAnchor();
      if (!bubble.hidden) positionBubble();
    }, { capture: true, passive: true });

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
    bubbleActions = document.getElementById('catBubbleActions');
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
      whenPageVisible(() => {
        if (visible && !greetingSuppressed) playScene(CatDialogue.greeting());
      });
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
    // Used by the guided tour (src/catTour.js).
    suppressGreeting: () => { greetingSuppressed = true; },
    tour: {
      enter: enterTour,
      exit: exitTour,
      perchOn,
      say: tourSay,
      gesture: (name) => { setAnim(name); busyUntil = Infinity; },
      isRunning: () => tourMode,
    },
    // A copy, so a caller reading the record cannot edit it.
    getPacing: () => ({ ...pacing }),
    tip: () => { tipShownAt = performance.now(); playScene(CatDialogue.idleScene()); },
    say: (text) => playScene([{ text, gesture: 'tap' }]),
  };
}());
