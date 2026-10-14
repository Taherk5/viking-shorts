// Why can't you tickle yourself?  Question Short #5 (flat vector, Brainy hosts). Pure function of time.
import * as M from '../shared/motion.js';
import * as A from '../shared/art.js';
import * as K from '../shared/kit.js';

const { E, TAU, SPRING, clamp, lerp, prog, font, mix } = M;
const { C, sp, star4, sparkles, brainy, face, thoughtBubble } = A;
const { CX, DISPLAY, UI, pulse, blinkAt, unit, titleBlock, extruded, chip, question } = K;

const { TIM, Ln, Wd, bt } = await K.timing();
// one scene per line, except lines 6 + 7 (the robot) which share one continuous shot
const SC = [0, Ln(2).start, Ln(3).start, Ln(4).start, Ln(5).start, Ln(6).start, Ln(8).start];

function feather(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.moveTo(0, -150); ctx.quadraticCurveTo(70, -60, 18, 60); ctx.lineTo(-18, 60); ctx.quadraticCurveTo(-70, -60, 0, -150); ctx.fill();
  ctx.strokeStyle = C.lilac; ctx.lineWidth = 5; for (let i = 0; i < 6; i++) { const y0 = -110 + i * 28; ctx.beginPath(); ctx.moveTo(0, y0 + 10); ctx.lineTo(-38 + i * 3, y0 - 10); ctx.moveTo(0, y0 + 10); ctx.lineTo(38 - i * 3, y0 - 10); ctx.stroke(); }
  ctx.strokeStyle = C.pinkDk; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -140); ctx.lineTo(0, 120); ctx.stroke();
  ctx.restore();
}

function hand(ctx, x, y, s, rot = 0, o = {}) {
  const { col = C.skin, dashed = false } = o;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.lineCap = 'round';
  const shape = () => {
    ctx.beginPath(); ctx.roundRect(-60, -40, 120, 120, 40);
    for (let i = 0; i < 4; i++) ctx.roundRect(-58 + i * 30, -120 - (i === 1 || i === 2 ? 14 : 0), 26, 100, 13);
    ctx.roundRect(52, -10, 70, 28, 14);
  };
  if (dashed) { ctx.setLineDash([10, 10]); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 5; shape(); ctx.stroke(); ctx.setLineDash([]); }
  else { ctx.fillStyle = col; shape(); ctx.fill(); }
  ctx.restore();
}

function meter(ctx, x, y, h, level, label, k = 1) {
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = C.panel; ctx.beginPath(); ctx.roundRect(-55, -h - 20, 110, h + 40, 30); ctx.fill();
  const n = 10;
  for (let i = 0; i < n; i++) {
    const on = i < Math.round(level * n);
    ctx.fillStyle = on ? mix(C.green, C.red, i / (n - 1)) : 'rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.roundRect(-38, -14 - (i + 1) * (h / n) + 6, 76, h / n - 8, 8); ctx.fill();
  }
  ctx.font = font(30, 800, UI); ctx.letterSpacing = '3px'; ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.fillText(label, 0, 62); ctx.letterSpacing = '0px';
  ctx.restore();
}

function haha(ctx, x, y, t, k) {
  if (k <= 0.01) return;
  ['HA', 'HA', 'HA'].forEach((s, i) => {
    const kk = sp(t, 0, SPRING.bouncy);
    ctx.save(); ctx.translate(x + i * 70, y - i * 50 + Math.sin(t * 9 + i) * 8); ctx.rotate(-0.2 + i * 0.15); ctx.scale(k * kk, k * kk);
    ctx.font = font(64, 700, DISPLAY); ctx.textAlign = 'center'; ctx.fillStyle = [C.yellow, C.cyan, C.pinkLt][i]; ctx.fillText(s, 0, 0); ctx.restore();
  });
}

