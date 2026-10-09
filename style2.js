// ---------- "storybook caricature" look: thin warm outlines, flat colour + soft shade, big noses, painted backgrounds ----------
const SK = { line: '#3a2a22', skin: '#f2c9a0', skinSh: '#dba67c', blush: '#f2a58f', wool: '#5d7ab8', woolSh: '#4a638f', gold: '#e8b43a' };

function path2(g, fn) { g.beginPath(); fn(g); }
function fillLine(g, fill, lw = 3.4) { if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = SK.line; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } }

// head, facing right, centre (0,0); a = { nx, ny: nose tip, chin: extra chin depth }
function head2(a) {
  return g => {
    g.moveTo(-50, -10);
    g.bezierCurveTo(-58, -60, -20, -86, 20, -84);
    g.bezierCurveTo(52, -82, 70, -60, 72, -34);
    g.bezierCurveTo(74, -22, 80, -14, 80, -8);
    g.lineTo(84, 2);
    g.bezierCurveTo(96, 6, a.nx, a.ny - 16, a.nx, a.ny);
    g.bezierCurveTo(a.nx - 1, a.ny + 11, a.nx - 24, a.ny + 12, 90, 50);
    g.lineTo(82 + a.lip, 52);
    g.bezierCurveTo(86 + a.lip, 60, 86 + a.lip, 66, 80 + a.lip, 70);
    g.bezierCurveTo(86 + a.lip, 76, 84 + a.lip, 86, 76 + a.lip, 90 + a.chin);
    g.bezierCurveTo(70, 102 + a.chin, 54, 106 + a.chin, 34, 102 + a.chin);
    g.bezierCurveTo(8, 98, -22, 86, -38, 62);
    g.bezierCurveTo(-48, 42, -52, 20, -50, -10);
    g.closePath();
  };
}

function eye2(g, x, y, r, look, mood, big) {
  const rx = big ? 13 : 11, ry = big ? 12 : 9;
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 2.6; g.strokeStyle = SK.line; g.stroke();
  g.beginPath(); g.arc(x + look[0], y + look[1], big ? 6.2 : 5, 0, 7); g.fillStyle = '#2a1d17'; g.fill();
  g.beginPath(); g.arc(x + look[0] + 1.8, y + look[1] - 2, 1.8, 0, 7); g.fillStyle = '#fff'; g.fill();
  // upper lid
  g.beginPath(); g.moveTo(x - rx - 2, y - 2); g.quadraticCurveTo(x, y - ry - 6, x + rx + 2, y - 2); g.lineWidth = 3.4; g.strokeStyle = SK.line; g.stroke();
  // brow
  g.beginPath();
  if (mood === 'worry') { g.moveTo(x - 16, y - 22); g.quadraticCurveTo(x, y - 30, x + 18, y - 36); }
  else if (mood === 'stern') { g.moveTo(x - 16, y - 32); g.quadraticCurveTo(x + 2, y - 26, x + 20, y - 22); }
  else { g.moveTo(x - 16, y - 28); g.quadraticCurveTo(x, y - 36, x + 18, y - 28); }
  g.lineWidth = 6; g.strokeStyle = r; g.lineCap = 'round'; g.stroke();
}

