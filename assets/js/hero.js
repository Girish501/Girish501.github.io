// Hero background: parallel copper trace buses routed across the hero with 45° jogs,
// and signal pulses running along them. Traces are drawn once per resize; only pulses animate.
(function () {
  "use strict";
  var T = window.Traces;
  var hero = document.querySelector(".hero");
  if (!T || !hero) return;
  var cvStatic = hero.querySelector(".hero-canvas--static");
  var cvPulse = hero.querySelector(".hero-canvas--pulses");
  if (!cvStatic || !cvPulse || !cvStatic.getContext) return;
  var ctxS = cvStatic.getContext("2d"), ctxP = cvPulse.getContext("2d");

  var W = 0, H = 0, lines = [], pulses = [], flashes = [];
  var running = false, visible = true, rafId = 0, lastT = 0, spawnTimer = 0;

  function build() {
    var size = T.fit(cvStatic, ctxS); T.fit(cvPulse, ctxP);
    W = size.w; H = size.h;
    var rand = T.rng(5360);
    var small = W < 700;
    var pitch = small ? 7 : 9;
    var gap = small ? 58 : 74;        // vertical spacing between buses; jogs stay inside it
    lines = [];

    for (var y = 26 + rand() * 12; y < H - 16; y += gap * (0.85 + rand() * 0.3)) {
      var n = 2 + Math.floor(rand() * 3);
      var maxJog = (gap - n * pitch) / 2;
      var x = rand() < 0.6 ? -20 : W * (0.05 + rand() * 0.5);
      var startsInside = x > 0;
      var pts = [[x, y]], dy = 0;
      var stopAt = rand() < 0.55 ? W + 40 : W * (0.45 + rand() * 0.5);
      while (x < stopAt) {
        x += 60 + rand() * (small ? 120 : 220);
        pts.push([Math.min(x, stopAt), y + dy]);
        if (x >= stopAt) break;
        // 45° jog up or down, kept within this bus's band.
        var j = pitch * (1.5 + Math.floor(rand() * 2));
        var dir = dy + j > maxJog ? -1 : dy - j < -maxJog ? 1 : (rand() < 0.5 ? -1 : 1);
        dy += dir * j; x += j;
        pts.push([x, y + dy]);
      }
      var endsInside = pts[pts.length - 1][0] < W;
      for (var k = 0; k < n; k++) {
        var l = T.line(T.offset(pts, (k - (n - 1) / 2) * pitch));
        if (endsInside) l = T.line(l.pts, l.len - rand() * 40);
        l.viaStart = startsInside; l.viaEnd = endsInside;
        lines.push(l);
      }
    }
    drawStatic();
    pulses = []; flashes = [];
  }

  function drawStatic() {
    ctxS.clearRect(0, 0, W, H);
    ctxS.fillStyle = "rgba(166,177,190,0.07)";
    for (var gx = 12; gx < W; gx += 24) for (var gy = 12; gy < H; gy += 24) ctxS.fillRect(gx, gy, 1, 1);

    ctxS.lineJoin = "round"; ctxS.lineCap = "round";
    ctxS.strokeStyle = "rgba(" + T.COPPER + ",0.2)";
    ctxS.lineWidth = 1.3;
    ctxS.beginPath();
    lines.forEach(function (l) { T.tracePath(ctxS, l); });
    ctxS.stroke();

    ctxS.lineWidth = 1.25;
    ctxS.strokeStyle = "rgba(" + T.COPPER + ",0.45)";
    ctxS.fillStyle = "#11161d";
    lines.forEach(function (l) {
      [l.viaStart && l.pts[0], l.viaEnd && l.pts[l.pts.length - 1]].forEach(function (p) {
        if (!p) return;
        ctxS.beginPath(); ctxS.arc(p[0], p[1], 2.8, 0, 6.2832); ctxS.fill(); ctxS.stroke();
      });
    });
  }

  function frame(t) {
    if (!running) return;
    var dt = Math.min(0.05, (t - (lastT || t)) / 1000);
    lastT = t;
    var maxPulses = Math.max(5, Math.min(14, Math.round(lines.length / 4)));
    spawnTimer -= dt;
    if (spawnTimer <= 0 && pulses.length < maxPulses && lines.length) {
      pulses.push({
        l: lines[Math.floor(Math.random() * lines.length)], d: 0,
        v: 110 + Math.random() * 150, tail: 50 + Math.random() * 50,
        c: Math.random() < 0.75 ? T.CYAN : T.COPPER, rev: Math.random() < 0.35
      });
      spawnTimer = 0.15 + Math.random() * 0.35;
    }

    ctxP.clearRect(0, 0, W, H);
    ctxP.globalCompositeOperation = "lighter";
    ctxP.lineCap = "round";
    for (var i = pulses.length - 1; i >= 0; i--) {
      var p = pulses[i];
      p.d += p.v * dt;
      if (p.d - p.tail >= p.l.len) {
        var endVia = p.rev ? p.l.viaStart : p.l.viaEnd;
        if (endVia) { var e = T.pointAt(p.l, p.rev ? 0 : p.l.len); flashes.push({ x: e[0], y: e[1], a: 1, c: p.c }); }
        pulses.splice(i, 1); continue;
      }
      T.drawPulse(ctxP, p.l, p.d, p.tail, p.c, p.rev);
    }
    for (var f = flashes.length - 1; f >= 0; f--) {
      var fl = flashes[f];
      fl.a -= dt * 2.2;
      if (fl.a <= 0) { flashes.splice(f, 1); continue; }
      ctxP.fillStyle = "rgba(" + fl.c + "," + (0.5 * fl.a).toFixed(3) + ")";
      ctxP.beginPath(); ctxP.arc(fl.x, fl.y, 3 + (1 - fl.a) * 9, 0, 6.2832); ctxP.fill();
    }
    ctxP.globalCompositeOperation = "source-over";
    rafId = requestAnimationFrame(frame);
  }

  function updateRunning() {
    var should = !T.reduceMotion && visible && !document.hidden;
    if (should && !running) { running = true; lastT = 0; rafId = requestAnimationFrame(frame); }
    else if (!should && running) { running = false; cancelAnimationFrame(rafId); }
  }

  var lastW = 0, lastH = 0, timer = 0;
  function onResize() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (hero.clientWidth === lastW && hero.clientHeight === lastH) return;
      lastW = hero.clientWidth; lastH = hero.clientHeight;
      build();
    }, 120);
  }

  build();
  lastW = hero.clientWidth; lastH = hero.clientHeight;
  if ("ResizeObserver" in window) new ResizeObserver(onResize).observe(hero);
  else window.addEventListener("resize", onResize);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; updateRunning(); }).observe(hero);
  }
  document.addEventListener("visibilitychange", updateRunning);
  updateRunning();
})();
