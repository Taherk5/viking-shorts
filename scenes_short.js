// ---------- vertical (9:16) version for YouTube Shorts: 720 x 1280 logical, rendered at 1.5x = 1080 x 1920 ----------
const PW = 720, PH = 1280;
const TOTAL_P = 59.8;      // stay safely under 60 s
const END_P = 57.6;        // end card starts here

function camP(g, o = {}) {
  g.save();
  g.translate(PW / 2 + (o.sx || 0), PH / 2 + (o.sy || 0)); g.rotate(o.rot || 0);
  const z = o.z || 1; g.scale(z, z);
  g.translate(-(o.x == null ? PW / 2 : o.x), -(o.y == null ? PH / 2 : o.y));
}
// tall sky layer: scene (0,0) sits at layer (120,140)
function skyP(key, stops, brush, ht, seed) {
  return baked(key, 960, 1560, (g) => {
    gradFill(g, 0, 0, 960, 1560, stops);
    brushStrokes(g, 0, 0, 960, 1560, brush, 300, 130, 0.2, seed, 0.04);
    const h = halftoneLayer(960, 800, ht, (x, y) => Math.pow(1 - y, 1.5) * 1.15, 11, 5.2);
    g.drawImage(h.c, 0, 0, h.w, h.h);
  });
}
function putSkyP(g, L, dx = 0, dy = 0) { g.drawImage(L.c, -(L.w - PW) / 2 + dx, -(L.h - PH) / 2 + dy, L.w, L.h); }
const skyDawnP = () => skyP('pDawn', [[0, '#1d0f45'], [0.2, '#5a2273'], [0.38, '#e2535c'], [0.5, '#ffbd5a'], [1, '#ffbd5a']], ['#3a1a66', '#8a3a86', '#ff7a5a', '#ffc070'], 'rgba(30,8,60,0.55)', 4);
const skyCalmP = () => skyP('pCalm', [[0, '#8fb6e8'], [0.25, '#f4c9d8'], [0.42, '#ffe6b8'], [1, '#ffe9c4']], ['#ffffff', '#ffd6e0', '#cfe0ff'], 'rgba(80,110,190,0.35)', 21);
const skyBurnP = () => skyP('pBurn', [[0, '#2b1050'], [0.3, '#6b2377'], [0.6, '#c43b50'], [1, '#ff8a3a']], ['#3a1a66', '#9a2f7a', '#ff5a3a', '#ffa040'], 'rgba(25,5,50,0.6)', 9);
const skySetP = () => skyP('pSet', [[0, '#1d0f45'], [0.2, '#5a2273'], [0.36, '#e0485e'], [0.475, '#ffbd5a'], [1, '#ffbd5a']], ['#3a1a66', '#9a2f7a', '#ff6a4a', '#ffd070'], 'rgba(25,5,50,0.55)', 77);

function subtitleP(g, str, a = 1) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a;
  g.font = '800 40px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const lines = wrapLines(g, str, 590), lh = 52, y0 = 1010 - (lines.length - 1) * lh;
  lines.forEach((l, i) => {
    const y = y0 + i * lh + (1 - a) * 10;
    g.lineWidth = 11; g.strokeStyle = C.ink; g.lineJoin = 'round'; g.strokeText(l, PW / 2, y);
    g.fillStyle = '#fff'; g.fillText(l, PW / 2, y);
  });
  g.restore();
}
function sortedDraw(list) { list.sort((a, b) => a.y - b.y).forEach(it => it.fn()); }