// ------------------------------------------------------------------ scenes
function s1(ctx, t, u) {
  const self = t > Wd(1, 4) - 0.1;
  extruded(ctx, 'TICKLE', CX, 500, 190, C.yellow, C.yellowDk, 16, sp(t, -0.3, SPRING.bouncy), Math.sin(t * 2.5) * 0.04);
  const bx = CX - 40, by = 1310, s = 1.15;
  const wig = Math.sin(t * 22) * 0.25;
  brainy(ctx, bx, by, s, { mood: self ? 'flat' : 'laugh', look: self ? [0.6, 0.3] : [0, 0], blink: self ? 0.35 : 0, armR: self ? 120 : 30, armL: 30, sq: self ? [1, 1] : [1 + 0.03 * Math.sin(t * 30), 1 - 0.03 * Math.sin(t * 30)], t });
  if (!self) { feather(ctx, bx + 260, by - 170, 1.0, -0.9 + wig); haha(ctx, bx - 300, by - 420, t, 1); }
  else { feather(ctx, bx + 230, by - 260, 0.9, -0.5 + Math.sin(t * 22) * 0.2); chip(ctx, 'NOTHING', bx - 230, by - 380, sp(t, Wd(1, 4), SPRING.bouncy), C.white, C.ink, 40); }
}

function s2(ctx, t, u, ls) {
  titleBlock(ctx, 'THE REASON', 'NO SURPRISE', Wd(2, 0), Wd(2, 3), t, 118);
  const bx = 300, by = 1280;
  brainy(ctx, bx, by, 0.95, { mood: 'think', look: [1, -0.2], blink: blinkAt(t, 2), sq: [1, 1 + 0.02 * pulse(u)], t });
  // the feather on its way, and Brainy's dashed prediction already ahead of it
  const fx = lerp(980, 640, unit(SC[1], SC[1] + 2.2, t)), fy = 900 + Math.sin(t * 2) * 30;
  const pk = sp(t, Wd(2, 4), SPRING.snappy);
  if (pk > 0.01) {
    ctx.save(); ctx.globalAlpha = Math.min(1, pk); ctx.setLineDash([14, 14]); ctx.strokeStyle = C.cyan; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(fx - 60, fy); ctx.quadraticCurveTo((fx + bx) / 2, fy - 160, bx + 120, by - 220); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    chip(ctx, 'PREDICTED', 650, 700, pk, C.cyan, C.ink, 32);
  }
  feather(ctx, fx, fy, 0.9, -1.3 + Math.sin(t * 5) * 0.1);
}

function s3(ctx, t, u) {
  titleBlock(ctx, 'EVERY MOVE', 'PREDICTED', Wd(3, 0), Wd(3, 6), t, 118);
  const p = Math.sin(t * 1.8);
  const hx = 640 + p * 120, hy = 980 - Math.abs(p) * 60;
  const lead = sp(t, Wd(3, 6), SPRING.snappy);
  if (lead > 0.01) hand(ctx, 640 + Math.sin((t + 0.25) * 1.8) * 120, 980 - Math.abs(Math.sin((t + 0.25) * 1.8)) * 60, 1.25, Math.sin((t + 0.25) * 1.8) * 0.2, { dashed: true });
  hand(ctx, hx, hy, 1.25, p * 0.2);
  const bx = 230, by = 1300;
  brainy(ctx, bx, by, 0.8, { mood: 'think', look: [1, -0.5], blink: blinkAt(t, 3), sq: [1, 1 + 0.02 * pulse(u)], t });
  const qk = sp(t, Wd(3, 9), SPRING.bouncy);
  thoughtBubble(ctx, 250, 700, 150 * qk, 110 * qk, 240, 1000, qk);
  if (qk > 0.05) { ctx.save(); ctx.translate(250, 700); ctx.scale(qk, qk); ctx.strokeStyle = C.yellow; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); for (let i = 0; i <= 40; i++) { const x = -90 + i * 4.5, y = Math.sin(i * 0.6 + t * 6) * 22; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); ctx.restore(); }
}

