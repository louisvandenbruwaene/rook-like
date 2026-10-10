// Builds an HTML sheet of every stone and level, drawn with the game's own code, rated by single fights.
// Run it from anywhere: node stone-sheet.js  (writes stones.html in the current folder)
const fs=require('fs'),path=require('path');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const defs=read('index.html').match(/<defs>[\s\S]*?<\/defs>/)[0];
const E=new Function(read('src/rules.js')+'\n'+read('src/art.js')+'\nreturn {PIECES,makeStone,drawStone};')();
const ORDER='PNBRQKSWEJGHO',DIRS={P:4,N:4};
// every stone an opponent can bring: each piece, level and direction
const all=[];for(const t of ORDER)for(let l=1;l<=5;l++)for(let d=0;d<(DIRS[t]||1);d++)all.push([t,l,d]);
// Rating: every spike is worth 5 points, so 5 spikes on all four sides (20 spikes) make 100.
const out=k=>E.makeStone(k[0],+k[1],0).spikes.reduce((a,b)=>a+b,0)*5;
const svg=(t,l,d)=>E.drawStone(E.makeStone(t,l,0,d),0,{className:''});
let rows='',first=true;
for(const t of ORDER){
  const P=E.PIECES[t];
  if(first&&!P.chess){rows+=`<h1 class="part">Rare stones</h1><p class="intro">Each rare stone belongs to one opponent, who brings it in the middle and late matches and drops it half the time when you win. They grow by their own table instead of one spike per side.</p>`;first=false;}
  rows+=`<section><div class="head"><h2>${P.name}</h2><span class="chess">${P.chess||'rare stone'}</span>
<p>${P.description[0].toUpperCase()+P.description.slice(1)}.</p></div><div class="levels">`;
  const levels=P.hasNoLevels?[1]:[1,2,3,4,5];
  for(const l of levels){
    const st=E.makeStone(t,l,0,0);
    rows+=`<div class="lv"><div class="pic">${svg(t,l,0)}</div><div class="lvl">${P.hasNoLevels?'Always':'Level '+l}</div><div class="sp">${P.goldenShields?'golden shields':st.spikes.join(' · ')}</div>${P.goldenShields?'':`<div class="score"><b>${out(t+l)}</b>/100</div>`}</div>`;
  }
  rows+='</div>';
  if(DIRS[t])rows+=`<div class="variants"><span>Four turns, all rated the same:</span>${[0,1,2,3].map(d=>`<div class="mini">${svg(t,1,d)}<small>${P.variants[d]}</small></div>`).join('')}</div>`;
  rows+='</section>';
}
const table=ORDER.split('').filter(t=>!E.PIECES[t].hasNoLevels).map(t=>`<tr><td>${E.PIECES[t].name}</td>${[1,2,3,4,5].map(l=>`<td>${out(t+l)}</td>`).join('')}</tr>`).join('');
fs.writeFileSync('stones.html',`<!doctype html><html><head><meta charset="utf-8"><title>Rook-like: every stone</title>
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
.variants{display:flex;align-items:center;gap:14px;margin-top:6px;color:#4a5468}.mini{width:46px;text-align:center;margin:4px}.mini svg{height:40px}.mini small{display:block;font-size:9.5px;white-space:nowrap}
h1.part{break-before:page;margin-top:0}
</style></head><body><svg width="0" height="0" style="position:absolute">${defs}</svg>
<h1>Rook-like: every stone</h1>
<p class="intro">The six chess pieces at levels 1 to 5, facing up, with their spikes listed as top · right · bottom · left. The rating out of 100 counts spikes: every spike is worth 5 points, so a stone with the maximum of 5 spikes on all four sides (20 spikes) scores 100. King Kobe has no spikes but golden shields: every spike that touches him breaks and he is never taken. The rating counts spikes only, not the powers of the rare stones.</p>
<table><tr><th>stone</th><th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Lv 5</th></tr>${table}</table>
${rows}</body></html>`);
console.log(ORDER.split('').filter(t=>!E.PIECES[t].hasNoLevels).map(t=>t+': '+[1,2,3,4,5].map(l=>out(t+l)).join(' ')).join('\n'));
