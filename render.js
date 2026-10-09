// usage: node render.js outDir startFrame endFrame   (env S = scale, FPS)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [outDir, a, b] = process.argv.slice(2);
  const fps = parseInt(process.env.FPS || '24'), scale = process.env.S || '1';
  fs.mkdirSync(outDir, { recursive: true });
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await br.newPage({ viewport: { width: 1280, height: 720 } });
  p.on('pageerror', e => { console.log('[pageerror]', e.message); process.exit(1); });
  await p.goto('file://' + path.resolve('main.html') + '?s=' + scale + (process.env.SHORT === '1' ? '&short=1' : ''));
  const t0 = Date.now();
  for (let f = parseInt(a); f < parseInt(b); f++) {
    const url = await p.evaluate(t => { window.renderFrame(t); return window.frameJPEG(0.92); }, f / fps);
    fs.writeFileSync(path.join(outDir, String(f).padStart(5, '0') + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
    if ((f - a) % 48 === 0) console.log(`chunk ${a}-${b}: frame ${f} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
  await br.close();
})();
