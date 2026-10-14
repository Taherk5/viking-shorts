// Why do we yawn?  Question Short #4 (flat vector, Brainy hosts). Pure function of time.
import * as M from '../shared/motion.js';
import * as A from '../shared/art.js';
import * as K from '../shared/kit.js';

const { E, TAU, SPRING, clamp, lerp, prog, font, hash01, mix } = M;
const { C, sp, star4, heart, brainy, face } = A;
const { CX, DISPLAY, UI, pulse, blinkAt, unit, titleBlock, extruded, chip, question } = K;

const { TIM, Ln, Wd, bt } = await K.timing();
const SC = TIM.map((l, i) => (i === 0 ? 0 : l.start));

// a yawn: 0 -> 1 -> 0 over ~1.6 s starting at t0
const yawnAt = (t, t0, d = 1.6) => { const p = (t - t0) / d; return p <= 0 || p >= 1 ? 0 : Math.sin(Math.PI * Math.min(1, p * 1.25)) ** 0.7; };

function o2(ctx, x, y, r, k = 1, col = C.cyan) {
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = col; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.font = font(r * 0.95, 700, DISPLAY); ctx.fillText('O', -r * 0.12, r * 0.33);
  ctx.font = font(r * 0.5, 700, DISPLAY); ctx.fillText('2', r * 0.42, r * 0.55);
  ctx.restore();
}

function stamp(ctx, str, x, y, k, col = C.red) {
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.18); ctx.scale(k, k);
  ctx.font = font(130, 700, DISPLAY); ctx.textAlign = 'center'; const w = ctx.measureText(str).width + 70;
  ctx.strokeStyle = col; ctx.lineWidth = 14; ctx.beginPath(); ctx.roundRect(-w / 2, -120, w, 160, 24); ctx.stroke();
  ctx.fillStyle = col; ctx.fillText(str, 0, 6); ctx.restore();
}

function dog(ctx, x, y, s, yawn = 0, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#8a5a3c'; ctx.beginPath(); ctx.ellipse(-88, -10 + Math.sin(t * 3) * 4, 34, 72, 0.25, 0, TAU); ctx.ellipse(88, -10 - Math.sin(t * 3) * 4, 34, 72, -0.25, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d9a066'; ctx.beginPath(); ctx.arc(0, 0, 100, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f3dcc0'; ctx.beginPath(); ctx.ellipse(0, 46, 58, 44, 0, 0, TAU); ctx.fill();
  const shut = yawn > 0.3;
  for (const sx of [-1, 1]) {
    if (shut) { ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(sx * 38, -6, 15, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); }
    else { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(sx * 38, -14, 12, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx * 38 + 4, -18, 4, 0, TAU); ctx.fill(); }
  }
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.ellipse(0, 22, 20, 14, 0, 0, TAU); ctx.fill();
  if (yawn > 0.05) { ctx.beginPath(); ctx.ellipse(0, 66, 22 + 8 * yawn, 6 + 30 * yawn, 0, 0, TAU); ctx.fill(); ctx.fillStyle = C.pink; ctx.beginPath(); ctx.ellipse(0, 70 + 20 * yawn, 14, 6 + 10 * yawn, 0, 0, TAU); ctx.fill(); }
  else { ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 36); ctx.lineTo(0, 52); ctx.arc(-14, 52, 14, 0, Math.PI * 0.8); ctx.moveTo(0, 52); ctx.arc(14, 52, 14, Math.PI, Math.PI * 0.2, true); ctx.stroke(); }
  ctx.restore();
}

