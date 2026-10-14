// Flat-vector drawing kit for "Why do we dream?": palette, mascot (Brainy), icons, small effects.
// Everything is a pure function of its arguments (no state, no Math.random).
import * as M from './motion.js';

const { TAU, lerp, clamp, prog, hash01, spring, SPRING } = M;

export const C = {
  bgTop: '#150a38', bgMid: '#2a1170', bgBot: '#5b1a8f',
  pink: '#ff5fa2', pinkDk: '#e03d86', pinkLt: '#ff9cc4', pinkHi: '#ffc2dc',
  yellow: '#ffc93c', yellowDk: '#f29a1f', orange: '#ff8a3d', cyan: '#2ec8ff', cyanDk: '#1b8fd6', blue: '#4b6bff',
  green: '#5ce08a', red: '#ff4d5e', white: '#ffffff', ink: '#1a0b3d', panel: '#22115a', panelLt: '#3a2a8f',
  skin: '#ffc9a8', lilac: '#b9a2ff',
};

// ------------------------------------------------------------------ small helpers
export const sp = (t, t0, cfg = SPRING.bouncy) => spring(t - t0, cfg);          // spring in seconds since t0
export const tri = (x) => 1 - Math.abs(((x % 2) + 2) % 2 - 1);                     // 0..1..0 triangle, period 2
export const ease = M.E;

export function pill(ctx, x, y, w, h, r = h / 2) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); }

export function blobPath(ctx, cx, cy, rx, ry, n = 7, amp = 0.045, ph = 0) {
  ctx.beginPath();
  const N = 96, n2 = Math.round(n * 1.7);
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * TAU;
    const r = 1 + amp * Math.sin(n * th + ph) + amp * 0.5 * Math.sin(n2 * th + ph * 1.3);
    const x = cx + Math.cos(th) * rx * r, y = cy + Math.sin(th) * ry * r;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.closePath();
}

export function star4(ctx, x, y, r, rot = 0, color = C.yellow) {
  if (r <= 0.5) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, rr = i % 2 ? r * 0.28 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

export function star5(ctx, x, y, r, rot = -Math.PI / 2, color = C.yellow) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

export function heart(ctx, x, y, s, color = C.pink, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, 22);
  ctx.bezierCurveTo(-40, -4, -26, -36, 0, -16); ctx.bezierCurveTo(26, -36, 40, -4, 0, 22);
  ctx.fill(); ctx.restore();
}

// a few round puffs flying out and shrinking: the "poof" when something disappears
export function poof(ctx, x, y, t, t0, color = C.white, R = 90, n = 9) {
  const p = (t - t0) / 0.7;
  if (p <= 0 || p >= 1) return;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + hash01(i, 3) * 0.6, d = R * M.E.outCubic(p) * (0.6 + hash01(i, 5) * 0.6);
    ctx.globalAlpha = 1 - p; ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, (1 - p) * (10 + hash01(i, 8) * 12), 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function sparkles(ctx, x, y, t, t0, R = 120, n = 6, colors = [C.yellow, C.cyan, C.pinkLt]) {
  const p = (t - t0) / 1.0;
  if (p <= 0 || p >= 1) return;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + hash01(i, 11), d = R * M.E.outCubic(p) * (0.7 + 0.5 * hash01(i, 12));
    ctx.globalAlpha = Math.min(1, (1 - p) * 2);
    star4(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, (1 - p) * (16 + 14 * hash01(i, 13)), p * 3 + i, colors[i % colors.length]);
  }
  ctx.globalAlpha = 1;
}

