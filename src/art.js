/* =====================================================================
   ART  (builds on rules.js)
   Every stone and portrait is an SVG string drawn in code. Shared with stone-sheet.js.
   Stones are drawn in a 100 x 100 box: the body is a rounded square from 15 to 85, the spikes stand outside it,
   and the character is an ivory cameo set in the middle. The gradients they use (cameo-ivory, gold, art-shade, ...)
   and the cameo's clip are in the <defs> of index.html.

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
   Every character is a cameo: a bust in profile, looking left, carved in ivory relief on the stone's coloured
   well, with gold inlay for crowns and crosses. drawStone clips the bust to the well and sets a gold bezel round it.
   Each one keeps the mark of its chess piece: a kettle helmet, a horse's head, a mitre, a mural crown of
   battlements, a pearl coronet, a crown with a cross. */

// A raised shape: its cast shadow, the ivory, shade toward the lower right, a lit upper edge and a carved outline.
function relief(d) {
  return `<path d="${d}" fill="#000" opacity=".42" transform="translate(.9 1.4)"/><path d="${d}" fill="url(#cameo-ivory)"/>` +
    `<path d="${d}" fill="url(#cameo-shade)"/>` +
    `<path d="${d}" fill="none" stroke="#fffdf6" stroke-width=".8" opacity=".75" transform="translate(-.35 -.45)"/>` +
    `<path d="${d}" fill="none" stroke="#8f7c5a" stroke-width=".6" opacity=".75"/>`;
}
// Gold inlaid in the ivory.
function inlay(d) {
  return `<path d="${d}" fill="#000" opacity=".35" transform="translate(.6 .9)"/><path d="${d}" fill="url(#gold)" stroke="#8a5a00" stroke-width=".6" stroke-linejoin="round"/>`;
}
// A line cut into the ivory: a dark groove with a lit lower lip.
function carve(d, width = 0.9) {
  return `<path d="${d}" fill="none" stroke="#8a7656" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="#fffaf0" stroke-width="${width * 0.55}" stroke-linecap="round" stroke-linejoin="round" opacity=".7" transform="translate(.45 .55)"/>`;
}
// A round stone set in the ivory: a pearl, or a green gem for the poisoners.
function bead(cx, cy, r, fill = 'url(#cameo-ivory)') {
  return `<circle cx="${cx + 0.5}" cy="${cy + 0.8}" r="${r}" fill="#000" opacity=".35"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="#8f7c5a" stroke-width=".5"/>` +
    `<circle cx="${cx - r * 0.35}" cy="${cy - r * 0.35}" r="${r * 0.35}" fill="#fff" opacity=".8"/>`;
}
const EMERALD = '#3fbf5a';

