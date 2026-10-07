// Scroll-driven effects on the home page.
//  1. Process bands: wafer cross-sections that run a cleanroom step as you scroll past them
//     (ALD film growth, lithography + etch, copper traces that then power on).
//  2. Spine: a copper trace down the left margin that routes itself as you scroll and
//     lights up each section's pin when the signal reaches it.
(function () {
  "use strict";
  var T = window.Traces;
  if (!T) return;
  var reduce = T.reduceMotion;

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function ease(x) { return 1 - Math.pow(1 - x, 3); }
  function fract(x) { return x - Math.floor(x); }
  function hash(i, j) { var s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); }

  var C = {
    bg: "#151b23", subTop: "#2c3542", subBot: "#222a35",
    copper: T.COPPER, cyan: T.CYAN, resist: "150,128,224", uv: "176,150,255"
  };

  // ---------- Shared cross-section pieces ----------

  function drawSubstrate(ctx, w, h, subTop) {
    var g = ctx.createLinearGradient(0, subTop, 0, h);
    g.addColorStop(0, C.subTop); g.addColorStop(1, C.subBot);
    ctx.fillStyle = g; ctx.fillRect(0, subTop, w, h - subTop);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (var x = 3; x < w; x += 6) for (var y = subTop + 4; y < h; y += 6) ctx.fillRect(x, y, 1, 1);
  }

  function rowColor(k, a) {
    return k % 7 === 6 ? "rgba(" + C.cyan + "," + (0.8 * a) + ")" : "rgba(" + C.copper + "," + ((k % 2 ? 0.5 : 0.72) * a) + ")";
  }

  // Completed AZO film as atomic rows (cheap version for the litho band).
  function drawFilm(ctx, w, top, rows, rowH) {
    for (var k = 0; k < rows; k++) {
      ctx.fillStyle = rowColor(k, 0.85);
      ctx.fillRect(0, top + (rows - 1 - k) * rowH, w, rowH - 1);
    }
  }

  // ---------- Band 1: ALD ----------

  function drawALD(b, p) {
    var ctx = b.ctx, w = b.w, h = b.h, small = w < 700;
    var subTop = Math.round(h * 0.74);
    var rowH = small ? 3 : 4, cell = rowH;
    var rowsMax = Math.floor((h * 0.3) / rowH);
    var film = p * rowsMax, full = Math.floor(film), frac = film - full;
    if (p >= 0.999) { full = rowsMax; frac = 0; }

    ctx.clearRect(0, 0, w, h);
    drawSubstrate(ctx, w, h, subTop);

    for (var k = 0; k < full; k++) {
      ctx.fillStyle = rowColor(k, 1);
      var y = subTop - (k + 1) * rowH;
      for (var x = 0; x < w; x += cell) ctx.fillRect(x + 0.5, y + 0.5, cell - 1.2, rowH - 1.2);
    }
    // Partially filled row: each surface site reacts once (self-limiting).
    if (full < rowsMax && frac > 0) {
      ctx.fillStyle = rowColor(full, 1);
      var yp = subTop - (full + 1) * rowH;
      for (var i = 0, xx = 0; xx < w; xx += cell, i++) if (hash(i, full) < frac) ctx.fillRect(xx + 0.5, yp + 0.5, cell - 1.2, rowH - 1.2);
    }

    // Precursor pulses: metal precursor (DEZ, or TMA every 7th cycle) then H2O.
    var cycle = Math.min(full, rowsMax - 1);
    var metalHalf = frac < 0.5;
    var isAl = cycle % 7 === 6;
    var name = metalHalf ? (isAl ? "TMA" : "DEZ") : "H₂O";
    var col = metalHalf ? (isAl ? "235,240,245" : C.copper) : C.cyan;
    var surf = subTop - full * rowH;
    if (p > 0.01 && p < 0.995) {
      var M = small ? 26 : 54;
      for (var m = 0; m < M; m++) {
        var q = fract(p * rowsMax * 1.5 + hash(m, 7));
        var px = hash(m, 3) * w + Math.sin(q * 6 + m) * 4;
        var py = 8 + q * (surf - 14);
        var a = (q < 0.1 ? q * 10 : 1) * 0.9;
        ctx.fillStyle = "rgba(" + col + "," + a.toFixed(2) + ")";
        ctx.beginPath(); ctx.arc(px, py, 2.3, 0, 6.2832); ctx.fill();
        if (metalHalf) { // ligands
          ctx.beginPath(); ctx.arc(px - 3.6, py - 1.5, 1.2, 0, 6.2832); ctx.arc(px + 3.6, py - 1.5, 1.2, 0, 6.2832); ctx.fill();
        }
      }
    }
    b.label.textContent = p >= 0.995
      ? "Atomic layer deposition · " + rowsMax + " cycles · film complete"
      : "Atomic layer deposition · cycle " + (cycle + 1) + " · " + name + " pulse";
  }

  // ---------- Band 2: Lithography + etch ----------

  function drawLitho(b, p) {
    var ctx = b.ctx, w = b.w, h = b.h, small = w < 700;
    var subTop = Math.round(h * 0.74);
    var rowH = small ? 3 : 4, rows = Math.floor((h * 0.17) / rowH);
    var F = rows * rowH, filmTop = subTop - F;
    var Rt = Math.round(h * 0.13), rTop = filmTop - Rt;
    var P = small ? 54 : 72, open = Math.round(P * 0.42), off = Math.round(P * 0.29);

    var a = seg(p, 0.0, 0.18), bb = seg(p, 0.18, 0.40), c = seg(p, 0.40, 0.55), d = seg(p, 0.55, 0.82), e = seg(p, 0.82, 1);

    ctx.clearRect(0, 0, w, h);
    drawSubstrate(ctx, w, h, subTop);
    drawFilm(ctx, w, filmTop, rows, rowH);

    // Etch: clear the film (then a shallow trench) in the openings.
    var depth = ease(d) * (F + h * 0.07);
    if (depth > 0) {
      ctx.fillStyle = C.bg;
      for (var x0 = off; x0 < w; x0 += P) ctx.fillRect(x0, filmTop - 1, open, depth + 1);
    }

    // Resist.
    var span = ease(a) * w, cx = w / 2;
    var expose = seg(bb, 0.45, 1);
    var resistA = 1 - e;
    if (span > 0 && resistA > 0) {
      var thick = Rt * (1 - 0.4 * e);
      ctx.fillStyle = "rgba(" + C.resist + "," + (0.55 * resistA).toFixed(3) + ")";
      ctx.fillRect(cx - span / 2, filmTop - thick, span, thick);
      // Exposed regions: lighter while exposing, then dissolve during develop.
      if (expose > 0) {
        for (var x1 = off; x1 < w; x1 += P) {
          ctx.fillStyle = C.bg;
          ctx.fillRect(x1, filmTop - thick - 1, open, thick + 1);
          var left = thick * (1 - ease(c));
          if (left > 0.5) {
            ctx.fillStyle = "rgba(" + C.uv + "," + (0.35 + 0.35 * expose).toFixed(3) + ")";
            ctx.fillRect(x1, filmTop - left, open, left);
          }
        }
      }
    }

    // Mask comes down, UV through the openings, mask leaves for develop.
    if (bb > 0 && c < 1) {
      var down = ease(Math.min(1, bb * 2.2));
      var maskY = -12 + (rTop - 22 + 12) * down - c * (rTop + 10);
      var maskH = 7;
      ctx.fillStyle = "rgba(200,210,222,0.85)";
      var x2 = 0;
      for (var x3 = off; x2 < w; x3 += P) { ctx.fillRect(x2, maskY, Math.max(0, x3 - x2), maskH); x2 = x3 + open; }
      if (expose > 0 && c === 0) {
        for (var x4 = off; x4 < w; x4 += P) {
          var g = ctx.createLinearGradient(0, maskY + maskH, 0, rTop);
          g.addColorStop(0, "rgba(" + C.uv + "," + (0.5 * expose).toFixed(3) + ")");
          g.addColorStop(1, "rgba(" + C.uv + "," + (0.12 * expose).toFixed(3) + ")");
          ctx.fillStyle = g; ctx.fillRect(x4, maskY + maskH, open, rTop - maskY - maskH);
        }
      }
    }

    // Plasma ions during etch.
    if (d > 0 && d < 1) {
      ctx.strokeStyle = "rgba(" + C.cyan + ",0.75)"; ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (var x5 = off, n = 0; x5 < w; x5 += P, n++) {
        for (var k = 0; k < 3; k++) {
          var q = fract(p * 14 + hash(n, k));
          var ix = x5 + 4 + hash(n, k + 9) * (open - 8), iy = 6 + q * (filmTop + depth - 12);
          ctx.moveTo(ix, iy); ctx.lineTo(ix, iy + 6);
        }
      }
      ctx.stroke();
    }

    var step = p < 0.18 ? "Spin coat resist" : p < 0.40 ? "UV exposure" : p < 0.55 ? "Develop" : p < 0.82 ? "Plasma etch (RIE)" : p < 0.995 ? "Strip resist" : "Pattern transferred";
    b.label.textContent = "Lithography · " + step;
  }

  // ---------- Band 3: copper traces, then power on ----------

  function buildMetal(b) {
    var w = b.w, h = b.h, small = w < 700;
    var S = small ? 30 : 42, cy = h / 2, pitch = S / 5;
    var chips = [{ x: w * (small ? 0.26 : 0.3), y: cy }, { x: w * (small ? 0.74 : 0.7), y: cy }];
    var lines = [];
    function bus(centerPts, n) {
      for (var k = 0; k < n; k++) lines.push(T.line(T.offset(centerPts, (k - (n - 1) / 2) * pitch)));
    }
    var A = chips[0], B = chips[1], hs = S / 2;
    bus([[A.x + hs, A.y], [B.x - hs, B.y]], 4);                                            // A -> B
    var j = pitch * 2;
    bus([[A.x - hs, A.y], [A.x - hs - 40, A.y], [A.x - hs - 40 - j, A.y + j], [-20, A.y + j]], 3);   // A -> left edge
    bus([[B.x + hs, B.y], [B.x + hs + 40, B.y], [B.x + hs + 40 + j, B.y - j], [w + 20, B.y - j]], 3); // B -> right edge
    var up = cy - hs - 10;
    [[A, -1], [B, 1]].forEach(function (cfg) {
      var ch = cfg[0], dir = cfg[1];
      [-1, 1].forEach(function (v) {
        var y0 = ch.y + v * hs, y1 = ch.y + v * (hs + 10);
        var d = Math.max(4, up - 14);
        bus([[ch.x, y0], [ch.x, y1], [ch.x + dir * d, y1 + v * d]], 3);
      });
    });
    lines.forEach(function (l) {
      var e = l.pts[l.pts.length - 1];
      l.via = e[0] > 0 && e[0] < w && e[1] > 0 && e[1] < h;
    });
    b.metal = { chips: chips, S: S, lines: lines, pulses: [], spawn: 0, maxLen: Math.max.apply(null, lines.map(function (l) { return l.len; })) };
  }

  function drawMetal(b, p, dt) {
    var ctx = b.ctx, w = b.w, h = b.h, m = b.metal;
    var dep = seg(p, 0.04, 0.6), on = p >= 0.62;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(166,177,190,0.06)";
    for (var gx = 12; gx < w; gx += 24) for (var gy = 12; gy < h; gy += 24) ctx.fillRect(gx, gy, 1, 1);

    // Sputtered copper raining in at an angle while traces form.
    if (dep > 0 && dep < 1) {
      ctx.fillStyle = "rgba(" + C.copper + ",0.55)";
      for (var i = 0; i < (w < 700 ? 30 : 60); i++) {
        var q = fract(p * 9 + hash(i, 1));
        ctx.fillRect(hash(i, 2) * w + q * 30, q * h, 1.6, 1.6);
      }
    }

    var upTo = ease(dep) * m.maxLen;
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(" + C.copper + "," + (on ? 0.6 : 0.5) + ")";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    m.lines.forEach(function (l) { T.tracePath(ctx, l, upTo); });
    ctx.stroke();

    // Growing tips.
    if (dep > 0 && dep < 1) {
      ctx.fillStyle = "rgba(255,226,180,0.9)";
      m.lines.forEach(function (l) {
        if (upTo < l.len) { var t = T.pointAt(l, upTo); ctx.beginPath(); ctx.arc(t[0], t[1], 1.6, 0, 6.2832); ctx.fill(); }
      });
    }
    // Vias.
    ctx.lineWidth = 1.25; ctx.strokeStyle = "rgba(" + C.copper + ",0.6)"; ctx.fillStyle = C.bg;
    m.lines.forEach(function (l) {
      if (l.via && upTo >= l.len) { var e = l.pts[l.pts.length - 1]; ctx.beginPath(); ctx.arc(e[0], e[1], 2.8, 0, 6.2832); ctx.fill(); ctx.stroke(); }
    });

    // Packages.
    m.chips.forEach(function (ch) {
      var s = m.S, x = ch.x - s / 2, y = ch.y - s / 2;
      ctx.fillStyle = "#1e2732"; ctx.strokeStyle = on ? "rgba(" + C.copper + ",0.8)" : "#364251"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.rect(x, y, s, s); ctx.fill(); ctx.stroke();
      ctx.fillStyle = on ? "rgb(" + C.cyan + ")" : "#364251";
      ctx.beginPath(); ctx.arc(x + 5, y + 5, 2, 0, 6.2832); ctx.fill();
      if (on) { ctx.fillStyle = "rgba(" + C.cyan + ",0.18)"; ctx.beginPath(); ctx.arc(x + 5, y + 5, 6, 0, 6.2832); ctx.fill(); }
    });

    // Signals once powered.
    if (on && !reduce) {
      m.spawn -= dt;
      if (m.spawn <= 0 && m.pulses.length < 10) {
        m.pulses.push({ l: m.lines[Math.floor(Math.random() * m.lines.length)], d: 0, v: 90 + Math.random() * 110, tail: 34, c: Math.random() < 0.7 ? C.cyan : C.copper, rev: Math.random() < 0.5 });
        m.spawn = 0.1 + Math.random() * 0.25;
      }
      ctx.globalCompositeOperation = "lighter";
      for (var k = m.pulses.length - 1; k >= 0; k--) {
        var pu = m.pulses[k];
        pu.d += pu.v * dt;
        if (pu.d - pu.tail > pu.l.len) { m.pulses.splice(k, 1); continue; }
        T.drawPulse(ctx, pu.l, pu.d, pu.tail, pu.c, pu.rev);
      }
      ctx.globalCompositeOperation = "source-over";
    } else if (!on) {
      m.pulses.length = 0;
    }
    b.label.textContent = on ? "Metallization · power on" : "Metallization · sputtering copper";
  }

  // ---------- Band plumbing ----------

  var DRAW = { ald: drawALD, litho: drawLitho, metal: drawMetal };
  var bands = Array.prototype.map.call(document.querySelectorAll(".fab-band"), function (el) {
    var canvas = el.querySelector("canvas");
    return { el: el, canvas: canvas, ctx: canvas.getContext("2d"), label: el.querySelector(".fab-label"),
             kind: el.getAttribute("data-process"), p: -1, visible: false, w: 0, h: 0 };
  }).filter(function (b) { return DRAW[b.kind]; });

  function sizeBands() {
    bands.forEach(function (b) {
      var s = T.fit(b.canvas, b.ctx); b.w = s.w; b.h = s.h;
      if (b.kind === "metal") buildMetal(b);
      b.p = -1;
    });
  }

  function progress(b, vh) {
    if (reduce) return 1;
    var r = b.el.getBoundingClientRect();
    // 0 when the band's top enters at the bottom; 1 when its middle reaches 35% from the top.
    return clamp((vh - r.top) / (vh * 0.65 + r.height * 0.5), 0, 1);
  }

  var lastFrame = 0, loopId = 0;
  function loop(t) {
    var dt = lastFrame ? Math.min(0.05, (t - lastFrame) / 1000) : 0;
    lastFrame = t;
    var vh = window.innerHeight, needsLoop = false;
    bands.forEach(function (b) {
      if (!b.visible) return;
      var p = progress(b, vh);
      var live = b.kind === "metal" && p >= 0.62 && !reduce;
      if (live || Math.abs(p - b.p) > 0.0005) { DRAW[b.kind](b, p, dt); b.p = p; }
      if (live) needsLoop = true;
    });
    updateSpine(vh);
    loopId = needsLoop && !document.hidden ? requestAnimationFrame(loop) : 0;
    if (!loopId) lastFrame = 0;
  }
  function kick() { if (!loopId) loopId = requestAnimationFrame(loop); }

  // ---------- Spine ----------

  var main = document.getElementById("main");
  var heads = Array.prototype.slice.call(document.querySelectorAll(".section-head h2"));
  var spine = null;
  var NS = "http://www.w3.org/2000/svg";

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function buildSpine() {
    if (spine) { if (spine.svg) spine.svg.remove(); spine = null; }
    heads.forEach(function (h) { h.classList.remove("lit"); });
    if (!main || !heads.length) return;
    var mainBox = main.getBoundingClientRect();
    var top0 = mainBox.top + window.scrollY;
    var heroEl = document.querySelector(".hero");
    var info = heads.map(function (h) {
      var pin = h.querySelector(".pin") || h;
      var r = pin.getBoundingClientRect();
      return { h: h, y: r.top + window.scrollY - top0 + r.height / 2, left: r.left - mainBox.left };
    });
    var show = window.innerWidth >= 900;
    spine = { info: info, top0: top0, show: show };
    if (!show) return;

    var xs = Math.round(info[0].left - 22);
    var y0 = heroEl ? heroEl.getBoundingClientRect().bottom + window.scrollY - top0 : 0;
    var endEl = document.querySelector(".section--cta");
    var yEnd = endEl ? endEl.getBoundingClientRect().top + window.scrollY - top0 + 60 : info[info.length - 1].y + 200;

    var d = "M" + xs + " " + y0, prevY = y0;
    function component(ym, kind) {
      if (kind === 0) { // resistor
        d += " L" + xs + " " + (ym - 18) + " l5 3 l-10 6 l10 6 l-10 6 l10 6 l-10 6 l5 3";
      } else {          // inductor
        d += " L" + xs + " " + (ym - 16);
        for (var i = 0; i < 4; i++) d += " a4 4 0 0 1 0 8";
      }
    }
    info.forEach(function (it, i) {
      if (i > 0) component((prevY + it.y) / 2, i % 2);
      d += " L" + xs + " " + it.y;
      prevY = it.y;
    });
    component((prevY + yEnd) / 2, info.length % 2);
    d += " L" + xs + " " + yEnd;

    var svg = el("svg", { "class": "spine", width: main.clientWidth, height: main.scrollHeight, "aria-hidden": "true" });
    el("path", { d: d, "class": "spine-base" }, svg);
    var live = el("path", { d: d, "class": "spine-live" }, svg);
    var branches = info.map(function (it) {
      var len = Math.max(2, it.left - 4 - xs);
      var br = el("path", { d: "M" + xs + " " + it.y + " h" + len, "class": "spine-br" }, svg);
      br.style.strokeDasharray = len; br.style.strokeDashoffset = len;
      var jn = el("circle", { cx: xs, cy: it.y, r: 3.2, "class": "spine-jn" }, svg);
      return { br: br, jn: jn };
    });
    var endVia = el("circle", { cx: xs, cy: yEnd, r: 3.5, "class": "spine-jn" }, svg);
    var head = el("circle", { r: 3.6, "class": "spine-head" }, svg);
    main.appendChild(svg);

    var total = live.getTotalLength();
    var samples = [];
    for (var s = 0; s <= total; s += 4) { var pt = live.getPointAtLength(s); samples.push([s, pt.x, pt.y]); }
    var last = live.getPointAtLength(total); samples.push([total, last.x, last.y]);
    live.style.strokeDasharray = total;
    live.style.strokeDashoffset = total;

    spine.svg = svg; spine.live = live; spine.total = total; spine.samples = samples;
    spine.branches = branches; spine.head = head; spine.endVia = endVia; spine.y0 = y0; spine.yEnd = yEnd;
  }

  function updateSpine(vh) {
    if (!spine) return;
    var front = reduce ? Infinity : window.scrollY + vh * 0.6 - spine.top0;
    spine.info.forEach(function (it, i) {
      var on = front >= it.y;
      it.h.classList.toggle("lit", on);
      if (spine.branches) {
        spine.branches[i].br.style.strokeDashoffset = on ? 0 : spine.branches[i].br.style.strokeDasharray;
        spine.branches[i].jn.classList.toggle("on", on);
      }
    });
    if (!spine.show) return;
    var S = spine.samples, lo = 0, hi = S.length - 1;
    if (front <= spine.y0) { spine.live.style.strokeDashoffset = spine.total; spine.head.style.opacity = 0; return; }
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (S[mid][2] <= front) lo = mid; else hi = mid - 1; }
    var smp = S[lo];
    spine.live.style.strokeDashoffset = spine.total - smp[0];
    var done = smp[0] >= spine.total - 1;
    spine.head.setAttribute("cx", smp[1]); spine.head.setAttribute("cy", smp[2]);
    spine.head.style.opacity = done ? 0 : 1;
    spine.endVia.classList.toggle("on", done);
  }

  // ---------- Wiring ----------

  function relayout() { sizeBands(); buildSpine(); kick(); }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        bands.forEach(function (b) { if (b.el === e.target) b.visible = e.isIntersecting; });
      });
      kick();
    }, { rootMargin: "60px 0px" });
    bands.forEach(function (b) { io.observe(b.el); });
  } else {
    bands.forEach(function (b) { b.visible = true; });
  }

  window.addEventListener("scroll", kick, { passive: true });
  var rt = 0, lastW = window.innerWidth;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      // Phones fire resize when the URL bar hides; only rebuild bands when the width changes.
      if (window.innerWidth !== lastW) { lastW = window.innerWidth; sizeBands(); }
      buildSpine(); kick();
    }, 150);
  });
  document.addEventListener("visibilitychange", kick);
  if ("ResizeObserver" in window && main) {
    var lastH = main.scrollHeight;
    new ResizeObserver(function () {
      if (Math.abs(main.scrollHeight - lastH) > 2) { lastH = main.scrollHeight; buildSpine(); kick(); }
    }).observe(main);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { buildSpine(); kick(); });

  relayout();
})();
