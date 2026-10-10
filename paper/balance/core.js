/* Rules engine, shared by the game and the computer player.
   Squares are numbered row by row. own[i] is -1 (empty), 0 (you), 1 (the opponent) or 2 (rubble, nobody's); at[i] is the stone on it.
   A stone is {t: piece letter, l: level, f: facing, d: variant, s: spikes [top, right, bottom, left]}, plus, when they apply,
   poison {by, due} and grounded (a Pope whose jet pack is gone). */
const RIGHT=1,DOWN=2,STEP=[[0,-1],[1,0],[0,1],[-1,0]],RUBBLE=2;
const opposite=side=>(side+2)%4;
const MAXL=5;
// The pieces. Chess pieces grow by one spike on every spiked side per level; the rare stones follow their own table.
// variants: names of the four turned versions (a quarter turn clockwise each). Abilities are listed per piece.
const PIECES={
  P:{name:'Tiny Tim',chess:'pawn',base:[1,0,0,0],variants:['Tiny Tim','Tiny Tony','Tiny Tom','Tiny Ted'],text:'a single spike'},
  N:{name:'Sir Gallops',chess:'knight',base:[2,0,0,2],variants:['Sir Gallops','Sir Trots','Sir Canters','Sir Prances'],text:'two sides of one corner'},
  B:{name:'Mitre Mandy',chess:'bishop',base:[2,0,2,0],text:'spikes up and down'},
  R:{name:'Castle Carl',chess:'rook',base:[0,2,0,2],text:'spikes left and right'},
  Q:{name:'Her Majesty Mayhem',chess:'queen',base:[2,2,2,2],text:'spikes on every side'},
  K:{name:'Old King Coal',chess:'king',base:[0,0,0,0],shield:true,fixed:true,text:'golden shields on every side: every spike that touches him breaks, and he can never be taken'},
  S:{name:'Serpent',rare:true,poison:true,levels:[[2,0,0,0],[2,1,0,0],[3,1,0,0],[3,1,0,1],[4,1,0,1]],text:'poisons every stone its spikes hit'},
  W:{name:'Old Woman',rare:true,cure:true,levels:[[0,1,0,1],[1,1,0,1],[1,1,1,1],[2,1,1,1],[2,2,1,1]],text:'cures her poisoned neighbours, and becomes the Grand Empress the first time she does'},
  E:{name:'Grand Empress',rare:true,poison:true,levels:[[3,2,2,3],[4,3,3,4],[5,4,4,5],[5,5,5,5],[5,5,5,5]],text:'knight, queen and serpent in one: her spikes poison'},
  J:{name:'Prince Joey',rare:true,shaky:true,levels:[[3,1,2,0],[3,2,2,0],[4,2,3,0],[4,3,3,0],[5,3,4,0]],text:'every time he changes colour, a 1 in 3 chance he collapses into rubble'},
  G:{name:'Gorilla',rare:true,fur:true,levels:[[3,1,0,1],[4,1,0,1],[4,2,0,1],[5,2,0,2],[5,2,1,2]],text:'thick fur: he loses at most one spike in a fight'},
  H:{name:'Beekeeper',rare:true,swarm:true,levels:[[1,0,0,0],[1,0,1,0],[1,1,1,0],[2,1,1,0],[2,1,1,1]],text:'when placed, his swarm breaks one spike on every enemy side around him and grounds a Pope'},
  O:{name:'The Pope',rare:true,pope:true,levels:[[0,2,0,2],[1,2,0,2],[1,3,1,2],[2,3,1,3],[2,4,2,3]],text:'flies on a jet pack until a swarm grounds him, and whoever loses the Pope loses the match'},
  X:{name:'Rubble',base:[0,0,0,0],fixed:true,text:'what is left of Prince Joey, nobody\'s stone'},
};
const rotate=(s,quarters)=>s.map((_,side)=>s[((side-quarters)%4+4)%4]); // turn a spike pattern clockwise
function spikesAt(t,l){
  const P=PIECES[t];
  return P.levels?P.levels[l-1].slice():P.base.map(x=>x?Math.min(MAXL,x+l-1):0);
}
function mkStone(t,l,f,d=0){
  // d picks one of the four turned variants (only pieces that have variants turn).
  // f is the facing: 0 points up the board (you), 1 points down (the opponent), so the pattern turns half way round.
  if(!PIECES[t].variants)d=0;
  return {t,l,f,d,s:rotate(spikesAt(t,l),d+2*f)};
}
const stoneName=stone=>PIECES[stone.t].variants?PIECES[stone.t].variants[stone.d]:PIECES[stone.t].name;
// Decks are written as codes: piece letter, level, and for a turned stone its direction, e.g. N2, P1> or N1v.
const DIRECTIONS='^>v<';
function parseCode(code){
  const [,t,l,dir]=/^([A-Z])(\d)([\^>v<]?)$/.exec(code);
  return {t,l:+l,d:dir?DIRECTIONS.indexOf(dir):0};
}
const stoneOf=(code,f)=>{const {t,l,d}=parseCode(code);return mkStone(t,l,f,d);};
const withLevel=(code,l)=>code[0]+l+code.slice(2);
function neighbour(n,cell,side){
  const x=cell%n+STEP[side][0],y=(cell/n|0)+STEP[side][1];
  return x<0||y<0||x>=n||y>=n?-1:y*n+x;
}
const distance=(n,a,b)=>Math.abs(a%n-b%n)+Math.abs((a/n|0)-(b/n|0));
function newGame(n,hands,first){return {n,own:new Int8Array(n*n).fill(-1),at:new Array(n*n).fill(null),hands,turn:first,moves:0};}
const over=g=>g.winner!==undefined||!g.own.includes(-1); // a full board, or a Pope was taken
const full=over;
function score(g,p){let k=0;for(let i=0;i<g.own.length;i++)if(g.own[i]===p)k++;return k;}
const isPlayer=o=>o===0||o===1;
const takeable=stone=>!PIECES[stone.t].shield&&!(PIECES[stone.t].pope&&!stone.grounded); // the king never, a flying Pope not yet

