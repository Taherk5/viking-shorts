// ---------- scenes & timeline ----------
const TOTAL = 64.5;
const SC = {};   // baked cache

function baked(key, w, h, fn) {
  if (!SC[key]) { const L = layer(w, h); fn(L.g, L); SC[key] = L; }
  return SC[key];
}
function camBegin(g, o = {}) {
  g.save();
  g.translate(W / 2 + (o.sx || 0), H / 2 + (o.sy || 0)); g.rotate(o.rot || 0);
  const z = o.z || 1; g.scale(z, z);
  g.translate(-(o.x == null ? W / 2 : o.x), -(o.y == null ? H / 2 : o.y));
}
const camEnd = g => g.restore();
const shk = (t, a, f = 31) => [Math.sin(t * f * 1.31) * a, Math.cos(t * f * 0.93) * a];

// sky layers ------------------------------------------------------------
function skyDawn() {
  return baked('skyDawn', W + 200, H + 200, (g) => {
    gradFill(g, 0, 0, W + 200, 520, [[0, '#24114a'], [0.4, '#6e2b78'], [0.72, '#e2535c'], [1, '#ffb45a']]);
    brushStrokes(g, 0, 0, W + 200, 520, ['#3a1a66', '#8a3a86', '#ff7a5a', '#ffc070'], 160, 120, 0.22, 4, 0.04);
    const ht = halftoneLayer(W + 200, 380, 'rgba(30,8,60,0.55)', (x, y) => Math.pow(1 - y, 1.8) * 1.15, 11, 5);
    g.drawImage(ht.c, 0, 0, ht.w, ht.h);
  });
}
function skyBurn() {
  return baked('skyBurn', W + 400, H + 200, (g) => {
    gradFill(g, 0, 0, W + 400, H + 200, [[0, '#2b1050'], [0.35, '#6b2377'], [0.7, '#c43b50'], [1, '#ff8a3a']]);
    brushStrokes(g, 0, 0, W + 400, H + 200, ['#3a1a66', '#9a2f7a', '#ff5a3a', '#ffa040'], 260, 160, 0.2, 9, 0.05);
    const ht = halftoneLayer(W + 400, 420, 'rgba(25,5,50,0.6)', (x, y) => Math.pow(1 - y, 1.5) * 1.2, 11, 5.2);
    g.drawImage(ht.c, 0, 0, ht.w, ht.h);
    const ht2 = halftoneLayer(W + 400, 300, 'rgba(255,200,90,0.5)', (x, y) => Math.pow(y, 2.4) * 1.1, 11, 4.4);
    g.drawImage(ht2.c, 0, H - 100, ht2.w, ht2.h);
  });
}
function skyCalm() {
  return baked('skyCalm', W + 200, H + 200, (g) => {
    gradFill(g, 0, 0, W + 200, H + 200, [[0, '#8fb6e8'], [0.4, '#f4c9d8'], [0.62, '#ffe6b8'], [1, '#ffe9c4']]);
    brushStrokes(g, 0, 0, W + 200, H + 200, ['#ffffff', '#ffd6e0', '#cfe0ff'], 140, 140, 0.25, 21, 0.03);
    const ht = halftoneLayer(W + 200, 300, 'rgba(80,110,190,0.35)', (x, y) => Math.pow(1 - y, 1.8), 12, 5);
    g.drawImage(ht.c, 0, 0, ht.w, ht.h);
  });
}
function putSky(g, L, dx = 0, dy = 0) { g.drawImage(L.c, -(L.w - W) / 2 + dx, -(L.h - H) / 2 + dy, L.w, L.h); }

function groundStrip(g, y0, c0, c1, seed, scroll = 0, hi = 'rgba(255,170,90,0.35)', y1 = H + 120, xs = W + 400, n = 90) {
  gradFill(g, -300, y0, xs + 400, y1 - y0, [[0, c0], [1, c1]]);
  const r = mulberry32(seed);
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = ((r() * xs - scroll * (0.4 + r() * 0.9)) % xs + xs) % xs - 200;
    const y = y0 + 10 + r() * (y1 - y0 - 60), l = 40 + r() * 90;
    g.strokeStyle = r() > 0.5 ? hi : 'rgba(30,5,50,0.35)'; g.lineWidth = 3 + r() * 6;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 3, x + l, y); g.stroke();
  }
  g.restore();
}