// ===================================================================
// P1 – ship on the dawn sea (0 .. 8)
// ===================================================================
function sceneSeaP(g, u) {
  camP(g, { z: 1.0 + 0.05 * (u / 8), x: PW / 2 - 10 * (u / 8), y: PH / 2 + 14 * (u / 8), rot: Math.sin(u * 0.9) * 0.006 });
  putSkyP(g, skyDawnP());
  const hy = 640, sunX = 470, sunY = hy - 10 - 6 * (u / 8);
  glow(g, sunX, sunY, 430, 'rgba(255,190,90,0.75)');
  circle(g, sunX, sunY, 88, '#fff0b0', 0);
  g.save(); g.beginPath(); g.arc(sunX, sunY, 88, 0, 7); g.clip(); g.fillStyle = dots(g, 3.2, '#ffb24a', 10); g.fillRect(sunX - 100, sunY - 90, 200, 130); g.restore();
  cloud(g, 120 + u * 6, 330, 1.2, '#4a2470', '#ff9d6a', 1);
  cloud(g, 610 - u * 5, 250, 1.0, '#5d2c7d', '#ffb870', 2);
  cloud(g, 330 + u * 3, 150, 0.85, '#3a1d62', '#ff8a70', 3);
  // coast with tiny monastery
  g.save();
  g.beginPath(); g.moveTo(520, hy + 8); g.lineTo(580, hy - 14); g.lineTo(650, hy - 26); g.lineTo(730, hy - 34); g.lineTo(900, hy - 36); g.lineTo(900, hy + 12); g.closePath();
  g.fillStyle = '#4b2a68'; g.fill(); g.lineWidth = 4; g.strokeStyle = C.ink; g.stroke();
  g.fillStyle = '#3a1f56'; g.fillRect(640, hy - 68, 22, 36); poly(g, [[636, hy - 66], [651, hy - 92], [666, hy - 66]], '#2a1545', 3); g.fillRect(610, hy - 52, 34, 20);
  g.restore();
  drawSea(g, hy + 4, 1500, u, { far: '#c85468', near: '#1f1250', crest: 'rgba(255,205,150,0.6)' });
  sunGlitter(g, sunX, hy + 8, hy + 170, u);
  const sy = 880 + Math.sin(u * 1.5) * 7, sx = 360 + Math.sin(u * 0.5) * 8;
  const crew = (g2, t) => {
    placeChar(g2, { kind: 'viking', x: 188, y: -28, s: 0.5, ph: 0.3, face: { eyes: 'angry', mouth: 'scream', open: 0.5 + 0.4 * Math.sin(t * 7) }, armR: [96, -230], itemR: { kind: 'axe', ang: 0.2 }, armL: [-80, -80] }, t);
    placeChar(g2, { kind: 'viking2', x: 88, y: -28, s: 0.46, ph: 1.4, face: { eyes: 'dot', mouth: 'grin', look: [6, 0] } }, t);
    placeChar(g2, { kind: 'maiden', x: -48, y: -28, s: 0.48, ph: 2.1, face: { eyes: 'smug', mouth: 'smirk' }, itemR: { kind: 'lolly', spin: 1.2 }, armR: [92, -180] }, t);
    placeChar(g2, { kind: 'viking2', x: -160, y: -28, s: 0.46, ph: 3.3, face: { eyes: 'closed', mouth: 'open', open: 0.2 } }, t);
  };
  drawShip(g, sx, sy, 1.0, u, { crew, windy: 1 });
  foam(g, sx, sy + 24, 520, u, { vy: 14 });
  g.save();
  for (let i = 0; i < 2; i++) {
    const yy = 1150 + i * 36; g.beginPath(); g.moveTo(-300, 1500);
    for (let x = -300; x <= PW + 300; x += 16) g.lineTo(x, yy + Math.sin(x / 90 + u * 1.7 + i * 2) * 10);
    g.lineTo(PW + 300, 1500); g.closePath(); g.fillStyle = i ? '#150a3a' : '#25155a'; g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(255,190,140,0.5)'; g.stroke();
  }
  g.restore();
  camEnd(g);
  // title
  const ta = 1 - seg(u, 5.3, 6.0);
  if (ta > 0) {
    const k = E.out(seg(u, 0.35, 0.75)), yoff = -E.in(seg(u, 5.3, 6.0)) * 60;
    g.save(); g.translate(PW / 2, 215 + yoff); g.rotate(-0.04); const sc = lerp(2.6, 1, k); g.scale(sc, sc); g.globalAlpha = ta * clamp(k * 4);
    comicText(g, 'VIKINGS', 0, 0, 152, C.yellow, { shadow: 11 });
    g.restore();
    if (u > 1.4) { g.save(); g.globalAlpha = ta * seg(u, 1.4, 1.9); comicText(g, 'the real story', PW / 2 + 4, 318 + yoff, 42, '#fff', { shadow: 3, weight: 800 }); g.restore(); }
  }
  const ck = E.out(seg(u, 5.6, 6.2)) * (1 - seg(u, 7.5, 8));
  if (ck > 0) {
    g.save(); g.translate(50 - (1 - ck) * 500, 150);
    rrect(g, 0, 0, 470, 84, 18, 'rgba(24,8,40,0.9)', 5);
    circle(g, 40, 42, 12, C.red, 4); poly(g, [[30, 48], [50, 48], [40, 66]], C.red, 3);
    g.font = '900 30px Inter'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('Lindisfarne, England', 74, 30);
    g.font = '700 24px Inter'; g.fillStyle = C.yellow; g.fillText('8 June, AD 793', 74, 61);
    g.restore();
  }
}

// ===================================================================
// P2 – the monk (0 .. 7)
// ===================================================================
function sceneMonkP(g, u) {
  camP(g, { z: 1.03 + 0.05 * (u / 7), x: PW / 2 + 8 * (u / 7), y: PH / 2 + 40, rot: Math.sin(u * 1.1) * 0.004 });
  putSkyP(g, skyCalmP());
  circle(g, 590, 250, 56, '#fff4c8', 0); glow(g, 590, 250, 260, 'rgba(255,230,160,0.7)');
  cloud(g, 150 + u * 6, 230, 1.0, '#ffffff', '#ffd2dc', 4); cloud(g, 560 - u * 4, 380, 0.8, '#fff', '#ffd2dc', 5);
  drawSea(g, 520, 900, u * 0.6, { far: '#9fc6ee', near: '#4f7fc4', crest: 'rgba(255,255,255,0.7)', rows: 9, speed: 0.6 });
  const sk = seg(u, 2.6, 7);
  if (sk > 0) drawShip(g, lerp(700, 612, E.inOut(sk)), 548 + Math.sin(u * 1.2) * 1.5, lerp(0.1, 0.2, sk), u, { crew: null, oars: true, windy: 0.4 });
  // hill
  g.save();
  g.beginPath(); g.moveTo(-200, 790); g.quadraticCurveTo(250, 740, 520, 790); g.quadraticCurveTo(700, 830, 950, 800); g.lineTo(950, 1500); g.lineTo(-200, 1500); g.closePath();
  g.fillStyle = '#7ca860'; g.fill(); g.lineWidth = 6; g.strokeStyle = C.ink; g.stroke();
  g.clip(); brushStrokes(g, -200, 740, PW + 400, 760, ['#5d8c48', '#a4cd7c', '#4f7a3e'], 160, 70, 0.5, 31, -0.6);
  g.fillStyle = dots(g, 2.2, '#3e6a35', 9); g.fillRect(-200, 900, PW + 400, 600);
  g.restore();
  // stone wall seat
  rrect(g, 20, 940, 680, 180, 14, '#b8a3b8', 6);
  g.save(); g.beginPath(); g.rect(20, 940, 680, 180); g.clip();
  g.strokeStyle = 'rgba(60,30,70,0.45)'; g.lineWidth = 3;
  for (let j = 0; j < 5; j++) { g.beginPath(); g.moveTo(20, 976 + j * 34); g.lineTo(700, 976 + j * 34); g.stroke(); for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(40 + i * 76 + (j % 2) * 38, 976 + j * 34 - 34); g.lineTo(40 + i * 76 + (j % 2) * 38, 976 + j * 34); g.stroke(); } }
  g.fillStyle = dots(g, 2, '#6e5a8e', 9); g.fillRect(420, 940, 280, 180);
  g.restore();
  const look = u > 3.0, jolt = look ? E.out(seg(u, 3.0, 3.25)) : 0;
  const bookY = u < 3.05 ? -104 : -104 + 0.5 * 2600 * Math.pow(u - 3.05, 2), bookR = u < 3.05 ? 0 : (u - 3.05) * 4.5;
  const monk = {
    kind: 'monk', x: 360, y: 1050 + (1 - E.out(seg(u, 0, 0.5))) * 80, s: 1.5, ph: 0.4, squash: 1 + 0.12 * Math.sin(jolt * Math.PI) * (u < 3.6 ? 1 : 0),
    face: look
      ? (u < 5.2 ? { eyes: 'wide', mouth: 'wobble', brow: 'worry', sweat: true, look: [10, -4] } : { eyes: 'wide', mouth: 'scream', open: 0.7 + 0.3 * Math.sin(u * 25), brow: 'worry', sweat: true, look: [10, -4] })
      : { eyes: 'closed', mouth: 'smile', open: 0.3, blush: true },
    tilt: look ? -0.05 - 0.03 * Math.sin(u * 30) * (u > 4 ? 1 : 0) : 0.04 + Math.sin(u * 1.6) * 0.02,
    hdy: look ? -10 * jolt : 0,
    armL: look ? [-130, -230 - 20 * Math.sin(u * 18) * (u > 4 ? 1 : 0)] : [-62, -108],
    armR: look ? [130, -230 + 20 * Math.sin(u * 18 + 1) * (u > 4 ? 1 : 0)] : [62, -108],
    extra: (gg, t) => {
      gg.save();
      if (u < 3.05) gg.translate(0, -104); else { gg.translate(0, bookY); gg.rotate(bookR); gg.globalAlpha = 1 - seg(u, 3.6, 3.9); }
      drawItem(gg, { kind: 'book', open: 1 }, 0, 0, t, 0); gg.restore();
    },
  };
  placeChar(g, monk, u);
  if (u > 3.0) { const k = popK(u, 3.05, 0.3); g.save(); g.translate(600, 380); g.scale(k, k); g.rotate(0.1); comicText(g, '!', 0, 0, 200, C.red, { shadow: 12 }); g.restore(); }
  camEnd(g);
}

