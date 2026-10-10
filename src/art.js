/* =====================================================================
   ART  (builds on rules.js)
   Every stone and portrait is an SVG string drawn in code. Shared with stone-sheet.js.
   Stones are drawn in a 100 x 100 box: the body is a rounded square from 15 to 85,
   and the spikes stand outside it.
   ===================================================================== */

/* ---------- Colours ---------- */

// Spike colours for YOU, OPPONENT and RUBBLE. The stone bodies use the gradients in the page's <defs>.
const SPIKE_COLOURS = [
  { light: '#bfe0ff', mid: '#5aa6f5', dark: '#123a6e' },
  { light: '#ffd0c4', mid: '#f06a55', dark: '#6e1a12' },
  { light: '#8a8a96', mid: '#55555f', dark: '#0b0b0e' },
];
const OUTLINE = '#2a1e1a';
const SKIN = '#f2c9a0';

/* ---------- Characters ----------
   One per piece, drawn in a 56 x 56 box that sits on the stone's face. */

const CHARACTERS = {
  P: `<path d="M17 54 Q18 38 28 36 Q38 38 39 54 Z" fill="#e3d6bd" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round"/>
<path d="M20 44 q-5 4 -3 9 M36 44 q5 4 3 9" stroke="${OUTLINE}" stroke-width="2" fill="none" stroke-linecap="round"/>
<circle cx="28" cy="24" r="11" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
<path d="M21 20 L26 18.5 M35 20 L30 18.5" stroke="${OUTLINE}" stroke-width="1.8" stroke-linecap="round"/>
<circle cx="24" cy="24" r="1.7" fill="${OUTLINE}"/><circle cx="32" cy="24" r="1.7" fill="${OUTLINE}"/>
<path d="M23.5 30.5 q2 -2 3.5 0 q2 2 3.5 0 q1 -1.5 2 0" fill="none" stroke="${OUTLINE}" stroke-width="1.6" stroke-linecap="round"/>
<path d="M40 13 q4 5 0 7.5 q-4 -2.5 0 -7.5 Z" fill="#9fd8ff" stroke="${OUTLINE}" stroke-width="1.2"/>`,
  N: `<path d="M41 54 L40 34 Q42 21 36 14 L38 5 L31.5 10.5 L28 5 L26.5 12 Q17 14 11 26 Q8 31 12.5 34.5 Q17 37 22 33 L26 32 Q24 43 18 54 Z" fill="#e7c398" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round"/>
<path d="M36 14 Q47 21 45 34 Q48 44 46 54 L41 54 L40 34 Q42 21 36 14 Z" fill="#7a4a2a" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round"/>
<circle cx="26" cy="19.5" r="5" fill="#fff" stroke="${OUTLINE}" stroke-width="1.6"/><circle cx="27.3" cy="21" r="2.3" fill="${OUTLINE}"/>
<circle cx="14" cy="29" r="1.4" fill="${OUTLINE}"/>
<path d="M14.5 34 L14.5 38 L18 38 L18 33.5" fill="#fff" stroke="${OUTLINE}" stroke-width="1.3" stroke-linejoin="round"/>`,
  B: `<path d="M17 55 Q24 47 22.5 43 Q17 37 22 33 L34 33 Q39 37 33.5 43 Q32 47 39 55 Z" fill="#8a4fd1" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round"/>
<path d="M22.6 42.5 Q28 45 33.4 42.5" fill="none" stroke="#f3c54a" stroke-width="2.2"/>
<circle cx="28" cy="25" r="7.5" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
<path d="M21.5 20.5 Q20.5 10 28 2.5 Q35.5 10 34.5 20.5 Z" fill="#fbefd9" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round"/>
<path d="M30.5 6 L25.5 14" stroke="${OUTLINE}" stroke-width="1.6"/><path d="M21.5 18 H34.5" stroke="#f3c54a" stroke-width="2"/>
<path d="M24 25 q1.5 -1.5 3 0" stroke="${OUTLINE}" stroke-width="1.4" fill="none"/><circle cx="31.5" cy="25" r="1.3" fill="${OUTLINE}"/>
<path d="M25.5 28.5 q2.5 2 5 0" stroke="#c0304e" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  R: `<rect x="11" y="43" width="34" height="13" fill="#2fa7a0" stroke="${OUTLINE}" stroke-width="2"/>
<rect x="22" y="43" width="12" height="4" fill="#c99868"/>
<rect x="13" y="9" width="30" height="32" fill="#c99868" stroke="${OUTLINE}" stroke-width="2"/>
<path d="M13 9 H43 V17 H39 V14 H17 V17 H13 Z" fill="#4a2f1c"/>
<path d="M13 10 V2 H19 V5.5 H25 V2 H31 V5.5 H37 V2 H43 V10 Z" fill="#a9b1c2" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
<rect x="17" y="23" width="4.5" height="4" fill="#fff"/><rect x="21.5" y="23" width="4" height="4" fill="#4a3b9a"/>
<rect x="30.5" y="23" width="4" height="4" fill="#4a3b9a"/><rect x="34.5" y="23" width="4.5" height="4" fill="#fff"/>
<rect x="25.5" y="27" width="5" height="4" fill="#8a5a3a"/><rect x="21.5" y="32" width="13" height="3.5" fill="#6b3a24"/>
<rect x="21.5" y="35.5" width="4" height="3" fill="#6b3a24"/><rect x="30.5" y="35.5" width="4" height="3" fill="#6b3a24"/>`,
  Q: `<path d="M13 54 Q9 30 15.5 17 Q28 6 40.5 17 Q47 30 43 54 Q37 47 37 36 L19 36 Q19 47 13 54 Z" fill="#f0bf48" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round"/>
<path d="M17 56 Q19 43 28 42 Q37 43 39 56 Z" fill="#d6427a" stroke="${OUTLINE}" stroke-width="2"/>
<ellipse cx="28" cy="28" rx="10" ry="12" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
<path d="M18.5 22 Q24 14 33 17 Q37 19 38 24 Q33 18 25 20 Z" fill="#f0bf48" stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round"/>
<path d="M19 15 L22 8 L25 13 L28 5 L31 13 L34 8 L37 15 Z" fill="#ffd34d" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="28" cy="11" r="1.6" fill="#e0304e"/>
<path d="M21.5 27 q2.5 2 5 0 M29.5 27 q2.5 2 5 0" stroke="${OUTLINE}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
<path d="M21.5 27 l-2 -1.5 M34.5 27 l2 -1.5 M23 28 l-1 1.6 M33 28 l1 1.6" stroke="${OUTLINE}" stroke-width="1.2" stroke-linecap="round"/>
<circle cx="21" cy="32" r="2.3" fill="#ff8aa8" opacity=".6"/><circle cx="35" cy="32" r="2.3" fill="#ff8aa8" opacity=".6"/>
<path d="M25 34 q3 2.6 6 0 q-3 -1.2 -6 0 Z" fill="#e0304e" stroke="#a01d35" stroke-width=".8"/><circle cx="34" cy="35.5" r=".9" fill="${OUTLINE}"/>`,
  K: `<circle cx="28" cy="31" r="12.5" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
<path d="M15.5 31 Q15 52 28 54 Q41 52 40.5 31 Q37 40 28 40 Q19 40 15.5 31 Z" fill="#8a5a3a" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round"/>
<path d="M20 37.5 Q28 31.5 36 37.5 Q28 35.5 20 37.5 Z" fill="#6a4228" stroke="${OUTLINE}" stroke-width="1.2" stroke-linejoin="round"/>
<circle cx="23.5" cy="29" r="1.8" fill="${OUTLINE}"/><circle cx="32.5" cy="29" r="1.8" fill="${OUTLINE}"/>
<path d="M20 25.5 L26 26.5 M36 25.5 L30 26.5" stroke="${OUTLINE}" stroke-width="1.8" stroke-linecap="round"/>
<path d="M13 22 L13 6 L20.5 12.5 L28 2 L35.5 12.5 L43 6 L43 22 Z" fill="#ffcf3f" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round"/>
<rect x="13" y="17.5" width="30" height="4.5" fill="#e0a92e" stroke="${OUTLINE}" stroke-width="1.4"/>
<circle cx="20.5" cy="14.5" r="2" fill="#4aa3ff" stroke="${OUTLINE}" stroke-width="1"/><circle cx="28" cy="12" r="2.4" fill="#e0304e" stroke="${OUTLINE}" stroke-width="1"/><circle cx="35.5" cy="14.5" r="2" fill="#3cc47a" stroke="${OUTLINE}" stroke-width="1"/>`,
  S: `<path d="M10 50 Q4 40 14 36 Q26 33 24 26 Q22 18 30 15" fill="none" stroke="${OUTLINE}" stroke-width="9" stroke-linecap="round"/>
<path d="M10 50 Q4 40 14 36 Q26 33 24 26 Q22 18 30 15" fill="none" stroke="#5fb24a" stroke-width="6" stroke-linecap="round"/>
<path d="M12 46 L16 44 M15 38 L19 37 M22 30 L26 30 M24 22 L28 22" stroke="#2f6e27" stroke-width="1.6" stroke-linecap="round"/>
<path d="M27 8 Q40 4 46 13 Q46 22 36 23 Q27 22 26 15 Z" fill="#6cc153" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round"/>
<circle cx="37" cy="12" r="2.2" fill="#ffe14a" stroke="${OUTLINE}" stroke-width="1"/><path d="M37 10.6 V13.4" stroke="${OUTLINE}" stroke-width="1"/>
<path d="M40 21 L41 26 L43 21 M44 18 L49 20 M49 20 L52 18 M49 20 L52 22" fill="#fff" stroke="${OUTLINE}" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M44 18 L49 20" stroke="#e0304e" stroke-width="1.6"/>`,
  W: `<path d="M15 55 Q16 40 28 38 Q40 40 41 55 Z" fill="#8a6d9e" stroke="${OUTLINE}" stroke-width="2"/>
<path d="M17 44 Q28 50 39 44 L38 41 Q28 46 18 41 Z" fill="#c9b6d6" stroke="${OUTLINE}" stroke-width="1.2"/>
<circle cx="28" cy="26" r="11" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
<path d="M17 24 Q18 12 28 12 Q38 12 39 24 Q34 17 28 17 Q22 17 17 24 Z" fill="#d6d6dc" stroke="${OUTLINE}" stroke-width="1.6"/>
<circle cx="28" cy="9" r="5" fill="#d6d6dc" stroke="${OUTLINE}" stroke-width="1.6"/>
<circle cx="23.5" cy="26" r="3.3" fill="none" stroke="${OUTLINE}" stroke-width="1.4"/><circle cx="32.5" cy="26" r="3.3" fill="none" stroke="${OUTLINE}" stroke-width="1.4"/><path d="M26.8 26 H29.2" stroke="${OUTLINE}" stroke-width="1.2"/>
<circle cx="23.5" cy="26" r="1" fill="${OUTLINE}"/><circle cx="32.5" cy="26" r="1" fill="${OUTLINE}"/>
<path d="M24 32 q4 2.4 8 0" stroke="${OUTLINE}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<path d="M44 20 Q49 20 49 25 M48 24 L45 55" fill="none" stroke="#7a4a2a" stroke-width="2.6" stroke-linecap="round"/>`,
  E: `<path d="M12 55 Q14 38 28 37 Q42 38 44 55 Z" fill="#6a2fb0" stroke="${OUTLINE}" stroke-width="2"/>
<path d="M18 42 Q24 50 28 44 Q32 50 38 42" fill="none" stroke="#6cc153" stroke-width="2.4" stroke-linecap="round"/><circle cx="38" cy="42" r="1.8" fill="#6cc153" stroke="${OUTLINE}" stroke-width=".8"/>
<circle cx="28" cy="27" r="10.5" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
<path d="M18 26 Q18 14 28 14 Q38 14 38 26 Q34 20 28 20 Q22 20 18 26 Z" fill="#d6d6dc" stroke="${OUTLINE}" stroke-width="1.5"/>
<path d="M14 15 L14 3 L20.5 9 L28 0 L35.5 9 L42 3 L42 15 Z" fill="#ffcf3f" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
<circle cx="20.5" cy="11.5" r="1.8" fill="#6cc153" stroke="${OUTLINE}" stroke-width=".8"/><circle cx="28" cy="9" r="2.2" fill="#e0304e" stroke="${OUTLINE}" stroke-width=".8"/><circle cx="35.5" cy="11.5" r="1.8" fill="#4aa3ff" stroke="${OUTLINE}" stroke-width=".8"/>
<path d="M22.5 27 q2 -2 4 0 M29.5 27 q2 -2 4 0" stroke="${OUTLINE}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<path d="M24 32.5 q4 2 8 0" stroke="#a01d35" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  J: `<path d="M15 55 Q16 41 28 39 Q40 41 41 55 Z" fill="#3b9ad8" stroke="${OUTLINE}" stroke-width="2"/>
<path d="M28 39 L25 55 M28 39 L31 55" stroke="#ffd34d" stroke-width="2"/>
<circle cx="28" cy="27" r="11.5" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
<path d="M16 17 L19 7 L23 13 L28 4 L31 12 L36 8 L37 17 Z" fill="#ffcf3f" stroke="${OUTLINE}" stroke-width="1.7" stroke-linejoin="round" transform="rotate(-14 27 13)"/>
<circle cx="23" cy="26" r="3.2" fill="#fff" stroke="${OUTLINE}" stroke-width="1.2"/><circle cx="24.4" cy="26.6" r="1.4" fill="${OUTLINE}"/>
<circle cx="33" cy="25" r="2.4" fill="#fff" stroke="${OUTLINE}" stroke-width="1.2"/><circle cx="31.9" cy="25.4" r="1.1" fill="${OUTLINE}"/>
<path d="M22 33 Q28 37 34 32" fill="none" stroke="${OUTLINE}" stroke-width="1.6" stroke-linecap="round"/>
<rect x="26" y="33.5" width="3" height="3" fill="#fff" stroke="${OUTLINE}" stroke-width=".8"/><rect x="29" y="33.3" width="3" height="3" fill="#fff" stroke="${OUTLINE}" stroke-width=".8"/>`,
  G: `<path d="M9 55 Q8 38 28 35 Q48 38 47 55 Z" fill="#3d3a40" stroke="${OUTLINE}" stroke-width="2"/>
<circle cx="28" cy="26" r="14" fill="#3d3a40" stroke="${OUTLINE}" stroke-width="2"/>
<path d="M17 26 Q17 16 28 16 Q39 16 39 26 Q39 36 28 37 Q17 36 17 26 Z" fill="#8c7b78" stroke="${OUTLINE}" stroke-width="1.5"/>
<path d="M17.5 21 Q28 15 38.5 21 L38 24 Q28 19 18 24 Z" fill="#2a272c"/>
<circle cx="23.5" cy="24" r="1.8" fill="${OUTLINE}"/><circle cx="32.5" cy="24" r="1.8" fill="${OUTLINE}"/>
<ellipse cx="28" cy="29.5" rx="5" ry="3" fill="#5d4f4c"/><circle cx="26" cy="29.5" r="1" fill="${OUTLINE}"/><circle cx="30" cy="29.5" r="1" fill="${OUTLINE}"/>
<path d="M23 33.5 Q28 31.5 33 33.5" stroke="${OUTLINE}" stroke-width="1.5" fill="none"/>`,
  H: `<path d="M15 55 Q16 40 28 38 Q40 40 41 55 Z" fill="#f2e6c4" stroke="${OUTLINE}" stroke-width="2"/>
<circle cx="28" cy="27" r="10.5" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
<path d="M14 18 Q28 4 42 18 Z" fill="#f2e6c4" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round"/><path d="M10 19 H46" stroke="${OUTLINE}" stroke-width="2.4" stroke-linecap="round"/>
<path d="M14 19 L15 38 M42 19 L41 38 M17 19 V38 M21 19 V38 M25 19 V38 M29 19 V38 M33 19 V38 M37 19 V38 M40 19 V38 M15 24 H41 M15 29 H41 M15 34 H41" stroke="${OUTLINE}" stroke-opacity=".28" stroke-width=".9"/>
<circle cx="24" cy="27" r="1.6" fill="${OUTLINE}"/><circle cx="32" cy="27" r="1.6" fill="${OUTLINE}"/><path d="M25 32 q3 2 6 0" stroke="${OUTLINE}" stroke-width="1.4" fill="none"/>
<g transform="translate(43 44)"><ellipse rx="5" ry="3.6" fill="#ffd34d" stroke="${OUTLINE}" stroke-width="1.2"/><path d="M-1.5 -3.4 V3.4 M1.5 -3.4 V3.4" stroke="${OUTLINE}" stroke-width="1.4"/><ellipse cx="-1" cy="-4.5" rx="3" ry="2" fill="#fff" fill-opacity=".8" stroke="${OUTLINE}" stroke-width=".8"/></g>`,
  O: `<path d="M13 55 Q15 39 28 37 Q41 39 43 55 Z" fill="#fbfbf6" stroke="${OUTLINE}" stroke-width="2"/>
<path d="M28 38 V55 M23 46 H33" stroke="#e0a92e" stroke-width="2.4"/>
<circle cx="28" cy="29" r="9.5" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2"/>
<path d="M19.5 22 Q19 8 28 2 Q37 8 36.5 22 Z" fill="#fbfbf6" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round"/>
<path d="M28 6 V18 M24 11 H32" stroke="#e0a92e" stroke-width="2.2" stroke-linecap="round"/>
<path d="M24 29 q1.5 -1.5 3 0 M29 29 q1.5 -1.5 3 0" stroke="${OUTLINE}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
<path d="M25 33.5 q3 2 6 0" stroke="${OUTLINE}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
  X: `<path d="M6 30 L14 18 L24 22 L30 12 L42 16 L50 28 L46 44 L32 50 L18 48 L8 42 Z" fill="#26262c" stroke="#0b0b0e" stroke-width="2" stroke-linejoin="round"/>
<path d="M14 18 L20 32 L30 12 M20 32 L32 30 L42 16 M32 30 L46 44 M20 32 L18 48 M32 30 L32 50" fill="none" stroke="#45454f" stroke-width="1.4"/>
<path d="M22 26 L26 24 M36 22 L38 26" stroke="#6a6a76" stroke-width="1.2"/>`,
};