/* ---------- One fight ---------- */
// Facing spikes break off one for one, and a spike that hits is gone: the winner always spends at least one spike.
// So 2 v 1 ends 1 v 0, 1 v 0 ends 0 v 0 and 2 v 2 ends 0 v 0. A golden shield breaks every spike that touches it,
// and a gorilla loses at most one spike in a fight.
const spent=(mine,theirs)=>mine>theirs?Math.max(theirs,1):Math.min(mine,theirs);
function breakSpikes(g,cell,side,count,step){
  if(PIECES[g.at[cell].t].fur)count=Math.min(count,1);
  if(!count)return;
  const s=g.at[cell].s.slice();s[side]-=count;
  g.at[cell]={...g.at[cell],s};
  g.broke.push([cell,side,count,step]);
}
function fight(g,i,side,q,step){
  // The stones on i and q meet across one line. Returns the spikes before the fight, [spikes of i, spikes of q],
  // and the winner's square (or -1): the winner takes the other stone if it can be taken.
  const e=opposite(side),A=g.at[i],B=g.at[q],a=A.s[side],b=B.s[e];
  poisonHit(g,i,q,a);poisonHit(g,q,i,b);
  if(PIECES[A.t].shield||PIECES[B.t].shield){
    if(PIECES[A.t].shield)breakSpikes(g,q,e,b,step);
    if(PIECES[B.t].shield)breakSpikes(g,i,side,a,step);
    return [a,b,-1];
  }
  breakSpikes(g,i,side,spent(a,b),step);
  breakSpikes(g,q,e,spent(b,a),step);
  return [a,b,a>b?i:b>a?q:-1];
}
function poisonHit(g,from,to,spikes){
  // A poisonous stone that hits with at least one spike poisons the other stone, win or lose. Two moves later
  // that stone goes to the poisoner's side, unless an Old Woman of its own colour cures it first.
  if(!spikes||!PIECES[g.at[from].t].poison||!takeable(g.at[to]))return;
  g.at[to]={...g.at[to],poison:{by:g.own[from],due:g.moves+2}};
}