// ===================================================================
// P3 – landing on the beach (0 .. 7)
// ===================================================================
function sceneBeachP(g, u) {
  const [sx_, sy_] = u > 2.35 && u < 3.0 ? shk(u, 6 * (1 - seg(u, 2.35, 3.0))) : [0, 0];
  camP(g, { z: 1.0 + 0.04 * (u / 7), x: PW / 2, y: PH / 2 + 20, sx: sx_, sy: sy_ });
  putSkyP(g, skyDawnP(), 0, -110);
  glow(g, 170, 520, 380, 'rgba(255,190,100,0.6)');
  circle(g, 170, 520, 62, '#fff0b0', 0);
  cloud(g, 520 + u * 5, 300, 1.1, '#5d2c7d', '#ffb870', 6);
  drawSea(g, 540, 800, u, { far: '#d46a6c', near: '#33205f', crest: 'rgba(255,205,150,0.6)', rows: 8 });
  drawMonastery(g, 470, 800, 0.5, u, { burn: 0 });
  groundStrip(g, 800, '#e9b57c', '#a86a58', 41, u * 8, 'rgba(255,230,170,0.5)', 1500, 1000, 130);
  g.save(); g.beginPath(); g.moveTo(-300, 800);
  for (let x = -300; x <= PW + 300; x += 20) g.lineTo(x, 800 + Math.sin(x / 70 + u * 1.5) * 7 + 8); g.lineTo(PW + 300, 780); g.lineTo(-300, 780); g.closePath();
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.fill(); g.restore();
  const list = [];
  // ship
  const arrive = E.out(seg(u, 0, 2.4));
  const bump = u > 2.4 ? Math.sin((u - 2.4) * 9) * 0.04 * Math.exp(-(u - 2.4) * 2.4) : 0;
  const shipX = lerp(-330, 250, arrive) + (u > 2.4 ? -Math.exp(-(u - 2.4) * 6) * 10 : 0);
  const crewOn = (g2, t) => {
    if (!(u > 3.2)) placeChar(g2, { kind: 'maiden', x: 80, y: -28, s: 0.5, ph: 1.4, face: { eyes: 'angry', mouth: 'scream', open: 0.6 }, itemR: { kind: 'axe', ang: 0.15 }, armR: [92, -210] }, t);
    if (!(u > 2.8)) placeChar(g2, { kind: 'viking', x: 180, y: -28, s: 0.52, ph: 0.3, face: { eyes: 'angry', mouth: 'scream', open: 0.7 }, itemR: { kind: 'axe', ang: 0.2 }, armR: [96, -230], armL: [-80, -80] }, t);
    placeChar(g2, { kind: 'viking2', x: -90, y: -28, s: 0.48, ph: 2.1, face: { eyes: 'wide', mouth: 'o', open: 0.8 } }, t);
  };
  list.push({ y: 800, fn: () => { drawShip(g, shipX, 800 + Math.sin(u * 1.4) * (u < 2.4 ? 5 : 1), 0.95, u, { crew: crewOn, tilt: bump, oars: u < 2.4, windy: 0.5, ph: 0 }); if (u < 2.6) foam(g, shipX, 828, 420, u * 1.4, { vy: 10 }); } });
  // jumpers that then run to the monastery
  const hero = (t0, from, land, door, kind, extra) => {
    if (u < t0) return;
    const k = seg(u, t0, t0 + 0.6), run = seg(u, 4.6, 7.0);
    let x, y, s;
    if (run <= 0) {
      x = lerp(from[0], land[0], E.out(k)); y = lerp(from[1], land[1], E.out(k)) - Math.sin(k * Math.PI) * 130; s = lerp(0.5, 0.85, E.out(k));
    } else { x = lerp(land[0], door[0], run); y = lerp(land[1], door[1], run); s = lerp(0.85, 0.44, run); }
    const landed = u > t0 + 0.6, sqz = run > 0 ? 1 : (landed ? 1 - 0.18 * Math.exp(-(u - t0 - 0.6) * 9) * Math.cos((u - t0 - 0.6) * 22) : 1 + 0.08 * Math.sin(k * Math.PI));
    const p = Object.assign({ kind, x, y, s, squash: sqz }, extra);
    if (run > 0) { p.walk = u * 13 + (extra.ph || 0); p.bob = -Math.abs(Math.sin(u * 13 + (extra.ph || 0))) * 12; }
    list.push({ y, fn: () => placeChar(g, p, u) });
  };
  hero(2.8, [420, 790], [570, 975], [452, 806], 'viking', { ph: 0.3, face: { eyes: 'angry', mouth: 'scream', open: 0.5 + 0.4 * Math.sin(u * 12) }, armR: [96, -230], itemR: { kind: 'axe', ang: 0.2 }, armL: [-90, -90], itemL: { kind: 'shield' } });
  hero(3.2, [330, 790], [420, 1010], [410, 812], 'maiden', { ph: 1.4, face: { eyes: 'angry', mouth: 'scream', open: 0.5 + 0.4 * Math.sin(u * 10) }, armR: [96, -220], itemR: { kind: 'axe', ang: 0.15 } });
  // monks run towards the camera
  const monk = (t0, t1, from, to, ph) => {
    if (u < t0 || u > t1 + 0.2) return;
    const k = seg(u, t0, t1), s = lerp(0.33, 0.95, k), x = lerp(from[0], to[0], k), y = lerp(from[1], to[1], 0.5 * E.in(k) + 0.5 * k);
    const p = { kind: 'monk', x, y, s, ph, walk: u * 17 + ph, bob: -Math.abs(Math.sin(u * 17 + ph)) * 14, armL: [-120, -240], armR: [120, -220], face: { eyes: 'wide', mouth: 'scream', open: 0.8, tears: true } };
    list.push({ y, fn: () => placeChar(g, p, u) });
  };
  monk(3.9, 6.2, [392, 806], [-170, 1190], 3);
  monk(4.7, 6.9, [430, 806], [900, 1210], 5);
  sortedDraw(list);
  if (u > 3.6 && u < 5.4) { const k = popK(u, 3.6, 0.3); g.save(); g.translate(360, 440); g.scale(k, k); g.rotate(-0.08); comicText(g, 'AAARGH!', 0, 0, 108, C.yellow, { shadow: 7 }); g.restore(); }
  camEnd(g);
}