/* ---------- Stones ---------- */

// One faceted spike pointing up from the base line to the tip: a light half and a dark half.
// A breaking spike gets the class "breaking", which the page animates as it shatters.
function drawSpike({ x, base, tip, halfWidth, breaking, colours }) {
  const className = breaking ? ' class="breaking"' : '';
  const left = x - halfWidth;
  const right = x + halfWidth;
  return (
    `<g${className}>` +
    `<path d="M${left} ${base} L${x} ${tip} L${x} ${base}Z" fill="${colours.light}"/>` +
    `<path d="M${x} ${tip} L${right} ${base} L${x} ${base}Z" fill="${colours.mid}"/>` +
    `<path d="M${left} ${base} L${x} ${tip} L${right} ${base}" fill="none" stroke="${colours.dark}" stroke-width="1.8" stroke-linejoin="round"/>` +
    `</g>`
  );
}

// The rounded square with its shadow and sheen, in the owner's colour.
function drawStoneBody(owner) {
  const dark = SPIKE_COLOURS[owner].dark;
  return `<rect x="15" y="19" width="70" height="70" rx="12" fill="${dark}"/>
<rect x="15" y="15" width="70" height="70" rx="12" fill="url(#body${owner})" stroke="${dark}" stroke-width="2.5"/>
<rect x="18" y="18" width="64" height="64" rx="9" fill="url(#sheen)"/>`;
}