/* ---------- One move ---------- */
function play(g,handIndex,cell,luck){
  // Returns the game after the player to move puts stone handIndex on cell. luck() decides Prince Joey's collapses;
  // without it (the computer's search, the preview) he never collapses. Besides the board it records, per step
  // (step 0 is the new stone's own fights, then one step per fight of the chain):
  // lines: every fight as [from, to, spikes from, spikes to, step]; flips: colour changes as [cell, new owner, step];
  // broke: spikes broken as [cell, side, count, step]; promoted: Old Women who became the Grand Empress as [cell, step].
  const me=g.turn;
  const a={n:g.n,own:g.own.slice(),at:g.at.slice(),hands:g.hands.slice(),turn:1-me,moves:g.moves+1,winner:g.winner,
    lines:[],flips:[],broke:[],luck};
  a.hands[me]=g.hands[me].filter((_,i)=>i!==handIndex);
  a.own[cell]=me;a.at[cell]=g.hands[me][handIndex];
  if(PIECES[a.at[cell].t].swarm)swarm(a,cell);
  newStoneFights(a,cell);
  let step=spreadFights(a,cell,1);
  step=cures(a,step); // an Old Woman cures before the poison takes effect
  step=poisonWorks(a,step);
  step=cures(a,step);
  delete a.luck;
  return a;
}
function flip(a,c,step){
  // The stone on c changes colour, unless it cannot be taken. A Pope that changes colour loses the match for his side,
  // and Prince Joey may collapse into rubble.
  const stone=a.at[c],owner=1-a.own[c];
  if(!takeable(stone))return false;
  if(PIECES[stone.t].pope&&a.winner===undefined)a.winner=owner;
  if(PIECES[stone.t].shaky&&a.luck&&a.luck()<1/3){
    a.own[c]=RUBBLE;a.at[c]=mkStone('X',1,0);a.flips.push([c,RUBBLE,step,stone]);return true; // keeps Joey for the animation
  }
  a.own[c]=owner;a.at[c]={...stone,poison:undefined};a.flips.push([c,owner,step]);
  return true;
}
function swarm(a,cell){
  // The Beekeeper's swarm stings the eight squares around him: one spike off every spiked enemy side, and a Pope is grounded.
  const n=a.n,x=cell%n,y=cell/n|0,me=a.own[cell];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const X=x+dx,Y=y+dy,q=Y*n+X;
    if((!dx&&!dy)||X<0||Y<0||X>=n||Y>=n||a.own[q]!==1-me)continue;
    for(let side=0;side<4;side++)if(a.at[q].s[side]>0)breakSpikes(a,q,side,1,0);
    if(PIECES[a.at[q].t].pope)a.at[q]={...a.at[q],grounded:true};
  }
}
function newStoneFights(a,cell){
  // Step 0: the new stone fights every enemy neighbour at once. Each win takes that stone;
  // losing any of these fights gets the new stone taken.
  const me=a.own[cell],won=[];
  let lost=false;
  for(let side=0;side<4;side++){
    const q=neighbour(a.n,cell,side);
    if(q<0||a.own[q]!==1-me)continue;
    const [x,y,winner]=fight(a,cell,side,q,0);
    if(!x&&!y)continue;
    a.lines.push([cell,q,x,y,0]);
    if(winner===cell)won.push(q);
    if(winner===q)lost=true;
  }
  for(const q of won)flip(a,q,0);
  if(lost)flip(a,cell,0);
}
function spreadFights(a,origin,step){
  // Then, as long as two stones of different colours touch with a spike between them, the line closest to the
  // origin fights. Every fight uses up at least one spike, so this always ends, and when it does no two stones of
  // different colours touch with a spike between them. Returns the next free step number.
  for(;;step++){
    const line=closestOpenLine(a,origin);
    if(!line)return step;
    const [,i,side,q]=line,[x,y,winner]=fight(a,i,side,q,step);
    a.lines.push([i,q,x,y,step]);
    if(winner>=0)flip(a,winner===i?q:i,step);
  }
}
function poisonWorks(a,step){
  // Poison that is due: the stone goes to the poisoner's side, and the fights spread from it.
  for(let c=0;c<a.own.length;c++){
    const p=a.at[c]&&a.at[c].poison;
    if(!p||p.due>a.moves)continue;
    a.at[c]={...a.at[c],poison:undefined};
    if(!isPlayer(a.own[c])||a.own[c]===p.by)continue;
    if(flip(a,c,step))step=spreadFights(a,c,step+1);
  }
  return step;
}
function cures(a,step){
  // An Old Woman cures every poisoned stone of her colour that touches her, and the first cure makes her the Grand Empress.
  // Her new spikes fight at once, spreading from her square. Returns the next free step number.
  for(let c=0;c<a.own.length;c++){
    if(!a.at[c]||!a.at[c].poison||!isPlayer(a.own[c]))continue;
    for(let side=0;side<4;side++){
      const w=neighbour(a.n,c,side);
      if(w<0||a.own[w]!==a.own[c]||!PIECES[a.at[w].t].cure)continue;
      a.at[c]={...a.at[c],poison:undefined};
      const old=a.at[w];a.at[w]={...mkStone('E',old.l,old.f),poison:old.poison};
      a.promoted=(a.promoted||[]).concat([[w,step]]);
      step=spreadFights(a,w,step);
      break;
    }
  }
  return step;
}
const isOpen=(g,i,side,q)=>q>=0&&isPlayer(g.own[i])&&isPlayer(g.own[q])&&g.own[q]!==g.own[i] // two stones of different colours
  &&(g.at[i].s[side]>0||g.at[q].s[opposite(side)]>0);                                          // with a spike between them
