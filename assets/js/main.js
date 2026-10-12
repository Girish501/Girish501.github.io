// Scroll-in reveals and click-to-enlarge photos. No dependencies.
(function () {
  "use strict";

  // ---- Scroll-in reveal ----
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // ---- SVG animations: play once when scrolled into view, then hold the last frame ----
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Tweens the text of an element from data-from to data-to (used for the counters).
  function tween(el) {
    var from = parseFloat(el.getAttribute("data-from")) || 0;
    var to = parseFloat(el.getAttribute("data-to")) || 0;
    var dec = parseInt(el.getAttribute("data-dec"), 10) || 0;
    var dur = parseInt(el.getAttribute("data-dur"), 10) || 1000;
    var delay = parseInt(el.getAttribute("data-delay"), 10) || 0;
    var ease = el.getAttribute("data-ease") || "out";
    function fmt(v) { return v.toFixed(dec); }
    if (reduceMotion) { el.textContent = fmt(to); return; }
    var t0 = null;
    function step(t) {
      if (t0 === null) t0 = t;
      var x = (t - t0 - delay) / dur;
      if (x >= 1) { el.textContent = fmt(to); return; }
      if (x > 0) {
        var k = ease === "linear" ? x
              : ease === "settle" ? 1 - Math.exp(-5 * x) * Math.cos(7 * x)   // overshoots, then settles
              : 1 - Math.pow(1 - x, 3);
        el.textContent = fmt(from + (to - from) * k);
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function play(el) {
    if (el.classList.contains("play")) return;
    el.classList.add("play");
    Array.prototype.forEach.call(el.querySelectorAll("[data-to]"), tween);
  }

  var anims = document.querySelectorAll(".anim");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(anims, play);
  } else {
    var aio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { play(e.target); aio.unobserve(e.target); }
      });
    }, { threshold: 0.35 });
    Array.prototype.forEach.call(anims, function (el) { aio.observe(el); });
  }

  // ---- Lazy YouTube embeds: load the player only when clicked ----
  // If a thumbnail fails to load, drop the broken image and keep the play button.
  Array.prototype.forEach.call(document.querySelectorAll(".yt img"), function (im) {
    im.addEventListener("error", function () { im.remove(); });
    if (im.complete && im.naturalWidth === 0 && im.src) im.remove();
  });
  document.addEventListener("click", function (e) {
    var yt = e.target.closest(".yt");
    if (!yt || yt.classList.contains("yt--on") || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    var id = yt.getAttribute("data-id");
    var start = parseInt(yt.getAttribute("data-start"), 10) || 0;
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0" + (start ? "&start=" + start : "");
    f.title = yt.getAttribute("data-title") || "Video";
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.setAttribute("allowfullscreen", "");
    yt.textContent = "";
    yt.appendChild(f);
    yt.classList.add("yt--on");
  });

  // ---- Lightbox ----
  var box = document.getElementById("lightbox");
  if (!box || typeof box.showModal !== "function") return; // links still open the full image

  var img = box.querySelector("img");
  var cap = box.querySelector("figcaption");

  function open(src, alt, caption) {
    img.src = src;
    img.alt = alt || "";
    cap.textContent = caption || "";
    cap.hidden = !caption;
    box.showModal();
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;

    var link = e.target.closest("a.zoom");
    if (link) {
      e.preventDefault();
      var thumb = link.querySelector("img");
      open(link.getAttribute("href"), thumb && thumb.alt, link.getAttribute("data-caption"));
      return;
    }

    // Images inside blog posts enlarge too.
    var postImg = e.target.closest(".prose img");
    if (postImg && !postImg.closest("a")) {
      open(postImg.currentSrc || postImg.src, postImg.alt, postImg.getAttribute("title") || postImg.alt);
    }
  });

  // Click anywhere (backdrop, image, or close button) to close.
  box.addEventListener("click", function () { box.close(); });
  box.addEventListener("close", function () { img.removeAttribute("src"); });
})();
