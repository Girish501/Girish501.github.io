// Hero point cloud, and the TIA cloud in the Circuits section. Each [data-cloud] element gets one
// cloud of points that morphs through the shapes its data-cloud-shapes lists as the element is
// scrolled: the wurtzite ZnO unit cell (a, c from XRD), a cross-section of the 600-cycle AZO film with
// its Al planes on the substrate, the Tauc curves once data/azo/tauc_*.csv exist, and three views of
// the 45 nm TIA from its report: the signal chain with the signal running through it, the input
// current and output voltage against time, and the gain against frequency. three.js draws the points;
// the scroll scrub is this file's own (progress read from scrollY each frame and eased toward, no
// scroll library). The small labels (.cloud-tag) are HTML, moved each frame to the projected
// position of a point in the shape they belong to.
//
// Runs only on screens that match the element's data-cloud-mq (by default at least 1024 x 700),
// without reduced motion, with a hardware WebGL renderer. Otherwise nothing loads and the element
// keeps its static figure.
(function () {
  "use strict";
  function noCloud() { Array.prototype.forEach.call(document.querySelectorAll("[data-cloud]"), function (r) { r.classList.add("no-cloud"); r.classList.remove("has-cloud"); }); }
  var DEFAULT_MQ = "(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)";
  var roots = Array.prototype.filter.call(document.querySelectorAll("[data-cloud]"), function (r) { return window.matchMedia(r.getAttribute("data-cloud-mq") || DEFAULT_MQ).matches; });
  if (!roots.length) return;
  var test = document.createElement("canvas");
  var gl = test.getContext("webgl2") || test.getContext("webgl");
  if (!gl) { noCloud(); return; }
  var ext = gl.getExtension("WEBGL_debug_renderer_info");
  var rname = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
  if (/swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(rname)) { noCloud(); return; }
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

  var INK = [0.09, 0.094, 0.102], SLATE = [0.22, 0.23, 0.26], GRAY = [0.6, 0.62, 0.65], LIGHT = [0.78, 0.77, 0.73], BLUE = [0.12, 0.29, 0.79], BLUE2 = [0.55, 0.65, 0.9];
  function shade(c, k) { return [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k)]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function vdot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }   // vector dot product (dot() below draws a junction)
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

  // A shape is a list of parts. Each part takes a share of the N points (its weight) and emits one
  // point at a time as [x, y, z, color, size]. Shapes sit in a box about 6 wide, 3.6 tall, 3.6 deep.
  // A part may ask for an exact count (n) instead of a weight; a named part's index range is returned.
  function build(parts, tags) {
    var pos = new Float32Array(3 * N), col = new Float32Array(3 * N), siz = new Float32Array(N), wav = new Float32Array(N), wsum = 0, fixed = 0, idx = 0, ranges = {}, order = [], last = -1;
    parts.forEach(function (p, pi) { if (p.n) fixed += p.n; else { wsum += p.w; last = pi; } });
    var pool = Math.max(0, N - fixed);
    parts.forEach(function (p, pi) {
      var cnt = p.n ? Math.min(p.n, N - idx) : pi === last ? Math.max(0, N - idx - remainingFixed(parts, pi)) : Math.min(N - idx, Math.round(pool * p.w / wsum));
      if (p.name) ranges[p.name] = { start: idx, count: cnt };
      order.push({ start: idx, count: cnt, w: p.w || 0, n: p.n || 0 });
      for (var i = 0; i < cnt; i++, idx++) {
        var r = p.emit(i, cnt);
        pos[3 * idx] = r[0]; pos[3 * idx + 1] = r[1]; pos[3 * idx + 2] = r[2];
        col[3 * idx] = r[3][0]; col[3 * idx + 1] = r[3][1]; col[3 * idx + 2] = r[3][2];
        siz[idx] = r[4] || 1; wav[idx] = r[5] || 0;
      }
    });
    for (; idx < N; idx++) { pos[3 * idx] = pos[3 * idx - 3]; pos[3 * idx + 1] = pos[3 * idx - 2]; pos[3 * idx + 2] = pos[3 * idx - 1]; col[3 * idx] = col[3 * idx - 3]; col[3 * idx + 1] = col[3 * idx - 2]; col[3 * idx + 2] = col[3 * idx - 1]; siz[idx] = siz[idx - 1]; }
    return { pos: pos, col: col, siz: siz, wav: wav, tags: tags || {}, ranges: ranges, order: order };
  }
  function remainingFixed(parts, pi) { var n = 0; for (var i = pi + 1; i < parts.length; i++) if (parts[i].n) n += parts[i].n; return n; }
  var LIGHT_DIR = norm([-0.35, 0.8, 0.5]);
  // A shaded sphere. Points cover the side facing the view direction V evenly (a Fibonacci spiral
  // around V, down to 0.3 past the rim), so the sphere looks solid with few points.
  var GOLD = Math.PI * (3 - Math.sqrt(5));
  function ball(c, R, color, V, size) {
    var e1 = norm(cross(V, Math.abs(V[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0])), e2 = norm(cross(V, e1));
    return function (i, cnt) {
      var z = 1 - 1.3 * (i + 0.5 + 0.3 * (rnd() - 0.5)) / cnt, s = Math.sqrt(Math.max(0, 1 - z * z)), th = i * GOLD + rnd() * 0.3;
      var n = [V[0] * z + e1[0] * s * Math.cos(th) + e2[0] * s * Math.sin(th), V[1] * z + e1[1] * s * Math.cos(th) + e2[1] * s * Math.sin(th), V[2] * z + e1[2] * s * Math.cos(th) + e2[2] * s * Math.sin(th)];
      return [c[0] + R * n[0], c[1] + R * n[1], c[2] + R * n[2], shade(color, 0.55 + 0.5 * Math.max(0, vdot(n, LIGHT_DIR))), size];
    };
  }
  // A thin rod from a to b (the part of it between t0 and t1).
  function rod(a, b, r, color, size, t0, t1) {
    var d = sub(b, a), len = Math.hypot(d[0], d[1], d[2]);
    var u = norm(cross(d, Math.abs(d[1]) > 0.9 * len ? [1, 0, 0] : [0, 1, 0])), v = norm(cross(d, u));
    t0 = t0 || 0; t1 = t1 === undefined ? 1 : t1;
    return function (i, cnt) {
      var t = t0 + (t1 - t0) * ((i + 0.5 + 0.7 * (rnd() - 0.5)) / cnt), th = rnd() * 6.2832, q = r * Math.sqrt(rnd()), cu = Math.cos(th) * q, sv = Math.sin(th) * q;
      return [a[0] + d[0] * t + u[0] * cu + v[0] * sv, a[1] + d[1] * t + u[1] * cu + v[1] * sv, a[2] + d[2] * t + u[2] * cu + v[2] * sv, color, size];
    };
  }
  // A flat face from corner o along edges e1 and e2, filled on a jittered grid so it reads as a
  // surface; colorAt(s, t) colors the point.
  function face(o, e1, e2, colorAt, size) {
    var l1 = Math.hypot(e1[0], e1[1], e1[2]), l2 = Math.hypot(e2[0], e2[1], e2[2]);
    return function (i, cnt) {
      var n1 = Math.max(1, Math.round(Math.sqrt(cnt * l1 / l2))), n2 = Math.ceil(cnt / n1);
      var s = ((i % n1) + 0.5 + 0.4 * (rnd() - 0.5)) / n1, t = (Math.floor(i / n1) + 0.5 + 0.4 * (rnd() - 0.5)) / n2;
      return [o[0] + e1[0] * s + e2[0] * t, o[1] + e1[1] * s + e2[1] * t, o[2] + e1[2] * s + e2[2] * t, colorAt(s, t), size];
    };
  }
  function viewDir(cam) { return [Math.sin(cam[0]) * Math.cos(cam[1]), Math.sin(cam[1]), Math.cos(cam[0]) * Math.cos(cam[1])]; }

  // Wurtzite ZnO, ball and stick: the hexagonal unit cell. A prism one lattice constant a on each
  // edge and c tall, Zn at the corners, the face centres and three sites inside, each O a distance
  // u c above its Zn, bonds to the four neighbours, and dimension marks for a and c.
  var CAM_LATTICE = [0.55, 0.5, 10.8];
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
    P.forEach(function (p) { parts.push({ w: p[3] ? 0.7 : 1, emit: ball(p, p[3] ? RO : RZN, p[3] ? GRAY : SLATE, V, 1.7 * COV) }); });   // Zn dark, O gray, as in the first version
    P.forEach(function (p) {
      if (p[3]) return;
      P.forEach(function (q) { if (!q[3]) return; var d = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]); if (d < 2.1 * SC) parts.push({ w: 0.3, emit: rod(p, q, RB, LIGHT, COV, RZN / d, 1 - RO / d) }); });
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
  var CAM_FILM = [0.5, 0.3, 10.5];
  function shapeFilm() {
    var W = 3.1, D = 2.0, H = 2.4, SUB = 0.9, X0 = 0.05, y0 = -0.9, zf = D / 2, FS = 1.6 * COV;
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
      parts.push({ w: 0.15, emit: rod([xr + 0.012, yAl(m), zf], [xr + 0.012, yAl(m), -zf], 0.008, BLUE, 0.9 * COV) });
    }
    var E = function (a, b, w, color) { parts.push({ w: w || 0.2, emit: rod(a, b, 0.008, color || INK, 0.9 * COV) }); };
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

  // Charts. A flat chart in the x-y plane: ink axes with ticks, a light grid, and curves as thin
  // tubes. Values are mapped to the box X0..X1 by Y0..Y1; labels are HTML tags anchored to points.
  var X0 = -1.95, X1 = 2.25, Y0 = -1.4, Y1 = 1.9;
  function axesParts(parts, x0, x1, y0, y1, xs, ys) {
    xs.forEach(function (x) { parts.push({ w: 0.08, emit: rod([x, y0, -0.02], [x, y1, -0.02], 0.005, LIGHT, 0.75 * COV) }); parts.push({ w: 0.015, emit: rod([x, y0 - 0.07, 0], [x, y0, 0], 0.009, INK, 0.8 * COV) }); });
    ys.forEach(function (y) { parts.push({ w: 0.1, emit: rod([x0, y, -0.02], [x1, y, -0.02], 0.005, LIGHT, 0.75 * COV) }); parts.push({ w: 0.015, emit: rod([x0 - 0.07, y, 0], [x0, y, 0], 0.009, INK, 0.8 * COV) }); });
    parts.push({ w: 0.4, emit: rod([x0, y0, 0], [x1, y0, 0], 0.009, INK, 0.8 * COV) });
    parts.push({ w: 0.32, emit: rod([x0, y0, 0], [x0, y1, 0], 0.009, INK, 0.8 * COV) });
    return parts;
  }
  function chart(xs, ys) { return axesParts([], X0, X1, Y0, Y1, xs, ys); }
  // Points along a curve given as [x,y] in scene units, as a tube of the given radius at depth z.
  // wave is the amplitude the vertex shader adds as a travelling sine (0 for still points).
  function curve(fn, radius, z, color, wave) {
    return function (i, cnt) { var s = (i + 0.5 + 0.7 * (rnd() - 0.5)) / cnt, xy = fn(s), th = rnd() * 6.2832, r = radius * Math.sqrt(rnd()); return [xy[0] + r * Math.cos(th), xy[1] + r * Math.sin(th), z + (rnd() - .5) * radius, color, 0.95 * COV, wave || 0]; };
  }
  function disc(c, r, color) {
    return function () { var th = rnd() * 6.2832, q = r * Math.sqrt(rnd()); return [c[0] + q * Math.cos(th), c[1] + q * Math.sin(th), c[2], color, 1.1 * COV]; };
  }

  // ---- Schematic drawing: wires and symbols in the x-y plane, as parts ----
  var WIRE = 0.009, SYM = 0.95;   // thin wires drawn with small, dense points read crisper than thick fuzzy ones
  function W(parts, a, b, color, r) { var len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 1e-6) return; parts.push({ w: 0.42 * len, emit: rod([a[0], a[1], 0], [b[0], b[1], 0], r || WIRE, color, SYM * COV) }); }
  function poly(parts, pts, color) { for (var i = 1; i < pts.length; i++) W(parts, pts[i - 1], pts[i], color); }
  function arc(parts, c, r, a0, a1, color) { var n = 14, pts = []; for (var i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } poly(parts, pts, color); }
  function dot(parts, p, color) { parts.push({ w: 0.05, emit: disc([p[0], p[1], 0.01], 0.038, color) }); }
  function chevron(parts, tip, dir, color) { var s = 0.055, nx = -dir[1], ny = dir[0]; W(parts, [tip[0] - dir[0] * s + nx * s, tip[1] - dir[1] * s + ny * s], tip, color); W(parts, [tip[0] - dir[0] * s - nx * s, tip[1] - dir[1] * s - ny * s], tip, color); }
  // MOSFET, channel vertical at x, centred on y. side: -1 gate on the left, +1 gate on the right. Returns its terminals.
  function mos(parts, x, y, side, pType, color) {
    var h = 0.19, gx = x - side * 0.07;
    W(parts, [x, y - h], [x, y + h], color);                       // channel
    W(parts, [gx, y - 0.15], [gx, y + 0.15], color);               // gate
    var gl = pType ? gx - side * 0.09 : gx;
    if (pType) arc(parts, [gx - side * 0.045, y], 0.045, 0, 6.2832, color);
    W(parts, [gl, y], [x - side * 0.32, y], color);                // gate lead
    W(parts, [x, y + h], [x, y + 0.36], color);                    // drain or source lead (top)
    W(parts, [x, y - h], [x, y - 0.36], color);                    // (bottom)
    if (pType) chevron(parts, [x, y + h + 0.01], [0, -1], color); else chevron(parts, [x, y - 0.3], [0, -1], color);
    return { top: [x, y + 0.36], bot: [x, y - 0.36], gate: [x - side * 0.32, y] };
  }
  function resistor(parts, a, b, color) {
    var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    var l0 = Math.max(0.04, (len - 0.42) / 2), pts = [a, [a[0] + ux * l0, a[1] + uy * l0]], n = 6, amp = 0.065;
    for (var i = 0; i < n; i++) { var t = l0 + 0.42 * (i + 0.5) / n, sgn = i % 2 ? -1 : 1; pts.push([a[0] + ux * t + nx * amp * sgn, a[1] + uy * t + ny * amp * sgn]); }
    pts.push([b[0] - ux * l0, b[1] - uy * l0]); pts.push(b); poly(parts, pts, color);
  }
  function cap(parts, a, b, color) {
    var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux, m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], g = 0.035, pl = 0.12;
    W(parts, a, [m[0] - ux * g, m[1] - uy * g], color); W(parts, [m[0] + ux * g, m[1] + uy * g], b, color);
    [-1, 1].forEach(function (s) { var c = [m[0] + ux * g * s, m[1] + uy * g * s]; W(parts, [c[0] - nx * pl, c[1] - ny * pl], [c[0] + nx * pl, c[1] + ny * pl], color, 0.014); });
  }
  function gnd(parts, p, color) { W(parts, p, [p[0], p[1] - 0.1], color); [[0.13, 0], [0.085, 0.05], [0.04, 0.1]].forEach(function (s) { W(parts, [p[0] - s[0], p[1] - 0.1 - s[1]], [p[0] + s[0], p[1] - 0.1 - s[1]], color, 0.014); }); }
  function photodiode(parts, top, bot, color) {
    var x = top[0], m = (top[1] + bot[1]) / 2, s = 0.14;
    W(parts, top, [x, m + s], color); W(parts, [x, m - s], bot, color);
    poly(parts, [[x - s, m + s], [x + s, m + s], [x, m - s], [x - s, m + s]], color);      // triangle, anode up
    W(parts, [x - s, m - s], [x + s, m - s], color, 0.014);                                  // bar
    [[-0.42, 0.2], [-0.42, 0.02]].forEach(function (o) { var a = [x + o[0], m + o[1] + 0.2], b = [x + o[0] + 0.2, m + o[1]]; W(parts, a, b, color); chevron(parts, b, [0.707, -0.707], color); }); // light
  }

  // The TIA signal chain, from the report's schematics: photodiode model (current source and 100 fF),
  // 50 pF coupling, common-gate input stage with a 10 kΩ load, differential pair with PMOS loads,
  // four cascaded common-source stages per path, source followers, 600 Ω differential load.
  // Flat drawings use yaw 0 so horizontal wires and axes stay within one pixel row. Entries: yaw, elevation, distance, optional canvas aspect below which the camera steps back (default 0.9).
  var CAM_TIA = [0, 0.1, 9.6, 1.08];
  function shapeTIA() {
    var parts = [], tags = {}, S = 0.93, OX = -0.3, OY = 0.4, pathP = [], pathN = [];
    function P(x, y) { return [x * S + OX, y * S + OY]; }
    var pw = function (pts, color) { poly(parts, pts, color); };
    var yIn = 0.25, yG = 0.5, railT = 1.65, gndM = -0.15, railL = -0.5, gndL = -2.2, yUp = 1.0, yVn = 0.82, yNodeU = 0.86, yNodeL = -1.35;
    // Photodiode model and coupling
    var xPD = -3.05, xCP = -2.74, xC1 = -2.35, xCG = -1.85, yGndL = -0.95;
    photodiode(parts, P(xPD, yIn), P(xPD, yGndL), INK);
    cap(parts, P(xCP, yIn - 0.3), P(xCP, yGndL + 0.3), INK); W(parts, P(xCP, yIn), P(xCP, yIn - 0.3), INK); W(parts, P(xCP, yGndL + 0.3), P(xCP, yGndL), INK);
    pw([P(xPD, yGndL), P(xCP, yGndL)], INK); gnd(parts, P((xPD + xCP) / 2, yGndL), INK); W(parts, P((xPD + xCP) / 2, yGndL), P((xPD + xCP) / 2, yGndL), INK);
    pw([P(xPD, yIn), P(xC1 - 0.16, yIn)], INK); dot(parts, P(xCP, yIn), INK); dot(parts, P((xPD + xCP) / 2, yGndL), INK);
    cap(parts, P(xC1 - 0.16, yIn), P(xC1 + 0.16, yIn), INK);
    // Common gate: NM0 with its source on the input node, R3 to VDD, a current source below
    var t0 = mos(parts, P(xCG, yG)[0], P(xCG, yG)[1], -1, false, INK);
    pw([P(xC1 + 0.16, yIn), [t0.bot[0], P(0, yIn)[1]]], INK); dot(parts, [t0.bot[0], P(0, yIn)[1]], INK);
    W(parts, t0.gate, [t0.gate[0] - 0.12 * S, t0.gate[1]], INK); dot(parts, [t0.gate[0] - 0.12 * S, t0.gate[1]], GRAY);
    var cgOut = [t0.top[0], P(0, 0.92)[1]];
    W(parts, t0.top, cgOut, INK); dot(parts, cgOut, INK);
    resistor(parts, [cgOut[0], cgOut[1]], P(xCG, railT), INK);
    var isC = P(xCG, -0.45); W(parts, t0.bot, [isC[0], isC[1] + 0.17 * S], INK); arc(parts, isC, 0.17 * S, 0, 6.2832, INK); W(parts, [isC[0], isC[1] + 0.09], [isC[0], isC[1] - 0.09], INK); chevron(parts, [isC[0], isC[1] - 0.09], [0, -1], INK);
    W(parts, [isC[0], isC[1] - 0.17 * S], P(xCG, yGndL), INK); gnd(parts, P(xCG, yGndL), INK);
    // VDD rail
    pw([P(xCG, railT), P(3.25, railT)], INK);
    // Differential pair: NM4 (driven, left) and NM5 (right), PMOS loads, tail NM3
    var xA = -1.2, xB = -0.62, xT = (xA + xB) / 2;
    var c2a = [cgOut[0] + 0.08, cgOut[1]], c2b = P(xA - 0.7, 0.92);
    cap(parts, c2a, c2b, INK);
    var tA = mos(parts, P(xA, yG)[0], P(xA, yG)[1], -1, false, INK), tB = mos(parts, P(xB, yG)[0], P(xB, yG)[1], 1, false, INK);
    pw([c2b, [tA.gate[0] - 0.08, c2b[1]], [tA.gate[0] - 0.08, tA.gate[1]], tA.gate], INK);
    W(parts, tB.gate, [tB.gate[0] + 0.12 * S, tB.gate[1]], INK); dot(parts, [tB.gate[0] + 0.12 * S, tB.gate[1]], GRAY);
    var tail = P(xT, 0.02); pw([tA.bot, [tA.bot[0], tail[1]], [tB.bot[0], tail[1]], tB.bot], INK); dot(parts, tail, INK);
    var t3 = mos(parts, tail[0], P(0, -0.42)[1], -1, false, INK); W(parts, tail, t3.top, INK); W(parts, t3.gate, [t3.gate[0] - 0.12 * S, t3.gate[1]], INK); dot(parts, [t3.gate[0] - 0.12 * S, t3.gate[1]], GRAY);
    W(parts, t3.bot, P(xT, yGndL), INK); gnd(parts, P(xT, yGndL), INK);
    var pA_ = mos(parts, P(xA, 1.3)[0], P(xA, 1.3)[1], -1, true, INK), pB_ = mos(parts, P(xB, 1.3)[0], P(xB, 1.3)[1], 1, true, INK);
    W(parts, pA_.top, [pA_.top[0], P(0, railT)[1]], INK); W(parts, pB_.top, [pB_.top[0], P(0, railT)[1]], INK); dot(parts, [pA_.top[0], P(0, railT)[1]], INK); dot(parts, [pB_.top[0], P(0, railT)[1]], INK);
    W(parts, pA_.gate, [pA_.gate[0] - 0.1 * S, pA_.gate[1]], INK); dot(parts, [pA_.gate[0] - 0.1 * S, pA_.gate[1]], GRAY); W(parts, pB_.gate, [pB_.gate[0] + 0.1 * S, pB_.gate[1]], INK); dot(parts, [pB_.gate[0] + 0.1 * S, pB_.gate[1]], GRAY);
    var vp = [tA.top[0], P(0, yUp)[1]], vn = [tB.top[0], P(0, yVn)[1]];
    W(parts, tA.top, pA_.bot, INK); W(parts, tB.top, pB_.bot, INK); dot(parts, vp, BLUE); dot(parts, vn, BLUE);
    // VP goes right at yUp with a hop over NM5's drain wire; VN goes right then down to the lower chain
    var hopR = 0.085, xHop = tB.top[0];
    W(parts, vp, [xHop - hopR, vp[1]], INK); arc(parts, [xHop, vp[1]], hopR, Math.PI, 0, INK);
    var xDrop = P(-0.3, 0)[0];
    pw([[xHop + hopR, vp[1]], [xDrop, vp[1]], [xDrop, P(0, yG)[1]]], INK);
    var xDropN = P(-0.1, 0)[0];
    pw([vn, [xDropN, vn[1]], [xDropN, P(0, yNodeL + 0.33)[1]]], INK);
    // Two chains of four common-source stages and a source follower
    function chain(yRail, yNode, yGnd, start, path, railFrom, color) {
      var xs = [0.36, 1.08, 1.8, 2.52], yN = yNode - 0.36, yP = yNode + 0.36, prev = start, node;
      var yGate = yN;
      pw([P(railFrom, yRail), P(3.25, yRail)], color); pw([P(railFrom, yGnd), P(3.25, yGnd)], color);
      path.push(prev);
      xs.forEach(function (x) {
        var g = P(x - 0.32, yGate), cA = [prev[0], g[1]], cB = [prev[0] + 0.3, g[1]];
        pw([prev, cA], color); cap(parts, cA, cB, color); pw([cB, g], color); path.push(cA, g);
        var n = mos(parts, P(x, yN)[0], P(x, yN)[1], -1, false, color), p = mos(parts, P(x, yP)[0], P(x, yP)[1], -1, true, color);
        W(parts, p.gate, [p.gate[0] - 0.08, p.gate[1]], color); dot(parts, [p.gate[0] - 0.08, p.gate[1]], GRAY);
        node = [n.top[0], (n.top[1] + p.bot[1]) / 2]; W(parts, n.top, p.bot, color); dot(parts, node, BLUE);
        W(parts, p.top, [p.top[0], P(0, yRail)[1]], color); W(parts, n.bot, [n.bot[0], P(0, yGnd)[1]], color); dot(parts, [p.top[0], P(0, yRail)[1]], color); dot(parts, [n.bot[0], P(0, yGnd)[1]], color);
        path.push([n.top[0], g[1]], node);
        prev = [node[0] + 0.14, node[1]]; W(parts, node, prev, color); path.push(prev);
      });
      // source follower
      var xS = 3.18, g = P(xS - 0.32, yN), cA = [prev[0], g[1]], cB = [prev[0] + 0.3, g[1]];
      pw([prev, cA], color); cap(parts, cA, cB, color); pw([cB, g], color); path.push(cA, g);
      var sf = mos(parts, P(xS, yN)[0], P(xS, yN)[1], -1, false, color);
      W(parts, sf.top, [sf.top[0], P(0, yRail)[1]], color); dot(parts, [sf.top[0], P(0, yRail)[1]], color);
      var out = [sf.bot[0], sf.bot[1] - 0.05]; W(parts, sf.bot, out, color); dot(parts, out, BLUE);
      resistor(parts, out, [out[0], P(0, yGnd)[1]], color); dot(parts, [out[0], P(0, yGnd)[1]], color);
      path.push([sf.top[0], g[1]], out);
      return out;
    }
    var outP = chain(railT, yNodeU, gndM, [xDrop, P(0, yG)[1]], pathP, 0.08, INK);
    var outN = chain(railL, yNodeL, gndL, [xDropN, P(0, yNodeL + 0.33)[1]], pathN, 0.08, INK);
    // 600 Ω differential load between VOP and VON
    var xL = outP[0] + 0.28; pw([outP, [xL, outP[1]]], INK); pw([outN, [xL, outN[1]]], INK); dot(parts, [xL, outP[1]], INK); dot(parts, [xL, outN[1]], INK);
    W(parts, [xL, outP[1]], [xL, -0.95 + 0.4], INK); resistor(parts, [xL, -0.95 + 0.4], [xL, -0.95 - 0.4], INK); W(parts, [xL, -0.95 - 0.4], [xL, outN[1]], INK);
    pathP.push([xL, outP[1]]); pathN.push([xL, outN[1]]);
    // The signal path from the photodiode to the pair, shared by both chains
    var head = [P(xPD, yIn), [t0.bot[0], P(0, yIn)[1]], t0.top, cgOut, c2b, [tA.gate[0] - 0.08, c2b[1]], [tA.gate[0] - 0.08, tA.gate[1]], tA.gate, [tA.top[0], tA.gate[1]], vp, [xHop, vp[1]], [xDrop, vp[1]]];
    pathP = head.concat(pathP);
    pathN = [tA.gate, [tA.top[0], tA.gate[1]], [tA.bot[0], tail[1]], [tB.bot[0], tail[1]], [tB.top[0], tail[1]], vn, [xDropN, vn[1]]].concat(pathN);
    // Flow particles: blue dots that run along both paths (their positions are set each frame)
    var flows = [{ path: pathP, n: 20 }, { path: pathN, n: 14 }];
    flows.forEach(function (f, i) { f.name = "flow" + i; f.per = 12; parts.push({ name: f.name, n: f.n * f.per, emit: function (k) { var tail = k % f.per >= 7; return [0, 0, 0.03, tail ? BLUE2 : BLUE, (tail ? 1.1 : 1.6) * COV]; } }); });
    tags = {
      pd: { p: [P(xPD, yGndL)[0] - 0.14, P(0, yGndL)[1] - 0.3, 0] },
      cp: { p: [P(xCP, 0)[0] + 0.14, P(0, -0.03)[1], 0] },
      cg: { p: [P(xCG, yGndL)[0], P(0, yGndL)[1] - 0.58, 0] },
      dp: { p: [P(xT, yGndL)[0], P(0, yGndL)[1] - 0.3, 0] },
      cs: { p: [P(1.33, 0)[0], P(0, gndL)[1] - 0.3, 0] },
      sf: { p: [P(3.18, 0)[0], P(0, railT)[1] + 0.2, 0] },
      vdd: { p: [P(xCG, railT)[0] - 0.08, P(0, railT)[1], 0] },
      vop: { p: [xL, outP[1], 0], dx: 7, dy: -11 },
      von: { p: [xL, outN[1], 0], dx: 7, dy: 11 },
      load: { p: [xL, -0.95, 0], dx: 10 }
    };
    var g = build(parts, tags); g.flows = flows; return g;
  }

  // Input current and differential output voltage against time: 2.67 µA peak to peak in at 300 MHz,
  // 594 mV peak to peak out (VOP minus VON). The sines travel; the vertex shader moves them.
  var CAM_SCOPE = [0, 0.08, 9.6], CYCLES_SHOWN = 6;
  function shapeScope() {
    var parts = [], yiT = 1.95, yiB = 1.15, yvT = 0.75, yvB = -1.4, ci = (yiT + yiB) / 2, cv = (yvT + yvB) / 2, ai = 0.27, av = 0.297 / 0.33 * (yvT - cv);
    axesParts(parts, X0, X1, yiB, yiT, [], [ci]);
    axesParts(parts, X0, X1, yvB, yvT, [(X0 + X1) / 2], [cv, cv + av, cv - av]);
    parts.push({ w: 1.0, emit: curve(function (s) { return [X0 + s * (X1 - X0), ci]; }, 0.02, 0.03, BLUE, ai) });
    parts.push({ w: 1.6, emit: curve(function (s) { return [X0 + s * (X1 - X0), cv]; }, 0.024, 0.03, INK, av) });
    // peak-to-peak brackets at the right edge
    [[ci, ai], [cv, av]].forEach(function (b) { var x = X1 + 0.14; parts.push({ w: 0.12, emit: rod([x, b[0] - b[1], 0], [x, b[0] + b[1], 0], 0.01, INK, 0.9 * COV) }); [-1, 1].forEach(function (s) { parts.push({ w: 0.03, emit: rod([x - 0.06, b[0] + s * b[1], 0], [x + 0.06, b[0] + s * b[1], 0], 0.01, INK, 0.9 * COV) }); }); });
    var tags = {
      iLabel: { p: [X0, yiT, 0], dx: 0, dy: -12 }, vLabel: { p: [X0, yvT, 0], dx: 0, dy: -12 },
      ipp: { p: [X1 + 0.14, ci, 0], dx: 10 }, vpp: { p: [X1 + 0.14, cv, 0], dx: 10 },
      i0: { p: [X0, ci, 0], dx: -8 }, v0: { p: [X0, cv, 0], dx: -8 }, vUp: { p: [X0, cv + av, 0], dx: -8 }, vDn: { p: [X0, cv - av, 0], dx: -8 },
      iunit: { p: [X0, ci, 0], dx: -40 }, vunit: { p: [X0, cv, 0], dx: -48 },
      t0: { p: [X0, yvB, 0], dy: 12 }, t10: { p: [(X0 + X1) / 2, yvB, 0], dy: 12 }, t20: { p: [X1, yvB, 0], dy: 12 }, tlabel: { p: [(X0 + X1) / 2, yvB, 0], dy: 34 },
      freq: { p: [X1, yiT, 0], dy: -12 }
    };
    return build(parts, tags);
  }

  // Transimpedance gain against frequency, read from the report's Spectre plot (VOP minus VON over the
  // photodiode current): flat near 109 dBΩ, 3 dB down at 2.31 MHz and 492.88 MHz.
  var CAM_BODE = [0, 0.12, 9.6];
  var BODE = [[4.706,-11.0],[4.765,-4.1],[4.824,2.8],[4.882,9.6],[4.941,16.3],[5.0,22.9],[5.059,29.4],[5.118,35.8],[5.176,41.9],[5.235,47.9],[5.294,53.7],[5.353,59.1],[5.412,64.2],[5.471,69.1],[5.529,73.6],[5.588,77.7],[5.647,81.6],[5.706,85.1],[5.765,88.0],[5.824,90.6],[5.882,93.1],[5.941,95.2],[6.0,97.1],[6.059,98.5],[6.118,99.9],[6.176,101.3],[6.235,102.8],[6.294,103.8],[6.353,104.7],[6.412,105.5],[6.471,106.2],[6.529,106.9],[6.588,107.3],[6.647,107.6],[6.706,107.9],[6.765,108.2],[6.824,108.5],[6.882,108.7],[6.941,108.9],[7.0,109.0],[7.059,109.1],[7.118,109.3],[7.176,109.3],[7.235,109.3],[7.294,109.3],[7.353,109.3],[7.412,109.3],[7.471,109.3],[7.529,109.3],[7.588,109.3],[7.647,109.3],[7.706,109.3],[7.765,109.3],[7.824,109.3],[7.882,109.3],[7.941,109.3],[8.0,109.3],[8.059,109.2],[8.118,109.1],[8.176,109.0],[8.235,108.9],[8.294,108.9],[8.353,108.8],[8.412,108.6],[8.471,108.3],[8.529,107.8],[8.588,107.0],[8.647,105.8],[8.706,104.3],[8.765,102.8],[8.824,101.2],[8.882,99.5],[8.941,97.5],[9.0,95.1],[9.059,92.6],[9.118,89.8],[9.176,87.1],[9.235,84.0],[9.294,80.6],[9.353,76.9],[9.412,72.9],[9.471,68.7],[9.529,64.4],[9.588,60.0],[9.647,55.5],[9.706,50.8],[9.765,46.0],[9.824,41.1],[9.882,36.9],[9.941,33.3],[10.0,30.4]];
  function shapeBode() {
    var LG0 = 5, LG1 = 10, DB0 = 0, DB1 = 120, L3 = 104.7;
    var fx = function (lg) { return X0 + (lg - LG0) / (LG1 - LG0) * (X1 - X0); }, fy = function (db) { return Y0 + (db - DB0) / (DB1 - DB0) * (Y1 - Y0); };
    var data = BODE.filter(function (p) { return p[0] >= LG0 - 0.05 && p[1] >= DB0 - 5; });
    var gainAt = function (lg) { var i = 0; while (i < data.length - 2 && data[i + 1][0] < lg) i++; var a = data[i], b = data[i + 1], f = Math.min(1, Math.max(0, (lg - a[0]) / (b[0] - a[0]))); return a[1] + (b[1] - a[1]) * f; };
    var lgStart = Math.max(LG0, data[0][0]);
    var parts = chart([6, 7, 8, 9].map(fx), [40, 80, 120].map(fy));
    parts.push({ w: 1.6, emit: curve(function (s) { var lg = lgStart + s * (LG1 - lgStart); return [fx(lg), fy(Math.max(DB0, gainAt(lg)))]; }, 0.024, 0.03, INK) });
    parts.push({ w: 0.25, emit: rod([X0, fy(L3), 0.01], [X1, fy(L3), 0.01], 0.006, shade(BLUE, 1.0), 0.8 * COV) });
    var lo = Math.log10(2.31102e6), hi = Math.log10(492.868e6);
    parts.push({ w: 0.07, emit: disc([fx(lo), fy(L3), 0.05], 0.08, BLUE) }); parts.push({ w: 0.07, emit: disc([fx(hi), fy(L3), 0.05], 0.08, BLUE) });
    var tags = {
      f100k: { p: [fx(5), Y0, 0], dy: 12 }, f1m: { p: [fx(6), Y0, 0], dy: 12 }, f10m: { p: [fx(7), Y0, 0], dy: 12 }, f100m: { p: [fx(8), Y0, 0], dy: 12 }, f1g: { p: [fx(9), Y0, 0], dy: 12 }, f10g: { p: [fx(10), Y0, 0], dy: 12 },
      g0: { p: [X0, fy(0), 0], dx: -8 }, g40: { p: [X0, fy(40), 0], dx: -8 }, g80: { p: [X0, fy(80), 0], dx: -8 }, g120: { p: [X0, fy(120), 0], dx: -8 },
      xlabel: { p: [(X0 + X1) / 2, Y0, 0], dy: 34 }, ylabel: { p: [X0, (Y0 + Y1) / 2, 0], dx: -48 },
      plateau: { p: [fx(7.5), fy(109.3), 0], dy: -14 }, lo: { p: [fx(lo), fy(L3), 0], dx: -10, dy: 12 }, hi: { p: [fx(hi), fy(L3), 0], dx: 10, dy: 12 }, m3: { p: [X0, fy(L3), 0], dx: 6, dy: -11 }
    };
    return build(parts, tags);
  }

  function shapeTauc(series) {
    var xmin = 1e9, xmax = -1e9, ymax = 0;
    series.forEach(function (s) { s.rows.forEach(function (r) { xmin = Math.min(xmin, r[0]); xmax = Math.max(xmax, r[0]); ymax = Math.max(ymax, r[1]); }); });
    var parts = chart([], []);
    series.forEach(function (s, si) {
      var rows = s.rows;
      var fn = function (t) { var i = Math.min(rows.length - 2, Math.floor(t * (rows.length - 1))), f = t * (rows.length - 1) - i, a = rows[i], b = rows[i + 1]; var x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f; return [X0 + (x - xmin) / (xmax - xmin) * (X1 - X0), Y0 + y / ymax * (Y1 - Y0)]; };
      var k = series.length > 1 ? si / (series.length - 1) : 0;
      parts.push({ w: 1.2 / series.length, emit: curve(fn, 0.025, 0.03 + 0.02 * si, shade(BLUE, 0.6 + 0.9 * (1 - k))) });
    });
    return build(parts);
  }

  function loadTauc(root) {
    var attr = root.getAttribute("data-tauc-files"), files = [];
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
    "attribute vec3 pA; attribute vec3 pB; attribute vec3 cA; attribute vec3 cB; attribute float sA; attribute float sB; attribute float wA; attribute float wB; attribute vec3 sc; attribute float rnd;",
    "uniform float uT; uniform float uIntro; uniform float uSize; uniform float uScale; uniform float uK; uniform float uPhase; varying vec3 vCol;",
    "void main(){",
    "  float tt = smoothstep(0.0, 1.0, clamp((uT - rnd * 0.35) / 0.65, 0.0, 1.0));",
    "  vec3 p = mix(pA, pB, tt); vCol = mix(cA, cB, tt); float s = mix(sA, sB, tt);",
    "  float w = mix(wA, wB, tt); p.y += w * sin(uK * p.x - uPhase);",
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

  var SPECS = {
    lattice: { build: shapeLattice, cam: CAM_LATTICE },
    film: { build: shapeFilm, cam: CAM_FILM },
    tia: { build: shapeTIA, cam: CAM_TIA },
    tiaout: { build: shapeScope, cam: CAM_SCOPE },
    tiagain: { build: shapeBode, cam: CAM_BODE }
  };
  var debug = params.has("debug") ? (window.__cloud = []) : null;

  import("three").then(function (THREE) {
    roots.forEach(function (root) {
      var keys = (root.getAttribute("data-cloud-shapes") || "lattice,film").split(",").map(function (k) { return k.trim(); });
      var wantTauc = keys.indexOf("tauc") >= 0;
      (wantTauc ? loadTauc(root) : Promise.resolve(null)).then(function (tauc) {
        var shapes = [];
        keys.forEach(function (k) {
          if (k === "tauc") { if (tauc) shapes.push({ key: "tauc", build: function () { return shapeTauc(tauc); }, cam: [0.2, 0.12, 11] }); }
          else if (SPECS[k]) shapes.push({ key: k, build: SPECS[k].build, cam: SPECS[k].cam });
        });
        if (shapes.length) mount(root, THREE, shapes);
      }).catch(function (e) { root.classList.remove("has-cloud"); root.classList.add("no-cloud"); if (window.console) console.warn("cloud off:", e && e.message); });
    });
  }).catch(function (e) { noCloud(); if (window.console) console.warn("cloud off:", e && e.message); });

  function mount(hero, THREE, shapes) {
    var S = shapes.length;
    shapes.forEach(function (s, i) { var g = s.build(); s.pos = g.pos; s.col = g.col; s.siz = g.siz; s.wav = g.wav; s.tags = g.tags; s.index = i; s.order = g.order;
      s.flows = (g.flows || []).map(function (f) { var r = g.ranges[f.name], cum = [0]; for (var k = 1; k < f.path.length; k++) cum.push(cum[k - 1] + Math.hypot(f.path[k][0] - f.path[k - 1][0], f.path[k][1] - f.path[k - 1][1]));
        var jit = []; for (var j = 0; j < r.count; j++) { var th = rnd() * 6.2832, q = 0.01 * Math.sqrt(rnd()); jit.push(q * Math.cos(th), q * Math.sin(th)); }
        return { start: r.start, count: r.count, per: f.per, n: f.n, path: f.path, cum: cum, len: cum[cum.length - 1], jit: jit }; }); });
    if (debug) debug.push({ root: hero, shapes: shapes });

    // Panel entries, labels and the DOM
    var panels = Array.prototype.slice.call(hero.querySelectorAll(".cloud-item"));
    var byKey = {}; panels.forEach(function (p) { byKey[p.getAttribute("data-key")] = p; });
    var active = shapes.map(function (s) { return byKey[s.key]; });
    var stepEl = hero.querySelector(".cloud-step");
    var tags = [];
    Array.prototype.forEach.call(hero.querySelectorAll(".cloud-tag"), function (el) {
      var si = -1; shapes.forEach(function (s, i) { if (s.key === el.getAttribute("data-key")) si = i; });
      var spec = si >= 0 && shapes[si].tags[el.getAttribute("data-at")];
      if (spec) tags.push({ el: el, shape: si, p: new THREE.Vector3(spec.p[0], spec.p[1], spec.p[2]), dx: spec.dx || 0, dy: spec.dy || 0, tail: (el.hasAttribute("data-rotate") ? " rotate(" + el.getAttribute("data-rotate") + "deg)" : "") + " translate(" + (el.getAttribute("data-align") === "right" ? "-100%" : el.getAttribute("data-align") === "center" ? "-50%" : "0") + ",-50%)", on: false });
    });
    hero.classList.add("has-cloud");
    hero.style.setProperty("--shapes", S);
    // The element just grew (its track height depends on the shape count), so everything below it
    // moved: tell the pinned stages and the other clouds to measure again.
    window.dispatchEvent(new Event("cloud:mounted"));
    var canvas = hero.querySelector(".cloud-canvas"), box = canvas.parentElement, lookY = parseFloat(hero.getAttribute("data-cloud-look")); if (isNaN(lookY)) lookY = -0.75;
    var track = hero.querySelector(".hero-track") || hero, pin = hero.querySelector(".hero-pin, .stage-pin") || box;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

    var geo = new THREE.BufferGeometry(), b = Math.min(1, S - 1);
    var pA = new THREE.BufferAttribute(new Float32Array(shapes[0].pos), 3), pB = new THREE.BufferAttribute(new Float32Array(shapes[b].pos), 3);
    var cA = new THREE.BufferAttribute(new Float32Array(shapes[0].col), 3), cB = new THREE.BufferAttribute(new Float32Array(shapes[b].col), 3);
    var sA = new THREE.BufferAttribute(new Float32Array(shapes[0].siz), 1), sB = new THREE.BufferAttribute(new Float32Array(shapes[b].siz), 1);
    var wA = new THREE.BufferAttribute(new Float32Array(shapes[0].wav), 1), wB = new THREE.BufferAttribute(new Float32Array(shapes[b].wav), 1);
    var scat = new Float32Array(3 * N), rn = new Float32Array(N);
    for (var i = 0; i < N; i++) { var r = 4 + rnd() * 5, th = rnd() * 6.2832, ph = Math.acos(2 * rnd() - 1); scat[3 * i] = r * Math.sin(ph) * Math.cos(th); scat[3 * i + 1] = r * Math.cos(ph) * 0.6; scat[3 * i + 2] = r * Math.sin(ph) * Math.sin(th); rn[i] = rnd(); }
    geo.setAttribute("pA", pA); geo.setAttribute("pB", pB); geo.setAttribute("cA", cA); geo.setAttribute("cB", cB); geo.setAttribute("sA", sA); geo.setAttribute("sB", sB); geo.setAttribute("wA", wA); geo.setAttribute("wB", wB);
    geo.setAttribute("sc", new THREE.BufferAttribute(scat, 3)); geo.setAttribute("rnd", new THREE.BufferAttribute(rn, 1));
    geo.setAttribute("position", pA); // bounding sphere
    var mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: { uT: { value: 0 }, uIntro: { value: 0 }, uSize: { value: 0.026 }, uScale: { value: 900 }, uK: { value: 2 * Math.PI * CYCLES_SHOWN / (X1 - X0) }, uPhase: { value: 0 } } });
    scene.add(new THREE.Points(geo, mat));

    var curSeg = -1, switched = false;
    function setSegment(seg) {
      if (seg === curSeg) return; curSeg = seg; switched = true;
      var a = shapes[seg], b = shapes[Math.min(S - 1, seg + 1)];
      pA.array.set(a.pos); pB.array.set(b.pos); cA.array.set(a.col); cB.array.set(b.col); sA.array.set(a.siz); sB.array.set(b.siz); wA.array.set(a.wav); wB.array.set(b.wav);
      pA.needsUpdate = pB.needsUpdate = cA.needsUpdate = cB.needsUpdate = sA.needsUpdate = sB.needsUpdate = wA.needsUpdate = wB.needsUpdate = true;
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
      mat.uniforms.uPhase.value = now * 0.0025;   // the waveforms travel: one cycle every 2.5 s
      // Signal particles run along the schematic's paths while that shape is on either side of the morph.
      [seg, seg + 1].forEach(function (si) {
        var sh = shapes[si]; if (!sh || !sh.flows.length) return;
        var attr = si === seg ? pA : pB, arr = attr.array;
        sh.flows.forEach(function (f) {
          for (var j = 0; j < f.count; j++) {
            var pt = Math.floor(j / f.per), m = j % f.per, back = m >= 7 ? (m - 6) * 0.03 : 0;   // the last five points trail behind the head
            var u = ((pt / f.n) + now * 0.00009 - back / f.len + 1) % 1, d = u * f.len, k = 1;
            while (k < f.cum.length - 1 && f.cum[k] < d) k++;
            var a = f.path[k - 1], b = f.path[k], t = (d - f.cum[k - 1]) / Math.max(1e-6, f.cum[k] - f.cum[k - 1]), o = f.start + j, jx = m >= 7 ? 0.3 : 1;
            arr[3 * o] = a[0] + (b[0] - a[0]) * t + f.jit[2 * j] * jx; arr[3 * o + 1] = a[1] + (b[1] - a[1]) * t + f.jit[2 * j + 1] * jx; arr[3 * o + 2] = 0.03;
          }
          // A partial upload would replace the full upload queued by a segment switch, so only
          // narrow the upload on frames where the whole array is not already being sent.
          if (!switched && attr.addUpdateRange) attr.addUpdateRange(3 * f.start, 3 * f.count);
          attr.needsUpdate = true;
        });
      });
      switched = false;
      // Camera between the two shapes' viewpoints, with a slow drift.
      var ca = shapes[seg].cam, cb = shapes[Math.min(S - 1, seg + 1)].cam;
      var az = ca[0] + (cb[0] - ca[0]) * tt + Math.sin(now * 0.00018) * 0.015, el = ca[1] + (cb[1] - ca[1]) * tt, d = (ca[2] + (cb[2] - ca[2]) * tt) * Math.max(1, ((ca[3] || 0.9) + ((cb[3] || 0.9) - (ca[3] || 0.9)) * tt) / camera.aspect); // step back on narrow canvases
      camera.position.set(Math.sin(az) * Math.cos(el) * d, Math.sin(el) * d, Math.cos(az) * Math.cos(el) * d);
      camera.lookAt(0, lookY, 0);   // in the hero the shapes sit high, clear of the panel; data-cloud-look moves this
      renderer.render(scene, camera);
      // Labels follow their anchor points; a shape's labels fade out as it dissolves and in as the next forms.
      var wA = (1 - ease(tt / 0.3)) * wi, wB = ease((tt - 0.7) / 0.3) * wi, cw = box.clientWidth, ch = box.clientHeight;
      for (var i = 0; i < tags.length; i++) {
        var g = tags[i], w = g.shape === seg ? wA : g.shape === seg + 1 ? wB : 0;
        if (w < 0.02) { if (g.on) { g.el.style.opacity = 0; g.on = false; } continue; }
        proj.copy(g.p).project(camera);
        g.el.style.transform = "translate(" + ((proj.x + 1) / 2 * cw + g.dx).toFixed(1) + "px," + ((1 - proj.y) / 2 * ch + g.dy).toFixed(1) + "px)" + g.tail;
        g.el.style.opacity = w.toFixed(2); g.on = true;
      }
      // Panel: the nearer shape. Its number counts up as the shape comes into focus and then holds.
      var k = Math.round(u), f = k === seg + 1 ? ease((tt - 0.5) / 0.45) : 1;   // the approaching shape's number counts during the second half of its formation and is complete at tt 0.95; the current shape shows its final value
      if (k !== curPanel) { curPanel = k; active.forEach(function (p, i) { if (p) p.classList.toggle("is-on", i === k); }); if (stepEl) stepEl.textContent = (k + 1) + " of " + S; }
      var p = active[k];
      if (p) Array.prototype.forEach.call(p.querySelectorAll("[data-value]"), function (num) { var v = parseFloat(num.getAttribute("data-value")), dec = parseInt(num.getAttribute("data-dec"), 10) || 0, s = (num.getAttribute("data-prefix") || "") + fmt(v * f, dec) + (num.getAttribute("data-suffix") || ""); if (num.textContent !== s) num.textContent = s; });
      if (visible) raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf) raf = requestAnimationFrame(frame); }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) start(); }, { threshold: 0 }).observe(hero);
    document.addEventListener("visibilitychange", function () { if (!document.hidden && visible) start(); });
    window.addEventListener("resize", function () { size(); measure(); start(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    window.addEventListener("load", measure);
    window.addEventListener("cloud:mounted", measure);
    start();
  }
})();
