// Builds an HTML sheet of every stone and level, drawn with the game's own code, rated by single fights.
const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
const core=html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
const ui=html.match(/<script>\nconst \$=[\s\S]*?<\/script>/)[0];
const draw=ui.slice(ui.indexOf('const STONE='),ui.indexOf('const backSVG'));
const defs=html.match(/<defs>[\s\S]*?<\/defs>/)[0];
const E=new Function(core+'\n'+draw+'\nreturn {PIECES,MAXL,mkStone,newGame,play,score,stoneSVG};')();
const ORDER='PNBRQK',DIRS={P:4,B:4};
// every stone an opponent can bring: each piece, level and direction
const all=[];for(const t of ORDER)for(let l=1;l<=5;l++)for(let d=0;d<(DIRS[t]||1);d++)all.push([t,l,d]);
function duel(attacker,defender,side){
  // attacker (blue) is placed next to defender (red); returns blue's net points from that one move
  const g=E.newGame(4,[[attacker],[]],0),def=5,cells=[1,6,9,4]; // up, right, down, left of square 5
  g.own[def]=1;g.at[def]=defender;
  const a=E.play(g,0,cells[side]);
  return E.score(a,0)-E.score(g,0)-E.PIECES[attacker.t].val; // points won minus the new stone if it was taken
}
const rating={};
for(const t of ORDER)for(let l=1;l<=5;l++){
  let sum=0,n=0;
  for(let d=0;d<(DIRS[t]||1);d++)for(const [u,m,e] of all)for(let side=0;side<4;side++){
    // placed next to the other stone, and the other stone placed next to this one
    sum+=duel(E.mkStone(t,l,0,d),E.mkStone(u,m,1,e),side);n++;
    sum-=duel(E.mkStone(u,m,0,e),E.mkStone(t,l,1,d),side);n++;
  }
  rating[t+l]=sum/n;
}
const vals=Object.values(rating),lo=Math.min(...vals),hi=Math.max(...vals);
const out=k=>Math.max(1,Math.round(1+99*(rating[k]-lo)/(hi-lo)));
const svg=(t,l,d)=>E.stoneSVG(E.mkStone(t,l,0,d),0,'');
const arrows={P:'↑ → ↓ ←',B:'↗ ↘ ↙ ↖'};
let rows='';
for(const t of ORDER){
  const P=E.PIECES[t];
  rows+=`<section><div class="head"><h2>${P.name}</h2><span class="chess">${P.chess}${P.val>1?`, counts as ${P.val}`:''}</span>
<p>${P.text[0].toUpperCase()+P.text.slice(1)}.</p></div><div class="levels">`;
  for(let l=1;l<=5;l++){
    const s=E.mkStone(t,l,0,0).s;
    rows+=`<div class="lv"><div class="pic">${svg(t,l,0)}</div><div class="lvl">Level ${l}</div><div class="sp">${s.join(' · ')}</div><div class="score"><b>${out(t+l)}</b>/100</div></div>`;
  }
  rows+='</div>';
  if(DIRS[t])rows+=`<div class="variants"><span>Four variants (${arrows[t]}), all rated the same:</span>${[0,1,2,3].map(d=>`<div class="mini">${svg(t,1,d)}</div>`).join('')}</div>`;
  rows+='</section>';
}
const table=ORDER.split('').map(t=>`<tr><td>${E.PIECES[t].name}</td>${[1,2,3,4,5].map(l=>`<td>${out(t+l)}</td>`).join('')}</tr>`).join('');
fs.writeFileSync('stones.html',`<!doctype html><html><head><meta charset="utf-8"><title>Chain Stones: every stone</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;700&display=swap" rel="stylesheet">
<style>@page{size:A4;margin:14mm}body{font-family:Nunito,system-ui,sans-serif;color:#1d2433;margin:0;font-size:12px}
h1{font-family:Fredoka;font-size:26px;margin:0 0 4px}h2{font-family:Fredoka;font-size:18px;margin:0}
.intro{color:#4a5468;margin:0 0 10px;line-height:1.45}
table{border-collapse:collapse;margin:6px 0 14px;font-size:12px}td,th{border:1px solid #d6dbe6;padding:3px 10px;text-align:center}td:first-child,th:first-child{text-align:left}th{background:#eef1f7;font-family:Fredoka;font-weight:600}
section{break-inside:avoid;border:1px solid #d6dbe6;border-radius:10px;padding:10px 12px;margin:0 0 10px}
.head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}.head p{margin:0;color:#4a5468;width:100%}
.chess{color:#7a8396;font-family:Fredoka}
.levels{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:8px}
.lv{text-align:center}.pic{width:78px;height:78px;margin:6px auto 2px}.pic svg,.mini svg{width:100%;height:100%;overflow:visible}
.lvl{font-family:Fredoka;font-weight:600}.sp{color:#7a8396;font-size:11px}.score{font-family:Fredoka;font-size:13px}.score b{font-size:20px;color:#2e6fba}
.variants{display:flex;align-items:center;gap:10px;margin-top:6px;color:#4a5468}.mini{width:40px;height:40px;margin:4px}
</style></head><body><svg width="0" height="0" style="position:absolute">${defs}</svg>
<h1>Chain Stones: every stone</h1>
<p class="intro">All six pieces at levels 1 to 5, facing up, with their spikes listed as top · right · bottom · left. The rating out of 100 measures single fights. Each stone is put next to every stone an opponent can have (every piece, level and direction, from every side), once as the stone that is placed and once as the stone that is already there. Each case scores the points won minus the points lost in that one move, so taking a king counts 3. The average is scaled so that the strongest stone scores 100 and the weakest 1. Chains, the rest of the board and the choice of where to play are left out. Stones with 5 spikes on every side (Castle Carl at levels 4 and 5, Her Majesty Mayhem at 3 to 5, Old King Coal at 5) fight the same way and share the top score.</p>
<table><tr><th>stone</th><th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Lv 5</th></tr>${table}</table>
${rows}</body></html>`);
console.log(JSON.stringify(Object.fromEntries(Object.keys(rating).map(k=>[k,out(k)]))));
