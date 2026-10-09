// ---------- blob characters (Viking / shieldmaiden / monk) ----------
const CH = { w: 800, h: 860, ox: 400, oy: 780 };
const _cl = [layer(CH.w, CH.h), layer(CH.w, CH.h), layer(CH.w, CH.h), layer(CH.w, CH.h)];
let _clI = 0;
const _sil = layer(CH.w, CH.h);

// --- shading with halftone terminator ---
function shadeIn(g, pathFn, shadeCol, dx = -15, dy = -13, dotCol = null) {
  g.save();
  g.beginPath(); pathFn(g); g.clip();
  g.beginPath(); g.rect(-2000, -2000, 4000, 4000);
  g.save(); g.translate(dx, dy); pathFn(g); g.restore();
  g.fillStyle = shadeCol; g.fill('evenodd');
  if (dotCol) {
    g.save();
    g.beginPath(); g.save(); g.translate(dx, dy); pathFn(g); g.restore(); g.clip();
    g.beginPath(); g.rect(-2000, -2000, 4000, 4000);
    g.save(); g.translate(dx * 2.3, dy * 2.3); pathFn(g); g.restore();
    g.fillStyle = dots(g, 1.9, dotCol, 8); g.fill('evenodd');
    g.restore();
  }
  g.restore();
}

function headPathFn(cx, cy, rx = 96, ry = 84) {
  return g => {
    g.moveTo(cx - rx * 0.95, cy + ry * 0.12);
    g.bezierCurveTo(cx - rx * 1.08, cy - ry * 0.78, cx - rx * 0.55, cy - ry * 1.12, cx, cy - ry * 1.06);
    g.bezierCurveTo(cx + rx * 0.55, cy - ry * 1.12, cx + rx * 1.08, cy - ry * 0.78, cx + rx * 0.95, cy + ry * 0.12);
    g.bezierCurveTo(cx + rx * 1.06, cy + ry * 0.95, cx + rx * 0.55, cy + ry * 1.1, cx, cy + ry * 1.08);
    g.bezierCurveTo(cx - rx * 0.55, cy + ry * 1.1, cx - rx * 1.06, cy + ry * 0.95, cx - rx * 0.95, cy + ry * 0.12);
    g.closePath();
  };
}

function bodyPathFn(w0 = 70, w1 = 98, top = -168, wob = 0) {
  return g => {
    g.moveTo(-w0, top + 6);
    g.bezierCurveTo(-w0 - 18 + wob, top + 50, -w1 + 8, -50, -w1, 0);
    g.quadraticCurveTo(0, 14, w1, 0);
    g.bezierCurveTo(w1 - 8, -50, w0 + 18 + wob, top + 50, w0, top + 6);
    g.quadraticCurveTo(0, top - 14, -w0, top + 6);
    g.closePath();
  };
}

function hand(g, x, y, r = 17, ang = 0) {
  g.save(); g.translate(x, y); g.rotate(ang);
  circle(g, 0, 0, r, C.white, 4.5);
  ellipse(g, r * 0.55, -r * 0.55, r * 0.42, r * 0.34, C.white, 4, 0.6);
  g.restore();
}

