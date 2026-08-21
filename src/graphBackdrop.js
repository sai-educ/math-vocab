/* =========================================================================
   The landing page's backdrop: a decorative, non-interactive render of the
   same knowledge graph as app.html's #graphContainer — same node layout,
   same sun, same slow idle spin — with everything the real app needs for
   selection, labels and vocabulary symbols stripped out. The page never
   loads vocab_data.json or curriculum.js; build_html.py precomputes each
   node's position once (see build_graph_layout() in build_html.py) and
   embeds only that shape, never any term text.

   Defensive the same way graph3d.js is: if THREE (or the layout data) is
   missing, this quietly does nothing and the page's own CSS space gradient
   carries the background on its own.
   ========================================================================= */
(function () {
  var container = document.getElementById('graphBackdrop');
  var dataEl = document.getElementById('graph-layout');
  if (!container || !dataEl || typeof THREE === 'undefined') return;

  var manifest;
  try {
    manifest = JSON.parse(dataEl.textContent);
  } catch (error) {
    return;
  }
  if (!manifest || !manifest.length) return;

  var REDUCED_MOTION = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // Mirrors src/graph3d.js's own COLORS/SIZE/HALO_SIZE/DOMAIN_SHAPES and its
  // AUTO_ROTATE_SLOW — the same "slowed for a hover" spin, just always on
  // here, since that is the exact feel this backdrop is meant to reproduce.
  var COLORS = { grade: 0x7c9eff, domain: 0xff5fa8, term: 0x7cffb2 };
  var SIZE = { root: 2.8, grade: 1.7, domain: 1.08, term: 0.58 };
  var HALO_SIZE = { root: 26, grade: 13, domain: 8.5, term: 4.6 };
  var DOMAIN_SHAPES = {
    CC: 'icosahedron', OA: 'octahedron', NBT: 'box',
    NF: 'torus', MD: 'cylinder', G: 'dodecahedron',
  };
  var SUN_ASSET_URL = 'assets/sun.glb';
  var SUN_ROTATION_SPEED = 0.045;
  var SUN_HALO_COLOR = 0xffb35c;
  var SUN_HALO_BOOST = 1.7;
  var ROTATE_SPEED = 0.09;
  var EDGE_SEGMENTS = 6;
  var FIT_RADIUS = 34 * 1.46; // RG * the same margin graph3d's whole-map reset view uses

  var scene, camera, renderer, controls, clock, rootVisual;
  var currentDist = FIT_RADIUS;

  function frameDistance(aspect, radius) {
    var vFov = (50 * Math.PI) / 180;
    var fitH = radius / Math.tan(vFov / 2);
    var fitW = radius / (Math.tan(vFov / 2) * Math.max(aspect, 0.001));
    return Math.max(fitH, fitW) * 1.08;
  }

  function radialTexture() {
    var size = 128;
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    var ctx = canvas.getContext('2d');
    var g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.75)');
    g.addColorStop(0.22, 'rgba(255,255,255,0.32)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.08)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    var tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  function nodeMaterial(color) {
    return new THREE.MeshStandardMaterial({ color: color, roughness: 0.62, metalness: 0 });
  }

  function domainGeometry(code) {
    var r = SIZE.domain;
    switch (DOMAIN_SHAPES[code]) {
      case 'octahedron': return new THREE.OctahedronGeometry(r * 1.15, 0);
      case 'box': return new THREE.BoxGeometry(r * 1.5, r * 1.5, r * 1.5);
      case 'torus': return new THREE.TorusGeometry(r * 0.8, r * 0.34, 10, 20);
      case 'cylinder': return new THREE.CylinderGeometry(r * 0.75, r * 0.75, r * 1.7, 14);
      case 'dodecahedron': return new THREE.DodecahedronGeometry(r * 1.1, 0);
      default: return new THREE.IcosahedronGeometry(r * 1.15, 0);
    }
  }

  function addLights() {
    scene.add(new THREE.AmbientLight(0x6a6a90, 0.34));
    var key = new THREE.DirectionalLight(0xffffff, 0.5);
    key.position.set(60, 90, 40);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x8fb0ff, 0.22);
    rim.position.set(-70, -30, -50);
    scene.add(rim);
    var core = new THREE.PointLight(0xfff4e0, 0.5, 70, 2);
    core.position.set(0, 0, 0);
    scene.add(core);
  }

  function buildStarfield() {
    var n = 700;
    var positions = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var r = 260 + Math.random() * 380;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos((Math.random() * 2) - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0x5a5a7c, size: 1.3, transparent: true, opacity: 0.55, sizeAttenuation: true,
    })));
  }

  function quadraticBezier(a, ctrl, b, t, out) {
    var mt = 1 - t;
    out.set(
      mt * mt * a.x + 2 * mt * t * ctrl.x + t * t * b.x,
      mt * mt * a.y + 2 * mt * t * ctrl.y + t * t * b.y,
      mt * mt * a.z + 2 * mt * t * ctrl.z + t * t * b.z,
    );
  }

  /* Builds every grade/domain/term node from the precomputed manifest, plus
     the halo sprite behind each and the curved, colour-graded edges between
     parent and child — the same visual language as graph3d.js's buildGraph()
     and buildEdges(), just without the selection/dimming machinery this
     backdrop has no use for: everything here stays fully lit. */
  function buildGraph() {
    var ORIGIN = new THREE.Vector3(0, 0, 0);
    var positions = manifest.map(function (n) { return new THREE.Vector3(n[2], n[3], n[4]); });

    var domainCounts = {};
    manifest.forEach(function (n) { if (n[0] === 'd') domainCounts[n[1]] = (domainCounts[n[1]] || 0) + 1; });

    var gradeIdx = [], domainIdx = {}, termIdx = [];
    manifest.forEach(function (n, i) {
      if (n[0] === 'g') gradeIdx.push(i);
      else if (n[0] === 'd') (domainIdx[n[1]] || (domainIdx[n[1]] = [])).push(i);
      else termIdx.push(i);
    });

    var haloPositions = { root: [ORIGIN], grade: [], domain: [], term: [] };
    var haloColors = { root: [0xffffff], grade: [], domain: [], term: [] };

    var gradeMesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(SIZE.grade, 24, 24), nodeMaterial(COLORS.grade), gradeIdx.length,
    );
    gradeIdx.forEach(function (nodeI, i) {
      var m = new THREE.Matrix4().compose(positions[nodeI], new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
      gradeMesh.setMatrixAt(i, m);
      haloPositions.grade.push(positions[nodeI]);
      haloColors.grade.push(COLORS.grade);
    });
    scene.add(gradeMesh);

    Object.keys(domainIdx).forEach(function (code) {
      var ids = domainIdx[code];
      var mesh = new THREE.InstancedMesh(domainGeometry(code), nodeMaterial(COLORS.domain), ids.length);
      ids.forEach(function (nodeI, i) {
        var m = new THREE.Matrix4().compose(positions[nodeI], new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
        mesh.setMatrixAt(i, m);
        haloPositions.domain.push(positions[nodeI]);
        haloColors.domain.push(COLORS.domain);
      });
      scene.add(mesh);
    });

    var termMesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(SIZE.term, 12, 12), nodeMaterial(COLORS.term), termIdx.length,
    );
    termIdx.forEach(function (nodeI, i) {
      var m = new THREE.Matrix4().compose(positions[nodeI], new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
      termMesh.setMatrixAt(i, m);
      haloPositions.term.push(positions[nodeI]);
      haloColors.term.push(COLORS.term);
    });
    scene.add(termMesh);

    buildHalos(haloPositions, haloColors);
    buildEdges(positions, ORIGIN);
  }

  function buildHalos(haloPositions, haloColors) {
    var tex = radialTexture();
    var color = new THREE.Color();
    Object.keys(haloPositions).forEach(function (level) {
      var pts = haloPositions[level];
      if (!pts.length) return;
      var positions = new Float32Array(pts.length * 3);
      var colors = new Float32Array(pts.length * 3);
      var isSun = level === 'root';
      pts.forEach(function (p, i) {
        positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z;
        color.setHex(isSun ? SUN_HALO_COLOR : haloColors[level][i]);
        color.multiplyScalar(0.5 * (isSun ? SUN_HALO_BOOST : 1));
        colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
      });
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      var points = new THREE.Points(geo, new THREE.PointsMaterial({
        size: HALO_SIZE[level], map: tex, vertexColors: true,
        blending: THREE.AdditiveBlending, transparent: true,
        depthWrite: false, sizeAttenuation: true,
      }));
      points.renderOrder = 2;
      scene.add(points);
    });
  }

  function buildEdges(positions, ORIGIN) {
    var pairs = [];
    manifest.forEach(function (n, i) {
      var parent = n[5];
      pairs.push([parent === -1 ? ORIGIN : positions[parent], positions[i], parent === -1 ? 0xffffff : COLORS[n[0] === 'g' ? 'grade' : n[0] === 'd' ? 'domain' : 'term']]);
    });
    // Colour of the parent end of each edge: root -> grade edges fade from
    // white; grade -> domain and domain -> term fade from the parent's own
    // level colour, same gradient graph3d.js's buildEdges() draws.
    var parentColor = {};
    manifest.forEach(function (n, i) { parentColor[i] = COLORS[n[0] === 'g' ? 'grade' : n[0] === 'd' ? 'domain' : 'term']; });

    var vertsPerEdge = EDGE_SEGMENTS * 2;
    var edgePositions = new Float32Array(pairs.length * vertsPerEdge * 3);
    var edgeColorsArr = new Float32Array(pairs.length * vertsPerEdge * 3);
    var mid = new THREE.Vector3(), bowDir = new THREE.Vector3(), ctrl = new THREE.Vector3();
    var p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), col = new THREE.Color();
    var ca = new THREE.Color(), cb = new THREE.Color();

    pairs.forEach(function (pair, i) {
      var pa = pair[0], pb = pair[1];
      var parentIdx = manifest[i][5];
      ca.setHex(parentIdx === -1 ? 0xffffff : parentColor[parentIdx]);
      cb.setHex(parentColor[i]);
      mid.addVectors(pa, pb).multiplyScalar(0.5);
      if (mid.lengthSq() < 0.0001) bowDir.set(0, 1, 0); else bowDir.copy(mid).normalize();
      ctrl.copy(mid).addScaledVector(bowDir, pa.distanceTo(pb) * 0.24);

      for (var s = 0; s < EDGE_SEGMENTS; s++) {
        var t0 = s / EDGE_SEGMENTS, t1 = (s + 1) / EDGE_SEGMENTS;
        quadraticBezier(pa, ctrl, pb, t0, p0);
        quadraticBezier(pa, ctrl, pb, t1, p1);
        var vi = (i * vertsPerEdge + s * 2) * 3;
        edgePositions[vi] = p0.x; edgePositions[vi + 1] = p0.y; edgePositions[vi + 2] = p0.z;
        edgePositions[vi + 3] = p1.x; edgePositions[vi + 4] = p1.y; edgePositions[vi + 5] = p1.z;
        col.copy(ca).lerp(cb, t0).multiplyScalar(0.34);
        edgeColorsArr[vi] = col.r; edgeColorsArr[vi + 1] = col.g; edgeColorsArr[vi + 2] = col.b;
        col.copy(ca).lerp(cb, t1).multiplyScalar(0.34);
        edgeColorsArr[vi + 3] = col.r; edgeColorsArr[vi + 4] = col.g; edgeColorsArr[vi + 5] = col.b;
      }
    });

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(edgeColorsArr, 3));
    scene.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 })));
  }

  /* Same best-effort swap as graph3d.js's loadSunModel(): the plain sphere is
     already on screen, so a missing GLTFLoader, no network, or a failed
     fetch all just leave it in place rather than erroring. */
  function buildRoot() {
    var sphere = new THREE.Mesh(new THREE.SphereGeometry(SIZE.root, 32, 32), nodeMaterial(0xffffff));
    sphere.material.emissive = new THREE.Color(0x333344);
    scene.add(sphere);
    rootVisual = sphere;

    if (typeof THREE.GLTFLoader === 'undefined') return;
    new THREE.GLTFLoader().load(
      SUN_ASSET_URL,
      function (gltf) {
        var model = gltf.scene;
        var box = new THREE.Box3().setFromObject(model);
        var sphereB = box.getBoundingSphere(new THREE.Sphere());
        model.position.sub(sphereB.center);
        model.traverse(function (child) {
          if (!child.isMesh || !child.material) return;
          var materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(function (mat) {
            if ('emissiveIntensity' in mat) mat.emissiveIntensity = Math.max(mat.emissiveIntensity, 1) * 1.4;
          });
        });
        var group = new THREE.Group();
        group.add(model);
        var scale = SIZE.root / sphereB.radius;
        group.scale.setScalar(scale);
        group.userData.baseScale = scale;
        scene.add(group);
        scene.remove(sphere);
        sphere.geometry.dispose();
        sphere.material.dispose();
        rootVisual = group;
      },
      undefined,
      function () { /* keep the plain sphere */ },
    );
  }

  function onResize() {
    var w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    currentDist = frameDistance(camera.aspect, FIT_RADIUS);
    camera.position.setLength(currentDist);
  }

  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.1);
    var t = clock.getElapsedTime();

    if (controls) controls.update();

    if (!REDUCED_MOTION && rootVisual) {
      rootVisual.rotation.y += dt * SUN_ROTATION_SPEED;
      var baseScale = rootVisual.userData.baseScale || 1;
      rootVisual.scale.setScalar(baseScale * (1 + 0.06 * Math.sin(t * 1.1)));
    }

    renderer.render(scene, camera);
  }

  function init() {
    var w = window.innerWidth, h = window.innerHeight;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, w / Math.max(h, 1), 0.1, 2000);
    currentDist = frameDistance(camera.aspect, FIT_RADIUS);
    camera.position.set(currentDist, currentDist * 0.24, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    if (THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
    if (THREE.ACESFilmicToneMapping !== undefined) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.95;
    }
    container.appendChild(renderer.domElement);

    addLights();
    buildStarfield();
    buildGraph();
    buildRoot();

    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0, 0);
      controls.enabled = false; // decorative only — no drag/zoom, ever
      controls.autoRotate = !REDUCED_MOTION;
      controls.autoRotateSpeed = ROTATE_SPEED;
    } else {
      camera.lookAt(0, 0, 0);
    }

    clock = new THREE.Clock();
    window.addEventListener('resize', onResize);
    animate();
  }

  try {
    init();
  } catch (error) {
    console.warn('The landing page backdrop could not start.', error);
  }
}());