// ===================================================================
// P4 – the raid (0 .. 10)
// ===================================================================
function sceneRaidP(g, u) {
  const sh = shk(u, 3.5);
  camP(g, { z: 1.04, sx: sh[0], sy: sh[1], rot: Math.sin(u * 3) * 0.004, y: PH / 2 + 20 });
  putSkyP(g, skyBurnP());
  glow(g, 360, 560, 800, 'rgba(255,120,50,0.5)');
  smoke(g, 250, 560, u, { n: 16, seed: 3, w: 260, rise: 560, alpha: 0.7, drift: 120 });
  const mx = 700 - u * 50;
  drawMonastery(g, mx, 800, 1.15, u, { burn: 1 });
  drawMonastery(g, mx + 1200, 800, 0.8, u + 3, { burn: 1 });
  smoke(g, mx - 100, 430, u, { n: 14, seed: 8, w: 300, rise: 560, alpha: 0.6, drift: 140 });
  [[-100, 0.46, 0, 1], [240, 0.4, 1, -1], [520, 0.48, 2, 1], [800, 0.42, 3, -1], [1100, 0.44, 4, 1]].forEach(([x0, s, i, d]) => {
    const x = ((x0 + d * u * 160 + 300) % (PW + 600)) - 300, y = 812 + (i % 2) * 14;
    placeSilChar(g, { kind: 'monk', x, y, s, flip: d, ph: i, walk: u * 15 + i, bob: -Math.abs(Math.sin(u * 15 + i)) * 10, armL: [-120, -240], armR: [120, -230], face: { eyes: 'wide', mouth: 'scream', open: 0.8 } }, u, '#3a2058');
  });
  groundStrip(g, 800, '#5d2a58', '#1f0e38', 51, u * 520, 'rgba(255,150,70,0.4)', 1500, 1000, 150);
  g.save(); g.globalAlpha = 0.6; gradFill(g, -300, 800, PW + 600, 200, [[0, 'rgba(255,120,50,0.5)'], [1, 'rgba(255,120,50,0)']]); g.restore();
  const bounce = (ph, a) => -Math.abs(Math.sin(u * 13 + ph)) * a;
  placeChar(g, { kind: 'monk', x: 115 + 14 * Math.sin(u * 1.3), y: 945, s: 0.8, ph: 2, walk: u * 13 + 2, bob: bounce(2, 12), lean: -8, armL: [-120, -220], armR: [120, -180], face: { eyes: 'cry', mouth: 'scream', open: 0.6 + 0.3 * Math.sin(u * 14), tears: true, brow: 'worry' } }, u);
  placeChar(g, { kind: 'viking', x: 372, y: 960, s: 0.92, ph: 0.2, walk: u * 13, bob: bounce(0, 14), lean: 10, face: { eyes: 'angry', mouth: 'scream', open: 0.6 + 0.35 * Math.sin(u * 11) }, armR: [110, -270], itemR: { kind: 'axe', ang: 0.35 }, armL: [-100, -130], itemL: { kind: 'torch', ph: 1 } }, u);
  placeChar(g, { kind: 'maiden', x: 625, y: 952, s: 0.86, ph: 1.1, walk: u * 13 + 1.5, bob: bounce(1.5, 13), lean: 8, face: { eyes: 'happy', mouth: 'grin', open: 0.5, blush: true }, armR: [100, -230], itemR: { kind: 'chalice', ang: 0.15 }, armL: [-92, -150], itemL: { kind: 'sack', ang: 0.1 } }, u);
  balloon(g, 'FOR ODIN!', 360, 515, seg(u, 0.8, 1.0) * (1 - seg(u, 3.2, 3.5)), 0, 60, 42, popK(u, 0.8));
  balloon(g, 'MY CHALICE!!', 215, 600, seg(u, 3.6, 3.8) * (1 - seg(u, 6.4, 6.7)), -90, 56, 36, popK(u, 3.6));
  balloon(g, 'Haha! Oh well.', 490, 610, seg(u, 5.2, 5.4) * (1 - seg(u, 8.2, 8.5)), 100, 60, 34, popK(u, 5.2));
  embers(g, 360, 1250, 900, u, { n: 60, seed: 12, rise: 900, drift: -200 });
  g.save(); g.globalAlpha = 0.25; g.strokeStyle = '#fff'; g.lineWidth = 3;
  const r = mulberry32(Math.floor(u * 12) + 5);
  for (let i = 0; i < 12; i++) { const y = 300 + r() * 800, x = r() * PW, l = 120 + r() * 220; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y); g.stroke(); }
  g.restore();
  camEnd(g);
}

