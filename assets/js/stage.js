// Pinned stages (the AZO case study, the TIA case). On wide, tall screens a stage sticks for a few
// screens of scroll: its figure follows the scroll position and the text steps swap one after another.
// data-stage-at lists the progress values where the steps change (default 0.34 and 0.68).
// Elsewhere (narrow or short screens, reduced motion) nothing pins and the content stacks.
// Native scroll only: progress is read from scrollY on requestAnimationFrame.
(function () {
  "use strict";
  Array.prototype.forEach.call(document.querySelectorAll("[data-stage]"), setup);
  function setup(stage) {
  var at = (stage.getAttribute("data-stage-at") || "0.34,0.68").split(",").map(parseFloat);
  var caseEl = stage.closest(".case") || stage.parentElement;
  var steps = Array.prototype.slice.call(stage.querySelectorAll(".stage-step"));
  var fig = stage.querySelector("[data-ald]");
  var pin = stage.querySelector(".stage-pin");
  var mq = window.matchMedia("(min-width: 1024px) and (min-height: 860px) and (prefers-reduced-motion: no-preference)");
  var nav = 60;
  var active = false, ticking = false, top = 0, span = 1, current = -1;

  function measure() {
    var navEl = document.querySelector(".nav");
    nav = navEl ? navEl.offsetHeight : 60;
    top = stage.getBoundingClientRect().top + window.scrollY - nav;
    span = Math.max(1, stage.offsetHeight - pin.offsetHeight);
  }

  function setStep(i) {
    if (i === current) return;
    current = i;
    steps.forEach(function (s, k) {
      s.classList.toggle("is-active", k === i);
      s.classList.toggle("is-past", k < i);
    });
  }

  function update() {
    ticking = false;
    if (!active) return;
    var p = (window.scrollY - top) / span;
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    setStep(p < at[0] ? 0 : p < at[1] ? 1 : 2);
    if (fig && fig.ald) {
      var q = (p - 0.04) / 0.92; q = q < 0 ? 0 : q > 1 ? 1 : q;
      fig.ald.render(q * fig.ald.END);
    }
  }

  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  function enable() {
    if (active) return;
    active = true;
    caseEl.classList.add("is-pinned");
    if (fig && fig.ald) { fig.ald.scrub = true; fig.ald.stop(); }
    measure(); current = -1; update();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function disable() {
    if (!active) return;
    active = false;
    caseEl.classList.remove("is-pinned");
    window.removeEventListener("scroll", onScroll);
    steps.forEach(function (s) { s.classList.remove("is-past"); s.classList.add("is-active"); });
    current = -1;
    if (fig && fig.ald) { fig.ald.scrub = false; fig.ald.render(fig.ald.END); }
  }

  function apply() { if (mq.matches) enable(); else disable(); }

  var rt = 0;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { apply(); if (active) { measure(); update(); } }, 120); });
  if (mq.addEventListener) mq.addEventListener("change", apply); else if (mq.addListener) mq.addListener(apply);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (active) { measure(); update(); } });
  window.addEventListener("load", function () { if (active) { measure(); update(); } });
  window.addEventListener("cloud:mounted", function () { if (active) { measure(); update(); } });   // the hero grows when its cloud mounts

  apply();
  }
})();