// ------------------------------------------------------------------ Brainy, the mascot
// Origin = the point between his feet. s = scale. o: look [x,y] -1..1, mood, blink 0..1 (extra), breath,
// sq [sx,sy] (squash about the feet), rot (rad), armL / armR (degrees from hanging down, or undefined = no arm), run (phase)
export function brainy(ctx, x, y, s = 1, o = {}) {
  const { look = [0, 0], mood = 'happy', blink = 0, breath = 0, sq = [1, 1], rot = 0, armL, armR, run = null, t = 0, open = 1, tint = null } = o;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s * sq[0], s * sq[1]);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // legs
  const lw = (side, ph) => {
    const lift = run == null ? 0 : Math.max(0, Math.sin(ph)) * 22;
    const fx = side * 40 + (run == null ? 0 : Math.cos(ph) * 18);
    ctx.strokeStyle = C.pinkDk; ctx.lineWidth = 24;
    ctx.beginPath(); ctx.moveTo(side * 34, -52); ctx.lineTo(fx, -10 - lift); ctx.stroke();
    ctx.fillStyle = C.pinkDk; ctx.beginPath(); ctx.ellipse(fx + side * 4, -8 - lift, 26, 13, 0, 0, TAU); ctx.fill();
  };
  lw(-1, run == null ? 0 : run); lw(1, run == null ? 0 : run + Math.PI);

  // brainstem tail
  ctx.strokeStyle = C.pinkDk; ctx.lineWidth = 34;
  ctx.beginPath(); ctx.moveTo(24, -70); ctx.quadraticCurveTo(46, -52, 26, -34); ctx.stroke();

  // arms (behind the brain)
  const arm = (side, a) => {
    if (a == null) return;
    const rad = (a * Math.PI) / 180, bx = side * 128, by = -128;
    const ex = bx + Math.sin(rad) * side * 78 + side * 14, ey = by + Math.cos(rad) * 78;
    ctx.strokeStyle = C.pinkDk; ctx.lineWidth = 24;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.fillStyle = C.pinkLt; ctx.beginPath(); ctx.arc(ex, ey, 20, 0, TAU); ctx.fill();
  };
  arm(-1, armL); arm(1, armR);

  // the brain
  const bw = 1 + breath * 0.03, bh = 1 + breath * 0.04;
  blobPath(ctx, 0, -170, 150 * bw, 118 * bh, 7, 0.045, 0.6);
  const g = ctx.createLinearGradient(0, -290, 0, -50); g.addColorStop(0, C.pinkLt); g.addColorStop(0.35, C.pink); g.addColorStop(1, C.pinkDk);
  ctx.fillStyle = g; ctx.fill();
  if (tint) { ctx.fillStyle = tint; ctx.fill(); }
  // folds
  ctx.strokeStyle = C.pinkDk; ctx.lineWidth = 8; ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.moveTo(-6, -282); ctx.bezierCurveTo(-40, -250, 26, -236, -4, -212); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-104, -232); ctx.bezierCurveTo(-76, -250, -70, -214, -40, -232); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(52, -250); ctx.bezierCurveTo(86, -262, 84, -226, 116, -236); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-136, -178); ctx.bezierCurveTo(-120, -200, -104, -168, -92, -190); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(100, -196); ctx.bezierCurveTo(124, -208, 128, -176, 142, -190); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath(); ctx.ellipse(-70, -250, 44, 18, -0.5, 0, TAU); ctx.fill();

  // face
  const wow = mood === 'wow' ? 1.14 : 1;
  const lx = look[0] * 9, ly = look[1] * 8;
  const eye = (side) => {
    const ex = side * 48, ey = -158, rx = 31 * wow, ry = 39 * wow;
    if (mood === 'sleep') {
      ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(ex, ey + 6, 22, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); return;
    }
    if (mood === 'yawn' || mood === 'laugh') {
      ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(ex, ey + 14, 22, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); return;
    }
    ctx.fillStyle = C.white; ctx.beginPath(); ctx.ellipse(ex, ey, rx, ry, 0, 0, TAU); ctx.fill();
    const pr = mood === 'wow' ? 11 : 16;
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(ex + lx, ey + ly + 4, pr, 0, TAU); ctx.fill();
    ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(ex + lx + 5, ey + ly - 3, 5, 0, TAU); ctx.fill();
    const lid = clamp(blink + (mood === 'tired' ? 0.45 : 0));
    if (lid > 0.02) {
      ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, rx + 1, ry + 1, 0, 0, TAU); ctx.clip();
      ctx.fillStyle = C.pink; ctx.fillRect(ex - rx - 2, ey - ry - 2, rx * 2 + 4, ry * 2 * lid + 4);
      ctx.strokeStyle = C.pinkDk; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ex - rx, ey - ry + ry * 2 * lid); ctx.lineTo(ex + rx, ey - ry + ry * 2 * lid); ctx.stroke();
      ctx.restore();
    }
    // brows
    ctx.strokeStyle = C.pinkDk; ctx.lineWidth = 7;
    if (mood === 'worry') { ctx.beginPath(); ctx.moveTo(ex - side * 24, ey - 54 + 8), ctx.lineTo(ex + side * 22, ey - 62 - 6); ctx.stroke(); }
    if (mood === 'think' && side === 1) { ctx.beginPath(); ctx.moveTo(ex - 22, ey - 58); ctx.quadraticCurveTo(ex, ey - 72, ex + 24, ey - 58); ctx.stroke(); }
    if (mood === 'wow') { ctx.beginPath(); ctx.moveTo(ex - 22, ey - 60); ctx.quadraticCurveTo(ex, ey - 76, ex + 22, ey - 60); ctx.stroke(); }
  };
  eye(-1); eye(1);
  // cheeks
  ctx.fillStyle = 'rgba(255,170,205,0.55)';
  ctx.beginPath(); ctx.ellipse(-92, -112, 16, 10, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(92, -112, 16, 10, 0, 0, TAU); ctx.fill();
  // mouth
  ctx.fillStyle = C.ink; ctx.strokeStyle = C.ink; ctx.lineWidth = 7;
  if (mood === 'happy' || mood === 'tired') {
    ctx.beginPath(); ctx.moveTo(-26, -112); ctx.quadraticCurveTo(0, -78, 26, -112); ctx.quadraticCurveTo(0, -102, -26, -112); ctx.fill();
    ctx.fillStyle = C.pinkLt; ctx.beginPath(); ctx.ellipse(0, -97, 11, 6, 0, 0, TAU); ctx.fill();
  } else if (mood === 'sleep') {
    ctx.beginPath(); ctx.ellipse(0, -104, 8 + breath * 4, 7 + breath * 5, 0, 0, TAU); ctx.fill();
  } else if (mood === 'yawn') {
    ctx.beginPath(); ctx.ellipse(0, -96 + 10 * open, 18 + 10 * open, 8 + 34 * open, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C.pinkLt; ctx.beginPath(); ctx.ellipse(0, -96 + 30 * open, 12 * open + 4, 6 + 8 * open, 0, 0, TAU); ctx.fill();
  } else if (mood === 'laugh') {
    ctx.beginPath(); ctx.moveTo(-34, -116); ctx.quadraticCurveTo(0, -60, 34, -116); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.pinkLt; ctx.beginPath(); ctx.ellipse(0, -90, 13, 7, 0, 0, TAU); ctx.fill();
  } else if (mood === 'wow') {
    ctx.beginPath(); ctx.ellipse(0, -100, 14, 19, 0, 0, TAU); ctx.fill();
  } else if (mood === 'worry') {
    ctx.beginPath(); ctx.moveTo(-24, -98); ctx.quadraticCurveTo(-12, -112, 0, -100); ctx.quadraticCurveTo(12, -88, 24, -102); ctx.stroke();
  } else {   // think / flat
    ctx.beginPath(); ctx.moveTo(-18, -102); ctx.quadraticCurveTo(0, -96, 22, -108); ctx.stroke();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ props and icons (origin = centre)
export function iconSun(ctx, x, y, r, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.5);
  ctx.fillStyle = C.yellow;
  for (let i = 0; i < 10; i++) { ctx.save(); ctx.rotate((i / 10) * TAU); ctx.beginPath(); ctx.roundRect(-r * 0.09, -r * 1.35, r * 0.18, r * 0.4, r * 0.09); ctx.fill(); ctx.restore(); }
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.fillStyle = C.orange; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(r * 0.25, r * 0.3, r * 0.75, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  ctx.restore();
}
export function iconCup(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.ellipse(0, 46, 70, 16, 0, 0, TAU); ctx.fill();                 // saucer
  ctx.fillStyle = C.orange; ctx.beginPath(); ctx.moveTo(-52, -14); ctx.lineTo(52, -14); ctx.quadraticCurveTo(48, 52, 0, 52); ctx.quadraticCurveTo(-48, 52, -52, -14); ctx.fill();
  ctx.strokeStyle = C.orange; ctx.lineWidth = 11; ctx.beginPath(); ctx.arc(58, 10, 20, -1.2, 1.5); ctx.stroke();
  ctx.fillStyle = '#7a3b1a'; ctx.beginPath(); ctx.ellipse(0, -14, 52, 11, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = C.yellow; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-10, -18); ctx.lineTo(-34, -66); ctx.stroke();
  ctx.restore();
}
export function iconCone(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = C.yellowDk; ctx.beginPath(); ctx.moveTo(-34, -6); ctx.lineTo(34, -6); ctx.lineTo(0, 78); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C.yellow; ctx.lineWidth = 5; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 20, -4); ctx.lineTo(i * 6, 56); ctx.stroke(); }
  ctx.fillStyle = C.pinkLt; ctx.beginPath(); ctx.arc(0, -18, 40, 0, TAU); ctx.fill();
  ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.arc(0, -62, 31, 0, TAU); ctx.fill();
  ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(8, -96, 9, 0, TAU); ctx.fill();
  ctx.restore();
}
export function iconBus(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.roundRect(-76, -48, 152, 92, 22); ctx.fill();
  ctx.fillStyle = C.white; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.roundRect(-62 + i * 44, -34, 34, 32, 8); ctx.fill(); }
  ctx.fillStyle = C.cyanDk; ctx.fillRect(-76, 12, 152, 10);
  ctx.fillStyle = C.ink; for (const wx of [-42, 42]) { ctx.beginPath(); ctx.arc(wx, 46, 16, 0, TAU); ctx.fill(); }
  ctx.fillStyle = C.white; for (const wx of [-42, 42]) { ctx.beginPath(); ctx.arc(wx, 46, 6, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// memory card: a rounded card with an icon. mark = gold star badge ("this one matters")
export function card(ctx, x, y, w, h, kind, o = {}) {
  const { rot = 0, sc = 1, mark = 0, glow = 0, t = 0 } = o;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
  if (glow > 0) { ctx.globalAlpha = glow * 0.5; ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.roundRect(-w / 2 - 14, -h / 2 - 14, w + 28, h + 28, 38); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 26); ctx.fill();
  const bg = { sun: '#ffe9a8', cup: '#ffd2b0', cone: '#ffd0e4', bus: '#bfeaff' }[kind];
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 18); ctx.fill();
  if (kind === 'sun') iconSun(ctx, 0, -4, 36, t); if (kind === 'cup') iconCup(ctx, 0, 0, 0.8);
  if (kind === 'cone') iconCone(ctx, 0, -4, 0.74); if (kind === 'bus') iconBus(ctx, 0, 0, 0.85);
  if (mark > 0.01) { star5(ctx, w / 2 - 6, -h / 2 + 6, 34 * mark, -Math.PI / 2 + (1 - mark) * 2, C.yellow); }
  ctx.restore();
}

export function padlock(ctx, x, y, s = 1, open = 0, color = C.red) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = C.white; ctx.lineWidth = 11; ctx.beginPath(); ctx.arc(0, -22 - open * 12, 26, Math.PI, TAU - open * 0.6); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(-36, -22, 72, 56, 14); ctx.fill();
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill(); ctx.fillRect(-3, 2, 6, 16);
  ctx.restore();
}

export function magnifier(ctx, x, y, s = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.strokeStyle = C.yellowDk; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(40, 40); ctx.lineTo(110, 110); ctx.stroke();
  ctx.fillStyle = 'rgba(120,220,255,0.28)'; ctx.beginPath(); ctx.arc(0, 0, 58, 0, TAU); ctx.fill();
  ctx.strokeStyle = C.yellow; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(0, 0, 58, 0, TAU); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-22, -24, 14, 7, -0.7, 0, TAU); ctx.fill();
  ctx.restore();
}