// speech balloon
function balloon(g, str, x, y, a = 1, tailX = 0, tailY = 50, size = 34, k = 1) {
  if (a <= 0) return;
  g.save(); g.translate(x, y); g.scale(k, k); g.globalAlpha = a;
  g.font = `900 ${size}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = g.measureText(str).width + 46, h = size + 34;
  g.beginPath();
  g.moveTo(-w / 2 + 20, -h / 2); g.arcTo(w / 2, -h / 2, w / 2, h / 2, 20); g.arcTo(w / 2, h / 2, -w / 2, h / 2, 20);
  g.lineTo(clamp(tailX + 22, -w / 2 + 30, w / 2 - 10), h / 2); g.lineTo(tailX, tailY + h / 2);
  g.lineTo(clamp(tailX - 8, -w / 2 + 30, w / 2 - 30), h / 2);
  g.arcTo(-w / 2, h / 2, -w / 2, -h / 2, 20); g.arcTo(-w / 2, -h / 2, w / 2, -h / 2, 20); g.closePath();
  g.fillStyle = '#fff'; g.fill(); g.lineWidth = 6; g.strokeStyle = C.ink; g.stroke();
  g.fillStyle = C.ink; g.fillText(str, 0, 2);
  g.restore();
}
function popK(t, t0, dur = 0.35) { return E.back(seg(t, t0, t0 + dur)); }

// ===================================================================
// S1 – the ship on the dawn sea (0 .. 8)
// ===================================================================
function sceneSea(g, u) {
  camBegin(g, { z: 1.0 + 0.05 * (u / 8), x: W / 2 - 14 * (u / 8), y: H / 2 + 6 * (u / 8), rot: Math.sin(u * 0.9) * 0.006 });
  putSky(g, skyDawn());
  // sun
  const sunY = 370 - 6 * (u / 8);
  glow(g, 800, sunY, 420, 'rgba(255,190,90,0.75)');
  circle(g, 800, sunY, 82, '#fff0b0', 0);
  g.save(); g.beginPath(); g.arc(800, sunY, 82, 0, 7); g.clip();
  g.fillStyle = dots(g, 3.2, '#ffb24a', 10); g.fillRect(700, sunY - 90, 220, 120);
  g.restore();
  // clouds
  cloud(g, 160 + u * 6, 215, 1.2, '#4a2470', '#ff9d6a', 1);
  cloud(g, 1030 - u * 5, 175, 1.0, '#5d2c7d', '#ffb870', 2);
  cloud(g, 560 + u * 3, 118, 0.8, '#3a1d62', '#ff8a70', 3);
  // distant coast + tiny monastery
  g.save();
  g.beginPath(); g.moveTo(1000, 392); g.lineTo(1060, 372); g.lineTo(1130, 360); g.lineTo(1190, 352); g.lineTo(1400, 350); g.lineTo(1400, 400); g.lineTo(1000, 400); g.closePath();
  g.fillStyle = '#4b2a68'; g.fill(); g.lineWidth = 4; g.strokeStyle = C.ink; g.stroke();
  g.fillStyle = '#3a1f56'; g.fillRect(1180, 318, 22, 36); poly(g, [[1176, 320], [1191, 296], [1206, 320]], '#2a1545', 3);
  g.fillRect(1150, 334, 34, 20);
  g.restore();
  drawSea(g, 384, 800, u, { far: '#c85468', near: '#1f1250', crest: 'rgba(255,205,150,0.6)' });
  sunGlitter(g, 800, 392, 540, u);
  // ship
  const sy = 590 + Math.sin(u * 1.5) * 7, sx = 520 + Math.sin(u * 0.5) * 8;
  const crew = (g2, t) => {
    placeChar(g2, { kind: 'viking', x: 188, y: -28, s: 0.5, ph: 0.3, face: { eyes: 'angry', mouth: 'scream', open: 0.5 + 0.4 * Math.sin(t * 7) }, armR: [96, -230], itemR: { kind: 'axe', ang: 0.2 }, armL: [-80, -80] }, t);
    placeChar(g2, { kind: 'viking2', x: 88, y: -28, s: 0.46, ph: 1.4, face: { eyes: 'dot', mouth: 'grin', look: [6, 0] } }, t);
    placeChar(g2, { kind: 'maiden', x: -48, y: -28, s: 0.48, ph: 2.1, face: { eyes: 'smug', mouth: 'smirk' }, itemR: { kind: 'lolly', spin: 1.2 }, armR: [92, -180] }, t);
    placeChar(g2, { kind: 'viking2', x: -160, y: -28, s: 0.46, ph: 3.3, face: { eyes: 'closed', mouth: 'open', open: 0.2 } }, t);
  };
  drawShip(g, sx, sy, 0.98, u, { crew, windy: 1 });
  foam(g, sx, sy + 24, 520, u, { vy: 14 });
  // foreground wave band
  g.save();
  for (let i = 0; i < 2; i++) {
    const yy = 700 + i * 24; g.beginPath(); g.moveTo(-10, 760);
    for (let x = -10; x <= W + 10; x += 16) g.lineTo(x, yy + Math.sin(x / 90 + u * 1.7 + i * 2) * 10);
    g.lineTo(W + 10, 760); g.closePath(); g.fillStyle = i ? '#150a3a' : '#25155a'; g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(255,190,140,0.5)'; g.stroke();
  }
  g.restore();
  camEnd(g);
  // title
  const ta = 1 - seg(u, 5.3, 6.0);
  if (ta > 0) {
    const k = E.out(seg(u, 0.35, 0.75)), yoff = -E.in(seg(u, 5.3, 6.0)) * 60;
    g.save(); g.globalAlpha = ta; g.translate(W / 2, 128 + yoff); g.rotate(-0.04); const sc = lerp(2.6, 1, k); g.scale(sc, sc); g.globalAlpha *= clamp(k * 4);
    comicText(g, 'VIKINGS', 0, 0, 170, C.yellow, { shadow: 12 });
    g.restore();
    if (u > 1.4) { g.save(); g.globalAlpha = ta * seg(u, 1.4, 1.9); comicText(g, 'the real story', W / 2 + 4, 226 + yoff, 38, '#fff', { shadow: 3, weight: 800 }); g.restore(); }
  }
  // location card
  const ck = E.out(seg(u, 5.6, 6.2)) * (1 - seg(u, 7.5, 8));
  if (ck > 0) {
    g.save(); g.translate(60 - (1 - ck) * 400, 70);
    rrect(g, 0, 0, 470, 84, 18, 'rgba(24,8,40,0.9)', 5);
    circle(g, 40, 42, 12, C.red, 4); poly(g, [[30, 48], [50, 48], [40, 66]], C.red, 3);
    g.font = '900 30px Inter'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('Lindisfarne, England', 74, 30);
    g.font = '700 24px Inter'; g.fillStyle = C.yellow; g.fillText('8 June, AD 793', 74, 61);
    g.restore();
  }
}

// ===================================================================
// S2 – the monk reads, sees the ship (0 .. 7)
// ===================================================================
function sceneMonk(g, u) {
  camBegin(g, { z: 1.03 + 0.05 * (u / 7), x: W / 2 + 20 * (u / 7), y: H / 2, rot: Math.sin(u * 1.1) * 0.004 });
  putSky(g, skyCalm());
  // sun + clouds
  circle(g, 980, 150, 54, '#fff4c8', 0); glow(g, 980, 150, 260, 'rgba(255,230,160,0.7)');
  cloud(g, 300 + u * 6, 130, 1.0, '#ffffff', '#ffd2dc', 4); cloud(g, 800 - u * 4, 230, 0.8, '#fff', '#ffd2dc', 5);
  // sea
  drawSea(g, 330, 560, u * 0.6, { far: '#9fc6ee', near: '#4f7fc4', crest: 'rgba(255,255,255,0.7)', rows: 8, speed: 0.6 });
  // tiny ship on horizon
  const sk = seg(u, 2.6, 7);
  if (sk > 0) {
    const sx = lerp(1050, 780, E.inOut(sk)), s = lerp(0.1, 0.2, sk);
    drawShip(g, sx, 345 + Math.sin(u * 1.2) * 1.5, s, u, { crew: null, oars: true, windy: 0.4 });
  }
  // cliff / grass + wall
  g.save();
  g.beginPath(); g.moveTo(-100, 520); g.quadraticCurveTo(400, 470, 760, 520); g.quadraticCurveTo(1000, 560, 1400, 540); g.lineTo(1400, 900); g.lineTo(-100, 900); g.closePath();
  g.fillStyle = '#7ca860'; g.fill(); g.lineWidth = 6; g.strokeStyle = C.ink; g.stroke();
  g.clip(); brushStrokes(g, -100, 460, W + 200, 400, ['#5d8c48', '#a4cd7c', '#4f7a3e'], 120, 70, 0.5, 31, -0.6);
  g.fillStyle = dots(g, 2.2, '#3e6a35', 9); g.fillRect(-100, 600, W + 200, 300);
  g.restore();
  // stone wall seat
  rrect(g, 120, 600, 560, 140, 14, '#b8a3b8', 6);
  g.save(); g.beginPath(); g.rect(120, 600, 560, 140); g.clip();
  g.strokeStyle = 'rgba(60,30,70,0.45)'; g.lineWidth = 3;
  for (let j = 0; j < 4; j++) { g.beginPath(); g.moveTo(120, 636 + j * 34); g.lineTo(680, 636 + j * 34); g.stroke(); for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(140 + i * 76 + (j % 2) * 38, 636 + j * 34 - 34); g.lineTo(140 + i * 76 + (j % 2) * 38, 636 + j * 34); g.stroke(); } }
  g.fillStyle = dots(g, 2, '#6e5a8e', 9); g.fillRect(420, 600, 280, 140);
  g.restore();
  // monk
  const look = u > 3.0;
  const jolt = look ? E.out(seg(u, 3.0, 3.25)) : 0;
  const bookY = u < 3.05 ? -104 : -104 + 0.5 * 2600 * Math.pow(u - 3.05, 2);
  const bookR = u < 3.05 ? 0 : (u - 3.05) * 4.5;
  const scream = seg(u, 5.2, 5.5);
  const monk = {
    kind: 'monk', x: 400, y: 810 + (1 - E.out(seg(u, 0, 0.5))) * 80, s: 1.5, ph: 0.4, squash: 1 + 0.12 * Math.sin(jolt * Math.PI) * (u < 3.6 ? 1 : 0),
    face: look
      ? (u < 5.2 ? { eyes: 'wide', mouth: 'wobble', brow: 'worry', sweat: true, look: [10, -4] } : { eyes: 'wide', mouth: 'scream', open: 0.7 + 0.3 * Math.sin(u * 25), brow: 'worry', sweat: true, look: [10, -4] })
      : { eyes: 'closed', mouth: 'smile', open: 0.3, blush: true },
    tilt: look ? -0.05 - 0.03 * Math.sin(u * 30) * (u > 4 ? 1 : 0) : 0.04 + Math.sin(u * 1.6) * 0.02,
    hdy: look ? -10 * jolt : 0,
    armL: look ? [-130, -230 - 20 * Math.sin(u * 18) * (u > 4 ? 1 : 0)] : [-62, -108],
    armR: look ? [130, -230 + 20 * Math.sin(u * 18 + 1) * (u > 4 ? 1 : 0)] : [62, -108],
    extra: (gg, t) => {
      if (u < 3.05) {
        gg.save(); gg.translate(0, -104); drawItem(gg, { kind: 'book', open: 1 }, 0, 0, t, 0); gg.restore();
      } else {
        gg.save(); gg.translate(0, bookY); gg.rotate(bookR); gg.globalAlpha = 1 - seg(u, 3.6, 3.9); drawItem(gg, { kind: 'book', open: 1 }, 0, 0, t, 0); gg.restore();
      }
    },
  };
  placeChar(g, monk, u);
  // "!" pop
  if (u > 3.0) {
    const k = popK(u, 3.05, 0.3);
    g.save(); g.translate(640, 250); g.scale(k, k); g.rotate(0.1);
    comicText(g, '!', 0, 0, 200, C.red, { shadow: 12 });
    g.restore();
  }
  camEnd(g);
}

// ===================================================================
// S3 – landing on the beach (0 .. 7)
// ===================================================================
function sceneBeach(g, u) {
  const tx = u > 4.5 ? (u - 4.5) * 40 : 0;
  const [sx_, sy_] = u > 2.35 && u < 3.0 ? shk(u, 6 * (1 - seg(u, 2.35, 3.0))) : [0, 0];
  camBegin(g, { z: 1.0 + 0.04 * (u / 7), x: W / 2 + tx, y: H / 2, sx: sx_, sy: sy_ });
  putSky(g, skyDawn(), 0, -40);
  glow(g, 300, 330, 380, 'rgba(255,190,100,0.6)');
  circle(g, 300, 330, 62, '#fff0b0', 0);
  cloud(g, 760 + u * 5, 150, 1.1, '#5d2c7d', '#ffb870', 6);
  drawSea(g, 360, 560, u, { far: '#d46a6c', near: '#33205f', crest: 'rgba(255,205,150,0.6)', rows: 8 });
  // distant monastery (not yet burning)
  drawMonastery(g, 1060, 470, 0.34, u, { burn: 0 });
  // sand
  groundStrip(g, 520, '#e9b57c', '#a86a58', 41, u * 8, 'rgba(255,230,170,0.5)');
  // foam line
  g.save(); g.beginPath(); g.moveTo(-100, 520);
  for (let x = -100; x <= W + 300; x += 20) g.lineTo(x, 520 + Math.sin(x / 70 + u * 1.5) * 7 + 8); g.lineTo(W + 300, 500); g.lineTo(-100, 500); g.closePath();
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.fill(); g.restore();
  // ship
  const arrive = E.out(seg(u, 0, 2.4));
  const bump = u > 2.4 ? Math.sin((u - 2.4) * 9) * 0.04 * Math.exp(-(u - 2.4) * 2.4) : 0;
  const shipX = lerp(-330, 330, arrive) + (u > 2.4 ? -Math.exp(-(u - 2.4) * 6) * 10 : 0);
  const crewOn = (g2, t) => {
    const jumpedB = u > 2.8, jumpedA = u > 3.2;
    if (!jumpedA) placeChar(g2, { kind: 'maiden', x: 80, y: -28, s: 0.5, ph: 1.4, face: { eyes: 'angry', mouth: 'scream', open: 0.6 }, itemR: { kind: 'axe', ang: 0.15 }, armR: [92, -210] }, t);
    if (!jumpedB) placeChar(g2, { kind: 'viking', x: 180, y: -28, s: 0.52, ph: 0.3, face: { eyes: 'angry', mouth: 'scream', open: 0.7 }, itemR: { kind: 'axe', ang: 0.2 }, armR: [96, -230], armL: [-80, -80] }, t);
    placeChar(g2, { kind: 'viking2', x: -90, y: -28, s: 0.48, ph: 2.1, face: { eyes: 'wide', mouth: 'o', open: 0.8 }, hdy: 0 }, t);
  };
  drawShip(g, shipX, 520 + Math.sin(u * 1.4) * (u < 2.4 ? 5 : 1), 0.92, u, { crew: crewOn, tilt: bump, oars: u < 2.4, windy: 0.5, ph: 0 });
  if (u < 2.6) foam(g, shipX, 548, 420, u * 1.4, { vy: 10 });
  // jumpers
  const jump = (t0, x0, x1, kind, extra) => {
    if (u < t0) return;
    const k = seg(u, t0, t0 + 0.6), x = lerp(x0, x1, E.out(k)), arc = -Math.sin(k * Math.PI) * 130;
    const land = u > t0 + 0.6;
    const sqz = land ? 1 - 0.18 * Math.exp(-(u - t0 - 0.6) * 9) * Math.cos((u - t0 - 0.6) * 22) : 1 + 0.08 * Math.sin(k * Math.PI);
    return Object.assign({ kind, x, y: 610 + arc, squash: sqz, s: lerp(0.5, 0.78, E.out(k)) }, extra);
  };
  const run = u > 4.6;
  const rx = (u - 4.6) * 250;
  const b = jump(2.8, 520, 760, 'viking', { ph: 0.3, face: { eyes: 'angry', mouth: 'scream', open: 0.5 + 0.4 * Math.sin(u * 12) }, armR: [96, -230], itemR: { kind: 'axe', ang: 0.2 }, armL: [-90, -90], itemL: { kind: 'shield' } });
  if (b) { if (run) { b.x += rx; b.walk = u * 13; b.bob = -Math.abs(Math.sin(u * 13)) * 12; } placeChar(g, b, u); }
  const a = jump(3.2, 440, 600, 'maiden', { ph: 1.4, face: { eyes: 'angry', mouth: 'scream', open: 0.5 + 0.4 * Math.sin(u * 10) }, armR: [96, -220], itemR: { kind: 'axe', ang: 0.15 } });
  if (a) { if (run) { a.x += rx * 0.9; a.walk = u * 13 + 1; a.bob = -Math.abs(Math.sin(u * 13 + 1)) * 12; } placeChar(g, a, u); }
  // fleeing monks
  if (u > 4.0) {
    const mx = 960 + (u - 4.0) * 330; // running right (off screen)
    placeChar(g, { kind: 'monk', x: mx, y: 640, s: 0.62, ph: 3, walk: u * 17, bob: -Math.abs(Math.sin(u * 17)) * 14, armL: [-120, -240], armR: [120, -220], face: { eyes: 'wide', mouth: 'scream', open: 0.8, tears: true } }, u);
  }
  if (u > 5.0) {
    const mx = 820 + (u - 5.0) * 340;
    placeChar(g, { kind: 'monk', x: mx, y: 600, s: 0.56, ph: 5, walk: u * 17 + 2, bob: -Math.abs(Math.sin(u * 17 + 2)) * 14, armL: [-120, -240], armR: [120, -220], face: { eyes: 'wide', mouth: 'scream', open: 0.8, tears: true } }, u);
  }
  // roar text
  if (u > 3.6 && u < 5.4) { const k = popK(u, 3.6, 0.3); g.save(); g.translate(790 + tx * 0, 210); g.scale(k, k); g.rotate(-0.08); comicText(g, 'AAARGH!', 0, 0, 96, C.yellow, { shadow: 7 }); g.restore(); }
  camEnd(g);
}

// ===================================================================
// S4 – raid chase, tracking shot (0 .. 10)
// ===================================================================
function sceneRaid(g, u) {
  const sh = shk(u, 3.5);
  camBegin(g, { z: 1.04, sx: sh[0], sy: sh[1], rot: Math.sin(u * 3) * 0.004 });
  putSky(g, skyBurn(), 0, 0);
  // far glow + smoke columns
  glow(g, 700, 350, 700, 'rgba(255,120,50,0.5)');
  smoke(g, 420, 420, u, { n: 16, seed: 3, w: 260, rise: 520, alpha: 0.7, drift: 120 });
  // big monastery scrolling
  const mx = 1000 - u * 46;
  drawMonastery(g, mx, 640, 1.18, u, { burn: 1 });
  // second burning hut
  drawMonastery(g, mx + 1100, 640, 0.8, u + 3, { burn: 1 });
  smoke(g, mx - 100, 340, u, { n: 14, seed: 8, w: 300, rise: 520, alpha: 0.6, drift: 140 });
  // background running silhouettes
  const sil = [[-100, 0.46, 0, 1], [340, 0.4, 1, -1], [700, 0.48, 2, 1], [1100, 0.42, 3, -1], [1500, 0.44, 4, 1]];
  sil.forEach(([x0, s, i, d]) => {
    const x = ((x0 + d * u * 160 + 300) % (W + 600)) - 300, y = 590 + (i % 2) * 14;
    placeSilChar(g, { kind: 'monk', x, y, s, flip: d, ph: i, walk: u * 15 + i, bob: -Math.abs(Math.sin(u * 15 + i)) * 10, armL: [-120, -240], armR: [120, -230], face: { eyes: 'wide', mouth: 'scream', open: 0.8 } }, u, '#3a2058');
  });
  // ground
  groundStrip(g, 600, '#5d2a58', '#1f0e38', 51, u * 520, 'rgba(255,150,70,0.4)');
  g.save(); g.globalAlpha = 0.6; gradFill(g, -100, 600, W + 200, 160, [[0, 'rgba(255,120,50,0.5)'], [1, 'rgba(255,120,50,0)']]); g.restore();
  // fg characters
  const bounce = (ph, a) => -Math.abs(Math.sin(u * 13 + ph)) * a;
  // chasing monk (left)
  const mk = 170 + 18 * Math.sin(u * 1.3);
  placeChar(g, { kind: 'monk', x: mk, y: 690, s: 0.78, ph: 2, walk: u * 13 + 2, bob: bounce(2, 12), lean: -8, armL: [-120, -220], armR: [120, -180], face: { eyes: 'cry', mouth: 'scream', open: 0.6 + 0.3 * Math.sin(u * 14), tears: true, brow: 'worry' } }, u);
  // Bjorn
  placeChar(g, { kind: 'viking', x: 540, y: 700, s: 0.9, ph: 0.2, walk: u * 13, bob: bounce(0, 14), lean: 10, face: { eyes: 'angry', mouth: 'scream', open: 0.6 + 0.35 * Math.sin(u * 11) }, armR: [110, -270], itemR: { kind: 'axe', ang: 0.35 }, armL: [-100, -130], itemL: { kind: 'torch', ph: 1 } }, u);
  // Astrid with loot
  placeChar(g, { kind: 'maiden', x: 900, y: 706, s: 0.86, ph: 1.1, walk: u * 13 + 1.5, bob: bounce(1.5, 13), lean: 8, face: { eyes: 'happy', mouth: 'grin', open: 0.5, blush: true }, armR: [100, -230], itemR: { kind: 'chalice', ang: 0.15 }, armL: [-92, -150], itemL: { kind: 'sack', ang: 0.1 } }, u);
  // balloons
  balloon(g, 'FOR ODIN!', 560, 250, seg(u, 0.8, 1.0) * (1 - seg(u, 3.2, 3.5)), -10, 60, 40, popK(u, 0.8));
  balloon(g, 'MY CHALICE!!', 200, 340, seg(u, 3.6, 3.8) * (1 - seg(u, 6.4, 6.7)), 0, 56, 36, popK(u, 3.6));
  balloon(g, 'Haha! Oh well.', 930, 290, seg(u, 5.2, 5.4) * (1 - seg(u, 8.2, 8.5)), -20, 60, 36, popK(u, 5.2));
  // embers over everything
  embers(g, 640, 740, 1400, u, { n: 60, seed: 12, rise: 700, drift: -200 });
  // speed lines
  g.save(); g.globalAlpha = 0.25; g.strokeStyle = '#fff'; g.lineWidth = 3;
  const r = mulberry32(Math.floor(u * 12) + 5);
  for (let i = 0; i < 12; i++) { const y = 80 + r() * 560, x = r() * W, l = 120 + r() * 220; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y); g.stroke(); }
  g.restore();
  camEnd(g);
}

// ===================================================================
// S5 – the reference composition: "why monasteries?" (0 .. 9)
// ===================================================================
function sceneWhy(g, u) {
  const push = u / 9;
  camBegin(g, { z: 1.0 + 0.05 * push, x: W / 2 + 10 * push, y: H / 2, rot: Math.sin(u * 0.8) * 0.004 });
  putSky(g, skyBurn(), 0, 0);
  glow(g, 880, 360, 760, 'rgba(255,120,50,0.55)');
  smoke(g, 760, 440, u, { n: 14, seed: 4, w: 240, rise: 520, alpha: 0.7, drift: 90 });
  drawMonastery(g, 880, 720, 1.22, u, { burn: 1 });
  smoke(g, 1000, 300, u + 2, { n: 10, seed: 9, w: 200, rise: 420, alpha: 0.6, drift: 60 });
  // rubble silhouettes
  g.save(); g.fillStyle = '#2d1245'; g.strokeStyle = C.ink; g.lineWidth = 5;
  g.beginPath(); g.moveTo(560, 760); for (let i = 0; i < 14; i++) g.lineTo(560 + i * 50, 700 - ((i * 37) % 5) * 12 - (i % 3) * 8); g.lineTo(1300, 760); g.closePath(); g.fill(); g.stroke(); g.restore();
  // dark silhouettes (monks with raised hands)
  placeSilChar(g, { kind: 'monk', x: 760, y: 640, s: 0.6, ph: 3, armL: [-120, -240], armR: [120, -240], face: { eyes: 'wide', mouth: 'scream', open: 0.8 } }, u, '#3a2058');
  placeSilChar(g, { kind: 'viking', x: 940, y: 610, s: 0.56, ph: 5, itemR: { kind: 'torch', ph: 2 }, armR: [100, -200], face: { eyes: 'angry', mouth: 'scream' } }, u, '#3a2058');
  placeSilChar(g, { kind: 'monk', x: 80, y: 700, s: 0.7, flip: -1, ph: 1, armL: [-100, -250], armR: [100, -140], face: { eyes: 'wide', mouth: 'o' } }, u, '#3a2058');
  // Astrid with lollipop (dimmed, bottom right)
  placeChar(g, { kind: 'maiden', x: 1120, y: 850, s: 1.15, ph: 2.2, dim: 0.4, face: { eyes: 'smug', mouth: 'smirk' }, hdy: 0, itemR: { kind: 'lolly', spin: 0.8, ang: -0.1 }, armR: [60, -230] }, u);
  // BIG Bjorn, thinking – reference pose
  const think = Math.sin(u * 1.6) * 0.012;
  const hold = seg(u, 0.2, 0.7);
  placeChar(g, {
    kind: 'viking', x: 330, y: 850, s: 1.55, ph: 0.3, tilt: -0.05 + think, hdx: 8, lean: -4,
    face: { eyes: 'squint', mouth: 'flat', brow: null, sweat: false },
    armR: [46, -176 - 6 * Math.sin(u * 2.2)], bendR: -1, armL: [-96, -80],
    extraBack: (gg, t) => {
      // tiny crying monk perched on the shoulder
      gg.save(); gg.translate(172, -138 + Math.sin(u * 2.4) * 2); gg.scale(0.5, 0.5);
      drawChar(gg, { kind: 'monk', ph: 1, face: { eyes: 'cry', mouth: 'wobble', tears: true, brow: 'worry' }, armL: [-110, -250], armR: [110, -110], itemR: { kind: 'lantern' }, tilt: 0.1, bob: 0 }, t);
      gg.restore();
    },
  }, u);
  // "?" floaters
  [[520, 170, 0.6, 0.2], [640, 120, 1.1, -0.15], [400, 100, 1.6, 0.1]].forEach(([qx, qy, t0, rot]) => {
    const k = popK(u, t0 + 0.3, 0.3); if (k <= 0) return;
    g.save(); g.translate(qx, qy + Math.sin(u * 2 + t0) * 5); g.scale(k, k); g.rotate(rot); comicText(g, '?', 0, 0, 110, C.yellow, { shadow: 8 }); g.restore();
  });
  // coins raining + loot text
  if (u > 4.3) {
    const r = mulberry32(77);
    for (let i = 0; i < 26; i++) {
      const t0 = 4.4 + i * 0.12, y0 = -50 + (u - t0) * (380 + r() * 150), x = 700 + r() * 520;
      if (u < t0 || y0 > 760) continue;
      g.save(); g.translate(x, y0); g.scale(Math.cos(u * 6 + i), 1);
      circle(g, 0, 0, 22, i % 3 ? C.gold : '#d9dfe9', 4.5); circle(g, 0, 0, 12, null, 3);
      g.restore();
    }
    const k = popK(u, 4.5, 0.35), k2 = popK(u, 5.6, 0.35);
    g.save(); g.translate(820, 130); g.scale(k, k); g.rotate(-0.06); comicText(g, 'GOLD  +  SILVER', 0, 0, 84, C.gold, { shadow: 7 }); g.restore();
    g.save(); g.translate(930, 220); g.scale(k2, k2); g.rotate(0.04); comicText(g, '0  SOLDIERS', 0, 0, 62, '#fff', { shadow: 6 }); g.restore();
  }
  embers(g, 700, 740, 1200, u, { n: 46, seed: 31, rise: 640, drift: 120 });
  camEnd(g);
}

// ===================================================================
// S6 – myth vs fact (0 .. 11)
// ===================================================================
function sceneMyth(g, u) {
  camBegin(g, { z: 1 + 0.02 * (u / 11), x: W / 2, y: H / 2 });
  // paper bg
  baked('paper', W + 200, H + 200, (gg) => {
    gradFill(gg, 0, 0, W + 200, H + 200, [[0, '#f5e6c5'], [1, '#e8cf9e']]);
    brushStrokes(gg, 0, 0, W + 200, H + 200, ['#fff4d8', '#d9bd86', '#f0d9a8'], 160, 140, 0.25, 61, 0.03);
    const ht = halftoneLayer(W + 200, H + 200, 'rgba(120,70,40,0.45)', (x, y) => Math.pow(Math.abs(x - 0.5) * 2, 3) * 0.9 + Math.pow(y, 4) * 0.7, 12, 5);
    gg.drawImage(ht.c, 0, 0, ht.w, ht.h);
  });
  putSky(g, SC.paper);
  const part2 = u > 6.4;
  if (!part2) {
    // ----- MYTE / FAKTA -----
    const horn = u < 3.6 ? 1 : 0;
    const popOff = seg(u, 3.55, 3.9);
    const enter = E.bounce(seg(u, 0.1, 0.9));
    placeChar(g, {
      kind: 'viking', x: 340, y: 1010 - 330 * enter, s: 1.4, ph: 0.2, helmetHorn: u < 3.55 ? 1 : Math.max(0, 1 - popOff * 4), squash: 1 + 0.1 * Math.exp(-(u - 3.6) * 8) * Math.sin((u - 3.6) * 30) * (u > 3.55 ? 1 : 0),
      face: u < 3.55 ? { eyes: 'happy', mouth: 'grin', blush: true } : (u < 4.3 ? { eyes: 'wide', mouth: 'o', open: 0.7, sweat: true } : { eyes: 'smug', mouth: 'smirk' }),
      armR: u < 3.55 ? [120, -250] : [120, -300], armL: u < 3.55 ? [-120, -250] : [-100, -90],
    }, u);
    // flying horns
    if (u > 3.55 && u < 4.9) {
      const k = u - 3.55;
      for (const sd of [-1, 1]) {
        g.save(); g.translate(340 + sd * 130 + sd * 250 * k, 300 - 520 * k + 1100 * k * k); g.rotate(sd * k * 9);
        g.beginPath(); g.moveTo(-8, 30); g.bezierCurveTo(-30, 0, -12, -40, 14, -52); g.bezierCurveTo(10, -20, 14, 6, 10, 30); g.closePath(); fillStroke(g, '#f4ead0', 5);
        g.restore();
      }
    }
    // MYTE card
    const k1 = seg(u, 0.5, 0.8);
    stamp(g, 'MYTH', 880, 150, 130, 0.5, u, C.red, -0.06);
    g.save(); g.globalAlpha = seg(u, 1.0, 1.4); comicText(g, 'Vikings wore', 880, 262, 56, '#fff', { shadow: 5, align: 'center' }); comicText(g, 'horned helmets', 880, 326, 56, '#fff', { shadow: 5 }); g.restore();
    // red X
    if (u > 3.0) {
      const k = E.out(seg(u, 3.0, 3.25)), k2 = E.out(seg(u, 3.15, 3.4));
      g.save(); g.lineCap = 'round'; g.strokeStyle = C.ink; g.lineWidth = 34;
      g.beginPath(); g.moveTo(720, 230); g.lineTo(720 + 320 * k, 230 + 130 * k); g.moveTo(1040, 230); g.lineTo(1040 - 320 * k2, 230 + 130 * k2); g.stroke();
      g.strokeStyle = C.red; g.lineWidth = 20;
      g.beginPath(); g.moveTo(720, 230); g.lineTo(720 + 320 * k, 230 + 130 * k); g.moveTo(1040, 230); g.lineTo(1040 - 320 * k2, 230 + 130 * k2); g.stroke(); g.restore();
    }
    // FAKTA card
    stamp(g, 'FACT', 880, 440, 120, 4.2, u, '#43c25a', 0.05);
    g.save(); g.globalAlpha = seg(u, 4.7, 5.1);
    comicText(g, 'No horned Viking helmet', 880, 535, 46, '#fff', { shadow: 4 }); comicText(g, 'has ever been found', 880, 590, 46, '#fff', { shadow: 4 }); g.restore();
  } else {
    // ----- opera, 1876 -----
    const v = u - 6.4;
    // spotlight cone & stage
    g.save(); gradFill(g, -100, 0, W + 200, H, [[0, '#2a0c33'], [1, '#52183d']]);
    g.restore();
    // curtains
    const curtain = (side) => {
      g.save(); g.translate(side < 0 ? 0 : W, 0); g.scale(-side, 1);
      g.beginPath(); g.moveTo(-10, -10); g.lineTo(260, -10); g.quadraticCurveTo(190, 360, 130, H + 10); g.lineTo(-10, H + 10); g.closePath(); g.fillStyle = '#9d1e3a'; g.fill(); g.lineWidth = 6; g.strokeStyle = C.ink; g.stroke();
      g.clip(); for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(i * 44, -10); g.quadraticCurveTo(i * 44 - 22 + Math.sin(v * 1.4 + i) * 4, 360, i * 44 - 40, H + 10); g.lineWidth = 6; g.strokeStyle = 'rgba(20,0,20,0.4)'; g.stroke(); }
      g.restore();
    };
    // spot
    g.save(); g.globalCompositeOperation = 'screen';
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,240,200,0.5)'); gr.addColorStop(1, 'rgba(255,240,200,0.12)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(560, -10); g.lineTo(720, -10); g.lineTo(980, H); g.lineTo(300, H); g.closePath(); g.fill(); g.restore();
    // floor
    gradFill(g, -100, 600, W + 200, 200, [[0, '#5a3a2a'], [1, '#2a1812']]);
    g.beginPath(); g.moveTo(-100, 600); g.lineTo(W + 100, 600); g.lineWidth = 6; g.strokeStyle = C.ink; g.stroke();
    curtain(-1); curtain(1);
    // singer
    const enter = E.out(seg(v, 0, 0.6));
    placeChar(g, {
      kind: 'viking2', x: 640, y: 1010 - 330 * enter, s: 1.2, ph: 0.8, helmetHorn: 1, squash: 1 + 0.03 * Math.sin(v * 8),
      face: { eyes: 'closed', mouth: 'scream', open: 0.5 + 0.5 * Math.abs(Math.sin(v * 7)), blush: true },
      armL: [-120, -250], armR: [120, -250], tilt: Math.sin(v * 3) * 0.03,
    }, u);
    // music notes
    for (let i = 0; i < 6; i++) {
      const ph = (v * 0.5 + i / 6) % 1, x = 520 + (i % 2 ? 380 : -220) + Math.sin(ph * 6 + i) * 30, y = 520 - ph * 420;
      g.save(); g.globalAlpha = Math.sin(ph * Math.PI); g.translate(x, y); g.rotate(Math.sin(v * 3 + i) * 0.3);
      g.fillStyle = C.yellow; g.strokeStyle = C.ink; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 0, 14, 10, -0.4, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(11, -3); g.lineTo(11, -48); g.lineWidth = 7; g.stroke(); g.strokeStyle = C.yellow; g.lineWidth = 3.5; g.stroke(); g.restore();
    }
    // card
    const k = popK(v, 0.4, 0.4); g.save(); g.translate(W / 2, 112); g.scale(k, k); g.rotate(-0.03);
    comicText(g, 'OPERA  ·  1876', 0, 0, 92, C.yellow, { shadow: 7 }); g.restore();
    g.save(); g.globalAlpha = seg(v, 1.2, 1.6); comicText(g, "Wagner's costumes made the horns famous", W / 2, 186, 38, '#fff', { shadow: 3, weight: 800 }); g.restore();
  }
  camEnd(g);
}

// ===================================================================
// S7 – fleet & end card (0 .. 10)
// ===================================================================
function sceneFleet(g, u) {
  if (u < 7.0) {
    camBegin(g, { z: 1.0 + 0.04 * (u / 7), x: W / 2 + 10 * (u / 7), y: H / 2 + 10 });
    baked('skySet', W + 200, H + 200, (gg) => {
      gradFill(gg, 0, 0, W + 200, 520, [[0, '#1d0f45'], [0.35, '#5a2273'], [0.7, '#e0485e'], [1, '#ffbd5a']]);
      brushStrokes(gg, 0, 0, W + 200, 520, ['#3a1a66', '#9a2f7a', '#ff6a4a', '#ffd070'], 160, 130, 0.22, 77, 0.04);
      const ht = halftoneLayer(W + 200, 380, 'rgba(25,5,50,0.55)', (x, y) => Math.pow(1 - y, 1.7) * 1.15, 11, 5);
      gg.drawImage(ht.c, 0, 0, ht.w, ht.h);
    });
    putSky(g, SC.skySet);
    glow(g, 640, 410, 560, 'rgba(255,200,100,0.8)');
    circle(g, 640, 410, 120, '#fff2b8', 0);
    g.save(); g.beginPath(); g.arc(640, 410, 120, 0, 7); g.clip(); g.fillStyle = dots(g, 3.6, '#ffb040', 11); g.fillRect(500, 380, 300, 160); g.restore();
    cloud(g, 200 + u * 7, 190, 1.3, '#43205f', '#ff9a6a', 7); cloud(g, 1080 - u * 6, 140, 1.0, '#58287a', '#ffb070', 8);
    drawSea(g, 412, 800, u, { far: '#d4586a', near: '#1d0f48', crest: 'rgba(255,210,150,0.6)' });
    sunGlitter(g, 640, 420, 600, u);
    // ships: sailing toward the sun
    const fleet = [
      { x: 250, y: 580, s: 0.56, lab: 'ENGLAND', t0: 1.0, ph: 0 },
      { x: 560, y: 535, s: 0.44, lab: 'FRANCE', t0: 2.5, ph: 1 },
      { x: 820, y: 488, s: 0.33, lab: 'RUSSIA', t0: 4.0, ph: 2 },
      { x: 1040, y: 458, s: 0.25, lab: 'AMERICA', t0: 5.5, ph: 3 },
    ];
    for (let i = fleet.length - 1; i >= 0; i--) {
      const f = fleet[i];
      const x = f.x + Math.sin(u * 0.6 + i) * 10 + u * (14 - i * 2), y = f.y + Math.sin(u * 1.4 + i) * 4;
      drawShip(g, x, y, f.s, u + i, { crew: null, windy: 1, ph: f.ph });
      foam(g, x, y + 24 * f.s, 520 * f.s, u + i, { vy: 8 * f.s });
      const k = popK(u, f.t0, 0.4);
      if (k > 0) {
        // flag on the mast top
        g.save(); g.translate(x + 8 * f.s, y - 380 * f.s); g.scale(k, k);
        g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -64); g.lineWidth = 9; g.strokeStyle = C.ink; g.stroke(); g.lineWidth = 4; g.strokeStyle = C.steelHi; g.stroke();
        g.save(); g.translate(0, -64); g.rotate(Math.sin(u * 3 + i) * 0.04);
        g.font = '900 28px Inter'; const tw = g.measureText(f.lab).width;
        rrect(g, 0, -44, tw + 28, 48, 10, C.cream, 5);
        g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = C.ink; g.fillText(f.lab, 14, -19);
        g.restore(); g.restore();
      }
    }
    camEnd(g);
  } else {
    // ----- end card -----
    const v = u - 7.0;
    baked('skyEnd', W, H, (gg) => {
      gradFill(gg, 0, 0, W, H, [[0, '#24114a'], [0.6, '#6e2b78'], [1, '#e2535c']]);
      brushStrokes(gg, 0, 0, W, H, ['#3a1a66', '#8a3a86', '#ff7a5a'], 200, 130, 0.22, 91, 0.04);
      const ht = halftoneLayer(W, H, 'rgba(25,5,50,0.55)', (x, y) => Math.pow(1 - y, 1.4), 11, 5);
      gg.drawImage(ht.c, 0, 0, ht.w, ht.h);
    });
    g.drawImage(SC.skyEnd.c, 0, 0, W, H);
    const k0 = popK(v, 0.0, 0.5);
    g.save(); g.translate(W / 2, 140); g.scale(k0, k0); comicText(g, 'NEXT TIME', 0, 0, 60, '#fff', { shadow: 5 }); g.restore();
    const k1 = popK(v, 0.3, 0.5);
    g.save(); g.translate(W / 2, 250); g.scale(k1, k1); g.rotate(-0.03); comicText(g, 'RAGNAR LOTHBROK', 0, 0, 104, C.yellow, { shadow: 8 }); g.restore();
    const k2 = popK(v, 0.8, 0.5);
    g.save(); g.translate(W / 2, 340); g.scale(k2, k2); comicText(g, 'legend or reality?', 0, 0, 46, '#fff', { shadow: 4, weight: 800 }); g.restore();
    // subscribe
    const k3 = popK(v, 1.4, 0.5), pulse = 1 + Math.sin(v * 5) * 0.025;
    g.save(); g.translate(W / 2, 450); g.scale(k3 * pulse, k3 * pulse);
    rrect(g, -235, -48, 470, 96, 48, C.red, 6);
    g.save(); g.beginPath(); g.rect(-235, -48, 470, 48); g.clip(); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(-235, -48, 470, 48); g.restore();
    g.font = '900 44px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('SUBSCRIBE', 28, 3);
    // bell
    g.save(); g.translate(-155, 0); g.rotate(Math.sin(v * 9) * 0.22 * (v % 1.6 < 0.9 ? 1 : 0));
    g.beginPath(); g.moveTo(-16, 16); g.quadraticCurveTo(-14, -6, -6, -18); g.quadraticCurveTo(0, -26, 6, -18); g.quadraticCurveTo(14, -6, 16, 16); g.closePath(); fillStroke(g, C.yellow, 4);
    circle(g, 0, 22, 6, C.yellow, 3.5); g.restore();
    g.restore();
    // characters waving in the lower corners
    placeChar(g, { kind: 'viking', x: 170, y: 850 - 130 * E.out(seg(v, 0.2, 0.8)), s: 0.95, ph: 0.2, face: { eyes: 'happy', mouth: 'grin', blush: true }, armR: [118, -250 + Math.sin(v * 8) * 24], armL: [-100, -80], itemL: { kind: 'shield' } }, u);
    placeChar(g, { kind: 'maiden', x: 1110, y: 850 - 130 * E.out(seg(v, 0.35, 0.95)), s: 0.95, ph: 1.4, face: { eyes: 'happy', mouth: 'smile', open: 0.8, blush: true }, armL: [-118, -250 + Math.sin(v * 8 + 1) * 24], armR: [100, -90] }, u);
    // end-screen safe zones hint is left empty on purpose
  }
}

// ===================================================================
// timeline
// ===================================================================
const TL = [
  { a: 0, b: 8, fn: sceneSea },
  { a: 8, b: 15, fn: sceneMonk },
  { a: 15, b: 22, fn: sceneBeach },
  { a: 22, b: 32, fn: sceneRaid },
  { a: 32, b: 41, fn: sceneWhy },
  { a: 41, b: 52, fn: sceneMyth },
  { a: 52, b: 62, fn: sceneFleet },
];
const SUBS = [
  [0.7, 4.3, 'The Vikings. Northern warriors who terrified Europe.'],
  [4.6, 8.2, 'It began on a quiet morning, in the year 793…'],
  [8.4, 11.8, 'On Lindisfarne, the monks were reading in peace…'],
  [12.0, 14.8, 'Suddenly, a ship appeared out of the mist.'],
  [15.4, 18.6, 'They crossed the North Sea, and nobody was ready.'],
  [19.2, 21.8, 'The monastery stood defenseless.'],
  [22.4, 26.6, 'It was looted and set on fire.'],
  [27.0, 31.7, 'The news shocked all of Europe. The Viking Age had begun.'],
  [32.6, 36.4, 'But why did they target monasteries?'],
  [36.8, 40.8, 'Because they held gold and silver, and had no soldiers.'],
  [41.6, 45.4, "And then there's the myth of the horned helmet…"],
  [48.4, 52.0, 'It was made famous by an opera, in 1876.'],
  [52.6, 58.2, 'The Vikings sailed to England, France, Russia, and all the way to America.'],
];

function drawFrame(g, t) {
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  let sc = TL[TL.length - 1];
  for (const s of TL) if (t >= s.a && t < s.b) { sc = s; break; }
  const u = t - sc.a;
  g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip();
  sc.fn(g, u);
  g.restore();
  // cut flash
  for (const s of TL) {
    if (s.a === 0) continue;
    const d = t - s.a;
    if (d >= 0 && d < 0.16) { g.fillStyle = `rgba(255,245,220,${0.85 * (1 - d / 0.16)})`; g.fillRect(0, 0, W, H); }
  }
  // subtitles
  for (const [a, b, str] of SUBS) {
    if (t >= a && t <= b) subtitle(g, str, Math.min(seg(t, a, a + 0.25), 1 - seg(t, b - 0.25, b)));
  }
  post(g, t);
  // global fades
  const fi = 1 - seg(t, 0, 0.6), fo = seg(t, TOTAL - 0.9, TOTAL);
  const f = Math.max(fi, fo);
  if (f > 0) { g.fillStyle = `rgba(0,0,0,${f})`; g.fillRect(0, 0, W, H); }
}

function post(g, t) {
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H * 1.0);
  gr.addColorStop(0, 'rgba(12,0,24,0)'); gr.addColorStop(1, 'rgba(12,0,24,0.5)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const gt = grainTile(), fr = Math.floor(t * 24);
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.16;
  const ox = -((fr * 97) % 256), oy = -((fr * 57) % 256);
  for (let y = oy; y < H; y += 256) for (let x = ox; x < W; x += 256) g.drawImage(gt, x, y, 256, 256);
  g.restore();
}