// ===================================================================
// P5 – "why monasteries?" (0 .. 9)
// ===================================================================
function sceneWhyP(g, u) {
  const push = u / 9;
  camP(g, { z: 1.0 + 0.04 * push, x: PW / 2 + 6 * push, y: PH / 2 + 20, rot: Math.sin(u * 0.8) * 0.004 });
  putSkyP(g, skyBurnP());
  glow(g, 470, 500, 800, 'rgba(255,120,50,0.55)');
  smoke(g, 430, 640, u, { n: 14, seed: 4, w: 240, rise: 620, alpha: 0.7, drift: 90 });
  drawMonastery(g, 470, 830, 1.25, u, { burn: 1 });
  smoke(g, 650, 330, u + 2, { n: 10, seed: 9, w: 200, rise: 420, alpha: 0.6, drift: 60 });
  g.save(); g.fillStyle = '#2d1245'; g.strokeStyle = C.ink; g.lineWidth = 5;
  g.beginPath(); g.moveTo(-100, 1300); g.lineTo(-100, 850); for (let i = 0; i < 17; i++) g.lineTo(-100 + i * 50, 840 - ((i * 37) % 5) * 12 - (i % 3) * 8); g.lineTo(900, 1300); g.closePath(); g.fill(); g.stroke(); g.restore();
  placeSilChar(g, { kind: 'monk', x: 560, y: 860, s: 0.55, ph: 3, armL: [-120, -240], armR: [120, -240], face: { eyes: 'wide', mouth: 'scream', open: 0.8 } }, u, '#3a2058');
  placeSilChar(g, { kind: 'viking', x: 360, y: 850, s: 0.5, ph: 5, itemR: { kind: 'torch', ph: 2 }, armR: [100, -200], face: { eyes: 'angry', mouth: 'scream' } }, u, '#3a2058');
  placeChar(g, { kind: 'maiden', x: 610, y: 1250, s: 1.1, ph: 2.2, dim: 0.4, face: { eyes: 'smug', mouth: 'smirk' }, itemR: { kind: 'lolly', spin: 0.8, ang: -0.1 }, armR: [60, -230] }, u);
  placeChar(g, {
    kind: 'viking', x: 255, y: 1210, s: 1.7, ph: 0.3, tilt: -0.05 + Math.sin(u * 1.6) * 0.012, hdx: 8, lean: -4,
    face: { eyes: 'squint', mouth: 'flat' },
    armR: [46, -176 - 6 * Math.sin(u * 2.2)], bendR: -1, armL: [-96, -80],
    extraBack: (gg, t) => {
      gg.save(); gg.translate(176, -140 + Math.sin(u * 2.4) * 2); gg.scale(0.5, 0.5);
      drawChar(gg, { kind: 'monk', ph: 1, face: { eyes: 'cry', mouth: 'wobble', tears: true, brow: 'worry' }, armL: [-110, -250], armR: [110, -110], itemR: { kind: 'lantern' }, tilt: 0.1, bob: 0 }, t);
      gg.restore();
    },
  }, u);
  [[180, 470, 0.6, 0.2], [330, 400, 1.1, -0.15], [470, 480, 1.6, 0.1]].forEach(([qx, qy, t0, rot]) => {
    const k = popK(u, t0 + 0.3, 0.3); if (k <= 0) return;
    g.save(); g.translate(qx, qy + Math.sin(u * 2 + t0) * 5); g.scale(k, k); g.rotate(rot); comicText(g, '?', 0, 0, 120, C.yellow, { shadow: 8 }); g.restore();
  });
  if (u > 4.3) {
    const r = mulberry32(77);
    for (let i = 0; i < 26; i++) {
      const t0 = 4.4 + i * 0.12, y0 = -50 + (u - t0) * (460 + r() * 160), x = 60 + r() * 600;
      if (u < t0 || y0 > 1300) continue;
      g.save(); g.translate(x, y0); g.scale(Math.cos(u * 6 + i), 1);
      circle(g, 0, 0, 22, i % 3 ? C.gold : '#d9dfe9', 4.5); circle(g, 0, 0, 12, null, 3); g.restore();
    }
    const k = popK(u, 4.5, 0.35), k2 = popK(u, 5.6, 0.35);
    g.save(); g.translate(PW / 2, 170); g.scale(k, k); g.rotate(-0.05); comicText(g, 'GOLD + SILVER', 0, 0, 82, C.gold, { shadow: 7 }); g.restore();
    g.save(); g.translate(PW / 2, 262); g.scale(k2, k2); g.rotate(0.04); comicText(g, '0  SOLDIERS', 0, 0, 66, '#fff', { shadow: 6 }); g.restore();
  }
  embers(g, 360, 1250, 900, u, { n: 46, seed: 31, rise: 900, drift: 120 });
  camEnd(g);
}

