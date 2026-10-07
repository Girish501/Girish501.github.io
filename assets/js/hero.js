// Hero background: the headshot frame is drawn as a chip package. Copper traces
// fan out from its pins like a PCB breakout, and signal pulses run along them.
// Static traces are drawn once per resize; only the pulses animate.
(function () {
  "use strict";

  var hero = document.querySelector(".hero");
  var chip = document.getElementById("hero-chip");
  if (!hero || !chip) return;
  var cvStatic = hero.querySelector(".hero-canvas--static");
  var cvPulse = hero.querySelector(".hero-canvas--pulses");
  if (!cvStatic || !cvPulse || !cvStatic.getContext) return;

  var ctxS = cvStatic.getContext("2d");
  var ctxP = cvPulse.getContext("2d");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var COPPER = "232,163,92";
  var CYAN = "77,214,200";

  var W = 0, H = 0, dpr = 1;
  var lines = [];   // { pts: [[x,y],...], cum: [..], len, via }
  var pulses = [];
  var flashes = [];
  var running = false, visible = true, rafId = 0, lastT = 0, spawnTimer = 0;

  // Small seeded PRNG so the layout is the same on every visit.
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function chipRect() {
    var x = 0, y = 0, el = chip;
    while (el && el !== hero) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    return { x: x, y: y, w: chip.offsetWidth, h: chip.offsetHeight };
  }

  // Offset a polyline by distance o using miter joins (keeps bus spacing constant through bends).
  function offsetPolyline(pts, o) {
    var out = [];
    for (var i = 0; i < pts.length; i++) {
      var n1 = null, n2 = null;
      if (i > 0) n1 = normal(pts[i - 1], pts[i]);
      if (i < pts.length - 1) n2 = normal(pts[i], pts[i + 1]);
      var nx, ny, k = 1;
      if (n1 && n2) {
        nx = n1[0] + n2[0]; ny = n1[1] + n2[1];
        var l = Math.hypot(nx, ny); nx /= l; ny /= l;
        k = 1 / (nx * n1[0] + ny * n1[1]);
      } else { var n = n1 || n2; nx = n[0]; ny = n[1]; }
      out.push([pts[i][0] + nx * o * k, pts[i][1] + ny * o * k]);
    }
    return out;
  }
  function normal(a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    return [-dy / l, dx / l];
  }

  // Cut a polyline to a given length and precompute cumulative lengths.
  function finalize(pts, maxLen, via) {
    var cum = [0], out = [pts[0]];
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      var seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
      var total = cum[cum.length - 1];
      if (total + seg >= maxLen) {
        var t = (maxLen - total) / seg;
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        cum.push(maxLen);
        return { pts: out, cum: cum, len: maxLen, via: via };
      }
      out.push(b); cum.push(total + seg);
    }
    return { pts: out, cum: cum, len: cum[cum.length - 1], via: via };
  }

  function build() {
    var rect = hero.getBoundingClientRect();
    W = Math.round(rect.width); H = Math.round(rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 2);
    [cvStatic, cvPulse].forEach(function (c) {
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    });
    ctxS.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctxP.setTransform(dpr, 0, 0, dpr, 0, 0);

    var r = chipRect();
    var rand = rng(5760);
    var small = r.w < 200;
    var s = small ? 7 : 10;          // trace pitch
    var margin = small ? 10 : 16;    // keep-out at the package corners
    var far = Math.hypot(W, H) + 50; // long enough to leave the canvas
    var dMax = small ? 70 : 150;     // longest diagonal in the fan-out
    lines = [];

    // Four sides: start corner, along-edge direction, outward direction, length.
    var sides = [
      { o: [r.x, r.y], a: [1, 0], out: [0, -1], len: r.w },           // top
      { o: [r.x + r.w, r.y], a: [0, 1], out: [1, 0], len: r.h },      // right
      { o: [r.x, r.y + r.h], a: [1, 0], out: [0, 1], len: r.w },      // bottom
      { o: [r.x, r.y], a: [0, 1], out: [-1, 0], len: r.h }            // left
    ];

    sides.forEach(function (sd) {
      var usable = sd.len - 2 * margin;
      var nPins = Math.floor(usable / s) + 1;
      var start = (sd.len - (nPins - 1) * s) / 2;
      // Split pins into buses of 3-5 with one empty slot between buses.
      var i = 0;
      while (i < nPins) {
        var size = Math.min(nPins - i, 3 + Math.floor(rand() * 3));
        var centerAlong = start + (i + (size - 1) / 2) * s;
        var t = (centerAlong - sd.len / 2) / (sd.len / 2);  // -1..1 from edge center
        var turn = Math.abs(t) < 0.18 ? 0 : (t < 0 ? -1 : 1);
        var diag = Math.abs(t) * dMax;
        var lead = small ? 14 : 22;

        // Bus centerline in this side's frame.
        var ax = sd.a[0], ay = sd.a[1], ox = sd.out[0], oy = sd.out[1];
        var p0 = [sd.o[0] + ax * centerAlong, sd.o[1] + ay * centerAlong];
        var p1 = [p0[0] + ox * lead, p0[1] + oy * lead];
        var pts = [p0, p1];
        if (turn !== 0) {
          var dx = (ox + ax * turn) / Math.SQRT2, dy = (oy + ay * turn) / Math.SQRT2;
          var p2 = [p1[0] + dx * diag, p1[1] + dy * diag];
          pts.push(p2);
          pts.push([p2[0] + ox * far, p2[1] + oy * far]);
        } else {
          pts.push([p1[0] + ox * far, p1[1] + oy * far]);
        }

        for (var j = 0; j < size; j++) {
          var off = (j - (size - 1) / 2) * s;
          // Offset is measured along the left normal of the centerline's first segment.
          var n = normal(pts[0], pts[1]);
          var sign = (n[0] * ax + n[1] * ay) >= 0 ? 1 : -1;
          var lp = offsetPolyline(pts, off * sign);
          var ends = rand() < 0.55;
          var maxLen = ends ? lead + diag + 30 + rand() * (small ? 160 : 380) : far * 2;
          lines.push(finalize(lp, maxLen, ends));
        }
        i += size + 1;
      }
    });

    drawStatic(r, s);
    pulses = []; flashes = [];
  }

  function drawStatic(r, s) {
    ctxS.clearRect(0, 0, W, H);

    // Faint dot grid, like a wafer map.
    ctxS.fillStyle = "rgba(147,161,178,0.07)";
    for (var gx = 12; gx < W; gx += 24) for (var gy = 12; gy < H; gy += 24) ctxS.fillRect(gx, gy, 1, 1);

    ctxS.lineJoin = "round"; ctxS.lineCap = "round";
    ctxS.strokeStyle = "rgba(" + COPPER + ",0.17)";
    ctxS.lineWidth = 1.25;
    ctxS.beginPath();
    lines.forEach(function (l) {
      ctxS.moveTo(l.pts[0][0], l.pts[0][1]);
      for (var i = 1; i < l.pts.length; i++) ctxS.lineTo(l.pts[i][0], l.pts[i][1]);
    });
    ctxS.stroke();

    // Pins: short thick stubs just outside the frame.
    ctxS.strokeStyle = "rgba(" + COPPER + ",0.55)";
    ctxS.lineWidth = s < 9 ? 2.5 : 3.5;
    ctxS.lineCap = "butt";
    ctxS.beginPath();
    lines.forEach(function (l) {
      var a = l.pts[0], b = l.pts[1];
      var d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      var ux = (b[0] - a[0]) / d, uy = (b[1] - a[1]) / d;
      ctxS.moveTo(a[0] + ux * 6, a[1] + uy * 6);
      ctxS.lineTo(a[0] + ux * 13, a[1] + uy * 13);
    });
    ctxS.stroke();

    // Vias at trace ends.
    ctxS.lineWidth = 1.25;
    ctxS.strokeStyle = "rgba(" + COPPER + ",0.4)";
    ctxS.fillStyle = "#07090d";
    lines.forEach(function (l) {
      if (!l.via) return;
      var e = l.pts[l.pts.length - 1];
      ctxS.beginPath(); ctxS.arc(e[0], e[1], 2.8, 0, Math.PI * 2); ctxS.fill(); ctxS.stroke();
    });
  }

  function pointAt(l, d) {
    if (d <= 0) return l.pts[0];
    if (d >= l.len) return l.pts[l.pts.length - 1];
    var i = 1;
    while (l.cum[i] < d) i++;
    var a = l.pts[i - 1], b = l.pts[i], t = (d - l.cum[i - 1]) / (l.cum[i] - l.cum[i - 1]);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }

  function spawn() {
    if (!lines.length) return;
    var l = lines[Math.floor(Math.random() * lines.length)];
    pulses.push({
      l: l, d: 0,
      v: 120 + Math.random() * 160,
      tail: 50 + Math.random() * 50,
      c: Math.random() < 0.75 ? CYAN : COPPER
    });
  }

  function frame(t) {
    if (!running) return;
    var dt = Math.min(0.05, (t - (lastT || t)) / 1000);
    lastT = t;

    var maxPulses = Math.max(6, Math.min(18, Math.round(lines.length / 7)));
    spawnTimer -= dt;
    if (spawnTimer <= 0 && pulses.length < maxPulses) { spawn(); spawnTimer = 0.12 + Math.random() * 0.3; }

    ctxP.clearRect(0, 0, W, H);
    ctxP.globalCompositeOperation = "lighter";
    ctxP.lineCap = "round"; ctxP.lineJoin = "round";

    for (var i = pulses.length - 1; i >= 0; i--) {
      var p = pulses[i];
      p.d += p.v * dt;
      var head = pointAt(p.l, p.d);
      var offscreen = head[0] < -60 || head[0] > W + 60 || head[1] < -60 || head[1] > H + 60;
      if (p.d - p.tail >= p.l.len || offscreen) {
        if (p.l.via && !offscreen) flashes.push({ x: head[0], y: head[1], a: 1, c: p.c });
        pulses.splice(i, 1);
        continue;
      }
      // Tail drawn in 6 steps of rising opacity.
      var steps = 6, prev = pointAt(p.l, p.d - p.tail);
      for (var k = 1; k <= steps; k++) {
        var pt = pointAt(p.l, p.d - p.tail + (p.tail * k) / steps);
        ctxP.strokeStyle = "rgba(" + p.c + "," + (0.9 * k / steps).toFixed(3) + ")";
        ctxP.lineWidth = 1.6;
        ctxP.beginPath(); ctxP.moveTo(prev[0], prev[1]); ctxP.lineTo(pt[0], pt[1]); ctxP.stroke();
        prev = pt;
      }
      if (p.d < p.l.len) {
        ctxP.fillStyle = "rgba(" + p.c + ",0.22)";
        ctxP.beginPath(); ctxP.arc(head[0], head[1], 5, 0, Math.PI * 2); ctxP.fill();
        ctxP.fillStyle = "rgba(255,255,255,0.85)";
        ctxP.beginPath(); ctxP.arc(head[0], head[1], 1.3, 0, Math.PI * 2); ctxP.fill();
      }
    }

    for (var f = flashes.length - 1; f >= 0; f--) {
      var fl = flashes[f];
      fl.a -= dt * 2.2;
      if (fl.a <= 0) { flashes.splice(f, 1); continue; }
      ctxP.fillStyle = "rgba(" + fl.c + "," + (0.5 * fl.a).toFixed(3) + ")";
      ctxP.beginPath(); ctxP.arc(fl.x, fl.y, 3 + (1 - fl.a) * 9, 0, Math.PI * 2); ctxP.fill();
    }
    ctxP.globalCompositeOperation = "source-over";

    rafId = requestAnimationFrame(frame);
  }

  function updateRunning() {
    var should = !reduceMotion && visible && !document.hidden;
    if (should && !running) { running = true; lastT = 0; rafId = requestAnimationFrame(frame); }
    else if (!should && running) { running = false; cancelAnimationFrame(rafId); }
  }

  // Rebuild when the hero changes size (debounced).
  var lastW = 0, lastH = 0, timer = 0;
  function onResize() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var w = hero.clientWidth, h = hero.clientHeight;
      if (w === lastW && h === lastH) return;
      lastW = w; lastH = h;
      build();
    }, 120);
  }

  build();
  lastW = hero.clientWidth; lastH = hero.clientHeight;
  if ("ResizeObserver" in window) new ResizeObserver(onResize).observe(hero);
  else window.addEventListener("resize", onResize);
  // Fonts can shift the layout slightly after first paint.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { lastW = 0; onResize(); });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; updateRunning(); }).observe(hero);
  }
  document.addEventListener("visibilitychange", updateRunning);
  updateRunning();
})();
