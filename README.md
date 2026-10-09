# Neon Bastion

A neon tower defense game built for phones. It runs in any browser and installs to your home screen. It's one HTML file with no build step and no dependencies.

## Play

- **On your phone:** open the hosted page in Chrome, then use ⋮ → **Add to Home screen**. It launches fullscreen in portrait and works offline after the first load.
- **Locally:** open `index.html` in a browser, or serve the folder (`python3 -m http.server`) to get the offline/install features.

### Hosting on GitHub Pages
The repo includes `.github/workflows/pages.yml`. To turn it on, go to **Settings → Pages → Build and deployment → Source: GitHub Actions**. Each push then deploys to `https://<user>.github.io/<repo>/`. (Pages on a private repo needs a paid GitHub plan. Otherwise make the repo public.)

## How it plays

- **4 battlefields:** Switchback, Twin Gates (two portals), Crossroads (the road crosses itself, so towers at the junction hit enemies twice), and Maelstrom (a spiral).
- **3 difficulties:** Casual, Normal, Brutal. Each map shows a star for every difficulty you've cleared.
- **30 waves,** then an optional endless mode that keeps getting harder.

### Towers
Each tower has 3 levels, then a choice between two specialisations:

| Tower | Role | Specialisations |
|---|---|---|
| Pulse | Fast single target, hits air | **Minigun** (2.6× fire rate) / **Seeker** (long range, crits) |
| Mortar | Splash, ground only | **Cluster** (bomblets) / **Napalm** (burning ground) |
| Cryo | Slows, hits air | **Blizzard** (freezing aura) / **Shatter** (chilled enemies take +40% damage) |
| Arc | Chain lightning | **Storm** (8 chains) / **Overload** (stuns) |
| Prism | Beam that ramps up and ignores armor | **Splitter** (3 beams) / **Solar** (higher peak) |
| Rail | Huge range, pierces a line | **Lance** (pierces everything) / **Reaper** (executes low-HP enemies for bonus gold) |

### Enemies
Grunts, fast Scouts, flying Wisps (Mortars can't hit them), armored Brutes, Splitters that burst into shards, Wardens that heal their allies, Phantoms that cloak, and a **Colossus** boss every 10 waves that spawns escorts.

### Strategy layer
- **Targeting modes** per tower: First / Last / Strong / Close.
- **Call waves early** for bonus gold. Banked gold earns **5% interest** (max 30) when a wave is cleared.
- **Abilities:** a Meteor strike you aim yourself, and Time Freeze.
- Selling refunds 100% if the tower hasn't seen a wave yet, otherwise 70%.
- Waves start on a countdown (30s before wave 1, 20s between waves), or tap Start wave to go early. AUTO shortens the gap to 3s.
- 1×/2×/3× speed.

Sound is synthesised live with WebAudio (no audio files), and haptics use the Android vibration API.

## Testing
`tests/smoke.js` loads the game in headless Chromium and checks that every tower and specialisation deals damage, that enemies are actually drawn, and that the page throws no errors:

```
NODE_PATH=$(npm root -g) node tests/smoke.js
```

`tests/balance.js` has a bot play every map on every difficulty and reports how far it gets. The bot places towers for road coverage, upgrades and uses both abilities. Balance knobs live in the `TUNE` object in `index.html`, and you can try overrides without editing it:

```
NODE_PATH=$(npm root -g) node tests/balance.js '{"hpExp":1.095}'
```

## Ideas for next versions
- Persistent meta progression: earn crystals per run and unlock tower perks
- More maps, including a map editor and shareable map codes
- Hero unit you drag around the battlefield
- Daily challenge with a fixed seed and modifiers ("no Mortars", "double flyers")
- Wave preview showing the next wave's enemy types before you call it
- Save and resume mid-run