// ------------------------------------------------------------------ scenes
function s1(ctx, t, u) {
  extruded(ctx, "DON'T YAWN", CX, 470, 150, C.yellow, C.yellowDk, 14, sp(t, -0.3, SPRING.bouncy), Math.sin(t * 2) * 0.03);
  const y = yawnAt(t, 0.9, 1.9);
  brainy(ctx, CX, 1300, 1.35, { mood: y > 0.08 ? 'yawn' : 'happy', open: y, look: [0, -0.2], blink: blinkAt(t, 1), armL: y > 0.3 ? 165 : 30, armR: y > 0.3 ? 165 : 30, sq: [1 - 0.04 * y, 1 + 0.06 * y + 0.02 * pulse(u)], t });
  if (y > 0.3) { ctx.globalAlpha = y; ctx.font = font(64, 700, DISPLAY); ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.fillText('YAAAWN', CX + 270, 760); ctx.globalAlpha = 1; }
}

function s2(ctx, t, u, ls) {
  titleBlock(ctx, 'THE OLD IDEA', 'MORE OXYGEN?', Wd(2, 0), Wd(2, 8), t, 112);
  const y = yawnAt(t, Wd(2, 5), 2.2);
  const bx = CX - 40, by = 1300;
  brainy(ctx, bx, by, 1.0, { mood: y > 0.08 ? 'yawn' : 'think', open: y, look: [0.4, -0.6], blink: blinkAt(t, 2), sq: [1, 1 + 0.02 * pulse(u)], t });
  for (let i = 0; i < 7; i++) {
    const q = ((t * 0.45 + i / 7) % 1), k = sp(t, Wd(2, 8) + i * 0.06, SPRING.bouncy);
    const x = lerp(820 - (i % 3) * 60, bx, q * q), yy = lerp(620 + (i % 4) * 90, by - 100, q * q);
    ctx.globalAlpha = Math.min(1, (1 - q) * 3); o2(ctx, x, yy, 46, k * (1 - 0.5 * q)); ctx.globalAlpha = 1;
  }
}

function s3(ctx, t, u) {
  titleBlock(ctx, 'TESTED', 'EXTRA OXYGEN', Wd(3, 0), Wd(3, 5), t, 112);
  // oxygen tank
  const tx = 300, ty = 900;
  ctx.fillStyle = C.green; ctx.beginPath(); ctx.roundRect(tx - 90, ty - 260, 180, 470, 80); ctx.fill();
  ctx.fillStyle = '#3cbf6a'; ctx.fillRect(tx - 90, ty - 140, 180, 30);
  ctx.fillStyle = C.panelLt; ctx.beginPath(); ctx.roundRect(tx - 30, ty - 320, 60, 70, 12); ctx.fill();
  o2(ctx, tx, ty + 30, 62, 1, C.white);
  // yawn counter: the same number with and without extra oxygen
  const cx = 690;
  for (const [i, lab] of [[0, 'NORMAL AIR'], [1, 'EXTRA O2']]) {
    const k = sp(t, Wd(3, 4) + i * 0.5, SPRING.bouncy), yy = 720 + i * 250;
    if (k < 0.01) continue;
    ctx.save(); ctx.translate(cx, yy); ctx.scale(k, k);
    ctx.fillStyle = C.panel; ctx.beginPath(); ctx.roundRect(-190, -95, 380, 190, 30); ctx.fill();
    ctx.font = font(30, 800, UI); ctx.letterSpacing = '3px'; ctx.fillStyle = C.lilac; ctx.textAlign = 'center'; ctx.fillText(lab, 0, -42); ctx.letterSpacing = '0px';
    ctx.font = font(84, 700, DISPLAY); ctx.fillStyle = C.white; ctx.fillText('12 yawns', 0, 50);
    ctx.restore();
  }
  stamp(ctx, 'NO CHANGE', CX, 1235, sp(t, Wd(3, 7), SPRING.bouncy));
}

