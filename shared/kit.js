// Shared kit for the question Shorts: timing, background, titles, chips, captions and the film harness.
// A film imports ../shared/motion.js, ../shared/art.js and this file, writes its scenes, and calls run().
import * as M from './motion.js';
import * as A from './art.js';

const { W, H, FORMAT, E, TAU, SPRING, clamp, lerp, prog, font, hash01, mix } = M;
const { C, sp, pill } = A;

export const CX = FORMAT.safe.x + FORMAT.safe.w / 2;
export const DISPLAY = 'Display', UI = 'UI';
export const pulse = (u) => Math.exp(-(((u % 1) + 1) % 1) * 6);
export const blinkAt = (t, seed = 0) => { const p = (t * 0.37 + seed * 0.31) % 1; return p < 0.05 ? Math.sin((Math.PI * p) / 0.05) : 0; };
export const unit = (a, b, t) => E.inOutCubic(prog(t, a, b));

// voice timing (assets/vo_timing.json) and the beat grid
export async function timing() {
  const TIM = await (await fetch('assets/vo_timing.json')).json();
  const GR = await (await fetch('beats.json')).json();
  const Ln = (n) => TIM[n - 1];
  return {
    TIM, GR, Ln,
    Wd: (n, i) => Ln(n).words[Math.min(i, Ln(n).words.length - 1)].s,
    bt: (s) => (s - GR.offset) / GR.period,
  };
}