export function gamepad(ctx, x, y, s = 1, press = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.roundRect(-92, -34, 184, 70, 34); ctx.fill();
  ctx.beginPath(); ctx.arc(-68, 28, 32, 0, TAU); ctx.arc(68, 28, 32, 0, TAU); ctx.fill();
  ctx.fillStyle = C.lilac; ctx.fillRect(-66, -8, 38, 10); ctx.fillRect(-52, -22, 10, 38);
  ctx.fillStyle = C.pink; ctx.beginPath(); ctx.arc(46, -6 + press * 4, 11, 0, TAU); ctx.fill();
  ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.arc(70, 8 - press * 4, 11, 0, TAU); ctx.fill();
  ctx.restore();
}

// a zig-zag-free tiny rat, seen from above, heading along +x
export function rat(ctx, x, y, ang, s = 1, o = {}) {
  const { sleep = 0, run = 0 } = o;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  ctx.strokeStyle = C.pinkLt; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-30, 0); ctx.quadraticCurveTo(-52, 14 * Math.sin(run * 8), -70, -6 * Math.sin(run * 8 + 1)); ctx.stroke();   // tail
  ctx.fillStyle = '#f2edff'; ctx.beginPath(); ctx.ellipse(0, 0, 34, 22, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(26, -14); ctx.lineTo(52, 0); ctx.lineTo(26, 14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.pinkLt; ctx.beginPath(); ctx.arc(10, -20, 10, 0, TAU); ctx.arc(10, 20, 10, 0, TAU); ctx.fill();
  ctx.fillStyle = C.pink; ctx.beginPath(); ctx.arc(53, 0, 6, 0, TAU); ctx.fill();
  ctx.fillStyle = C.ink;
  if (sleep) { ctx.fillRect(26, -13, 12, 3); ctx.fillRect(26, 10, 12, 3); }
  else { ctx.beginPath(); ctx.arc(30, -10, 4, 0, TAU); ctx.arc(30, 10, 4, 0, TAU); ctx.fill(); }
  ctx.restore();
}

export function cheese(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.moveTo(-34, 22); ctx.lineTo(34, 22); ctx.lineTo(34, -2); ctx.lineTo(-34, -26); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.yellowDk; for (const [a, b, r] of [[-10, 8, 6], [14, 6, 5], [20, -4, 4]]) { ctx.beginPath(); ctx.arc(a, b, r, 0, TAU); ctx.fill(); }
  ctx.restore();
}

export function zzz(ctx, x, y, t, color = C.white, size = 56) {
  for (let i = 0; i < 3; i++) {
    const p = ((t * 0.55 + i / 3) % 1);
    ctx.globalAlpha = Math.sin(p * Math.PI);
    ctx.font = `700 ${Math.round(size * (0.55 + p * 0.6))}px Display`; ctx.fillStyle = color; ctx.textAlign = 'center';
    ctx.fillText('Z', x + p * 60 + i * 6, y - p * 140);
  }
  ctx.globalAlpha = 1;
}

// round thought bubble with its little dots; returns nothing, the caller draws inside via the path already clipped if wanted
export function thoughtBubble(ctx, x, y, rx, ry, tailX, tailY, k = 1, fillc = 'rgba(255,255,255,0.14)', edge = 'rgba(255,255,255,0.7)') {
  ctx.save();
  ctx.fillStyle = fillc; ctx.strokeStyle = edge; ctx.lineWidth = 6;
  blobPath(ctx, x, y, rx * k, ry * k, 8, 0.05, 0.3); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const p = (i + 1) / 4.2, r = (24 - i * 7) * k;
    ctx.beginPath(); ctx.arc(lerp(tailX, x, 1 - p * 0.9 + 0.05), lerp(tailY, y + ry * k, 1 - p * 0.9 + 0.05), r, 0, TAU); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

// a simple round face (people, friends, strangers). o: yawn 0..1, mood, look, hair colour, skin
export function face(ctx, x, y, r, o = {}) {
  const { yawn = 0, mood = 'happy', look = [0, 0], hair = '#3b2a1a', skin = C.skin, blink = 0 } = o;
  ctx.save(); ctx.translate(x, y); ctx.scale(r / 100, r / 100); ctx.lineCap = 'round';
  ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(0, -8, 104, Math.PI, 0); ctx.fill();
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, 0, 100, 0, TAU); ctx.fill();
  ctx.fillStyle = hair; ctx.beginPath(); ctx.ellipse(0, -78, 92, 38, 0, Math.PI, 0); ctx.fill();
  const closed = yawn > 0.3 || mood === 'laugh';
  for (const sx of [-1, 1]) {
    const ex = sx * 36, ey = -12;
    if (closed) { ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(ex, ey + 10, 16, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); }
    else { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.ellipse(ex + look[0] * 6, ey + look[1] * 5, 10, 13 * (1 - blink * 0.9), 0, 0, TAU); ctx.fill(); }
  }
  ctx.fillStyle = 'rgba(255,120,120,0.35)'; ctx.beginPath(); ctx.ellipse(-62, 26, 16, 9, 0, 0, TAU); ctx.ellipse(62, 26, 16, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = C.ink;
  if (yawn > 0.05) { ctx.beginPath(); ctx.ellipse(0, 44, 18 + 10 * yawn, 6 + 36 * yawn, 0, 0, TAU); ctx.fill(); }
  else if (mood === 'laugh') { ctx.beginPath(); ctx.moveTo(-34, 30); ctx.quadraticCurveTo(0, 86, 34, 30); ctx.closePath(); ctx.fill(); }
  else if (mood === 'flat') { ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-22, 46); ctx.lineTo(22, 46); ctx.stroke(); }
  else { ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 26, 26, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); }
  ctx.restore();
}
