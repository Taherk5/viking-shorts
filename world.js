// ---------- backgrounds, props, fire ----------
function gradFill(g, x, y, w, h, stops, vertical = true) {
  const gr = vertical ? g.createLinearGradient(0, y, 0, y + h) : g.createLinearGradient(x, 0, x + w, 0);
  stops.forEach(([o, c]) => gr.addColorStop(o, c));
  g.fillStyle = gr; g.fillRect(x, y, w, h);
}
function brushStrokes(g, x, y, w, h, colors, n, len, alpha, seed, ang = 0.15) {
  const r = mulberry32(seed); g.save(); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const px = x + r() * w, py = y + r() * h, l = len * (0.4 + r());
    const a = ang + (r() - 0.5) * 0.5;
    g.globalAlpha = alpha * (0.4 + r() * 0.6); g.strokeStyle = colors[(r() * colors.length) | 0];
    g.lineWidth = 3 + r() * 9;
    g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + Math.cos(a) * l * 0.5, py + Math.sin(a) * l * 0.5 - 4, px + Math.cos(a) * l, py + Math.sin(a) * l); g.stroke();
  }
  g.restore();
}

// ----- smoke / embers / fire -----
function smoke(g, x, y, t, o = {}) {
  const n = o.n || 12, r = mulberry32(o.seed || 7), w = o.w || 60, rise = o.rise || 420;
  for (let i = 0; i < n; i++) {
    const ph = (t * (o.speed || 0.16) + i / n + r()) % 1;
    const px = x + (r() - 0.5) * w + Math.sin(ph * 5 + i) * 40 * ph + (o.drift || 60) * ph;
    const py = y - ph * rise, rad = 22 + ph * 90 * (0.7 + r() * 0.6);
    g.save(); g.globalAlpha = (1 - ph) * (o.alpha || 0.5) * Math.min(1, ph * 6);
    const gr = g.createRadialGradient(px, py, 0, px, py, rad);
    gr.addColorStop(0, o.c0 || 'rgba(70,35,90,0.95)'); gr.addColorStop(1, 'rgba(70,35,90,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(px, py, rad, 0, 7); g.fill(); g.restore();
  }
}
function embers(g, x, y, w, t, o = {}) {
  const n = o.n || 40, r = mulberry32(o.seed || 3), rise = o.rise || 520;
  g.save();
  for (let i = 0; i < n; i++) {
    const sp = 0.1 + r() * 0.16, ph = (t * sp + r()) % 1;
    const px = x + (r() - 0.5) * w + Math.sin(ph * 9 + i * 2) * 28 + (o.drift || 90) * ph;
    const py = y - ph * rise * (0.5 + r() * 0.7), rad = (1.5 + r() * 3.2) * (1 - ph * 0.6);
    g.globalAlpha = Math.min(1, (1 - ph) * 1.6);
    g.fillStyle = r() > 0.4 ? C.yellow : C.orange;
    g.beginPath(); g.arc(px, py, rad, 0, 7); g.fill();
  }
  g.restore();
}
function fire(g, x, y, w, h, t, o = {}) {
  const n = o.n || Math.max(3, Math.round(w / 38)), r = mulberry32(o.seed || 11);
  const row = (cnt, hs, ws, off) => {
    for (let i = 0; i < cnt; i++) {
      const fx = x + (i / Math.max(1, cnt - 1) - 0.5) * w + (r() - 0.5) * 22 + off;
      const hh = h * hs * (0.45 + r() * 0.85), ww = (w / cnt) * ws * (0.8 + r() * 0.6);
      flameShape(g, fx, y + (r() - 0.5) * 8, ww, hh, t * (6 + r() * 4) + i * 1.9 + r() * 6, 1);
    }
  };
  row(n, 1, 0.95, 0);
  row(n + 1, 0.7, 0.8, 8);
}
// glow: additive radial
function glow(g, x, y, r, col = 'rgba(255,140,50,0.55)', a = 1) {
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = a;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,100,40,0)');
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}