// whole character: origin = base of neck. p = { dir, kind: 'father'|'boy', mood, look, talk, t }
function char2(g, p) {
  const adult = p.kind === 'father';
  const t = p.t || 0, bob = Math.sin(t * 2.4 + (adult ? 0 : 1)) * 2;
  g.save();
  g.scale(p.dir || 1, 1);
  const hc = [0, adult ? -118 : -90 + bob];            // head centre
  const hair = adult ? '#8b5a2e' : '#e7b95a', hairDk = adult ? '#6a4020' : '#c8963a';
  const cloak = adult ? SK.wool : '#a85a45', cloakSh = adult ? SK.woolSh : '#8a4636';
  // ---- body
  g.save();
  const bw = adult ? 150 : 108, bh = 520;
  path2(g, g2 => { g2.moveTo(-bw * 0.5, 4); g2.bezierCurveTo(-bw * 0.95, 30, -bw * 1.1, 160, -bw * 1.2, bh); g2.lineTo(bw * 1.2, bh); g2.bezierCurveTo(bw * 1.1, 160, bw * 0.95, 30, bw * 0.5, 4); g2.quadraticCurveTo(0, 26, -bw * 0.5, 4); });
  fillLine(g, adult ? '#6b8f55' : '#d9c9a6');
  // tunic neckline
  path2(g, g2 => { g2.moveTo(-26, 6); g2.quadraticCurveTo(0, 40, 26, 6); }); fillLine(g, null, 3);
  // cloak over the shoulder (father: blue wool with brooch)
  path2(g, g2 => { g2.moveTo(-bw * 0.55, 6); g2.bezierCurveTo(-bw * 1.05, 40, -bw * 1.18, 200, -bw * 1.28, bh); g2.lineTo(-bw * 0.2, bh); g2.bezierCurveTo(-bw * 0.35, 220, -bw * 0.1, 80, 8, 24); g2.quadraticCurveTo(-bw * 0.3, 34, -bw * 0.55, 6); });
  fillLine(g, cloak);
  g.save(); path2(g, g2 => { g2.moveTo(-bw * 0.55, 6); g2.bezierCurveTo(-bw * 1.05, 40, -bw * 1.18, 200, -bw * 1.28, bh); g2.lineTo(-bw * 0.2, bh); g2.bezierCurveTo(-bw * 0.35, 220, -bw * 0.1, 80, 8, 24); g2.quadraticCurveTo(-bw * 0.3, 34, -bw * 0.55, 6); }); g.clip();
  g.fillStyle = cloakSh; g.globalAlpha = 0.55; g.beginPath(); g.ellipse(-bw * 0.9, 300, 40, 260, 0.1, 0, 7); g.fill(); g.restore();
  // brooch
  g.beginPath(); g.arc(-bw * 0.42, 40, adult ? 17 : 12, 0, 7); fillLine(g, SK.gold, 3);
  g.beginPath(); g.arc(-bw * 0.42, 40, adult ? 8 : 5, 0, 7); fillLine(g, '#c88a22', 2);
  // belt
  path2(g, g2 => { g2.moveTo(-bw * 1.1, 250); g2.quadraticCurveTo(0, 276, bw * 1.1, 250); g2.lineTo(bw * 1.12, 276); g2.quadraticCurveTo(0, 302, -bw * 1.12, 276); g2.closePath(); }); fillLine(g, '#6a4326', 3);
  g.restore();
  // ---- neck
  path2(g, g2 => { g2.moveTo(-26, hc[1] + 70); g2.lineTo(-24, 8); g2.quadraticCurveTo(0, 22, 26, 8); g2.lineTo(30, hc[1] + 76); g2.closePath(); }); fillLine(g, SK.skin);
  // ---- hair behind
  if (adult) { path2(g, g2 => { g2.moveTo(-40, hc[1] - 50); g2.bezierCurveTo(-92, hc[1] - 20, -90, hc[1] + 70, -62, hc[1] + 128); g2.lineTo(-20, hc[1] + 70); g2.closePath(); }); fillLine(g, hair); }
  // ---- head
  g.save(); g.translate(hc[0], hc[1]);
  const A = adult ? { nx: 128, ny: 38, chin: 2, lip: 0 } : { nx: 100, ny: 30, chin: -6, lip: -12 };
  path2(g, head2(A)); fillLine(g, SK.skin, 0);
  // soft shade under jaw / back
  g.save(); path2(g, head2(A)); g.clip();
  g.fillStyle = SK.skinSh; g.beginPath(); g.rect(-100, -150, 300, 300); g.save(); g.translate(-12, -16); head2(A)(g); g.restore(); g.fill('evenodd');
  g.restore();
  path2(g, head2(A)); fillLine(g, null, 3.6);
  // ear
  g.beginPath(); g.ellipse(-12, 8, 10, 15, 0, 0, 7); fillLine(g, SK.skin, 3); g.beginPath(); g.arc(-12, 9, 4, 0.5, 4.5); g.lineWidth = 2; g.strokeStyle = SK.line; g.stroke();
  // cheek blush
  g.beginPath(); g.ellipse(52, 44, 14, 9, 0, 0, 7); g.fillStyle = SK.blush; g.globalAlpha = 0.5; g.fill(); g.globalAlpha = 1;
  // nostril + nose line
  g.beginPath(); g.moveTo(A.nx - 20, A.ny - 2); g.quadraticCurveTo(A.nx - 12, A.ny + 4, A.nx - 6, A.ny - 2); g.lineWidth = 2.6; g.strokeStyle = SK.line; g.stroke();
  // eye
  eye2(g, 46, -12, adult ? '#6a4020' : '#a8782c', p.look || [3, 0], p.mood || 'worry', !adult);
  // mouth
  g.lineWidth = 3.4; g.strokeStyle = SK.line; g.lineCap = 'round';
  const lipx = adult ? 0 : -12, my = 76 + (adult ? 4 : -4), open = p.talk ? 0.5 + 0.5 * Math.abs(Math.sin(t * 9)) : 0;
  if (p.mood === 'stern') { g.beginPath(); g.moveTo(84 + lipx, my + 2); g.quadraticCurveTo(70 + lipx, my - 4, 52, my + 6); g.stroke(); }
  else if (open > 0.02) { g.beginPath(); g.moveTo(84 + lipx, my); g.quadraticCurveTo(68 + lipx, my + 8 + 14 * open, 50, my + 2); g.quadraticCurveTo(66 + lipx, my - 2, 84 + lipx, my); g.fillStyle = '#7a2e2a'; g.fill(); g.stroke(); }
  else { g.beginPath(); g.moveTo(80 + lipx, my + 4); g.quadraticCurveTo(64 + lipx, my - 4, 50, my + 4); g.stroke(); }
  // beard + moustache (father)
  if (adult) {
    path2(g, g2 => { g2.moveTo(-24, 36); g2.bezierCurveTo(-30, 96, 20, 140, 58, 148); g2.bezierCurveTo(78, 150, 94, 120, 92, 96); g2.bezierCurveTo(90, 84, 80, 88, 74, 84); g2.bezierCurveTo(60, 98, 28, 90, 8, 62); g2.bezierCurveTo(0, 50, -10, 40, -24, 36); g2.closePath(); });
    fillLine(g, hair, 3.4);
    path2(g, g2 => { g2.moveTo(84, 54); g2.bezierCurveTo(100, 54, 112, 62, 112, 74); g2.bezierCurveTo(100, 70, 92, 72, 80, 70); g2.closePath(); }); fillLine(g, hair, 3);
    g.strokeStyle = hairDk; g.lineWidth = 2.4; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(10 + i * 14, 96 + (i % 2) * 6); g.quadraticCurveTo(16 + i * 14, 120, 22 + i * 12, 140 - i * 2); g.stroke(); }
  }
  // hair on top
  if (adult) {
    path2(g, g2 => { g2.moveTo(-52, -4); g2.bezierCurveTo(-62, -64, -24, -92, 22, -90); g2.bezierCurveTo(58, -88, 76, -64, 74, -40); g2.bezierCurveTo(62, -62, 42, -74, 20, -72); g2.bezierCurveTo(0, -70, -20, -52, -34, -20); g2.bezierCurveTo(-40, -8, -48, 0, -52, -4); g2.closePath(); }); fillLine(g, hair, 3.4);
  } else {
    path2(g, g2 => { g2.moveTo(-54, 0); g2.bezierCurveTo(-70, -62, -30, -96, 24, -92); g2.bezierCurveTo(62, -90, 80, -64, 78, -38); g2.lineTo(86, -50); g2.lineTo(70, -30); g2.bezierCurveTo(52, -46, 30, -50, 12, -44); g2.lineTo(18, -62); g2.lineTo(-4, -42); g2.bezierCurveTo(-24, -34, -36, -22, -42, -4); g2.closePath(); }); fillLine(g, hair, 3.4);
    g.strokeStyle = hairDk; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-30, -64); g.quadraticCurveTo(-6, -80, 30, -78); g.stroke();
  }
  g.restore();
  g.restore();
}

