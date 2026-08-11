/* =========================================================================
   The 3D knowledge graph (Three.js).

   Notable differences from the first version:

   * Draw calls went from ~450 (one Mesh per node + one Line per edge) to
     roughly a dozen, by instancing the nodes and merging every edge into a
     single LineSegments. This is what makes it comfortable on an iPad.
   * Highlighting is a per-frame lerp instead of ~700 simultaneous GSAP
     tweens per click.
   * Labels are HTML elements projected from 3D rather than canvas sprites:
     always crisp, real selectable text, and they can be pushed apart when
     they collide instead of stacking on top of each other.
   * Nodes are pickable — tapping a node in the graph selects it.
   * Materials are lit (MeshStandardMaterial + three lights + filmic tone
     mapping) rather than flat unlit colour, so the nodes read as objects.
   ========================================================================= */

const Graph = (function () {
  let scene, camera, renderer, controls, container, labelLayer, termSymbolEl, clock;
  let ready = false;
  let hasControls = false;
  let idleAngle = 0.6;
  let onSelect = null;
  let ambientSymbolFrame = 0;

  const nodes = {};            // id -> node record
  const gradeIds = [];         // instance index -> node id
  const termIds = [];
  const domainIdsByCode = {};  // domainCode -> [node id]
  let gradeMesh, termMesh, rootMesh;
  const domainMeshes = {};     // domainCode -> InstancedMesh
  const haloLayers = {};       // level -> { points, ids, colors }
  let edgeGeometry, edgeColors;
  const edgeList = [];
  const ambientSymbolEls = [];

  let state = { grade: null, domainCode: null, term: null };
  let hoveredId = null;
  let showAllGradeLabels = false;
  const gradeLabelEls = [];

  const AUTO_ROTATE_NORMAL = 0.55;
  const AUTO_ROTATE_SLOW = 0.09;
  let autoRotateTargetSpeed = AUTO_ROTATE_NORMAL;
  let autoRotateCurSpeed = AUTO_ROTATE_NORMAL;

  const RG = 34, RD = 13, RT = 6.2;
  const COLORS = { root: 0xffffff, grade: 0x7c9eff, domain: 0xff5fa8, term: 0x7cffb2 };
  const SIZE = { root: 2.8, grade: 1.7, domain: 1.08, term: 0.58 };
  const HALO_SIZE = { root: 19, grade: 13, domain: 8.5, term: 4.6 };
  const DIM = 0.055;           // how far inactive nodes fade toward the background
  const DIM_SCALE = 0.45;

  // Allocated in init(), after THREE is confirmed present — this module has
  // to stay loadable when the CDN is unreachable so the rest of the page
  // keeps working offline.
  let _m, _q, _s, _c, _v, ORIGIN;

  function allocScratch() {
    _m = new THREE.Matrix4();
    _q = new THREE.Quaternion();
    _s = new THREE.Vector3();
    _c = new THREE.Color();
    _v = new THREE.Vector3();
    ORIGIN = new THREE.Vector3(0, 0, 0);
  }

  // ---------------------------------------------------------------------
  // setup
  // ---------------------------------------------------------------------

  function init(containerEl, labelEl) {
    const legend = document.getElementById('graphLegend');
    const fallback = document.getElementById('graphFallback');
    if (legend) {
      legend.hidden = true;
      legend.setAttribute('aria-hidden', 'true');
    }
    if (typeof THREE === 'undefined') {
      fallback.style.display = 'flex';
      return;
    }
    try {
      container = containerEl;
      labelLayer = labelEl;
      termSymbolEl = document.getElementById('graphTermSymbol');
      allocScratch();

      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 2000);
      camera.position.set(130, 30, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h);
      if (THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
      if (THREE.ACESFilmicToneMapping !== undefined) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.95;
      }
      container.appendChild(renderer.domElement);
      renderer.domElement.setAttribute('aria-hidden', 'true');

      addLights();
      buildStarfield();
      buildGraph();
      buildLabels();

      if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.075;
        controls.enablePan = false;
        controls.minDistance = 2.5;
        controls.maxDistance = 320;
        controls.autoRotate = !REDUCED_MOTION;
        controls.autoRotateSpeed = AUTO_ROTATE_NORMAL;
        controls.target.set(0, 0, 0);
        hasControls = true;
      } else {
        camera.lookAt(ORIGIN);
      }

      clock = new THREE.Clock();
      ready = true;

      bindPicking();
      window.addEventListener('resize', onResize);
      if (window.ResizeObserver) new ResizeObserver(onResize).observe(container);

      applyState(state, true);
      if (legend) {
        legend.hidden = false;
        legend.removeAttribute('aria-hidden');
      }
      animate();
    } catch (error) {
      ready = false;
      if (renderer && renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      fallback.style.display = 'flex';
      console.warn('The 3D knowledge graph could not start.', error);
    }
  }

  /* Deliberately restrained. Bright white light plus additive halos washes
     the blue/pink/green level colours out to near-white, which is exactly
     the distinction the graph relies on. */
  function addLights() {
    scene.add(new THREE.AmbientLight(0x6a6a90, 0.34));

    const key = new THREE.DirectionalLight(0xffffff, 0.5);
    key.position.set(60, 90, 40);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x8fb0ff, 0.22);
    rim.position.set(-70, -30, -50);
    scene.add(rim);

    // Sits inside the white root node so the centre of the graph glows.
    const core = new THREE.PointLight(0xfff4e0, 0.5, 70, 2);
    core.position.set(0, 0, 0);
    scene.add(core);
  }

  function radialTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    // A soft falloff rather than a hot core — a bright centre stacked on top
    // of the lit sphere turns every node white and erases the level colour.
    g.addColorStop(0, 'rgba(255,255,255,0.75)');
    g.addColorStop(0.22, 'rgba(255,255,255,0.32)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.08)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  function buildStarfield() {
    const n = 700;
    const positions = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 260 + Math.random() * 380;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0x5a5a7c, size: 1.3, transparent: true, opacity: 0.55, sizeAttenuation: true,
    })));
  }

  function domainGeometry(code) {
    const r = SIZE.domain;
    switch (DOMAIN_SHAPES[code]) {
      case 'octahedron': return new THREE.OctahedronGeometry(r * 1.15, 0);
      case 'box': return new THREE.BoxGeometry(r * 1.5, r * 1.5, r * 1.5);
      case 'torus': return new THREE.TorusGeometry(r * 0.8, r * 0.34, 10, 20);
      case 'cylinder': return new THREE.CylinderGeometry(r * 0.75, r * 0.75, r * 1.7, 14);
      case 'dodecahedron': return new THREE.DodecahedronGeometry(r * 1.1, 0);
      default: return new THREE.IcosahedronGeometry(r * 1.15, 0);
    }
  }

  function nodeMaterial() {
    // Matte rather than glossy: a tight specular highlight on a small sphere
    // reads as a white dot and hides the node's colour.
    return new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0 });
  }

  function register(id, pos, level, parentId) {
    nodes[id] = {
      id, level, parentId,
      pos: pos.clone(),
      baseColor: new THREE.Color(COLORS[level]),
      target: 1, cur: 1,          // 0 = dimmed out, 1 = fully lit
      targetScale: 1, curScale: 1,
    };
    if (parentId) edgeList.push([parentId, id]);
  }

  function buildGraph() {
    register('root', ORIGIN, 'root', null);

    const domainCounts = {};
    GRADES.forEach((g, gi) => {
      const theta = (gi / GRADES.length) * Math.PI * 2;
      const gpos = new THREE.Vector3(
        RG * Math.cos(theta), 9 * Math.sin(theta * 1.6 + gi), RG * Math.sin(theta),
      );
      const gradeId = 'grade:' + g;
      register(gradeId, gpos, 'grade', 'root');
      gradeIds.push(gradeId);

      domainsForGrade(g).forEach((d, di) => {
        const doms = domainsForGrade(g);
        const thetaD = (di / doms.length) * Math.PI * 2 + gi * 0.7;
        const dpos = gpos.clone().add(new THREE.Vector3(
          RD * Math.cos(thetaD), RD * 0.55 * Math.sin(thetaD * 1.4 + di), RD * Math.sin(thetaD),
        ));
        const domId = 'domain:' + g + ':' + d.code;
        register(domId, dpos, 'domain', gradeId);
        if (!domainIdsByCode[d.code]) domainIdsByCode[d.code] = [];
        nodes[domId].instanceIndex = domainIdsByCode[d.code].length;
        nodes[domId].domainCode = d.code;
        domainIdsByCode[d.code].push(domId);
        domainCounts[d.code] = (domainCounts[d.code] || 0) + 1;

        const terms = termsFor(g, d.code);
        terms.forEach((t, ti) => {
          const thetaT = (ti / terms.length) * Math.PI * 2 + di * 0.9;
          const tpos = dpos.clone().add(new THREE.Vector3(
            RT * Math.cos(thetaT), RT * 0.6 * Math.sin(thetaT * 1.7 + ti), RT * Math.sin(thetaT),
          ));
          const termId = 'term:' + t.id;
          register(termId, tpos, 'term', domId);
          nodes[termId].instanceIndex = termIds.length;
          termIds.push(termId);
        });
      });
    });

    gradeIds.forEach((id, i) => { nodes[id].instanceIndex = i; });

    rootMesh = new THREE.Mesh(new THREE.SphereGeometry(SIZE.root, 32, 32), nodeMaterial());
    rootMesh.material.color.set(COLORS.root);
    rootMesh.material.emissive = new THREE.Color(0x333344);
    scene.add(rootMesh);

    gradeMesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(SIZE.grade, 24, 24), nodeMaterial(), gradeIds.length,
    );
    scene.add(gradeMesh);

    Object.keys(domainIdsByCode).forEach((code) => {
      const mesh = new THREE.InstancedMesh(
        domainGeometry(code), nodeMaterial(), domainIdsByCode[code].length,
      );
      domainMeshes[code] = mesh;
      scene.add(mesh);
    });

    termMesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(SIZE.term, 12, 12), nodeMaterial(), termIds.length,
    );
    scene.add(termMesh);

    buildHalos();
    buildEdges();
    writeInstances(true);
  }

  /* Additive point sprites behind each node. This is what produces the neon
     glow without a post-processing pass (and without the extra CDN
     dependency an EffectComposer bloom would need). */
  function buildHalos() {
    const tex = radialTexture();
    const byLevel = { root: ['root'], grade: gradeIds, domain: [], term: termIds };
    Object.keys(domainIdsByCode).forEach((code) => {
      byLevel.domain = byLevel.domain.concat(domainIdsByCode[code]);
    });

    Object.keys(byLevel).forEach((level) => {
      const ids = byLevel[level];
      if (!ids.length) return;
      const positions = new Float32Array(ids.length * 3);
      const colors = new Float32Array(ids.length * 3);
      ids.forEach((id, i) => {
        const p = nodes[id].pos;
        positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z;
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const points = new THREE.Points(geo, new THREE.PointsMaterial({
        size: HALO_SIZE[level], map: tex, vertexColors: true,
        blending: THREE.AdditiveBlending, transparent: true,
        depthWrite: false, sizeAttenuation: true,
      }));
      points.renderOrder = 2;
      scene.add(points);
      haloLayers[level] = { points, ids, colors };
    });
  }

  function buildEdges() {
    const positions = new Float32Array(edgeList.length * 6);
    edgeColors = new Float32Array(edgeList.length * 6);
    edgeList.forEach(([a, b], i) => {
      const pa = nodes[a].pos, pb = nodes[b].pos;
      positions.set([pa.x, pa.y, pa.z, pb.x, pb.y, pb.z], i * 6);
    });
    edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    edgeGeometry.setAttribute('color', new THREE.BufferAttribute(edgeColors, 3));
    scene.add(new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.9,
    })));
  }

  // ---------------------------------------------------------------------
  // labels
  // ---------------------------------------------------------------------

  const labels = {};
  const LABEL_OFFSET_Y = 46;
  // Lower number = more important. A short graph panel only has room for one.
  const LABEL_PRIORITY = { hover: 0, term: 1, domain: 2, grade: 3, root: 4 };
  const SHORT_PANEL_HEIGHT = 280;
  const AMBIENT_SYMBOL_MAX = 8;
  // Concrete rather than "Every math word" — a real number is meaningful in
  // a way a summary phrase is not, and it stays correct if the bank grows.
  const ROOT_LABEL_TEXT = DATA.length + ' math words · K–5';

  function buildLabels() {
    ['root', 'grade', 'domain', 'term', 'hover'].forEach((key) => {
      const el = document.createElement('div');
      const levelClass = 'lv-' + (key === 'hover' ? 'term' : key);
      el.className = 'graph-label ' + levelClass;
      el.innerHTML = '<div class="gl-box"><span class="gl-icon"></span><span class="gl-text"></span></div>';
      labelLayer.appendChild(el);
      labels[key] = {
        el, icon: el.querySelector('.gl-icon'), text: el.querySelector('.gl-text'), nodeId: null,
        // Tracked separately from the others because this is the one label
        // whose colour class has to change at runtime, to match whatever
        // level of node is currently under the pointer.
        levelClass: key === 'hover' ? levelClass : null,
      };
    });

    for (let i = 0; i < AMBIENT_SYMBOL_MAX; i++) {
      const el = document.createElement('div');
      el.className = 'graph-ambient-symbol';
      el.innerHTML = '<span class="graph-ambient-symbol-disc"></span>';
      labelLayer.appendChild(el);
      ambientSymbolEls.push(el);
    }

    // One always-in-the-DOM label per grade, shown all at once when the
    // "Show grade labels" toggle is on — independent of the single 'grade'
    // slot above, which only ever shows the one currently selected grade.
    gradeIds.forEach((id) => {
      const el = document.createElement('div');
      el.className = 'graph-label lv-grade';
      el.innerHTML = '<div class="gl-box"><span class="gl-icon"></span><span class="gl-text"></span></div>';
      el.querySelector('.gl-text').textContent = gradeLabel(id.split(':')[1]);
      el.querySelector('.gl-icon').innerHTML = iconSvg('cap', { size: 16 });
      labelLayer.appendChild(el);
      gradeLabelEls.push({ id, el });
    });
  }

  function setLabel(key, nodeId, text, iconName, level) {
    const l = labels[key];
    l.nodeId = nodeId;
    if (!nodeId) { l.el.classList.remove('visible'); return; }
    if (key === 'hover') {
      const nextClass = 'lv-' + (level || 'term');
      if (l.levelClass !== nextClass) {
        if (l.levelClass) l.el.classList.remove(l.levelClass);
        l.el.classList.add(nextClass);
        l.levelClass = nextClass;
      }
    }
    if (l.text.textContent !== text) l.text.textContent = text;
    // Only re-render the SVG when the glyph actually changes — this runs
    // inside a per-frame update path.
    if (l.iconName !== iconName) {
      l.iconName = iconName;
      l.icon.innerHTML = iconName ? iconSvg(iconName, { size: 16 }) : '';
    }
    l.el.classList.add('visible');
  }

  function updateGradeLabels() {
    gradeLabelEls.forEach(({ el }) => el.classList.toggle('visible', showAllGradeLabels));
  }

  /* Positioned independently of positionLabels()'s collision system — grade
     nodes already sit spread around the root at even angles, so at normal
     framing they don't need the pairwise nudge-apart pass the other labels
     use, and giving all six a dedicated pass keeps that pass itself simple. */
  function positionGradeLabels() {
    if (!showAllGradeLabels) return;
    const rect = container.getBoundingClientRect();
    gradeLabelEls.forEach(({ id, el }) => {
      const n = nodes[id];
      _v.copy(n.pos).project(camera);
      const offscreen = _v.z > 1 || Math.abs(_v.x) > 1.05 || Math.abs(_v.y) > 1.05;
      el.classList.toggle('visible', showAllGradeLabels && !offscreen);
      if (offscreen) return;
      const x = (_v.x * 0.5 + 0.5) * rect.width;
      const y = (-_v.y * 0.5 + 0.5) * rect.height - LABEL_OFFSET_Y * 0.55;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    });
  }

  /* Project each visible label to screen space, then push colliding labels
     apart vertically. Without this the grade/topic/word labels pile up on
     top of one another as soon as the camera closes in. */
  function positionLabels() {
    const rect = container.getBoundingClientRect();
    const placed = [];

    Object.keys(labels).forEach((key) => {
      const l = labels[key];
      if (!l.nodeId || !nodes[l.nodeId]) return;
      _v.copy(nodes[l.nodeId].pos).project(camera);
      // Behind the camera, or so far outside the panel that clamping it to
      // an edge would just be a label pinned to a corner pointing at nothing.
      const offscreen = _v.z > 1 || Math.abs(_v.x) > 1.5 || Math.abs(_v.y) > 1.5;
      if (offscreen) { l.el.classList.remove('visible'); return; }
      l.el.classList.add('visible');
      const box = l.el.firstElementChild;
      placed.push({
        l,
        x: (_v.x * 0.5 + 0.5) * rect.width,
        // Sits above the node rather than on top of it, so the label never
        // hides the thing it is labelling.
        y: (-_v.y * 0.5 + 0.5) * rect.height - LABEL_OFFSET_Y,
        w: box.offsetWidth,
        h: box.offsetHeight,
        priority: LABEL_PRIORITY[key],
      });
    });

    // On a short panel (phone, or an iPad in Slide Over) there is only room
    // for the deepest label; stacking two just makes both unreadable.
    placed.sort((a, b) => a.priority - b.priority || a.y - b.y);
    if (rect.height < SHORT_PANEL_HEIGHT && placed.length > 1) {
      placed.slice(1).forEach((p) => p.l.el.classList.remove('visible'));
      placed.length = 1;
    }
    for (let i = 0; i < placed.length; i++) {
      for (let j = 0; j < i; j++) {
        const a = placed[j];
        const b = placed[i];
        const gap = (a.h + b.h) / 2 + 8;
        const dy = b.y - a.y;
        if (Math.abs(b.x - a.x) < (a.w + b.w) / 2 + 8 && Math.abs(dy) < gap) {
          b.y = a.y + (dy >= 0 ? gap : -gap);
        }
      }
    }
    placed.forEach((p) => {
      const y = Math.max(p.h / 2 + 6, Math.min(rect.height - p.h / 2 - 6, p.y));
      const x = Math.max(p.w / 2 + 6, Math.min(rect.width - p.w / 2 - 6, p.x));
      p.l.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    });
  }

  /* A handful of symbols ride on the nearest visible vocabulary nodes in the
     whole-map view. Showing every symbol at once would turn 189 nodes into a
     wall of badges, so this chooses a well-spaced sample and refreshes it as
     the map turns. */
  function refreshAmbientSymbols() {
    if (state.grade) {
      ambientSymbolEls.forEach((el) => {
        el.dataset.nodeId = '';
        el.classList.remove('visible', 'onscreen');
      });
      return;
    }

    const rect = container.getBoundingClientRect();
    const limit = rect.width < 600 ? 5 : AMBIENT_SYMBOL_MAX;
    const candidates = [];

    termIds.forEach((id) => {
      if (id === hoveredId) return;
      _v.copy(nodes[id].pos).project(camera);
      if (_v.z > 1 || Math.abs(_v.x) > 0.92 || Math.abs(_v.y) > 0.84) return;

      const x = (_v.x * 0.5 + 0.5) * rect.width;
      const y = (-_v.y * 0.5 + 0.5) * rect.height;
      // Keep the root label and the map key easy to read.
      if (Math.abs(_v.x) < 0.24 && Math.abs(_v.y) < 0.2) return;
      if (x < 220 && y > rect.height - 150) return;
      candidates.push({ id, x, y, depth: _v.z });
    });

    candidates.sort((a, b) => a.depth - b.depth);
    const selected = [];
    for (const candidate of candidates) {
      const clear = selected.every((item) => Math.hypot(
        candidate.x - item.x, candidate.y - item.y,
      ) > 64);
      if (clear) selected.push(candidate);
      if (selected.length === limit) break;
    }

    ambientSymbolEls.forEach((el, index) => {
      const item = selected[index];
      if (!item) {
        el.dataset.nodeId = '';
        el.classList.remove('visible', 'onscreen');
        return;
      }
      if (el.dataset.nodeId !== item.id) {
        const term = termById(item.id.slice(5));
        el.dataset.nodeId = item.id;
        el.firstElementChild.innerHTML = term ? termIconSvg(term, { size: 17 }) : '';
      }
      el.classList.add('visible');
    });
  }

  function positionAmbientSymbols() {
    if (state.grade) return;
    const rect = container.getBoundingClientRect();
    const rootVisible = labels.root.el.classList.contains('visible');
    const rootBox = rootVisible
      ? labels.root.el.firstElementChild.getBoundingClientRect()
      : null;
    ambientSymbolEls.forEach((el) => {
      const n = nodes[el.dataset.nodeId];
      if (!n) return;
      _v.copy(n.pos).project(camera);
      const x = (_v.x * 0.5 + 0.5) * rect.width;
      const y = (-_v.y * 0.5 + 0.5) * rect.height;
      const screenX = rect.left + x;
      const screenY = rect.top + y;
      const obscuresRoot = rootBox
        && screenX > rootBox.left - 18 && screenX < rootBox.right + 18
        && screenY > rootBox.top - 18 && screenY < rootBox.bottom + 18;
      const obscuresLegend = x < 220 && y > rect.height - 150;
      const offscreen = _v.z > 1 || Math.abs(_v.x) > 1.02 || Math.abs(_v.y) > 1.02
        || obscuresRoot || obscuresLegend;
      el.classList.toggle('onscreen', !offscreen);
      if (offscreen) return;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    });
  }

  function updateLabels() {
    const st = state;
    const anySelection = !!st.grade;

    setLabel('root', anySelection ? null : 'root', ROOT_LABEL_TEXT, 'spark');

    // Grade and topic labels give way once a word is chosen — the word is
    // what matters at that point, and the breadcrumb still shows the path.
    // The single grade slot also gives way to the "show all" toggle, which
    // covers the selected grade too — showing both would just be the same
    // text twice.
    const showSingleGrade = st.grade && !st.term && !showAllGradeLabels;
    setLabel('grade', showSingleGrade ? 'grade:' + st.grade : null, gradeLabel(st.grade), 'cap');

    const domId = st.grade && st.domainCode ? 'domain:' + st.grade + ':' + st.domainCode : null;
    setLabel('domain', domId, DOMAIN_FULLNAME[st.domainCode] || '',
      DOMAIN_ICON_NAMES[st.domainCode] || 'shapes');

    if (st.term) {
      const t = termById(st.term);
      setLabel('term', 'term:' + st.term, t ? t.term : '', t ? iconNameForTerm(t) : '');
    } else {
      setLabel('term', null, '', '');
    }

    // The hover label exists to name whatever has no other label on screen
    // yet. Every branch below is a case where something is already saying
    // the same thing — hovering root previously produced two overlapping
    // boxes with identical text, which is the bug this guards against.
    const hoveredNode = hoveredId ? nodes[hoveredId] : null;
    const hoverIsRedundant = hoveredNode && (
      hoveredId === 'root'
      || hoveredId === 'term:' + st.term
      || (domId && hoveredId === domId)
      || (showSingleGrade && hoveredId === 'grade:' + st.grade)
      || (showAllGradeLabels && hoveredNode.level === 'grade')
    );
    if (hoveredNode && !hoverIsRedundant) {
      setLabel('hover', hoveredId, describe(hoveredId), hoverIcon(hoveredId), hoveredNode.level);
    } else {
      setLabel('hover', null, '', '');
    }
    updateTermSymbol();
    refreshAmbientSymbols();
    updateGradeLabels();
  }

  /* The active vocabulary symbol sits directly on the green sphere. Showing
     one at a time keeps the full 189-node map legible while still building a
     visual association between each word and its mathematical notation. */
  function updateTermSymbol() {
    if (!termSymbolEl) return;
    const hoverTerm = hoveredId && nodes[hoveredId] && nodes[hoveredId].level === 'term'
      ? hoveredId
      : null;
    const nodeId = hoverTerm || (state.term ? 'term:' + state.term : null);
    const t = nodeId ? termById(nodeId.slice(5)) : null;

    if (!t) {
      termSymbolEl.dataset.nodeId = '';
      termSymbolEl.classList.remove('visible');
      return;
    }
    if (termSymbolEl.dataset.termId !== t.id) {
      termSymbolEl.dataset.termId = t.id;
      termSymbolEl.innerHTML = `<span class="graph-term-symbol-disc">${termIconSvg(t, { size: 30 })}</span>`;
    }
    termSymbolEl.dataset.nodeId = nodeId;
    termSymbolEl.classList.add('visible');
  }

  function positionTermSymbol() {
    if (!termSymbolEl || !termSymbolEl.dataset.nodeId) return;
    const n = nodes[termSymbolEl.dataset.nodeId];
    if (!n) return;
    const rect = container.getBoundingClientRect();
    _v.copy(n.pos).project(camera);
    const offscreen = _v.z > 1 || Math.abs(_v.x) > 1.05 || Math.abs(_v.y) > 1.05;
    if (offscreen) {
      termSymbolEl.classList.remove('onscreen');
      return;
    }
    termSymbolEl.classList.add('onscreen');
    const x = (_v.x * 0.5 + 0.5) * rect.width;
    const y = (-_v.y * 0.5 + 0.5) * rect.height;
    termSymbolEl.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  }

  function describe(id) {
    const n = nodes[id];
    if (!n) return '';
    if (n.level === 'root') return ROOT_LABEL_TEXT;
    if (n.level === 'grade') return gradeLabel(id.split(':')[1]);
    if (n.level === 'domain') return DOMAIN_FULLNAME[id.split(':')[2]] || '';
    const t = termById(id.slice(5));
    return t ? t.term : '';
  }

  function hoverIcon(id) {
    const n = nodes[id];
    if (!n) return '';
    if (n.level === 'root') return 'spark';
    if (n.level === 'grade') return 'cap';
    if (n.level === 'domain') return DOMAIN_ICON_NAMES[id.split(':')[2]] || 'shapes';
    const t = termById(id.slice(5));
    return t ? iconNameForTerm(t) : '';
  }

  // ---------------------------------------------------------------------
  // highlight state
  // ---------------------------------------------------------------------

  function pathFor(st) {
    const ids = ['root'];
    if (st.grade) ids.push('grade:' + st.grade);
    if (st.grade && st.domainCode) ids.push('domain:' + st.grade + ':' + st.domainCode);
    if (st.grade && st.domainCode && st.term) ids.push('term:' + st.term);
    return ids;
  }

  function applyState(st, instant) {
    const active = new Set(st.grade ? pathFor(st) : []);
    const showAll = active.size === 0;

    Object.keys(nodes).forEach((id) => {
      const n = nodes[id];
      const on = showAll || active.has(id) || id === 'root';
      n.target = on ? 1 : DIM;
      n.targetScale = on ? 1 : DIM_SCALE;
      if (instant) { n.cur = n.target; n.curScale = n.targetScale; }
    });

    // The selected node gets a little extra presence.
    const deepest = st.term ? 'term:' + st.term
      : st.domainCode ? 'domain:' + st.grade + ':' + st.domainCode
        : st.grade ? 'grade:' + st.grade : null;
    if (deepest && nodes[deepest]) nodes[deepest].targetScale = 1.35;
  }

  function writeInstances() {
    // grades
    gradeIds.forEach((id, i) => writeInstance(gradeMesh, i, nodes[id]));
    gradeMesh.instanceMatrix.needsUpdate = true;
    if (gradeMesh.instanceColor) gradeMesh.instanceColor.needsUpdate = true;

    // domains
    Object.keys(domainIdsByCode).forEach((code) => {
      const mesh = domainMeshes[code];
      domainIdsByCode[code].forEach((id, i) => writeInstance(mesh, i, nodes[id]));
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });

    // terms
    termIds.forEach((id, i) => writeInstance(termMesh, i, nodes[id]));
    termMesh.instanceMatrix.needsUpdate = true;
    if (termMesh.instanceColor) termMesh.instanceColor.needsUpdate = true;

    // halos
    Object.keys(haloLayers).forEach((level) => {
      const layer = haloLayers[level];
      layer.ids.forEach((id, i) => {
        const n = nodes[id];
        const boost = hoveredId === id ? 1.7 : 1;
        _c.copy(n.baseColor).multiplyScalar(n.cur * 0.42 * boost);
        layer.colors[i * 3] = _c.r; layer.colors[i * 3 + 1] = _c.g; layer.colors[i * 3 + 2] = _c.b;
      });
      layer.points.geometry.attributes.color.needsUpdate = true;
    });

    // edges
    edgeList.forEach(([a, b], i) => {
      const lit = Math.min(nodes[a].cur, nodes[b].cur);
      const v = 0.34 * lit;
      for (let k = 0; k < 2; k++) {
        edgeColors[i * 6 + k * 3] = v * 0.72;
        edgeColors[i * 6 + k * 3 + 1] = v * 0.75;
        edgeColors[i * 6 + k * 3 + 2] = v;
      }
    });
    edgeGeometry.attributes.color.needsUpdate = true;

    const rootNode = nodes.root;
    rootMesh.material.color.copy(rootNode.baseColor).multiplyScalar(Math.max(rootNode.cur, 0.3));
  }

  function writeInstance(mesh, i, n) {
    const hover = hoveredId === n.id ? 1.25 : 1;
    _s.setScalar(n.curScale * hover);
    _m.compose(n.pos, _q, _s);
    mesh.setMatrixAt(i, _m);
    _c.copy(n.baseColor).multiplyScalar(n.cur);
    mesh.setColorAt(i, _c);
  }

  // ---------------------------------------------------------------------
  // camera
  // ---------------------------------------------------------------------

  /* Distance needed to fit a sphere of `radius` in view, accounting for the
     panel's aspect ratio. On a tall narrow panel (iPad portrait) this pulls
     the camera back so the subject and its label still fit horizontally. */
  function frameDistance(radius) {
    const vFov = (camera.fov * Math.PI) / 180;
    const fitH = radius / Math.tan(vFov / 2);
    const fitW = radius / (Math.tan(vFov / 2) * Math.max(camera.aspect, 0.001));
    return Math.max(fitH, fitW) * 1.08;
  }

  function dirFrom(child, parent) {
    const d = child.clone().sub(parent);
    if (d.lengthSq() < 0.0001) d.set(1, 0, 0);
    return d.normalize();
  }

  function flyTo(camPos, lookAt, duration) {
    if (REDUCED_MOTION || typeof gsap === 'undefined') {
      camera.position.copy(camPos);
      if (hasControls) controls.target.copy(lookAt); else camera.lookAt(lookAt);
      return;
    }
    gsap.to(camera.position, {
      x: camPos.x, y: camPos.y, z: camPos.z, duration, ease: EASE_INOUT_STRONG, overwrite: true,
    });
    if (hasControls) {
      gsap.to(controls.target, {
        x: lookAt.x, y: lookAt.y, z: lookAt.z, duration, ease: EASE_INOUT_STRONG, overwrite: true,
      });
    } else {
      camera.lookAt(lookAt);
    }
  }

  function focus(st) {
    state = { grade: st.grade, domainCode: st.domainCode, term: st.term };
    if (!ready) return;

    applyState(state, false);
    updateLabels();

    if (state.term) {
      const n = nodes['term:' + state.term];
      const parent = nodes['domain:' + state.grade + ':' + state.domainCode];
      const dir = dirFrom(n.pos, parent.pos);
      const dist = Math.max(frameDistance(2.6), 3.2);
      flyTo(n.pos.clone().addScaledVector(dir, dist).add(new THREE.Vector3(0, dist * 0.25, 0)), n.pos.clone(), 1.15);
      setAutoRotate(false);
    } else if (state.domainCode) {
      const n = nodes['domain:' + state.grade + ':' + state.domainCode];
      const parent = nodes['grade:' + state.grade];
      const dir = dirFrom(n.pos, parent.pos);
      const dist = frameDistance(RT * 1.5);
      flyTo(n.pos.clone().addScaledVector(dir, dist).add(new THREE.Vector3(0, dist * 0.28, 0)), n.pos.clone(), 1.15);
      setAutoRotate(false);
    } else if (state.grade) {
      const n = nodes['grade:' + state.grade];
      const dir = dirFrom(n.pos, ORIGIN);
      const dist = frameDistance(RD * 1.55);
      flyTo(n.pos.clone().addScaledVector(dir, dist).add(new THREE.Vector3(0, dist * 0.3, 0)), n.pos.clone(), 1.15);
      setAutoRotate(false);
    } else {
      const dist = frameDistance(RG * 1.46);
      flyTo(new THREE.Vector3(dist, dist * 0.24, 0), ORIGIN.clone(), 1.05);
      setAutoRotate(true);
    }
  }

  function setAutoRotate(on) {
    if (hasControls) controls.autoRotate = on && !REDUCED_MOTION;
  }

  function onResize() {
    if (!ready || !container.clientWidth) return;
    camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  // ---------------------------------------------------------------------
  // picking — tapping a node in the graph selects it
  // ---------------------------------------------------------------------

  function bindPicking() {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downAt = null;
    let pendingHover = false;

    function pick(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const targets = [termMesh, gradeMesh, rootMesh].concat(Object.values(domainMeshes));
      const hits = raycaster.intersectObjects(targets, false);
      for (const hit of hits) {
        const id = idForHit(hit);
        if (id && nodes[id].cur > 0.3) return id;   // ignore dimmed-out nodes
      }
      return null;
    }

    function idForHit(hit) {
      if (hit.object === rootMesh) return 'root';
      if (hit.object === gradeMesh) return gradeIds[hit.instanceId];
      if (hit.object === termMesh) return termIds[hit.instanceId];
      const code = Object.keys(domainMeshes).find((k) => domainMeshes[k] === hit.object);
      return code ? domainIdsByCode[code][hit.instanceId] : null;
    }

    renderer.domElement.addEventListener('pointermove', (e) => {
      if (pendingHover) return;
      pendingHover = true;
      requestAnimationFrame(() => {
        pendingHover = false;
        const id = pick(e);
        if (id !== hoveredId) {
          hoveredId = id;
          renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
          updateLabels();
        }
      });
    });

    renderer.domElement.addEventListener('pointerleave', () => {
      hoveredId = null;
      updateLabels();
      autoRotateTargetSpeed = AUTO_ROTATE_NORMAL;
    });

    // Slows the idle spin the moment the pointer is anywhere over the
    // canvas — not just on a node — because a graph spinning at full speed
    // is nearly impossible to aim a hover at. Eased in animate(), not set
    // instantly, so the change itself doesn't feel like a jump cut.
    renderer.domElement.addEventListener('pointerenter', () => {
      autoRotateTargetSpeed = AUTO_ROTATE_SLOW;
    });

    renderer.domElement.addEventListener('pointerdown', (e) => {
      downAt = { x: e.clientX, y: e.clientY, t: Date.now() };
    });

    // Only treat it as a tap if the pointer barely moved — otherwise the
    // gesture was an orbit drag and must not change the selection.
    renderer.domElement.addEventListener('pointerup', (e) => {
      if (!downAt) return;
      const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
      const elapsed = Date.now() - downAt.t;
      downAt = null;
      if (moved > 8 || elapsed > 700) return;
      const id = pick(e);
      if (id && onSelect) onSelect(id);
    });
  }

  // ---------------------------------------------------------------------
  // loop
  // ---------------------------------------------------------------------

  function animate() {
    requestAnimationFrame(animate);
    if (!ready) return;

    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.getElapsedTime();

    // Frame-rate independent easing toward the target highlight state.
    const k = 1 - Math.pow(0.001, dt);
    let changed = false;
    Object.keys(nodes).forEach((id) => {
      const n = nodes[id];
      if (Math.abs(n.cur - n.target) > 0.001 || Math.abs(n.curScale - n.targetScale) > 0.001) {
        n.cur += (n.target - n.cur) * k;
        n.curScale += (n.targetScale - n.curScale) * k;
        changed = true;
      }
    });
    if (changed || hoveredId !== null) writeInstances();

    if (Math.abs(autoRotateCurSpeed - autoRotateTargetSpeed) > 0.0005) {
      autoRotateCurSpeed += (autoRotateTargetSpeed - autoRotateCurSpeed) * k;
    }

    if (hasControls) {
      controls.autoRotateSpeed = autoRotateCurSpeed;
      controls.update();
    } else if (!state.grade && !REDUCED_MOTION) {
      idleAngle += dt * 0.35 * (autoRotateCurSpeed / AUTO_ROTATE_NORMAL);
      camera.position.set(130 * Math.cos(idleAngle), 30, 130 * Math.sin(idleAngle));
      camera.lookAt(ORIGIN);
    }

    if (!REDUCED_MOTION) {
      rootMesh.scale.setScalar(1 + 0.06 * Math.sin(t * 1.1));
    }

    // project() reads camera.matrixWorldInverse, which render() is what
    // normally refreshes — update it first so labels are never a frame
    // behind the nodes they point at (and are not garbage on frame one).
    camera.updateMatrixWorld();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    positionLabels();
    positionTermSymbol();
    positionGradeLabels();
    if ((ambientSymbolFrame++ % 24) === 0) refreshAmbientSymbols();
    positionAmbientSymbols();

    renderer.render(scene, camera);
  }

  return {
    init,
    focus,
    setOnSelect(cb) { onSelect = cb; },
    isReady() { return ready; },
  };
}());