// ===================================================================
// P6 – myth / fact / opera (0 .. 11)
// ===================================================================
function sceneMythP(g, u) {
  camP(g, { z: 1 + 0.02 * (u / 11) });
  baked('pPaper', 960, 1560, (gg) => {
    gradFill(gg, 0, 0, 960, 1560, [[0, '#f5e6c5'], [1, '#e8cf9e']]);
    brushStrokes(gg, 0, 0, 960, 1560, ['#fff4d8', '#d9bd86', '#f0d9a8'], 200, 140, 0.25, 61, 0.03);
    const ht = halftoneLayer(960, 1560, 'rgba(120,70,40,0.45)', (x, y) => Math.pow(Math.abs(x - 0.5) * 2, 3) * 0.9 + Math.pow(y, 4) * 0.7, 12, 5);
    gg.drawImage(ht.c, 0, 0, ht.w, ht.h);
  });
  const part2 = u > 6.4;
  if (!part2) {
    putSkyP(g, SC.pPaper);
    const popOff = seg(u, 3.55, 3.9), enter = E.bounce(seg(u, 0.1, 0.9));
    placeChar(g, {
      kind: 'viking', x: 360, y: 1200 + 330 * (1 - enter), s: 1.2, ph: 0.2,
      helmetHorn: u < 3.55 ? 1 : Math.max(0, 1 - popOff * 4), squash: 1 + 0.1 * Math.exp(-(u - 3.6) * 8) * Math.sin((u - 3.6) * 30) * (u > 3.55 ? 1 : 0),
      face: u < 3.55 ? { eyes: 'happy', mouth: 'grin', blush: true } : (u < 4.3 ? { eyes: 'wide', mouth: 'o', open: 0.7, sweat: true } : { eyes: 'smug', mouth: 'smirk' }),
      armR: u < 3.55 ? [120, -250] : [120, -300], armL: u < 3.55 ? [-120, -250] : [-100, -90],
    }, u);
    if (u > 3.55 && u < 4.9) {
      const k = u - 3.55;
      for (const sd of [-1, 1]) {
        g.save(); g.translate(360 + sd * 120 + sd * 230 * k, 760 - 520 * k + 1100 * k * k); g.rotate(sd * k * 9);
        g.beginPath(); g.moveTo(-8, 30); g.bezierCurveTo(-30, 0, -12, -40, 14, -52); g.bezierCurveTo(10, -20, 14, 6, 10, 30); g.closePath(); fillStroke(g, '#f4ead0', 5);
        g.restore();
      }
    }
    stamp(g, 'MYTH', 360, 180, 150, 0.5, u, C.red, -0.06);
    g.save(); g.globalAlpha = seg(u, 1.0, 1.4); comicText(g, 'Vikings wore', 360, 300, 62, '#fff', { shadow: 5 }); comicText(g, 'horned helmets', 360, 372, 62, '#fff', { shadow: 5 }); g.restore();
    if (u > 3.0) {
      const k = E.out(seg(u, 3.0, 3.25)), k2 = E.out(seg(u, 3.15, 3.4));
      g.save(); g.lineCap = 'round';
      for (const [col, lw] of [[C.ink, 34], [C.red, 20]]) {
        g.strokeStyle = col; g.lineWidth = lw; g.beginPath();
        g.moveTo(90, 260); g.lineTo(90 + 540 * k, 260 + 150 * k); g.moveTo(630, 260); g.lineTo(630 - 540 * k2, 260 + 150 * k2); g.stroke();
      }
      g.restore();
    }
    stamp(g, 'FACT', 360, 520, 140, 4.2, u, '#43c25a', 0.05);
    g.save(); g.globalAlpha = seg(u, 4.7, 5.1);
    comicText(g, 'No horned Viking helmet', 360, 620, 50, '#fff', { shadow: 4 }); comicText(g, 'has ever been found', 360, 682, 50, '#fff', { shadow: 4 }); g.restore();
  } else {
    const v = u - 6.4;
    gradFill(g, -300, -300, PW + 600, 1900, [[0, '#2a0c33'], [1, '#52183d']]);
    g.save(); g.globalCompositeOperation = 'screen';
    const gr = g.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, 'rgba(255,240,200,0.5)'); gr.addColorStop(1, 'rgba(255,240,200,0.12)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(290, -10); g.lineTo(430, -10); g.lineTo(760, PH); g.lineTo(-40, PH); g.closePath(); g.fill(); g.restore();
    gradFill(g, -300, 1050, PW + 600, 600, [[0, '#5a3a2a'], [1, '#2a1812']]);
    g.beginPath(); g.moveTo(-300, 1050); g.lineTo(PW + 300, 1050); g.lineWidth = 6; g.strokeStyle = C.ink; g.stroke();
    const curtain = (side) => {
      g.save(); g.translate(side < 0 ? 0 : PW, 0); g.scale(-side, 1);
      g.beginPath(); g.moveTo(-10, -10); g.lineTo(190, -10); g.quadraticCurveTo(130, 560, 80, PH + 10); g.lineTo(-10, PH + 10); g.closePath(); g.fillStyle = '#9d1e3a'; g.fill(); g.lineWidth = 6; g.strokeStyle = C.ink; g.stroke();
      g.clip(); for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(i * 40, -10); g.quadraticCurveTo(i * 40 - 20 + Math.sin(v * 1.4 + i) * 4, 560, i * 40 - 36, PH + 10); g.lineWidth = 6; g.strokeStyle = 'rgba(20,0,20,0.4)'; g.stroke(); }
      g.restore();
    };
    curtain(-1); curtain(1);
    const enter = E.out(seg(v, 0, 0.6));
    placeChar(g, {
      kind: 'viking2', x: 360, y: 1210 + 330 * (1 - enter), s: 1.25, ph: 0.8, helmetHorn: 1, squash: 1 + 0.03 * Math.sin(v * 8),
      face: { eyes: 'closed', mouth: 'scream', open: 0.5 + 0.5 * Math.abs(Math.sin(v * 7)), blush: true },
      armL: [-120, -250], armR: [120, -250], tilt: Math.sin(v * 3) * 0.03,
    }, u);
    for (let i = 0; i < 6; i++) {
      const ph = (v * 0.5 + i / 6) % 1, x = 360 + (i % 2 ? 250 : -250) + Math.sin(ph * 6 + i) * 30, y = 1000 - ph * 600;
      g.save(); g.globalAlpha = Math.sin(ph * Math.PI); g.translate(x, y); g.rotate(Math.sin(v * 3 + i) * 0.3);
      g.fillStyle = C.yellow; g.strokeStyle = C.ink; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 0, 14, 10, -0.4, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(11, -3); g.lineTo(11, -48); g.lineWidth = 7; g.stroke(); g.strokeStyle = C.yellow; g.lineWidth = 3.5; g.stroke(); g.restore();
    }
    const k = popK(v, 0.4, 0.4); g.save(); g.translate(PW / 2, 190); g.scale(k, k); g.rotate(-0.03);
    comicText(g, 'OPERA · 1876', 0, 0, 92, C.yellow, { shadow: 7 }); g.restore();
    g.save(); g.globalAlpha = seg(v, 1.2, 1.6);
    comicText(g, "Wagner's costumes", PW / 2, 288, 44, '#fff', { shadow: 3, weight: 800 }); comicText(g, 'made the horns famous', PW / 2, 340, 44, '#fff', { shadow: 3, weight: 800 }); g.restore();
  }
  camEnd(g);
}

