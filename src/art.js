/* =====================================================================
   ART  (builds on rules.js)
   Every stone and portrait is an SVG string drawn in code. Shared with stone-sheet.js.
   Stones are drawn in a 100 x 100 box: the body is a rounded square from 15 to 85,
   and the spikes stand outside it. The gradients they use (art-skin, art-shade, ...) are
   in the <defs> of index.html.

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

/* ---------- Drawing helpers ----------
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
// A circle with a ragged edge of little tufts, for fur.
function shaggy(cx, cy, r, tufts, fill, strokeWidth = 2) {
  let d = '';
  for (let i = 0; i <= tufts * 2; i++) {
    const angle = (i / (tufts * 2)) * Math.PI * 2;
    const radius = i % 2 ? r + 1.8 : r - 0.4;
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(angle) * radius).toFixed(1)} ${(cy + Math.sin(angle) * radius).toFixed(1)} `;
  }
  return part(`${d}Z`, fill, strokeWidth);
}
const blush = (x, y, r = 2.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ff8aa8" opacity=".55"/>`;
const shine = (d, width = 1.6) => line(d, '#fff', width, 0.7);

/* ---------- Characters ----------
   One per piece, drawn in the stone's own 100 x 100 box as a bust that fills the stone's face: the head in the
   middle, the shoulders cut off by the bottom of the stone (drawStone clips them to the body). Every character keeps
   the silhouette of its chess piece: a kettle helmet, a horse's head, a slit mitre, battlements, a pearl coronet,
   a crown with a cross. */

const INK = '#1d1420';
const SKIN_LIGHT = '#f8d2b0';
const SKIN_BROWN = '#9a6040';
const PORCELAIN = '#f6f2ea';

// A big glossy eye: a dark oval with two glints.
function shinyEye(x, y, r = 2.6) {
  return `<ellipse cx="${x}" cy="${y}" rx="${r * 0.82}" ry="${r}" fill="${INK}"/>` +
    `<circle cx="${x + r * 0.32}" cy="${y - r * 0.4}" r="${r * 0.36}" fill="#fff"/>` +
    `<circle cx="${x - r * 0.3}" cy="${y + r * 0.45}" r="${r * 0.16}" fill="#fff" opacity=".8"/>`;
}
// A closed, smiling eye: an arch.
function happyEye(x, y, w = 3.4) {
  return line(`M${x - w} ${y + 1} Q${x} ${y - 2.6} ${x + w} ${y + 1}`, INK, 1.9);
}
// A round head with ears, its shading and a highlight.
function head(cx, cy, r, skin, { ears = true } = {}) {
  const earY = cy + r * 0.12;
  const earsSvg = ears ? ball(cx - r, earY, r * 0.24, skin, 2) + ball(cx + r, earY, r * 0.24, skin, 2) : '';
  return earsSvg + ball(cx, cy, r, skin, 2.4);
}
// Shoulders and chest from `top` down past the bottom of the stone, `width` wide at the bottom.
function shoulders(top, width, fill, neck = 10) {
  const left = 50 - width / 2;
  const right = 50 + width / 2;
  return part(`M${left} 90 Q${left + 1} ${top + 4} ${50 - neck} ${top} L${50 + neck} ${top} Q${right - 1} ${top + 4} ${right} 90 Z`, fill, 2.4);
}