function s4(ctx, t, u) {
  titleBlock(ctx, 'THE PART', 'CEREBELLUM', Wd(4, 0), Wd(4, 3), t, 118);
  const bx = 360, by = 1260, s = 1.2;
  brainy(ctx, bx, by, s, { mood: 'happy', look: [0.6, 0], blink: blinkAt(t, 4), sq: [1, 1 + 0.02 * pulse(u)], t });
  // the cerebellum: back-bottom of the brain, glowing
  const gk = sp(t, Wd(4, 3), SPRING.bouncy), gx = bx + 95 * s, gy = by - 92 * s;
  if (gk > 0.01) {
    ctx.save(); ctx.translate(gx, gy); ctx.scale(gk, gk);
    ctx.fillStyle = 'rgba(46,200,255,0.35)'; ctx.beginPath(); ctx.arc(0, 0, 80 + 8 * pulse(u), 0, TAU); ctx.fill();
    ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.ellipse(0, 0, 50, 36, 0.3, 0, TAU); ctx.fill();
    ctx.strokeStyle = C.cyanDk; ctx.lineWidth = 5; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-36, i * 12); ctx.quadraticCurveTo(0, i * 12 - 10, 36, i * 12); ctx.stroke(); }
    ctx.restore();
  }
  // the feeling, turned down
  const down = unit(Wd(4, 10), Wd(4, 10) + 1.2, t);
  meter(ctx, 790, 1130, 420, lerp(0.9, 0.2, down), 'FEELING', sp(t, Wd(4, 6), SPRING.bouncy));
  if (gk > 0.5) { ctx.save(); ctx.globalAlpha = Math.min(1, sp(t, Wd(4, 6), SPRING.snappy)); ctx.strokeStyle = C.cyan; ctx.lineWidth = 8; ctx.setLineDash([12, 14]); ctx.lineDashOffset = -t * 80;
    ctx.beginPath(); ctx.moveTo(gx + 60, gy); ctx.quadraticCurveTo(650, gy - 200, 730, 820); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
}

function s5(ctx, t, u) {
  titleBlock(ctx, 'THE RULE', 'SURPRISE = TICKLE', Wd(5, 0), Wd(5, 2), t, 100);
  const tA = Wd(5, 0) + 0.2, tB = Wd(5, 6);
  const panels = [[270, 'SURPRISE', tA, 'laugh', C.yellow], [740, 'PREDICTED', tB, 'flat', C.lilac]];
  panels.forEach(([x, lab, t0, mood, col], i) => {
    const k = sp(t, t0, SPRING.bouncy); if (k < 0.01) return;
    ctx.save(); ctx.translate(x, 930); ctx.scale(k, k);
    ctx.fillStyle = C.panel; ctx.beginPath(); ctx.roundRect(-200, -280, 400, 560, 40); ctx.fill();
    face(ctx, 0, -40, 120, { mood, skin: i ? '#c98b5e' : C.skin, hair: i ? '#1a1a1a' : '#c0392b' });
    ctx.restore();
    chip(ctx, lab, x, 1150, k, col, C.ink, 34);
    if (!i) haha(ctx, x - 120, 700, t, k);
  });
}

