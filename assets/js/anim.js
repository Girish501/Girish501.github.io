// Scroll-linked motion, the way apple.com does it: each element's state is a function of where it
// sits in the viewport, recomputed from scrollY on requestAnimationFrame, so it plays forward as it
// enters and back as it leaves. No library, no scroll hijacking.
//
// Markup: data-anim="rise|fade|count|settle|draw" with optional data-anim-start (fraction of the
// viewport height at which the element's top starts the motion, default .88), data-anim-span
// (fraction of the viewport height over which it completes, default .28) and data-anim-y (px).
//   rise   opacity 0 to 1 and a 12px upward slide
//   fade   opacity 0 to 1
//   count  the element's leading number counts up from 0 (formatting kept)
//   settle an image inside scales from 1.04 to 1 as it arrives
//   draw   an SVG path with pathLength="1" draws its stroke
// Reduced motion: nothing runs; the page is its final state.
(function () {
  "use strict";
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var els = Array.prototype.slice.call(document.querySelectorAll("[data-anim]"));
  if (!els.length) return;

  function easeOutQuad(x) { return 1 - (1 - x) * (1 - x); }
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  var items = els.map(function (el) {
    var type = el.getAttribute("data-anim") || "rise";
    var it = { el: el, type: type, start: parseFloat(el.getAttribute("data-anim-start")) || 0.88, span: parseFloat(el.getAttribute("data-anim-span")) || 0.28, y: parseFloat(el.getAttribute("data-anim-y")) || 12, last: -1 };
    if (type === "count") {
      // Only the element's first text node counts (for example "109 dBΩ"); child elements such as the
      // small label underneath are left alone.
      var node = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : null;
      var m = node ? /^(\s*)(\d[\d,]*(?:\.\d+)?)([\s\S]*)$/.exec(node.nodeValue) : null;
      if (m) { it.pre = m[1]; it.num = parseFloat(m[2].replace(/,/g, "")); it.dec = (m[2].split(".")[1] || "").length; it.post = m[3]; it.node = node; }
      else it.type = "fade";
    }
    if (type === "settle") { it.img = el.tagName === "IMG" ? el : el.querySelector("img"); if (!it.img) it.type = "fade"; }
    if (type === "draw") { it.path = el.tagName === "path" ? el : el.querySelector("path[pathLength]"); if (!it.path) it.type = "fade"; }
    return it;
  });

  function apply(it, p) {
    var e = easeOutQuad(p);
    var s = it.el.style;
    switch (it.type) {
      case "rise":
        s.opacity = e; s.transform = p >= 1 ? "" : "translateY(" + ((1 - e) * it.y).toFixed(2) + "px)"; break;
      case "fade":
        s.opacity = e; break;
      case "count":
        s.opacity = Math.min(1, e * 1.5);
        it.node.nodeValue = it.pre + (it.num * e).toFixed(it.dec) + it.post; break;
      case "settle":
        s.opacity = Math.min(1, e * 1.4);
        it.img.style.transform = p >= 1 ? "" : "scale(" + (1.04 - 0.04 * e).toFixed(4) + ")"; break;
      case "draw":
        s.opacity = Math.min(1, e * 1.4);
        it.path.style.strokeDasharray = "1"; it.path.style.strokeDashoffset = (1 - e).toFixed(4); break;
    }
  }

  var ticking = false, vh = window.innerHeight;
  function frame() {
    ticking = false;
    // Scroll left below this position; an element near the end of the page may never reach the
    // finish line before the page stops, so its finish line moves up to where it will be at the bottom.
    var remaining = Math.max(0, document.documentElement.scrollHeight - vh - window.scrollY);
    var tops = new Array(items.length), i;
    for (i = 0; i < items.length; i++) tops[i] = items[i].el.getBoundingClientRect().top;   // read everything first, then write
    for (i = 0; i < items.length; i++) {
      var it = items[i], top = tops[i], startY = vh * it.start, finish = vh * (it.start - it.span);
      var lowest = top - remaining; if (lowest > finish) finish = lowest;
      var denom = startY - finish;
      var p = denom > 1 ? clamp((startY - top) / denom) : (remaining <= 0 ? 1 : 0);
      if (p === it.last) continue;
      it.last = p;
      apply(it, p);
    }
  }
  function tick() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  items.forEach(function (it) { if (it.type === "count") it.node.nodeValue = it.pre + (0).toFixed(it.dec) + it.post; });
  frame();
  window.addEventListener("scroll", tick, { passive: true });
  window.addEventListener("resize", function () { vh = window.innerHeight; items.forEach(function (it) { it.last = -1; }); tick(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { items.forEach(function (it) { it.last = -1; }); tick(); });
})();