// A head and bust in profile, looking left, as one closed outline: from the crown down the forehead, nose, lips
// and chin, down the throat to the chest, along the curved cut that ends a cameo bust, and up the back of the
// shoulders, the nape and the back of the head. (x, y) is the brow.
//   nose: how far the nose stands out   lips: how full the lips are
function profile(x, y, { nose = 4, lips = 1 } = {}) {
  const at = (dx, dy) => `${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)}`;
  return `M${at(9, -11)} Q${at(0.6, -10)} ${at(0, -1)} Q${at(-0.4, 0.6)} ${at(-0.2, 1.4)} Q${at(0.4, 2.4)} ${at(-nose * 0.35, 4.2)} ` +
    `L${at(-nose, 7.6)} Q${at(-nose + 0.4, 9.2)} ${at(-0.6, 9.2)} Q${at(-0.6 - lips * 0.5, 10)} ${at(-0.4 - lips, 11.2)} ` +
    `L${at(0.4, 12)} Q${at(-0.8 - lips * 0.8, 12.6)} ${at(-0.2 - lips * 0.4, 13.8)} Q${at(0.8, 14.6)} ${at(0.4, 15.8)} ` +
    `Q${at(-0.4, 18.4)} ${at(2.4, 19.4)} Q${at(5, 20)} ${at(6, 22)} Q${at(6.6, 25)} ${at(6, 27)} Q${at(5, 29.4)} ${at(-2, 30.4)} ` +
    `Q${at(13, 36.6)} ${at(29, 29)} Q${at(25, 26)} ${at(20.6, 24.6)} Q${at(18, 21)} ${at(18, 16)} ` +
    `Q${at(24, 7)} ${at(20, -4)} Q${at(16, -11.2)} ${at(9, -11)} Z`;
}
// The carved line along the bottom of a bust, a little above its cut.
function truncation(x, y) {
  return carve(`M${x} ${y + 29.4} Q${x + 13.6} ${y + 34} ${x + 26.4} ${y + 28.6}`, 0.7);
}
// The carved features of a face in profile: brow, eye, nostril, mouth and an ear.
function features(x, y, { nose = 4, closed = false, smile = false, ear = true } = {}) {
  const eye = closed
    ? `M${x + 1.6} ${y + 3.4} Q${x + 3.4} ${y + 4.8} ${x + 5} ${y + 3}`
    : `M${x + 4.8} ${y + 2.2} L${x + 1.6} ${y + 3.4} L${x + 4.6} ${y + 4.6} M${x + 2.9} ${y + 3.4} h.4`;
  const mouth = smile ? `M${x + 0.2} ${y + 12} Q${x + 1.6} ${y + 12.6} ${x + 2.8} ${y + 11}` : `M${x + 0.2} ${y + 12} L${x + 2.2} ${y + 12.3}`;
  const earCut = ear ? carve(`M${x + 12.6} ${y + 4} Q${x + 16} ${y + 4} ${x + 15.6} ${y + 8} Q${x + 15} ${y + 10.6} ${x + 12.8} ${y + 10.4} M${x + 13.6} ${y + 6} Q${x + 14.6} ${y + 7.2} ${x + 13.4} ${y + 8.4}`) : '';
  const jaw = carve(`M${x + 2.6} ${y + 19.2} Q${x + 8} ${y + 19.6} ${x + 12.6} ${y + 12.6}`, 0.6);
  return carve(`M${x + 0.6} ${y + 0.4} Q${x + 3} ${y - 1.4} ${x + 6.4} ${y + 0.2}`) + carve(eye) + jaw +
    carve(`M${x - nose + 2.4} ${y + 7.8} Q${x - nose + 3.4} ${y + 8.6} ${x - nose + 4.2} ${y + 7.8}`, 0.7) + carve(mouth, 0.8) + earCut;
}

