// For every mid, late and final deck: add levels one at a time (most valuable stone first, round robin, max 5)
// and binary-search the number of added levels whose share for the reference hand is closest to the phase target.
import fs from 'fs';import {execFile} from 'child_process';
const html=fs.readFileSync(process.argv[2],'utf8'),GAMES=+process.argv[3]||60;
const REF={early:'P1^ P1> P1< N1 B1 R1 Q1 K1',mid:'P1^ P1> P1v N2 B2 R3 Q3 K1',late:'P2^ P2> P1v N3 B4 R4 Q4 K1',final:'P3^ P2> P2v N4 B5 R5 Q5 K1'};
const TARGET={early:.90,mid:.75,late:.55,final:.15},RANK='OEQGJRBSNHWP';
const foes=[...html.matchAll(/\{name:'([^']+)',line:'[^']*',decks:\[([^\]]*)\]/g)].map(m=>[m[1],m[2].match(/'([^']+)'/g).map(s=>s.slice(1,-1))]);
function raise(deck,j){
  // j > 0 adds j levels, j < 0 removes -j levels, round robin over the stones in RANK order, levels stay within 1..5.
  const st=deck.split(' ').map(c=>[c[0],+c[1],c.slice(2)]),order=[...st.keys()].filter(i=>RANK.includes(st[i][0])).sort((a,b)=>RANK.indexOf(st[a][0])-RANK.indexOf(st[b][0]));
  const d=Math.sign(j),ok=l=>d>0?l<5:l>1;
  for(let k=0,guard=0;k<Math.abs(j)&&guard<99;guard++)for(const i of order){if(k>=Math.abs(j))break;if(ok(st[i][1])){st[i][1]+=d;k++;}}
  return st.map(([t,l,dir])=>t+l+dir).join(' '); // a weak guy keeps its direction
}
const sim=(ref,deck)=>new Promise(r=>execFile('node',['simd.js',ref,deck,'3',GAMES,'11'],(e,o)=>{const [w,l]=o.trim().split(' ').map(Number);r(w/(w+l||1));}));
const jobs=[];
for(const [name,decks] of foes)decks.forEach((d,k)=>{const ph=decks.length===1?'final':['early','mid','late'][k];jobs.push({name,ph,d});});
let slots=10;const queue=[];const limit=fn=>new Promise(res=>{const go=async()=>{slots--;const v=await fn();slots++;res(v);if(queue.length)queue.shift()();};slots>0?go():queue.push(go);});
const results=await Promise.all(jobs.map(async j=>{
  // share falls as levels are added; find the smallest j with share <= target, then pick the closer of j-1 and j
  let lo=-12,hi=24,memo={};
  const f=async x=>memo[x]??=await limit(()=>sim(REF[j.ph],raise(j.d,x)));
  while(lo<hi){const m=(lo+hi)>>1;(await f(m))<=TARGET[j.ph]?hi=m:lo=m+1;}
  let best=lo;if(lo>-12&&Math.abs((await f(lo-1))-TARGET[j.ph])<Math.abs((await f(lo))-TARGET[j.ph]))best=lo-1;
  return {...j,add:best,deck:raise(j.d,best),share:await f(best)};
}));
for(const r of results)console.log(r.name.padEnd(22),r.ph.padEnd(6),((r.add>=0?'+':'')+r.add).padEnd(4),r.deck.padEnd(26),Math.round(100*r.share)+'%');
fs.writeFileSync('tuned.json',JSON.stringify(results));