// ---------- faces ----------
function drawFace(g, cx, cy, f, t, tint) {
  const look = f.look || [0, 0];
  const ph = f.ph || 0;
  const blink = ((t * 0.42 + ph) % 1) < 0.045 && f.eyes !== 'squint';
  const ex = 37, ey = cy + 6;
  g.lineCap = 'round'; g.lineJoin = 'round';
  // blush
  if (f.blush) {
    g.save(); g.globalAlpha = 0.55; g.fillStyle = C.pink;
    g.beginPath(); g.ellipse(cx - 62, cy + 34, 17, 10, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(cx + 62, cy + 34, 17, 10, 0, 0, 7); g.fill(); g.restore();
  }
  const eyes = blink ? 'closed' : (f.eyes || 'dot');
  for (const sd of [-1, 1]) {
    const x = cx + sd * ex, y = ey;
    g.strokeStyle = C.ink; g.fillStyle = C.ink;
    if (eyes === 'dot' || eyes === 'angry') {
      g.beginPath(); g.ellipse(x + look[0], y + look[1], 8.5, 12.5, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x + look[0] - 2.5, y + look[1] - 4.5, 3.2, 0, 7); g.fill();
    } else if (eyes === 'wide') {
      g.beginPath(); g.ellipse(x, y, 17, 21, 0, 0, 7); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 4.5; g.stroke();
      g.fillStyle = C.ink; g.beginPath(); g.ellipse(x + look[0], y + look[1], 7, 9, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x + look[0] - 2, y + look[1] - 3, 2.6, 0, 7); g.fill();
    } else if (eyes === 'squint' || eyes === 'cry') {
      g.lineWidth = 7.5;
      g.beginPath(); g.moveTo(x - sd * 14, y - 14); g.lineTo(x + sd * 9, y); g.lineTo(x - sd * 14, y + 14); g.stroke();
    } else if (eyes === 'happy') {
      g.lineWidth = 7.5; g.beginPath(); g.arc(x, y + 8, 14, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    } else if (eyes === 'closed') {
      g.lineWidth = 7.5; g.beginPath(); g.moveTo(x - 13, y + 3); g.quadraticCurveTo(x, y + 10, x + 13, y + 3); g.stroke();
    } else if (eyes === 'smug') {
      g.lineWidth = 7; g.beginPath(); g.moveTo(x - 13, y + 2); g.lineTo(x + 13, y + 2); g.stroke();
      g.fillStyle = C.ink; g.beginPath(); g.ellipse(x + look[0], y + 9 + look[1], 6.5, 5, 0, 0, 7); g.fill();
    } else if (eyes === 'dizzy') {
      g.lineWidth = 6; g.beginPath(); g.moveTo(x - 11, y - 11); g.lineTo(x + 11, y + 11); g.moveTo(x + 11, y - 11); g.lineTo(x - 11, y + 11); g.stroke();
    }
    if (eyes === 'angry') {
      g.lineWidth = 9; g.beginPath(); g.moveTo(x - sd * 22, y - 30); g.lineTo(x + sd * 16, y - 15 - (f.browY || 0)); g.stroke();
    }
    if (f.brow === 'worry' && eyes !== 'angry') {
      g.lineWidth = 6.5; g.beginPath(); g.moveTo(x + sd * 22, y - 32); g.lineTo(x - sd * 14, y - 24 - 6); g.stroke();
    }
    if (f.brow === 'up') {
      g.lineWidth = 6.5; g.beginPath(); g.moveTo(x - 14, y - 34 - (f.browY || 0)); g.quadraticCurveTo(x, y - 42 - (f.browY || 0), x + 14, y - 34 - (f.browY || 0)); g.stroke();
    }
  }
  // tears
  if (f.tears) {
    const k = f.tears === true ? 1 : f.tears;
    for (const sd of [-1, 1]) {
      const x = cx + sd * ex, y = ey + 12;
      const len = 46 + 10 * Math.sin(t * 6 + sd);
      g.lineWidth = 15; g.strokeStyle = C.ink; g.beginPath(); g.moveTo(x, y); g.lineTo(x + sd * 3, y + len * k); g.stroke();
      g.lineWidth = 8; g.strokeStyle = '#a9e1ff'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + sd * 3, y + len * k); g.stroke();
      const dy = ((t * 1.7 + (sd > 0 ? 0.4 : 0)) % 1) * 40;
      g.fillStyle = '#a9e1ff'; g.strokeStyle = C.ink; g.lineWidth = 3.5;
      g.beginPath(); g.ellipse(x + sd * 6, y + len * k + dy * 0.6, 5, 8, 0, 0, 7); g.fill(); g.stroke();
    }
  }
  // mouth
  const m = clamp(f.open == null ? 0.4 : f.open), mx = cx + (f.mx || 0), my = cy + 44;
  const mo = f.mouth || 'open';
  g.strokeStyle = C.ink; g.fillStyle = C.ink; g.lineWidth = 6.5;
  if (mo === 'open' || mo === 'scream') {
    const w = mo === 'scream' ? 36 : 24, h = (mo === 'scream' ? 12 + 42 * m : 6 + 28 * m);
    g.save();
    g.beginPath();
    g.moveTo(mx - w, my - 4); g.quadraticCurveTo(mx, my - 12, mx + w, my - 4);
    g.bezierCurveTo(mx + w * 0.95, my + h * 0.9, mx + w * 0.4, my + h + 4, mx, my + h + 4);
    g.bezierCurveTo(mx - w * 0.4, my + h + 4, mx - w * 0.95, my + h * 0.9, mx - w, my - 4);
    g.closePath(); g.fillStyle = C.ink; g.fill(); g.lineWidth = 5; g.stroke();
    g.clip();
    g.fillStyle = '#ff6f93'; g.beginPath(); g.ellipse(mx, my + h + 6, w * 0.7, h * 0.5, 0, 0, 7); g.fill();
    if (mo === 'scream') { g.fillStyle = '#fff'; g.fillRect(mx - w, my - 8, w * 2, 9); }
    g.restore();
  } else if (mo === 'smile') {
    g.beginPath(); g.moveTo(mx - 22, my); g.quadraticCurveTo(mx, my + 22 * (0.5 + m), mx + 22, my); g.stroke();
  } else if (mo === 'grin') {
    g.beginPath(); g.moveTo(mx - 30, my - 2); g.quadraticCurveTo(mx, my + 34, mx + 30, my - 2); g.closePath();
    g.fillStyle = C.ink; g.fill(); g.lineWidth = 5; g.stroke();
    g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(mx - 32, my - 4, 64, 11); g.restore();
  } else if (mo === 'smirk') {
    g.beginPath(); g.moveTo(mx - 20, my + 6); g.quadraticCurveTo(mx + 6, my + 10, mx + 26, my - 6); g.stroke();
  } else if (mo === 'flat') {
    g.beginPath(); g.moveTo(mx - 15, my + 4); g.lineTo(mx + 15, my + 4); g.stroke();
  } else if (mo === 'o') {
    g.beginPath(); g.ellipse(mx, my + 8, 10 + 6 * m, 11 + 8 * m, 0, 0, 7); g.fill();
  } else if (mo === 'wobble') {
    g.beginPath(); g.moveTo(mx - 24, my + 8);
    for (let i = 0; i <= 6; i++) g.lineTo(mx - 24 + i * 8, my + 8 + (i % 2 ? -7 : 5) + Math.sin(t * 20 + i) * 1.5);
    g.stroke();
  } else if (mo === 'frown') {
    g.beginPath(); g.moveTo(mx - 20, my + 14); g.quadraticCurveTo(mx, my - 4, mx + 20, my + 14); g.stroke();
  }
  // sweat
  if (f.sweat) {
    const sx = cx + 82, sy = cy - 40 + ((t * 1.3) % 1) * 22;
    g.fillStyle = '#a9e1ff'; g.strokeStyle = C.ink; g.lineWidth = 4;
    g.beginPath(); g.moveTo(sx, sy - 18); g.quadraticCurveTo(sx + 16, sy + 4, sx, sy + 12); g.quadraticCurveTo(sx - 16, sy + 4, sx, sy - 18); g.fill(); g.stroke();
  }
}

// ---------- items ----------
function drawSwirl(g, x, y, r, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot);
  circle(g, 0, 0, r, C.cream, 4.5);
  g.save(); g.beginPath(); g.arc(0, 0, r - 1, 0, 7); g.clip();
  g.beginPath();
  for (let a = 0; a < 6.3 * 2.6; a += 0.12) { const rr = (a / (6.3 * 2.6)) * r * 0.95; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  g.strokeStyle = C.red; g.lineWidth = r * 0.2; g.stroke();
  g.strokeStyle = C.pink; g.lineWidth = r * 0.07; g.stroke();
  g.restore();
  g.beginPath(); g.arc(0, 0, r, 0, 7); g.lineWidth = 4.5; g.strokeStyle = C.ink; g.stroke();
  g.restore();
}

function drawHelmetItem(g, x, y, ang, horn = 1, s = 1) {
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s);
  const dome = g2 => { g2.moveTo(-70, 20); g2.bezierCurveTo(-76, -50, -30, -72, 0, -72); g2.bezierCurveTo(30, -72, 76, -50, 70, 20); g2.closePath(); };
  if (horn > 0.02) {
    for (const sd of [-1, 1]) {
      g.save(); g.scale(sd, 1);
      g.beginPath(); g.moveTo(54, -24); g.bezierCurveTo(100 * horn + 8, -26, 112 * horn + 8, -62 * horn - 6, 100 * horn + 10, -100 * horn - 10);
      g.bezierCurveTo(86 * horn + 6, -62 * horn, 74, -44, 40, -52); g.closePath(); fillStroke(g, '#f4ead0', 5);
      g.restore();
    }
  }
  g.beginPath(); dome(g); fillStroke(g, C.steel, 5);
  shadeIn(g, g2 => dome(g2), C.steelLo, -14, -10, C.steelLo);
  g.beginPath(); dome(g); g.lineWidth = 5; g.strokeStyle = C.ink; g.stroke();
  rrect(g, -74, 10, 148, 20, 6, C.steelLo, 5);
  for (let i = -3; i <= 3; i++) circle(g, i * 21, 20, 3.4, C.steelHi, 2);
  g.beginPath(); g.moveTo(-14, -66); g.quadraticCurveTo(-30, -48, -34, -30); g.lineWidth = 6; g.strokeStyle = C.steelHi; g.stroke();
  g.restore();
}