// ===================================================================
// P7 – fleet + end card (0 .. 7.8)
// ===================================================================
function sceneFleetP(g, u) {
  const vE = u - (END_P - 52);
  if (vE < 0) {
    camP(g, { z: 1.0 + 0.04 * (u / 5.6), x: PW / 2 + 6 * (u / 5.6), y: PH / 2 + 20 });
    putSkyP(g, skySetP());
    glow(g, 400, 600, 560, 'rgba(255,200,100,0.8)');
    circle(g, 400, 600, 125, '#fff2b8', 0);
    g.save(); g.beginPath(); g.arc(400, 600, 125, 0, 7); g.clip(); g.fillStyle = dots(g, 3.6, '#ffb040', 11); g.fillRect(260, 560, 300, 160); g.restore();
    cloud(g, 130 + u * 7, 340, 1.3, '#43205f', '#ff9a6a', 7); cloud(g, 600 - u * 6, 230, 1.0, '#58287a', '#ffb070', 8);
    drawSea(g, 612, 1500, u, { far: '#d4586a', near: '#1d0f48', crest: 'rgba(255,210,150,0.6)' });
    sunGlitter(g, 400, 620, 800, u);
    const fleet = [
      { x: 190, y: 950, s: 0.6, lab: 'ENGLAND', t0: 1.8, ph: 0 },
      { x: 470, y: 850, s: 0.46, lab: 'FRANCE', t0: 2.5, ph: 1 },
      { x: 240, y: 760, s: 0.34, lab: 'RUSSIA', t0: 3.2, ph: 2 },
      { x: 440, y: 690, s: 0.26, lab: 'AMERICA', t0: 4.6, ph: 3 },
    ];
    for (let i = fleet.length - 1; i >= 0; i--) {
      const f = fleet[i];
      const x = f.x + Math.sin(u * 0.6 + i) * 8 + u * (4 - i), y = f.y + Math.sin(u * 1.4 + i) * 4;
      drawShip(g, x, y, f.s, u + i, { crew: null, windy: 1, ph: f.ph });
      foam(g, x, y + 24 * f.s, 520 * f.s, u + i, { vy: 8 * f.s });
    }
    camEnd(g);
    // destination labels (screen space, big and phone-readable)
    fleet.forEach((f, i) => {
      const k = popK(u, f.t0, 0.4); if (k <= 0) return;
      g.save(); g.translate(PW / 2, 150 + i * 96); g.scale(k, k); g.rotate((i % 2 ? 1 : -1) * 0.025);
      g.font = '900 50px Inter'; const tw = g.measureText(f.lab).width, w = tw + 120;
      rrect(g, -w / 2, -38, w, 76, 38, C.cream, 6);
      circle(g, -w / 2 + 40, -4, 13, C.red, 4); poly(g, [[-w / 2 + 31, 2], [-w / 2 + 49, 2], [-w / 2 + 40, 24]], C.red, 3);
      g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = C.ink; g.fillText(f.lab, -w / 2 + 70, 2);
      g.restore();
    });
  } else {
    baked('pEnd', PW, PH, (gg) => {
      gradFill(gg, 0, 0, PW, PH, [[0, '#24114a'], [0.6, '#6e2b78'], [1, '#e2535c']]);
      brushStrokes(gg, 0, 0, PW, PH, ['#3a1a66', '#8a3a86', '#ff7a5a'], 220, 130, 0.22, 91, 0.04);
      const ht = halftoneLayer(PW, PH, 'rgba(25,5,50,0.55)', (x, y) => Math.pow(1 - y, 1.4), 11, 5);
      gg.drawImage(ht.c, 0, 0, ht.w, ht.h);
    });
    g.drawImage(SC.pEnd.c, 0, 0, PW, PH);
    const v = vE;
    const k0 = popK(v, 0.0, 0.4);
    g.save(); g.translate(PW / 2, 200); g.scale(k0, k0); comicText(g, 'NEXT TIME', 0, 0, 72, '#fff', { shadow: 5 }); g.restore();
    const k1 = popK(v, 0.2, 0.45);
    g.save(); g.translate(PW / 2, 330); g.scale(k1, k1); g.rotate(-0.03); comicText(g, 'RAGNAR', 0, 0, 138, C.yellow, { shadow: 9 }); g.restore();
    g.save(); g.translate(PW / 2, 450); g.scale(k1, k1); g.rotate(-0.03); comicText(g, 'LOTHBROK', 0, 0, 104, C.yellow, { shadow: 9 }); g.restore();
    const k2 = popK(v, 0.65, 0.4);
    g.save(); g.translate(PW / 2, 550); g.scale(k2, k2); comicText(g, 'legend or reality?', 0, 0, 52, '#fff', { shadow: 4, weight: 800 }); g.restore();
    const k3 = popK(v, 1.0, 0.4), pulse = 1 + Math.sin(v * 5) * 0.025;
    g.save(); g.translate(PW / 2, 670); g.scale(k3 * pulse, k3 * pulse);
    rrect(g, -235, -48, 470, 96, 48, C.red, 6);
    g.save(); g.beginPath(); g.rect(-235, -48, 470, 48); g.clip(); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(-235, -48, 470, 48); g.restore();
    g.font = '900 44px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('SUBSCRIBE', 28, 3);
    g.save(); g.translate(-155, 0); g.rotate(Math.sin(v * 9) * 0.22 * (v % 1.6 < 0.9 ? 1 : 0));
    g.beginPath(); g.moveTo(-16, 16); g.quadraticCurveTo(-14, -6, -6, -18); g.quadraticCurveTo(0, -26, 6, -18); g.quadraticCurveTo(14, -6, 16, 16); g.closePath(); fillStroke(g, C.yellow, 4);
    circle(g, 0, 22, 6, C.yellow, 3.5); g.restore();
    g.restore();
    placeChar(g, { kind: 'viking', x: 175, y: 1235 + 130 * (1 - E.out(seg(v, 0.1, 0.6))), s: 1.05, ph: 0.2, face: { eyes: 'happy', mouth: 'grin', blush: true }, armR: [118, -250 + Math.sin(v * 8) * 24], armL: [-100, -80], itemL: { kind: 'shield' } }, u);
    placeChar(g, { kind: 'maiden', x: 550, y: 1235 + 130 * (1 - E.out(seg(v, 0.25, 0.75))), s: 1.05, ph: 1.4, face: { eyes: 'happy', mouth: 'smile', open: 0.8, blush: true }, armL: [-118, -250 + Math.sin(v * 8 + 1) * 24], armR: [100, -90] }, u);
  }
}

