/* =====================================================================
   STONE SHEET
   An HTML sheet of every stone at every level, drawn with the game's own code and rated by its spikes.
   Run it from anywhere: node stone-sheet.js  (writes stones.html in the current folder, prints the ratings)
   ===================================================================== */

const fs = require('fs');
const path = require('path');

const read = (file) => fs.readFileSync(path.join(__dirname, file), 'utf8');
const gradients = read('index.html').match(/<defs>[\s\S]*?<\/defs>/)[0];
const { PIECES, makeStone, drawStone } = new Function(
  `${read('src/rules.js')}\n${read('src/art.js')}\nreturn { PIECES, makeStone, drawStone };`,
)();

const TYPES = Object.keys(PIECES).filter((type) => type !== 'debris'); // every piece but debris, chess pieces first
const LEVELS = [1, 2, 3, 4, 5];
const YOU = 0;

// Every spike is worth 5 points, so 5 spikes on all four sides (20 spikes) make 100.
function rating(type, level) {
  return makeStone(type, level, YOU).spikes.reduce((sum, count) => sum + count, 0) * 5;
}

function picture(type, level, direction = 0) {
  return drawStone(makeStone(type, level, YOU, direction), YOU, { className: '' });
}

const capitalised = (text) => text[0].toUpperCase() + text.slice(1);

function levelTile(type, level) {
  const piece = PIECES[type];
  const spikes = piece.goldenShields ? 'golden shields' : makeStone(type, level, YOU).spikes.join(' · ');
  const score = piece.goldenShields ? '' : `<div class="score"><b>${rating(type, level)}</b>/100</div>`;
  const label = piece.hasNoLevels ? 'Always' : `Level ${level}`;
  return `<div class="level-tile"><div class="picture">${picture(type, level)}</div><div class="level-label">${label}</div><div class="spike-list">${spikes}</div>${score}</div>`;
}

function section(type) {
  const piece = PIECES[type];
  const levels = piece.hasNoLevels ? [1] : LEVELS;
  let html = `<section><div class="heading"><h2>${piece.name}</h2><span class="chess">${piece.chess || 'rare stone'}</span>
<p>${capitalised(piece.description)}.</p></div><div class="levels">`;
  html += levels.map((level) => levelTile(type, level)).join('');
  html += '</div>';
  if (piece.namesByDirection) {
    const turns = piece.namesByDirection.map(
      (name, direction) => `<div class="turn-tile">${picture(type, 1, direction)}<small>${name}</small></div>`,
    );
    html += `<div class="turns"><span>Four turns, all rated the same:</span>${turns.join('')}</div>`;
  }
  return html + '</section>';
}

let sections = '';
let rareHeadingShown = false;
for (const type of TYPES) {
  if (!rareHeadingShown && !PIECES[type].chess) {
    sections += `<h1 class="part">Rare stones</h1><p class="intro">Each rare stone belongs to one opponent, who always plays it and may offer it when you win. They grow by their own table instead of one spike per side.</p>`;
    rareHeadingShown = true;
  }
  sections += section(type);
}

const growing = TYPES.filter((type) => !PIECES[type].hasNoLevels);
const table = growing
  .map(
    (type) =>
      `<tr><td>${PIECES[type].name}</td>${LEVELS.map((level) => `<td>${rating(type, level)}</td>`).join('')}</tr>`,
  )
  .join('');

const STYLE = `@page { size: A4; margin: 14mm; }
body { font-family: Nunito, system-ui, sans-serif; color: #1d2433; margin: 0; font-size: 12px; }
h1 { font-family: Fredoka; font-size: 26px; margin: 0 0 4px; }
h2 { font-family: Fredoka; font-size: 18px; margin: 0; }
h1.part { break-before: page; margin-top: 0; }
.intro { color: #4a5468; margin: 0 0 10px; line-height: 1.45; }

/* the ratings table */
table { border-collapse: collapse; margin: 6px 0 14px; font-size: 12px; }
td, th { border: 1px solid #d6dbe6; padding: 3px 10px; text-align: center; }
td:first-child, th:first-child { text-align: left; }
th { background: #eef1f7; font-family: Fredoka; font-weight: 600; }

/* one section per piece: its name, then a tile per level, then its four turns */
section { break-inside: avoid; border: 1px solid #d6dbe6; border-radius: 10px; padding: 10px 12px; margin: 0 0 10px; }
.heading { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.heading p { margin: 0; color: #4a5468; width: 100%; }
.chess { color: #7a8396; font-family: Fredoka; }
.levels { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 8px; }
.level-tile { text-align: center; }
.picture { width: 78px; height: 78px; margin: 6px auto 2px; }
.picture svg, .turn-tile svg { width: 100%; height: 100%; overflow: visible; }
.level-label { font-family: Fredoka; font-weight: 600; }
.spike-list { color: #7a8396; font-size: 11px; }
.score { font-family: Fredoka; font-size: 13px; }
.score b { font-size: 20px; color: #2e6fba; }
.turns { display: flex; align-items: center; gap: 14px; margin-top: 6px; color: #4a5468; }
.turn-tile { width: 46px; text-align: center; margin: 4px; }
.turn-tile svg { height: 40px; }
.turn-tile small { display: block; font-size: 9.5px; white-space: nowrap; }
`;

fs.writeFileSync(
  'stones.html',
  `<!doctype html><html><head><meta charset="utf-8"><title>Rook-like: every stone</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;700&display=swap" rel="stylesheet">
<style>${STYLE}</style></head><body><svg width="0" height="0" style="position:absolute">${gradients}</svg>
<h1>Rook-like: every stone</h1>
<p class="intro">The six chess pieces at levels 1 to 5, facing up, with their spikes listed as top · right · bottom · left. The rating out of 100 counts spikes: every spike is worth 5 points, so a stone with the maximum of 5 spikes on all four sides (20 spikes) scores 100. King Kobe has no spikes but golden shields: every spike that touches him breaks and he is never taken. The rating counts spikes only, not the powers of the rare stones.</p>
<table><tr><th>stone</th><th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Lv 5</th></tr>${table}</table>
${sections}</body></html>`,
);
console.log(growing.map((type) => `${type}: ${LEVELS.map((level) => rating(type, level)).join(' ')}`).join('\n'));
