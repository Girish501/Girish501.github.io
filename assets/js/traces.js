// Shared helpers for the copper-trace drawings (hero background and scroll effects).
(function () {
  "use strict";

  // Small seeded PRNG so layouts are the same on every visit.
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normal(a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    return [-dy / l, dx / l];
  }

  // Offset a polyline by distance o with miter joins, so parallel traces keep their pitch through bends.
  function offset(pts, o) {
    var out = [];
    for (var i = 0; i < pts.length; i++) {
      var n1 = i > 0 ? normal(pts[i - 1], pts[i]) : null;
      var n2 = i < pts.length - 1 ? normal(pts[i], pts[i + 1]) : null;
      var nx, ny, k = 1;
      if (n1 && n2) {
        nx = n1[0] + n2[0]; ny = n1[1] + n2[1];
        var l = Math.hypot(nx, ny); nx /= l; ny /= l;
        k = 1 / (nx * n1[0] + ny * n1[1]);
      } else { var n = n1 || n2; nx = n[0]; ny = n[1]; }
      out.push([pts[i][0] + nx * o * k, pts[i][1] + ny * o * k]);
    }
    return out;
  }

  // Build a line object: points, cumulative lengths, total length. Optionally cut to maxLen.
  function line(pts, maxLen) {
    if (maxLen == null) maxLen = Infinity;
    var cum = [0], out = [pts[0]];
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      var seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
      var total = cum[cum.length - 1];
      if (total + seg >= maxLen) {
        var t = (maxLen - total) / seg;
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        cum.push(maxLen);
        return { pts: out, cum: cum, len: maxLen };
      }
      out.push(b); cum.push(total + seg);
    }
    return { pts: out, cum: cum, len: cum[cum.length - 1] };
  }

  function pointAt(l, d) {
    if (d <= 0) return l.pts[0];
    if (d >= l.len) return l.pts[l.pts.length - 1];
    var lo = 1, hi = l.cum.length - 1;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (l.cum[mid] < d) lo = mid + 1; else hi = mid; }
    var a = l.pts[lo - 1], b = l.pts[lo], t = (d - l.cum[lo - 1]) / (l.cum[lo] - l.cum[lo - 1]);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }

  // Stroke the first `upTo` length of a line onto ctx (current path).
  function tracePath(ctx, l, upTo) {
    if (upTo == null || upTo >= l.len) upTo = l.len;
    ctx.moveTo(l.pts[0][0], l.pts[0][1]);
    for (var i = 1; i < l.pts.length; i++) {
      if (l.cum[i] >= upTo) { var p = pointAt(l, upTo); ctx.lineTo(p[0], p[1]); return; }
      ctx.lineTo(l.pts[i][0], l.pts[i][1]);
    }
  }

  // A glowing signal pulse with a fading tail, centered at distance d along l.
  function drawPulse(ctx, l, d, tail, rgb, rev) {
    var steps = 6;
    var at = function (x) { return pointAt(l, rev ? l.len - x : x); };
    var prev = at(d - tail);
    ctx.lineWidth = 1.6;
    for (var k = 1; k <= steps; k++) {
      var pt = at(d - tail + (tail * k) / steps);
      ctx.strokeStyle = "rgba(" + rgb + "," + (0.9 * k / steps).toFixed(3) + ")";
      ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(pt[0], pt[1]); ctx.stroke();
      prev = pt;
    }
    if (d <= l.len) {
      var h = at(d);
      ctx.fillStyle = "rgba(" + rgb + ",0.22)";
      ctx.beginPath(); ctx.arc(h[0], h[1], 5, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath(); ctx.arc(h[0], h[1], 1.3, 0, 6.2832); ctx.fill();
    }
  }

  // Size a canvas to its CSS box with a capped device pixel ratio. Returns {w, h}.
  function fit(canvas, ctx, maxDpr) {
    var r = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    var dpr = Math.min(window.devicePixelRatio || 1, w < 700 ? 1.5 : (maxDpr || 2));
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h };
  }

  window.Traces = {
    rng: rng, offset: offset, line: line, pointAt: pointAt, tracePath: tracePath, drawPulse: drawPulse, fit: fit,
    COPPER: "232,163,92", CYAN: "77,214,200",
    reduceMotion: !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  };
})();
