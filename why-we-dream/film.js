// Why do we dream?  Flat-vector explainer (Brainy the brain), 9:16, pure function of time.
// Timing follows assets/vo_timing.json (voice, word by word) on the 75 bpm grid in beats.json.
import * as M from './lib/motion.js';
import * as A from './art.js';

const { W, H, FORMAT, E, TAU, SPRING, clamp, lerp, prog, kf, font, hash01, mix, wobble } = M;
const { C, sp, tri, pill, blobPath, star4, star5, heart, poof, sparkles, brainy, iconSun, magnifier, gamepad, rat, cheese, zzz, thoughtBubble, padlock, card } = A;

const TIM = await (await fetch('assets/vo_timing.json')).json();
const GR = await (await fetch('beats.json')).json();
const bt = (s) => (s - GR.offset) / GR.period;                 // seconds -> beats (for HITS)
const Ln = (n) => TIM[n - 1];
const Wd = (n, i) => Ln(n).words[i].s;                         // start of word i of line n
const CX = FORMAT.safe.x + FORMAT.safe.w / 2;
const DISPLAY = 'Display', UI = 'UI';

const pulse = (u) => Math.exp(-(((u % 1) + 1) % 1) * 6);        // one lub per beat
const blinkAt = (t, seed = 0) => { const p = (t * 0.37 + seed * 0.31) % 1; return p < 0.05 ? Math.sin((Math.PI * p) / 0.05) : 0; };
const unit = (a, b, t) => E.inOutCubic(prog(t, a, b));

// scene starts = first spoken line of each scene; the push into a scene lands just before it
const SC = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n, i) => ({ t0: i === 0 ? 0 : Ln(n).start }));
const PUSH_A = 0.46, PUSH_B = 0.04;