function s6(ctx, t, u) {
  const tDelay = Ln(7).start + 0.1;
  const delayed = t > tDelay;
  titleBlock(ctx, delayed ? 'ADD A DELAY' : 'THE EXPERIMENT', 'TICKLE ROBOT', Wd(6, 0), Wd(6, 5), t, 118);
  // robot arm on the right, brushing a foam pad across an open palm
  const cyc = Math.sin(t * 5), ax = 760, ay = 1180;
  ctx.fillStyle = C.panelLt; ctx.beginPath(); ctx.roundRect(ax - 90, ay - 30, 180, 80, 20); ctx.fill();
  const j1x = ax, j1y = ay - 30, a1 = -1.9 + cyc * 0.12, l1 = 230, j2x = j1x + Math.cos(a1) * l1, j2y = j1y + Math.sin(a1) * l1;
  const a2 = a1 - 1.3 + cyc * 0.18, l2 = 200, tx = j2x + Math.cos(a2) * l2, ty = j2y + Math.sin(a2) * l2;
  ctx.strokeStyle = '#c9c4e8'; ctx.lineCap = 'round'; ctx.lineWidth = 48; ctx.beginPath(); ctx.moveTo(j1x, j1y); ctx.lineTo(j2x, j2y); ctx.lineTo(tx, ty); ctx.stroke();
  ctx.fillStyle = C.cyan; for (const [x, y] of [[j1x, j1y], [j2x, j2y]]) { ctx.beginPath(); ctx.arc(x, y, 30, 0, TAU); ctx.fill(); }
  ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.roundRect(tx - 40, ty - 22, 80, 44, 16); ctx.fill();
  // the palm being brushed + the hand moving the controls
  hand(ctx, tx - 40, ty + 120, 1.0, Math.PI);
  hand(ctx, 230, 1180, 0.85, -0.2 + cyc * 0.15);
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.roundRect(170, 1210, 130, 60, 18); ctx.fill();
  // tickle level, low until the delay is switched on
  const lvl = delayed ? lerp(0.2, 0.85, unit(tDelay + 0.6, tDelay + 2.4, t)) : 0.2;
  meter(ctx, 220, 920, 300, lvl + 0.03 * Math.sin(t * 12), 'TICKLE', sp(t, Wd(6, 8), SPRING.bouncy));
  if (delayed) chip(ctx, 'DELAY: 0.2 s', CX + 40, 620, sp(t, tDelay + 0.2, SPRING.bouncy), C.yellow, C.ink, 38);
  if (lvl > 0.6) haha(ctx, 380, 720, t, prog(lvl, 0.6, 0.8));
}

function s7(ctx, t, u) {
  question(ctx, ['Try it right now.', 'Nothing, right?'], Wd(8, 0), t, 420, 104);
  const bx = CX - 30, by = 1300;
  brainy(ctx, bx, by, 1.1, { mood: t > Wd(8, 4) + 0.3 ? 'happy' : 'flat', look: [0.5, 0.3], blink: blinkAt(t, 7), armR: 125, rot: Math.sin(t * 1.6) * 0.04, sq: [1, 1 + 0.025 * pulse(u)], t });
  feather(ctx, bx + 220, by - 250, 0.95, -0.5 + Math.sin(t * 20) * 0.2);
}

const HITS = [
  [bt(0), 'hook', 'sub', { len: 0.9 }],
  ...K.pushHits(SC, bt),
  [bt(Wd(1, 4)), 'self tickle: nothing', 'thud', { pitch: 'D3', to: 'A2' }],
  [bt(Wd(2, 3)), 'NO SURPRISE', 'thud', { pitch: 'D3', to: 'A2' }], [bt(Wd(2, 4)), 'predicted path', 'blip', { pitch: 'A5' }],
  [bt(Wd(3, 6)), 'ghost hand', 'blip', { pitch: 'E5' }], [bt(Wd(3, 9)), 'bubble', 'pop', { pitch: 'F#5' }],
  [bt(Wd(4, 3)), 'cerebellum glows', 'bell', { pitch: 'D6' }], [bt(Wd(4, 6)), 'meter', 'pop', { pitch: 'A5' }], [bt(Wd(4, 10)), 'turned down', 'whoosh', { len: 0.5, from: 2400, to: 400 }],
  [bt(Wd(5, 2)), 'SURPRISE = TICKLE', 'thud', { pitch: 'D3', to: 'A2' }], [bt(Wd(5, 6)), 'predicted panel', 'pop', { pitch: 'E5' }],
  [bt(Wd(6, 5)), 'TICKLE ROBOT', 'thud', { pitch: 'D3', to: 'A2' }], [bt(Ln(7).start + 0.3), 'delay chip', 'pop', { pitch: 'A5' }], [bt(Ln(7).start + 2.0), 'tickles!', 'boing', { pitch: 'D4', to: 'A4' }],
  [bt(Wd(8, 0)), 'question', 'pop', { pitch: 'A5' }],
].sort((a, b) => a[0] - b[0]);

K.run({ TIM, SC, SCENES: [s1, s2, s3, s4, s5, s6, s7], HITS, samples: 5 });
