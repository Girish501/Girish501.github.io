// Hero point cloud. One cloud of points morphs through shapes built from the site's own numbers as
// the pinned hero is scrolled: a ball-and-stick chunk of the wurtzite ZnO lattice (a, c from XRD),
// a cross-section of the 600-cycle AZO film with its Al planes on the substrate, the fitted diode
// and MOSFET I-V lines, the TIA gain curve, and the Tauc curves once data/azo/tauc_*.csv exist.
// three.js draws the points; the scroll scrub is this file's own (progress read from scrollY each
// frame and eased toward, no scroll library). The small labels (.cloud-tag) are HTML, moved each
// frame to the projected position of a point in the shape they belong to.
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
  var COV = Math.sqrt(42000 / N);                        // sparser clouds get larger points, so faces and spheres still fill

  // Seeded random so the cloud is the same on every visit.
  var seed = 7;
  function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }

  var INK = [0.09, 0.094, 0.102], SLATE = [0.3, 0.32, 0.36], GRAY = [0.6, 0.62, 0.65], LIGHT = [0.78, 0.77, 0.73], BLUE = [0.12, 0.29, 0.79];
  function shade(c, k) { return [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k)]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

  // A shape is a list of parts. Each part takes a share of the N points (its weight) and emits one
  // point at a time as [x, y, z, color, size]. Shapes sit in a box about 6 wide, 3.6 tall, 3.6 deep.
  function build(parts, tags) {
    var pos = new Float32Array(3 * N), col = new Float32Array(3 * N), siz = new Float32Array(N), wsum = 0, idx = 0;
    parts.forEach(function (p) { wsum += p.w; });
    parts.forEach(function (p, pi) {
      var cnt = pi === parts.length - 1 ? Math.max(0, N - idx) : Math.min(N - idx, Math.round(N * p.w / wsum));
      for (var i = 0; i < cnt; i++, idx++) {
        var r = p.emit(i, cnt);
        pos[3 * idx] = r[0]; pos[3 * idx + 1] = r[1]; pos[3 * idx + 2] = r[2];
        col[3 * idx] = r[3][0]; col[3 * idx + 1] = r[3][1]; col[3 * idx + 2] = r[3][2];
        siz[idx] = r[4] || 1;
      }
    });
    return { pos: pos, col: col, siz: siz, tags: tags || {} };
  }
  var LIGHT_DIR = norm([-0.35, 0.8, 0.5]);
  // A shaded sphere. Points cover the side facing the view direction V evenly (a Fibonacci spiral
  // around V, down to 0.3 past the rim), so the sphere looks solid with few points.
  var GOLD = Math.PI * (3 - Math.sqrt(5));
  function ball(c, R, color, V, size) {
    var e1 = norm(cross(V, Math.abs(V[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0])), e2 = norm(cross(V, e1));
    return function (i, cnt) {
      var z = 1 - 1.3 * (i + 0.5 + 0.3 * (rnd() - 0.5)) / cnt, s = Math.sqrt(Math.max(0, 1 - z * z)), th = i * GOLD + rnd() * 0.3;
      var n = [V[0] * z + e1[0] * s * Math.cos(th) + e2[0] * s * Math.sin(th), V[1] * z + e1[1] * s * Math.cos(th) + e2[1] * s * Math.sin(th), V[2] * z + e1[2] * s * Math.cos(th) + e2[2] * s * Math.sin(th)];
      return [c[0] + R * n[0], c[1] + R * n[1], c[2] + R * n[2], shade(color, 0.55 + 0.5 * Math.max(0, dot(n, LIGHT_DIR))), size];
    };
  }
  // A thin rod from a to b (the part of it between t0 and t1).
  function rod(a, b, r, color, size, t0, t1) {
    var d = sub(b, a), len = Math.hypot(d[0], d[1], d[2]);
    var u = norm(cross(d, Math.abs(d[1]) > 0.9 * len ? [1, 0, 0] : [0, 1, 0])), v = norm(cross(d, u));
    t0 = t0 || 0; t1 = t1 === undefined ? 1 : t1;
    return function () {
      var t = t0 + (t1 - t0) * rnd(), th = rnd() * 6.2832, q = r * Math.sqrt(rnd()), cu = Math.cos(th) * q, sv = Math.sin(th) * q;
      return [a[0] + d[0] * t + u[0] * cu + v[0] * sv, a[1] + d[1] * t + u[1] * cu + v[1] * sv, a[2] + d[2] * t + u[2] * cu + v[2] * sv, color, size];
    };
  }
  // A flat face from corner o along edges e1 and e2, filled on a jittered grid so it reads as a
  // surface; colorAt(s, t) colors the point.
  function face(o, e1, e2, colorAt, size) {
    var l1 = Math.hypot(e1[0], e1[1], e1[2]), l2 = Math.hypot(e2[0], e2[1], e2[2]);
    return function (i, cnt) {
      var n1 = Math.max(1, Math.round(Math.sqrt(cnt * l1 / l2))), n2 = Math.ceil(cnt / n1);
      var s = ((i % n1) + 0.5 + 0.6 * (rnd() - 0.5)) / n1, t = (Math.floor(i / n1) + 0.5 + 0.6 * (rnd() - 0.5)) / n2;
      return [o[0] + e1[0] * s + e2[0] * t, o[1] + e1[1] * s + e2[1] * t, o[2] + e1[2] * s + e2[2] * t, colorAt(s, t), size];
    };
  }
  function viewDir(cam) { return [Math.sin(cam[0]) * Math.cos(cam[1]), Math.sin(cam[1]), Math.cos(cam[0]) * Math.cos(cam[1])]; }

  // Wurtzite ZnO, ball and stick: the hexagonal unit cell. A prism one lattice constant a on each
  // edge and c tall, Zn at the corners, the face centres and three sites inside, each O a distance
  // u c above its Zn, bonds to the four neighbours, and dimension marks for a and c.
  var CAM_LATTICE = [0.55, 0.5, 9.6];
  function shapeLattice() {
    var SC = 0.45, RZN = 0.46 * SC, RO = 0.34 * SC, RB = 0.09 * SC, YC = 0.2;  // scene units per Å, atom and bond radii, centre height
    var V = viewDir(CAM_LATTICE), az = CAM_LATTICE[0];
    var a1 = [A_LAT, 0], a2 = [-A_LAT / 2, A_LAT * Math.sqrt(3) / 2];
    var at = function (f1, f2) { return [f1 * a1[0] + f2 * a2[0], f1 * a1[1] + f2 * a2[1]]; };
    var ctr = at(1 / 3, 2 / 3), atoms = [], corners = [];
    [[0, 0], [1, 0], [1, 1], [0, 1], [-1, 0], [-1, -1], [0, -1]].forEach(function (ij, n) {   // the centre column and the six corner columns
      var q = at(1 / 3 + ij[0], 2 / 3 + ij[1]), X = q[0] - ctr[0], Z = q[1] - ctr[1];
      if (n) corners.push([X, Z]);
      atoms.push([X, 0, Z, 0]); atoms.push([X, C_LAT, Z, 0]); atoms.push([X, U_WZ * C_LAT, Z, 1]);
    });
    [[0, 0], [-1, 0], [0, 1]].forEach(function (ij) {                                          // the three columns inside the prism
      var q = at(2 / 3 + ij[0], 1 / 3 + ij[1]), X = q[0] - ctr[0], Z = q[1] - ctr[1];
      atoms.push([X, 0.5 * C_LAT, Z, 0]); atoms.push([X, (0.5 + U_WZ) * C_LAT, Z, 1]);
    });
    corners.sort(function (p, q) { return Math.atan2(p[1], p[0]) - Math.atan2(q[1], q[0]); });
    var cy = 0.5 * C_LAT, P = atoms.map(function (p) { return [p[0] * SC, (p[1] - cy) * SC + YC, p[2] * SC, p[3]]; });
    var parts = [], y0 = -cy * SC + YC, y1 = y0 + C_LAT * SC;
    P.forEach(function (p) { parts.push({ w: p[3] ? 0.7 : 1, emit: ball(p, p[3] ? RO : RZN, p[3] ? BLUE : SLATE, V, 1.3 * COV) }); });
    P.forEach(function (p) {
      if (p[3]) return;
      P.forEach(function (q) { if (!q[3]) return; var d = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]); if (d < 2.1 * SC) parts.push({ w: 0.3, emit: rod(p, q, RB, GRAY, COV, RZN / d, 1 - RO / d) }); });
    });
    // Prism edges: thin ink lines through the corner atoms.
    var R = 0.01;
    corners.forEach(function (c, n) {
      var d = corners[(n + 1) % 6], a = [c[0] * SC, 0, c[1] * SC], b = [d[0] * SC, 0, d[1] * SC];
      parts.push({ w: 0.3, emit: rod([a[0], y0, a[2]], [b[0], y0, b[2]], R, INK, 0.9 * COV) });
      parts.push({ w: 0.3, emit: rod([a[0], y1, a[2]], [b[0], y1, b[2]], R, INK, 0.9 * COV) });
      parts.push({ w: 0.45, emit: rod([a[0], y0, a[2]], [a[0], y1, a[2]], R, INK, 0.9 * COV) });
    });
    // Dimension marks: a along the front bottom edge, c beside the right vertical edge.
    var front = function (c) { return c[0] * Math.sin(az) + c[1] * Math.cos(az); }, sx = function (c) { return c[0] * Math.cos(az) - c[1] * Math.sin(az); };
    var fi = 0, best = -1e9; corners.forEach(function (c, n) { var d = corners[(n + 1) % 6], f = front(c) + front(d); if (f > best) { best = f; fi = n; } });
    var A = corners[fi], B = corners[(fi + 1) % 6], TK = 0.4 * SC, ya = y0 - 1.0 * SC;
    var pa = [A[0] * SC, ya, A[1] * SC], pb = [B[0] * SC, ya, B[1] * SC];
    parts.push({ w: 0.9, emit: rod(pa, pb, R, INK, 0.9 * COV) });
    parts.push({ w: 0.15, emit: rod([pa[0], ya - TK / 2, pa[2]], [pa[0], ya + TK / 2, pa[2]], R, INK, 0.9 * COV) });
    parts.push({ w: 0.15, emit: rod([pb[0], ya - TK / 2, pb[2]], [pb[0], ya + TK / 2, pb[2]], R, INK, 0.9 * COV) });
    var ri = 0; best = -1e9; corners.forEach(function (c, n) { var v = sx(c) + 0.3 * front(c); if (v > best) { best = v; ri = n; } });
    var Cc = corners[ri], xc = Cc[0] * SC + 1.1 * SC, zc = Cc[1] * SC;
    parts.push({ w: 1.2, emit: rod([xc, y0, zc], [xc, y1, zc], R, INK, 0.9 * COV) });
    parts.push({ w: 0.15, emit: rod([xc - TK / 2, y0, zc], [xc + TK / 2, y0, zc], R, INK, 0.9 * COV) });
    parts.push({ w: 0.15, emit: rod([xc - TK / 2, y1, zc], [xc + TK / 2, y1, zc], R, INK, 0.9 * COV) });
    var li = 0; best = 1e9; corners.forEach(function (c, n) { if (sx(c) < best) { best = sx(c); li = n; } });
    var Lc = corners[li], Os = P.filter(function (p) { return p[3]; }), leftO = Os[0]; best = 1e9;
    Os.forEach(function (p) { var v = sx([p[0], p[2]]); if (v < best) { best = v; leftO = p; } });
    var tags = {
      a: { p: [(pa[0] + pb[0]) / 2, ya, (pa[2] + pb[2]) / 2], dy: 13 },
      c: { p: [xc, (y0 + y1) / 2, zc], dx: 10 },
      zn: { p: [Lc[0] * SC - RZN, y1, Lc[1] * SC], dx: -7 },
      o: { p: [leftO[0] - RO, leftO[1], leftO[2]], dx: -7 }
    };
    return build(parts, tags);
  }

  // The AZO film in cross-section: a block of film on its substrate, a blue plane per Al cycle,
  // a thickness bracket on the left and labelled leaders on the right.
  var CAM_FILM = [0.5, 0.3, 10];
  function shapeFilm() {
    var W = 3.1, D = 2.0, H = 2.4, SUB = 0.9, X0 = 0.05, y0 = -0.9, zf = D / 2, FS = 1.25 * COV;
    var xl = X0 - W / 2, xr = X0 + W / 2, yt = y0 + H, yb = y0 - SUB, planes = Math.round(CYCLES / (RATIO + 1));
    var grain = function (s) { return 0.86 + 0.12 * Math.sin(s * 57) + 0.07 * Math.sin(s * 131 + 1); }; // columnar grains across the cut
    var parts = [];
    parts.push({ w: 3.2, emit: face([xl, yb, zf], [W, 0, 0], [0, SUB, 0], function () { return LIGHT; }, FS) });
    parts.push({ w: 1.6, emit: face([xr, yb, zf], [0, 0, -D], [0, SUB, 0], function () { return shade(LIGHT, 0.88); }, FS) });
    parts.push({ w: 8.0, emit: face([xl, y0, zf], [W, 0, 0], [0, H, 0], function (s) { return shade(GRAY, grain(s)); }, FS) });
    parts.push({ w: 4.4, emit: face([xr, y0, zf], [0, 0, -D], [0, H, 0], function (s) { return shade(GRAY, 0.8 * grain(s + 2)); }, FS) });
    parts.push({ w: 4.0, emit: face([xl, yt, zf], [W, 0, 0], [0, 0, -D], function () { return shade(LIGHT, 1.03); }, FS) });
    var yAl = function (m) { return y0 + m * (RATIO + 1) / CYCLES * H; };
    for (var m = 1; m <= planes; m++) {
      parts.push({ w: 0.2, emit: rod([xl, yAl(m), zf + 0.012], [xr, yAl(m), zf + 0.012], 0.008, BLUE, 0.9 * COV) });
      parts.push({ w: 0.09, emit: rod([xr + 0.012, yAl(m), zf], [xr + 0.012, yAl(m), -zf], 0.008, BLUE, 0.9 * COV) });
    }
    var E = function (a, b, w, color) { parts.push({ w: w || 0.1, emit: rod(a, b, 0.008, color || INK, 0.9 * COV) }); };
    E([xl, y0, zf], [xr, y0, zf]); E([xl, yt, zf], [xr, yt, zf]); E([xl, y0, zf], [xl, yt, zf]); E([xr, y0, zf], [xr, yt, zf]);
    E([xr, y0, zf], [xr, y0, -zf]); E([xr, yt, zf], [xr, yt, -zf]); E([xr, y0, -zf], [xr, yt, -zf]); E([xl, yt, -zf], [xr, yt, -zf]); E([xl, yt, zf], [xl, yt, -zf]);
    E([xl, yb, zf], [xr, yb, zf]); E([xl, yb, zf], [xl, y0, zf]); E([xr, yb, zf], [xr, y0, zf]); E([xr, yb, zf], [xr, yb, -zf]); E([xr, yb, -zf], [xr, y0, -zf]);
    var bx = xl - 0.42;
    E([bx, y0, zf], [bx, yt, zf], 0.3); E([bx - 0.1, y0, zf], [bx + 0.1, y0, zf], 0.05); E([bx - 0.1, yt, zf], [bx + 0.1, yt, zf], 0.05);
    E([xl - 0.06, y0, zf], [bx - 0.14, y0, zf], 0.06); E([xl - 0.06, yt, zf], [bx - 0.14, yt, zf], 0.06);
    var lead = function (y, color) { E([xr, y, 0], [xr + 0.42, y, 0], 0.07, color); return [xr + 0.42, y, 0]; };
    var tags = {
      thickness: { p: [bx, yt, zf], dy: -13 },
      film: { p: lead(y0 + 0.74 * H, INK), dx: 8 },
      al: { p: lead(yAl(11), BLUE), dx: 8 },
      substrate: { p: lead(yb + 0.5 * SUB, INK), dx: 8 }
    };
    return build(parts, tags);
  }

  // Points along a curve given as [x,y] in scene units, with a tube radius and a z offset.
  function curve(fn, radius, z, color) {
    return function () { var s = rnd(), xy = fn(s), th = rnd() * 6.2832, r = radius * Math.sqrt(rnd()); return [xy[0] + r * Math.cos(th), xy[1] + r * Math.sin(th), z + (rnd() - .5) * radius * 2, color, 1]; };
  }
  var axes = [{ w: 0.04, emit: rod([-3.2, -1.8, 0], [3.2, -1.8, 0], 0.03, LIGHT, 1) }, { w: 0.04, emit: rod([-3.2, -1.8, 0], [-3.2, 1.8, 0], 0.03, LIGHT, 1) }];

  function shapeIV() {
    var fx = function (v) { return v / 0.65 * 6.4 - 3.2; }, fy = function (a) { return a / I_MAX * 3.6 - 1.8; };
    var diode = function (s) { var a = I_MIN + s * (I_MAX - I_MIN); return [fx(VFWD + RON * a), fy(a)]; };
    var mos = function (s) { var a = I_MIN + s * (I_MAX - I_MIN); return [fx(RDS * a), fy(a)]; };
    return build(axes.concat([{ w: 0.46, emit: curve(diode, 0.11, 0.9, BLUE) }, { w: 0.46, emit: curve(mos, 0.11, -0.9, INK) }]));
  }

  function shapeTIA() {
    var fx = function (lg) { return (lg - 6) / 4 * 6.4 - 3.2; }, fy = function (db) { return (db - 70) / 50 * 3.6 - 1.8; };
    var gain = function (lg) { var f = Math.pow(10, lg); return TIA_GAIN - 10 * Math.log10(1 + (f / TIA_FC) * (f / TIA_FC)); };
    var ribbon = function (s) { var lg = 6 + s * 4; return [fx(lg), fy(gain(lg))]; };
    var fc = [fx(Math.log10(TIA_FC)), fy(gain(Math.log10(TIA_FC)))];
    var marker = function () { var th = rnd() * 6.2832, r = 0.26 * Math.sqrt(rnd()); return [fc[0] + r * Math.cos(th), fc[1] + r * Math.sin(th), 0.2, BLUE, 1]; };
    return build(axes.concat([{ w: 0.8, emit: curve(ribbon, 0.12, 0, INK) }, { w: 0.12, emit: marker }]));
  }

  function shapeTauc(series) {
    var xmin = 1e9, xmax = -1e9, ymax = 0;
    series.forEach(function (s) { s.rows.forEach(function (r) { xmin = Math.min(xmin, r[0]); xmax = Math.max(xmax, r[0]); ymax = Math.max(ymax, r[1]); }); });
    var parts = axes.slice();
    series.forEach(function (s, si) {
      var rows = s.rows;
      var fn = function (t) { var i = Math.min(rows.length - 2, Math.floor(t * (rows.length - 1))), f = t * (rows.length - 1) - i, a = rows[i], b = rows[i + 1]; var x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f; return [(x - xmin) / (xmax - xmin) * 6.4 - 3.2, y / ymax * 3.6 - 1.8]; };
      var k = series.length > 1 ? si / (series.length - 1) : 0;
      parts.push({ w: 0.92 / series.length, emit: curve(fn, 0.07, (k - 0.5) * 1.6, shade(BLUE, 0.6 + 0.9 * (1 - k))) });
    });
    return build(parts);
  }

  function loadTauc() {
    var attr = hero.getAttribute("data-tauc-files"), files = [];
    try { files = JSON.parse(attr || "[]"); } catch (e) { files = []; }
    if (!files.length) return Promise.resolve(null);
    function ratioOf(url) { var m = /tauc[_-]?(\d+)\D+(\d+)/i.exec(url.split("/").pop()); return m ? +m[1] : 0; }
    return Promise.all(files.map(function (u) { return fetch(u).then(function (r) { return r.text(); }).then(function (t) {
      var lines = t.split(/\r?\n/).filter(function (l) { return l.trim(); }), rows = [];
      lines.forEach(function (l) { var c = l.split(/[,;\t]/).map(parseFloat); if (c.length >= 2 && isFinite(c[0]) && isFinite(c[1])) rows.push([c[0], c[1]]); });
      rows.sort(function (a, b) { return a[0] - b[0]; }); return { zn: ratioOf(u), rows: rows }; }); }))
      .then(function (s) { s = s.filter(function (x) { return x.rows.length > 2; }); s.sort(function (a, b) { return b.zn - a.zn; }); return s.length ? s : null; })
      .catch(function () { return null; });
  }

  var VERT = [
    "attribute vec3 pA; attribute vec3 pB; attribute vec3 cA; attribute vec3 cB; attribute float sA; attribute float sB; attribute vec3 sc; attribute float rnd;",
    "uniform float uT; uniform float uIntro; uniform float uSize; uniform float uScale; varying vec3 vCol;",
    "void main(){",
    "  float tt = smoothstep(0.0, 1.0, clamp((uT - rnd * 0.35) / 0.65, 0.0, 1.0));",
    "  vec3 p = mix(pA, pB, tt); vCol = mix(cA, cB, tt); float s = mix(sA, sB, tt);",
    "  float ti = smoothstep(0.0, 1.0, clamp((uIntro - rnd * 0.4) / 0.6, 0.0, 1.0));",
    "  p = mix(sc, p, ti);",
    "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
    "  gl_PointSize = max(1.0, uSize * s * uScale / -mv.z);",
    "  gl_Position = projectionMatrix * mv;",
    "}"].join("\n");
  // Points are round and opaque and write depth, so spheres and faces occlude each other properly.
  var FRAG = [
    "varying vec3 vCol;",
    "void main(){ vec2 d = gl_PointCoord - 0.5; if (dot(d, d) > 0.22) discard; gl_FragColor = vec4(vCol, 1.0); }"].join("\n");

  Promise.all([import("three"), loadTauc()]).then(function (res) {
    var THREE = res[0], tauc = res[1];
    var shapes = [
      { key: "lattice", build: shapeLattice, cam: CAM_LATTICE },
      { key: "film", build: shapeFilm, cam: CAM_FILM }
    ];
    if (tauc) shapes.push({ key: "tauc", build: function () { return shapeTauc(tauc); }, cam: [0.35, 0.22, 9.0] });
    shapes.push({ key: "iv", build: shapeIV, cam: [0.18, 0.14, 9.2] });
    shapes.push({ key: "tia", build: shapeTIA, cam: [-0.12, 0.18, 9.2] });
    var S = shapes.length;
    shapes.forEach(function (s) { var g = s.build(); s.pos = g.pos; s.col = g.col; s.siz = g.siz; s.tags = g.tags; });

    // Panel entries, labels and the DOM
    var panels = Array.prototype.slice.call(hero.querySelectorAll(".cloud-item"));
    var byKey = {}; panels.forEach(function (p) { byKey[p.getAttribute("data-key")] = p; });
    var active = shapes.map(function (s) { return byKey[s.key]; });
    var stepEl = hero.querySelector(".cloud-step");
    var tags = [];
    Array.prototype.forEach.call(hero.querySelectorAll(".cloud-tag"), function (el) {
      var si = -1; shapes.forEach(function (s, i) { if (s.key === el.getAttribute("data-key")) si = i; });
      var spec = si >= 0 && shapes[si].tags[el.getAttribute("data-at")];
      if (spec) tags.push({ el: el, shape: si, p: new THREE.Vector3(spec.p[0], spec.p[1], spec.p[2]), dx: spec.dx || 0, dy: spec.dy || 0, align: el.getAttribute("data-align") === "right" ? "-100%" : el.getAttribute("data-align") === "center" ? "-50%" : "0", on: false });
    });
    hero.classList.add("has-cloud");
    hero.style.setProperty("--shapes", S);
    var box = hero.querySelector(".hero-visual"), canvas = hero.querySelector(".cloud-canvas");
    var track = hero.querySelector(".hero-track"), pin = hero.querySelector(".hero-pin");

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

    var geo = new THREE.BufferGeometry(), b = Math.min(1, S - 1);
    var pA = new THREE.BufferAttribute(new Float32Array(shapes[0].pos), 3), pB = new THREE.BufferAttribute(new Float32Array(shapes[b].pos), 3);
    var cA = new THREE.BufferAttribute(new Float32Array(shapes[0].col), 3), cB = new THREE.BufferAttribute(new Float32Array(shapes[b].col), 3);
    var sA = new THREE.BufferAttribute(new Float32Array(shapes[0].siz), 1), sB = new THREE.BufferAttribute(new Float32Array(shapes[b].siz), 1);
    var scat = new Float32Array(3 * N), rn = new Float32Array(N);
    for (var i = 0; i < N; i++) { var r = 4 + rnd() * 5, th = rnd() * 6.2832, ph = Math.acos(2 * rnd() - 1); scat[3 * i] = r * Math.sin(ph) * Math.cos(th); scat[3 * i + 1] = r * Math.cos(ph) * 0.6; scat[3 * i + 2] = r * Math.sin(ph) * Math.sin(th); rn[i] = rnd(); }
    geo.setAttribute("pA", pA); geo.setAttribute("pB", pB); geo.setAttribute("cA", cA); geo.setAttribute("cB", cB); geo.setAttribute("sA", sA); geo.setAttribute("sB", sB);
    geo.setAttribute("sc", new THREE.BufferAttribute(scat, 3)); geo.setAttribute("rnd", new THREE.BufferAttribute(rn, 1));
    geo.setAttribute("position", pA); // bounding sphere
    var mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: { uT: { value: 0 }, uIntro: { value: 0 }, uSize: { value: 0.026 }, uScale: { value: 900 } } });
    scene.add(new THREE.Points(geo, mat));

    var curSeg = -1;
    function setSegment(seg) {
      if (seg === curSeg) return; curSeg = seg;
      var a = shapes[seg], b = shapes[Math.min(S - 1, seg + 1)];
      pA.array.set(a.pos); pB.array.set(b.pos); cA.array.set(a.col); cB.array.set(b.col); sA.array.set(a.siz); sB.array.set(b.siz);
      pA.needsUpdate = pB.needsUpdate = cA.needsUpdate = cB.needsUpdate = sA.needsUpdate = sB.needsUpdate = true;
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
    var target = 0, shown = 0, intro = 0, t0 = 0, visible = true, raf = 0, curPanel = -1, proj = new THREE.Vector3();
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
      var tt = ease((t - 0.2) / 0.6), wi = 1 - Math.pow(1 - intro, 3);
      mat.uniforms.uT.value = tt;
      mat.uniforms.uIntro.value = wi;
      // Camera between the two shapes' viewpoints, with a slow drift.
      var ca = shapes[seg].cam, cb = shapes[Math.min(S - 1, seg + 1)].cam;
      var az = ca[0] + (cb[0] - ca[0]) * tt + Math.sin(now * 0.00018) * 0.05, el = ca[1] + (cb[1] - ca[1]) * tt, d = (ca[2] + (cb[2] - ca[2]) * tt) * Math.max(1, 0.9 / camera.aspect); // step back on narrow canvases
      camera.position.set(Math.sin(az) * Math.cos(el) * d, Math.sin(el) * d, Math.cos(az) * Math.cos(el) * d);
      camera.lookAt(0, -0.75, 0);   // shapes sit in the upper part of the canvas, clear of the panel
      renderer.render(scene, camera);
      // Labels follow their anchor points; a shape's labels fade out as it dissolves and in as the next forms.
      var wA = (1 - ease(tt / 0.3)) * wi, wB = ease((tt - 0.7) / 0.3) * wi, cw = box.clientWidth, ch = box.clientHeight;
      for (var i = 0; i < tags.length; i++) {
        var g = tags[i], w = g.shape === seg ? wA : g.shape === seg + 1 ? wB : 0;
        if (w < 0.02) { if (g.on) { g.el.style.opacity = 0; g.on = false; } continue; }
        proj.copy(g.p).project(camera);
        g.el.style.transform = "translate(" + ((proj.x + 1) / 2 * cw + g.dx).toFixed(1) + "px," + ((1 - proj.y) / 2 * ch + g.dy).toFixed(1) + "px) translate(" + g.align + ",-50%)";
        g.el.style.opacity = w.toFixed(2); g.on = true;
      }
      // Panel: the nearer shape. Its number counts up as the shape comes into focus and then holds.
      var k = Math.round(u), f = ease(1 - Math.min(1, Math.max(0, k - u) / 0.5));
      if (k !== curPanel) { curPanel = k; active.forEach(function (p, i) { if (p) p.classList.toggle("is-on", i === k); }); if (stepEl) stepEl.textContent = (k + 1) + " of " + S; }
      var p = active[k];
      if (p) { var num = p.querySelector("[data-value]"); if (num) { var v = parseFloat(num.getAttribute("data-value")), dec = parseInt(num.getAttribute("data-dec"), 10) || 0; num.textContent = (num.getAttribute("data-prefix") || "") + fmt(v * f, dec) + (num.getAttribute("data-suffix") || ""); } }
      if (visible) raf = requestAnimationFrame(frame);
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