function drawItem(g, it, x, y, t, ang = 0) {
  g.save(); g.translate(x, y); g.rotate((it.ang != null ? it.ang : ang));
  const k = it.kind;
  if (k === 'axe') {
    g.beginPath(); g.moveTo(0, 60); g.lineTo(0, -108); g.lineWidth = 16; g.strokeStyle = C.ink; g.stroke();
    g.lineWidth = 8; g.strokeStyle = '#a5693a'; g.stroke();
    g.beginPath(); g.moveTo(-3, -112); g.bezierCurveTo(-62, -138, -64, -58, -4, -66); g.lineTo(4, -66); g.lineTo(4, -112); g.closePath();
    fillStroke(g, C.steel, 5);
    g.beginPath(); g.moveTo(-26, -112); g.quadraticCurveTo(-48, -100, -42, -80); g.lineWidth = 5; g.strokeStyle = C.steelHi; g.stroke();
    hand(g, 0, 8, 17);
  } else if (k === 'shield') {
    const r = it.r || 66;
    circle(g, 0, 0, r, '#caa05c', 5.5);
    g.save(); g.beginPath(); g.arc(0, 0, r - 2, 0, 7); g.clip();
    g.fillStyle = it.c1 || C.red; g.fillRect(-r, -r, r, r); g.fillRect(0, 0, r, r);
    g.fillStyle = it.c2 || C.cream; g.fillRect(0, -r, r, r); g.fillRect(-r, 0, r, r);
    shadeIn(g, g2 => g2.arc(0, 0, r, 0, 7), 'rgba(40,10,60,.38)', -16, -14, 'rgba(40,10,60,.38)');
    g.restore();
    g.lineWidth = 3.5; g.strokeStyle = C.ink; g.beginPath(); g.moveTo(-r, 0); g.lineTo(r, 0); g.moveTo(0, -r); g.lineTo(0, r); g.stroke();
    g.beginPath(); g.arc(0, 0, r - 8, 0, 7); g.lineWidth = 5; g.strokeStyle = '#8a5b2c'; g.stroke();
    circle(g, 0, 0, r, null, 5.5);
    circle(g, 0, 0, 17, C.steel, 4.5); circle(g, -4, -4, 5, C.steelHi, 0);
  } else if (k === 'book') {
    const o = it.open == null ? 0 : it.open;
    if (o > 0.5) {
      poly(g, [[-52, -30], [0, -22], [52, -30], [52, 26], [0, 34], [-52, 26]], C.cream, 5);
      g.lineWidth = 3; g.strokeStyle = C.shade2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-42, -16 + i * 10); g.lineTo(-8, -10 + i * 10); g.moveTo(8, -10 + i * 10); g.lineTo(42, -16 + i * 10); g.stroke(); }
      g.beginPath(); g.moveTo(0, -22); g.lineTo(0, 34); g.lineWidth = 4; g.strokeStyle = C.ink; g.stroke();
    } else {
      rrect(g, -34, -46, 68, 92, 7, C.dred, 5); rrect(g, -34, -46, 12, 92, 4, '#5a1520', 4);
      g.beginPath(); g.moveTo(8, -26); g.lineTo(8, 24); g.moveTo(-8, -10); g.lineTo(24, -10); g.lineWidth = 7; g.strokeStyle = C.gold; g.stroke();
    }
  } else if (k === 'chalice') {
    g.beginPath(); g.moveTo(-34, -52); g.quadraticCurveTo(-30, -2, 0, 0); g.quadraticCurveTo(30, -2, 34, -52); g.closePath(); fillStroke(g, C.gold, 5);
    g.beginPath(); g.moveTo(-24, -44); g.quadraticCurveTo(-22, -12, -6, -8); g.lineWidth = 5; g.strokeStyle = '#fff3b0'; g.stroke();
    rrect(g, -6, 0, 12, 24, 4, C.gold, 4.5); ellipse(g, 0, 30, 28, 9, C.gold, 4.5);
    circle(g, 0, 10, 6, C.red, 3);
  } else if (k === 'torch') {
    g.beginPath(); g.moveTo(0, 50); g.lineTo(0, -30); g.lineWidth = 18; g.strokeStyle = C.ink; g.stroke(); g.lineWidth = 10; g.strokeStyle = '#a5693a'; g.stroke();
    flameShape(g, 0, -30, 26, 62, t * 9 + (it.ph || 0), 1);
  } else if (k === 'lolly') {
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 62); g.lineWidth = 11; g.strokeStyle = C.ink; g.stroke(); g.lineWidth = 5; g.strokeStyle = '#fff'; g.stroke();
    drawSwirl(g, 0, -14, 30, t * (it.spin || 0));
  } else if (k === 'lantern') {
    g.beginPath(); g.arc(0, -52, 16, Math.PI, 0); g.lineWidth = 5; g.strokeStyle = C.ink; g.stroke();
    rrect(g, -22, -48, 44, 64, 8, '#ffcf5a', 5);
    g.fillStyle = C.ink; g.fillRect(-22, -14, 44, 5);
    ellipse(g, 0, 12, 22, 7, C.gold, 4.5);
    g.save(); g.globalAlpha = 0.5; g.fillStyle = '#fff6c9'; g.beginPath(); g.ellipse(0, -24, 10, 18, 0, 0, 7); g.fill(); g.restore();
  } else if (k === 'helmet') {
    drawHelmetItem(g, 0, 0, 0, it.horn == null ? 1 : it.horn, it.s || 0.8);
  } else if (k === 'sack') {
    g.beginPath(); g.moveTo(-26, -36); g.bezierCurveTo(-76, -20, -70, 56, 0, 56); g.bezierCurveTo(70, 56, 76, -20, 26, -36); g.closePath(); fillStroke(g, '#b48a52', 5);
    g.beginPath(); g.moveTo(-28, -34); g.quadraticCurveTo(0, -20, 28, -34); g.lineWidth = 7; g.strokeStyle = C.ink; g.stroke();
    ellipse(g, 0, -36, 26, 10, '#b48a52', 5);
    g.fillStyle = C.gold; for (const [a, b] of [[-14, -48], [4, -52], [16, -46]]) circle(g, a, b, 7, C.gold, 3);
    g.fillStyle = C.ink; g.font = '900 38px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', 0, 16);
  }
  g.restore();
}

