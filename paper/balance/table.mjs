// Reads the opponent decks from the game file and runs every pairing in parallel with simd.js.
import fs from 'fs';import {execFile} from 'child_process';
const html=fs.readFileSync(process.argv[2],'utf8'),games=+process.argv[3]||100,depth=process.argv[4]||3;
const foes=[...html.matchAll(/\{name:'([^']+)',line:'[^']*',decks:\[([^\]]*)\]/g)].map(m=>[m[1],m[2].match(/'([^']+)'/g).map(s=>s.slice(1,-1))]);
const REF=['P1^ P1> P1< N1 B1 R1 Q1 K1','P1^ P1> P1v N2 B2 R3 Q3 K1','P2^ P2> P1v N3 B4 R4 Q4 K1','P3^ P2> P2v N4 B5 R5 Q5 K1'];
const jobs=[];
for(const [name,decks] of foes)decks.forEach((d,k)=>jobs.push([name,decks.length===1?'boss':['early','mid','late'][k],decks.length===1?REF[3]:REF[k],d]));
let running=0,i=0;const out=[];
await new Promise(done=>{const go=()=>{while(running<10&&i<jobs.length){const j=jobs[i++];running++;
  execFile('node',['simd.js',j[2],j[3],depth,games,'7'],(e,so)=>{out.push([...j,...so.trim().split(' ').map(Number)]);running--;if(i<jobs.length)go();else if(!running)done();});}};go();});
fs.writeFileSync('table.json',JSON.stringify(out));
for(const [n,p,,d,w,l,dr] of out.sort((a,b)=>a[0]<b[0]?-1:1))console.log(n.padEnd(22),p.padEnd(6),d.padEnd(26),w,l,dr,Math.round(100*w/(w+l))+'%');