const CHARACTERS = {
  // Tiny Tim, Tony, Tom and Ted: a nervous young foot soldier in a kettle helmet, clutching his spear
  pawn: `${line('M72 90 L74 30', INK, 4.6)}${line('M72 90 L74 30', '#a0703f', 2.6)}
${part('M74 18 L78.5 31 L69.5 31 Z', 'url(#art-metal)', 2)}
${shoulders(68, 52, '#c4572e')}
${part('M41 68 L50 76 L59 68 Z', '#e7b24a', 1.8)}${line('M50 76 V90', '#8f3a1c', 1.4, 0.8)}
${head(50, 54, 13.5, SKIN_LIGHT)}
<path d="M37 52 Q50 46 63 52 L63 55 Q50 49.5 37 55 Z" fill="#000" opacity=".16"/>
${part('M36 48 Q35.5 31 50 30.5 Q64.5 31 64 48 Z', 'url(#art-metal)', 2.2)}
${part('M27 48.5 Q50 40 73 48.5 Q74 52.5 69 52 Q50 45.5 31 52 Q26 52.5 27 48.5 Z', '#a7b0c2', 2.2)}
${shine('M40.5 42 Q41.5 35 48 33', 2)}${ball(50, 30.5, 2, '#a7b0c2', 1.4)}
${line('M41.5 55 L46.5 53.6 M58.5 55 L53.5 53.6', INK, 1.7)}${shinyEye(45, 58.4, 2.5)}${shinyEye(55, 58.4, 2.5)}
${line('M45.5 64.6 q1.5 -1.4 3 0 q1.5 1.4 3 0 q1 -1 2 0', INK, 1.5)}${blush(40.5, 62, 2.2)}${blush(59.5, 62, 2.2)}
<g fill="#c98a5e"><circle cx="41" cy="60.5" r=".55"/><circle cx="42.6" cy="61.6" r=".55"/><circle cx="59" cy="60.5" r=".55"/><circle cx="57.4" cy="61.6" r=".55"/></g>
<path d="M31 37 q3.6 4.6 0 7 q-3.6 -2.4 0 -7 Z" fill="#a9dcff" stroke="${INK}" stroke-width="1.2"/>`,

  // Neigh Nigel: a palomino war horse in profile, the chess knight's head, with a steel chamfron and a red plume
  knight: `<g transform="translate(9 19) scale(.82)">
${part('M74 90 Q66 70 68 56 Q72 42 64 30 Q58 22 52 21 L54 13 L46.5 19.5 L44 12 L40 21 Q30 25 25 36 L19 47 Q16 53 20 57 Q24 61 31 59 L39 56.5 Q42 60 41 66 L34 90 Z', '#f1d29b', 2.8)}
<path d="M36 58 Q46 52 52 60 Q50 72 44 90 L38 90 Q42 72 36 58 Z" fill="#000" opacity=".08"/>
${part('M52 21 Q63 22 68 32 Q74 38 71 46 Q78 52 73 60 Q79 67 74 74 Q79 82 76 90 L67 90 Q71 80 67 72 Q71 64 66 57 Q69 48 64 40 Q63 30 52 21 Z', '#7a3a1c', 2.6)}
${line('M58 26 Q65 30 66 38 M66 48 Q70 52 69 57 M69 66 Q72 70 71 74', '#a65a2c', 1.6)}
<ellipse cx="24" cy="51.5" rx="7.5" ry="6.5" fill="#e3b77c"/>
<ellipse cx="21.6" cy="50.2" rx="2.2" ry="1.6" fill="${INK}" transform="rotate(-25 21.6 50.2)"/>
${line('M23 57.5 Q27 58.5 31 57', INK, 1.8)}
${part('M41 20 L47 22.5 L33.5 46.5 L25 43 Z', 'url(#art-metal)', 2.2)}${line('M42 23.5 L32 42', '#fff', 1.6, 0.7)}
<circle cx="37.6" cy="32.6" r="1.7" fill="#e7b24a" stroke="${INK}" stroke-width=".9"/>
${line('M39 56.5 L33 47 M33 47 L46 42', INK, 4)}${line('M39 56.5 L33 47 M33 47 L46 42', '#b8452a', 2.2)}<circle cx="33" cy="47" r="2.2" fill="#e7b24a" stroke="${INK}" stroke-width="1"/>
<ellipse cx="50" cy="33.5" rx="5.2" ry="5.6" fill="#fff" stroke="${INK}" stroke-width="2"/>${shinyEye(49, 34.2, 3.4)}
${line('M44.4 27.2 Q49.6 24.6 55 27.6', INK, 2.2)}
${part('M47 18 Q47 6 60 3 Q55 9 56.5 13 Q61 8 67 9.5 Q59 14 54 21 Z', '#e0384a', 2.2)}
${line('M50.5 14 Q53 8 59 5.4', '#ff8a96', 1.4)}</g>`,

  // Bishop Bailey: a serene old bishop in the cleft mitre of the chess bishop, with a purple cope
  bishop: `${shoulders(70, 58, '#7d43c9')}
${line('M50 72 V90', '#e7b24a', 4.4)}${line('M43 80 H57', '#e7b24a', 3.6)}${line('M50 72 V90 M43 80 H57', INK, 0.8, 0.4)}
${part('M39 70 Q50 77 61 70 L60 74.5 Q50 81 40 74.5 Z', '#fbf4e4', 1.6)}
${head(50, 57, 12.5, SKIN_LIGHT)}
${part('M36.5 58 Q34 66 38.5 68 Q38 62 40 59 Z', '#eeeef3', 1.4)}${part('M63.5 58 Q66 66 61.5 68 Q62 62 60 59 Z', '#eeeef3', 1.4)}
${part('M37.5 50 Q35 30 50 12 Q65 30 62.5 50 Z', '#fbf4e4', 2.4)}
<path d="M50 12 Q65 30 62.5 50 L55 50 Q58 32 50 12 Z" fill="#000" opacity=".07"/>
${line('M58 22 L45.5 37.5', INK, 2.4)}
${line('M50 17 V47', '#e7b24a', 2.2, 0.9)}
${part('M37 47 Q50 44 63 47 L63 52 Q50 49 37 52 Z', 'url(#gold)', 1.8)}
<circle cx="50" cy="49.4" r="1.6" fill="#e0384a" stroke="${INK}" stroke-width=".7"/>
${line('M41.5 54.2 Q44.5 52.4 47.5 54.4 M52.5 54.4 Q55.5 52.4 58.5 54.2', '#eeeef3', 2.6)}
${happyEye(44.5, 58.6, 2.8)}${happyEye(55.5, 58.6, 2.8)}
${line('M45 64 Q50 68.4 55 64', INK, 1.8)}${blush(40.5, 62.5, 2.2)}${blush(59.5, 62.5, 2.2)}`,

  // Castle Carl: a living stone tower, battlements on his head, a pennant on top and a bristling moustache
  rook: `${line('M50 22 V7', INK, 2.6)}${line('M50 22 V7', '#a0703f', 1.2)}
${part('M50 7 L62 10.5 L50 14 Z', '#e7b24a', 1.6)}
${part('M30 90 L32.5 44 L67.5 44 L70 90 Z', '#bdb5a8', 2.4)}
<path d="M58 44 L67.5 44 L70 90 L61 90 Z" fill="#000" opacity=".12"/>
${part('M27.5 46 L27.5 22 L36 22 L36 29 L45 29 L45 22 L55 22 L55 29 L64 29 L64 22 L72.5 22 L72.5 46 Z', '#cfc8bb', 2.4)}
${line('M29 40 H71', '#a59d90', 1.3)}${line('M38.5 46 V40 M52 40 V34.5 M61.5 46 V40 M33 34.5 H43 M58 34.5 H68 M30.5 29 V34.5 M69.5 29 V34.5', '#a59d90', 1.2)}
${shine('M30 31 V24.5 H33.5', 1.5)}${shine('M47 31 V24.5 H52', 1.5)}
${line('M33.5 76 H66.5 M40 76 V84 M58 76 V84 M33 84 H67 M49 84 V90', '#9b9386', 1.3)}
${part('M37 50.5 Q42 47 47 50 L47 52.5 L37 53 Z M53 50 Q58 47 63 50.5 L63 53 L53 52.5 Z', '#6a6258', 1.6)}
<ellipse cx="42" cy="57" rx="4.4" ry="4.8" fill="#fff" stroke="${INK}" stroke-width="1.6"/><ellipse cx="58" cy="57" rx="4.4" ry="4.8" fill="#fff" stroke="${INK}" stroke-width="1.6"/>
${shinyEye(42.6, 57.6, 2.6)}${shinyEye(57.4, 57.6, 2.6)}
${part('M50 64 Q44 61.5 38 64.5 Q33 66 31 70 Q36 69.5 40 70 Q45 70 50 67 Q55 70 60 70 Q64 69.5 69 70 Q67 66 62 64.5 Q56 61.5 50 64 Z', '#6b3f22', 2)}
${line('M42 66 Q45 65 47.5 66.2 M52.5 66.2 Q55 65 58 66', '#9a6038', 1.1)}
`,

  // Duchess Dagger: a sly duchess with flowing auburn hair, a lace collar and a pearl coronet, her dagger raised
  queen: `${part('M33 74 Q25 60 31 47 L45 66 Z', '#fff8f0', 1.8)}${part('M67 74 Q75 60 69 47 L55 66 Z', '#fff8f0', 1.8)}
${line('M32 52 L43 65 M30 60 L42 67 M68 52 L57 65 M70 60 L58 67', '#e2cfc4', 1.1)}
${part('M31 74 Q25 54 33 40 Q41 30 50 30 Q59 30 67 40 Q75 54 69 74 Q63 70 62 60 L38 60 Q37 70 31 74 Z', '#8a2e1e', 2.4)}
${line('M34 64 Q31 56 34 46 M66 64 Q69 56 66 46', '#b5452c', 1.4)}
${shoulders(71, 56, '#c63370', 8)}
${part('M42 71 L50 82 L58 71 Z', '#fde3c8', 1.4)}${ball(50, 79, 1.8, '#fff', 1)}
${head(50, 55, 12.2, SKIN_LIGHT, { ears: false })}
${part('M37.6 54 Q37 42 50 41.6 Q62 42 62.4 52 Q58 46 51 47.5 Q55 45 54 44 Q47 49 40 49.6 Q38.4 51 37.6 54 Z', '#8a2e1e', 1.8)}
${part('M37 43 L38.5 33 L43 38 L46.4 30.6 L50 37 L53.6 30.6 L57 38 L61.5 33 L63 43 Q50 40 37 43 Z', 'url(#gold)', 2)}
${[[38.5, 33], [46.4, 30.6], [53.6, 30.6], [61.5, 33]].map(([x, y]) => ball(x, y - 1.8, 1.9, '#fff', 1)).join('')}${ball(50, 34.6, 2, '#fff', 1)}
<circle cx="50" cy="40.2" r="1.6" fill="#e0384a" stroke="${INK}" stroke-width=".7"/>
${shinyEye(44.6, 57.8, 2.5)}${shinyEye(55.4, 57.8, 2.5)}
<path d="M41.4 56.6 Q44.6 54 47.8 56.6 L47.8 54.4 L41.4 54.4 Z M52.2 56.6 Q55.4 54 58.6 56.6 L58.6 54.4 L52.2 54.4 Z" fill="${SKIN_LIGHT}"/>
${line('M41 56.8 Q44.6 54.4 48.2 56.8 M51.8 56.8 Q55.4 54.4 59 56.8', INK, 2)}${line('M41 56.8 l-1.6 -1.2 M59 56.8 l1.6 -1.2', INK, 1.4)}
${line('M41.2 52 Q44.6 50.8 48 52.4 M52 51.4 Q55.6 49.4 59 51.2', INK, 1.5)}
<path d="M45.4 63 Q50 66.6 55.8 62 Q50 63.6 45.4 63 Z" fill="#d6204a" stroke="#8a1030" stroke-width="1.1"/>
<circle cx="57.8" cy="61" r=".9" fill="${INK}"/>${blush(41.2, 61.2, 2.1)}${blush(58.8, 61.6, 1.8)}
<g transform="rotate(14 70 70)">${part('M68.6 62 L68.6 38 L70.4 33.5 L72.2 38 L72.2 62 Z', 'url(#art-metal)', 1.8)}${line('M69.8 39 V60', '#fff', 1.1, 0.8)}
${part('M64 62 H76.8 V65.2 H64 Z', 'url(#gold)', 1.5)}${ball(70.4, 76.6, 2.1, '#e7b24a', 1.1)}
${part('M66.6 66 H74.2 Q75.6 66 75.6 67.6 V72.6 Q75.6 74.2 74.2 74.2 H66.6 Q65.2 74.2 65.2 72.6 V67.6 Q65.2 66 66.6 66 Z', SKIN_LIGHT, 1.8)}${line('M65.6 68.8 H70 M65.6 71.4 H70', '#c98a5e', 1)}</g>`,

  // King Kobe: a bearded king in an ermine collar under the cross-topped crown of the chess king
  king: `${shoulders(70, 64, '#b8263f', 12)}
${part('M24 80 Q30 70 50 74 Q70 70 76 80 L76 86 Q60 78 50 82 Q40 78 24 86 Z', '#fbfbf6', 2)}
<g fill="${INK}"><path d="M31 78 l1.2 2.6 l1.2 -2.6 z"/><path d="M44 77 l1.2 2.6 l1.2 -2.6 z"/><path d="M55 77 l1.2 2.6 l1.2 -2.6 z"/><path d="M67 78 l1.2 2.6 l1.2 -2.6 z"/></g>
${head(50, 54, 13.5, SKIN_BROWN)}
${part('M36.5 55 Q36 79 50 81 Q64 79 63.5 55 Q60 64 50 64 Q40 64 36.5 55 Z', '#2b1a12', 2.2)}
${line('M43 66 Q44 72 46 76 M50 66 V79 M57 66 Q56 72 54 76', '#5a3a26', 1.2)}
${part('M41 63.4 Q50 57.6 59 63.4 Q55 62.4 50 64 Q45 62.4 41 63.4 Z', '#2b1a12', 1.6)}
<ellipse cx="50" cy="60.2" rx="2.4" ry="1.7" fill="#7a4a30"/>
${line('M40.5 51 L47 52.6 M59.5 51 L53 52.6', INK, 2.4)}${shinyEye(44.6, 55.6, 2.3)}${shinyEye(55.4, 55.6, 2.3)}
${part('M34 44 L34 28 L41.5 34 L50 23.5 L58.5 34 L66 28 L66 44 Z', 'url(#gold)', 2.2)}
${part('M47.8 23.5 V18 H44.5 V14.5 H47.8 V11 H52.2 V14.5 H55.5 V18 H52.2 V23.5 Z', 'url(#gold)', 1.6)}
${part('M33 40 H67 V45.5 H33 Z', '#e2aa2e', 1.8)}
<circle cx="50" cy="42.8" r="2.1" fill="#4aa3ff" stroke="${INK}" stroke-width=".8"/><circle cx="40.5" cy="42.8" r="1.6" fill="#3cc47a" stroke="${INK}" stroke-width=".8"/><circle cx="59.5" cy="42.8" r="1.6" fill="#3cc47a" stroke="${INK}" stroke-width=".8"/>
<circle cx="50" cy="32" r="2.2" fill="#e0384a" stroke="${INK}" stroke-width=".8"/>${shine('M37 39 V31.5', 1.5)}`,

  // Venom Veronica: a coiled cobra with her hood spread, long lashes, violet lips and a forked tongue
  venom_veronica: `${part('M16 90 Q15 78 28 76 L72 76 Q85 78 84 90 Z', '#4fae4a', 2.4)}
${part('M22 84 Q22 74 34 72 L66 72 Q78 74 78 84 Q66 80 50 81 Q34 80 22 84 Z', '#5cc456', 2.2)}
${line('M30 74 l-2 6 M40 72.6 l-1 7 M60 72.6 l1 7 M70 74 l2 6 M24 85 l-1 5 M76 85 l1 5', '#2f7a2c', 1.4)}
${part('M50 25 Q72 27 75 47 Q76 63 64 71 L36 71 Q24 63 25 47 Q28 27 50 25 Z', '#3f9a3c', 2.4)}
${part('M50 31 Q66 33 68 48 Q68 60 60 67 L40 67 Q32 60 32 48 Q34 33 50 31 Z', '#a8e07a', 1.4)}
${line('M38 54 Q40 46 45 44 M62 54 Q60 46 55 44', '#3f9a3c', 2.2)}<circle cx="45" cy="44" r="1.8" fill="#3f9a3c"/><circle cx="55" cy="44" r="1.8" fill="#3f9a3c"/>
${part('M44 56 H56 V74 H44 Z', '#f3ecc0', 1.8)}${line('M44 61 H56 M44 66 H56 M44 71 H56', '#cfc58a', 1.2)}
${part('M37 42 Q37 30 50 29.5 Q63 30 63 42 Q63 52 56 57 Q50 60 44 57 Q37 52 37 42 Z', '#6fd05c', 2.4)}
<path d="M50 29.5 Q63 30 63 42 Q63 52 56 57 Q53 58.6 50 59 Q59 50 58 40 Q57 32 50 29.5 Z" fill="#000" opacity=".1"/>
<ellipse cx="44.4" cy="41.6" rx="4" ry="4.4" fill="#ffe14a" stroke="${INK}" stroke-width="1.6"/><ellipse cx="44.6" cy="41.8" rx="1.1" ry="3.4" fill="${INK}"/>
<ellipse cx="55.6" cy="41.6" rx="4" ry="4.4" fill="#ffe14a" stroke="${INK}" stroke-width="1.6"/><ellipse cx="55.4" cy="41.8" rx="1.1" ry="3.4" fill="${INK}"/>
<circle cx="45.8" cy="40" r=".9" fill="#fff"/><circle cx="57" cy="40" r=".9" fill="#fff"/>
${line('M40.6 39.6 Q44.4 36.4 48.4 38.6 M51.6 38.6 Q55.6 36.4 59.4 39.6', INK, 2)}
${line('M40.8 39.4 l-2.8 -1.4 M41.8 38 l-2 -2.6 M43.6 37.2 l-.8 -3 M59.2 39.4 l2.8 -1.4 M58.2 38 l2 -2.6 M56.4 37.2 l.8 -3', INK, 1.4)}
<g fill="#2f7a2c"><ellipse cx="48" cy="48.6" rx=".8" ry="1.1"/><ellipse cx="52" cy="48.6" rx=".8" ry="1.1"/></g>
<path d="M44 52 Q50 56.4 56 52 Q50 53.6 44 52 Z" fill="#9b3fd0" stroke="#5a1d82" stroke-width="1.3" stroke-linejoin="round"/>
${line('M50 54.6 V60 M50 60 l-2 2.4 M50 60 l2 2.4', INK, 2.6)}${line('M50 54.6 V60 M50 60 l-2 2.4 M50 60 l2 2.4', '#e0384a', 1.3)}
<path d="M46 53.4 L46.8 56.6 L47.8 53.8" fill="#fff" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"/>
<path d="M46.8 57.6 q1 1.6 0 2.6 q-1 -1 0 -2.6 Z" fill="#c8ff6a" stroke="${INK}" stroke-width=".7"/>`,

  // Experienced Edna: a granny with a bun, big round glasses and a lilac cardigan, holding her bottle of cure
  experienced_edna: `${shoulders(70, 56, '#9a7ac0')}
${part('M38 70 Q50 79 62 70 L60.5 75 Q50 82 39.5 75 Z', '#fbfbf6', 1.5)}${ball(50, 79, 1.8, '#e7b24a', 1)}
${line('M37 80 V90 M63 80 V90', '#7c5ca6', 1.3)}${[83, 87].map((y) => `<circle cx="46" cy="${y}" r="1" fill="#e6d8f5"/>`).join('')}
${part('M35 54 Q32 38 44 34.5 Q50 33 56 34.5 Q68 38 65 54 Q60 44 50 44 Q40 44 35 54 Z', '#e8e6ef', 2.2)}
${ball(50, 30, 6.5, '#e8e6ef', 2)}${line('M46 27.6 Q50 25.6 54 27.6 M45.5 31 Q50 33.4 54.5 31', '#b6b4c2', 1.1)}
${head(50, 56, 13, SKIN_LIGHT)}
${part('M37.5 52.5 Q38 43.5 46 42.5 Q44 47.5 41 49 Q45 47 49 43 Q52 47 58 48 Q55.5 45 54.5 42.6 Q62 44 62.5 52.5 Q58 47.5 50 47.5 Q42 47.5 37.5 52.5 Z', '#e8e6ef', 1.6)}
<circle cx="44" cy="56" r="5.4" fill="#eaf6ff" fill-opacity=".55" stroke="#9b6a3a" stroke-width="1.8"/><circle cx="56" cy="56" r="5.4" fill="#eaf6ff" fill-opacity=".55" stroke="#9b6a3a" stroke-width="1.8"/>
${line('M49.4 55.6 Q50 54.6 50.6 55.6', '#9b6a3a', 1.6)}${shinyEye(44, 56.4, 2.6)}${shinyEye(56, 56.4, 2.6)}
${line('M40.6 52.2 l2 .6 M59.4 52.2 l-2 .6', '#fff', 1, 0.9)}
${line('M37.6 60 l2 -.6 M37.8 62.4 l2 -1 M62.4 60 l-2 -.6 M62.2 62.4 l-2 -1', '#c78f68', 1)}
${line('M45.5 64 Q50 67.4 54.5 64', INK, 1.7)}${blush(40, 62.5, 2.1)}${blush(60, 62.5, 2.1)}
${part('M68 66 H76 V69 L78 72 V87 Q78 89 76 89 H68 Q66 89 66 87 V72 L68 69 Z', '#d9f0ff', 1.8)}
<path d="M66.9 76 H77.1 V87 Q77.1 88 76 88 H68 Q66.9 88 66.9 87 Z" fill="#6ee06a"/>
${part('M68.2 61 H75.8 V66 H68.2 Z', '#b07a48', 1.5)}
<rect x="68.5" y="77.5" width="7" height="7" rx="1" fill="#fff" stroke="${INK}" stroke-width=".8"/>${line('M72 79 V83 M70 81 H74', '#2fa043', 1.6)}
${shine('M68 72.5 V75', 1.2)}${ball(66.5, 82, 3.4, SKIN_LIGHT, 1.8)}`,

  // Empress Edna: the same granny crowned: ermine, a tall jewelled crown, emerald eyes and a serpent necklace
  empress_edna: `${shoulders(70, 62, '#5b2aa0', 11)}
${part('M25 80 Q32 70 50 75 Q68 70 75 80 L75 86 Q60 79 50 83 Q40 79 25 86 Z', '#fbfbf6', 2)}
<g fill="${INK}"><path d="M32 78 l1.2 2.6 l1.2 -2.6 z"/><path d="M45 78.4 l1.2 2.6 l1.2 -2.6 z"/><path d="M56 78.4 l1.2 2.6 l1.2 -2.6 z"/><path d="M66 78 l1.2 2.6 l1.2 -2.6 z"/></g>
${line('M40 72.5 Q45 77 50 73 Q55 77 60 72.5', INK, 3.4)}${line('M40 72.5 Q45 77 50 73 Q55 77 60 72.5', '#4fd06a', 2)}${ball(50, 75.5, 2.3, '#4fd06a', 1.2)}<circle cx="50.6" cy="74.9" r=".7" fill="#fff"/>
${part('M35 55 Q33 42 50 41 Q67 42 65 55 Q60 47 50 47 Q40 47 35 55 Z', '#e8e6ef', 2.2)}
${head(50, 57, 12.5, SKIN_LIGHT)}
${part('M38 53 Q39 46 50 46 Q61 46 62 53 Q56 49.5 50 49.5 Q44 49.5 38 53 Z', '#e8e6ef', 1.6)}
${part('M35 44 L33.5 28 L40 33.5 L44 24 L50 31 L56 24 L60 33.5 L66.5 28 L65 44 Z', 'url(#gold)', 2.2)}
${part('M34.5 40 H65.5 V45.5 H34.5 Z', '#e2aa2e', 1.8)}
<circle cx="50" cy="42.8" r="2.1" fill="#4fd06a" stroke="${INK}" stroke-width=".8"/><circle cx="41" cy="42.8" r="1.5" fill="#9b3fd0" stroke="${INK}" stroke-width=".7"/><circle cx="59" cy="42.8" r="1.5" fill="#9b3fd0" stroke="${INK}" stroke-width=".7"/>
${[[33.5, 28], [44, 24], [56, 24], [66.5, 28]].map(([x, y]) => ball(x, y, 1.7, '#4fd06a', 1)).join('')}${shine('M37.5 40 V33', 1.5)}
<circle cx="44.2" cy="57.6" r="5.2" fill="#eaffea" fill-opacity=".4" stroke="#e2aa2e" stroke-width="1.8"/><circle cx="55.8" cy="57.6" r="5.2" fill="#eaffea" fill-opacity=".4" stroke="#e2aa2e" stroke-width="1.8"/>
${line('M49.4 57.2 Q50 56.2 50.6 57.2', '#e2aa2e', 1.6)}
<ellipse cx="44.2" cy="58" rx="2.4" ry="2.8" fill="#2fb84a"/><ellipse cx="55.8" cy="58" rx="2.4" ry="2.8" fill="#2fb84a"/>${shinyEye(44.2, 58, 1.5)}${shinyEye(55.8, 58, 1.5)}
${line('M40.6 54.6 Q44 52.8 47.6 54.6 M52.4 54.6 Q56 52.8 59.4 54.6', INK, 1.4)}
${line('M45 64.8 Q50 67.4 55.6 63.6', '#9b1d3a', 1.9)}${blush(40.4, 63.2, 2)}${blush(59.6, 63.2, 2)}`,

  // Brittle Bernard: a porcelain prince with a tilted crown, cracked all over and patched with a plaster
  brittle_bernard: `${shoulders(70, 56, '#3b8fd6')}
${part('M36 72 L42 70 L68 90 L60 90 Z', '#f2c14e', 1.6)}${ball(51, 79, 2.4, '#e0384a', 1.1)}
${line('M38 80 V90', '#2a6ea8', 1.3)}${line('M60 72 L58 78 L61 81', INK, 1.2, 0.7)}
${part('M35.5 55 Q33 39 50 38 Q67 39 64.5 55 Q61 46 50 45.5 Q39 46 35.5 55 Z', '#f2c14e', 2.2)}
${head(50, 56, 13, PORCELAIN)}
${part('M37 53 Q37 43.5 50 43 Q63 43.5 63 53 Q60 48 55 49 L53 46.5 L50 49 L46 46.5 L43 49.5 Q39 48.5 37 53 Z', '#f2c14e', 1.6)}
<g transform="rotate(-16 50 38)">${part('M40 42 L41 31 L45.5 36 L50 28.5 L54.5 36 L59 31 L60 42 Z', 'url(#gold)', 1.8)}${line('M42.5 41 L44.5 38 L46.5 41.5', '#8a5a00', 1, 0.8)}</g>
${line('M59 44 L56.5 49.5 L59 53 L56 58 M56.5 49.5 L53.6 50', '#6a5a66', 1.2)}
${line('M38.4 58 L41.5 60.6 L40.4 64 M41.5 60.6 L44 61', '#6a5a66', 1.1)}
${line('M41 53 Q44 50.6 47.4 52 M52.6 52 Q56 50.6 59 53', INK, 1.6)}
<ellipse cx="44.4" cy="56.6" rx="3.6" ry="4" fill="#fff" stroke="${INK}" stroke-width="1.3"/><ellipse cx="55.6" cy="56.6" rx="3.6" ry="4" fill="#fff" stroke="${INK}" stroke-width="1.3"/>
${shinyEye(44.6, 57.4, 1.9)}${shinyEye(55.4, 57.4, 1.9)}
<ellipse cx="50" cy="64.6" rx="2.2" ry="2.6" fill="#7a2030" stroke="${INK}" stroke-width="1.2"/>
<circle cx="40.6" cy="61.6" r="2.6" fill="#ff8aa8" opacity=".7"/><circle cx="59.4" cy="61.6" r="2.6" fill="#ff8aa8" opacity=".7"/>
<g transform="rotate(-30 61 61)"><rect x="57" y="59" width="8" height="4" rx="1.4" fill="#f2c8a0" stroke="${INK}" stroke-width="1"/><g fill="#c49a70"><circle cx="60" cy="60.4" r=".4"/><circle cx="62" cy="60.4" r=".4"/><circle cx="60" cy="61.8" r=".4"/><circle cx="62" cy="61.8" r=".4"/></g></g>
<path d="M33 46 q3.4 4.2 0 6.6 q-3.4 -2.4 0 -6.6 Z" fill="#a9dcff" stroke="${INK}" stroke-width="1.1"/>`,

  // Hairy Harambe: a huge silverback with a crested head, a heavy brow and the pawnbroker's gold chain
  hairy_harambe: `${shaggy(50, 98, 34, 26, '#58525f', 2.4)}
${line('M24 76 l-3 3 M30 70 l-2.4 3.6 M70 70 l2.4 3.6 M76 76 l3 3', '#a7a3b0', 1.8)}${line('M27 73 l-2 3.4 M73 73 l2 3.4', '#a7a3b0', 1.4)}
${line('M36 80 Q50 88 64 80', INK, 3.2)}${line('M36 80 Q50 88 64 80', '#f3c54a', 1.8)}${part('M47 83 H53 V88 H47 Z', 'url(#gold)', 1.2)}
${shaggy(50, 52, 19, 22, '#58525f', 2.4)}${line('M34 42 Q38 36 44 34', '#9d97a8', 1.8)}
${part('M38 37 Q44 26 50 25 Q56 26 62 37 Q56 33 50 33 Q44 33 38 37 Z', '#58525f', 2)}
${part('M35 54 Q34 40 50 39.5 Q66 40 65 54 Q66 63 61 69 Q56 74 50 74 Q44 74 39 69 Q34 63 35 54 Z', '#8a7a76', 2.2)}
<path d="M50 39.5 Q66 40 65 54 Q66 63 61 69 Q56 74 50 74 Q59 64 58 52 Q57 42 50 39.5 Z" fill="#000" opacity=".12"/>
${part('M35.5 47 Q42 42 50 45 Q58 42 64.5 47 L64 51 Q57 47 50 50 Q43 47 36 51 Z', '#2a2530', 1.8)}
<circle cx="43.4" cy="52.8" r="2.8" fill="#d8923a" stroke="${INK}" stroke-width="1.1"/><circle cx="56.6" cy="52.8" r="2.8" fill="#d8923a" stroke="${INK}" stroke-width="1.1"/>
${shinyEye(43.4, 53, 1.7)}${shinyEye(56.6, 53, 1.7)}
${part('M42 60 Q50 55 58 60 Q60 66 50 68 Q40 66 42 60 Z', '#5f504c', 1.8)}
<ellipse cx="46.8" cy="61" rx="1.6" ry="1.2" fill="${INK}"/><ellipse cx="53.2" cy="61" rx="1.6" ry="1.2" fill="${INK}"/>
${line('M45 70.6 Q50 69 55 70.6', INK, 1.8)}${line('M40 57 l2 1.4 M60 57 l-2 1.4', '#5f504c', 1.1)}`,

  // Buzzy Beatrice: a cheerful beekeeper in her wide hat, a striped scarf and her bees about her
  buzzy_beatrice: `${shoulders(70, 56, '#f4ecd2')}
${line('M50 76 V90', '#b8aa82', 1.5)}<g fill="#b8aa82"><circle cx="48" cy="80" r=".9"/><circle cx="48" cy="86" r=".9"/></g>
${part('M38 70 Q50 78 62 70 L63 75 Q50 83 37 75 Z', '#f3c23a', 1.8)}${line('M41.5 72.6 L40.4 77 M47 74.6 L46.6 79 M53 74.6 L53.4 79 M58.5 72.6 L59.6 77', INK, 2.2)}
${part('M34 54 Q34 66 38 72 L33 70 Q30 62 31 54 Z M66 54 Q66 66 62 72 L67 70 Q70 62 69 54 Z', '#8a4e26', 1.6)}
${head(50, 56, 13, '#f2c39a')}
${part('M37 55 Q37 45 50 44.5 Q63 45 63 55 Q57 49 52 50 Q55 47 53 46.5 Q48 50 41 50.5 Q39 52 37 55 Z', '#8a4e26', 1.6)}
${part('M24 45 Q50 33 76 45 Q78 48.5 72 48.6 Q50 41 28 48.6 Q22 48.5 24 45 Z', '#efe3bd', 2.2)}
${part('M37 43 Q37 31 50 30 Q63 31 63 43 Q50 39.6 37 43 Z', '#efe3bd', 2.2)}${line('M37.6 40.8 Q50 37.4 62.4 40.8', '#b8aa82', 1.6)}${shine('M41 37 Q42 33 47 32', 1.4)}
${happyEye(44.4, 56.6, 2.8)}${happyEye(55.6, 56.6, 2.8)}
<path d="M44 62 Q50 68.4 56 62 Q50 63.6 44 62 Z" fill="#c43a4a" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
<g fill="#c47a4e"><circle cx="40.8" cy="60" r=".6"/><circle cx="42.8" cy="61" r=".6"/><circle cx="41" cy="62.2" r=".6"/><circle cx="59.2" cy="60" r=".6"/><circle cx="57.2" cy="61" r=".6"/><circle cx="59" cy="62.2" r=".6"/></g>
${blush(39.6, 61, 2.2)}${blush(60.4, 61, 2.2)}
${[[72, 60, 1], [27, 64, 0.85], [75, 76, 0.75]].map(([x, y, size]) => `<g transform="translate(${x} ${y}) scale(${size})"><ellipse cx="-1.6" cy="-5" rx="3.4" ry="2.3" fill="#fff" fill-opacity=".9" stroke="${INK}" stroke-width=".9"/><ellipse cx="1.8" cy="-4.6" rx="2.8" ry="2" fill="#fff" fill-opacity=".9" stroke="${INK}" stroke-width=".9"/><ellipse rx="5.2" ry="3.8" fill="#ffd34d" stroke="${INK}" stroke-width="1.4"/><path d="M-1.4 -3.6 V3.6 M1.8 -3.4 V3.4" stroke="${INK}" stroke-width="1.6"/><path d="M5.2 0 l2.2 0" stroke="${INK}" stroke-width="1.1"/><circle cx="-3.4" cy="-.8" r=".8" fill="${INK}"/></g>`).join('')}`,

  // His Hovering Holiness: a beaming pope in a mitre with flying goggles, a jet pack roaring on his back
  his_hovering_holiness: `${part('M21 54 Q21 50 25 50 H31 Q34 50 34 54 V76 H21 Z', 'url(#art-metal)', 2)}${part('M66 54 Q66 50 69 50 H75 Q79 50 79 54 V76 H66 Z', 'url(#art-metal)', 2)}
<rect x="21" y="60" width="13" height="3" fill="#e0384a"/><rect x="66" y="60" width="13" height="3" fill="#e0384a"/>
<path d="M21.6 76 Q22 84 27.5 92 Q33 84 33.4 76 Z M66.6 76 Q67 84 72.5 92 Q78 84 78.4 76 Z" fill="#ff8a2a" stroke="#c0400e" stroke-width="1.2"/>
<path d="M24 76 Q24.4 81.5 27.5 86 Q30.6 81.5 31 76 Z M69 76 Q69.4 81.5 72.5 86 Q75.6 81.5 76 76 Z" fill="#ffe66a"/>
${shoulders(70, 50, '#fbfbf6', 9)}
${part('M33 78 Q36 69 50 69 Q64 69 67 78 Q58 74 50 76 Q42 74 33 78 Z', '#d42a3e', 2)}
${line('M50 76 V90 M45 81 H55', INK, 4.4)}${line('M50 76 V90 M45 81 H55', '#e7b24a', 2.6)}
${head(50, 58, 12, SKIN_LIGHT)}
${part('M38 52 Q36 30 50 13 Q64 30 62 52 Z', '#fbfbf6', 2.4)}
<path d="M50 13 Q64 30 62 52 L55 52 Q58 32 50 13 Z" fill="#000" opacity=".07"/>
${line('M50 20 V36 M45 25.6 H55', '#e7b24a', 2.6)}
${line('M37 47 H63', INK, 4.6)}${line('M37 47 H63', '#6b4423', 2.6)}
${ball(44, 46.6, 4.6, '#c8e8ff', 2)}${ball(56, 46.6, 4.6, '#c8e8ff', 2)}<circle cx="44" cy="46.6" r="4.6" fill="none" stroke="#c8902a" stroke-width="1.4"/><circle cx="56" cy="46.6" r="4.6" fill="none" stroke="#c8902a" stroke-width="1.4"/>
${shine('M41.6 45 Q42.4 43.2 44.4 43', 1.3)}${shine('M53.6 45 Q54.4 43.2 56.4 43', 1.3)}
${happyEye(45, 57.6, 2.8)}${happyEye(55, 57.6, 2.8)}
<path d="M44.4 62 Q50 69.6 55.6 62 Q50 63.4 44.4 62 Z" fill="#9a1d2e" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/><path d="M46.6 65 Q50 67.4 53.4 65 Q50 64.4 46.6 65 Z" fill="#ff8a96"/>
${blush(40.6, 61.6, 2.2)}${blush(59.4, 61.6, 2.2)}`,

  // What is left of Brittle Bernard: a heap of black rubble, his little gold crown broken on top
  debris: `<ellipse cx="50" cy="80" rx="31" ry="5" fill="#000" opacity=".35"/>
${part('M22 76 L26 58 L36 50 L46 54 L54 44 L66 48 L76 60 L79 76 Q50 84 22 76 Z', '#2c2c33', 2.2)}
<path d="M26 58 L36 50 L40 64 Z" fill="#3e3e48"/><path d="M54 44 L66 48 L58 62 L46 54 Z" fill="#383842"/><path d="M58 62 L76 60 L79 76 L62 78 Z" fill="#1d1d22"/>
${line('M36 50 L40 64 L46 54 M40 64 L58 62 L54 44 M58 62 L62 78 M40 64 L36 80 M58 62 L76 60', '#4c4c58', 1.4)}
${part('M30 72 L35 66 L42 70 L38 77 Z', '#34343c', 1.6)}${part('M62 70 L69 67 L72 74 L64 76 Z', '#34343c', 1.6)}
<g transform="rotate(20 54 42)">${part('M44 47 L45.5 34 L50.5 39.5 L55 31 L58 38 L58 47 Z', 'url(#gold)', 1.8)}${line('M58 38 L55.4 42 L58.4 45', '#8a5a00', 1.2)}<circle cx="49" cy="43" r="1.5" fill="#e0384a" stroke="${INK}" stroke-width=".7"/></g>
<g fill="#4c4c58"><circle cx="20" cy="80" r="1.8"/><circle cx="82" cy="79" r="1.5"/><circle cx="78" cy="83" r="1.1"/></g>`,
};

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

// The round well in the stone's face that the character stands in: a deep shade of the owner's colour, darker
// at the rim, with a lit lower edge.
function drawWell(owner) {
  const { light } = SPIKE_COLOURS[owner];
  return `<circle cx="50" cy="50" r="28" fill="url(#well-${BODY_GRADIENTS[owner].slice(5)})"/>
<path d="M27 62 A26.5 26.5 0 0 0 73 62" fill="none" stroke="${light}" stroke-width="1.4" stroke-linecap="round" opacity=".45"/>
<circle cx="50" cy="50" r="28" fill="none" stroke="#000" stroke-width="1.6" opacity=".35"/>`;
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
${drawWell(owner)}<g clip-path="url(#art-clip)">${CHARACTERS[stone.type]}</g></svg>`;
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
