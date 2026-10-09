// Smoke test: every tower and specialisation deals damage, enemies are drawn, no page errors.
// Run with: NODE_PATH=$(npm root -g) node tests/smoke.js   (needs Playwright + Chromium)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 411, height: 900 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../index.html'));
  await p.waitForTimeout(500);
  await p.click('#play-btn');
  // 1. every tower type (and every spec) deals damage
  const dmg = await p.evaluate(() => {
    const n = window.__nb, out = {};
    for (const type of Object.keys(n.TT)) for (const spec of [null, ...n.TT[type].specs.map(s => s.id)]) {
      n.startGame(); const G = n.G; G.gold = 99999; G.autoT = -1;
      n.placeTower(type, 2, 4);          // next to Switchback's road
      const t = G.towers[0];
      if (spec) { n.upgrade(t); n.upgrade(t); n.upgrade(t, spec); }
      G.wave = 2; n.callWave();          // grunts + scouts (ground)
      for (let i = 0; i < 60 * 25; i++) n.update(1 / 60);
      out[type + (spec ? '/' + spec : '')] = Math.round(t.dealt);
    }
    return out;
  });
  console.log('damage dealt by each tower:', JSON.stringify(dmg));
  const zero = Object.entries(dmg).filter(([k, v]) => v <= 0);
  console.log(zero.length ? 'FAIL: no damage from ' + zero.map(z => z[0]).join(', ') : 'PASS: every tower and spec deals damage');
  // 2. an enemy is actually drawn
  await p.evaluate(() => { const n = window.__nb; n.startGame(); n.G.autoT = -1; n.callWave(); for (let i = 0; i < 60 * 3; i++) n.update(1 / 60); });
  await p.waitForTimeout(200);
  const vis = await p.evaluate(() => {
    const n = window.__nb, e = n.G.enemies[0]; n.G.paused = true;
    const cv = document.querySelector('#cv'), c = cv.getContext('2d');
    const r = cv.getBoundingClientRect(), dpr = cv.width / r.width;
    const cell = Math.min((r.width - 8) / 9, (r.height - 8) / 14), ox = (r.width - cell * 9) / 2, oy = (r.height - cell * 14) / 2;
    const px = Math.round((ox + e.x * cell) * dpr), py = Math.round((oy + e.y * cell) * dpr);
    const d = c.getImageData(px - 20, py - 20, 40, 40).data; let bright = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 250) bright++;
    return { enemies: n.G.enemies.length, r: e.r, brightPixels: bright };
  });
  console.log('enemy render check:', JSON.stringify(vis), vis.brightPixels > 40 ? 'PASS' : 'FAIL');
  
  console.log('errors', errs);
  const failed = zero.length > 0 || vis.brightPixels <= 40 || errs.length > 0;
  await b.close();
  process.exit(failed ? 1 : 0);
})();