function flameShape(g, x, y, w, h, ph, a = 1) {
  g.save(); g.translate(x, y); g.globalAlpha *= a;
  const layers = [[1, 1, '#d8322a'], [0.78, 0.78, C.orange], [0.5, 0.5, C.yellow]];
  layers.forEach(([hs, ws, col], i) => {
    const hh = h * hs * (0.9 + 0.14 * Math.sin(ph * 1.3 + i * 0.8)), ww = w * ws;
    const lean = Math.sin(ph + i * 0.9) * ww * 0.5 + Math.sin(ph * 2.3 + i) * ww * 0.15;
    g.beginPath(); g.moveTo(-ww, 6);
    g.bezierCurveTo(-ww * 1.3, -hh * 0.3, -ww * 0.15 + lean * 0.35, -hh * 0.55, lean * 1.15, -hh);
    g.bezierCurveTo(ww * 0.15 + lean * 0.8, -hh * 0.62, ww * 1.2 + lean * 0.2, -hh * 0.4, ww, 6);
    g.quadraticCurveTo(0, 20, -ww, 6); g.closePath();
    g.fillStyle = col; g.fill();
    if (i === 0) { g.lineWidth = 3.5; g.strokeStyle = '#5a1730'; g.stroke(); }
  });
  g.restore();
}