// purple night with bokeh and stars; pal overrides the gradient, dark (0..1) dims it
export function bg(ctx, t, u, { pal = [C.bgTop, C.bgMid, C.bgBot], dark = 0, darkPal = ['#05030f', '#0b0626', '#1a0b40'] } = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix(pal[0], darkPal[0], dark)); g.addColorStop(0.55, mix(pal[1], darkPal[1], dark)); g.addColorStop(1, mix(pal[2], darkPal[2], dark));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(W / 2, H * 0.93, 30, W / 2, H * 0.93, 950);
  rg.addColorStop(0, `rgba(255,95,162,${0.3 * (1 - dark * 0.6)})`); rg.addColorStop(1, 'rgba(255,95,162,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  const cols = [C.cyan, C.pink, C.yellow, C.lilac];
  for (let i = 0; i < 16; i++) {
    const x = hash01(i, 1) * W + Math.sin(t * 0.3 + i) * 30;
    const y = (((hash01(i, 2) * H - t * (8 + hash01(i, 3) * 14)) % H) + H) % H;
    ctx.globalAlpha = (0.05 + 0.05 * hash01(i, 5)) * (1 + 0.5 * pulse(u)) * (1 - dark * 0.6);
    ctx.fillStyle = cols[i % 4]; ctx.beginPath(); ctx.arc(x, y, 36 + hash01(i, 4) * 90, 0, TAU); ctx.fill();
  }
  for (let i = 0; i < 60; i++) {
    const tw = 0.5 + 0.5 * Math.sin(t * (1 + hash01(i, 7) * 2) + i * 3);
    ctx.globalAlpha = 0.25 + 0.5 * tw;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hash01(i, 8) * W, hash01(i, 9) * H * 0.85, 1.5 + hash01(i, 10) * 2.2, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// small yellow pill + big white display word, both springing in
export function titleBlock(ctx, small, big, ts, tb, t, size = 118) {
  const k1 = sp(t, ts, SPRING.snappy);
  if (k1 > 0.001 && small) {
    ctx.save(); ctx.translate(CX, 318); ctx.scale(k1, k1);
    ctx.font = font(34, 800, UI); ctx.letterSpacing = '4px';
    const w = ctx.measureText(small).width + 52;
    pill(ctx, -w / 2, -32, w, 64); ctx.fillStyle = C.yellow; ctx.fill();
    ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText(small, 2, 12); ctx.letterSpacing = '0px';
    ctx.restore();
  }
  const k2 = sp(t, tb, SPRING.bouncy);
  if (k2 > 0.001 && big) {
    ctx.save(); ctx.translate(CX, 458); ctx.scale(k2, k2); ctx.rotate((1 - k2) * -0.12);
    ctx.font = font(size, 700, DISPLAY); ctx.textAlign = 'center';
    const w = ctx.measureText(big).width; if (w > 860) ctx.scale(860 / w, 860 / w);
    ctx.fillStyle = C.pinkDk; ctx.fillText(big, 6, 10); ctx.fillStyle = C.white; ctx.fillText(big, 0, 0);
    ctx.restore();
  }
}

export function extruded(ctx, str, x, y, size, top, side, depth = 16, k = 1, rot = 0) {
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  ctx.font = font(size, 700, DISPLAY); ctx.textAlign = 'center';
  ctx.fillStyle = side; for (let i = depth; i >= 1; i -= 2) ctx.fillText(str, i * 0.8, i);
  ctx.fillStyle = top; ctx.fillText(str, 0, 0);
  ctx.restore();
}

export function chip(ctx, str, x, y, k, bgc = C.yellow, fg = C.ink, size = 36) {
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.font = font(size, 800, UI); ctx.letterSpacing = '3px';
  const w = ctx.measureText(str).width + 48; pill(ctx, -w / 2, -size * 0.95, w, size * 1.9); ctx.fillStyle = bgc; ctx.fill();
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.fillText(str, 2, size * 0.36); ctx.letterSpacing = '0px'; ctx.restore();
}

// big two-line closing question
export function question(ctx, lines, t0, t, y = 390, size = 100) {
  lines.forEach((s, i) => {
    const k = sp(t, t0 + i * 0.45, SPRING.bouncy); if (k < 0.01) return;
    ctx.save(); ctx.translate(CX, y + i * size * 1.18); ctx.scale(k, k); ctx.rotate((1 - k) * (i ? 0.1 : -0.1));
    ctx.font = font(size, 700, DISPLAY); ctx.textAlign = 'center';
    const w = ctx.measureText(s).width; if (w > 880) ctx.scale(880 / w, 880 / w);
    ctx.fillStyle = C.pinkDk; ctx.fillText(s, 5, 9); ctx.fillStyle = C.white; ctx.fillText(s, 0, 0); ctx.restore();
  });
}

// captions: up to three words at a time, appearing as spoken, current word gold
export function makeCaptions(TIM) {
  const CAPS = [];
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
    chunks.forEach((words, i) => CAPS.push({ ln, words, t0: words[0].s - 0.04, t1: i < chunks.length - 1 ? chunks[i + 1][0].s - 0.04 : ln.end + 0.4 }));
  }
  return (ctx, t) => {
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
  };
}

// the harness: background, scenes pushed in from the right on each scene start, vignette, captions
export function run({ TIM, SC, SCENES, HITS, background = bg, bgOpts = () => ({}), init, samples = 5 }) {
  const PUSH_A = 0.46, PUSH_B = 0.04;
  const captions = makeCaptions(TIM);
  M.film({
    fonts: [font(100, 700, DISPLAY), font(40, 800, UI)],
    hits: HITS,
    init,
    samples: () => samples,
    draw(ctx, u, t) {
      background(ctx, t, u, bgOpts(t));
      let k = SC.length - 1;
      while (k > 0 && t < SC[k] - PUSH_A) k--;
      const drawScene = (i, dx) => { ctx.save(); ctx.translate(dx, Math.sin(t * 0.8 + i) * 4); SCENES[i](ctx, t, u, t - SC[i]); ctx.restore(); };
      if (k > 0 && t < SC[k] - PUSH_B) {
        const e = unit(SC[k] - PUSH_A, SC[k] - PUSH_B, t);
        drawScene(k - 1, -W * e); drawScene(k, W * (1 - e));
      } else drawScene(k, 0);
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
      vg.addColorStop(0, 'rgba(10,4,30,0)'); vg.addColorStop(1, 'rgba(10,4,30,0.4)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      captions(ctx, t);
    },
  });
}

// push whooshes for every scene start after the first
export const pushHits = (SC, bt) => SC.slice(1).map((s, i) => [bt(s - 0.24), `push ${i + 2}`, 'whoosh', { len: 0.36, from: 500, to: 2600, pan: i % 2 ? -0.3 : 0.3 }]);
