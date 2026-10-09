// usage: node still.js out.png t [scale]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
(async () => {
  const [out, ...ts] = process.argv.slice(2);
  const scale = process.env.S || '1';
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  p.on('console', m => console.log('[page]', m.text()));
  p.on('pageerror', e => console.log('[pageerror]', e.message));
  await p.goto('file://' + path.resolve('main.html') + '?s=' + scale + (process.env.SHORT === '1' ? '&short=1' : ''));
  for (let i = 0; i < ts.length; i++) {
    const t = parseFloat(ts[i]);
    await p.evaluate(t => window.renderFrame(t), t);
    const url = await p.evaluate(() => window.frameJPEG(0.95));
    const f = ts.length > 1 ? out.replace('.', `_${i}.`) : out;
    require('fs').writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
    console.log('wrote', f);
  }
  await b.close();
})();
