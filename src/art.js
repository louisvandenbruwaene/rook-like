/* =====================================================================
   ART  (builds on rules.js)
   Every stone is an SVG string drawn in code, with a pixel-art character in it; every opponent is a pixel-art
   portrait. Shared with stone-sheet.js.
   Stones are drawn in a 100 x 100 box: the body is a rounded square from 15 to 85, the spikes stand outside it,
   and the character is a pixel-art portrait in a window in the middle. The gradients they use (gold, art-face, ...)
   and the window's clip are in the <defs> of index.html.

   Contents: colours · characters · stones · opponent portraits
   ===================================================================== */

/* ---------- Colours ---------- */

// Spike colours for YOU, OPPONENT and DEBRIS.
const SPIKE_COLOURS = [
  { light: '#bfe0ff', mid: '#5aa6f5', dark: '#123a6e' },
  { light: '#ffd0c4', mid: '#f06a55', dark: '#6e1a12' },
  { light: '#8a8a96', mid: '#55555f', dark: '#0b0b0e' },
];
// The stone bodies' gradients, in the <defs> of index.html, for YOU, OPPONENT and DEBRIS.
const BODY_GRADIENTS = ['body-you', 'body-opponent', 'body-debris'];

/* ---------- Characters ----------
   Every character is a pixel-art portrait, a 64 x 64 PNG in art/stones named after its piece (made with PixelLab).
   Each has one detail in its team's colour, in a blue copy <piece>-blue.png and a red copy <piece>-red.png next to
   it, made by art/team_colours.py; debris belongs to nobody and keeps the plain portrait. drawStone shows it in a dark
   window on the stone's face, pixels kept sharp. STONE_ART_FOLDER is where the PNGs are, relative to the page;
   stone-sheet.js points it at the files themselves. */

let STONE_ART_FOLDER = 'art/stones/';
const STONE_ART_SIZE = 64; // pixels on a side
const WINDOW = { x: 19, y: 19, size: 62 }; // where the portrait sits on the stone's 100 x 100 box

// Brittle Bernard's cracks, drawn over his portrait pixel by pixel: [x, y] in the portrait's own pixels.
// prettier-ignore
const CRACKS = {
  brittle_bernard: [[34, 17], [33, 18], [33, 19], [34, 20], [35, 21], [35, 22], [34, 23], [33, 23], [32, 24], [34, 24], [35, 25], [36, 26],
    [23, 29], [24, 30], [25, 30], [26, 31], [27, 32], [41, 25], [40, 26], [40, 27], [41, 28]],
};

function drawPixels(pixels, colour, dx = 0, dy = 0) {
  return pixels.map(([x, y]) => `<rect x="${x + dx}" y="${y + dy}" width="1" height="1" fill="${colour}"/>`).join('');
}

const TEAM_SUFFIXES = ['-blue', '-red', '']; // for YOU, OPPONENT and DEBRIS

// The portrait in its owner's colours, scaled from its own pixels onto the window, with any cracks on top.
function drawCharacter(type, owner) {
  const scale = WINDOW.size / STONE_ART_SIZE;
  const cracks = CRACKS[type]
    ? drawPixels(CRACKS[type], '#fff', 1, 0).replace(/fill="#fff"/g, 'fill="#fff" opacity=".45"') + drawPixels(CRACKS[type], '#3a2630')
    : '';
  return `<g transform="translate(${WINDOW.x} ${WINDOW.y}) scale(${scale})" shape-rendering="crispEdges">
<image href="${STONE_ART_FOLDER}${type}${TEAM_SUFFIXES[owner]}.png" width="${STONE_ART_SIZE}" height="${STONE_ART_SIZE}" style="image-rendering:pixelated"/>${cracks}</g>`;
}

/* ---------- Stones ---------- */

// One faceted spike pointing up from the base line to the tip: a light half and a dark half, a ridge glint.
// A breaking spike gets the class "breaking", which the page animates as it shatters.
function drawSpike({ x, base, tip, halfWidth, breaking, colours }) {
  const className = breaking ? ' class="breaking"' : '';
  const left = x - halfWidth;
  const right = x + halfWidth;
  return (
    `<g${className}>` +
    `<path d="M${left} ${base} L${x} ${tip} L${x} ${base}Z" fill="${colours.light}"/>` +
    `<path d="M${x} ${tip} L${right} ${base} L${x} ${base}Z" fill="${colours.mid}"/>` +
    `<path d="M${x - 0.6} ${base - 2} L${x - 0.6} ${tip + 4}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".75"/>` +
    `<path d="M${left} ${base} L${x} ${tip} L${right} ${base}" fill="none" stroke="${colours.dark}" stroke-width="1.8" stroke-linejoin="round"/>` +
    `</g>`
  );
}