// ---------- kinds ----------
const KIND = {
  viking: { robe: '#b8322d', robe2: '#7e1f2a', trim: C.cream, hair: '#e0701f', hair2: '#9c4210' },
  viking2: { robe: '#3a5a8c', robe2: '#243a62', trim: C.cream, hair: '#6b4326', hair2: '#43271a' },
  maiden: { robe: C.teal, robe2: C.dteal, trim: C.cream, hair: '#e9b55a', hair2: '#b0782c' },
  monk: { robe: '#80502e', robe2: '#4d2e1b', trim: C.cream, hair: '#7a4a2a', hair2: '#4d2e1b' },
};

function furCollar(g, cy, col) {
  g.beginPath();
  const n = 9;
  g.moveTo(-82, cy);
  for (let i = 0; i < n; i++) {
    const x0 = -82 + (164 / n) * i, x1 = -82 + (164 / n) * (i + 1);
    g.quadraticCurveTo((x0 + x1) / 2, cy + 40 + (i % 2) * 8, x1, cy);
  }
  g.quadraticCurveTo(0, cy - 34, -82, cy); g.closePath(); fillStroke(g, col, 5);
  g.beginPath(); g.moveTo(-60, cy + 4); g.quadraticCurveTo(-50, cy + 20, -40, cy + 6); g.moveTo(10, cy + 8); g.quadraticCurveTo(20, cy + 24, 30, cy + 8);
  g.lineWidth = 3; g.strokeStyle = C.shade2; g.stroke();
}

