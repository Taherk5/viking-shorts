// usage: node concept.js out.png [scale]
const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const path = require('path'), fs = require('fs');
(async () => {
  const out = process.argv[2], sc = process.argv[3] || '1.5';
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
  p.on('console', m => console.log('[page]', m.text())); p.on('pageerror', e => console.log('[pageerror]', e.message));
  await p.goto('file://' + path.resolve('concept.html') + '?s=' + sc);
  await p.evaluate(() => window.draw(0.4));
  fs.writeFileSync(out, Buffer.from((await p.evaluate(() => window.shot())).split(',')[1], 'base64')); console.log('wrote', out); await b.close();
})();