// ------------------------------------------------------------------ the story picture (a dream, as pixels and as vector)
function storyPicture(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1b1464'); g.addColorStop(1, '#7a35b0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 7; i++) star4(ctx, hash01(i, 21) * w, hash01(i, 22) * h * 0.45, w * 0.02, 0, '#fff3c4');
  ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(w * 0.74, h * 0.27, w * 0.13, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffe28a'; ctx.beginPath(); ctx.arc(w * 0.70, h * 0.24, w * 0.03, 0, TAU); ctx.arc(w * 0.78, h * 0.31, w * 0.02, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a1a7a'; ctx.beginPath(); ctx.moveTo(0, h * 0.78); ctx.quadraticCurveTo(w * 0.3, h * 0.6, w * 0.6, h * 0.78);
  ctx.quadraticCurveTo(w * 0.8, h * 0.88, w, h * 0.74); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
  ctx.fillStyle = C.pink; ctx.fillRect(w * 0.16, h * 0.6, w * 0.22, h * 0.22);
  ctx.fillStyle = C.orange; ctx.beginPath(); ctx.moveTo(w * 0.13, h * 0.61); ctx.lineTo(w * 0.27, h * 0.45); ctx.lineTo(w * 0.41, h * 0.61); ctx.fill();
  ctx.fillStyle = C.yellow; ctx.fillRect(w * 0.2, h * 0.66, w * 0.06, h * 0.07);
  ctx.fillStyle = C.ink; ctx.fillRect(w * 0.29, h * 0.7, w * 0.05, h * 0.12);
  ctx.fillStyle = '#7a4a2a'; ctx.fillRect(w * 0.55, h * 0.64, w * 0.025, h * 0.16);
  ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(w * 0.565, h * 0.58, w * 0.075, 0, TAU); ctx.fill();
}
let STORY = null;
const SCOLS = 34, SROWS = 26;
function init() {
  const cv = document.createElement('canvas'); cv.width = SCOLS; cv.height = SROWS;
  const c = cv.getContext('2d', { willReadFrequently: true });
  storyPicture(c, SCOLS, SROWS);
  const d = c.getImageData(0, 0, SCOLS, SROWS).data;
  STORY = Array.from({ length: SCOLS * SROWS }, (_, i) => `rgb(${d[i * 4]},${d[i * 4 + 1]},${d[i * 4 + 2]})`);
}

// ------------------------------------------------------------------ background
function bg(ctx, t, u) {
  const dawn = E.inOutSine(prog(t, 37.5, 39.8));
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix(C.bgTop, '#3a2380', dawn)); g.addColorStop(0.55, mix(C.bgMid, '#9a2fa0', dawn)); g.addColorStop(1, mix(C.bgBot, '#ff8f6a', dawn));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(W / 2, H * 0.93, 30, W / 2, H * 0.93, 950);
  rg.addColorStop(0, 'rgba(255,95,162,0.30)'); rg.addColorStop(1, 'rgba(255,95,162,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  const cols = [C.cyan, C.pink, C.yellow, C.lilac];
  for (let i = 0; i < 16; i++) {
    const x = hash01(i, 1) * W + Math.sin(t * 0.3 + i) * 30;
    const y = (((hash01(i, 2) * H - t * (8 + hash01(i, 3) * 14)) % H) + H) % H;
    ctx.globalAlpha = (0.05 + 0.05 * hash01(i, 5)) * (1 + 0.5 * pulse(u));
    ctx.fillStyle = cols[i % 4]; ctx.beginPath(); ctx.arc(x, y, 36 + hash01(i, 4) * 90, 0, TAU); ctx.fill();
  }
  for (let i = 0; i < 60; i++) {
    const tw = 0.5 + 0.5 * Math.sin(t * (1 + hash01(i, 7) * 2) + i * 3);
    ctx.globalAlpha = (0.25 + 0.5 * tw) * (1 - dawn * 0.85);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hash01(i, 8) * W, hash01(i, 9) * H * 0.85, 1.5 + hash01(i, 10) * 2.2, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ------------------------------------------------------------------ shared bits
function titleBlock(ctx, small, big, ts, tb, t, size = 118) {
  const k1 = sp(t, ts, SPRING.snappy);
  if (k1 > 0.001) {
    ctx.save(); ctx.translate(CX, 318); ctx.scale(k1, k1);
    ctx.font = font(34, 800, UI); ctx.letterSpacing = '4px';
    const w = ctx.measureText(small).width + 52;
    pill(ctx, -w / 2, -32, w, 64); ctx.fillStyle = C.yellow; ctx.fill();
    ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText(small, 2, 12); ctx.letterSpacing = '0px';
    ctx.restore();
  }
  const k2 = sp(t, tb, SPRING.bouncy);
  if (k2 > 0.001) {
    ctx.save(); ctx.translate(CX, 458); ctx.scale(k2, k2); ctx.rotate((1 - k2) * -0.12);
    ctx.font = font(size, 700, DISPLAY); ctx.textAlign = 'center';
    ctx.fillStyle = C.pinkDk; ctx.fillText(big, 6, 10); ctx.fillStyle = C.white; ctx.fillText(big, 0, 0);
    ctx.restore();
  }
}

function extruded(ctx, str, x, y, size, top, side, depth = 16, k = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  ctx.font = font(size, 700, DISPLAY); ctx.textAlign = 'center';
  ctx.fillStyle = side; for (let i = depth; i >= 1; i -= 2) ctx.fillText(str, i * 0.8, i);
  ctx.fillStyle = top; ctx.fillText(str, 0, 0);
  ctx.restore();
}

function runner(ctx, x, y, s, ph, o = {}) {
  const { rot = 0, air = 0 } = o;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.lineCap = 'round';
  const sw = air ? 0.9 : Math.sin(ph), sw2 = air ? -0.9 : Math.sin(ph + Math.PI);
  ctx.strokeStyle = C.cyan; ctx.lineWidth = 15;
  ctx.beginPath(); ctx.moveTo(0, -70); ctx.lineTo(sw * 30, -34); ctx.lineTo(sw * 38, 0); ctx.stroke();       // legs
  ctx.beginPath(); ctx.moveTo(0, -70); ctx.lineTo(sw2 * 30, -34); ctx.lineTo(sw2 * 38, 0); ctx.stroke();
  ctx.strokeStyle = C.white; ctx.lineWidth = 17; ctx.beginPath(); ctx.moveTo(0, -72); ctx.lineTo(4, -128); ctx.stroke();    // body
  ctx.lineWidth = 12; ctx.strokeStyle = C.pinkLt;
  ctx.beginPath(); ctx.moveTo(4, -118); ctx.lineTo(sw2 * 34 + 4, -92); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4, -118); ctx.lineTo(sw * 34 + 4, -92); ctx.stroke();
  ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(8, -148, 24, 0, TAU); ctx.fill();
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(16, -150, 4, 0, TAU); ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ scenes (ls = seconds since the scene's first line)
function sHook(ctx, t, u) {
  const k = sp(t, -0.3, SPRING.bouncy);
  const pop = 0.1 * -wobble((t - Wd(1, 3)) / GR.period, 1.8, 3.2);
  for (let i = 0; i < 9; i++) {
    const a = hash01(i, 31) * TAU, r = 340 + hash01(i, 32) * 130, tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 2);
    star4(ctx, CX + Math.cos(a) * r * 1.1, 640 + Math.sin(a) * r * 0.9, 12 + 20 * tw * k, t * 0.6 + i, [C.yellow, C.cyan, C.pinkLt][i % 3]);
  }
  extruded(ctx, '6', CX, 1025, 1000, C.yellow, C.yellowDk, 22, k * (1 + 0.025 * pulse(u) + (t > Wd(1, 3) ? pop : 0)), Math.sin(t * 1.4) * 0.025);
  const kl = sp(t, -0.15, SPRING.snappy) * (1 + 0.1 * Math.max(0, 1 - (t - Wd(1, 4)) * 4) * (t > Wd(1, 4) ? 1 : 0));
  ctx.save(); ctx.translate(CX, 1112); ctx.scale(kl, kl); ctx.font = font(70, 800, UI); ctx.letterSpacing = '26px'; ctx.textAlign = 'center';
  ctx.fillStyle = C.white; ctx.fillText('YEARS', 13, 0); ctx.restore(); ctx.letterSpacing = '0px';
  // the sleeper: a tiny bed
  const by = 1300;
  ctx.fillStyle = C.panelLt; ctx.beginPath(); ctx.roundRect(CX - 250, by - 190, 500, 200, 26); ctx.fill();          // headboard
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.roundRect(CX - 150, by - 135, 300, 80, 36); ctx.fill();              // pillow
  brainy(ctx, CX, by - 8, 0.6, { mood: 'sleep', breath: Math.sin(t * 2.4), t });
  ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.roundRect(CX - 270, by - 72, 540, 100, 30); ctx.fill();            // blanket
  ctx.fillStyle = C.yellowDk; for (let i = 0; i < 5; i++) ctx.fillRect(CX - 215 + i * 100, by - 72, 22, 100);
  ctx.fillStyle = C.panel; ctx.fillRect(CX - 290, by + 20, 580, 40);
  zzz(ctx, CX + 250, by - 110, t, C.white, 60);
}

function sQuestion(ctx, t, u, ls) {
  const k = sp(ls, -0.5, SPRING.bouncy);
  extruded(ctx, '?', CX, 960, 800, C.pink, C.pinkDk, 20, k * (1 + 0.025 * pulse(u)), Math.sin(t * 2.2) * 0.05);
  const bx = CX - 150, by = 1295;
  const shrug = prog(t, Wd(2, 6) - 0.1, Wd(2, 6) + 0.2);
  const scan = Math.sin(t * 2.3);
  const aR = lerp(118 + 14 * scan, 120, shrug), aL = shrug > 0.01 ? lerp(30, 105, shrug) : undefined;
  brainy(ctx, bx, by, 0.85, { mood: shrug > 0.5 ? 'think' : 'wow', look: [scan * 0.8, -0.6], blink: blinkAt(t, 2), armR: aR, armL: aL, sq: [1, 1 + 0.02 * pulse(u)], t });
  const hx = bx + (128 + Math.sin((aR * Math.PI) / 180) * 78 + 14) * 0.85, hy = by + (-128 + Math.cos((aR * Math.PI) / 180) * 78) * 0.85;
  magnifier(ctx, hx - 70, hy - 70, 0.9, -0.2);
  const qs = [[Wd(2, 3), CX + 330, 560, C.cyan], [Wd(2, 4), CX - 330, 700, C.yellow], [Wd(2, 5), CX + 300, 1000, C.pinkLt]];
  for (const [t0, x, y, col] of qs) {
    const kk = sp(t, t0, SPRING.bouncy); if (kk < 0.01) continue;
    ctx.save(); ctx.translate(x, y + Math.sin(t * 2 + x) * 10); ctx.scale(kk, kk); ctx.rotate(Math.sin(t + x) * 0.2);
    ctx.font = font(130, 700, DISPLAY); ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.fillText('?', 0, 40); ctx.restore();
  }
}

function sMemory(ctx, t, u, ls) {
  titleBlock(ctx, 'IDEA 1', 'MEMORY', Wd(3, 0), Wd(3, 2), t);
  const kinds = ['sun', 'cup', 'cone', 'bus'], marks = [1, 0, 1, 0];
  const tEnter = Wd(3, 3), tRep = Wd(3, 8), tFile = Wd(3, 12);
  // the cabinet
  const cabX = 600, cabY = 905;
  let squash = 0;
  for (const j of [0, 1]) { const ta = tFile + 0.5 + j * 0.7; if (t > ta) squash += 0.05 * wobble((t - ta) / GR.period, 2.2, 3.5); }
  ctx.save(); ctx.translate(cabX, 1190); ctx.scale(1 + squash, 1 - squash); ctx.translate(-cabX, -1190);
  ctx.fillStyle = C.panelLt; ctx.beginPath(); ctx.roundRect(cabX - 270, cabY - 40, 540, 330, 30); ctx.fill();
  for (let i = 0; i < 3; i++) {
    const open = i === 0 ? Math.max(sp(t, tFile + 0.1, SPRING.snappy) - sp(t, tFile + 1.7, SPRING.snappy), 0) : 0;
    ctx.fillStyle = '#6b55d8'; ctx.beginPath(); ctx.roundRect(cabX - 245, cabY - 18 + i * 100 + open * 14, 490, 86, 18); ctx.fill();
    ctx.fillStyle = C.lilac; pill(ctx, cabX - 50, cabY + 14 + i * 100 + open * 14, 100, 18); ctx.fill();
    if (i === 0 && open > 0.05) { ctx.fillStyle = C.yellow; ctx.globalAlpha = 0.5 * open; ctx.beginPath(); ctx.roundRect(cabX - 245, cabY - 18 + open * 14, 490, 86, 18); ctx.fill(); ctx.globalAlpha = 1; }
  }
  ctx.restore();
  // the day: four cards
  const row = 660;
  for (let i = 0; i < 4; i++) {
    const x = 175 + 200 * i, te = tEnter + i * 0.16, k = sp(t, te, SPRING.gentle);
    if (k < 0.01) continue;
    const star = i === 0 || i === 2;
    let px = lerp(-170 - 90 * i, x, k), py = row, sc = 1, rot = (1 - k) * -0.4 + Math.sin(t * 1.3 + i) * 0.02, vis = 1;
    const sweepX = 90 + 760 * tri((t - tRep) * 0.9);
    const hit = t > tRep && t < tRep + 2.2 ? Math.max(0, 1 - Math.abs(sweepX - x) / 110) : 0;
    sc += hit * 0.12;
    const mark = prog(t, tFile - 0.4, tFile - 0.1) * (star ? 1 : 0);
    if (t >= tFile) {
      if (star) {
        const j = i === 0 ? 0 : 1, p = prog(t, tFile + 0.15 + j * 0.7, tFile + 0.8 + j * 0.7), e = E.inOutCubic(p);
        px = lerp(x, cabX, e); py = lerp(row, cabY + 20, e) - Math.sin(Math.PI * e) * 150; sc = lerp(1, 0.4, e); rot = e * (j ? -0.5 : 0.5);
        if (p >= 1) vis = 0;
      } else {
        const p = prog(t, tFile + 0.25, tFile + 0.6 + i * 0.12);
        sc = 1 - E.inBack(p, 1.2); if (p >= 1) vis = 0;
        poof(ctx, x, row, t, tFile + 0.6 + i * 0.12, C.lilac, 80, 8);
      }
    }
    if (vis) card(ctx, px, py, 170, 210, kinds[i], { rot, sc, mark, glow: hit, t });
  }
  if (t > tRep && t < tRep + 2.2) {          // the replay bar
    const sweepX = 90 + 760 * tri((t - tRep) * 0.9), a = Math.min(1, (t - tRep) * 4, (tRep + 2.2 - t) * 4);
    ctx.globalAlpha = 0.6 * a; ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.roundRect(sweepX - 16, row - 150, 32, 300, 16); ctx.fill(); ctx.globalAlpha = 1;
  }
  const wow = t > tRep && t < tRep + 2.2;
  brainy(ctx, 190, 1268, 0.85, { mood: t > tFile + 1.6 ? 'happy' : wow ? 'wow' : 'happy', look: [0.7, -0.4], blink: blinkAt(t, 3), armR: 150 + 20 * Math.sin(t * 5) * (wow ? 1 : 0.3), sq: [1, 1 + 0.02 * pulse(u)], t });
  sparkles(ctx, cabX, cabY, t, tFile + 1.4, 110, 6);
}

// the maze path in panel coordinates
const MP = [[100, 650], [100, 420], [330, 420], [330, 640], [560, 640], [560, 300], [300, 300], [300, 120], [660, 120]];
const MSEG = MP.slice(1).map((p, i) => Math.hypot(p[0] - MP[i][0], p[1] - MP[i][1]));
const MLEN = MSEG.reduce((a, b) => a + b, 0);
function mazeAt(s) {
  s = clamp(s, 0, MLEN);
  for (let i = 0; i < MSEG.length; i++) {
    if (s <= MSEG[i] + 1e-6) { const f = s / MSEG[i], a = MP[i], b = MP[i + 1]; return { x: lerp(a[0], b[0], f), y: lerp(a[1], b[1], f), ang: Math.atan2(b[1] - a[1], b[0] - a[0]) }; }
    s -= MSEG[i];
  }
  const a = MP[MP.length - 2], b = MP[MP.length - 1]; return { x: b[0], y: b[1], ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
}
function mazePath(ctx, upTo) {
  ctx.beginPath(); ctx.moveTo(MP[0][0], MP[0][1]);
  let s = upTo;
  for (let i = 0; i < MSEG.length && s > 0; i++) {
    const f = Math.min(1, s / MSEG[i]); ctx.lineTo(lerp(MP[i][0], MP[i + 1][0], f), lerp(MP[i][1], MP[i + 1][1], f)); s -= MSEG[i];
  }
}

function sRats(ctx, t, u) {
  titleBlock(ctx, 'PROOF', 'RATS', Wd(4, 0), Wd(4, 4) - 0.1, t);
  const px = 110, py = 500, pw = 780, ph = 760;
  const tRun = Wd(4, 0) + 0.15, tRunEnd = tRun + 1.75, tRep = Wd(4, 5);
  const night = E.inOutSine(prog(t, tRep - 0.15, tRep + 0.35));
  ctx.save(); ctx.translate(px, py);
  ctx.fillStyle = mix(C.panel, '#120a33', night); ctx.beginPath(); ctx.roundRect(0, 0, pw, ph, 36); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, pw, ph, 36); ctx.clip();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  mazePath(ctx, MLEN); ctx.strokeStyle = '#4b3bb0'; ctx.lineWidth = 120; ctx.stroke();
  mazePath(ctx, MLEN); ctx.strokeStyle = mix('#3b2a9a', '#1b1050', night); ctx.lineWidth = 98; ctx.stroke();
  cheese(ctx, MP[8][0] + 6, MP[8][1] + 2, 1.05);
  const sRat = MLEN * E.inOutSine(prog(t, tRun, tRunEnd));
  if (t > tRun) { mazePath(ctx, sRat); ctx.strokeStyle = 'rgba(255,201,60,0.4)'; ctx.lineWidth = 14; ctx.setLineDash([2, 26]); ctx.stroke(); ctx.setLineDash([]); }
  const rp = mazeAt(sRat), asleep = t > tRep - 0.1;
  const bump = asleep ? 0.03 * Math.sin(t * 2.4) : 0;
  rat(ctx, rp.x, rp.y, asleep ? mazeAt(MLEN).ang : rp.ang, 1.45 + bump, { sleep: asleep ? 1 : 0, run: t });
  if (asleep) zzz(ctx, rp.x + 30, rp.y - 40, t, C.white, 44);
  // the dream replay: a glowing dot runs the same route, twice, fast
  const T1 = tRep + 0.05, rd = (Ln(4).end - 0.05 - T1) / 2;
  if (t > T1) {
    const gp = ((t - T1) / rd) % 1, run2 = Math.min(1, (t - T1) / rd / 2 + 1e-9), s = MLEN * E.inOutSine(clamp(gp, 0, 1));
    mazePath(ctx, s); ctx.strokeStyle = 'rgba(46,200,255,0.55)'; ctx.lineWidth = 34; ctx.stroke();
    mazePath(ctx, s); ctx.strokeStyle = C.cyan; ctx.lineWidth = 12; ctx.stroke();
    const gpos = mazeAt(s);
    ctx.fillStyle = '#d8f6ff'; ctx.beginPath(); ctx.arc(gpos.x, gpos.y, 22, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(46,200,255,0.4)'; ctx.beginPath(); ctx.arc(gpos.x, gpos.y, 38, 0, TAU); ctx.fill();
    void run2;
  }
  if (night > 0.01) {                     // night: moon and stars in the corner of the panel
    ctx.globalAlpha = night; ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(80, 70, 36, 0, TAU); ctx.fill();
    ctx.fillStyle = mix(C.panel, '#120a33', night); ctx.beginPath(); ctx.arc(94, 62, 32, 0, TAU); ctx.fill();
    star4(ctx, 170, 60, 12, t, '#fff3c4'); star4(ctx, 60, 150, 9, t + 1, '#fff3c4'); ctx.globalAlpha = 1;
  }
  ctx.restore();
  ctx.strokeStyle = C.panelLt; ctx.lineWidth = 8; ctx.beginPath(); ctx.roundRect(0, 0, pw, ph, 36); ctx.stroke();
  ctx.restore();
}

function sEmotion(ctx, t, u) {
  titleBlock(ctx, 'IDEA 2', 'EMOTIONS', Wd(5, 0), Wd(5, 2), t);
  const tTan = Wd(5, 2) + 0.15, tUn = Wd(5, 8), tCalm = Wd(5, 12) + 0.15;
  const p = E.inOutCubic(prog(t, tUn, tCalm));
  const kk = sp(t, tTan, SPRING.bouncy), cx = CX, cy = 770, R = 190 * kk;
  const shake = (1 - p) * (t > tTan ? 1 : 0) * 7;
  const colsT = [C.orange, C.pink, C.yellow], colsC = ['#7cf0c0', C.cyan, C.lilac];
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (kk > 0.01) for (let s = 0; s < 3; s++) {
    ctx.beginPath();
    for (let i = 0; i <= 260; i++) {
      const th = (i / 260) * TAU, ph = s * 1.3;
      const tx = (Math.sin(3 * th + ph) + 0.55 * Math.sin(7 * th + 1 + ph)) / 1.55, ty = (Math.cos(4 * th + ph) + 0.55 * Math.cos(5 * th + 2 - ph)) / 1.55;
      const rr = 1 - 0.13 * s, cxr = Math.cos(th + t * 0.3) * rr, cyr = Math.sin(th + t * 0.3) * rr;
      const x = cx + R * lerp(tx, cxr, p) + shake * Math.sin(t * 60 + i * 0.07 + s), y = cy + R * lerp(ty, cyr, p) + shake * Math.cos(t * 55 + i * 0.05);
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.strokeStyle = mix(colsT[s], colsC[s], p); ctx.lineWidth = 15; ctx.stroke();
  }
  if (p > 0.6) {
    const hk = sp(t, tUn + 0.9 * (tCalm - tUn), SPRING.bouncy);
    heart(ctx, cx, cy + 6, 1.6 * hk * (1 + 0.06 * pulse(u)), C.pink);
    for (let i = 0; i < 4; i++) { const q = ((t * 0.4 + i / 4) % 1); ctx.globalAlpha = Math.sin(q * Math.PI) * hk; heart(ctx, cx - 200 + i * 135 + Math.sin(q * 5 + i) * 18, cy - 190 - q * 150, 0.5, C.pinkLt); }
    ctx.globalAlpha = 1;
  }
  // moon for "overnight"
  const mk = sp(t, Wd(5, 11), SPRING.bouncy);
  if (mk > 0.01) {
    ctx.save(); ctx.translate(820, 620); ctx.scale(mk, mk); ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(0, 0, 50, 0, TAU); ctx.fill();
    ctx.fillStyle = C.bgMid; ctx.beginPath(); ctx.arc(22, -10, 44, 0, TAU); ctx.fill(); star4(ctx, -60, -50, 14, t, '#fff3c4'); ctx.restore();
  }
  // couch + Brainy sitting on it
  brainy(ctx, CX - 110, 1240, 0.82, { mood: p > 0.7 ? 'happy' : t > tTan ? 'worry' : 'happy', look: [0, -0.3], blink: blinkAt(t, 5) + (p > 0.8 ? 0.3 : 0), armL: p > 0.6 ? 160 : 40, armR: p > 0.6 ? 160 : 40, sq: [1, 1 + 0.02 * pulse(u)], breath: Math.sin(t * 2), t });
  ctx.fillStyle = C.orange; ctx.beginPath(); ctx.roundRect(120, 1190, 760, 110, 34); ctx.fill();
  ctx.fillStyle = '#e0702a'; ctx.beginPath(); ctx.roundRect(100, 1170, 110, 150, 40); ctx.roundRect(790, 1170, 110, 150, 40); ctx.fill();
  ctx.fillStyle = C.yellowDk; ctx.fillRect(130, 1296, 20, 26); ctx.fillRect(850, 1296, 20, 26);
}

function sPractice(ctx, t, u) {
  titleBlock(ctx, 'IDEA 3', 'PRACTICE', Wd(6, 0), Wd(6, 2), t);
  const mx = 90, my = 520, mw = 820, mh = 540, sx = mx + 22, sy = my + 22, sw = mw - 44, shh = mh - 44;
  ctx.fillStyle = '#0e0630'; ctx.beginPath(); ctx.roundRect(mx, my, mw, mh, 44); ctx.fill();
  ctx.fillStyle = C.panelLt; ctx.fillRect(CX - 40, my + mh, 80, 40); ctx.beginPath(); ctx.roundRect(CX - 140, my + mh + 30, 280, 24, 12); ctx.fill();
  ctx.save(); ctx.translate(sx, sy); ctx.beginPath(); ctx.roundRect(0, 0, sw, shh, 26); ctx.clip();
  const sg = ctx.createLinearGradient(0, 0, 0, shh); sg.addColorStop(0, '#1d6fb8'); sg.addColorStop(1, '#6a2fa8'); ctx.fillStyle = sg; ctx.fillRect(0, 0, sw, shh);
  const gy = 400;                                                          // ground line
  ctx.fillStyle = '#2a1a7a'; ctx.fillRect(0, gy, sw, shh - gy);
  const a1 = Wd(6, 6), D = (Ln(6).end - a1 - 0.1) / 3, att = Math.floor(clamp((t - a1) / D, -1, 2.999));
  const pa = clamp((t - a1) / D - att, 0, 1);
  const scroll = (t - a1) * 330;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 6;
  for (let i = 0; i < 9; i++) { const x = (((i * 130 - scroll * 0.8) % 1170) + 1170) % 1170 - 80; ctx.beginPath(); ctx.moveTo(x, gy + 20); ctx.lineTo(x - 60, shh); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0, gy + 60); ctx.lineTo(sw, gy + 60); ctx.stroke();
  const rx = 350, started = t >= a1 - 0.2;
  // each try: [jump time (pa), obstacle crosses at pa 0.5]
  const jumpAt = [0.62, 0.38, 0.36][Math.max(att, 0)];
  const ok = att >= 1, jp = clamp((pa - jumpAt) / 0.3, 0, 1), hgt = Math.sin(Math.PI * jp) * 150;
  const ox = lerp(sw + 60, rx - 90, clamp(pa / 0.5, 0, 2.2)) - (pa > 0.5 ? (pa - 0.5) * 0 : 0);
  let tripped = !ok && pa > 0.52;
  if (started) {
    const obsX = lerp(sw + 70, -120, clamp(pa / 0.9, 0, 1));
    ctx.fillStyle = C.orange; ctx.beginPath(); ctx.roundRect(obsX - 40, gy - 78, 80, 78, 12); ctx.fill();
    ctx.fillStyle = C.yellow; ctx.fillRect(obsX - 40, gy - 50, 80, 14);
    void ox;
    // the chaser
    const chase = [250, 190, 70][Math.max(att, 0)] - (att === 2 ? prog(pa, 0.6, 1) * 90 : 0) + 18 * Math.sin(t * 9) - (tripped && att === 0 ? 0 : 0);
    const cy = gy - 62 + Math.sin(t * 14) * 5, rr = att === 2 && pa > 0.6 ? 62 * (1 - prog(pa, 0.6, 1) * 0.5) : 62;
    ctx.save(); ctx.translate(chase, cy); ctx.rotate(t * 3); ctx.fillStyle = C.red;
    for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate((i / 12) * TAU); ctx.beginPath(); ctx.moveTo(-18, -rr + 4); ctx.lineTo(0, -rr - 26); ctx.lineTo(18, -rr + 4); ctx.fill(); ctx.restore(); }
    ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(chase - 18, cy - 8, 13, 0, TAU); ctx.arc(chase + 20, cy - 8, 13, 0, TAU); ctx.fill();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(chase - 14, cy - 6, 6, 0, TAU); ctx.arc(chase + 24, cy - 6, 6, 0, TAU); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(chase - 34, cy - 28); ctx.lineTo(chase - 6, cy - 16); ctx.moveTo(chase + 36, cy - 28); ctx.lineTo(chase + 8, cy - 16); ctx.stroke();
    // the runner
    const fall = tripped ? prog(pa, 0.52, 0.7) : 0;
    runner(ctx, rx + fall * 80, gy - hgt + fall * 14, 1.25, t * 14, { rot: fall * 1.45, air: jp > 0 && jp < 1 ? 1 : 0 });
    if (tripped && pa > 0.52 && pa < 0.8) { ctx.font = font(64, 700, DISPLAY); ctx.textAlign = 'center'; ctx.fillStyle = C.yellow; ctx.fillText('OOPS', rx + 40, gy - 230 - prog(pa, 0.52, 0.8) * 30); }
    if (att === 2 && pa > 0.7) { const q = prog(pa, 0.7, 0.9); ctx.save(); ctx.translate(sw / 2, 130); ctx.scale(q, q); ctx.strokeStyle = C.green; ctx.lineWidth = 30; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(-18, 44); ctx.lineTo(62, -50); ctx.stroke(); ctx.restore(); }
    // HUD: TRY n + hearts
    ctx.fillStyle = 'rgba(14,6,48,0.7)'; pill(ctx, 24, 22, 190, 60); ctx.fill();
    ctx.font = font(34, 800, UI); ctx.fillStyle = C.white; ctx.textAlign = 'left'; ctx.letterSpacing = '2px'; ctx.fillText('TRY ' + (att + 1), 48, 63); ctx.letterSpacing = '0px';
    const lives = att === 0 && tripped ? 2 : att === 0 ? 3 : 2;
    for (let i = 0; i < 3; i++) heart(ctx, sw - 150 + i * 56, 55, 0.62, i < lives ? C.red : 'rgba(255,255,255,0.2)');
  }
  ctx.restore();
  // the controller
  const press = Math.max(0, Math.sin(t * 9)) > 0.7 ? 1 : 0;
  brainy(ctx, CX - 140, 1322, 0.74, { mood: tripOrHappy(t, a1, D), look: [0, -0.8], blink: blinkAt(t, 7), armL: 40, armR: 40, sq: [1, 1 + 0.02 * pulse(u)], t });
  gamepad(ctx, CX - 140, 1214, 1.0, press);
  sparkles(ctx, sx + sw / 2, sy + 160, t, a1 + 2.55 * D + 0.4, 220, 8);
}
const tripOrHappy = (t, a1, D) => (t > a1 + 0.55 * D && t < a1 + 0.95 * D ? 'worry' : t > a1 + 2.7 * D ? 'wow' : 'happy');

function sNoise(ctx, t, u) {
  titleBlock(ctx, 'IDEA 4', 'NOISE', Wd(7, 0), Wd(7, 6), t);
  const tx = 150, ty = 560, tw = 700, th = 520, sx = tx + 28, sy = ty + 28, sw = tw - 56, sh = th - 56;
  ctx.strokeStyle = C.lilac; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(CX, ty + 4); ctx.lineTo(CX - 90, ty - 100); ctx.moveTo(CX, ty + 4); ctx.lineTo(CX + 100, ty - 90); ctx.stroke();
  ctx.fillStyle = C.pink; ctx.beginPath(); ctx.arc(CX - 90, ty - 104, 11, 0, TAU); ctx.arc(CX + 100, ty - 94, 11, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0e0630'; ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 56); ctx.fill();
  ctx.fillStyle = C.panelLt; ctx.beginPath(); ctx.roundRect(CX - 120, ty + th - 4, 70, 36, 10); ctx.roundRect(CX + 50, ty + th - 4, 70, 36, 10); ctx.fill();
  const T0 = Wd(7, 11), p = prog(t, T0, T0 + 1.9), crisp = E.inOutSine(prog(t, T0 + 1.9, T0 + 2.4));
  const cw = sw / SCOLS, ch = sh / SROWS, fr = Math.floor(t * 18);
  ctx.save(); ctx.translate(sx, sy); ctx.beginPath(); ctx.roundRect(0, 0, sw, sh, 34); ctx.clip();
  for (let r = 0; r < SROWS; r++) for (let c = 0; c < SCOLS; c++) {
    const i = r * SCOLS + c;
    if (STORY && p * 1.25 > hash01(i, 9)) ctx.fillStyle = STORY[i];
    else { const g = 70 + hash01(i + fr * 997, 4) * 170; ctx.fillStyle = `rgb(${(g * 0.82) | 0},${(g * 0.74) | 0},${g | 0})`; }
    ctx.fillRect(c * cw, r * ch, cw + 0.6, ch + 0.6);
  }
  if (crisp > 0) { ctx.globalAlpha = crisp; storyPicture(ctx, sw, sh); ctx.globalAlpha = 1; }
  ctx.restore();
  const fl = 0.07 + 0.05 * Math.sin(t * 20);
  ctx.fillStyle = `rgba(255,255,255,${(1 - p) * fl})`; ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, 34); ctx.fill();
  brainy(ctx, CX, 1322, 0.74, { mood: crisp > 0.5 ? 'wow' : 'think', look: [0, -0.8], blink: blinkAt(t, 9), armR: crisp > 0.5 ? 150 : undefined, sq: [1, 1 + 0.02 * pulse(u)], t });
  sparkles(ctx, CX, ty + th / 2, t, T0 + 2.0, 280, 8);
}

function sBody(ctx, t, u) {
  titleBlock(ctx, 'REM SLEEP', 'PARALYZED', Wd(8, 0), Wd(8, 4) - 0.1, t, 108);
  const bx = 270, bY = 965;
  // the sleeper in bed
  ctx.fillStyle = C.panelLt; ctx.beginPath(); ctx.roundRect(110, 1225, 780, 80, 24); ctx.fill();
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.roundRect(150, 1100, 210, 100, 40); ctx.fill();
  ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(255, 1150, 62, 0, TAU); ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(232, 1146, 10, 0.2 * Math.PI, 0.8 * Math.PI); ctx.moveTo(296, 1146); ctx.arc(276, 1146, 10, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  ctx.fillStyle = C.blue; ctx.beginPath(); ctx.roundRect(300, 1110, 580, 130, 44); ctx.fill();
  ctx.fillStyle = '#6f8bff'; for (let i = 0; i < 4; i++) ctx.fillRect(390 + i * 130, 1110, 26, 130);
  const br = Math.sin(t * 2.3) * 4; ctx.save(); ctx.translate(0, br); ctx.restore();
  // Brainy above the head, eyes darting (REM)
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.roundRect(bx - 130, bY - 12, 260, 34, 17); ctx.fill();
  brainy(ctx, bx, bY - 6, 0.6, { mood: 'wow', look: [Math.sin(t * 17) * 1.0, Math.sin(t * 11) * 0.3], breath: Math.sin(t * 3), t });
  // the dream bubble with a sprinter
  thoughtBubble(ctx, 640, 760, 250, 190, bx + 60, bY - 200, 1);
  ctx.save(); blobPath(ctx, 640, 760, 244, 184, 8, 0.05, 0.3); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(380, 560, 520, 400);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 6; for (let i = 0; i < 7; i++) { const x = (((i * 90 - t * 300) % 630) + 630) % 630 + 330; ctx.beginPath(); ctx.moveTo(x, 880); ctx.lineTo(x - 50, 960); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(380, 872, 520, 8);
  runner(ctx, 640, 872 - Math.abs(Math.sin(t * 13)) * 16, 1.1, t * 16);
  ctx.restore();
  // the nerve signal, stopped at the neck
  const lockX = 480, ny = 1062;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 12;
  ctx.strokeStyle = C.cyan; ctx.beginPath(); ctx.moveTo(bx + 30, bY + 20); ctx.lineTo(bx + 30, ny); ctx.lineTo(lockX, ny); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.setLineDash([2, 24]); ctx.beginPath(); ctx.moveTo(lockX + 30, ny); ctx.lineTo(860, ny); ctx.stroke(); ctx.setLineDash([]);
  const tp = Wd(8, 2), seg1 = ny - (bY + 20), plen = seg1 + (lockX - bx - 30);
  for (let i = 0; i < 3; i++) {
    if (t < tp) break;
    const q = ((t - tp) * 0.9 + i / 3) % 1, s = q * plen;
    const x = s < seg1 ? bx + 30 : bx + 30 + (s - seg1), y = s < seg1 ? bY + 20 + s : ny;
    ctx.fillStyle = '#d8f6ff'; ctx.beginPath(); ctx.arc(x, y, 14, 0, TAU); ctx.fill();
    if (q > 0.96) { star4(ctx, lockX, ny, 40, t * 8, C.red); }
  }
  const lk = sp(t, Wd(8, 4), SPRING.bouncy);
  if (lk > 0.01) {
    const shake = Math.max(0, 1 - (t - Wd(8, 4)) * 2.5) * 6 * Math.sin(t * 70);
    padlock(ctx, lockX + 6 + shake, ny - 10, 1.1 * lk, 0, C.red);
  }
  const kk = sp(t, Wd(8, 4) + 0.2, SPRING.snappy);
  if (kk > 0.01) { ctx.save(); ctx.translate(690, 1065); ctx.scale(kk, kk); ctx.font = font(34, 800, UI); ctx.letterSpacing = '3px'; const w = 224; pill(ctx, -w / 2, -30, w, 60); ctx.fillStyle = C.red; ctx.fill(); ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.fillText('BODY: OFF', 2, 12); ctx.letterSpacing = '0px'; ctx.restore(); }
}

function sGone(ctx, t, u) {
  const tg = Wd(9, 3), tClock = Wd(9, 6);
  // the sun comes up
  const sunY = lerp(1000, 560, E.outCubic(prog(t, 37.4, 39.6)));
  iconSun(ctx, 790, sunY, 90, t);
  // the dream bubble dissolves into pixels
  const bw = 640, bh = 490, bx0 = CX - bw / 2, by0 = 560;
  const kb = sp(t, -0.4, SPRING.gentle);
  thoughtBubble(ctx, CX, by0 + bh / 2, 340 * kb, 280 * kb, CX - 200, by0 + bh + 150, kb);
  ctx.save(); blobPath(ctx, CX, by0 + bh / 2, 332 * kb, 272 * kb, 8, 0.05, 0.3); ctx.clip();
  const cw = bw / SCOLS, chh = bh / SROWS;
  for (let r = 0; r < SROWS; r++) for (let c = 0; c < SCOLS; c++) {
    const i = r * SCOLS + c, q = clamp((t - tg - hash01(i, 6) * 0.9 - (1 - r / SROWS) * 0.4) / 0.9, 0, 1);
    if (q >= 1 || !STORY) continue;
    ctx.globalAlpha = 1 - q; ctx.fillStyle = STORY[i];
    const s = 1 - q * 0.6;
    ctx.fillRect(bx0 + c * cw + (hash01(i, 7) - 0.5) * 120 * q * q, by0 + r * chh - 260 * q * q, cw * s + 0.6, chh * s + 0.6);
  }
  ctx.globalAlpha = 1; ctx.restore();
  // GONE
  const gk = sp(t, tg, SPRING.bouncy);
  if (gk > 0.01) extruded(ctx, 'GONE', CX, 400, 190, C.white, C.pinkDk, 12, gk, (1 - gk) * -0.1);
  // an alarm clock, ringing
  const ring = t > tClock ? Math.sin(t * 70) * 0.06 : 0, ck = sp(t, -0.2, SPRING.gentle);
  ctx.save(); ctx.translate(790, 1170); ctx.scale(ck, ck); ctx.rotate(ring);
  ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(-52, -88, 28, Math.PI, 0); ctx.arc(52, -88, 28, Math.PI, 0); ctx.fill();
  ctx.fillStyle = C.ink; ctx.fillRect(-14, 70, 28, 26);
  ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(0, 0, 84, 0, TAU); ctx.fill();
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(0, 0, 66, 0, TAU); ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -44); ctx.moveTo(0, 0); ctx.lineTo(30, 14); ctx.stroke();
  if (ring) { ctx.strokeStyle = C.yellow; ctx.lineWidth = 7; for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(s * 100, -30, 30 + i * 22, s > 0 ? -0.8 : Math.PI - 0.8, s > 0 ? 0.8 : Math.PI + 0.8); ctx.stroke(); } }
  ctx.restore();
  // Brainy wakes up
  const rub = t > Wd(9, 6) ? 1 : 0;
  brainy(ctx, 220, 1300, 0.82, { mood: 'tired', look: [0.3, 0.2], blink: 0.15 + 0.15 * Math.sin(t * 3), armL: rub ? 150 + 12 * Math.sin(t * 12) : 30, armR: rub ? 150 - 12 * Math.sin(t * 12) : 30, sq: [1, 1 + 0.02 * pulse(u)], t });
}

function sEnd(ctx, t, u, ls) {
  const lines = ['Do you remember', 'your last dream?'];
  const t0 = Wd(10, 1);
  lines.forEach((s, i) => {
    const k = sp(t, t0 + i * 0.42, SPRING.bouncy); if (k < 0.01) return;
    ctx.save(); ctx.translate(CX, 380 + i * 118); ctx.scale(k, k); ctx.rotate((1 - k) * (i ? 0.1 : -0.1));
    ctx.font = font(104, 700, DISPLAY); ctx.textAlign = 'center'; ctx.fillStyle = C.pinkDk; ctx.fillText(s, 5, 9); ctx.fillStyle = C.white; ctx.fillText(s, 0, 0); ctx.restore();
  });
  // a thought bubble with a question mark
  const qk = sp(t, Wd(10, 3), SPRING.bouncy);
  thoughtBubble(ctx, CX + 190, 760, 190 * qk, 150 * qk, CX + 60, 880, qk);
  if (qk > 0.02) extruded(ctx, '?', CX + 190, 840, 250, C.yellow, C.yellowDk, 10, qk, Math.sin(t * 3) * 0.08);
  const wave = t > 42.5 ? Math.sin(t * 8) * 18 : 0;
  brainy(ctx, CX - 20, 1290, 1.0, { mood: 'happy', look: [0.2, -0.5], blink: blinkAt(t, 11), rot: Math.sin(t * 1.6) * 0.05, armR: t > 42.5 ? 140 + wave : undefined, sq: [1, 1 + 0.025 * pulse(u)], breath: Math.sin(t * 2), t });
}

// ------------------------------------------------------------------ captions: three words at a time, current word gold
const CAPS = (() => {
  const out = [];
  for (const ln of TIM) {
    const chunks = []; let cur = [];
    const flush = () => { if (cur.length) chunks.push(cur); cur = []; };
    for (const w of ln.words) {
      cur.push(w);
      const chars = cur.map((x) => x.w).join(' ').length;
      if (cur.length >= 3 || chars >= 16 || (/[.,:;?!]$/.test(w.w) && cur.length >= 2)) flush();
    }
    flush();
    if (chunks.length > 1 && chunks[chunks.length - 1].length === 1 && chunks[chunks.length - 2].length <= 2) chunks[chunks.length - 2].push(...chunks.pop());
    chunks.forEach((words, i) => out.push({ ln, words, t0: words[0].s - 0.04, t1: i < chunks.length - 1 ? chunks[i + 1][0].s - 0.04 : ln.end + 0.4 }));
  }
  return out;
})();

function captions(ctx, t) {
  const c = CAPS.find((x) => t >= x.t0 && t < x.t1);
  if (!c) return;
  const words = c.words.map((w) => w.w.toUpperCase().replace(/[.,:;]+$/, ''));
  let size = 84; ctx.font = font(size, 800, UI); ctx.letterSpacing = '2px';
  const space = size * 0.42;
  const widths = () => words.map((w) => ctx.measureText(w).width);
  let ws = widths(), total = ws.reduce((a, b) => a + b, 0) + space * (words.length - 1);
  if (total > 850) { size = Math.floor((size * 850) / total); ctx.font = font(size, 800, UI); ws = widths(); total = ws.reduce((a, b) => a + b, 0) + size * 0.42 * (words.length - 1); }
  let x = CX - total / 2; const y = 1425;
  ctx.textAlign = 'left'; ctx.lineJoin = 'round';
  words.forEach((w, i) => {
    const ws0 = c.words[i].s;
    if (t >= ws0) {
      const nxt = c.words[i + 1], cur = !nxt || t < nxt.s;
      const k = sp(t, ws0, SPRING.bouncy), sc = lerp(0.82, 1, Math.min(k, 1.15)) + (cur ? 0.06 : 0);
      ctx.save(); ctx.translate(x + ws[i] / 2, y); ctx.scale(sc, sc);
      ctx.lineWidth = 16; ctx.strokeStyle = C.ink; ctx.strokeText(w, -ws[i] / 2, 0);
      ctx.fillStyle = cur ? C.yellow : C.white; ctx.fillText(w, -ws[i] / 2, 0);
      ctx.restore();
    }
    x += ws[i] + size * 0.42;
  });
  ctx.letterSpacing = '0px';
}

// ------------------------------------------------------------------ hits (every one gets a sound from sfx.mjs)
const HITS = [
  [bt(0.0), 'hook: the 6', 'sub', { len: 0.9 }],
  [bt(Wd(1, 4)), 'YEARS', 'pop', { pitch: 'D5' }],
  ...SC.slice(1).map((s, i) => [bt(s.t0 - 0.24), `push to scene ${i + 2}`, 'whoosh', { len: 0.36, from: 500, to: 2600, pan: i % 2 ? -0.3 : 0.3 }]),
  [bt(Wd(2, 3)), '? one', 'pop', { pitch: 'A5' }], [bt(Wd(2, 4)), '? two', 'pop', { pitch: 'D6' }], [bt(Wd(2, 5)), '? three', 'pop', { pitch: 'F#5' }],
  [bt(Wd(3, 0)), 'idea 1 chip', 'pop', { pitch: 'F#5' }], [bt(Wd(3, 2)), 'MEMORY', 'thud', { pitch: 'D3', to: 'A2' }],
  ...[0, 1, 2, 3].map((i) => [bt(Wd(3, 3) + i * 0.16), `card ${i + 1}`, 'tick']),
  [bt(Wd(3, 8)), 'replay bar', 'blip', { pitch: 'A5' }],
  [bt(Wd(3, 12) + 0.8), 'filed 1', 'thud', { pitch: 'E3', to: 'B2' }], [bt(Wd(3, 12) + 1.5), 'filed 2', 'bell', { pitch: 'A5' }],
  [bt(Wd(4, 0)), 'PROOF chip', 'pop', { pitch: 'F#5' }], [bt(Wd(4, 0) + 1.9), 'rat arrives', 'tick'],
  [bt(Wd(4, 5)), 'night: ghost run', 'blip', { pitch: 'E5' }],
  [bt(Wd(5, 0)), 'idea 2 chip', 'pop', { pitch: 'F#5' }], [bt(Wd(5, 2) + 0.15), 'tangle', 'boing', { pitch: 'D4', to: 'A4' }],
  [bt(Wd(5, 12) + 0.15), 'calm', 'bell', { pitch: 'D6' }],
  [bt(Wd(6, 0)), 'idea 3 chip', 'pop', { pitch: 'F#5' }], [bt(Wd(6, 2)), 'PRACTICE', 'thud', { pitch: 'D3', to: 'A2' }],
  [bt(Wd(7, 0)), 'idea 4 chip', 'pop', { pitch: 'F#5' }], [bt(Wd(7, 11) + 2.0), 'static becomes a story', 'bell', { pitch: 'F#6' }],
  [bt(Wd(8, 0)), 'REM chip', 'pop', { pitch: 'F#5' }], [bt(Wd(8, 4)), 'lock', 'thud', { pitch: 'C3', to: 'G2', gain: 0.5 }],
  [bt(Wd(9, 3)), 'GONE', 'swell', {}], [bt(Wd(9, 6)), 'alarm', 'blip', { pitch: 'B5' }],
  [bt(Wd(10, 1)), 'question text', 'pop', { pitch: 'A5' }],
].sort((a, b) => a[0] - b[0]);

// ------------------------------------------------------------------ film
const SCENES = [sHook, sQuestion, sMemory, sRats, sEmotion, sPractice, sNoise, sBody, sGone, sEnd];

M.film({
  fonts: [font(100, 700, DISPLAY), font(40, 800, UI)],
  hits: HITS,
  init,
  samples: (t) => 8,
  draw(ctx, u, t) {
    bg(ctx, t, u);
    let k = SC.length - 1;
    while (k > 0 && t < SC[k].t0 - PUSH_A) k--;
    const drawScene = (i, dx) => { ctx.save(); ctx.translate(dx, Math.sin(t * 0.8 + i) * 4); SCENES[i](ctx, t, u, t - SC[i].t0); ctx.restore(); };
    if (k > 0 && t < SC[k].t0 - PUSH_B) {
      const e = unit(SC[k].t0 - PUSH_A, SC[k].t0 - PUSH_B, t);
      drawScene(k - 1, -W * e); drawScene(k, W * (1 - e));
    } else drawScene(k, 0);
    // soft vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, 'rgba(10,4,30,0)'); vg.addColorStop(1, 'rgba(10,4,30,0.4)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    captions(ctx, t);
  },
});
