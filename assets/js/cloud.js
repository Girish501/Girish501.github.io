// Hero point cloud. One cloud of points morphs through shapes built from the site's own numbers as
// the pinned hero is scrolled: the wurtzite ZnO lattice (a, c from XRD), the 600-cycle AZO film with
// its Al planes, the fitted diode and MOSFET I-V lines, the TIA gain curve, and the Tauc curves once
// data/azo/tauc_*.csv exist. three.js draws the points; the scroll scrub is this file's own
// (progress read from scrollY each frame and eased toward, no scroll library).
//
// Runs only on screens at least 1024 x 700, without reduced motion, with a hardware WebGL renderer.
// Otherwise nothing loads and the hero keeps its static figure.
(function () {
  "use strict";
  var hero = document.querySelector("[data-cloud]");
  if (!hero) return;
  if (!window.matchMedia("(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)").matches) return;
  var test = document.createElement("canvas");
  var gl = test.getContext("webgl2") || test.getContext("webgl");
  if (!gl) return;
  var ext = gl.getExtension("WEBGL_debug_renderer_info");
  var rname = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
  if (/swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(rname)) return;
  var lose = gl.getExtension("WEBGL_lose_context"); if (lose) lose.loseContext();

  // ---- The numbers (all from the results table and project rows) ----
  var A_LAT = 3.252, C_LAT = 5.213, U_WZ = 0.382;      // wurtzite ZnO lattice constants (Å), internal parameter u
  var CYCLES = 600, RATIO = 19;                          // 600 cycles, 19:1 ZnO:Al supercycles
  var VFWD = 0.330, RON = 0.0665, RDS = 0.0651;          // fitted diode and MOSFET models (V, Ω)
  var I_MIN = 0.02, I_MAX = 4;                           // A
  var TIA_GAIN = 109, TIA_FC = 492e6;                    // dBΩ, Hz

  var params = new URLSearchParams(location.search);
  var N = parseInt(params.get("points"), 10) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4 ? 24000 : 42000);

  // Seeded random so the cloud is the same on every visit.
  var seed = 7;
  function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }

  var INK = [0.09, 0.094, 0.102], GRAY = [0.6, 0.62, 0.65], LIGHT = [0.78, 0.77, 0.73], BLUE = [0.12, 0.29, 0.79], BLUE2 = [0.45, 0.56, 0.87];
  function fill(col, c, i) { col[3 * i] = c[0]; col[3 * i + 1] = c[1]; col[3 * i + 2] = c[2]; }

  // Each shape returns { pos, col } with N points, in a box about 6.4 wide, 3.6 tall, 3.6 deep.
  function shapeLattice() {
    var pos = new Float32Array(3 * N), col = new Float32Array(3 * N);
    var nx = 7, ny = 7, nz = 3, atoms = [];
    var a1 = [A_LAT, 0], a2 = [-A_LAT / 2, A_LAT * Math.sqrt(3) / 2];
    var basis = [[1 / 3, 2 / 3, 0, 0], [2 / 3, 1 / 3, 0.5, 0], [1 / 3, 2 / 3, U_WZ, 1], [2 / 3, 1 / 3, 0.5 + U_WZ, 1]]; // f1, f2, f3, kind (0 Zn, 1 O)
    for (var i = 0; i < nx; i++) for (var j = 0; j < ny; j++) for (var k = 0; k < nz; k++) basis.forEach(function (b) {
      var f1 = i + b[0], f2 = j + b[1], f3 = k + b[2];
      atoms.push([f1 * a1[0] + f2 * a2[0], f3 * C_LAT, f1 * a1[1] + f2 * a2[1], b[3]]); // crystal c axis is "up" (y)
    });
    var cx = 0, cy = 0, cz = 0; atoms.forEach(function (p) { cx += p[0]; cy += p[1]; cz += p[2]; }); cx /= atoms.length; cy /= atoms.length; cz /= atoms.length;
    var scale = 6.2 / (nx * A_LAT);
    var per = Math.floor(N / atoms.length), idx = 0;
    for (var m = 0; m < atoms.length && idx < N; m++) {
      var p = atoms[m], kind = p[3], R = (kind === 0 ? 0.42 : 0.5) * scale, cnt = m === atoms.length - 1 ? N - idx : per;
      for (var q = 0; q < cnt && idx < N; q++, idx++) {
        var r = R * Math.cbrt(rnd()), th = rnd() * 6.2832, ph = Math.acos(2 * rnd() - 1);
        pos[3 * idx] = (p[0] - cx) * scale + r * Math.sin(ph) * Math.cos(th);
        pos[3 * idx + 1] = (p[1] - cy) * scale + r * Math.cos(ph);
        pos[3 * idx + 2] = (p[2] - cz) * scale + r * Math.sin(ph) * Math.sin(th);
        fill(col, kind === 0 ? INK : GRAY, idx);
      }
    }
    return { pos: pos, col: col };
  }

  function shapeFilm() {
    var pos = new Float32Array(3 * N), col = new Float32Array(3 * N);
    var W = 6.4, D = 2.0, H = 3.0, SUB = 0.8, y0 = -(H + SUB) / 2 + SUB;
    var nSub = Math.floor(N * 0.12), nAl = Math.floor(N * 0.34), planes = Math.round(CYCLES / (RATIO + 1));
    var i = 0;
    for (; i < nSub; i++) { pos[3 * i] = (rnd() - .5) * W; pos[3 * i + 1] = y0 - rnd() * SUB; pos[3 * i + 2] = (rnd() - .5) * D; fill(col, LIGHT, i); }
    for (; i < nSub + nAl; i++) { var m = 1 + Math.floor(rnd() * planes); pos[3 * i] = (rnd() - .5) * W; pos[3 * i + 1] = y0 + (m * (RATIO + 1) / CYCLES) * H; pos[3 * i + 2] = (rnd() - .5) * D; fill(col, BLUE, i); }
    for (; i < N; i++) { pos[3 * i] = (rnd() - .5) * W; pos[3 * i + 1] = y0 + rnd() * H; pos[3 * i + 2] = (rnd() - .5) * D; fill(col, GRAY, i); }
    return { pos: pos, col: col };
  }

  // Points along a curve given as [x,y] in scene units, with a tube radius and a z offset.
  function curvePoints(pos, col, start, count, fn, radius, z, color) {
    for (var i = 0; i < count; i++) {
      var s = (i + rnd()) / count, xy = fn(s), th = rnd() * 6.2832, r = radius * Math.sqrt(rnd());
      var k = start + i;
      pos[3 * k] = xy[0] + r * Math.cos(th); pos[3 * k + 1] = xy[1] + r * Math.sin(th); pos[3 * k + 2] = z + (rnd() - .5) * radius * 2;
      fill(col, color, k);
    }
  }
  function axes(pos, col, start, count) {
    for (var i = 0; i < count; i++) { var k = start + i, t = rnd(); if (i % 2) { pos[3 * k] = -3.2 + t * 6.4; pos[3 * k + 1] = -1.8; } else { pos[3 * k] = -3.2; pos[3 * k + 1] = -1.8 + t * 3.6; } pos[3 * k + 2] = (rnd() - .5) * 0.06; fill(col, LIGHT, k); }
  }

  function shapeIV() {
    var pos = new Float32Array(3 * N), col = new Float32Array(3 * N);
    var nAx = Math.floor(N * 0.08), nCurve = Math.floor((N - nAx) / 2);
    var fx = function (v) { return v / 0.65 * 6.4 - 3.2; }, fy = function (a) { return a / I_MAX * 3.6 - 1.8; };
    var diode = function (s) { var a = I_MIN + s * (I_MAX - I_MIN); return [fx(VFWD + RON * a), fy(a)]; };
    var mos = function (s) { var a = I_MIN + s * (I_MAX - I_MIN); return [fx(RDS * a), fy(a)]; };
    axes(pos, col, 0, nAx);
    curvePoints(pos, col, nAx, nCurve, diode, 0.11, 0.9, BLUE);
    curvePoints(pos, col, nAx + nCurve, N - nAx - nCurve, mos, 0.11, -0.9, INK);
    return { pos: pos, col: col };
  }

  function shapeTIA() {
    var pos = new Float32Array(3 * N), col = new Float32Array(3 * N);
    var nAx = Math.floor(N * 0.08), nMark = Math.floor(N * 0.05), nRib = N - nAx - nMark;
    var fx = function (lg) { return (lg - 6) / 4 * 6.4 - 3.2; }, fy = function (db) { return (db - 70) / 50 * 3.6 - 1.8; };
    var gain = function (lg) { var f = Math.pow(10, lg); return TIA_GAIN - 10 * Math.log10(1 + (f / TIA_FC) * (f / TIA_FC)); };
    axes(pos, col, 0, nAx);
    for (var i = 0; i < nRib; i++) { var k = nAx + i, lg = 6 + rnd() * 4; pos[3 * k] = fx(lg) + (rnd() - .5) * 0.05; pos[3 * k + 1] = fy(gain(lg)) + (rnd() - .5) * 0.12; pos[3 * k + 2] = (rnd() - .5) * 1.2; fill(col, INK, k); }
    var lgc = Math.log10(TIA_FC), mx = fx(lgc), my = fy(gain(lgc));
    for (var j = 0; j < nMark; j++) { var kk = nAx + nRib + j, r = 0.22 * Math.cbrt(rnd()), th = rnd() * 6.2832, ph = Math.acos(2 * rnd() - 1); pos[3 * kk] = mx + r * Math.sin(ph) * Math.cos(th); pos[3 * kk + 1] = my + r * Math.cos(ph); pos[3 * kk + 2] = r * Math.sin(ph) * Math.sin(th); fill(col, BLUE, kk); }
    return { pos: pos, col: col };
  }

  function shapeTauc(series) {
    var pos = new Float32Array(3 * N), col = new Float32Array(3 * N);
    var nAx = Math.floor(N * 0.08), per = Math.floor((N - nAx) / series.length);
    var xmin = Infinity, xmax = -Infinity, ymax = 0;
    series.forEach(function (s) { s.rows.forEach(function (r) { xmin = Math.min(xmin, r[0]); xmax = Math.max(xmax, r[0]); ymax = Math.max(ymax, r[1]); }); });
    axes(pos, col, 0, nAx);
    var shades = [BLUE2, [0.35, 0.47, 0.84], [0.25, 0.38, 0.8], BLUE, [0.07, 0.19, 0.5]];
    series.forEach(function (s, si) {
      var rows = s.rows, z = -1.6 + (si / Math.max(1, series.length - 1)) * 3.2;
      var fn = function (t) { var i = Math.min(rows.length - 2, Math.floor(t * (rows.length - 1))), f = t * (rows.length - 1) - i, a = rows[i], b = rows[i + 1]; var x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f; return [(x - xmin) / (xmax - xmin) * 6.4 - 3.2, y / ymax * 3.6 - 1.8]; };
      var start = nAx + si * per, count = si === series.length - 1 ? N - start : per;
      curvePoints(pos, col, start, count, fn, 0.09, z, shades[Math.round(si * 4 / Math.max(1, series.length - 1))]);
    });
    return { pos: pos, col: col };
  }

  // Tauc data, if present (same files and parsing as the hero figure).
  function loadTauc() {
    var files = JSON.parse(hero.getAttribute("data-tauc-files") || "[]");
    if (!files.length) return Promise.resolve(null);
    function ratioOf(url) { var m = /tauc[_-]?(\d+)\D+(\d+)/i.exec(url.split("/").pop()); return m ? +m[1] : 0; }
    return Promise.all(files.map(function (u) { return fetch(u).then(function (r) { return r.text(); }).then(function (t) {
      var lines = t.split(/\r?\n/).filter(function (l) { return l.trim(); }), rows = [];
      for (var i = 0; i < lines.length; i++) { var c = lines[i].split(/[,;\t]/), x = parseFloat(c[0]), y = parseFloat(c[1]); if (isFinite(x) && isFinite(y)) rows.push([x, y]); }
      rows.sort(function (a, b) { return a[0] - b[0]; }); return { zn: ratioOf(u), rows: rows }; }); }))
      .then(function (s) { s = s.filter(function (x) { return x.rows.length > 2; }); s.sort(function (a, b) { return b.zn - a.zn; }); return s.length ? s : null; })
      .catch(function () { return null; });
  }

  var VERT = [
    "attribute vec3 pA; attribute vec3 pB; attribute vec3 cA; attribute vec3 cB; attribute vec3 sc; attribute float rnd;",
    "uniform float uT; uniform float uIntro; uniform float uSize; uniform float uScale; varying vec3 vCol;",
    "void main(){",
    "  float tt = smoothstep(0.0, 1.0, clamp((uT - rnd * 0.35) / 0.65, 0.0, 1.0));",
    "  vec3 p = mix(pA, pB, tt); vCol = mix(cA, cB, tt);",
    "  float ti = smoothstep(0.0, 1.0, clamp((uIntro - rnd * 0.4) / 0.6, 0.0, 1.0));",
    "  p = mix(sc, p, ti);",
    "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
    "  gl_PointSize = max(1.0, uSize * uScale / -mv.z);",
    "  gl_Position = projectionMatrix * mv;",
    "}"].join("\n");
  var FRAG = [
    "varying vec3 vCol; uniform float uAlpha;",
    "void main(){ vec2 d = gl_PointCoord - 0.5; float r2 = dot(d, d); if (r2 > 0.25) discard;",
    "  float a = uAlpha * (1.0 - smoothstep(0.12, 0.25, r2)); gl_FragColor = vec4(vCol, a); }"].join("\n");

  Promise.all([import("three"), loadTauc()]).then(function (res) {
    var THREE = res[0], tauc = res[1];
    var shapes = [
      { key: "lattice", build: shapeLattice, cam: [0.62, 0.26, 9.2] },
      { key: "film", build: shapeFilm, cam: [0.32, 0.05, 9.2] }   // nearly edge-on, so the Al planes read as lines
    ];
    if (tauc) shapes.push({ key: "tauc", build: function () { return shapeTauc(tauc); }, cam: [0.35, 0.22, 9.0] });
    shapes.push({ key: "iv", build: shapeIV, cam: [0.18, 0.14, 9.2] });
    shapes.push({ key: "tia", build: shapeTIA, cam: [-0.12, 0.18, 9.2] });
    var S = shapes.length;
    shapes.forEach(function (s) { var g = s.build(); s.pos = g.pos; s.col = g.col; });

    // Panel entries and the DOM
    var panels = Array.prototype.slice.call(hero.querySelectorAll(".cloud-item"));
    var byKey = {}; panels.forEach(function (p) { byKey[p.getAttribute("data-key")] = p; });
    var active = shapes.map(function (s) { return byKey[s.key]; });
    var stepEl = hero.querySelector(".cloud-step");
    hero.classList.add("has-cloud");
    hero.style.setProperty("--shapes", S);
    var box = hero.querySelector(".hero-visual"), canvas = hero.querySelector(".cloud-canvas");
    var track = hero.querySelector(".hero-track"), pin = hero.querySelector(".hero-pin");

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

    var geo = new THREE.BufferGeometry();
    var pA = new THREE.BufferAttribute(new Float32Array(shapes[0].pos), 3), pB = new THREE.BufferAttribute(new Float32Array(shapes[Math.min(1, S - 1)].pos), 3);
    var cA = new THREE.BufferAttribute(new Float32Array(shapes[0].col), 3), cB = new THREE.BufferAttribute(new Float32Array(shapes[Math.min(1, S - 1)].col), 3);
    var scat = new Float32Array(3 * N), rn = new Float32Array(N);
    for (var i = 0; i < N; i++) { var r = 4 + rnd() * 5, th = rnd() * 6.2832, ph = Math.acos(2 * rnd() - 1); scat[3 * i] = r * Math.sin(ph) * Math.cos(th); scat[3 * i + 1] = r * Math.cos(ph) * 0.6; scat[3 * i + 2] = r * Math.sin(ph) * Math.sin(th); rn[i] = rnd(); }
    geo.setAttribute("pA", pA); geo.setAttribute("pB", pB); geo.setAttribute("cA", cA); geo.setAttribute("cB", cB);
    geo.setAttribute("sc", new THREE.BufferAttribute(scat, 3)); geo.setAttribute("rnd", new THREE.BufferAttribute(rn, 1));
    geo.setAttribute("position", pA); // bounding sphere
    var mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, uniforms: { uT: { value: 0 }, uIntro: { value: 0 }, uSize: { value: 0.026 }, uScale: { value: 900 }, uAlpha: { value: 0.82 } } });
    scene.add(new THREE.Points(geo, mat));

    var curSeg = -1;
    function setSegment(seg) {
      if (seg === curSeg) return; curSeg = seg;
      var a = shapes[seg], b = shapes[Math.min(S - 1, seg + 1)];
      pA.array.set(a.pos); pB.array.set(b.pos); cA.array.set(a.col); cB.array.set(b.col);
      pA.needsUpdate = pB.needsUpdate = cA.needsUpdate = cB.needsUpdate = true;
    }
    setSegment(0);

    function size() {
      var w = box.clientWidth, h = box.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      // Point size in device pixels = uSize (world units) * uScale / distance; uScale is the
      // perspective factor for the canvas height, so a point is about 2.8 css px at the cloud's distance.
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      mat.uniforms.uScale.value = (h * dpr) / (2 * Math.tan(camera.fov * Math.PI / 360));
    }
    size();

    // Scroll scrub: the target follows scrollY, the shown value eases toward it.
    var top = 0, span = 1, navH = 60;
    function measure() { var n = document.querySelector(".nav"); navH = n ? n.offsetHeight : 60; top = track.getBoundingClientRect().top + window.scrollY - navH; span = Math.max(1, track.offsetHeight - pin.offsetHeight); }
    measure();
    var target = 0, shown = 0, intro = 0, t0 = 0, visible = true, raf = 0, curPanel = -1;
    function ease(x) { return x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x); }
    function fmt(v, dec) { return v.toFixed(dec); }

    function frame(now) {
      raf = 0;
      if (!t0) t0 = now;
      if (intro < 1) intro = Math.min(1, (now - t0) / 1500);
      target = Math.min(1, Math.max(0, (window.scrollY - top) / span));
      shown += (target - shown) * 0.11;
      var u = shown * (S - 1), seg = Math.min(S - 2, Math.floor(u)), t = u - seg;
      if (S === 1) { seg = 0; t = 0; }
      setSegment(seg);
      var tt = ease((t - 0.2) / 0.6);
      mat.uniforms.uT.value = tt;
      mat.uniforms.uIntro.value = 1 - Math.pow(1 - intro, 3);
      // Camera between the two shapes' viewpoints, with a slow drift.
      var ca = shapes[seg].cam, cb = shapes[Math.min(S - 1, seg + 1)].cam;
      var az = ca[0] + (cb[0] - ca[0]) * tt + Math.sin(now * 0.00018) * 0.06, el = ca[1] + (cb[1] - ca[1]) * tt, d = ca[2] + (cb[2] - ca[2]) * tt;
      camera.position.set(Math.sin(az) * Math.cos(el) * d, Math.sin(el) * d, Math.cos(az) * Math.cos(el) * d);
      camera.lookAt(0, -0.75, 0);   // shapes sit in the upper part of the canvas, clear of the panel
      renderer.render(scene, camera);
      // Panel: the nearer shape. Its number counts up as the shape comes into focus and then holds.
      var k = Math.round(u), f = ease(1 - Math.min(1, Math.max(0, k - u) / 0.5));
      if (k !== curPanel) { curPanel = k; active.forEach(function (p, i) { if (p) p.classList.toggle("is-on", i === k); }); if (stepEl) stepEl.textContent = (k + 1) + " of " + S; }
      var p = active[k];
      if (p) { var num = p.querySelector("[data-value]"); if (num) { var v = parseFloat(num.getAttribute("data-value")), dec = parseInt(num.getAttribute("data-dec"), 10) || 0; num.textContent = (num.getAttribute("data-prefix") || "") + fmt(v * f, dec) + (num.getAttribute("data-suffix") || ""); } }
      if (visible && (intro < 1 || Math.abs(target - shown) > 0.0005 || true)) raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf) raf = requestAnimationFrame(frame); }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) start(); }, { threshold: 0 }).observe(hero);
    document.addEventListener("visibilitychange", function () { if (!document.hidden && visible) start(); });
    window.addEventListener("resize", function () { size(); measure(); start(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    window.addEventListener("load", measure);
    start();
  }).catch(function (e) { hero.classList.remove("has-cloud"); if (window.console) console.warn("cloud off:", e && e.message); });
})();