function closestOpenLine(g,origin){
  // Lines are checked to the right and downwards from every stone, so each line is seen once; the first of
  // equally close lines wins, which is row by row from the top left.
  let best=null;
  for(let i=0;i<g.own.length;i++){
    if(g.own[i]<0)continue;
    for(const side of [RIGHT,DOWN]){
      const q=neighbour(g.n,i,side);
      if(!isOpen(g,i,side,q))continue;
      const dist=Math.min(distance(g.n,i,origin),distance(g.n,q,origin));
      if(!best||dist<best[0])best=[dist,i,side,q];
    }
  }
  return best;
}

/* ---------- Helpers for the computer player ---------- */
const gain=(g,h,c)=>score(play(g,h,c),g.turn)-score(g,g.turn);
function legal(g){
  // Stones with the same piece, level and variant play alike, so only the first of each is tried.
  const seen=new Set(),moves=[];
  g.hands[g.turn].forEach((s,h)=>{
    const key=s.t+s.l+s.d;
    if(seen.has(key))return;seen.add(key);
    for(let c=0;c<g.own.length;c++)if(g.own[c]<0)moves.push([h,c]);
  });
  return moves;
}

/* Computer player: negamax with alpha-beta and iterative deepening. Scores are point differences x100;
   taking the Pope ends the match and is worth more than any score. */
let deadline=0,aborted=false,nodes=0;
const now=()=>typeof performance!=='undefined'?performance.now():Date.now();
const lead=g=>g.winner!==undefined?(g.winner===g.turn?1e6:-1e6):(score(g,g.turn)-score(g,1-g.turn))*100;
function ordered(g){return legal(g).map(m=>[m,gain(g,...m)]).sort((x,y)=>y[1]-x[1]).map(x=>x[0]);}
function evaluate(g){
  if(over(g))return lead(g);
  let best=0;for(const m of legal(g))best=Math.max(best,gain(g,...m));
  return lead(g)+60*best; // the side to move can cash in its best capture next
}
function nega(g,depth,alpha,beta){
  if((++nodes&255)===0&&now()>deadline)aborted=true;
  if(aborted)return 0;
  if(over(g))return lead(g);
  if(depth===0)return evaluate(g);
  let best=-1e9;
  for(const m of ordered(g)){
    const v=-nega(play(g,...m),depth-1,-beta,-alpha);
    if(aborted)return 0;
    best=Math.max(best,v);alpha=Math.max(alpha,v);
    if(alpha>=beta)break;
  }
  return best;
}
function think(g,ms,rnd=Math.random,maxDepth=99){
  // Starts from a greedy move, then searches one move deeper each round until the time is up.
  const moves=ordered(g),pick=list=>list[rnd()*list.length|0];
  const gains=moves.map(m=>gain(g,...m)),top=Math.max(...gains);
  let best=pick(moves.filter((_,i)=>gains[i]===top));
  deadline=now()+ms;
  const empties=g.own.filter(o=>o<0).length;
  for(let depth=1;depth<=Math.min(maxDepth,empties);depth++){
    aborted=false;nodes=0;
    let alpha=-1e9;const scored=[];
    for(const m of [best,...moves.filter(m=>m!==best)]){
      const v=-nega(play(g,...m),depth-1,-1e9,-(alpha-1)); // the window keeps ties exact so we can pick among them
      if(aborted)break;
      scored.push([m,v]);alpha=Math.max(alpha,v);
    }
    if(aborted)break;
    best=pick(scored.filter(x=>x[1]>=alpha).map(x=>x[0]));
  }
  return best;
}
if(typeof module!=='undefined')module.exports={PIECES,MAXL,RUBBLE,mkStone,stoneName,parseCode,stoneOf,withLevel,newGame,over,full,score,play,gain,legal,think};