// A golden shield on each side, for Old King Coal.
function drawGoldenShields() {
  let shields = '';
  for (const side of SIDES) {
    shields += `<rect x="25" y="5.5" width="50" height="10" rx="5" fill="url(#gold)" stroke="#8a5a00" stroke-width="2" transform="rotate(${side * 90} 50 50)"/>`;
  }
  return shields;
}

// The spikes on one side, drawn on the top side and turned into place. Spikes sit closer together
// when there are more than three. breakingCount extra spikes are drawn breaking off.
function drawSpikes(side, count, breakingCount, colours) {
  const total = count + breakingCount;
  if (total === 0) return '';
  let spacing = 12;
  if (total === 4) spacing = 14.5;
  if (total <= 3) spacing = 18;
  const halfWidth = total <= 3 ? 7.5 : spacing / 2;
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
  return `<svg viewBox="0 0 100 100">${drawStoneBody(OPPONENT)}<text x="50" y="66" text-anchor="middle" font-family="Fredoka,system-ui" font-weight="700" font-size="44" fill="#ffe0d6" opacity=".85">?</text></svg>`;
}

/* ---------- Opponent portraits ----------
   Drawn in a 100 x 100 box, shown in a circle. */

const PORTRAITS = {
  pete: `<rect width="100" height="100" fill="#6b5a3e"/><path d="M14 100 Q16 74 50 70 Q84 74 86 100Z" fill="#3a2f2a"/><path d="M42 72 L50 84 L58 72Z" fill="#fff"/><path d="M40 80 L50 76 L60 80 L60 86 L50 82 L40 86Z" fill="#c43c3c"/>
<ellipse cx="50" cy="46" rx="25" ry="28" fill="#f0c49a" stroke="${OUTLINE}" stroke-width="2.5"/><ellipse cx="42" cy="26" rx="10" ry="4" fill="#fff" opacity=".35"/>
<circle cx="40" cy="44" r="3" fill="${OUTLINE}"/><circle cx="60" cy="44" r="8" fill="rgba(200,230,255,.35)" stroke="#e0a92e" stroke-width="2.5"/><circle cx="60" cy="44" r="3" fill="${OUTLINE}"/><path d="M68 47 Q74 60 70 72" stroke="#e0a92e" stroke-width="1.5" fill="none"/>
<path d="M30 60 Q38 52 50 58 Q62 52 70 60 Q66 64 62 60 Q56 62 50 61 Q44 62 38 60 Q34 64 30 60Z" fill="#5a3a22" stroke="${OUTLINE}" stroke-width="1.5"/>`,
  neigh: `<rect width="100" height="100" fill="#3d5470"/><path d="M14 100 Q16 76 50 72 Q84 76 86 100Z" fill="#8a96a8" stroke="${OUTLINE}" stroke-width="2"/>
<path d="M50 6 Q68 0 74 20 Q64 12 56 16Z" fill="#e0304e" stroke="${OUTLINE}" stroke-width="2"/>
<path d="M26 72 L26 36 Q26 14 50 14 Q74 14 74 36 L74 72 Z" fill="#b8c2d0" stroke="${OUTLINE}" stroke-width="2.5"/>
<path d="M30 40 H70 V48 H30Z" fill="#1a2030"/><path d="M50 14 V40 M50 48 V72" stroke="#8a96a8" stroke-width="3"/>
<g fill="#1a2030"><circle cx="38" cy="58" r="1.8"/><circle cx="44" cy="62" r="1.8"/><circle cx="56" cy="62" r="1.8"/><circle cx="62" cy="58" r="1.8"/></g>
<circle cx="40" cy="44" r="2.2" fill="#ffe08a"/><circle cx="60" cy="44" r="2.2" fill="#ffe08a"/>`,
  swerve: `<rect width="100" height="100" fill="#5b3d75"/><circle cx="50" cy="20" r="18" fill="#a23ec6" stroke="${OUTLINE}" stroke-width="2.5"/><path d="M20 60 Q18 28 50 26 Q82 28 80 60 Q76 76 70 90 L30 90 Q24 76 20 60Z" fill="#a23ec6" stroke="${OUTLINE}" stroke-width="2.5"/>
<path d="M18 100 Q22 80 50 78 Q78 80 82 100Z" fill="#f3c54a" stroke="${OUTLINE}" stroke-width="2"/>
<ellipse cx="50" cy="54" rx="20" ry="23" fill="#d9a07a" stroke="${OUTLINE}" stroke-width="2.5"/>
<path d="M30 46 H70 L68 54 Q60 58 54 52 H46 Q40 58 32 54Z" fill="#14141c" stroke="${OUTLINE}" stroke-width="1.5"/><path d="M34 48 L40 48" stroke="#fff" stroke-width="2" opacity=".6"/>
<path d="M42 66 Q50 72 58 66 Q50 69 42 66Z" fill="#c0304e" stroke="#801a30" stroke-width="1.5"/>`,
  barb: `<rect width="100" height="100" fill="#3e6b4a"/><rect x="18" y="80" width="64" height="20" fill="#d9c13a" stroke="${OUTLINE}" stroke-width="2.5"/>
<rect x="24" y="20" width="52" height="58" fill="#e8b590" stroke="${OUTLINE}" stroke-width="2.5"/><rect x="24" y="14" width="52" height="16" fill="#e0603a" stroke="${OUTLINE}" stroke-width="2.5"/><rect x="24" y="30" width="8" height="18" fill="#e0603a"/><rect x="68" y="30" width="8" height="18" fill="#e0603a"/>
<rect x="32" y="40" width="14" height="10" fill="none" stroke="${OUTLINE}" stroke-width="3"/><rect x="54" y="40" width="14" height="10" fill="none" stroke="${OUTLINE}" stroke-width="3"/><path d="M46 44 H54" stroke="${OUTLINE}" stroke-width="3"/>
<rect x="37" y="43" width="5" height="5" fill="${OUTLINE}"/><rect x="58" y="43" width="5" height="5" fill="${OUTLINE}"/>
<rect x="38" y="62" width="24" height="5" fill="#8a3a2a"/><rect x="34" y="58" width="5" height="5" fill="#8a3a2a"/><rect x="61" y="58" width="5" height="5" fill="#8a3a2a"/>`,
  lux: `<rect width="100" height="100" fill="#7a3550"/><path d="M18 76 Q14 30 50 20 Q86 30 82 76 Q70 66 70 50 L30 50 Q30 66 18 76Z" fill="#2a1a24" stroke="${OUTLINE}" stroke-width="2.5"/>
<path d="M10 100 Q14 78 30 80 Q40 86 50 82 Q60 86 70 80 Q86 78 90 100Z" fill="#ff8ac4" stroke="${OUTLINE}" stroke-width="2"/><g fill="#ffb6dc"><circle cx="20" cy="86" r="6"/><circle cx="34" cy="88" r="6"/><circle cx="66" cy="88" r="6"/><circle cx="80" cy="86" r="6"/></g>
<ellipse cx="50" cy="52" rx="20" ry="24" fill="#f5cfb0" stroke="${OUTLINE}" stroke-width="2.5"/>
<path d="M36 48 q5 4 10 0 M54 48 q5 4 10 0" stroke="${OUTLINE}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M36 48 l-3 -3 M38 49 l-2 -4 M64 48 l3 -3 M62 49 l2 -4" stroke="${OUTLINE}" stroke-width="1.6"/>
<circle cx="35" cy="58" r="4" fill="#ff8aa8" opacity=".6"/><circle cx="65" cy="58" r="4" fill="#ff8aa8" opacity=".6"/>
<path d="M43 64 Q50 70 57 64 Q50 61 43 64Z" fill="#e0304e" stroke="#a01d35" stroke-width="1.2"/><circle cx="62" cy="64" r="1.6" fill="${OUTLINE}"/>`,
  gambit: `<rect width="100" height="100" fill="#4a4a52"/><path d="M14 100 Q16 76 50 72 Q84 76 86 100Z" fill="#6b4a2a" stroke="${OUTLINE}" stroke-width="2"/>
<ellipse cx="50" cy="50" rx="24" ry="27" fill="#e8b78e" stroke="${OUTLINE}" stroke-width="2.5"/>
<path d="M22 34 Q28 14 52 14 Q76 16 80 30 L86 34 Q60 30 22 36Z" fill="#7a7a6a" stroke="${OUTLINE}" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M34 40 L44 42 M56 38 L66 36" stroke="${OUTLINE}" stroke-width="2.5" stroke-linecap="round"/><circle cx="40" cy="47" r="2.8" fill="${OUTLINE}"/><path d="M56 47 q4 -3 8 0" stroke="${OUTLINE}" stroke-width="2.4" fill="none"/>
<path d="M34 60 Q50 76 68 58 Q50 66 34 60Z" fill="#fff" stroke="${OUTLINE}" stroke-width="2"/><rect x="54" y="61" width="5" height="5" fill="#f3c54a" stroke="${OUTLINE}" stroke-width="1"/>`,
  boss: `<rect width="100" height="100" fill="#140d1e"/><circle cx="50" cy="56" r="44" fill="#9b5de5" opacity=".18"/>
<path d="M12 100 Q16 74 50 70 Q84 74 88 100Z" fill="#2a1f38" stroke="#9b5de5" stroke-width="2"/>
<path d="M26 74 Q22 40 50 34 Q78 40 74 74 Q62 84 50 84 Q38 84 26 74Z" fill="#241a30" stroke="#9b5de5" stroke-width="2.5"/>
<path d="M36 52 L46 56 L36 58Z M64 52 L54 56 L64 58Z" fill="#e2b6ff"/><circle cx="41" cy="55" r="7" fill="#c78bff" opacity=".35"/><circle cx="59" cy="55" r="7" fill="#c78bff" opacity=".35"/>
<path d="M40 70 L44 66 L48 70 L52 66 L56 70 L60 66" stroke="#9b5de5" stroke-width="2" fill="none"/>
<path d="M18 38 L18 8 L30 22 L40 2 L50 18 L60 2 L70 22 L82 8 L82 38 Z" fill="#1c1428" stroke="#e2b6ff" stroke-width="2.5" stroke-linejoin="round"/>
<g fill="#c78bff"><circle cx="30" cy="30" r="3"/><circle cx="50" cy="28" r="4"/><circle cx="70" cy="30" r="3"/></g>`,
};

function drawPortrait(opponent) {
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${PORTRAITS[opponent.portrait]}</svg>`;
}