// thought-bubble inset (like the reference): a round window onto another scene
function insetBubble(g, cx, cy, r, drawInside, tail) {
  g.save();
  g.shadowColor = 'rgba(40,25,10,0.35)'; g.shadowBlur = 22; g.shadowOffsetY = 8;
  g.beginPath(); g.arc(cx, cy, r + 10, 0, 7); g.fillStyle = '#fff'; g.fill(); g.restore();
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.clip(); g.translate(cx - r, cy - r); drawInside(g, r * 2); g.restore();
  g.beginPath(); g.arc(cx, cy, r + 5, 0, 7); g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke();
  g.beginPath(); g.arc(cx, cy, r + 10, 0, 7); g.lineWidth = 2.4; g.strokeStyle = SK.line; g.stroke();
  (tail || []).forEach(([x, y, rr]) => { g.beginPath(); g.arc(x, y, rr, 0, 7); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 2.4; g.strokeStyle = SK.line; g.stroke(); });
}

// soft, painted Icelandic morning (no hard edges in the far layers)
function bgFjord(g, w, h, t = 0) {
  gradFill(g, 0, 0, w, h, [[0, '#bcd3e6'], [0.28, '#f6dcc4'], [0.48, '#f3cfb4'], [0.5, '#9db8c4'], [1, '#6f8f84']]);
  brushStrokes(g, 0, 0, w, h * 0.5, ['#ffffff', '#fbe6d0', '#c9dcec'], 120, 140, 0.25, 15, 0.03);
  g.save(); g.filter = 'blur(2.5px)';
  // far mountains
  const mt = (base, col, snow, pts) => {
    g.beginPath(); g.moveTo(-20, base); pts.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(w + 20, base); g.closePath(); g.fillStyle = col; g.fill();
    if (snow) { g.save(); g.clip(); g.fillStyle = 'rgba(255,255,255,0.8)'; pts.forEach(([x, y]) => { g.beginPath(); g.moveTo(x - 40, y + 44); g.lineTo(x, y); g.lineTo(x + 40, y + 44); g.quadraticCurveTo(x, y + 30, x - 40, y + 44); g.fill(); }); g.restore(); }
  };
  mt(h * 0.5, '#aebfd2', true, [[60, h * 0.36], [200, h * 0.43], [340, h * 0.32], [470, h * 0.42], [600, h * 0.35], [720, h * 0.44]]);
  mt(h * 0.52, '#8fa8b8', false, [[0, h * 0.45], [150, h * 0.47], [300, h * 0.44], [520, h * 0.49], [720, h * 0.46]]);
  g.restore();
  // mist band
  const gr = g.createLinearGradient(0, h * 0.44, 0, h * 0.56); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.65)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, h * 0.44, w, h * 0.12);
  // fjord water
  g.save(); g.filter = 'blur(1.2px)'; brushStrokes(g, 0, h * 0.5, w, h * 0.1, ['#e7f1f5', '#8fb0bd', '#fbe3cf'], 70, 90, 0.5, 21, 0.01); g.restore();
  // grass slope
  g.beginPath(); g.moveTo(0, h * 0.62); g.bezierCurveTo(w * 0.3, h * 0.58, w * 0.6, h * 0.66, w, h * 0.6); g.lineTo(w, h); g.lineTo(0, h); g.closePath();
  const gg = g.createLinearGradient(0, h * 0.6, 0, h); gg.addColorStop(0, '#b4bf7a'); gg.addColorStop(1, '#7d9560'); g.fillStyle = gg; g.fill();
  g.save(); g.clip(); brushStrokes(g, 0, h * 0.58, w, h * 0.45, ['#cfd68c', '#8aa066', '#a2b36c', '#6f8a56'], 260, 70, 0.55, 33, -0.7); g.restore();
  // turf-roof longhouse in the distance (left)
  g.save(); g.filter = 'blur(0.8px)';
  g.beginPath(); g.moveTo(40, h * 0.62); g.lineTo(80, h * 0.585); g.lineTo(250, h * 0.585); g.lineTo(290, h * 0.62); g.closePath(); g.fillStyle = '#7b9a58'; g.fill(); g.lineWidth = 2.4; g.strokeStyle = 'rgba(58,42,34,0.7)'; g.stroke();
  g.fillStyle = '#8a6440'; g.fillRect(80, h * 0.62, 170, 34); g.strokeRect(80, h * 0.62, 170, 34);
  g.fillStyle = '#4d3524'; g.fillRect(150, h * 0.62 + 6, 28, 28);
  g.restore();
}

function ship2(g, w) { // tiny longship on a sunset sea, drawn for the bubble
  gradFill(g, 0, 0, w, w * 0.55, [[0, '#f8c58b'], [1, '#f3a36d']]);
  circle(g, w * 0.7, w * 0.4, w * 0.11, '#fff2c4', 0);
  gradFill(g, 0, w * 0.55, w, w * 0.5, [[0, '#7c6a96'], [1, '#3f3668']]);
  g.save(); g.translate(w * 0.46, w * 0.62); g.scale(w / 760, w / 760); drawShip(g, 0, 0, 1, 1.2, { crew: null, windy: 1, oars: false }); g.restore();
}