function s4(ctx, t, u) {
  titleBlock(ctx, 'NEW IDEA', 'BRAIN COOLER', Wd(4, 0), Wd(4, 5), t, 118);
  const tCool = Wd(4, 6), cool = unit(tCool, tCool + 1.6, t);
  const y = yawnAt(t, tCool - 0.2, 2.4);
  const bx = CX, by = 1270;
  // heat waves before, cool swirl after
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `rgba(255,138,61,${0.8 * (1 - cool)})`; ctx.lineWidth = 10; ctx.beginPath();
    for (let j = 0; j <= 20; j++) { const yy = 860 - j * 9, x = bx - 90 + i * 90 + Math.sin(j * 0.6 + t * 6 + i) * 12; if (j) ctx.lineTo(x, yy); else ctx.moveTo(x, yy); }
    ctx.stroke();
  }
  brainy(ctx, bx, by, 1.2, { mood: y > 0.08 ? 'yawn' : cool > 0.8 ? 'happy' : 'worry', open: y, tint: `rgba(255,90,40,${0.45 * (1 - cool)})`, look: [0, -0.4], blink: blinkAt(t, 3), sq: [1, 1 + 0.02 * pulse(u)], t });
  for (let i = 0; i < 8; i++) {
    const q = ((t * 0.7 + i / 8) % 1), a = i * 0.8 + q * 4;
    const x = bx + Math.cos(a) * 330 * (1 - q * 0.7), yy = 900 + Math.sin(a) * 160 * (1 - q * 0.7);
    ctx.globalAlpha = cool * Math.sin(q * Math.PI); star4(ctx, x, yy, 18, a, C.cyan); ctx.globalAlpha = 1;
  }
  chip(ctx, 'COOL AIR IN', 250, 680, sp(t, Wd(4, 9), SPRING.bouncy), C.cyan, C.ink, 30);
  chip(ctx, 'MORE BLOOD FLOW', 760, 760, sp(t, Wd(4, 13), SPRING.bouncy), C.pink, C.white, 30);
}

const PEOPLE = [['#ffd27a', '#3b2a1a'], ['#ffc9a8', '#c0392b'], ['#c98b5e', '#1a1a1a'], ['#ffe0c7', '#f2c94c'], ['#8d5a3b', '#2b1b10']];
function s5(ctx, t, u) {
  titleBlock(ctx, 'CONTAGIOUS', 'CATCH IT', Wd(5, 0), Wd(5, 3), t, 118);
  const t0 = Wd(5, 4);
  // see / hear / read icons
  const icons = [['SEEING', Wd(5, 4)], ['HEARING', Wd(5, 5)], ['READING', Wd(5, 8)]];
  icons.forEach(([s, ti], i) => chip(ctx, s, 230 + i * 270, 640, sp(t, ti, SPRING.bouncy), [C.yellow, C.cyan, C.lilac][i], C.ink, 32));
  // the wave: five faces, each catches the yawn from the one before
  for (let i = 0; i < 5; i++) {
    const row = i % 2, x = 160 + i * 172, y = 900 + row * 190;
    const yw = yawnAt(t, t0 + i * 0.55, 1.5), k = sp(t, SC[4] - 0.5 + i * 0.05, SPRING.bouncy);
    if (k > 0.01) face(ctx, x, y, 92 * k, { yawn: yw, skin: PEOPLE[i][0], hair: PEOPLE[i][1], blink: blinkAt(t, i) });
  }
}

function s6(ctx, t, u) {
  titleBlock(ctx, 'WHO YOU CATCH IT FROM', 'CLOSE = MORE', Wd(6, 0), Wd(6, 5), t, 110);
  const base = 1180, groups = [[260, 'FRIENDS', 'FAMILY', 0.95, C.pink], [740, 'STRANGERS', '', 0.4, C.lilac]];
  groups.forEach(([x, a, b, h, col], gi) => {
    const g = unit(Wd(6, gi ? 11 : 6), Wd(6, gi ? 11 : 6) + 1.0, t);
    const H2 = 420 * h * g;
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - 110, base - H2, 220, Math.max(H2, 0.1), [26, 26, 0, 0]); ctx.fill();
    ctx.font = font(36, 800, UI); ctx.letterSpacing = '3px'; ctx.textAlign = 'center'; ctx.fillStyle = C.white;
    ctx.fillText(a, x, base + 52); if (b) ctx.fillText('+ ' + b, x, base + 96); ctx.letterSpacing = '0px';
    const yw = yawnAt(t, Wd(6, gi ? 11 : 6) + 0.6, 1.6) * h;
    face(ctx, x, base - H2 - 90, 78, { yawn: yw, mood: gi ? 'flat' : 'happy', skin: PEOPLE[gi * 2][0], hair: PEOPLE[gi * 2][1] });
    if (!gi && g > 0.5) heart(ctx, x + 80, base - H2 - 160, 0.9 * sp(t, Wd(6, 8), SPRING.bouncy), C.pink);
  });
}

