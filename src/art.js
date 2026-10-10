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
   One per piece, drawn in a 56 x 56 box that sits on the stone's face. */

const CHARACTERS = {
  // a nervous little foot soldier: kettle helmet, belted tunic, a tiny wooden shield
  pawn: `${part('M16 55 Q17 39 28 37 Q39 39 40 55 Z', '#c9a66b')}
${line('M22 40 Q28 43.5 34 40', '#8a6a3a')}${line('M23 49 L22 55 M33 49 L34 55', '#8a6a3a', 1, 0.7)}
<path d="M17.2 47 H38.8" stroke="#6b4423" stroke-width="3"/><rect x="26" y="45.2" width="4" height="3.6" rx=".7" fill="#f3c54a" stroke="${OUTLINE}" stroke-width=".8"/>
${part('M8.5 41 H18.5 V47 Q18.5 52.5 13.5 55 Q8.5 52.5 8.5 47 Z', '#9a6a40', 1.6)}${line('M13.5 41.5 V54.3 M9 46 H18', '#f3c54a', 1.4)}
<circle cx="28" cy="25" r="10.5" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
${part('M18.5 21 Q18 8.8 28 8.4 Q38 8.8 37.5 21 Q28 18.4 18.5 21 Z', 'url(#art-metal)', 1.8)}
${part('M14.5 21.6 Q28 16.6 41.5 21.6 L39.5 24 Q28 19.6 16.5 24 Z', '#9aa3b5', 1.6)}
${ball(28, 8.4, 1.7, '#9aa3b5', 1)}${shine('M21.5 15 Q23 11 27 10.2')}
<g fill="#6f7a8e"><circle cx="20.5" cy="21.6" r=".7"/><circle cx="28" cy="20.2" r=".7"/><circle cx="35.5" cy="21.6" r=".7"/></g>
${line('M21 24.6 L25.6 23.4 M35 24.6 L30.4 23.4', OUTLINE, 1.6)}${eye(24.2, 27.4)}${eye(31.8, 27.4)}
${line('M23.5 32.4 q1.5 -1.6 3 0 q1.6 1.6 3.2 0 q1 -1.2 2 0', OUTLINE, 1.4)}${blush(21.4, 30.4, 2)}${blush(34.6, 30.4, 2)}
<path d="M41.5 13 q4.3 5.4 0 8 q-4.3 -2.6 0 -8 Z" fill="#9fd8ff" stroke="${OUTLINE}" stroke-width="1.1"/>${shine('M40.6 17.5 q-.4 1.6 .6 2.4', 1)}`,

  // a war horse with a braided mane, a bridle and a flared nostril
  knight: `${part('M36 14 Q47 21 45 34 Q48 44 46 54 L41 54 L40 34 Q42 21 36 14 Z', '#6a3d22')}
${line('M39 18 l4 1.5 M41 23 l4 1 M42 28 l4 .6 M42.5 33 l4 .4 M42.5 38 l4 .3 M42.5 44 l3.6 0', '#3e2212', 1.3)}
${part('M41 54 L40 34 Q42 21 36 14 L38 5 L31.5 10.5 L28 5 L26.5 12 Q17 14 11 26 Q8 31 12.5 34.5 Q17 37 22 33 L26 32 Q24 43 18 54 Z', '#e7c398')}
${line('M29.5 8.5 L31.3 11 M36.5 8 L35.4 12', '#b98a5e', 1.2)}
<path d="M30 15 Q35 22 34 31 Q30 26 26 27 Z" fill="#c99868" opacity=".55"/>
${line('M33 32 Q30 42 25 54', '#b98a5e', 1.2, 0.8)}
${line('M31 12 Q27 21 18.6 27.4 M17.6 22.2 Q20.6 28 17.4 34.6', OUTLINE, 3.4)}${line('M31 12 Q27 21 18.6 27.4 M17.6 22.2 Q20.6 28 17.4 34.6', '#8a4a2a', 2)}<circle cx="19.2" cy="27.4" r="1.7" fill="#f3c54a" stroke="${OUTLINE}" stroke-width=".8"/>
<circle cx="26" cy="19.5" r="5" fill="#fff" stroke="${OUTLINE}" stroke-width="1.6"/>${eye(27.3, 20.6, 2.4)}
${line('M21.5 15.6 Q26 13.4 30.5 15.8', OUTLINE, 1.5)}
<ellipse cx="13.6" cy="29" rx="1.8" ry="1.2" fill="${OUTLINE}" transform="rotate(-30 13.6 29)"/>${shine('M18 18 Q15 21 13.5 24.5', 1.4)}
<path d="M14.5 34 L14.5 38 L18 38 L18 33.5" fill="#fff" stroke="${OUTLINE}" stroke-width="1.3" stroke-linejoin="round"/>`,

  // a bishop in a tall mitre and a purple cope with a golden orphrey
  bishop: `${part('M17 55 Q24 47 22.5 43 Q17 37 22 33 L34 33 Q39 37 33.5 43 Q32 47 39 55 Z', '#8a4fd1')}
${line('M22.6 42.5 Q28 45 33.4 42.5', '#f3c54a', 2.2)}${line('M28 44 V55', '#f3c54a', 2.6)}${line('M25 49.5 H31', '#f3c54a', 2)}
${line('M21 50 Q20 53 19.5 55 M35 50 Q36 53 36.5 55', '#5e2f9a', 1.1)}
<path d="M22 33 Q28 37.5 34 33 L33 35.5 Q28 39 23 35.5 Z" fill="#fbefd9" stroke="${OUTLINE}" stroke-width="1.2"/>
<circle cx="28" cy="25.5" r="7.5" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
${part('M21.5 20.5 Q20.5 10 28 2.5 Q35.5 10 34.5 20.5 Z', '#fbefd9')}
${line('M30.5 6 L25.5 14', OUTLINE, 1.4)}${line('M21.5 18 H34.5', '#f3c54a', 2)}${line('M28 8.5 V17 M25.5 12 H30.5', '#d9a62e', 1.6)}
${shine('M23.4 16 Q23.4 10.5 26.4 6.6', 1.3)}
${line('M23.6 25.4 q1.6 -1.5 3.2 0', OUTLINE, 1.4)}${eye(31.6, 25.6, 1.4)}${blush(23.5, 28.4, 1.6)}
${line('M25.5 29 q2.5 2 5 0', '#c0304e', 1.6)}`,

  // the pixel castle man: battlements, a stone face and a teal jacket
  rook: `<rect x="11" y="43" width="34" height="13" fill="#2fa7a0" stroke="${OUTLINE}" stroke-width="2"/>
<rect x="11" y="43" width="34" height="3" fill="#5fd0c8"/><rect x="38" y="46" width="7" height="10" fill="#1f7a75"/>
<rect x="22" y="43" width="12" height="4" fill="#c99868"/><rect x="26" y="47" width="4" height="9" fill="#1f7a75"/>
<rect x="13" y="9" width="30" height="32" fill="#c99868" stroke="${OUTLINE}" stroke-width="2"/>
<rect x="38" y="17" width="5" height="24" fill="#a87a50"/><rect x="14" y="17" width="3" height="3" fill="#e0b88a"/><rect x="19" y="36" width="3" height="3" fill="#a87a50"/>
<path d="M13 9 H43 V17 H39 V14 H17 V17 H13 Z" fill="#4a2f1c"/>
<path d="M13 10 V2 H19 V5.5 H25 V2 H31 V5.5 H37 V2 H43 V10 Z" fill="#a9b1c2" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
<rect x="13.8" y="2.8" width="4.4" height="1.6" fill="#d8dde8"/><rect x="25.8" y="2.8" width="4.4" height="1.6" fill="#d8dde8"/><rect x="37.8" y="2.8" width="4.4" height="1.6" fill="#d8dde8"/>
<rect x="19" y="7" width="4" height="2" fill="#7f8899"/><rect x="31" y="7" width="4" height="2" fill="#7f8899"/>
<rect x="17" y="23" width="4.5" height="4" fill="#fff"/><rect x="21.5" y="23" width="4" height="4" fill="#4a3b9a"/>
<rect x="30.5" y="23" width="4" height="4" fill="#4a3b9a"/><rect x="34.5" y="23" width="4.5" height="4" fill="#fff"/>
<rect x="17" y="21" width="8.5" height="2" fill="#6b3a24"/><rect x="30.5" y="21" width="8.5" height="2" fill="#6b3a24"/>
<rect x="25.5" y="27" width="5" height="4" fill="#8a5a3a"/><rect x="21.5" y="32" width="13" height="3.5" fill="#6b3a24"/>
<rect x="21.5" y="35.5" width="4" height="3" fill="#6b3a24"/><rect x="30.5" y="35.5" width="4" height="3" fill="#6b3a24"/>`,

  // a duchess with a jewelled tiara, golden curls, a pearl choker and a hidden dagger
  queen: `${part('M13 54 Q9 30 15.5 17 Q28 6 40.5 17 Q47 30 43 54 Q37 47 37 36 L19 36 Q19 47 13 54 Z', '#f0bf48')}
${line('M15 44 Q13 34 16.5 24 M41 44 Q43 34 39.5 24 M17.5 50 Q16 42 18 36 M38.5 50 Q40 42 38 36', '#c8901e', 1.2)}
${part('M17 56 Q19 43 28 42 Q37 43 39 56 Z', '#d6427a')}
${line('M21 46 Q28 50 35 46', '#ff9ac0', 1.3)}${line('M28 46.5 V56', '#a82a5c', 1.2)}
<g transform="rotate(28 42 50)"><rect x="40.6" y="44" width="2.8" height="9" rx=".6" fill="url(#art-metal)" stroke="${OUTLINE}" stroke-width=".9"/><rect x="38.8" y="43" width="6.4" height="1.8" rx=".6" fill="#f3c54a" stroke="${OUTLINE}" stroke-width=".8"/><rect x="41" y="39.5" width="2" height="3.6" fill="#7a3a2a" stroke="${OUTLINE}" stroke-width=".8"/></g>
<ellipse cx="28" cy="28" rx="10" ry="12" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
${line('M22 39.6 Q28 42 34 39.6', '#fff', 2.2)}<g fill="#fff" stroke="#c9c2b4" stroke-width=".4"><circle cx="24" cy="40.5" r="1"/><circle cx="28" cy="41.3" r="1"/><circle cx="32" cy="40.5" r="1"/></g>
${part('M18.5 22 Q24 14 33 17 Q37 19 38 24 Q33 18 25 20 Z', '#f0bf48', 1.5)}${shine('M21 19.6 Q25 16.6 30 17', 1.2)}
${part('M19 15 L22 8 L25 13 L28 5 L31 13 L34 8 L37 15 Z', 'url(#gold)', 1.6)}
<circle cx="28" cy="11" r="1.7" fill="#e0304e" stroke="${OUTLINE}" stroke-width=".6"/><circle cx="22.4" cy="12.6" r="1" fill="#4aa3ff"/><circle cx="33.6" cy="12.6" r="1" fill="#4aa3ff"/>
${line('M21.5 27 q2.5 2 5 0 M29.5 27 q2.5 2 5 0', OUTLINE, 1.7)}
${line('M21.5 27 l-2 -1.5 M34.5 27 l2 -1.5 M23 28 l-1 1.6 M33 28 l1 1.6', OUTLINE, 1.1)}
${blush(21, 32, 2.3)}${blush(35, 32, 2.3)}
<path d="M25 34 q3 2.6 6 0 q-3 -1.2 -6 0 Z" fill="#e0304e" stroke="#a01d35" stroke-width=".8"/><circle cx="34" cy="35.5" r=".9" fill="${OUTLINE}"/>`,

  // the bearded king in an ermine-trimmed robe and a jewelled crown
  king: `${part('M10 56 Q11 44 20 41 L36 41 Q45 44 46 56 Z', '#b02d4a')}
<path d="M10.5 52 Q28 47 45.5 52 L46 56 L10 56 Z" fill="#fbfbf6" stroke="${OUTLINE}" stroke-width="1.4"/>
<g fill="${OUTLINE}"><path d="M17 52 l1 2 l1 -2 z"/><path d="M27 50.4 l1 2 l1 -2 z"/><path d="M37 52 l1 2 l1 -2 z"/></g>
<circle cx="28" cy="31" r="12.5" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
${part('M15.5 31 Q15 52 28 54 Q41 52 40.5 31 Q37 40 28 40 Q19 40 15.5 31 Z', '#8a5a3a')}
${line('M20 42 Q21 47 23.5 50 M28 42 V52 M36 42 Q35 47 32.5 50 M24 41 Q24.5 46 26 49 M32 41 Q31.5 46 30 49', '#5e3a22', 1.1)}
${part('M20 37.5 Q28 31.5 36 37.5 Q28 35.5 20 37.5 Z', '#6a4228', 1.2)}
<ellipse cx="28" cy="33" rx="2.6" ry="2" fill="#e8a98a"/>
${eye(23.5, 29)}${eye(32.5, 29)}
${line('M20 25.5 L26 26.5 M36 25.5 L30 26.5', OUTLINE, 1.9)}
${part('M13 22 L13 6 L20.5 12.5 L28 2 L35.5 12.5 L43 6 L43 22 Z', 'url(#gold)')}
<rect x="13" y="17.5" width="30" height="4.5" fill="#e0a92e" stroke="${OUTLINE}" stroke-width="1.4"/>
<g fill="#fff3b0"><circle cx="17" cy="19.75" r=".8"/><circle cx="22" cy="19.75" r=".8"/><circle cx="34" cy="19.75" r=".8"/><circle cx="39" cy="19.75" r=".8"/></g>
<rect x="26.2" y="18" width="3.6" height="3.6" rx=".5" fill="#4aa3ff" stroke="${OUTLINE}" stroke-width=".7"/>
<circle cx="20.5" cy="14.5" r="2" fill="#4aa3ff" stroke="${OUTLINE}" stroke-width="1"/><circle cx="28" cy="11.6" r="2.4" fill="#e0304e" stroke="${OUTLINE}" stroke-width="1"/><circle cx="35.5" cy="14.5" r="2" fill="#3cc47a" stroke="${OUTLINE}" stroke-width="1"/>
${shine('M16 16 V9.5', 1.3)}<circle cx="28.8" cy="10.8" r=".7" fill="#fff"/>`,

  // a green viper with a scaled belly, a slit eye and a dripping fang
  venom_veronica: `<path d="M10 50 Q4 40 14 36 Q26 33 24 26 Q22 18 30 15" fill="none" stroke="${OUTLINE}" stroke-width="10" stroke-linecap="round"/>
<path d="M10 50 Q4 40 14 36 Q26 33 24 26 Q22 18 30 15" fill="none" stroke="#5fb24a" stroke-width="7" stroke-linecap="round"/>
<path d="M10 50 Q4 40 14 36 Q26 33 24 26 Q22 18 30 15" fill="none" stroke="#2f6e27" stroke-width="7" stroke-dasharray="2.6 3.4" stroke-linecap="round" opacity=".55"/>
<path d="M9 49 Q5 41 13.5 37.5 Q24 35 22.6 26.5" fill="none" stroke="#c9e88a" stroke-width="2" stroke-linecap="round" opacity=".8"/>
<path d="M50 51 Q45 47 40 52 Q35 56 30 52" fill="none" stroke="${OUTLINE}" stroke-width="6" stroke-linecap="round"/><path d="M50 51 Q45 47 40 52 Q35 56 30 52" fill="none" stroke="#5fb24a" stroke-width="3.4" stroke-linecap="round"/>
<path d="M50 51 l3 -1.5 l-.8 2.8 z" fill="#f3c54a" stroke="${OUTLINE}" stroke-width=".8"/>
${part('M27 8 Q40 4 46 13 Q46 22 36 23 Q27 22 26 15 Z', '#6cc153')}
<path d="M29 10 Q37 6.5 43 11 Q38 9.5 33 11.5 Z" fill="#2f6e27" opacity=".6"/>
<g fill="#2f6e27" opacity=".55"><circle cx="31" cy="17" r="1"/><circle cx="34" cy="19" r="1"/><circle cx="30" cy="20.5" r=".9"/></g>
<ellipse cx="37" cy="12.4" rx="2.8" ry="2.4" fill="#ffe14a" stroke="${OUTLINE}" stroke-width="1"/><ellipse cx="37" cy="12.4" rx=".7" ry="2" fill="${OUTLINE}"/>
${line('M33.5 9 Q37 7.4 40.5 9.4', OUTLINE, 1.4)}<circle cx="44.2" cy="15" r=".6" fill="${OUTLINE}"/>
<path d="M40 21 L41 26 L43 21" fill="#fff" stroke="${OUTLINE}" stroke-width="1.1" stroke-linejoin="round"/><path d="M41.2 27.4 q.9 1.4 0 2.2 q-.9 -.8 0 -2.2 Z" fill="#a6f06a" stroke="${OUTLINE}" stroke-width=".6"/>
${line('M44 18 L49 20 L52 18 M49 20 L52 22', '#e0304e', 1.3)}
${shine('M30 10.5 Q33 8.6 36 8.4', 1.1)}`,

  // a granny in a knitted shawl, round glasses and a bun, with her walking stick
  experienced_edna: `${part('M15 55 Q16 40 28 38 Q40 40 41 55 Z', '#8a6d9e')}
${part('M16.5 44 Q28 51 39.5 44 L38 40.5 Q28 47 18 40.5 Z', '#c9b6d6', 1.2)}
<path d="M17 43 L19 48 L21 44 L23 49 L25 45 L27 50 L29 45 L31 50 L33 45 L35 49 L37 44 L39 48" fill="none" stroke="#a48ab8" stroke-width="1"/>
${line('M22 48 l-.5 2 M26 50 l0 2 M30 50 l0 2 M34 48 l.5 2', '#c9b6d6', 1.3)}
<circle cx="28" cy="26" r="11" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
${part('M17 24 Q18 12 28 12 Q38 12 39 24 Q34 17 28 17 Q22 17 17 24 Z', '#e2e2e8', 1.6)}
${line('M21 18 Q24 15 28 15 M30 14.6 Q34 15 36 18', '#a8a8b4', 1)}
${ball(28, 9, 5, '#e2e2e8', 1.6)}${line('M25 7.5 Q28 5.4 31 7.5 M25 10 Q28 12.4 31 10', '#a8a8b4', .9)}
${line('M17.6 30 Q16.6 32 18 33 M38.4 30 Q39.4 32 38 33', '#d39b72', 1.2)}
<circle cx="23.5" cy="26" r="3.4" fill="#e8f4ff" fill-opacity=".5" stroke="#8a5a3a" stroke-width="1.4"/><circle cx="32.5" cy="26" r="3.4" fill="#e8f4ff" fill-opacity=".5" stroke="#8a5a3a" stroke-width="1.4"/>${line('M26.9 26 H29.1', '#8a5a3a', 1.2)}
${eye(23.5, 26.2, 1.1)}${eye(32.5, 26.2, 1.1)}
${line('M20.5 31.2 l1.8 .4 M35.5 31.2 l-1.8 .4 M24 21.5 l3 -.6 M32 21.5 l-3 -.6', '#b7805a', .9)}
${line('M24 32.5 q4 2.4 8 0', OUTLINE, 1.5)}${blush(21, 30.5, 2)}${blush(35, 30.5, 2)}
<path d="M44 20 Q49 20 49 25" fill="none" stroke="${OUTLINE}" stroke-width="4.4" stroke-linecap="round"/><path d="M48 24 L45 55" stroke="${OUTLINE}" stroke-width="4.4" stroke-linecap="round"/>
<path d="M44 20 Q49 20 49 25" fill="none" stroke="#9a6a40" stroke-width="2.4" stroke-linecap="round"/><path d="M48 24 L45 55" stroke="#9a6a40" stroke-width="2.4" stroke-linecap="round"/>
${line('M47.2 30 l-1 .4 M46.6 38 l-1 .4 M46 46 l-1 .4', '#6b4423', .9)}`,

  // the same granny, now an empress: ermine collar, emerald serpent brooch and a tall crown
  empress_edna: `${part('M12 55 Q14 38 28 37 Q42 38 44 55 Z', '#6a2fb0')}
${line('M17 49 Q16 52 16 55 M39 49 Q40 52 40 55 M28 48 V55', '#4a1d82', 1.1)}
<path d="M14 45 Q28 52 42 45 L40 39.5 Q28 46 16 39.5 Z" fill="#fbfbf6" stroke="${OUTLINE}" stroke-width="1.4"/>
<g fill="${OUTLINE}"><path d="M19 44 l1 2 l1 -2 z"/><path d="M27 46.5 l1 2 l1 -2 z"/><path d="M35 44 l1 2 l1 -2 z"/></g>
${line('M19 51 Q24 56 28 51 Q32 56 37 51', '#6cc153', 2.2)}<circle cx="37" cy="51" r="1.7" fill="#6cc153" stroke="${OUTLINE}" stroke-width=".8"/><circle cx="37.4" cy="50.6" r=".5" fill="#ffe14a"/>
<circle cx="28" cy="27" r="10.5" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
${part('M18 26 Q18 14 28 14 Q38 14 38 26 Q34 20 28 20 Q22 20 18 26 Z', '#e2e2e8', 1.5)}${line('M21.5 21 Q24.5 17.5 28 17.4 M30 17.2 Q33 17.6 35 20.5', '#a8a8b4', 1)}
${part('M14 15 L14 3 L20.5 9 L28 0 L35.5 9 L42 3 L42 15 Z', 'url(#gold)', 1.8)}
<rect x="14" y="12" width="28" height="3" fill="#e0a92e" stroke="${OUTLINE}" stroke-width="1"/>
<circle cx="20.5" cy="9.5" r="1.8" fill="#6cc153" stroke="${OUTLINE}" stroke-width=".8"/><circle cx="28" cy="7" r="2.3" fill="#e0304e" stroke="${OUTLINE}" stroke-width=".8"/><circle cx="35.5" cy="9.5" r="1.8" fill="#4aa3ff" stroke="${OUTLINE}" stroke-width=".8"/>
<circle cx="28.7" cy="6.3" r=".7" fill="#fff"/>${shine('M16.4 11 V6.5', 1.2)}
${line('M22.5 27 q2 -2 4 0 M29.5 27 q2 -2 4 0', OUTLINE, 1.6)}
${line('M21 31 l1.6 .3 M35 31 l-1.6 .3', '#b7805a', .9)}${blush(21.5, 30.5, 2)}${blush(34.5, 30.5, 2)}
${line('M24 32.5 q4 2 8 0', '#a01d35', 1.6)}
<circle cx="18" cy="31" r="1.3" fill="#6cc153" stroke="${OUTLINE}" stroke-width=".6"/><circle cx="38" cy="31" r="1.3" fill="#6cc153" stroke="${OUTLINE}" stroke-width=".6"/>`,

  // a cracked, crooked prince in a sash: hairline cracks over him show he may collapse
  brittle_bernard: `${part('M15 55 Q16 41 28 39 Q40 41 41 55 Z', '#3b9ad8')}
<path d="M19 41.5 L37 55 L33 55 L17 43.5 Z" fill="#ffd34d" stroke="${OUTLINE}" stroke-width="1"/>
<circle cx="30" cy="48.5" r="2" fill="#e0304e" stroke="${OUTLINE}" stroke-width=".8"/>
${line('M22 45 L21 51', '#2a6ea0', 1)}<g fill="#f3c54a" stroke="${OUTLINE}" stroke-width=".5"><circle cx="34.5" cy="44.5" r=".9"/><circle cx="35.5" cy="47.5" r=".9"/></g>
<circle cx="28" cy="27" r="11.5" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
${part('M16 17 L19 7 L23 13 L28 4 L31 12 L36 8 L37 17 Z', 'url(#gold)', 1.7).replace(/<path /g, '<path transform="rotate(-14 27 13)" ')}
<g transform="rotate(-14 27 13)">${line('M19.6 15.6 L22.6 12.4 L25 16.2', '#8a5a00', 1, 0.8)}</g>
<circle cx="23" cy="26" r="3.3" fill="#fff" stroke="${OUTLINE}" stroke-width="1.2"/>${eye(24.4, 26.6, 1.4)}
<circle cx="33" cy="25" r="2.5" fill="#fff" stroke="${OUTLINE}" stroke-width="1.2"/>${eye(31.9, 25.4, 1.1)}
${line('M19.6 21.6 l4.4 .6 M30.6 20.8 l4.4 -1', OUTLINE, 1.4)}
<path d="M22 33 Q28 37 34 32" fill="none" stroke="${OUTLINE}" stroke-width="1.6" stroke-linecap="round"/>
<rect x="26" y="33.5" width="3" height="3" fill="#fff" stroke="${OUTLINE}" stroke-width=".8"/><rect x="29" y="33.3" width="3" height="3" fill="#fff" stroke="${OUTLINE}" stroke-width=".8"/>
${line('M35.5 19 L33.6 22.4 L35.4 24.6 L33.8 28 M33.6 22.4 L31.6 22', '#6b3a24', 1)}
${line('M18 31 L20.4 33.2 L19.4 36 M20.4 33.2 L22.6 33.6', '#6b3a24', .9)}
${line('M26 42 L27.6 46 L25.6 49 M27.6 46 L30 47', '#1e5a8a', 1)}`,

  // a silverback gorilla, shaggy all over (his thick fur blunts spikes)
  hairy_harambe: `${part('M9 55 Q8 38 28 35 Q48 38 47 55 Z', '#3d3a40')}
${line('M14 46 l-2 3 M18 42 l-2 3.4 M38 42 l2 3.4 M42 46 l2 3 M22 49 l-1.4 3.6 M34 49 l1.4 3.6 M28 44 v3.6', '#6a6670', 1.2)}
<path d="M18 45 Q28 39 38 45 Q36 52 28 53 Q20 52 18 45 Z" fill="#55515a"/>
${shaggy(28, 26, 14, 18, '#3d3a40')}
${line('M17 17 Q21 13.6 26 13.6 M30 13.6 Q35 13.6 39 17', '#6a6670', 1.1)}
<path d="M17 26 Q17 16 28 16 Q39 16 39 26 Q39 36 28 37 Q17 36 17 26 Z" fill="#8c7b78" stroke="${OUTLINE}" stroke-width="1.5"/>
<path d="M28 16 Q39 16 39 26 Q39 36 28 37 Q35 30 34 22 Q32 17 28 16 Z" fill="#000" opacity=".14"/>
<path d="M17.5 21 Q28 15 38.5 21 L38 24 Q28 19 18 24 Z" fill="#2a272c"/>
<circle cx="23.5" cy="24.5" r="2.2" fill="#c98a3a"/><circle cx="32.5" cy="24.5" r="2.2" fill="#c98a3a"/>${eye(23.5, 24.6, 1.4)}${eye(32.5, 24.6, 1.4)}
<ellipse cx="28" cy="29.5" rx="5" ry="3" fill="#5d4f4c"/><circle cx="26" cy="29.5" r="1.1" fill="${OUTLINE}"/><circle cx="30" cy="29.5" r="1.1" fill="${OUTLINE}"/>
${line('M23 33.5 Q28 31.5 33 33.5', OUTLINE, 1.5)}${line('M20 31 l1.6 1 M36 31 l-1.6 1', '#6a5a57', 1)}`,

  // a beekeeper in a veiled hat, with a smoker and a little swarm
  buzzy_beatrice: `${part('M15 55 Q16 40 28 38 Q40 40 41 55 Z', '#f2e6c4')}
${line('M28 41 V55', '#c9b98e', 1.2)}<g fill="#c9b98e"><circle cx="26.6" cy="45" r=".8"/><circle cx="26.6" cy="50" r=".8"/></g>
${line('M18 50 Q17 53 17 55 M38 50 Q39 53 39 55', '#c9b98e', 1)}
<rect x="7" y="44" width="7" height="9" rx="1.5" fill="url(#art-metal)" stroke="${OUTLINE}" stroke-width="1.2"/><path d="M8 44 L10.5 40 L13 44 Z" fill="#9aa3b5" stroke="${OUTLINE}" stroke-width="1"/>
<path d="M10.5 40 Q8 36 11 33 Q14 30 11.5 26" fill="none" stroke="#e6e6ee" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
<circle cx="28" cy="27" r="10.5" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
${eye(24, 27, 1.6)}${eye(32, 27, 1.6)}${line('M25 32 q3 2 6 0', OUTLINE, 1.4)}${blush(21.6, 30, 1.8)}${blush(34.4, 30, 1.8)}
<path d="M14 19 L15 38 Q28 41 41 38 L42 19 Z" fill="#2a2a2a" fill-opacity=".14"/>
<path d="M14 19 L15 38 M42 19 L41 38 M17 19 V38.6 M21 19 V39.4 M25 19 V39.8 M29 19 V39.8 M33 19 V39.4 M37 19 V38.8 M40 19 V38.2 M15 24 H41 M15 29 H41 M15 34 H41" stroke="${OUTLINE}" stroke-opacity=".3" stroke-width=".8"/>
${line('M15 38 Q28 41 41 38', OUTLINE, 1, 0.5)}
${part('M14 18 Q28 4 42 18 Z', '#f2e6c4')}${line('M18.5 14 Q28 9 37.5 14', '#c9b98e', 1.2)}${shine('M19 15 Q22 10.6 26 9.4', 1.2)}
<path d="M9 19 H47" stroke="${OUTLINE}" stroke-width="3" stroke-linecap="round"/><path d="M9.6 18.4 H46.4" stroke="#e2d4ac" stroke-width="1.2" stroke-linecap="round"/>
${[[45, 44, 1], [50, 33, 0.75], [44, 27, 0.65], [50, 51, 0.6]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="-1.5" cy="-4.6" rx="3.2" ry="2.1" fill="#fff" fill-opacity=".85" stroke="${OUTLINE}" stroke-width=".8"/><ellipse cx="1.6" cy="-4.2" rx="2.6" ry="1.8" fill="#fff" fill-opacity=".85" stroke="${OUTLINE}" stroke-width=".8"/><ellipse rx="5" ry="3.6" fill="#ffd34d" stroke="${OUTLINE}" stroke-width="1.2"/><path d="M-1.5 -3.4 V3.4 M1.5 -3.4 V3.4" stroke="${OUTLINE}" stroke-width="1.4"/><path d="M5 0 l2 0" stroke="${OUTLINE}" stroke-width="1"/><circle cx="-3.4" cy="-.6" r=".7" fill="${OUTLINE}"/></g>`).join('')}
${line('M47 40 q2 -2 0 -4 q-2 -2 0 -4', OUTLINE, .7, 0.45)}`,

  // the pope on a jet pack: mitre, golden cross, flames roaring out underneath
  his_hovering_holiness: `<rect x="9" y="34" width="7" height="15" rx="3" fill="url(#art-metal)" stroke="${OUTLINE}" stroke-width="1.5"/><rect x="40" y="34" width="7" height="15" rx="3" fill="url(#art-metal)" stroke="${OUTLINE}" stroke-width="1.5"/>
