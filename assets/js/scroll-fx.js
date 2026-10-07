// Scroll-driven process strip on the home page: a wafer cross-section where an ALD film
// (DEZ / TMA / H2O pulses) grows one atomic layer per cycle as you scroll past it.
(function () {
  "use strict";
  var T = window.Traces;
  if (!T) return;
  var reduce = T.reduceMotion;

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function fract(x) { return x - Math.floor(x); }
  function hash(i, j) { var s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); }

  var C = {
    bg: "#151b23", subTop: "#2c3542", subBot: "#222a35",
    copper: T.COPPER, cyan: T.CYAN
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
    var title = small ? "ALD" : "Atomic layer deposition";
    b.label.textContent = p >= 0.995
      ? title + " · " + rowsMax + " cycles · film complete"
      : title + " · cycle " + (cycle + 1) + " · " + name + " pulse";
  }

  // ---------- Plumbing ----------

  var bands = Array.prototype.map.call(document.querySelectorAll('.fab-band[data-process="ald"]'), function (el) {
    var canvas = el.querySelector("canvas");
    return { el: el, canvas: canvas, ctx: canvas.getContext("2d"), label: el.querySelector(".fab-label"), p: -1, visible: false, w: 0, h: 0 };
  });
  if (!bands.length) return;

  function sizeBands() {
    bands.forEach(function (b) { var s = T.fit(b.canvas, b.ctx); b.w = s.w; b.h = s.h; b.p = -1; });
  }

  function progress(b, vh) {
    if (reduce) return 1;
    var r = b.el.getBoundingClientRect();
    // 0 when the strip's top enters at the bottom; 1 when its middle reaches 35% from the top.
    return clamp((vh - r.top) / (vh * 0.65 + r.height * 0.5), 0, 1);
  }

  var ticking = false;
  function draw() {
    ticking = false;
    var vh = window.innerHeight;
    bands.forEach(function (b) {
      if (!b.visible) return;
      var p = progress(b, vh);
      if (Math.abs(p - b.p) > 0.0005) { drawALD(b, p); b.p = p; }
    });
  }
  function kick() { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }

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
      // Phones fire resize when the URL bar hides; only resize the canvas when the width changes.
      if (window.innerWidth !== lastW) { lastW = window.innerWidth; sizeBands(); }
      kick();
    }, 150);
  });

  sizeBands();
  kick();
})();
