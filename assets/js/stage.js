// Pinned stages (the AZO case study, the TIA case). On wide, tall screens a stage sticks for a few
// screens of scroll: its figure follows the scroll position and the text steps swap one after another.
// data-stage-at lists the progress values where the steps change (default 0.34 and 0.68);
// data-stage-mq is the media query that allows pinning (default: at least 1024 x 700).
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
  var mq = window.matchMedia(stage.getAttribute("data-stage-mq") || "(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)");
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
    stage.setAttribute("data-active", i);   // lets CSS pick the static figure for this step when no cloud runs
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
      // Step 0 (What and why) plays the first ZnO cycle valve by valve; from step 1 the rest of the recipe
      // (the fast ZnO cycles, the Al cycle step by step, then the fill) runs through Process and Results
      // and finishes at p 0.96, so the panel is never static.
      var a = (fig.ald.CYCLE1 || 0.21 * fig.ald.END) / fig.ald.END, q;
      if (p < at[0]) q = a * Math.min(1, p / Math.max(0.05, at[0] - 0.02));
      else q = a + (1 - a) * Math.min(1, (p - at[0]) / (0.96 - at[0]));
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
    window.dispatchEvent(new Event("cloud:mounted"));   // the stage just grew by a few screens: clouds below measure again
  }

  function disable() {
    if (!active) return;
    active = false;
    caseEl.classList.remove("is-pinned");
    window.removeEventListener("scroll", onScroll);
    steps.forEach(function (s) { s.classList.remove("is-past"); s.classList.add("is-active"); });
    current = -1;
    if (fig && fig.ald) { fig.ald.scrub = false; fig.ald.render(fig.ald.END); }
    window.dispatchEvent(new Event("cloud:mounted"));
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
