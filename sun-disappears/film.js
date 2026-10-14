// What if the Sun disappeared?  Flat-vector explainer (Brainy hosts), 9:16, pure function of time.
// Timing follows assets/vo_timing.json (voice, word by word) on the 75 bpm grid in beats.json.
import * as M from './lib/motion.js';
import * as A from './art.js';

const { W, H, FORMAT, E, TAU, SPRING, clamp, lerp, prog, font, hash01, mix, wobble } = M;
const { C, sp, pill, blobPath, star4, heart, poof, sparkles, brainy, zzz, thoughtBubble } = A;

const TIM = await (await fetch('assets/vo_timing.json')).json();
const GR = await (await fetch('beats.json')).json();
const bt = (s) => (s - GR.offset) / GR.period;
const Ln = (n) => TIM[n - 1];
const Wd = (n, i) => Ln(n).words[Math.min(i, Ln(n).words.length - 1)].s;
const CX = FORMAT.safe.x + FORMAT.safe.w / 2;
const DISPLAY = 'Display', UI = 'UI';

const pulse = (u) => Math.exp(-(((u % 1) + 1) % 1) * 6);
const blinkAt = (t, seed = 0) => { const p = (t * 0.37 + seed * 0.31) % 1; return p < 0.05 ? Math.sin((Math.PI * p) / 0.05) : 0; };
const unit = (a, b, t) => E.inOutCubic(prog(t, a, b));

// scenes: hook, stopwatch, orbit (lines 3+4, one continuous shot), cold, food chain, vents, drift, end
const SC = [0, 2, 3, 5, 6, 7, 8, 9].map((n, i) => ({ t0: i === 0 ? 0 : Ln(n).start }));
const PUSH_A = 0.46, PUSH_B = 0.04;
const T_VANISH = Wd(1, 5);                 // "disappeared"
const T_DARK = Wd(4, 4);                   // "black": the dark front and the end of gravity reach Earth
const darkAt = (t) => E.inOutSine(prog(t, T_DARK - 0.15, T_DARK + 0.45));

// ------------------------------------------------------------------ props
function sunFace(ctx, x, y, r, t, k = 1) {
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  const g = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 1.9); g.addColorStop(0, 'rgba(255,201,60,0.45)'); g.addColorStop(1, 'rgba(255,201,60,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 1.9, 0, TAU); ctx.fill();
  ctx.save(); ctx.rotate(t * 0.35); ctx.fillStyle = C.yellowDk;
  for (let i = 0; i < 14; i++) { ctx.save(); ctx.rotate((i / 14) * TAU); ctx.beginPath(); ctx.moveTo(-r * 0.16, -r * 1.02); ctx.lineTo(0, -r * (1.32 + 0.06 * Math.sin(t * 3 + i))); ctx.lineTo(r * 0.16, -r * 1.02); ctx.fill(); ctx.restore(); }
  ctx.restore();
  const cg = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r); cg.addColorStop(0, '#ffe680'); cg.addColorStop(1, C.yellow);
  ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.08, r * 0.07, r * 0.1, 0, 0, TAU); ctx.ellipse(r * 0.3, -r * 0.08, r * 0.07, r * 0.1, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = r * 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, r * 0.12, r * 0.25, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,80,0.45)'; ctx.beginPath(); ctx.ellipse(-r * 0.5, r * 0.18, r * 0.1, r * 0.06, 0, 0, TAU); ctx.ellipse(r * 0.5, r * 0.18, r * 0.1, r * 0.06, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

function ghostSun(ctx, x, y, r, a = 1) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 6; ctx.setLineDash([16, 16]);
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
}

