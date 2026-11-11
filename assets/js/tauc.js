// Draws the hero Tauc figure from data/azo/tauc_<ratio>.csv files (photon energy in eV, (αhν)²).
// Runs only when the page carries a [data-tauc] figure, which Jekyll renders only when the files exist.
// Curves draw in order from 99:1 to 9:1, then a marker moves along the energy axis from 3.35 to 3.58 eV.
// If any file fails to load, the figure hides itself and the fallback figure (the TIA plot) shows instead.
(function () {
  "use strict";
  var fig = document.querySelector("[data-tauc]");
  if (!fig) return;
  var files = JSON.parse(fig.getAttribute("data-tauc") || "[]");
  var dashed = (fig.getAttribute("data-dashed") || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";
  var fallback = document.querySelector(".fig--fallback");

  function fail() { fig.hidden = true; if (fallback) fallback.hidden = false; }

  // "tauc_99-1.csv", "tauc_99_1.csv", "tauc_99to1.csv" all read as ZnO:Al = 99:1.
  function ratioOf(url) {
    var m = /tauc[_-]?(\d+)\D+(\d+)/i.exec(url.split("/").pop());
    return m ? { zn: +m[1], al: +m[2], text: m[1] + ":" + m[2] } : null;
  }

  function parse(text) {
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
    var sep = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ";" : (lines[0].indexOf("\t") >= 0 ? "\t" : ",");
    var head = lines[0].split(sep).map(function (s) { return s.trim().replace(/^"|"$/g, ""); });
    var hasHeader = isNaN(parseFloat(head[0]));
    var rows = [];
    for (var i = hasHeader ? 1 : 0; i < lines.length; i++) {
      var c = lines[i].split(sep);
      var x = parseFloat(c[0]), y = parseFloat(c[1]);
      if (isFinite(x) && isFinite(y)) rows.push([x, y]);
    }
    rows.sort(function (a, b) { return a[0] - b[0]; });
    return { header: hasHeader ? head : null, rows: rows };
  }

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  Promise.all(files.map(function (f) {
    return fetch(f.url).then(function (r) { if (!r.ok) throw new Error(f.url); return r.text(); })
      .then(function (t) { var p = parse(t); var r = ratioOf(f.url); if (!r || p.rows.length < 3) throw new Error(f.url); return { ratio: r, header: p.header, rows: p.rows }; });
  })).then(function (series) {
    series.sort(function (a, b) { return b.ratio.zn - a.ratio.zn; }); // 99:1 first, 9:1 last

    var W = 560, H = 366, x0 = 64, x1 = 544, y0 = 30, y1 = 296;
    var xmin = Infinity, xmax = -Infinity, ymax = 0;
    series.forEach(function (s) { s.rows.forEach(function (r) { xmin = Math.min(xmin, r[0]); xmax = Math.max(xmax, r[0]); ymax = Math.max(ymax, r[1]); }); });
    // The axis always spans at least 3.25 to 3.7 eV, so the 3.35 to 3.58 bracket clears the legend.
    xmin = Math.min(xmin, 3.25); xmax = Math.max(xmax, 3.7);
    var fx = function (x) { return x0 + (x - xmin) / (xmax - xmin) * (x1 - x0); };
    var fy = function (y) { return y1 - (y / ymax) * (y1 - y0); };

    var svg = el("svg", { "class": "fig-svg", viewBox: "0 0 " + W + " " + H, role: "img",
      "aria-label": "Tauc plots of ZnO:Al films at five Al ratios. The band edge moves from 3.35 to 3.58 eV." });
    var grid = el("g", { "class": "fig-grid" }, svg);
    var ticks = el("g", { "class": "fig-ticks" }, svg);
    var xt = [];
    for (var e = Math.ceil(xmin * 10) / 10; e <= xmax + 1e-9; e = +(e + 0.1).toFixed(2)) xt.push(+e.toFixed(2));
    xt.forEach(function (e) {
      el("line", { x1: fx(e), y1: y0, x2: fx(e), y2: y1 }, grid);
      var t = el("text", { x: fx(e), y: y1 + 20, "text-anchor": "middle" }, ticks); t.textContent = e.toFixed(1);
    });
    for (var k = 1; k <= 4; k++) el("line", { x1: x0, y1: fy(ymax * k / 4), x2: x1, y2: fy(ymax * k / 4) }, grid);
    var ax = el("g", { "class": "fig-axis" }, svg);
    el("line", { x1: x0, y1: y0, x2: x0, y2: y1 }, ax); el("line", { x1: x0, y1: y1, x2: x1, y2: y1 }, ax);

    var xl = (series[0].header && series[0].header[0]) || "Photon energy (eV)";
    var yl = (series[0].header && series[0].header[1]) || "(αhν)²";
    var xlab = el("text", { "class": "fig-axlab", x: (x0 + x1) / 2, y: H - 8, "text-anchor": "middle" }, svg); xlab.textContent = xl;
    var ylab = el("text", { "class": "fig-axlab", x: 18, y: (y0 + y1) / 2, "text-anchor": "middle", transform: "rotate(-90 18 " + (y0 + y1) / 2 + ")" }, svg); ylab.textContent = yl;

    // One blue, five steps: lightest for the least Al, darkest for the most.
    var shades = ["#9fb3ea", "#6f8bdc", "#4a6bd3", "#1f49c9", "#12307f"];
    var n = series.length;
    series.forEach(function (s, i) {
      var d = "M" + s.rows.map(function (r) { return fx(r[0]).toFixed(1) + "," + fy(r[1]).toFixed(1); }).join(" L");
      var isDashed = dashed.indexOf(s.ratio.text) >= 0;
      var p = el("path", { "class": "tauc-curve" + (isDashed ? " is-dashed" : ""), d: d, pathLength: "1", stroke: shades[Math.round(i * 4 / Math.max(1, n - 1))] }, svg);
      // Legend: a fixed stack at the top left, one row per ratio, in draw order.
      var ly = y0 + 18 + i * 18;
      var lg = el("g", { "class": "fig-leg" }, svg);
      el("line", { x1: x0 + 12, y1: ly - 4, x2: x0 + 34, y2: ly - 4, stroke: shades[Math.round(i * 4 / Math.max(1, n - 1))], "stroke-width": 2.2, "stroke-dasharray": isDashed ? "5 4" : "none" }, lg);
      var lt = el("text", { x: x0 + 42, y: ly }, lg); lt.textContent = s.ratio.text;
      if (!reduce) {
        if (isDashed) { p.style.opacity = "0"; p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 300 + i * 650, fill: "forwards", easing: "ease" }); }
        else { p.style.strokeDasharray = "1"; p.style.strokeDashoffset = "1"; p.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 900, delay: 300 + i * 650, fill: "forwards", easing: "cubic-bezier(.16,1,.3,1)" }); }
        lg.style.opacity = "0"; lg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 500 + i * 650, fill: "forwards" });
      }
    });

    // Marker: a guide line moves along the energy axis from 3.35 to 3.58 eV while a bracket
    // grows between the two positions, labeled +0.23 eV.
    var xa = fx(3.35), xb = fx(3.58), dx = xb - xa;
    var mk = el("g", { "class": "tauc-mark" }, svg);
    var mline = el("line", { x1: xa, y1: y0, x2: xa, y2: y1, "stroke-dasharray": "3 4" }, mk);
    var brY = y0 + 8;
    var bracket = el("path", { d: "M" + xa + "," + (brY + 4) + " V" + brY + " H" + xb + " V" + (brY + 4), fill: "none", pathLength: "1" }, mk);
    var mtext = el("text", { x: (xa + xb) / 2, y: y0 - 8, "text-anchor": "middle" }, mk); mtext.textContent = "+0.23 eV";
    var t0 = 300 + n * 650 + 200;
    if (!reduce) {
      mline.style.opacity = "0";
      mline.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: t0, fill: "forwards" });
      mline.animate([{ transform: "translateX(0)" }, { transform: "translateX(" + dx + "px)" }], { duration: 1000, delay: t0 + 300, fill: "forwards", easing: "cubic-bezier(.16,1,.3,1)" });
      bracket.style.strokeDasharray = "1"; bracket.style.strokeDashoffset = "1";
      bracket.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1000, delay: t0 + 300, fill: "forwards", easing: "cubic-bezier(.16,1,.3,1)" });
      mtext.style.opacity = "0";
      mtext.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: t0 + 1200, fill: "forwards" });
    } else {
      mline.setAttribute("x1", xb); mline.setAttribute("x2", xb);
    }

    fig.querySelector(".fig-slot").replaceWith(svg);
    if (dashed.length && fig.getAttribute("data-footnote")) {
      var foot = document.createElement("p"); foot.className = "fig-foot"; foot.textContent = fig.getAttribute("data-footnote"); fig.appendChild(foot);
    }
  }).catch(fail);
})();
