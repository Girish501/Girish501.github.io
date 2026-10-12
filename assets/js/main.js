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
