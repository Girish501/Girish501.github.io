// ALD supercycle figure (see _includes/fig-ald.html).
// Recipe: ZnO:Al supercycles, 600 cycles total. One supercycle is N ZnO cycles (DEZ, purge, H2O,
// purge) followed by one Al cycle (TMA, purge, H2O, purge). The ratio buttons set N.
// Timeline per play: the first ZnO cycle step by step, the rest of that supercycle quickly, the
// Al cycle step by step, then the remaining supercycles quickly while the film fills to 600 cycles.
(function () {
  "use strict";
  var fig = document.querySelector("[data-ald]");
  if (!fig) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";
  var TOTAL = 600;
  var SLOT = 63.5, X0 = 92;
  var FILM_TOP = 36, FILM_BOTTOM = 236, FILM_H = FILM_BOTTOM - FILM_TOP;

  var $ = function (id) { return document.getElementById(id); };
  var b = [$("ald-b0"), $("ald-b1"), $("ald-b2"), $("ald-b3")], bAl = $("ald-b0al");
  var film = $("ald-film"), lines = $("ald-lines"), tCycle = $("ald-cycle"), tSuper = $("ald-super"), tCount = $("ald-count");

  var n = parseInt(fig.getAttribute("data-ratio"), 10) || 19;
  var lineEls = [], raf = 0, t0 = 0, played = false;

  // Phase boundaries in ms.
  var STEP = 450;
  var A = 4 * STEP;          // ZnO cycle 1, step by step
  var B = A + 1600;          // ZnO cycles 2..N, fast
  var C = B + 4 * STEP;      // Al cycle, step by step
  var D = C + 3000;          // remaining supercycles, fast
  var END = D + 400;

  function build() {
    while (lines.firstChild) lines.removeChild(lines.firstChild);
    lineEls = [];
    var supers = Math.round(TOTAL / (n + 1));
    for (var k = 1; k <= supers; k++) {
      var y = FILM_BOTTOM - (k * (n + 1) / TOTAL) * FILM_H;
      var l = document.createElementNS(NS, "line");
      l.setAttribute("class", "ald-al");
      l.setAttribute("x1", 40); l.setAttribute("x2", 320); l.setAttribute("y1", y.toFixed(2)); l.setAttribute("y2", y.toFixed(2));
      lines.appendChild(l); lineEls.push({ el: l, at: k * (n + 1) });
    }
  }

  // Set the four blocks for one cycle. type: "zno" | "al". step: 0..3 or -1 for all. frac: 0..1 within the step.
  function setBlocks(type, step, frac, dim) {
    var isAl = type === "al";
    b[0].setAttribute("opacity", isAl ? 0 : (step < 0 ? dim : step > 0 ? .45 : step === 0 ? 1 : 0));
    bAl.setAttribute("opacity", isAl ? (step < 0 ? 1 : step > 0 ? .45 : step === 0 ? 1 : 0) : 0);
    for (var i = 1; i < 4; i++) b[i].setAttribute("opacity", step < 0 ? dim : i < step ? .45 : i === step ? 1 : 0);
    var cur = isAl && step === 0 ? bAl : (step >= 0 ? b[step] : null);
    [b[0], b[1], b[2], b[3], bAl].forEach(function (r) { r.setAttribute("width", SLOT); });
    if (cur) cur.setAttribute("width", Math.max(2, SLOT * frac));
  }

  function setFilm(cycles) {
    var h = cycles / TOTAL * FILM_H;
    film.setAttribute("y", (FILM_BOTTOM - h).toFixed(2));
    film.setAttribute("height", h.toFixed(2));
    lineEls.forEach(function (o) { o.el.setAttribute("opacity", cycles >= o.at ? 1 : 0); });
  }

  function render(t) {
    var supers = Math.round(TOTAL / (n + 1));
    var cycles, step, frac;
    if (t < A) {                                   // ZnO cycle 1
      step = Math.min(3, Math.floor(t / STEP)); frac = (t - step * STEP) / STEP;
      setBlocks("zno", step, frac, 0); cycles = step === 3 && frac > .9 ? 1 : 0;
      tCycle.textContent = "ZnO cycle 1 of " + n; tSuper.textContent = "supercycle 1 of " + supers;
    } else if (t < B) {                            // ZnO cycles 2..n, fast
      var p = (t - A) / (B - A); var c = 1 + Math.floor(p * (n - 1)); cycles = Math.min(n, c);
      setBlocks("zno", -1, 1, .35);
      tCycle.textContent = "ZnO cycle " + Math.max(1, cycles) + " of " + n; tSuper.textContent = "supercycle 1 of " + supers;
    } else if (t < C) {                            // Al cycle, step by step
      step = Math.min(3, Math.floor((t - B) / STEP)); frac = ((t - B) - step * STEP) / STEP;
      setBlocks("al", step, frac, 0); cycles = n + (step === 3 && frac > .9 ? 1 : 0);
      tCycle.textContent = "Al cycle"; tSuper.textContent = "supercycle 1 of " + supers;
    } else if (t < D) {                            // remaining supercycles, fast
      var q = (t - C) / (D - C); cycles = Math.min(TOTAL, (n + 1) + Math.floor(q * (TOTAL - (n + 1))));
      var inSuper = ((cycles - 1) % (n + 1)) + 1; var isAl = inSuper === n + 1;
      setBlocks(isAl ? "al" : "zno", -1, 1, .35);
      tCycle.textContent = isAl ? "Al cycle" : "ZnO cycle " + inSuper + " of " + n;
      tSuper.textContent = "supercycle " + Math.min(supers, Math.floor((cycles - 1) / (n + 1)) + 1) + " of " + supers;
    } else {                                       // done
      cycles = TOTAL; setBlocks("zno", -1, 1, .35);
      tCycle.textContent = "ZnO cycle " + n + " of " + n; tSuper.textContent = "supercycle " + supers + " of " + supers;
    }
    setFilm(cycles);
    tCount.textContent = cycles >= TOTAL ? "600 cycles · 85 to 88 nm" : cycles + " cycles";
  }

  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  function play() {
    stop(); played = true;
    if (reduce) { render(END); return; }
    t0 = 0;
    var frame = function (now) {
      if (!t0) t0 = now;
      var t = now - t0;
      render(Math.min(t, END));
      if (t < END) raf = requestAnimationFrame(frame); else raf = 0;
    };
    raf = requestAnimationFrame(frame);
  }

  fig.addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn) return;
    if (btn.hasAttribute("data-replay")) { play(); return; }
    var r = parseInt(btn.getAttribute("data-ratio"), 10);
    if (!r) return;
    n = r; fig.setAttribute("data-ratio", n);
    Array.prototype.forEach.call(fig.querySelectorAll("button[data-ratio]"), function (x) { x.setAttribute("aria-pressed", x === btn ? "true" : "false"); });
    build(); play();
  });

  build();
  render(END); // static final state until it scrolls into view
  if (reduce || !("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting && !played) { play(); io.disconnect(); } });
  }, { threshold: 0.4 });
  io.observe(fig);
})();