const CONT = [[-0.35, -0.25, 0.42, 0.3, 1], [0.32, 0.18, 0.36, 0.42, 2], [-0.15, 0.55, 0.3, 0.18, 3], [0.45, -0.55, 0.22, 0.16, 4]];
function earth(ctx, x, y, r, t, o = {}) {
  const { ice = 0, shade = 0, spin = 0.25 } = o;
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = mix('#2e7bff', '#cfe9ff', ice * 0.85); ctx.fill();
  ctx.save(); ctx.clip();
  const off = ((t * spin) % 2) * 2 * r;
  for (const dx of [-2 * r, 0]) for (const [cx, cy, rx, ry, s] of CONT) {
    blobPath(ctx, cx * r + dx + off - r * 0.0, cy * r, rx * r, ry * r, 5, 0.12, s);
    ctx.fillStyle = mix(C.green, '#ffffff', ice * 0.7); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const [cx, cy, w] of [[-0.5, 0.1, 0.5], [0.2, -0.3, 0.4], [0.1, 0.75, 0.5]]) { ctx.beginPath(); ctx.roundRect(cx * r + ((off * 1.3) % (2 * r)) - r * 0.4, cy * r, w * r, r * 0.09, r * 0.05); ctx.fill(); }
  if (ice > 0) { ctx.fillStyle = `rgba(235,248,255,${0.75 * ice})`; ctx.beginPath(); ctx.arc(0, -r, r * (0.35 + 0.9 * ice), 0, TAU); ctx.arc(0, r, r * (0.35 + 0.9 * ice), 0, TAU); ctx.fill(); }
  ctx.fillStyle = `rgba(10,4,40,${0.18 + 0.45 * shade})`; ctx.beginPath(); ctx.arc(r * 0.35, r * 0.25, r * 1.05, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(-r * 0.45, -r * 0.5, r * 0.22, r * 0.1, -0.6, 0, TAU); ctx.fill();
  ctx.restore(); ctx.restore();
}

function stopwatch(ctx, x, y, r, frac, label, k = 1) {
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = C.panelLt; ctx.beginPath(); ctx.roundRect(-r * 0.16, -r * 1.3, r * 0.32, r * 0.22, r * 0.06); ctx.fill();
  ctx.fillRect(-r * 0.07, -r * 1.12, r * 0.14, r * 0.16);
  ctx.fillStyle = C.panelLt; ctx.beginPath(); ctx.arc(0, 0, r * 1.08, 0, TAU); ctx.fill();
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,95,162,0.22)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * 0.92, -Math.PI / 2, -Math.PI / 2 + frac * TAU); ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineCap = 'round';
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.lineWidth = i % 3 ? 5 : 9; ctx.beginPath(); ctx.moveTo(Math.sin(a) * r * 0.8, -Math.cos(a) * r * 0.8); ctx.lineTo(Math.sin(a) * r * 0.9, -Math.cos(a) * r * 0.9); ctx.stroke(); }
  const a = frac * TAU; ctx.strokeStyle = C.red; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a) * r * 0.78, -Math.cos(a) * r * 0.78); ctx.stroke();
  ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();
  if (label) { ctx.font = font(r * 0.4, 700, DISPLAY); ctx.textAlign = 'center'; ctx.fillStyle = C.ink; ctx.fillText(label, 0, r * 0.55); }
  ctx.restore();
}

function snowflake(ctx, x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.strokeStyle = '#e8f6ff'; ctx.lineWidth = Math.max(2, r * 0.18); ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) { ctx.rotate(TAU / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r); ctx.moveTo(0, -r * 0.55); ctx.lineTo(-r * 0.25, -r * 0.8); ctx.moveTo(0, -r * 0.55); ctx.lineTo(r * 0.25, -r * 0.8); ctx.stroke(); }
  ctx.restore();
}

