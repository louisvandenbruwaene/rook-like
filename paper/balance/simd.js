// One pairing: the reference deck (you, facing up) against an opponent deck, both played by the same
// fixed-depth search, alternating who places first. Usage: node simd.js "<your deck>" "<their deck>" DEPTH GAMES SEED
const C=require('./core.js');
const deck=(str,f)=>str.split(' ').map(code=>C.stoneOf(code,f));
const [a,b,depth,N,seed]=process.argv.slice(2);
let r=+seed||1;const rnd=()=>{r=(r*9301+49297)%233280;return r/233280};
let w=0,l=0,d=0;
for(let i=0;i<+N;i++){
  let st=C.newGame(4,[deck(a,0),deck(b,1)],i%2);
  while(!C.full(st))st=C.play(st,...C.think(st,1e9,rnd,+depth));
  const x=C.score(st,0)-C.score(st,1);x>0?w++:x<0?l++:d++;
}
console.log(w,l,d);