<rect x="9" y="38" width="7" height="2" fill="#e0304e"/><rect x="40" y="38" width="7" height="2" fill="#e0304e"/>
<path d="M8.6 49 Q9 54 12.5 58 Q16 54 16.4 49 Z M39.6 49 Q40 54 43.5 58 Q47 54 47.4 49 Z" fill="#ff8a2a" stroke="#c0400e" stroke-width=".9"/><path d="M10.6 49 Q11 52.6 12.5 55 Q14 52.6 14.4 49 Z M41.6 49 Q42 52.6 43.5 55 Q45 52.6 45.4 49 Z" fill="#ffe66a"/>
${part('M13 55 Q15 39 28 37 Q41 39 43 55 Z', '#fbfbf6')}
${line('M18 47 Q17 51 16.5 55 M38 47 Q39 51 39.5 55', '#d8d4c4', 1.1)}
<path d="M19 40.5 Q28 46 37 40.5 L36 38.5 Q28 43 20 38.5 Z" fill="#e0304e" stroke="${OUTLINE}" stroke-width="1.1"/>
${line('M28 44 V55 M23.5 48.5 H32.5', '#e0a92e', 2.4)}<circle cx="28" cy="48.5" r="1" fill="#fff3b0"/>
<circle cx="28" cy="29" r="9.5" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
${part('M19.5 22 Q19 8 28 2 Q37 8 36.5 22 Z', '#fbfbf6')}
<path d="M19.6 19 H36.4 L36.5 22 H19.5 Z" fill="#e0a92e" stroke="${OUTLINE}" stroke-width="1"/>
${line('M28 6 V17 M24 10.6 H32', '#e0a92e', 2.2)}${shine('M21.6 17 Q21.4 10.6 25.4 6', 1.2)}
${line('M24 29 q1.5 -1.5 3 0 M29 29 q1.5 -1.5 3 0', OUTLINE, 1.4)}${blush(22, 31.6, 1.8)}${blush(34, 31.6, 1.8)}
${line('M25 33.5 q3 2 6 0', OUTLINE, 1.4)}
${line('M6 52 q-1 2 0 4 M50 52 q1 2 0 4', '#9aa3b5', .9, 0.7)}`,

  // what is left of Brittle Bernard: a heap of black rubble
  debris: `<ellipse cx="28" cy="50" rx="23" ry="4" fill="#000" opacity=".3"/>
${part('M6 30 L14 18 L24 22 L30 12 L42 16 L50 28 L46 44 L32 50 L18 48 L8 42 Z', '#26262c').replace(/stroke="#2a1e1a"/g, 'stroke="#0b0b0e"')}
<path d="M14 18 L20 32 L30 12 Z" fill="#3a3a44"/><path d="M30 12 L42 16 L32 30 L20 32 Z" fill="#33333c"/><path d="M8 42 L20 32 L18 48 Z" fill="#1a1a1f"/>
${line('M14 18 L20 32 L30 12 M20 32 L32 30 L42 16 M32 30 L46 44 M20 32 L18 48 M32 30 L32 50', '#45454f', 1.4)}
${line('M22 26 L26 24 M36 22 L38 26 M24 40 l3 2 M38 38 l2 -3', '#6a6a76', 1.1)}
<g fill="#55555f"><circle cx="4" cy="46" r="1.6"/><circle cx="52" cy="44" r="1.3"/><circle cx="48" cy="49" r="1"/></g>`,
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
<g transform="translate(18.5 17) scale(1.13)">${CHARACTERS[stone.type]}</g></svg>`;
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
