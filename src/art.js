/* =====================================================================
   ART  (builds on rules.js)
   Every stone and portrait is an SVG string drawn in code. Shared with stone-sheet.js.
   Stones are drawn in a 100 x 100 box: the body is a rounded square from 15 to 85, the spikes stand outside it,
   and the character is a pixel-art portrait in a window in the middle. The gradients they use (gold, art-shade, ...)
   and the window's clip are in the <defs> of index.html.

   Contents: colours · drawing helpers · characters · stones · opponent portraits
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
const OUTLINE = '#2a1e1a';
const SKIN = 'url(#art-skin)';

/* ---------- Drawing helpers for the portraits ----------
   part() and ball() fill a shape, darken its right side with the art-shade gradient, then outline it,
   so every piece of clothing and fur gets the same soft light from the upper left. */

function part(d, fill, strokeWidth = 2) {
  return `<path d="${d}" fill="${fill}"/><path d="${d}" fill="url(#art-shade)"/>` +
    `<path d="${d}" fill="none" stroke="${OUTLINE}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`;
}
function ball(cx, cy, r, fill, strokeWidth = 2) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#art-shade)"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${OUTLINE}" stroke-width="${strokeWidth}"/>`;
}
// A pupil with a glint.
function eye(x, y, r = 1.8) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${OUTLINE}"/><circle cx="${x + r * 0.4}" cy="${y - r * 0.4}" r="${r * 0.38}" fill="#fff"/>`;
}
// A thin line in any colour (folds, strands, stitching).
function line(d, colour, width = 1.2, opacity = 1) {
  return `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`;
}
const blush = (x, y, r = 2.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ff8aa8" opacity=".55"/>`;
const shine = (d, width = 1.6) => line(d, '#fff', width, 0.7);

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
   Drawn in a 100 x 100 box, shown in a circle. Each has a small scene behind it and a vignette on top. */

const VIGNETTE = '<rect width="100" height="100" fill="url(#art-vignette)"/>';

const PORTRAITS = {
  // a monocled gentleman in his wood-panelled study
  pete: `<rect width="100" height="100" fill="#6b5a3e"/>
${[0, 20, 40, 60, 80].map((x) => `<rect x="${x + 1}" y="0" width="18" height="100" fill="#7a6748"/><rect x="${x + 4}" y="8" width="12" height="36" rx="2" fill="none" stroke="#5a4a32" stroke-width="1.5"/>`).join('')}
<rect x="0" y="52" width="100" height="4" fill="#4a3c28"/>
${part('M10 100 Q14 72 50 68 Q86 72 90 100Z', '#3a2f2a', 2.5)}
<path d="M38 70 L50 100 L30 100 Q30 80 38 70 Z M62 70 L50 100 L70 100 Q70 80 62 70 Z" fill="#2a2220"/>
<path d="M42 70 L50 86 L58 70Z" fill="#fff" stroke="${OUTLINE}" stroke-width="1.5"/><path d="M40 78 L50 75 L60 78 L60 85 L50 81 L40 85Z" fill="#c43c3c" stroke="${OUTLINE}" stroke-width="1.5"/><circle cx="50" cy="80" r="2" fill="#a02c2c"/>
<ellipse cx="25" cy="48" rx="4" ry="6" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/><ellipse cx="75" cy="48" rx="4" ry="6" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
<ellipse cx="50" cy="46" rx="25" ry="28" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2.5"/><ellipse cx="42" cy="25" rx="10" ry="4" fill="#fff" opacity=".4"/>
<path d="M26 40 Q24 30 30 26 M74 40 Q76 30 70 26" fill="none" stroke="#a8a8a8" stroke-width="5" stroke-linecap="round"/>
${line('M33 36 Q40 33 46 36', '#5a3a22', 3)}${line('M54 36 Q60 33 67 36', '#5a3a22', 3)}
${eye(40, 44, 3)}<circle cx="60" cy="44" r="8" fill="rgba(200,230,255,.35)" stroke="#e0a92e" stroke-width="2.5"/>${eye(60, 44, 3)}<path d="M55 40 q3 -3 6 -2" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8"/>
<path d="M68 47 Q74 60 70 72" stroke="#e0a92e" stroke-width="1.5" fill="none"/>
<path d="M47 46 Q50 54 53 52" fill="none" stroke="#c9875a" stroke-width="2" stroke-linecap="round"/>
${part('M30 60 Q38 52 50 58 Q62 52 70 60 Q66 64 62 60 Q56 62 50 61 Q44 62 38 60 Q34 64 30 60Z', '#5a3a22', 1.5)}
${line('M44 66 Q50 68 56 66', OUTLINE, 1.6)}${VIGNETTE}`,

  // a knight in a visored helm before a castle wall
  neigh: `<rect width="100" height="100" fill="#3d5470"/>
${[0, 1, 2, 3, 4, 5].map((r) => [0, 1, 2, 3, 4, 5].map((c) => `<rect x="${c * 20 - (r % 2) * 10 + 1}" y="${r * 17 + 1}" width="18" height="15" rx="2" fill="#46607e"/>`).join('')).join('')}
${part('M14 100 Q16 76 50 72 Q84 76 86 100Z', '#8a96a8')}
${line('M24 86 Q50 80 76 86 M20 94 Q50 88 80 94', '#6a768a', 1.5)}<g fill="#c8d0dc"><circle cx="30" cy="84" r="1.5"/><circle cx="50" cy="81" r="1.5"/><circle cx="70" cy="84" r="1.5"/></g>
<path d="M50 8 Q66 -2 78 16 Q72 12 66 14 Q74 18 76 26 Q66 16 56 16Z" fill="#e0304e" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round"/>${line('M56 12 Q64 8 72 14 M58 15 Q66 13 72 20', '#a01d35', 1.2)}
${part('M26 72 L26 36 Q26 14 50 14 Q74 14 74 36 L74 72 Z', 'url(#art-metal)', 2.5)}
<path d="M30 40 H70 V48 H30Z" fill="#1a2030" stroke="${OUTLINE}" stroke-width="1.5"/><path d="M50 14 V40 M50 48 V72" stroke="#8a96a8" stroke-width="3"/>
${line('M30 36 H70', '#6f7a8e', 1.6)}${shine('M32 32 Q33 22 42 18', 2.4)}
<g fill="#1a2030"><circle cx="38" cy="58" r="1.8"/><circle cx="44" cy="62" r="1.8"/><circle cx="56" cy="62" r="1.8"/><circle cx="62" cy="58" r="1.8"/><circle cx="38" cy="65" r="1.8"/><circle cx="62" cy="65" r="1.8"/></g>
<g fill="#6f7a8e"><circle cx="29.5" cy="52" r="1.6"/><circle cx="70.5" cy="52" r="1.6"/><circle cx="29.5" cy="66" r="1.6"/><circle cx="70.5" cy="66" r="1.6"/></g>
<circle cx="40" cy="44" r="2.4" fill="#ffe08a"/><circle cx="60" cy="44" r="2.4" fill="#ffe08a"/><circle cx="40" cy="44" r="5" fill="#ffe08a" opacity=".25"/><circle cx="60" cy="44" r="5" fill="#ffe08a" opacity=".25"/>${VIGNETTE}`,

  // a hooded snake charmer in shades, her pet viper on her shoulder
  swerve: `<rect width="100" height="100" fill="#5b3d75"/>
${[18, 46, 74].map((x, i) => `<path d="M${x} 0 Q${x + 8} 12 ${x} 24 Q${x - 8} 36 ${x} 48" fill="none" stroke="#6d4b8a" stroke-width="5" opacity="${0.6 + i * 0.1}"/>`).join('')}
${ball(50, 20, 18, '#a23ec6', 2.5)}
${part('M20 60 Q18 28 50 26 Q82 28 80 60 Q76 76 70 90 L30 90 Q24 76 20 60Z', '#a23ec6', 2.5)}
${[30, 40, 50, 60, 70].map((x) => `<path d="M${x - 4} 34 q4 4 8 0" fill="none" stroke="#7e2a9e" stroke-width="1.4"/>`).join('')}
${part('M18 100 Q22 80 50 78 Q78 80 82 100Z', '#f3c54a')}${line('M30 88 Q50 84 70 88', '#c89a2a', 1.6)}
<ellipse cx="50" cy="54" rx="20" ry="23" fill="#d9a07a" stroke="${OUTLINE}" stroke-width="2.5"/>
<path d="M30 46 H70 L68 54 Q60 58 54 52 H46 Q40 58 32 54Z" fill="#14141c" stroke="${OUTLINE}" stroke-width="1.5"/><path d="M34 48 L42 48 M58 48 L62 48" stroke="#fff" stroke-width="2" opacity=".6"/>
<path d="M36 51 l4 -3 M60 51 l4 -3" stroke="#9fd8ff" stroke-width="1.2" opacity=".6"/>
<path d="M42 66 Q50 72 58 66 Q50 69 42 66Z" fill="#c0304e" stroke="#801a30" stroke-width="1.5"/><circle cx="66" cy="60" r="3" fill="#ff8aa8" opacity=".45"/>
<path d="M76 98 Q90 88 84 76 Q78 66 86 58" fill="none" stroke="${OUTLINE}" stroke-width="8" stroke-linecap="round"/><path d="M76 98 Q90 88 84 76 Q78 66 86 58" fill="none" stroke="#5fb24a" stroke-width="5" stroke-linecap="round"/>
<path d="M76 98 Q90 88 84 76 Q78 66 86 58" fill="none" stroke="#2f6e27" stroke-width="5" stroke-dasharray="2 3" opacity=".6"/>
${ball(88, 54, 5.5, '#6cc153', 1.8)}<ellipse cx="89.5" cy="52.6" rx="1.2" ry="1.4" fill="#ffe14a" stroke="${OUTLINE}" stroke-width=".5"/>${line('M93 56 l3 1 l1.6 -1.6 M96 57 l1.6 1.4', '#e0304e', 1)}${VIGNETTE}`,

  // a pixel brawler against a blocky hedge
  barb: `<rect width="100" height="100" fill="#3e6b4a"/>
${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((r) => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((c) => (r * 7 + c * 3) % 5 === 0).map((c) => `<rect x="${c * 10}" y="${r * 10}" width="10" height="10" fill="${(r + c) % 2 ? '#4a7a55' : '#35603f'}"/>`).join('')).join('')}
<rect x="18" y="80" width="64" height="20" fill="#d9c13a" stroke="${OUTLINE}" stroke-width="2.5"/><rect x="18" y="80" width="64" height="4" fill="#f0dc6a"/><rect x="70" y="84" width="12" height="16" fill="#b8a02a"/>
<rect x="44" y="84" width="12" height="16" fill="#b8a02a"/>
<rect x="24" y="20" width="52" height="58" fill="#e8b590" stroke="${OUTLINE}" stroke-width="2.5"/><rect x="66" y="30" width="10" height="48" fill="#cf9a72"/><rect x="28" y="54" width="6" height="6" fill="#f2c9a6"/>
<rect x="24" y="14" width="52" height="16" fill="#e0603a" stroke="${OUTLINE}" stroke-width="2.5"/><rect x="24" y="30" width="8" height="18" fill="#e0603a"/><rect x="68" y="30" width="8" height="18" fill="#e0603a"/>
<rect x="26" y="16" width="10" height="4" fill="#f08a5a"/><rect x="50" y="16" width="8" height="4" fill="#f08a5a"/><rect x="64" y="22" width="10" height="6" fill="#b8482a"/>
<rect x="32" y="40" width="14" height="10" fill="#cfe8ff" fill-opacity=".35" stroke="${OUTLINE}" stroke-width="3"/><rect x="54" y="40" width="14" height="10" fill="#cfe8ff" fill-opacity=".35" stroke="${OUTLINE}" stroke-width="3"/><path d="M46 44 H54" stroke="${OUTLINE}" stroke-width="3"/>
<rect x="37" y="43" width="5" height="5" fill="${OUTLINE}"/><rect x="58" y="43" width="5" height="5" fill="${OUTLINE}"/><rect x="38" y="43" width="2" height="2" fill="#fff"/><rect x="59" y="43" width="2" height="2" fill="#fff"/>
<rect x="46" y="52" width="8" height="6" fill="#cf9a72"/>
<rect x="38" y="62" width="24" height="5" fill="#8a3a2a"/><rect x="34" y="58" width="5" height="5" fill="#8a3a2a"/><rect x="61" y="58" width="5" height="5" fill="#8a3a2a"/>
<rect x="30" y="56" width="4" height="4" fill="#f08a8a" opacity=".6"/><rect x="66" y="56" width="4" height="4" fill="#f08a8a" opacity=".6"/>${VIGNETTE}`,

  // a dreamy diva in a feather boa under sparkling lights
  lux: `<rect width="100" height="100" fill="#7a3550"/>
<circle cx="50" cy="40" r="44" fill="#a04870" opacity=".5"/>
${[[14, 16, 2.2], [84, 12, 1.8], [90, 40, 1.4], [8, 46, 1.6], [24, 6, 1.2], [72, 4, 1.3]].map(([x, y, r]) => `<path d="M${x} ${y - r * 3} L${x + r} ${y} L${x} ${y + r * 3} L${x - r} ${y} Z M${x - r * 3} ${y} L${x} ${y + r} L${x + r * 3} ${y} L${x} ${y - r} Z" fill="#ffd6ea"/>`).join('')}
${part('M18 76 Q14 30 50 20 Q86 30 82 76 Q70 66 70 50 L30 50 Q30 66 18 76Z', '#2a1a24', 2.5)}
${line('M26 66 Q22 44 34 30 M74 66 Q78 44 66 30 M30 70 Q28 56 32 48', '#5a3a4c', 1.6)}${shine('M36 28 Q46 22 58 24', 2.4)}
<path d="M10 100 Q14 78 30 80 Q40 86 50 82 Q60 86 70 80 Q86 78 90 100Z" fill="#ff8ac4" stroke="${OUTLINE}" stroke-width="2"/>
<g fill="#ffb6dc" stroke="#e070a8" stroke-width="1"><circle cx="16" cy="88" r="6"/><circle cx="26" cy="84" r="6"/><circle cx="36" cy="89" r="6"/><circle cx="64" cy="89" r="6"/><circle cx="74" cy="84" r="6"/><circle cx="84" cy="88" r="6"/></g>
${line('M14 86 l3 -2 M28 82 l2 -2.5 M72 82 l-2 -2.5 M86 86 l-3 -2', '#fff', 1.2, 0.7)}
<ellipse cx="50" cy="52" rx="20" ry="24" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2.5"/>
<circle cx="31" cy="62" r="2.4" fill="#ffd34d" stroke="${OUTLINE}" stroke-width="1"/><circle cx="69" cy="62" r="2.4" fill="#ffd34d" stroke="${OUTLINE}" stroke-width="1"/>
<path d="M36 46 q5 4 10 0 q-5 -2 -10 0 Z M54 46 q5 4 10 0 q-5 -2 -10 0 Z" fill="#a050a0" opacity=".45"/>
${line('M36 48 q5 4 10 0 M54 48 q5 4 10 0', OUTLINE, 2.4)}${line('M36 48 l-3 -3 M38 49 l-2 -4 M64 48 l3 -3 M62 49 l2 -4', OUTLINE, 1.6)}
${blush(35, 58, 4)}${blush(65, 58, 4)}
<path d="M43 64 Q50 70 57 64 Q50 61 43 64Z" fill="#e0304e" stroke="#a01d35" stroke-width="1.2"/>${shine('M46 64.4 q2 -1 4 -.6', 1)}<circle cx="62" cy="64" r="1.6" fill="${OUTLINE}"/>${VIGNETTE}`,

  // a grinning card sharp in a flat cap, a fan of cards behind him
  gambit: `<rect width="100" height="100" fill="#4a4a52"/>
<rect x="0" y="62" width="100" height="38" fill="#2f6b45"/>${line('M0 62 H100', '#1f4a30', 2)}
${[[-30, 14], [-12, 30], [8, 72], [26, 88]].map(([a, x]) => `<g transform="rotate(${a} ${x} 40)"><rect x="${x - 9}" y="24" width="18" height="26" rx="2.5" fill="#fbfbf6" stroke="${OUTLINE}" stroke-width="1.5"/><path d="M${x} 32 l3 4 l-3 4 l-3 -4 z" fill="${a < 0 ? '#e0304e' : '#2a2a2a'}"/></g>`).join('')}
${part('M14 100 Q16 76 50 72 Q84 76 86 100Z', '#6b4a2a')}${line('M50 74 V100 M38 76 L44 100 M62 76 L56 100', '#4a3018', 1.4)}<g fill="#f3c54a" stroke="${OUTLINE}" stroke-width=".6"><circle cx="47" cy="84" r="1.4"/><circle cx="47" cy="92" r="1.4"/></g>
<ellipse cx="50" cy="50" rx="24" ry="27" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2.5"/>
<g fill="#8a6a5a" opacity=".5">${[[36, 66], [40, 70], [46, 72], [54, 72], [60, 70], [64, 66], [42, 74], [58, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9"/>`).join('')}</g>
${part('M22 34 Q28 14 52 14 Q76 16 80 30 L86 34 Q60 30 22 36Z', '#7a7a6a', 2.5)}
${line('M30 26 Q50 18 74 26 M26 32 Q52 26 82 32', '#5a5a4c', 1.2)}<circle cx="52" cy="16" r="2" fill="#5a5a4c" stroke="${OUTLINE}" stroke-width="1"/>
${line('M34 40 L44 42 M56 38 L66 36', OUTLINE, 2.5)}${eye(40, 47, 2.8)}${line('M56 47 q4 -3 8 0', OUTLINE, 2.4)}
<path d="M48 50 Q50 56 53 55" fill="none" stroke="#c9875a" stroke-width="2" stroke-linecap="round"/>
<path d="M34 60 Q50 76 68 58 Q50 66 34 60Z" fill="#fff" stroke="${OUTLINE}" stroke-width="2"/><rect x="54" y="61" width="5" height="5" fill="url(#gold)" stroke="${OUTLINE}" stroke-width="1"/>${VIGNETTE}`,

  // the shadow monarch, glowing eyes under a spiked crown, stars behind
  boss: `<rect width="100" height="100" fill="#140d1e"/>
