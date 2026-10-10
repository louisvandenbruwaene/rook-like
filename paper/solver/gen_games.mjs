// Plays random games with the real engine from index.html and prints them for `cs replay`.
import fs from 'fs';
const html = fs.readFileSync(process.argv[2], 'utf8');
const core = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
const module = { exports: {} };
new Function('module', 'performance', core)(module, { now: () => 0 });
const E = module.exports;
let seed = 12345; const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
const out = [];
for (let g = 0; g < +process.argv[3]; g++) {
  const n = g % 2 ? 4 : 3, k = n === 3 ? 5 : 8;
  let st = E.newGame(n, 0, rnd);
  const hands = st.hands.map(h => h.map(s => s.s.join(' ')).join(' ')).join(' ');
  const orig = st.hands.map(h => h.slice());
  const moves = [];
  while (!E.full(st)) {
    const L = E.legal(st), [hi, c] = L[rnd() * L.length | 0];
    moves.push(orig[st.turn].indexOf(st.hands[st.turn][hi]) + ' ' + c); // index into the ORIGINAL hand
    st = E.play(st, hi, c);
  }
  const sp = st.at.map(a => a ? a.s.join(' ') : '0 0 0 0').join(' ');
  out.push(`${n} ${k} ${hands} ${moves.length} ${moves.join(' ')} ${Array.from(st.own).join(' ')} ${sp}`);
}
console.log(out.join('\n'));
