// Balance harness: a bot plays every map at every difficulty and reports how far it gets.
// The bot places towers for maximum road coverage, upgrades steadily and fires Meteor/Freeze
// when enemies close in. A decent human should beat it.
// Run: NODE_PATH=$(npm root -g) node tests/balance.js ['{"hpExp":1.09}']   (optional TUNE overrides)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const overrides = JSON.parse(process.argv[2] || '{}');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 411, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../index.html'));
  await p.waitForTimeout(300);
  const res = await p.evaluate(overrides => {
    const n = window.__nb; Object.assign(n.TUNE, overrides);
    const COLS = 9, ROWS = 14, ORDER = ['pulse', 'mortar', 'cryo', 'pulse', 'arc', 'prism', 'mortar', 'rail', 'arc', 'prism'];
    const SPEC = { pulse: 'minigun', mortar: 'cluster', cryo: 'shatter', arc: 'storm', prism: 'solar', rail: 'piercer' };
    const upCost = t => { const c = n.TT[t.type].cost; return t.level === 1 ? Math.round(c * .75) : t.level === 2 ? Math.round(c * 1.25) : Math.round(c * 2.2); };
    function play(map, diff) {
      n.setSel(map, diff); n.startGame();
      const G = () => n.G, L0 = G().lives;
      const cover = (cx, cy, r) => { let s = 0; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (G().map.grid[y][x] === 1 && (x - cx) ** 2 + (y - cy) ** 2 <= r * r) s++; return s; };
      let k = 0, firstLeak = 0, guard = 0;
      while (!G().over && !(G().wave >= 30 && !G().spawnQ.length && !G().enemies.length) && guard++ < 400000) {
        if (!firstLeak && G().lives < L0) firstLeak = G().wave;
        for (let spent = true; spent;) {
          spent = false;
          const want = ORDER[k % ORDER.length];
          const t = G().towers.filter(t => t.level < 4).sort((a, b) => a.spent - b.spent)[0];
          if (t && G().towers.length >= 4 + G().wave / 2 && G().gold >= upCost(t)) { n.upgrade(t, t.level === 3 ? SPEC[t.type] : undefined); spent = true; continue; }
          if (G().gold >= n.TT[want].cost) {
            let best = null, bs = -1;
            for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (G().map.grid[y][x] === 0 && !G().towers.some(t => t.cx === x && t.cy === y)) { const s = cover(x, y, n.TT[want].range); if (s > bs) { bs = s; best = [x, y]; } }
            if (best) { n.placeTower(want, best[0], best[1]); k++; spent = true; }
          }
        }
        // abilities: meteor the densest pack past halfway, freeze when something nears the core
        const en = G().enemies;
        if (G().ab.meteor.cd <= 0 && en.length) {
          let best = null, bc = 2;
          for (const e of en) { if (e.d < e.path.total * .5) continue; const c = en.filter(o => (o.x - e.x) ** 2 + (o.y - e.y) ** 2 < 2.5).length + (e.b.boss ? 5 : 0); if (c > bc) { bc = c; best = e; } }
          if (best) n.castMeteor(best.x, best.y);
        }
        if (G().ab.freeze.cd <= 0 && en.some(e => e.path.total - e.d < 3)) n.castFreeze();
        if (!G().spawnQ.length && !G().enemies.length) n.callWave();
        for (let i = 0; i < 30; i++) n.update(1 / 60);
      }
      return { map: G().map.def.name, diff: n.DIFFS[diff].name, result: G().over ? 'lost at wave ' + G().wave : 'WON', lives: G().lives + '/' + L0, firstLeak };
    }
    const out = [];
    for (let d = 0; d < n.DIFFS.length; d++) for (let m = 0; m < 4; m++) out.push(play(m, d));
    return out;
  }, overrides);
  for (const r of res) console.log(r.diff.padEnd(7), r.map.padEnd(11), r.result.padEnd(16), 'lives', r.lives.padEnd(6), 'first leak w' + r.firstLeak);
  if (errs.length) console.log('errors', errs);
  await b.close();
})();