${[[12, 14], [86, 20], [20, 48], [80, 56], [50, 6], [92, 84], [8, 80], [64, 12]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 0.9 : 1.4}" fill="#e2b6ff" opacity="${i % 2 ? 0.5 : 0.85}"/>`).join('')}
<circle cx="50" cy="56" r="44" fill="url(#art-glow)"/>
${[0, 30, 60, 90, 120, 150].map((a) => `<path d="M50 56 L48 4 L52 4 Z" fill="#9b5de5" opacity=".12" transform="rotate(${a} 50 56)"/><path d="M50 56 L48 4 L52 4 Z" fill="#9b5de5" opacity=".12" transform="rotate(${a + 180} 50 56)"/>`).join('')}
<path d="M12 100 Q16 74 50 70 Q84 74 88 100Z" fill="#2a1f38" stroke="#9b5de5" stroke-width="2"/>
${line('M28 84 Q50 78 72 84 M22 94 Q50 86 78 94', '#4a3466', 1.6)}
<path d="M26 74 Q22 40 50 34 Q78 40 74 74 Q62 84 50 84 Q38 84 26 74Z" fill="#241a30" stroke="#9b5de5" stroke-width="2.5"/>
<path d="M50 34 Q78 40 74 74 Q62 84 50 84 Q66 70 64 50 Q60 38 50 34Z" fill="#000" opacity=".25"/>
<circle cx="41" cy="55" r="8" fill="#c78bff" opacity=".35"/><circle cx="59" cy="55" r="8" fill="#c78bff" opacity=".35"/>
<path d="M36 52 L46 56 L36 58Z M64 52 L54 56 L64 58Z" fill="#f2deff"/>
<path d="M40 70 L44 66 L48 70 L52 66 L56 70 L60 66" stroke="#c78bff" stroke-width="2" fill="none"/>
<path d="M18 38 L18 8 L30 22 L40 2 L50 18 L60 2 L70 22 L82 8 L82 38 Z" fill="#1c1428" stroke="#e2b6ff" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M18 32 H82" stroke="#9b5de5" stroke-width="2"/>${line('M22 28 L22 14 M42 12 L44 20', '#e2b6ff', 1.2, 0.5)}
<g fill="#c78bff"><circle cx="30" cy="27" r="3"/><circle cx="50" cy="25" r="4"/><circle cx="70" cy="27" r="3"/></g>
<g fill="#fff"><circle cx="51" cy="24" r="1.2"/><circle cx="30.8" cy="26.2" r=".8"/><circle cx="70.8" cy="26.2" r=".8"/></g>${VIGNETTE}`,
};

function drawPortrait(opponent) {
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${PORTRAITS[opponent.portrait]}</svg>`;
}
