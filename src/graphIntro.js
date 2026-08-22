/* =========================================================================
   First-visit splash over the knowledge graph (#graphIntro in the markup,
   .graph-intro in the stylesheet): a short line fades in, holds, fades out,
   then the opaque backdrop itself fades out to reveal the graph, which has
   been building silently underneath the whole time. Shown once per browser;
   every later visit goes straight to the graph, same as before this existed.
   ========================================================================= */

const GraphIntro = (function () {
  const FADE_S = 0.9;
  const HOLD_S = 5;

  function hasRun() {
    try { return localStorage.getItem(STORAGE_KEYS.graphIntroSeen) === '1'; } catch (e) { return true; }
  }

  function markRun() {
    try { localStorage.setItem(STORAGE_KEYS.graphIntroSeen, '1'); } catch (e) { /* private browsing */ }
  }

  /* The line is nowrap, so on a narrow panel it can render wider than the
     padded space around it rather than wrapping. Measured against the CSS
     default size (a single font-size read, not a search), then scaled down
     by exactly the overflow ratio — cheaper and more precise than trying to
     guess a breakpoint that would still wrap at some panel width. Never
     scales up: the CSS default is already sized for a comfortable, typical
     panel, so this only ever intervenes on the narrow end. */
  function fitOneLine(el) {
    const parent = el.parentElement;
    const parentStyle = getComputedStyle(parent);
    const available = parent.clientWidth
      - parseFloat(parentStyle.paddingLeft) - parseFloat(parentStyle.paddingRight);
    const needed = el.scrollWidth;
    if (available > 0 && needed > available) {
      const baseSize = parseFloat(getComputedStyle(el).fontSize);
      el.style.fontSize = `${Math.max(10, baseSize * (available / needed))}px`;
    }
  }

  function run() {
    const overlay = document.getElementById('graphIntro');
    if (!overlay) return;

    // Reduced motion skips the whole sequence rather than holding a static
    // line on screen for no motion-related reason — same call as the auto-
    // rotate and camera-flight cuts elsewhere in the graph.
    if (hasRun() || REDUCED_MOTION) {
      overlay.remove();
      return;
    }
    markRun();

    const text = overlay.querySelector('.graph-intro-text');
    fitOneLine(text);
    gsap.timeline({ onComplete: () => overlay.remove() })
      .to(text, { opacity: 1, duration: FADE_S, ease: EASE_INOUT })
      .to(text, { opacity: 0, duration: FADE_S, ease: EASE_INOUT }, `+=${HOLD_S}`)
      .to(overlay, { opacity: 0, duration: FADE_S, ease: EASE_INOUT });
  }

  return { run };
}());