// ===================================================================
// timeline
// ===================================================================
const TLP = [
  { a: 0, b: 8, fn: sceneSeaP }, { a: 8, b: 15, fn: sceneMonkP }, { a: 15, b: 22, fn: sceneBeachP },
  { a: 22, b: 32, fn: sceneRaidP }, { a: 32, b: 41, fn: sceneWhyP }, { a: 41, b: 52, fn: sceneMythP },
  { a: 52, b: TOTAL_P, fn: sceneFleetP },
];
const SUBS_P = SUBS.map(([a, b, t]) => t.startsWith('The Vikings sailed') ? [a, 57.3, t] : [a, b, t]);

function postP(g, t) {
  const gr = g.createRadialGradient(PW / 2, PH / 2, PH * 0.35, PW / 2, PH / 2, PH * 0.75);
  gr.addColorStop(0, 'rgba(12,0,24,0)'); gr.addColorStop(1, 'rgba(12,0,24,0.5)');
  g.fillStyle = gr; g.fillRect(0, 0, PW, PH);
  const gt = grainTile(), fr = Math.floor(t * 24);
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.16;
  const ox = -((fr * 97) % 256), oy = -((fr * 57) % 256);
  for (let y = oy; y < PH; y += 256) for (let x = ox; x < PW; x += 256) g.drawImage(gt, x, y, 256, 256);
  g.restore();
}

function drawFrameShort(g, t) {
  g.fillStyle = '#000'; g.fillRect(0, 0, PW, PH);
  let sc = TLP[TLP.length - 1];
  for (const s of TLP) if (t >= s.a && t < s.b) { sc = s; break; }
  const u = t - sc.a;
  g.save(); g.beginPath(); g.rect(0, 0, PW, PH); g.clip();
  sc.fn(g, u);
  g.restore();
  for (const s of TLP) {
    if (s.a === 0) continue;
    const d = t - s.a;
    if (d >= 0 && d < 0.16) { g.fillStyle = `rgba(255,245,220,${0.85 * (1 - d / 0.16)})`; g.fillRect(0, 0, PW, PH); }
  }
  for (const [a, b, str] of SUBS_P) {
    if (t >= a && t <= b) subtitleP(g, str, Math.min(seg(t, a, a + 0.25), 1 - seg(t, b - 0.25, b)));
  }
  postP(g, t);
  const f = Math.max(1 - seg(t, 0, 0.6), seg(t, TOTAL_P - 0.6, TOTAL_P));
  if (f > 0) { g.fillStyle = `rgba(0,0,0,${f})`; g.fillRect(0, 0, PW, PH); }
}