function drawChar(g, p, t) {
  const K = KIND[p.kind] || KIND.viking;
  const f = p.face || {};
  const ph = p.ph || 0;
  const breathe = Math.sin(t * 3.1 + ph);
  const bob = (p.bob || 0) + breathe * 2.2;
  const sq = p.squash == null ? 1 : p.squash;
  const walk = p.walk || 0;
  g.save(); g.scale(1 / Math.sqrt(sq), sq);   // squash & stretch anchored on ground
  const HS = 1.22;
  const hy = -246 + (p.hdy || 0) + bob * 0.5, hx = (p.hdx || 0) + (p.lean || 0) * 0.6;

  // legs / boots
  for (const sd of [-1, 1]) {
    const lift = walk ? Math.max(0, Math.sin(walk + (sd > 0 ? Math.PI : 0))) * 18 : 0;
    const fx = sd * 40 + (walk ? Math.cos(walk + (sd > 0 ? Math.PI : 0)) * 16 : 0);
    ellipse(g, fx, 6 - lift, 31, 16, '#3a2218', 5);
  }
  // back hair / hood
  if (p.kind === 'monk') {
    g.save(); g.translate(p.lean || 0, 0); g.translate(0, -150); g.scale(1.2, 1.2); g.translate(0, 150);
    g.beginPath(); g.moveTo(-100, -150); g.bezierCurveTo(-125, -250, -60, -330, 0, -326); g.bezierCurveTo(60, -330, 125, -250, 100, -150);
    g.quadraticCurveTo(0, -120, -100, -150); g.closePath(); fillStroke(g, K.robe, 5.5);
    g.restore();
  }
  // body
  g.save(); g.translate(p.lean || 0, 0);
  const bw0 = p.kind === 'monk' ? 74 : 70, bw1 = p.kind === 'monk' ? 108 : 98;
  g.beginPath(); bodyPathFn(bw0, bw1)(g); fillStroke(g, K.robe, 5.5);
  shadeIn(g, bodyPathFn(bw0, bw1), K.robe2, -26, -8, K.robe2);
  g.beginPath(); bodyPathFn(bw0, bw1)(g); g.lineWidth = 5.5; g.strokeStyle = C.ink; g.stroke();
  // folds
  g.lineWidth = 4; g.strokeStyle = K.robe2; g.beginPath(); g.moveTo(-30, -56); g.quadraticCurveTo(-34, -30, -42, -6); g.moveTo(24, -64); g.quadraticCurveTo(30, -34, 26, -6); g.stroke();
  // belt
  if (p.kind === 'monk') {
    g.beginPath(); g.moveTo(-72, -78); g.quadraticCurveTo(0, -60, 72, -78); g.lineWidth = 14; g.strokeStyle = C.ink; g.stroke(); g.lineWidth = 7; g.strokeStyle = C.cream; g.stroke();
    g.beginPath(); g.moveTo(34, -68); g.quadraticCurveTo(46, -40, 36, -14); g.lineWidth = 13; g.strokeStyle = C.ink; g.stroke(); g.lineWidth = 6; g.strokeStyle = C.cream; g.stroke();
    // wooden cross
    g.beginPath(); g.moveTo(0, -150); g.lineTo(0, -108); g.moveTo(-13, -134); g.lineTo(13, -134); g.lineWidth = 14; g.strokeStyle = C.ink; g.stroke(); g.lineWidth = 7; g.strokeStyle = '#c28a50'; g.stroke();
  } else {
    g.beginPath(); g.moveTo(-86, -76); g.quadraticCurveTo(0, -56, 86, -76); g.lineWidth = 24; g.strokeStyle = C.ink; g.stroke(); g.lineWidth = 14; g.strokeStyle = '#6a3d24'; g.stroke();
    rrect(g, -15, -90, 30, 30, 6, C.gold, 4.5); rrect(g, -6, -81, 12, 12, 3, '#6a3d24', 3);
    furCollar(g, -158, K.trim);
  }
  g.restore();

  // hair behind + braids
  g.save(); g.translate((p.lean || 0) * 0.8, 0); g.translate(hx, hy); g.scale(HS, HS);
  if (p.kind === 'viking' || p.kind === 'viking2' || p.kind === 'maiden') {
    for (const sd of [-1, 1]) {
      const bx = sd * 92, by = 4;
      circle(g, bx, by, 30, K.hair, 5);
      let px = bx, py = by + 26;
      for (let i = 0; i < 4; i++) {
        const sway = Math.sin(t * 3 + i * 0.7 + sd + ph) * 2.5 * (i + 1) * 0.4 + (p.braidSway || 0) * i;
        px = bx + sd * 6 + sway; py = by + 32 + i * 25;
        ellipse(g, px, py, 17 - i * 1.5, 15, i % 2 ? K.hair : K.hair2, 4.5);
      }
      circle(g, px, py + 16, 7, C.gold, 3.5);
    }
  }
  g.restore();

  if (p.extraBack) p.extraBack(g, t);
  // HEAD
  g.save(); g.translate(hx, hy); g.rotate((p.tilt || 0) + Math.sin(t * 1.9 + ph) * 0.012); g.scale(HS, HS);
  const hp = headPathFn(0, 0);
  g.beginPath(); hp(g); fillStroke(g, C.white, 0);
  shadeIn(g, hp, C.shade, -16, -13, C.shade2);
  g.beginPath(); hp(g); g.lineWidth = 5.5; g.strokeStyle = C.ink; g.stroke();
  // tonsure for monk
  if (p.kind === 'monk') {
    g.save(); g.beginPath(); hp(g); g.clip();
    g.beginPath(); g.moveTo(-100, -40); g.quadraticCurveTo(-95, -90, -58, -86); g.quadraticCurveTo(0, -60, 58, -86); g.quadraticCurveTo(95, -90, 100, -40);
    g.lineTo(100, -120); g.lineTo(-100, -120); g.closePath(); g.fillStyle = K.hair; g.fill();
    g.lineWidth = 5; g.strokeStyle = C.ink; g.stroke();
    g.restore();
    g.beginPath(); hp(g); g.lineWidth = 5.5; g.strokeStyle = C.ink; g.stroke();
  }
  // maiden bangs + headband
  if (p.kind === 'maiden') {
    g.save(); g.beginPath(); hp(g); g.clip();
    g.beginPath(); g.moveTo(-110, -20); g.quadraticCurveTo(-70, -50, -28, -22); g.quadraticCurveTo(0, -72, 34, -26); g.quadraticCurveTo(70, -50, 110, -20); g.lineTo(110, -130); g.lineTo(-110, -130); g.closePath();
    g.fillStyle = K.hair; g.fill(); g.lineWidth = 5; g.strokeStyle = C.ink; g.stroke();
    g.beginPath(); g.moveTo(-90, -60); g.quadraticCurveTo(-60, -90, -30, -80); g.lineWidth = 5; g.strokeStyle = '#ffe3a0'; g.stroke();
    g.restore();
    g.beginPath(); hp(g); g.lineWidth = 5.5; g.strokeStyle = C.ink; g.stroke();
    drawSwirl(g, 78, -78, 29, t * 1.4);
  }
  drawFace(g, 0, 0, f, t);
  // beard
  if (p.kind === 'viking' || p.kind === 'viking2') {
    g.beginPath();
    g.moveTo(-90, 6); g.bezierCurveTo(-98, 60, -60, 100, -40, 104);
    g.quadraticCurveTo(-30, 126 + (p.beardSway || 0), -18, 112); g.quadraticCurveTo(-6, 138 + (p.beardSway || 0), 8, 112);
    g.quadraticCurveTo(22, 132, 34, 106); g.bezierCurveTo(70, 96, 98, 60, 90, 6);
    g.bezierCurveTo(78, 40, 52, 66, 28, 70); g.quadraticCurveTo(0, 78, -28, 70); g.bezierCurveTo(-52, 66, -78, 40, -90, 6); g.closePath();
    fillStroke(g, K.hair, 5.5);
    g.save(); g.clip(); g.fillStyle = dots(g, 2, K.hair2, 8); g.fillRect(-120, -10, 240, 160); g.restore();
    // mustache over mouth edge
    g.beginPath(); g.moveTo(-6, 32); g.quadraticCurveTo(-30, 18, -52, 40); g.quadraticCurveTo(-30, 44, -6, 38); g.closePath(); fillStroke(g, K.hair, 4.5);
    g.beginPath(); g.moveTo(6, 32); g.quadraticCurveTo(30, 18, 52, 40); g.quadraticCurveTo(30, 44, 6, 38); g.closePath(); fillStroke(g, K.hair, 4.5);
    // redraw mouth lower so the beard doesn't hide it
    drawFace(g, 0, 0, Object.assign({}, f, { eyes: 'none', tears: false, blush: false, sweat: false, brow: null }), t);
  }
  // helmet
  if (p.kind === 'viking' || p.kind === 'viking2') {
    if (!p.noHelmet) {
      g.save(); g.translate(0, -48);
      const h = p.helmetHorn || 0;
      if (h > 0) for (const sd of [-1, 1]) {
        g.save(); g.scale(sd, 1);
        g.beginPath(); g.moveTo(62, -2); g.bezierCurveTo(110 * h + 6, -4, 126 * h + 6, -42 * h - 4, 108 * h + 8, -84 * h - 6);
        g.bezierCurveTo(98 * h + 4, -46 * h, 82, -26, 46, -34); g.closePath(); fillStroke(g, '#f4ead0', 5);
        g.restore();
      }
      const dome = g2 => { g2.moveTo(-90, 36); g2.bezierCurveTo(-96, -40, -40, -62, 0, -62); g2.bezierCurveTo(40, -62, 96, -40, 90, 36); g2.closePath(); };
      g.beginPath(); dome(g); fillStroke(g, C.steel, 0);
      shadeIn(g, dome, C.steelLo, -16, -10, C.steelLo);
      g.beginPath(); dome(g); g.lineWidth = 5.5; g.strokeStyle = C.ink; g.stroke();
      // band
      g.beginPath(); g.moveTo(-93, 20); g.quadraticCurveTo(0, 40, 93, 20); g.lineTo(93, 40); g.quadraticCurveTo(0, 60, -93, 40); g.closePath(); fillStroke(g, C.steelLo, 5.5);
      for (let i = -4; i <= 4; i++) circle(g, i * 20, 36 + 10 * (1 - (i / 4) * (i / 4)) * 0.9 - 4, 3.6, C.steelHi, 2);
      // highlight + nose guard
      g.beginPath(); g.moveTo(-34, -52); g.quadraticCurveTo(-60, -38, -66, -10); g.lineWidth = 7; g.strokeStyle = C.steelHi; g.stroke();
      rrect(g, -9, 30, 18, 60, 7, C.steel, 5);
      g.restore();
    }
  }
  g.restore();

  // ARMS + items
  const sh = (sd) => [sd * 68 + (p.lean || 0), -146 + bob * 0.4];
  for (const sd of [-1, 1]) {
    const key = sd < 0 ? 'L' : 'R';
    const target = p['arm' + key] || [sd * 100, -64 + Math.sin(t * 3.1 + ph + sd) * 3];
    const [sx, sy] = sh(sd);
    const bend = (p['bend' + key] != null ? p['bend' + key] : sd);
    const a = ik(sx, sy, target[0], target[1], 58, 56, bend);
    tube(g, [[sx, sy], [a.ex, a.ey], [a.hx, a.hy]], 27, K.robe, 5);
    const it = p['item' + key];
    if (it) drawItem(g, it, a.hx, a.hy, t, it.ang != null ? it.ang : 0);
    else hand(g, a.hx, a.hy, 17, sd * 0.3);
  }
  if (p.extra) p.extra(g, t);
  g.restore();
}

