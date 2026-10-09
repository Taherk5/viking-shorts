// ---------- core helpers: layers, halftone, easing, text ----------
const W = 1280, H = 720;
const S = parseFloat(new URLSearchParams(location.search).get('s') || '1');

const C = {
  ink: '#1b0e1c', white: '#fffcf6', shade: '#cfc5de', shade2: '#a99cc7',
  mag: '#ec3f86', grn: '#79dc5a', red: '#c7352b', dred: '#7e1f2a', orange: '#f2892a',
  yellow: '#ffd54a', brown: '#7b4426', dbrown: '#4b2a1b', purple: '#3b2160',
  steel: '#8e9bb0', steelHi: '#d3dcec', steelLo: '#5b6683', pink: '#ff7aa8',
  teal: '#2d6a6f', dteal: '#1c4348', cream: '#efe6d2', gold: '#f2b632',
};

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  lin: t => t,
  inOut: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  elastic: t => t === 0 || t === 1 ? t : Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1,
  bounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; },
};
// tween between keyframes [[t,v],...] with easing
function keys(t, ks, ease = E.inOut) {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i][0]) { const a = ks[i - 1], b = ks[i]; return lerp(a[1], b[1], ease(seg(t, a[0], b[0]))); }
  }
  return ks[ks.length - 1][1];
}

// ---- layers (offscreen canvases that respect the render scale S) ----
function layer(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * S); c.height = Math.ceil(h * S);
  const g = c.getContext('2d');
  g.scale(S, S);
  g.lineJoin = 'round'; g.lineCap = 'round';
  return { c, g, w, h };
}
function clearLayer(L) { L.g.save(); L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect(0, 0, L.c.width, L.c.height); L.g.restore(); }
function put(g, L, x = 0, y = 0, a = 1) {
  if (a !== 1) { g.save(); g.globalAlpha *= a; g.drawImage(L.c, x, y, L.w, L.h); g.restore(); }
  else g.drawImage(L.c, x, y, L.w, L.h);
}

// ---- halftone dot patterns ----
const _pat = {};
function dots(g, r, color, sp = 9) {
  const key = r + color + sp;
  if (!_pat[key]) {
    const t = layer(sp, sp), q = t.g;
    q.fillStyle = color;
    for (const [x, y] of [[sp / 2, sp / 2], [0, 0], [sp, 0], [0, sp], [sp, sp]]) { q.beginPath(); q.arc(x, y, r, 0, 7); q.fill(); }
    const p = g.createPattern(t.c, 'repeat');
    p.setTransform(new DOMMatrix().scale(1 / S));
    _pat[key] = p;
  }
  return _pat[key];
}
// baked gradient halftone: radius = fn(x,y) * max
function halftoneLayer(w, h, color, fn, sp = 10, maxR = 4.6) {
  const L = layer(w, h), g = L.g; g.fillStyle = color;
  for (let y = 0, row = 0; y < h + sp; y += sp / 2, row++) {
    for (let x = (row % 2) * sp / 2; x < w + sp; x += sp) {
      const v = fn(x / w, y / h); if (v <= 0.03) continue;
      g.beginPath(); g.arc(x, y, Math.min(maxR, v * maxR), 0, 7); g.fill();
    }
  }
  return L;
}

// grain tile
let _grain = null;
function grainTile() {
  if (_grain) return _grain;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), im = g.createImageData(256, 256), r = mulberry32(99);
  for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255 | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); _grain = c; return c;
}

// ---- shape helpers ----
function fillStroke(g, fill, lw = 5, stroke = C.ink) {
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (lw) { g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); }
}
function circle(g, x, y, r, fill, lw = 5) { g.beginPath(); g.arc(x, y, r, 0, 7); fillStroke(g, fill, lw); }
function ellipse(g, x, y, rx, ry, fill, lw = 5, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 7); fillStroke(g, fill, lw); }
function poly(g, pts, fill, lw = 5, close = true) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  if (close) g.closePath(); fillStroke(g, fill, lw);
}
function rrect(g, x, y, w, h, r, fill, lw = 5) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); fillStroke(g, fill, lw);
}
function tube(g, pts, w, fill, lw = 5) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.strokeStyle = C.ink; g.lineWidth = w + lw * 2; g.stroke();
  g.strokeStyle = fill; g.lineWidth = w; g.stroke();
}
function ik(sx, sy, tx, ty, a, b, bend = 1) {
  let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy);
  const m = a + b - 1;
  if (d > m) { tx = sx + dx / d * m; ty = sy + dy / d * m; dx = tx - sx; dy = ty - sy; d = m; }
  const ang = Math.atan2(dy, dx);
  const cosA = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1);
  const A = Math.acos(cosA) * bend;
  return { ex: sx + Math.cos(ang + A) * a, ey: sy + Math.sin(ang + A) * a, hx: tx, hy: ty };
}

// ---- comic text ----
function comicText(g, str, x, y, size, fill = C.white, o = {}) {
  g.save();
  g.font = `${o.weight || 900} ${size}px ${o.font || 'Inter'}`;
  g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round';
  if (o.rot) { g.translate(x, y); g.rotate(o.rot); x = 0; y = 0; }
  const sh = o.shadow == null ? size * 0.07 : o.shadow;
  if (sh) { g.fillStyle = o.shadowColor || C.mag; g.fillText(str, x + sh, y + sh); }
  g.lineWidth = o.stroke == null ? size * 0.16 : o.stroke;
  g.strokeStyle = o.strokeColor || C.ink; g.strokeText(str, x, y);
  g.fillStyle = fill; g.fillText(str, x, y);
  g.restore();
}
function wrapLines(g, str, maxW) {
  const words = str.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
function subtitle(g, str, a = 1) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a;
  g.font = '800 34px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const lines = wrapLines(g, str, 1020);
  const lh = 44, y0 = H - 54 - (lines.length - 1) * lh;
  lines.forEach((l, i) => {
    const y = y0 + i * lh + (1 - a) * 10;
    g.lineWidth = 9; g.strokeStyle = C.ink; g.lineJoin = 'round'; g.strokeText(l, W / 2, y);
    g.fillStyle = '#fff'; g.fillText(l, W / 2, y);
  });
  g.restore();
}