function s7(ctx, t, u) {
  titleBlock(ctx, 'EVEN DOGS', 'GOOD BOY', Wd(7, 0), Wd(7, 1), t, 118);
  const ty = Wd(7, 3);
  face(ctx, 290, 900, 150, { yawn: yawnAt(t, ty - 0.3, 1.6), skin: PEOPLE[1][0], hair: PEOPLE[1][1] });
  dog(ctx, 730, 930, 1.35, yawnAt(t, ty + 0.9, 1.7), t);
  const k = sp(t, ty + 0.9, SPRING.bouncy);
  if (k > 0.01) { ctx.save(); ctx.globalAlpha = Math.min(1, k); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 8; ctx.setLineDash([6, 18]); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(430, 780); ctx.quadraticCurveTo(520, 660, 610, 760); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
}

function s8(ctx, t, u) {
  question(ctx, ['So... did you', 'yawn yet?'], Wd(8, 1), t, 420, 112);
  const y = yawnAt(t, Wd(8, 2) + 0.3, 2.2);
  brainy(ctx, CX, 1310, 1.15, { mood: y > 0.08 ? 'yawn' : 'happy', open: y, look: [0.2, -0.4], blink: blinkAt(t, 9), armR: 150, rot: Math.sin(t * 1.6) * 0.05, sq: [1, 1 + 0.025 * pulse(u)], t });
}

const HITS = [
  [bt(0), 'hook', 'sub', { len: 0.9 }],
  ...K.pushHits(SC, bt),
  [bt(0.9), 'Brainy yawns', 'swell', {}],
  [bt(Wd(2, 8)), 'MORE OXYGEN?', 'pop', { pitch: 'A5' }],
  [bt(Wd(3, 4)), 'counter 1', 'pop', { pitch: 'E5' }], [bt(Wd(3, 4) + 0.5), 'counter 2', 'pop', { pitch: 'E5' }], [bt(Wd(3, 7)), 'NO CHANGE stamp', 'thud', { pitch: 'D3', to: 'A2' }],
  [bt(Wd(4, 5)), 'BRAIN COOLER', 'thud', { pitch: 'D3', to: 'A2' }], [bt(Wd(4, 9)), 'cool air', 'whoosh', { len: 0.5, from: 3000, to: 600 }], [bt(Wd(4, 13)), 'blood flow', 'pop', { pitch: 'F#5' }],
  [bt(Wd(5, 3)), 'CATCH IT', 'thud', { pitch: 'D3', to: 'A2' }], [bt(Wd(5, 4)), 'seeing', 'pop', { pitch: 'D5' }], [bt(Wd(5, 5)), 'hearing', 'pop', { pitch: 'F#5' }], [bt(Wd(5, 8)), 'reading', 'pop', { pitch: 'A5' }],
  [bt(Wd(6, 6)), 'friends bar', 'pop', { pitch: 'D6' }], [bt(Wd(6, 11)), 'strangers bar', 'pop', { pitch: 'A4' }],
  [bt(Wd(7, 3) + 0.9), 'dog yawns', 'boing', { pitch: 'D4', to: 'A4' }],
  [bt(Wd(8, 1)), 'question', 'pop', { pitch: 'A5' }],
].sort((a, b) => a[0] - b[0]);

K.run({ TIM, SC, SCENES: [s1, s2, s3, s4, s5, s6, s7, s8], HITS, samples: 5 });