// draw character with sticker outline + chromatic fringe onto main ctx
function placeChar(g, p, t) {
  const L = _cl[_clI++ % _cl.length];
  clearLayer(L);
  L.g.save(); L.g.translate(CH.ox, CH.oy);
  drawChar(L.g, p, t);
  L.g.restore();
  if (p.dim) { L.g.globalCompositeOperation = 'source-atop'; L.g.fillStyle = `rgba(40,10,70,${p.dim})`; L.g.fillRect(0, 0, L.w, L.h); L.g.globalCompositeOperation = 'source-over'; }
  clearLayer(_sil);
  const sg = _sil.g;
  const tint = (col, dx, dy, rad, n) => {
    // build silhouette in tint colour once, then stamp
    sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, _sil.c.width, _sil.c.height); sg.restore();
    sg.globalCompositeOperation = 'source-over'; sg.drawImage(L.c, 0, 0, L.w, L.h);
    sg.globalCompositeOperation = 'source-in'; sg.fillStyle = col; sg.fillRect(0, 0, L.w, L.h);
    sg.globalCompositeOperation = 'source-over';
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; g.drawImage(_sil.c, dx + Math.cos(a) * rad, dy + Math.sin(a) * rad, L.w, L.h); }
    if (n === 0) g.drawImage(_sil.c, dx, dy, L.w, L.h);
  };
  const sc = p.s || 1;
  g.save();
  g.translate(p.x, p.y); g.rotate(p.rot || 0); g.scale(sc * (p.flip || 1), sc);
  g.translate(-CH.ox, -CH.oy);
  if (p.fade != null) g.globalAlpha *= p.fade;
  if (!p.noSticker) tint('#ffffff', 0, 0, 9, 16);
  if (!p.noFringe) { tint(C.mag, -4.5, -1.5, 0, 0); tint(C.grn, 4.5, 2, 0, 0); }
  g.drawImage(L.c, 0, 0, L.w, L.h);
  g.restore();
}

// dark purple silhouette variant (background crowd) – cheap
function placeSilChar(g, p, t, col = '#3a2250') {
  const L = _cl[_clI++ % _cl.length];
  clearLayer(L);
  L.g.save(); L.g.translate(CH.ox, CH.oy);
  drawChar(L.g, p, t);
  L.g.restore();
  L.g.globalCompositeOperation = 'source-atop';
  L.g.fillStyle = col; L.g.globalAlpha = 0.78; L.g.fillRect(0, 0, L.w, L.h);
  L.g.globalAlpha = 1; L.g.globalCompositeOperation = 'source-over';
  g.save();
  g.translate(p.x, p.y); g.rotate(p.rot || 0); g.scale((p.s || 1) * (p.flip || 1), p.s || 1);
  g.translate(-CH.ox, -CH.oy);
  g.drawImage(L.c, 0, 0, L.w, L.h);
  g.restore();
}