// The rounded square with its shadow, a bevelled rim, a soft inner face and a sheen, in the owner's colour.
function drawStoneBody(owner) {
  const { dark, light } = SPIKE_COLOURS[owner];
  return `<rect x="15" y="19" width="70" height="70" rx="12" fill="${dark}"/>
<rect x="15" y="15" width="70" height="70" rx="12" fill="url(#${BODY_GRADIENTS[owner]})" stroke="${dark}" stroke-width="2.5"/>
<rect x="21" y="21" width="58" height="58" rx="8" fill="url(#art-face)"/>
<path d="M18.5 72 V28 Q18.5 18.5 28 18.5 H72" fill="none" stroke="${light}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
<path d="M81.5 28 V72 Q81.5 81.5 72 81.5 H28" fill="none" stroke="${dark}" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>
<rect x="18" y="18" width="64" height="64" rx="9" fill="url(#sheen)"/>
<path d="M24 34 Q26 24 36 22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".45"/>`;
}

// The dark window on the stone's face that the portrait sits in: a deep shade of the owner's colour, with an
// inner shadow along its top and a lit lower edge.
function drawWindow(owner) {
  const { light } = SPIKE_COLOURS[owner];
  const { x, y, size } = WINDOW;
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="9" fill="url(#well-${BODY_GRADIENTS[owner].slice(5)})"/>
<path d="M${x + 1} ${y + 12} V${y + 9} Q${x + 1} ${y + 1} ${x + 9} ${y + 1} H${x + size - 9}" fill="none" stroke="#000" stroke-width="2" opacity=".35"/>
<path d="M${x + 9} ${y + size - 0.6} H${x + size - 9}" stroke="${light}" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>`;
}

// A golden shield on each side, for King Kobe: a rivet at each end and a glint along the top.
function drawGoldenShields() {
  let shields = '';
  for (const side of SIDES) {
    shields += `<g transform="rotate(${side * 90} 50 50)"><rect x="25" y="5.5" width="50" height="10" rx="5" fill="url(#gold)" stroke="#8a5a00" stroke-width="2"/>` +
      `<path d="M31 8.4 H62" stroke="#fffbe0" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>` +
      `<circle cx="30" cy="10.5" r="1.6" fill="#b8860b" stroke="#8a5a00" stroke-width=".7"/><circle cx="70" cy="10.5" r="1.6" fill="#b8860b" stroke="#8a5a00" stroke-width=".7"/></g>`;
  }
  return shields;
}

// The spikes on one side, drawn on the top side and turned into place. Every spike has the same size, the size
// that lets MAX_LEVEL of them fit side by side; fewer spikes only sit further apart. breakingCount extra spikes
// are drawn breaking off.
const SPIKE_HALF_WIDTH = 6;
function drawSpikes(side, count, breakingCount, colours) {
  const total = count + breakingCount;
  if (total === 0) return '';
  let spacing = 2 * SPIKE_HALF_WIDTH;
  if (total === 4) spacing = 14.5;
  if (total <= 3) spacing = 18;
  const halfWidth = SPIKE_HALF_WIDTH;
  let spikes = '';
  for (let index = 0; index < total; index++) {
    const x = 50 + (index - (total - 1) / 2) * spacing;
    spikes += drawSpike({ x, base: 17, tip: 1, halfWidth, breaking: index >= count, colours });
  }
  return `<g transform="rotate(${side * 90} 50 50)">${spikes}</g>`;
}

// A whole stone: shields or spikes, the body, and the character on top.
// breakingSpikes[side] is the number of extra spikes on that side drawn breaking off.
function drawStone(stone, owner, { className = 'stone', breakingSpikes } = {}) {
  const colours = SPIKE_COLOURS[owner];
  let outside = PIECES[stone.type].goldenShields ? drawGoldenShields() : '';
  for (const side of SIDES) {
    const breakingCount = breakingSpikes ? breakingSpikes[side] : 0;
    outside += drawSpikes(side, stone.spikes[side], breakingCount, colours);
  }
  return `<svg class="${className}" viewBox="0 0 100 100" aria-hidden="true">${outside}${drawStoneBody(owner)}
${drawWindow(owner)}<g clip-path="url(#art-clip)">${drawCharacter(stone.type, owner)}</g></svg>`;
}

// The back of one of the opponent's hidden stones.
function drawHiddenStone() {
  return `<svg viewBox="0 0 100 100">${drawStoneBody(OPPONENT)}<text x="50" y="69" text-anchor="middle" font-family="Fredoka,system-ui" font-weight="700" font-size="44" fill="${SPIKE_COLOURS[OPPONENT].dark}" opacity=".5">?</text><text x="50" y="66" text-anchor="middle" font-family="Fredoka,system-ui" font-weight="700" font-size="44" fill="#ffe0d6" opacity=".9">?</text></svg>`;
}

/* ---------- Opponent portraits ----------
   Every opponent is an 80 x 80 pixel-art portrait with its own small scene, a PNG in art/opponents named after
   opponent.portrait (made with PixelLab), shown in a circle with its pixels kept sharp. */

const PORTRAIT_FOLDER = 'art/opponents/';

function drawPortrait(opponent) {
  return `<img src="${PORTRAIT_FOLDER}${opponent.portrait}.png" alt="">`;
}