const CHARACTERS = {
  // Tiny Tim, Tony, Tom and Ted: a young foot soldier in a kettle helmet, his spear at his shoulder
  pawn: `${relief('M68.6 76 L70 34 L71.8 34 L70.6 76 Z')}${relief('M70.9 21.6 L74.6 34.4 L67.2 34.4 Z')}${carve('M70.9 24.6 V33', 0.6)}
${relief(profile(40, 45, { nose: 3 }))}${features(40, 45, { nose: 3 })}${truncation(40, 45)}
${relief('M58.4 44 Q64.6 45.6 63.4 53 Q61.2 51.4 58.8 52.6 Q60.2 48.6 58.4 44 Z')}${carve('M60 46 Q61.6 48.6 61.2 51', 0.6)}
${relief('M36 40.4 Q36 26.4 50 25.8 Q62.6 26.2 63.6 38.6 Q50 37.6 36 40.4 Z')}${carve('M40.6 36 Q41.6 29.6 48.6 27.8', 0.8)}${carve('M50 26.2 V37.4', 0.6)}
${relief('M28.6 41.6 Q47.6 34.2 69 35.6 L68.8 38.2 Q47.6 37.8 29.4 44.2 Z')}
${carve('M47 70 Q52 72.6 57 70.6', 0.7)}`,

  // Neigh Nigel: the chess knight's horse head, a steel chamfron down his face and a plume on his crown
  knight: `<g transform="translate(10 9) scale(.8)">
${relief('M67 84 Q62 74 63.4 63 Q66.6 49 59.6 39 Q55 32 50 31 L52 23.6 L45.6 29 L43.6 22.6 L40 30.6 Q31 34.6 27 43.6 L22 52.6 Q20 57.6 23 60.6 Q26.6 64 32 62.6 L39 60.6 Q41.6 64.2 40.6 69.6 L37 84 Q52 91 67 84 Z')}
${carve('M51.6 32.6 Q59.6 36.6 61.6 44.6 Q65.6 50.6 62.6 56.6 Q67.6 62.6 63.6 68.6 Q66.6 74 64.4 79', 1.2)}${carve('M55 38.6 Q58.6 42.6 58.6 48.6 M59.6 58.6 Q61.6 62.6 60.6 66.6', 0.9)}
${relief('M42.4 31 L48.6 33.4 L36 54.6 L29 51.4 Z')}${carve('M41.6 35.4 L33.6 50', 0.7)}${bead(38.4, 43, 1.4)}
${carve('M44.4 39 Q47.4 37 50 39.2 Q47.4 41.4 44.4 39 Z', 1)}${carve('M45.4 36 Q48.4 34.4 51.4 36.4', 0.8)}
${carve('M24.4 56 Q25.8 54.6 27.2 56', 1)}${carve('M24.2 60.6 Q28 61.6 31.6 61', 1)}${carve('M39 60.6 L32.6 52 M32.6 52 L44.6 47.4', 1)}${bead(32.6, 52, 1.3)}
${carve('M39.6 81 Q52 86.4 64.6 81', 0.9)}
${relief('M46.6 28.6 Q46 19.6 55.6 16.6 Q52.6 21.6 54 25 Q57.6 21 62.6 21 Q56.6 24.6 52.6 30.6 Z')}${carve('M49.6 25 Q51.6 20.6 55 18.6', 0.8)}</g>`,

  // Bishop Bailey: an old bishop under the tall cleft mitre of the chess bishop, its ribbons down his back
  bishop: `${relief('M58.6 45 L62.6 45 L63.6 64 L59.6 64 Z')}${carve('M60 51 H63.2 M60.4 57 H63.4', 0.6)}
${relief(profile(40, 47, { nose: 5 }))}${features(40, 47, { nose: 5, closed: true, smile: true })}${truncation(40, 47)}
${carve('M44.6 53.6 Q46 55 45.2 56.6 M42.4 61.6 Q43.8 63.4 46.4 63.4', 0.6)}
${relief('M36.4 45.4 Q36.4 35.4 40.6 28.4 L45.6 20 L49.6 26.6 L53.6 21 Q59.6 29.6 62.4 38.6 L62.6 45.4 Q50 42.4 36.4 45.4 Z')}
${carve('M36.8 41.4 Q50 38.4 62.4 41.4', 0.8)}${carve('M49.6 26.8 L50.6 40', 0.6)}${inlay('M43.6 28.6 h1.8 v3.4 h3 v1.8 h-3 v5.6 h-1.8 v-5.6 h-3 v-1.8 h3 Z')}
${bead(46, 72.6, 1.8, 'url(#gold)')}`,

  // Castle Carl: a burly man in a mural crown of battlements, the chess rook's tower, with a curled moustache
  rook: `${relief(profile(40, 46, { nose: 5.4, lips: 0.6 }))}${features(40, 46, { nose: 5.4 })}${truncation(40, 46)}
${relief('M58.6 46 Q64.6 46.6 64 55 Q61.6 56 59.6 54 Q61.6 50.6 58.6 46 Z')}${carve('M60.2 48 Q62 50 61.6 52.6', 0.6)}
${relief('M39.6 55.4 Q36 55 33.4 56.6 Q30.6 58.4 31.4 55 Q29 56.6 30 59 Q32 60.6 35 59.6 Q38.4 58.4 41 57.4 Z')}
${relief('M37 43.4 L37 33.6 L40 33.6 L40 29.6 L44 29.6 L44 33.6 L48.4 33.6 L48.4 29.6 L52.4 29.6 L52.4 33.6 L56.6 33.6 L56.6 29.6 L60.6 29.6 L60.6 33.6 L63 33.6 L63 43.4 Q50 41.4 37 43.4 Z')}
${carve('M37.2 38.6 H62.8 M41.6 34 V38.4 M50.4 34 V38.4 M58.6 34 V38.4 M45.6 38.6 V42.2 M54.4 38.6 V42.4', 0.7)}`,

  // Duchess Dagger: a duchess with her hair pinned up under a pearl coronet, her dagger raised behind her
  queen: `${relief('M64 72 L73.6 48 L75.2 48.8 L66 73 Z')}${relief('M61 71.4 L69.6 75.6 L70.4 73.8 L61.8 69.6 Z')}${carve('M68 62 L72.6 51', 0.5)}
${relief(profile(40, 45, { nose: 3.2, lips: 1.5 }))}${features(40, 45, { nose: 3.2 })}${truncation(40, 45)}
${carve('M41.4 46.6 l-1.4 -1.6 M42.6 46 l-.8 -1.8', 0.5)}
${relief('M39.6 39.6 Q42 33 50 32.4 Q60 32.6 63.4 41 Q65 49 60.6 55.6 Q58.6 52 58.8 48 Q56 44 50 43.6 Q44 41.6 39.6 39.6 Z')}
${relief('M59 38.6 Q63.4 30 70 34.6 Q74 40 69.6 46 Q64.6 48 61.6 44 Z')}${carve('M62 37.6 Q65.6 34.6 68.6 37.6 M62.6 42 Q66 40 69 42.6', 0.6)}
${carve('M44 40.4 Q50 36.6 57 38.6 M52 43.4 Q56 46 57.4 50.6', 0.7)}
${inlay('M42.6 39.4 L43 31 L46.4 34.6 L49.6 28.6 L52.4 34 L56 30 L56.6 37.6 Q49.6 37.2 42.6 39.4 Z')}${bead(43, 29.6, 1.3)}${bead(49.6, 27.2, 1.4)}${bead(56, 28.6, 1.3)}
${carve('M46.4 67.6 Q52 71 58 68.4', 0.7)}${[48.4, 51.2, 54, 56.6].map((x) => bead(x, 69.4 + (x - 52.6) * (x - 52.6) * 0.05, 0.9)).join('')}`,

  // King Kobe: a king with a full curled beard and the cross-topped crown of the chess king
  king: `${relief(profile(40, 46, { nose: 4.6 }))}${features(40, 46, { nose: 4.6 })}
${relief('M42 57.6 Q39.4 60.6 38.4 63.6 Q37.4 69.6 41.4 73 Q47 76 52.6 72.6 Q57 68.6 57.4 62.6 Q57 57.4 53.6 54.4 Q51.4 58 47 57.4 Q44 57.4 42 57.6 Z')}
${carve('M41.6 63 Q41 66.6 42.6 70 M45.6 61.6 Q45 66 46.6 71.4 M49.8 61 Q49.4 65.6 50.6 70.6 M53.8 59.6 Q54.2 63.6 53.8 67.6', 0.7)}
${relief('M33.6 55.6 Q37 54 41 56.4 Q43.6 58.6 46.6 57.6 Q43 60.4 39 59.6 Q36 58.6 33.6 55.6 Z')}
${relief('M58 44.6 Q64.6 45 64.4 52 Q66 57 62 60.6 Q60.6 56 59 55 Q61 50 58 44.6 Z')}${carve('M60 47 Q62.4 49 61.6 52 M61 55.4 Q62.6 57 62 59', 0.6)}
${inlay('M37 44.6 L37 34.6 L42 38.6 L47.6 30.6 L53 38 L58.6 33.6 L62.6 34.6 L62.6 44.6 Q50 42.6 37 44.6 Z')}${carve('M37.4 41.6 Q50 39.8 62.4 41.6', 0.6)}
${inlay('M46.6 30.6 V27 H43.6 V24.8 H46.6 V21.6 H49 V24.8 H52 V27 H49 V30.6 Z')}${bead(42.4, 38, 1)}${bead(53, 37, 1)}
${carve('M46 75.6 Q57 79.6 66 74.4', 0.7)}`,

  // Venom Veronica: a cobra rearing to face you, her hood spread, long lashes, emerald eyes and a forked tongue
  venom_veronica: `${relief('M22 80 Q22 70 34 69 L66 69 Q78 70 78 80 Q78 86 70 86 L30 86 Q22 86 22 80 Z')}${carve('M28 76 Q50 72 72 76 M30 82 Q50 78 70 82', 0.6)}
${relief('M50 25.6 Q66 27.6 70.6 43 Q72.6 56 63 66 L57 71 L43 71 L37 66 Q27.4 56 29.4 43 Q34 27.6 50 25.6 Z')}
${carve('M38 48 Q38 40 44 38.6 M62 48 Q62 40 56 38.6 M35 56 Q40 62 44 62.6 M65 56 Q60 62 56 62.6', 0.8)}
${carve('M45 52 H55 M45 56 H55 M45 60 H55 M45.6 64 H54.4 M46 68 H54', 0.6)}
${relief('M50 29.6 Q60.6 30.2 61.4 38.6 Q61.4 45.6 55.4 48.6 L50 50.6 L44.6 48.6 Q38.6 45.6 38.6 38.6 Q39.4 30.2 50 29.6 Z')}
${bead(45, 38.6, 1.9, EMERALD)}${bead(55, 38.6, 1.9, EMERALD)}
${carve('M42.4 36.4 l-1.6 -1.6 M43.4 35.2 l-.8 -2 M44.8 34.8 l0 -2.2 M57.6 36.4 l1.6 -1.6 M56.6 35.2 l.8 -2 M55.2 34.8 l0 -2.2', 0.6)}
${carve('M48.4 44.4 h.3 M51.4 44.4 h.3', 1)}${carve('M44.6 46.4 Q50 49.4 55.4 46.4', 0.8)}
${relief('M46.6 47.6 L47.4 51 L48.4 48.2 Z')}${relief('M53.4 47.6 L52.6 51 L51.6 48.2 Z')}
${carve('M50 49.6 V54.4 M50 54.4 l-1.8 2 M50 54.4 l1.8 2', 0.8)}`,

  // Experienced Edna: a granny with her hair in a bun, little round spectacles and a knitted shawl, holding a vial
  experienced_edna: `${relief(profile(40, 45, { nose: 4.6, lips: 0.5 }))}${features(40, 45, { nose: 4.6, smile: true, ear: false })}
${carve('M42.8 60 Q44.6 61.6 47 61.4 M45.4 50 Q46.6 51 46.4 52.6 M38.6 48.4 Q39.6 47 41 47.2', 0.6)}
${relief('M38.6 41.6 Q40.6 33 50 32.4 Q60 32.6 62.6 41 Q63.6 49 60 55 Q57 53 57.6 49 Q55 44 49 43.4 Q43 42 38.6 41.6 Z')}
${carve('M42 39 Q48 35.4 55 36.6 M47 41 Q53 39.6 58 42 M56 45.6 Q58.4 48 58.4 51', 0.6)}
${relief('M57.6 35.4 Q60 27.6 66.6 29.4 Q71 32.6 68 38.6 Q64 41.6 59.6 40.4 Z')}${carve('M60 32.6 Q63.6 30.6 66.6 33 M60.6 36.6 Q64.6 35.4 67.6 37', 0.6)}
<ellipse cx="41.4" cy="48.6" rx="2.6" ry="2.9" fill="none" stroke="#8a7656" stroke-width="1"/>${carve('M44 48.4 L53.6 49.6', 0.7)}
${relief('M34 70 Q40 63 48 66 Q57 64 64 68 Q70 71 71 75 Q60 79.6 46 78 Q38 76 34 70 Z')}${carve('M39 70 l2 2 l2 -2 l2 2 l2 -2 l2 2 l2 -2 l2 2 l2 -2 l2 2 l2 -2 l2 2', 0.6)}
${relief('M28.6 68 L28.6 60.4 L27.6 59 L27.6 57 L32.4 57 L32.4 59 L31.4 60.4 L31.4 68 Q30 69.4 28.6 68 Z')}${carve('M30 62 V66 M28.8 64 H31.2', 0.6)}
${relief('M26 70 Q25 65 30 64.6 Q34 65 34 69 Q32 72 28 72 Z')}`,

  // Empress Edna: the same granny crowned, with an emerald serpent necklace and her eye gone green
  empress_edna: `${relief(profile(40, 46, { nose: 4.6, lips: 0.5 }))}${features(40, 46, { nose: 4.6, ear: false })}
${carve('M42.8 61 Q44.6 62.6 47 62.4 M45.4 51 Q46.6 52 46.4 53.6', 0.6)}
${relief('M38.6 42.6 Q40.6 34 50 33.4 Q60 33.6 62.6 42 Q63.6 50 60 56 Q57 54 57.6 50 Q55 45 49 44.4 Q43 43 38.6 42.6 Z')}
${carve('M42 40 Q48 36.4 55 37.6 M47 42 Q53 40.6 58 43 M56 46.6 Q58.4 49 58.4 52', 0.6)}
<ellipse cx="41.4" cy="49.6" rx="2.6" ry="2.9" fill="none" stroke="url(#gold)" stroke-width="1.1"/>${carve('M44 49.4 L53.6 50.6', 0.7)}<circle cx="42.6" cy="49.6" r="1" fill="${EMERALD}"/>
${inlay('M38 41 L37 28.6 L42 32.6 L45 25.6 L49.6 31 L54 24.6 L57 31 L62.4 27.6 L62.4 41 Q50 38.6 38 41 Z')}${carve('M38.2 37.6 Q50 35.6 62.4 37.6', 0.6)}
${bead(37, 27.4, 1.2, EMERALD)}${bead(45, 24.4, 1.2, EMERALD)}${bead(54, 23.4, 1.3, EMERALD)}${bead(62.4, 26.4, 1.2, EMERALD)}${bead(50, 35.6, 1.3, EMERALD)}
${carve('M44.6 69.6 Q48 72.6 52 70.6 Q56 68.6 59.6 71.6', 1.6)}${bead(52, 72, 1.6, EMERALD)}${truncation(40, 46)}`,

  // Brittle Bernard: a young prince carved in brittle ivory, cracked across the face, his little crown askew
  brittle_bernard: `${relief(profile(40, 46, { nose: 3 }))}${features(40, 46, { nose: 3 })}${truncation(40, 46)}
${relief('M38.6 43.6 Q38.6 34 50 33.4 Q61 33.6 62.4 44 Q62.6 50 59.6 55 Q58.6 50 57 48 Q54 46.6 51.6 47.6 Q52 45 50.4 44 Q46 46 41.6 45.6 Q40 45 38.6 43.6 Z')}
${carve('M44 38.6 Q50 36 56 37.6 M48.6 41.6 Q53.6 40.6 57.6 43', 0.6)}
<g transform="rotate(-14 50 34)">${inlay('M42.6 36 L42.6 28 L46 31 L49.4 25.4 L52.6 31 L56 28 L56 36 Q49.4 34.6 42.6 36 Z')}${bead(49.4, 24.4, 1)}</g>
${carve('M58 35 L54.6 41 L57.4 45 L53.4 51 L55.6 55 M54.6 41 L51 40.6 M53.4 51 L49 52.4', 0.9)}
${carve('M38.8 57 L42 59.4 L40.6 63 M42 59.4 L45 59.4 L47.6 63', 0.8)}${carve('M47.6 68 L50 71 L48.8 74', 0.8)}
<path d="M61.6 38 L64 41 L61.4 43.6 Z" fill="#000" opacity=".55"/>
${carve('M44 72 L57 66.6', 0.8)}`,

  // Hairy Harambe: a silverback in profile: the crest of his skull, a jutting brow, a broad muzzle, a vast chest
  hairy_harambe: `${relief('M30 78 Q24 74 25 67 Q26 63.6 30 63 Q27.6 61.6 27.2 59 L27.4 56.4 Q25.2 55 26 52.2 Q27 49.4 30.4 49.2 Q29.6 47 31.4 45.4 Q29.6 43.4 30.6 41 Q32.6 38.2 36.8 38.4 Q40 30 48 26 Q56 22.6 62.6 26 Q68 30 69 38 Q75 46 75 56 Q79 64 77 74 Q54 84 30 78 Z')}
${relief('M37 38.6 Q41.6 39.6 42.6 44 Q42.6 50.6 39.6 56.6 Q37.6 61.6 32.6 63.4 Q28.6 63 27.4 59 L27.4 56.4 Q25.2 55 26 52.2 Q27 49.4 30.4 49.2 Q29.6 47 31.4 45.4 Q29.6 43.4 30.6 41 Q32.6 38.2 37 38.6 Z')}${carve('M30.8 41.4 Q34 39.4 38.6 40.2 Q41 41 41.6 43', 1.4)}${carve('M37.6 44 L34.6 44.8 L37.4 46 M35.6 44.8 h.4', 0.9)}
${carve('M29.6 49.6 Q31 48.6 31.6 50.2', 0.8)}${carve('M26.6 56 Q30 57.4 33 56.6', 0.9)}${carve('M33.4 46.6 Q37 52 35.6 58 Q34 61.6 30 63', 0.7)}
${carve('M49.6 44.6 Q53 44 53.6 47.6 Q53.2 50.6 50.6 50.2', 0.8)}
${carve('M46 29 Q52 26.6 58 27.6 M52 33 Q58 31.6 64 34 M58 39 Q63 39.6 67 43 M60 47 Q64 49.6 66 54.6 M62 59 Q66 63 67 68 M44 62 Q48 66 47 72 M36 66 Q40 70 39 76 M70 60 Q73 66 72 72', 0.7)}
${inlay('M33 72.6 Q46 77.6 60 73.6 L60.2 75.4 Q46 79.6 32.6 74.4 Z')}`,

  // Buzzy Beatrice: a beekeeper with her veil hanging from the brim of her wide hat, her bees about her
  buzzy_beatrice: `${relief('M57 42 Q66 44 68 56 Q68.6 65 66 72 L58 72 Q60 63 58 54 Z')}${carve('M60 46 L60.6 70 M63 47 L64 70 M65.6 50 L66 68 M58.4 52 L66.6 51 M58.6 60 L67.4 59.4 M58.6 67 L66.6 66.6', 0.5)}
${relief(profile(40, 47, { nose: 2.8, lips: 1.2 }))}${features(40, 47, { nose: 2.8, smile: true })}${truncation(40, 47)}
${carve('M43.6 52.6 h.3 M45.4 53.6 h.3 M43.8 54.8 h.3', 0.8)}
${relief('M38 43.6 Q39 36.6 50 36 Q58.6 36.4 60.6 44 Q55 42.6 50 43.6 Q44 44.6 38 43.6 Z')}
${relief('M26 42.6 Q48 34.6 71 38.6 Q72 40.6 69 41 Q48 38.4 27.4 45 Q25 44.6 26 42.6 Z')}
${relief('M38 38.6 Q37.6 26.6 49 26 Q60 26.4 61.4 37.4 Q50 36 38 38.6 Z')}${carve('M38.6 35 Q50 33 61 34.4', 0.9)}${carve('M42 31.6 Q44.6 28 49 27.6', 0.6)}
${[[30, 58, 1], [29, 33, 0.8], [71, 29, 0.75]].map(([x, y, size]) => `<g transform="translate(${x} ${y}) scale(${size})">${relief('M-1.6 -2 Q-4 -6 -6 -4 Q-6 -1.6 -1.6 -1 Z')}${relief('M1 -2 Q0 -6.6 3 -6 Q4.6 -4 1.6 -1 Z')}${relief('M-4.6 0 Q-4.6 -3 0 -3 Q4.6 -3 4.6 0 Q4.6 3 0 3 Q-4.6 3 -4.6 0 Z')}${carve('M-1.6 -2.6 V2.6 M1.4 -2.6 V2.6', 0.9)}${carve('M4.6 0 h1.6', 0.6)}</g>`).join('')}`,

  // His Hovering Holiness: a beaming pope in a mitre with flying goggles, a jet pack on his back and flames below it
  his_hovering_holiness: `${relief('M61 50 Q61 46 65 46 L69 46 Q73 46 73 50 L73 66 L61 66 Z')}${carve('M61.4 53 H72.6 M61.4 59 H72.6', 0.7)}
${inlay('M62 66.6 Q62.4 72 67 78 Q71.6 72 72 66.6 Z')}<path d="M64.4 66.6 Q64.6 70 67 73.4 Q69.4 70 69.6 66.6 Z" fill="#fff6c8" opacity=".85"/>
${relief(profile(40, 48, { nose: 4 }))}${features(40, 48, { nose: 4, closed: true, smile: true })}${truncation(40, 48)}
${carve('M39.4 60 Q41 62 43.6 60.6', 0.7)}
${relief('M36.6 46.6 Q36.6 36 41 28.4 L46.6 19.6 L50.6 26.6 L54.6 20.6 Q60.4 29.6 62.4 39 L62.6 46.6 Q50 43.4 36.6 46.6 Z')}
${inlay('M45 27.6 h1.8 v3.4 h3 v1.8 h-3 v5.6 h-1.8 v-5.6 h-3 v-1.8 h3 Z')}
${carve('M36.8 42.4 Q49 39.6 62.4 42.4', 1.4)}<circle cx="40.6" cy="41.6" r="3" fill="url(#cameo-ivory)" stroke="url(#gold)" stroke-width="1.3"/>${carve('M39.6 40.6 Q40.4 39.8 41.4 40', 0.5)}
${inlay('M48.4 68.6 h1.6 v2.6 h2.4 v1.6 h-2.4 v4 h-1.6 v-4 h-2.4 v-1.6 h2.4 Z')}`,

  // What is left of Brittle Bernard: the cameo smashed into shards, a sliver of his crown among them
  debris: `${relief('M30 40 L44 30 L48 46 L36 54 Z')}${relief('M50 28 L66 34 L58 48 L51 45 Z')}${relief('M38 58 L50 50 L56 62 L44 72 Z')}
${relief('M60 52 L72 50 L70 66 L58 64 Z')}${relief('M26 60 L34 62 L32 72 Z')}${relief('M58 70 L66 72 L60 78 Z')}
${carve('M38 42 L42 46 M54 36 L60 40 M44 60 L50 64', 0.6)}
<g transform="rotate(30 52 56)">${inlay('M48 58 L48.4 52 L51 54.4 L53.4 50.6 L55 54 L56.6 52.6 L56.4 58 Z')}</g>`,
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

// The cameo's ground: a round well of the owner's colour, deep at the rim, that the ivory bust is carved on.
function drawWell(owner) {
  return `<circle cx="50" cy="50" r="28" fill="url(#well-${BODY_GRADIENTS[owner].slice(5)})"/>`;
}

// The gold bezel the cameo is set in, with the shadow it throws onto the ground.
function drawBezel() {
  return `<circle cx="50" cy="50" r="26.6" fill="none" stroke="#000" stroke-width="1.6" opacity=".35"/>
<circle cx="50" cy="50" r="28" fill="none" stroke="#5a3a00" stroke-width="3.8"/><circle cx="50" cy="50" r="28" fill="none" stroke="url(#gold)" stroke-width="2.6"/>
<path d="M30.8 33 A26.4 26.4 0 0 1 58 23.2" fill="none" stroke="#fffbe0" stroke-width=".9" stroke-linecap="round" opacity=".8"/>`;
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
${drawWell(owner)}<g clip-path="url(#art-clip)"><g transform="translate(5 5) scale(.9)">${CHARACTERS[stone.type]}</g></g>${drawBezel()}</svg>`;
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