function sunglasses(ctx, bx, by, s, dy = 0, rot = 0) {      // sits on Brainy's eyes (Brainy at bx,by, scale s)
  ctx.save(); ctx.translate(bx, by + (-160 + dy) * s); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.roundRect(-92, -30, 80, 58, 20); ctx.roundRect(12, -30, 80, 58, 20); ctx.fill();
  ctx.fillRect(-14, -18, 28, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-62, -12, 16, 7, -0.4, 0, TAU); ctx.ellipse(42, -12, 16, 7, -0.4, 0, TAU); ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ background (purple day, then the lights go out)
function bg(ctx, t, u) {
  const d = darkAt(t);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix(C.bgTop, '#05030f', d)); g.addColorStop(0.55, mix(C.bgMid, '#0b0626', d)); g.addColorStop(1, mix(C.bgBot, '#1a0b40', d));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(W / 2, H * 0.93, 30, W / 2, H * 0.93, 950);
  rg.addColorStop(0, `rgba(255,95,162,${0.3 * (1 - d * 0.6)})`); rg.addColorStop(1, 'rgba(255,95,162,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  const cols = [C.cyan, C.pink, C.yellow, C.lilac];
  for (let i = 0; i < 16; i++) {
    const x = hash01(i, 1) * W + Math.sin(t * 0.3 + i) * 30;
    const y = (((hash01(i, 2) * H - t * (8 + hash01(i, 3) * 14)) % H) + H) % H;
    ctx.globalAlpha = (0.05 + 0.05 * hash01(i, 5)) * (1 + 0.5 * pulse(u)) * (1 - d * 0.6);
    ctx.fillStyle = cols[i % 4]; ctx.beginPath(); ctx.arc(x, y, 36 + hash01(i, 4) * 90, 0, TAU); ctx.fill();
  }
  for (let i = 0; i < 80; i++) {
    const tw = 0.5 + 0.5 * Math.sin(t * (1 + hash01(i, 7) * 2) + i * 3);
    ctx.globalAlpha = (0.25 + 0.5 * tw) * (0.7 + 0.3 * d);
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
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  ctx.font = font(size, 700, DISPLAY); ctx.textAlign = 'center';
  ctx.fillStyle = side; for (let i = depth; i >= 1; i -= 2) ctx.fillText(str, i * 0.8, i);
  ctx.fillStyle = top; ctx.fillText(str, 0, 0);
  ctx.restore();
}

function chip(ctx, str, x, y, k, bgc = C.yellow, fg = C.ink, size = 36) {
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.font = font(size, 800, UI); ctx.letterSpacing = '3px';
  const w = ctx.measureText(str).width + 48; pill(ctx, -w / 2, -size * 0.95, w, size * 1.9); ctx.fillStyle = bgc; ctx.fill();
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.fillText(str, 2, size * 0.36); ctx.letterSpacing = '0px'; ctx.restore();
}

// ------------------------------------------------------------------ scenes
function sHook(ctx, t, u) {
  const gone = sp(t, T_VANISH, SPRING.snappy);
  const k = sp(t, -0.3, SPRING.bouncy) * (1 - E.inBack(prog(t, T_VANISH - 0.05, T_VANISH + 0.25), 1.6));
  sunFace(ctx, CX, 690, 270 * (1 + 0.02 * pulse(u)), t, k);
  if (t > T_VANISH) { ghostSun(ctx, CX, 690, 270, gone); poof(ctx, CX, 690, t, T_VANISH + 0.05, C.yellow, 420, 14); sparkles(ctx, CX, 690, t, T_VANISH + 0.05, 380, 10); }
  if (t > T_VANISH + 0.35) { const q = sp(t, T_VANISH + 0.35, SPRING.bouncy); extruded(ctx, '?', CX, 780, 260, C.white, C.lilac, 8, q, Math.sin(t * 3) * 0.08); }
  const bx = CX - 10, by = 1312, s = 0.85;
  brainy(ctx, bx, by, s, { mood: t > T_VANISH ? 'wow' : 'happy', look: [0, -0.9], blink: 0, armR: t > T_VANISH ? 160 : 60, armL: 60, sq: [1, 1 + 0.02 * pulse(u)], t });
  const fall = prog(t, T_VANISH + 0.1, T_VANISH + 0.6);
  sunglasses(ctx, bx, by, s, 220 * E.inQuad(fall) * 1.4, fall * 0.9);
}

function sClock(ctx, t, u, ls) {
  titleBlock(ctx, 'FOR NOW', 'NOTHING HAPPENS', Wd(2, 0), Wd(2, 3), t, 92);
  const t0 = SC[1].t0 - 0.5, frac = clamp((t - t0) / (Ln(2).end - t0 + 0.6), 0, 1);
  const secs = Math.round(500 * frac), label = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  stopwatch(ctx, CX, 760, 205, frac, label, sp(ls, -0.5, SPRING.bouncy));
  // the empty spot on the left, Earth on the right, the last light still on its way
  ghostSun(ctx, 175, 1120, 80, 1);
  earth(ctx, 835, 1120, 78, t, {});
  for (let i = 0; i < 9; i++) {
    const q = ((t * 0.55 + i / 9) % 1), x = lerp(270, 745, q);
    ctx.globalAlpha = Math.sin(q * Math.PI); ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(x, 1120 + Math.sin(q * 18 + i) * 10, 11, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  chip(ctx, 'LIGHT STILL ON ITS WAY', CX, 1250, sp(t, Wd(2, 5), SPRING.snappy), C.yellow, C.ink, 30);
}

function sOrbit(ctx, t, u, ls) {
  const lightOff = t > T_DARK;
  if (!lightOff) titleBlock(ctx, 'LIGHT + GRAVITY', '8 MINUTES LATE', Wd(3, 0), Wd(3, 4), t, 92);
  else { chip(ctx, 'LIGHTS OUT', CX, 330, sp(t, T_DARK, SPRING.bouncy), C.white, C.ink, 40); }
  const cx = CX, cy = 860, R = 320;
  // the dark front: grows from the empty spot and reaches the orbit exactly when the sky goes black
  const front = prog(t, Ln(3).start + 0.2, T_DARK);
  ctx.fillStyle = `rgba(255,201,60,${0.10 * (1 - darkAt(t))})`; ctx.beginPath(); ctx.arc(cx, cy, R * 1.6, 0, TAU); ctx.fill();
  if (front > 0) { ctx.fillStyle = `rgba(6,3,20,${0.75 * (1 - darkAt(t))})`; ctx.beginPath(); ctx.arc(cx, cy, R * front, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(255,201,60,${0.6 * (1 - darkAt(t))})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, R * front, 0, TAU); ctx.stroke(); }
  ctx.strokeStyle = `rgba(255,255,255,${0.35 * (1 - prog(t, T_DARK, T_DARK + 0.8))})`; ctx.lineWidth = 5; ctx.setLineDash([4, 18]);
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  ghostSun(ctx, cx, cy, 70, 1);
  // Earth: on its orbit until T_DARK, then straight along the tangent
  const w = 0.55, aT = Math.PI / 2, a0 = aT - w * (T_DARK - SC[2].t0);        // released at the bottom of the orbit
  let ex, ey;
  if (!lightOff) { const a = a0 + w * (t - SC[2].t0); ex = cx + Math.cos(a) * R; ey = cy + Math.sin(a) * R; }
  else { const d = (t - T_DARK) * w * R * (1 + (t - T_DARK) * 0.15); ex = cx + Math.cos(aT) * R - Math.sin(aT) * d; ey = cy + Math.sin(aT) * R + Math.cos(aT) * d; }
  // gravity tether: holds until T_DARK, then snaps
  if (!lightOff) {
    ctx.strokeStyle = C.lilac; ctx.lineWidth = 7; ctx.setLineDash([14, 12]); ctx.lineDashOffset = -t * 60;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
    const gk = sp(t, Wd(3, 9), SPRING.snappy);
    chip(ctx, 'GRAVITY', (cx + ex) / 2, (cy + ey) / 2 - 10, gk, C.lilac, C.ink, 28);
  } else {
    const q = prog(t, T_DARK, T_DARK + 0.5);
    ctx.globalAlpha = 1 - q; ctx.strokeStyle = C.lilac; ctx.lineWidth = 7;
    const mx = lerp(cx, ex, 0.35), my = lerp(cy, ey, 0.35);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(mx - 30 * q, my + 40 * q); ctx.stroke(); ctx.globalAlpha = 1;
    // the straight line ahead, and speed lines behind Earth
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 5; ctx.setLineDash([4, 18]); ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - Math.sin(aT) * 1400, ey + Math.cos(aT) * 1400); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    const dxn = -Math.sin(aT), dyn = Math.cos(aT);
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(ex - dxn * 110 + dyn * i * 40, ey - dyn * 110 - dxn * i * 40); ctx.lineTo(ex - dxn * 220 + dyn * i * 40, ey - dyn * 220 - dxn * i * 40); ctx.stroke(); }
  }
  earth(ctx, ex, ey, 84, t, { shade: darkAt(t) });
  if (t > Wd(3, 19) - 0.1 && !lightOff) { const q = sp(t, Wd(3, 19), SPRING.bouncy); extruded(ctx, '?', cx, cy + 40, 130, C.white, C.lilac, 6, q); }
}

function sCold(ctx, t, u) {
  titleBlock(ctx, 'NO SUNLIGHT', 'THE BIG FREEZE', Wd(5, 0), Wd(5, 1), t, 96);
  const tW = Wd(5, 2), tY = Wd(5, 9);
  // thermometer
  const tx = 250, top = 590, bot = 1130;
  const lvl = lerp(0.72, 0.38, unit(tW, tW + 1.4, t)) - 0.22 * unit(tY, tY + 1.6, t);
  const col = mix(C.red, C.cyan, clamp((0.72 - lvl) / 0.4));
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.roundRect(tx - 42, top, 84, bot - top, 42); ctx.fill(); ctx.beginPath(); ctx.arc(tx, bot + 30, 80, 0, TAU); ctx.fill();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(tx, bot + 30, 58, 0, TAU); ctx.fill();
  const lh = (bot - top - 40) * lvl; ctx.beginPath(); ctx.roundRect(tx - 22, bot - lh, 44, lh + 40, 22); ctx.fill();
  ctx.strokeStyle = C.panelLt; ctx.lineWidth = 5; for (let i = 0; i < 8; i++) { const y = top + 50 + i * 62; ctx.beginPath(); ctx.moveTo(tx + 44, y); ctx.lineTo(tx + 70, y); ctx.stroke(); }
  // zero line + readout
  const zy = bot - (bot - top - 40) * 0.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([10, 10]); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tx + 70, zy); ctx.lineTo(tx + 150, zy); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = font(34, 800, UI); ctx.fillStyle = C.white; ctx.textAlign = 'left'; ctx.fillText('0°C', tx + 160, zy + 12);
  // calendar chips
  chip(ctx, '1 WEEK: BELOW 0°C', 640, 620, sp(t, tW + 0.3, SPRING.bouncy), C.cyan, C.ink, 32);
  chip(ctx, '1 YEAR: FROZEN OCEANS', 640, 1220, sp(t, tY + 0.2, SPRING.bouncy), C.white, C.ink, 32);
  // Earth icing over
  const ice = unit(tY - 0.2, tY + 2.0, t) * 0.95 + unit(tW, tW + 1.4, t) * 0.05;
  earth(ctx, 650, 920, 200, t, { ice, shade: 0.5 });
  for (let i = 0; i < 18; i++) {
    const x = (hash01(i, 41) * 900 + 60 + Math.sin(t + i) * 20), y = ((hash01(i, 42) * 1100 + t * (60 + 40 * hash01(i, 43))) % 1100) + 520;
    ctx.globalAlpha = 0.85 * unit(tW - 0.3, tW + 0.6, t); snowflake(ctx, x, y, 9 + 9 * hash01(i, 44), t * 0.8 + i); ctx.globalAlpha = 1;
  }
}

function plant(ctx, x, y, s, wilt) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = C.orange; ctx.beginPath(); ctx.moveTo(-46, 0); ctx.lineTo(46, 0); ctx.lineTo(34, 70); ctx.lineTo(-34, 70); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e0702a'; ctx.fillRect(-52, -10, 104, 20);
  const leaf = mix(C.green, '#9a7a4a', wilt);
  ctx.strokeStyle = leaf; ctx.lineWidth = 10; ctx.lineCap = 'round';
  const tipX = 60 * wilt, tipY = -140 + 90 * wilt;
  ctx.beginPath(); ctx.moveTo(0, -8); ctx.quadraticCurveTo(0, -90, tipX, tipY); ctx.stroke();
  ctx.fillStyle = leaf;
  for (const [f, side] of [[0.45, -1], [0.75, 1]]) {
    const lx = lerp(0, tipX, f * f), ly = lerp(-8, tipY, f);
    ctx.save(); ctx.translate(lx, ly); ctx.rotate(side * (0.9 + wilt * 1.2)); ctx.beginPath(); ctx.ellipse(0, -26, 16, 30, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.beginPath(); ctx.ellipse(tipX, tipY, 18, 14, 0, 0, TAU); ctx.fill();
  ctx.restore();
}
function rabbit(ctx, x, y, s, grey = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const fur = mix('#f4f0ff', '#8e8aa8', grey), inner = mix(C.pinkLt, '#a99ab0', grey);
  ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(-24, -70, 16, 50, -0.15, 0, TAU); ctx.ellipse(24, -70, 16, 50, 0.15, 0, TAU); ctx.fill();
  ctx.fillStyle = inner; ctx.beginPath(); ctx.ellipse(-24, -70, 7, 36, -0.15, 0, TAU); ctx.ellipse(24, -70, 7, 36, 0.15, 0, TAU); ctx.fill();
  ctx.fillStyle = fur; ctx.beginPath(); ctx.arc(0, 0, 56, 0, TAU); ctx.fill();
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(-20, -6, 7, 0, TAU); ctx.arc(20, -6, 7, 0, TAU); ctx.fill();
  ctx.fillStyle = C.pink; ctx.beginPath(); ctx.ellipse(0, 12, 9, 6, 0, 0, TAU); ctx.fill();
  ctx.restore();
}
function fox(ctx, x, y, s, grey = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const fur = mix(C.orange, '#8e8aa8', grey);
  ctx.fillStyle = fur; ctx.beginPath(); ctx.moveTo(-58, -30); ctx.lineTo(-40, -96); ctx.lineTo(-10, -50); ctx.lineTo(10, -50); ctx.lineTo(40, -96); ctx.lineTo(58, -30); ctx.lineTo(0, 56); ctx.closePath(); ctx.fill();
  ctx.fillStyle = mix('#ffffff', '#c9c6d8', grey); ctx.beginPath(); ctx.moveTo(-50, -10); ctx.lineTo(0, 56); ctx.lineTo(50, -10); ctx.lineTo(0, 12); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(-22, -18, 7, 0, TAU); ctx.arc(22, -18, 7, 0, TAU); ctx.arc(0, 50, 9, 0, TAU); ctx.fill();
  ctx.restore();
}

function sFood(ctx, t, u) {
  titleBlock(ctx, 'NO SUN, NO FOOD', 'FOOD CHAIN', Wd(6, 0), Wd(6, 6), t, 108);
  const tWilt = Wd(6, 1), tFall = Wd(6, 8);
  const xs = [200, 500, 800], y = 860;
  for (let i = 0; i < 2; i++) {
    const a = sp(t, SC[4].t0 - 0.5 + 0.1 * i, SPRING.snappy);
    ctx.globalAlpha = a * (1 - 0.6 * prog(t, tFall + 0.3 * (i + 1), tFall + 0.3 * (i + 1) + 0.3));
    ctx.fillStyle = C.white; ctx.beginPath(); ctx.moveTo(xs[i] + 100, y - 14); ctx.lineTo(xs[i] + 172, y - 14); ctx.lineTo(xs[i] + 172, y - 34); ctx.lineTo(xs[i] + 200, y); ctx.lineTo(xs[i] + 172, y + 34); ctx.lineTo(xs[i] + 172, y + 14); ctx.lineTo(xs[i] + 100, y + 14); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
  }
  const wilt = unit(tWilt, tWilt + 1.3, t);
  for (let i = 0; i < 3; i++) {
    const tf = tFall + i * 0.32, f = prog(t, tf, tf + 0.5), fall = E.inQuad(f);
    const k = sp(t, SC[4].t0 - 0.55 + 0.12 * i, SPRING.bouncy);
    ctx.save(); ctx.translate(xs[i] + 90, y + 95); ctx.rotate(fall * 1.45); ctx.translate(-(xs[i] + 90), -(y + 95));
    ctx.fillStyle = mix('#3a2a8f', '#2a2350', f); ctx.beginPath(); ctx.arc(xs[i], y, 104 * k, 0, TAU); ctx.fill();
    if (k > 0.05) {
      if (i === 0) plant(ctx, xs[i], y + 40, 0.9 * k, wilt);
      if (i === 1) rabbit(ctx, xs[i], y + 30, 1.0 * k, f);
      if (i === 2) fox(ctx, xs[i], y + 20, 1.0 * k, f);
    }
    ctx.restore();
  }
  chip(ctx, 'NO SUN = NO PHOTOSYNTHESIS', CX, 1150, sp(t, tWilt + 0.3, SPRING.snappy), C.yellow, C.ink, 28);
  brainy(ctx, CX, 1335, 0.5, { mood: t > tFall ? 'worry' : 'think', look: [0, -0.8], blink: blinkAt(t, 4), sq: [1, 1 + 0.02 * pulse(u)], t });
}

function sVents(ctx, t, u) {
  titleBlock(ctx, 'STILL ALIVE', 'DEEP-SEA VENTS', Wd(7, 0), Wd(7, 3), t, 92);
  const top = 560, floor = 1240;
  // ice lid, deep water, sea floor
  const wg = ctx.createLinearGradient(0, top, 0, floor); wg.addColorStop(0, '#173a8a'); wg.addColorStop(1, '#0a0f3a');
  ctx.fillStyle = wg; ctx.beginPath(); ctx.roundRect(80, top, 840, floor - top + 70, 40); ctx.fill();
  ctx.fillStyle = '#dff3ff'; ctx.beginPath(); ctx.roundRect(80, top, 840, 70, [40, 40, 0, 0]); ctx.fill();
  ctx.fillStyle = '#b8e2ff'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(130 + i * 140, top + 70); ctx.lineTo(160 + i * 140, top + 110); ctx.lineTo(190 + i * 140, top + 70); ctx.fill(); }
  ctx.fillStyle = '#2a1650'; ctx.beginPath(); ctx.moveTo(80, floor); ctx.quadraticCurveTo(300, floor - 40, 500, floor - 10); ctx.quadraticCurveTo(720, floor + 20, 920, floor - 30); ctx.lineTo(920, floor + 70); ctx.lineTo(80, floor + 70); ctx.closePath(); ctx.fill();
  // the vent chimney and its glow
  const vx = CX, vy = floor - 10;
  const glow = ctx.createRadialGradient(vx, vy - 200, 10, vx, vy - 200, 330); glow.addColorStop(0, `rgba(255,138,61,${0.5 + 0.1 * pulse(u)})`); glow.addColorStop(1, 'rgba(255,138,61,0)');
  ctx.fillStyle = glow; ctx.fillRect(80, top + 70, 840, floor - top);
  ctx.fillStyle = '#3d2466'; ctx.beginPath(); ctx.moveTo(vx - 110, vy); ctx.lineTo(vx - 40, vy - 220); ctx.lineTo(vx + 40, vy - 220); ctx.lineTo(vx + 110, vy); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 14; i++) {
    const q = ((t * 0.45 + hash01(i, 51)) % 1), x = vx + Math.sin(q * 6 + i) * 30 * q + (hash01(i, 52) - 0.5) * 40, y = vy - 220 - q * 420;
    ctx.globalAlpha = 1 - q; ctx.fillStyle = q < 0.3 ? C.orange : C.lilac; ctx.beginPath(); ctx.arc(x, y, 10 + 22 * q * hash01(i, 53), 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // tube worms swaying
  for (let i = 0; i < 9; i++) {
    const side = i < 5 ? -1 : 1, bx = vx + side * (140 + (i % 5) * 34), by = floor - 4 + (i % 2) * 6, hgt = 90 + hash01(i, 61) * 70, sway = Math.sin(t * 2 + i) * 14;
    ctx.strokeStyle = '#f0e8ff'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx, by - hgt * 0.6, bx + sway, by - hgt); ctx.stroke();
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.ellipse(bx + sway, by - hgt - 10, 14, 20, 0, 0, TAU); ctx.fill();
  }
  // glowing little critters circling
  for (let i = 0; i < 6; i++) {
    const a = t * (0.8 + 0.2 * i) + i, x = vx + Math.cos(a) * (200 + i * 20), y = 900 + Math.sin(a * 1.3) * 120;
    ctx.fillStyle = C.cyan; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.ellipse(x, y, 16, 9, Math.cos(a) > 0 ? 0 : Math.PI, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 14 * Math.sign(Math.cos(a) || 1), y); ctx.lineTo(x - 28 * Math.sign(Math.cos(a) || 1), y - 9); ctx.lineTo(x - 28 * Math.sign(Math.cos(a) || 1), y + 9); ctx.fill(); ctx.globalAlpha = 1;
  }
  chip(ctx, "POWERED BY EARTH'S HEAT", CX, 1305, sp(t, Wd(7, 7), SPRING.bouncy), C.orange, C.ink, 30);
}

function sDrift(ctx, t, u, ls) {
  // stars stream past while a frozen Earth drifts, Brainy on top with a torch
  for (let i = 0; i < 40; i++) {
    const sp2 = 40 + hash01(i, 71) * 160, x = ((hash01(i, 72) * 1300 - ls * sp2) % 1300 + 1300) % 1300 - 110, y = 280 + hash01(i, 73) * 1100;
    ctx.strokeStyle = `rgba(255,255,255,${0.25 + 0.4 * hash01(i, 74)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sp2 * 0.25, y); ctx.stroke();
  }
  const ex = CX + Math.sin(ls * 0.5) * 30, ey = 900 + Math.sin(ls * 0.7) * 12;
  earth(ctx, ex, ey, 260, t, { ice: 0.95, shade: 0.55, spin: 0.08 });
  const bx = ex - 20, by = ey - 250;
  // torch beam
  ctx.save(); ctx.translate(bx + 70, by - 120); ctx.rotate(-0.35 + Math.sin(t * 1.2) * 0.2);
  const bg2 = ctx.createLinearGradient(0, 0, 420, 0); bg2.addColorStop(0, 'rgba(255,233,140,0.55)'); bg2.addColorStop(1, 'rgba(255,233,140,0)');
  ctx.fillStyle = bg2; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(420, -110); ctx.lineTo(420, 110); ctx.lineTo(0, 10); ctx.closePath(); ctx.fill(); ctx.restore();
  brainy(ctx, bx, by, 0.6, { mood: 'happy', look: [0.8, -0.4], blink: blinkAt(t, 8), armR: 130, sq: [1, 1 + 0.02 * pulse(u)], t });
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.roundRect(bx + 52, by - 134, 40, 22, 8); ctx.fill();
  extruded(ctx, 'FOREVER', CX, 470, 120, C.white, C.lilac, 10, sp(t, Wd(8, 8), SPRING.bouncy));
}

function sEnd(ctx, t, u, ls) {
  const lines = ['What would you do', 'with 8 minutes?'];
  const t0 = Wd(9, 1);
  lines.forEach((s, i) => {
    const k = sp(t, t0 + i * 0.45, SPRING.bouncy); if (k < 0.01) return;
    ctx.save(); ctx.translate(CX, 390 + i * 118); ctx.scale(k, k); ctx.rotate((1 - k) * (i ? 0.1 : -0.1));
    ctx.font = font(100, 700, DISPLAY); ctx.textAlign = 'center'; ctx.fillStyle = C.pinkDk; ctx.fillText(s, 5, 9); ctx.fillStyle = C.white; ctx.fillText(s, 0, 0); ctx.restore();
  });
  const qk = sp(t, Wd(9, 4), SPRING.bouncy);
  thoughtBubble(ctx, CX + 180, 790, 200 * qk, 165 * qk, CX + 50, 925, qk);
  const frac = clamp((t - Wd(9, 4)) / 3.5, 0, 1), secs = Math.round(480 * (1 - frac));
  if (qk > 0.02) stopwatch(ctx, CX + 180, 800, 105, 1 - frac, `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, qk);
  brainy(ctx, CX - 40, 1300, 1.0, { mood: 'think', look: [0.6, -0.6], blink: blinkAt(t, 11), rot: Math.sin(t * 1.6) * 0.05, armR: 150, sq: [1, 1 + 0.025 * pulse(u)], breath: Math.sin(t * 2), t });
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
  const widths = () => words.map((w) => ctx.measureText(w).width);
  let ws = widths(), total = ws.reduce((a, b) => a + b, 0) + size * 0.42 * (words.length - 1);
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

// ------------------------------------------------------------------ hits
const HITS = [
  [bt(0.0), 'hook: the Sun', 'sub', { len: 0.9 }],
  [bt(T_VANISH), 'the Sun vanishes', 'pop+swell', { pitch: 'D6', to: 'D4' }],
  [bt(T_VANISH + 0.35), 'sunglasses fall / ?', 'boing', { pitch: 'A4', to: 'D4' }],
  ...SC.slice(1).map((s, i) => [bt(s.t0 - 0.24), `push to scene ${i + 2}`, 'whoosh', { len: 0.36, from: 500, to: 2600, pan: i % 2 ? -0.3 : 0.3 }]),
  [bt(Wd(2, 3)), 'NOTHING HAPPENS', 'thud', { pitch: 'D3', to: 'A2' }], [bt(Wd(2, 5)), 'light chip', 'pop', { pitch: 'F#5' }],
  [bt(Wd(3, 4)), '8 MINUTES LATE', 'thud', { pitch: 'D3', to: 'A2' }], [bt(Wd(3, 9)), 'gravity chip', 'pop', { pitch: 'A5' }],
  [bt(T_DARK), 'lights out + snap', 'impact', {}], [bt(Wd(4, 7)), 'Earth flies off', 'whoosh', { len: 0.6, from: 2600, to: 400 }],
  [bt(Wd(5, 1)), 'BIG FREEZE', 'thud', { pitch: 'D3', to: 'A2' }], [bt(Wd(5, 2) + 0.3), '1 week chip', 'pop', { pitch: 'E5' }], [bt(Wd(5, 9) + 0.2), '1 year chip', 'bell', { pitch: 'B5' }],
  [bt(Wd(6, 6)), 'FOOD CHAIN', 'thud', { pitch: 'D3', to: 'A2' }], ...[0, 1, 2].map((i) => [bt(Wd(6, 8) + i * 0.32 + 0.45), `domino ${i + 1}`, 'thud', { pitch: 'G3', to: 'D3', gain: 0.35 }]),
  [bt(Wd(7, 3)), 'DEEP-SEA VENTS', 'thud', { pitch: 'D3', to: 'A2' }], [bt(Wd(7, 7)), 'heat chip', 'pop', { pitch: 'F#5' }],
  [bt(Wd(8, 8)), 'FOREVER', 'bell', { pitch: 'D6' }],
  [bt(Wd(9, 1)), 'question', 'pop', { pitch: 'A5' }], [bt(Wd(9, 4)), 'stopwatch bubble', 'tick'],
].sort((a, b) => a[0] - b[0]);

const SCENES = [sHook, sClock, sOrbit, sCold, sFood, sVents, sDrift, sEnd];

M.film({
  fonts: [font(100, 700, DISPLAY), font(40, 800, UI)],
  hits: HITS,
  samples: () => 6,
  draw(ctx, u, t) {
    bg(ctx, t, u);
    let k = SC.length - 1;
    while (k > 0 && t < SC[k].t0 - PUSH_A) k--;
    const drawScene = (i, dx) => { ctx.save(); ctx.translate(dx, Math.sin(t * 0.8 + i) * 4); SCENES[i](ctx, t, u, t - SC[i].t0); ctx.restore(); };
    if (k > 0 && t < SC[k].t0 - PUSH_B) {
      const e = unit(SC[k].t0 - PUSH_A, SC[k].t0 - PUSH_B, t);
      drawScene(k - 1, -W * e); drawScene(k, W * (1 - e));
    } else drawScene(k, 0);
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, 'rgba(10,4,30,0)'); vg.addColorStop(1, 'rgba(10,4,30,0.4)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    captions(ctx, t);
  },
});