// ----- sea -----
function drawSea(g, y0, y1, t, o = {}) {
  const far = o.far || '#7a3a86', near = o.near || '#2a1757', hi = o.hi || 'rgba(255,190,120,0.8)';
  gradFill(g, -400, y0, W + 800, y1 - y0 + 4, [[0, far], [1, near]]);
  const rows = o.rows || 11, sp = o.speed || 1;
  const mix = (a, b, k) => {
    const pa = a.match(/\w\w/g).map(h => parseInt(h, 16)), pb = b.match(/\w\w/g).map(h => parseInt(h, 16));
    return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], k))).join(',')})`;
  };
  for (let i = 0; i < rows; i++) {
    const k = i / (rows - 1), yy = lerp(y0 + 6, y1 - 10, Math.pow(k, 1.55)), amp = 3 + k * 13, wl = 60 + k * 120;
    g.beginPath(); g.moveTo(-400, y1 + 20);
    const pts = [];
    for (let x = -400; x <= W + 400; x += 16) {
      const wy = yy + Math.sin(x / wl * 6.28 + t * (0.9 + k) * sp + i * 1.7) * amp + Math.sin(x / (wl * 0.43) - t * 1.4 * sp + i) * amp * 0.35;
      pts.push([x, wy]); g.lineTo(x, wy);
    }
    g.lineTo(W + 400, y1 + 20); g.closePath();
    g.fillStyle = mix((o.far || '#7a3a86').replace('#', ''), (o.near || '#2a1757').replace('#', ''), Math.pow(k, 0.8) * 0.9 + 0.05); g.fill();
    // crest line
    g.beginPath(); pts.forEach(([x, y], j) => j ? g.lineTo(x, y) : g.moveTo(x, y));
    g.lineWidth = 2.5 + k * 3.5; g.strokeStyle = o.crest || 'rgba(255,200,150,0.55)'; g.stroke();
    // dark under-line for depth
    g.lineWidth = 1.5 + k * 2; g.strokeStyle = 'rgba(20,5,40,0.35)';
    g.save(); g.translate(0, 6 + k * 8); g.stroke(); g.restore();
  }
}
function sunGlitter(g, cx, y0, y1, t, col = 'rgba(255,220,140,0.9)') {
  const r = mulberry32(5);
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const k = r(), y = lerp(y0, y1, Math.pow(k, 1.4)), sp = 20 + k * 90;
    const x = cx + (r() - 0.5) * sp * 2.2 + Math.sin(t * 2 + i) * 6;
    g.globalAlpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 3.1 + i * 1.7));
    g.strokeStyle = col; g.lineWidth = 2 + k * 3;
    g.beginPath(); g.moveTo(x - 6 - k * 22, y); g.lineTo(x + 6 + k * 22, y); g.stroke();
  }
  g.restore();
}

// ----- clouds -----
function cloud(g, x, y, s, col, rim, seed = 1) {
  const r = mulberry32(seed); g.save(); g.translate(x, y); g.scale(s, s);
  const n = 5 + ((r() * 3) | 0), bumps = [];
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1), br = (34 + (1 - Math.abs(k - 0.5) * 2) * 46) * (0.85 + r() * 0.3);
    bumps.push([(k - 0.5) * 320 + (r() - 0.5) * 26, 26 - br * 0.92, br]);
  }
  const path = g2 => { bumps.forEach(([bx, by, br]) => { g2.moveTo(bx + br, by); g2.arc(bx, by, br, 0, 7); }); g2.moveTo(-175, 26); g2.lineTo(-175, -10); g2.lineTo(175, -10); g2.lineTo(175, 26); g2.quadraticCurveTo(0, 44, -175, 26); g2.closePath(); };
  g.save(); g.beginPath(); g.rect(-260, -200, 520, 226); g.clip();    // flat-ish base
  g.beginPath(); path(g); g.fillStyle = col; g.fill('nonzero');
  g.save(); g.beginPath(); path(g); g.clip();
  const gr = g.createLinearGradient(0, -30, 0, 28); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, rim);
  g.fillStyle = gr; g.fillRect(-260, -200, 520, 240);
  g.fillStyle = dots(g, 2.3, 'rgba(15,5,35,0.30)', 10); g.fillRect(-260, -60, 520, 90);
  g.restore(); g.restore();
  g.beginPath(); g.moveTo(-170, 28); g.quadraticCurveTo(0, 46, 170, 28); g.lineWidth = 6; g.strokeStyle = rim; g.stroke();
  g.restore();
}

// ----- long ship -----
function shipBack(g, t, o = {}) {
  const sw = Math.sin(t * 2.2) * 0.04;
  // dragon head + neck
  g.save();
  // stern post
  g.beginPath(); g.moveTo(-240, -112); g.bezierCurveTo(-262, -170, -258, -214, -226, -236);
  g.lineWidth = 22; g.strokeStyle = C.ink; g.stroke(); g.lineWidth = 12; g.strokeStyle = '#b97a3b'; g.stroke();
  circle(g, -222, -240, 15, '#b97a3b', 4.5);
  // mast
  g.beginPath(); g.moveTo(8, -70); g.lineTo(8, -380); g.lineWidth = 22; g.strokeStyle = C.ink; g.stroke(); g.lineWidth = 12; g.strokeStyle = '#a5693a'; g.stroke();
  // rigging
  g.lineWidth = 3; g.strokeStyle = C.ink;
  g.beginPath(); g.moveTo(8, -378); g.lineTo(262, -150); g.moveTo(8, -378); g.lineTo(-250, -128); g.stroke();
  // sail
  const sail = (g2, bil) => {
    g2.moveTo(-132, -352);
    g2.quadraticCurveTo(8, -352 - 10, 148, -352);
    g2.quadraticCurveTo(148 + bil, -240, 138, -128);
    g2.quadraticCurveTo(8, -128 + bil * 0.5, -122, -128);
    g2.quadraticCurveTo(-132 - bil * 0.5, -240, -132, -352); g2.closePath();
  };
  const bil = 26 + Math.sin(t * 2.6) * 8 * (o.windy == null ? 1 : o.windy);
  g.beginPath(); sail(g, bil); g.fillStyle = C.cream; g.fill();
  g.save(); g.clip();
  for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? C.cream : (o.sail || C.red); g.fillRect(-140 + i * 48.5, -360, 48.5, 240); }
  shadeIn(g, g2 => sail(g2, bil), 'rgba(40,10,70,0.35)', -34, 0, 'rgba(40,10,70,0.35)');
  // bellying fold lines
  g.lineWidth = 3; g.strokeStyle = 'rgba(40,10,70,0.35)';
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-100 + i * 70, -340); g.quadraticCurveTo(-80 + i * 70 + bil, -240, -100 + i * 70, -140); g.stroke(); }
  g.restore();
  g.beginPath(); sail(g, bil); g.lineWidth = 5.5; g.strokeStyle = C.ink; g.stroke();
  // yard
  g.beginPath(); g.moveTo(-150, -352); g.lineTo(166, -352); g.lineWidth = 16; g.strokeStyle = C.ink; g.stroke(); g.lineWidth = 8; g.strokeStyle = '#a5693a'; g.stroke();
  g.restore();
}
function dragonHead(g, t) {
  g.save(); g.translate(236, -118);
  const nod = Math.sin(t * 2.2) * 0.06; g.rotate(nod);
  // neck
  g.beginPath(); g.moveTo(-8, 8); g.bezierCurveTo(20, -50, 34, -110, 20, -156);
  g.lineWidth = 36; g.strokeStyle = C.ink; g.stroke(); g.lineWidth = 24; g.strokeStyle = '#c9873a'; g.stroke();
  g.lineWidth = 4; g.strokeStyle = C.red; g.setLineDash([2, 14]); g.beginPath(); g.moveTo(0, -4); g.bezierCurveTo(26, -50, 36, -110, 22, -150); g.stroke(); g.setLineDash([]);
  // head
  g.save(); g.translate(22, -168); g.rotate(0.12);
  g.beginPath(); g.moveTo(-26, 10); g.bezierCurveTo(-30, -34, 8, -46, 34, -34); g.bezierCurveTo(58, -30, 82, -22, 86, -8);
  g.quadraticCurveTo(88, 2, 76, 4); g.lineTo(34, 8); g.quadraticCurveTo(10, 24, -26, 10); g.closePath(); fillStroke(g, '#c9873a', 5.5);
  // jaw
  g.beginPath(); g.moveTo(8, 12); g.quadraticCurveTo(44, 26, 80, 12); g.quadraticCurveTo(70, 36, 30, 38); g.quadraticCurveTo(0, 36, 8, 12); g.closePath(); fillStroke(g, '#b8742f', 5);
  // teeth
  g.fillStyle = '#fff'; g.strokeStyle = C.ink; g.lineWidth = 2.5;
  for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(34 + i * 12, 8); g.lineTo(38 + i * 12, 20); g.lineTo(43 + i * 12, 8); g.closePath(); g.fill(); g.stroke(); }
  // eye
  circle(g, 24, -14, 9, '#fff', 3.5); circle(g, 26, -13, 4.5, C.ink, 0);
  g.beginPath(); g.moveTo(10, -30); g.lineTo(38, -20); g.lineWidth = 6; g.strokeStyle = C.ink; g.stroke();
  // nostril + ear spiral
  circle(g, 76, -10, 3.5, C.ink, 0);
  g.beginPath(); g.moveTo(-10, -30); g.quadraticCurveTo(-30, -70, -6, -80); g.quadraticCurveTo(14, -60, -2, -48); g.closePath(); fillStroke(g, C.red, 4.5);
  g.restore();
  g.restore();
}
function shipFront(g, t, o = {}) {
  const hullP = g2 => {
    g2.moveTo(-262, -150);
    g2.quadraticCurveTo(-210, -98, -150, -80); g2.quadraticCurveTo(0, -62, 160, -86); g2.quadraticCurveTo(232, -100, 262, -140);
    g2.bezierCurveTo(250, -60, 214, -10, 140, 18); g2.bezierCurveTo(60, 34, -60, 34, -130, 20); g2.bezierCurveTo(-210, -2, -250, -70, -262, -150); g2.closePath();
  };
  g.beginPath(); hullP(g); g.fillStyle = '#8e5330'; g.fill();
  g.save(); g.clip();
  // clinker planks
  const cols = ['#a35f36', '#7c4526', '#935531', '#6e3b20'];
  for (let i = 0; i < 6; i++) {
    g.beginPath(); g.moveTo(-270, -150 + i * 18);
    g.quadraticCurveTo(0, -75 + i * 22 + (i > 3 ? 4 : 0), 270, -140 + i * 16);
    g.lineTo(270, -100 + i * 40); g.lineTo(-270, -100 + i * 40); g.closePath();
    g.fillStyle = cols[i % 4]; g.fill();
    g.lineWidth = 3.2; g.strokeStyle = C.ink; g.beginPath(); g.moveTo(-270, -150 + i * 18); g.quadraticCurveTo(0, -75 + i * 22 + (i > 3 ? 4 : 0), 270, -140 + i * 16); g.stroke();
  }
  // stripe on hull
  g.beginPath(); g.moveTo(-270, -126); g.quadraticCurveTo(0, -52, 270, -116); g.lineWidth = 10; g.strokeStyle = C.red; g.stroke();
  shadeIn(g, hullP, 'rgba(40,10,70,0.4)', -10, -22, 'rgba(40,10,70,0.4)');
  g.restore();
  g.beginPath(); hullP(g); g.lineWidth = 6; g.strokeStyle = C.ink; g.stroke();
  // rail
  g.beginPath(); g.moveTo(-262, -150); g.quadraticCurveTo(-210, -98, -150, -80); g.quadraticCurveTo(0, -62, 160, -86); g.quadraticCurveTo(232, -100, 262, -140);
  g.lineWidth = 12; g.strokeStyle = C.ink; g.stroke(); g.lineWidth = 6; g.strokeStyle = '#c28a50'; g.stroke();
  // shields on rail
  const sc = [C.red, C.cream, C.yellow, '#3a5a8c', C.red, C.cream, C.yellow, '#3a5a8c', C.red];
  for (let i = 0; i < 9; i++) {
    const x = -184 + i * 46, y = -78 + Math.sin((x + 262) / 524 * Math.PI) * -2 - 4 + Math.pow((x / 262), 2) * -14 + 6;
    circle(g, x, y + 4, 21, sc[i], 4.5); circle(g, x, y + 4, 7.5, C.steel, 3);
  }
}
function oars(g, t, o = {}) {
  g.save();
  for (let i = 0; i < 6; i++) {
    const x = -150 + i * 62, a = 0.95 + Math.sin(t * 3 + i * 0.6) * 0.22 * (o.rowing == null ? 1 : o.rowing);
    g.save(); g.translate(x, -50); g.rotate(a);
    g.beginPath(); g.moveTo(-30, 0); g.lineTo(150, 0); g.lineWidth = 11; g.strokeStyle = C.ink; g.stroke(); g.lineWidth = 5; g.strokeStyle = '#d5a066'; g.stroke();
    rrect(g, 120, -9, 54, 18, 6, '#c28a50', 4.5);
    g.restore();
  }
  g.restore();
}
function drawShip(g, x, y, s, t, o = {}) {
  g.save(); g.translate(x, y); g.scale(s * (o.flip || 1), s); g.rotate(Math.sin(t * 1.5 + (o.ph || 0)) * 0.03 + (o.tilt || 0));
  shipBack(g, t, o);
  if (o.crew) o.crew(g, t);
  if (o.oars !== false) oars(g, t, o);
  shipFront(g, t, o);
  dragonHead(g, t);
  g.restore();
}
function foam(g, x, y, w, t, o = {}) {
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const k = i / 15, xx = x + (k - 0.5) * w + Math.sin(t * 2 + i) * 6, yy = y + Math.sin(t * 3 + i * 2) * 4 + Math.abs(k - 0.5) * (o.vy || 24);
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 5 + Math.sin(t * 2.2 + i) * 1.5;
    g.beginPath(); g.moveTo(xx - 14, yy); g.quadraticCurveTo(xx, yy - 6, xx + 14, yy); g.stroke();
  }
  g.restore();
}

// ----- monastery (baked) -----
let _mon = null;
function monastery() {
  if (_mon) return _mon;
  const L = layer(960, 640), g = L.g; g.translate(480, 620);
  const brick = (x, y, w, h, base, line, seed) => {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.fillStyle = base; g.fillRect(x, y, w, h);
    const r = mulberry32(seed);
    for (let j = 0; j * 24 < h + 24; j++) {
      const yy = y + j * 24;
      for (let i = -1; i * 46 < w + 46; i++) {
        const xx = x + i * 46 + (j % 2) * 23;
        g.fillStyle = `rgba(${r() > 0.5 ? '255,160,120' : '60,20,60'},${0.06 + r() * 0.1})`; g.fillRect(xx + 2, yy + 2, 42, 20);
      }
      g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.lineWidth = 2.2; g.strokeStyle = line; g.stroke();
      for (let i = -1; i * 46 < w + 46; i++) { const xx = x + i * 46 + (j % 2) * 23; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 24); g.stroke(); }
    }
    g.restore();
  };
  const arch = (cx, by, w, h, fill, frame = true) => {
    g.beginPath(); g.moveTo(cx - w / 2, by); g.lineTo(cx - w / 2, by - h + w / 2); g.arc(cx, by - h + w / 2, w / 2, Math.PI, 0); g.lineTo(cx + w / 2, by); g.closePath();
    if (frame) { g.lineWidth = 16; g.strokeStyle = '#6f4259'; g.stroke(); g.lineWidth = 5; g.strokeStyle = C.ink; g.stroke(); }
    fillStroke(g, fill, 5);
  };
  // tower
  brick(150, -430, 150, 430, '#9d5f78', '#6a3552', 3);
  g.lineWidth = 6; g.strokeStyle = C.ink; g.strokeRect(150, -430, 150, 430);
  // nave
  brick(-370, -230, 520, 230, '#a5647a', '#6a3552', 5);
  g.lineWidth = 6; g.strokeStyle = C.ink; g.strokeRect(-370, -230, 520, 230);
  // nave roof (dark slate)
  poly(g, [[-396, -226], [-250, -330], [104, -330], [176, -226]], '#4a2a5e', 6);
  g.save(); g.beginPath(); g.moveTo(-396, -226); g.lineTo(-250, -330); g.lineTo(104, -330); g.lineTo(176, -226); g.closePath(); g.clip();
  g.strokeStyle = 'rgba(15,5,30,.45)'; g.lineWidth = 2.5; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-400, -240 - i * 18); g.lineTo(190, -240 - i * 18); g.stroke(); }
  g.restore();
  // tower roof
  poly(g, [[140, -426], [225, -560], [310, -426]], '#4a2a5e', 6);
  g.beginPath(); g.moveTo(225, -560); g.lineTo(225, -610); g.moveTo(208, -592); g.lineTo(242, -592); g.lineWidth = 14; g.strokeStyle = C.ink; g.stroke(); g.lineWidth = 7; g.strokeStyle = C.steelHi; g.stroke();
  // windows
  const wins = [-300, -200, -100, 0, 100];
  wins.forEach(x => arch(x, -68, 52, 104, '#ffb23a', true));
  arch(-150, 0, 86, 130, '#2a1236', true); // door
  arch(225, -240, 48, 100, '#ffb23a', true); arch(225, -380, 40, 76, '#ff8a2a', true);
  // window mullions
  g.lineWidth = 4; g.strokeStyle = C.ink; wins.forEach(x => { g.beginPath(); g.moveTo(x, -40); g.lineTo(x, -150 + 28); g.moveTo(x - 26, -90); g.lineTo(x + 26, -90); g.stroke(); });
  // base shading (left dark, right light from fire)
  g.save(); g.globalCompositeOperation = 'source-atop';
  gradFill(g, -380, -620, 700, 640, [[0, 'rgba(20,5,40,0.0)'], [0.6, 'rgba(20,5,40,0.0)'], [1, 'rgba(20,5,40,0.45)']], true);
  g.restore();
  _mon = L; return L;
}
function drawMonastery(g, x, y, s, t, o = {}) {
  const L = monastery();
  g.save(); g.translate(x, y); g.scale(s, s);
  g.drawImage(L.c, -480, -620, L.w, L.h);
  // fire on roofs & windows
  const burn = o.burn == null ? 1 : o.burn;
  if (burn > 0) {
    g.save(); g.globalAlpha = Math.min(1, burn * 1.3);
    fire(g, -120, -326, 440 * burn, 190 * burn, t, { seed: 21, n: 9 });
    fire(g, 225, -560, 90 * burn, 160 * burn, t * 1.1, { seed: 5, n: 3 });
    fire(g, 225, -420, 120, 100 * burn, t, { seed: 8, n: 3 });
    g.restore();
    // window flames
    [-300, -200, -100, 0, 100].forEach((wx, i) => flameShape(g, wx, -62, 24, 78 * burn, t * 9 + i * 2, burn));
    glow(g, -100, -300, 620, 'rgba(255,150,60,0.55)', burn);
  }
  g.restore();
}

// ----- text cards / stamps -----
function stamp(g, str, x, y, size, t0, t, col = C.red, rot = -0.08) {
  const k = seg(t, t0, t0 + 0.28); if (k <= 0) return;
  const sc = lerp(2.4, 1, E.out(k)), a = clamp(k * 3);
  g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
  comicText(g, str, 0, 0, size, col, { shadow: size * 0.06 });
  g.restore();
}
