/* =====================================================================
   RULES
   The board, the stones, one fight and one move. Pure logic: it never touches the page.
   Shared by the game, the computer player (computer.js) and stone-sheet.js.

   A game is:
     size         the board is size x size squares, numbered row by row from the top left
     owners[i]    who owns square i: EMPTY, YOU, OPPONENT or RUBBLE (nobody's)
     stones[i]    the stone on square i, or null
     hands        [your stones, the opponent's stones] not yet placed
     turn         the player to move
     first        who placed first (wins a match level on points and spikes)
     moveCount    moves made so far
     popeWinner   set when His Hovering Holiness changes colour: that player wins at once

   A stone is:
     type     a piece letter, a key of PIECES
     level    0 to MAX_LEVEL (only opponents start at 0)
     facing   YOU (spikes as drawn) or OPPONENT (turned half way round)
     variant  0 to 3: which quarter turn of a piece that comes in four turns
     spikes   [top, right, bottom, left]
     poison   {byPlayer, dueAtMove} while poisoned
     grounded true for His Hovering Holiness once his jet pack is gone
   ===================================================================== */

/* ---------- Constants ---------- */

const EMPTY = -1;
const YOU = 0;
const OPPONENT = 1;
const RUBBLE = 2;

const MAX_LEVEL = 5; // the highest level, and the most spikes on one side

// The four sides of a square, clockwise from the top, and the [dx, dy] step to the next square on each side.
const TOP = 0;
const RIGHT = 1;
const BOTTOM = 2;
const LEFT = 3;
const SIDES = [TOP, RIGHT, BOTTOM, LEFT];
// prettier-ignore
const STEPS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

function opposite(side) {
  return (side + 2) % 4;
}
function isPlayer(owner) {
  return owner === YOU || owner === OPPONENT;
}
function other(player) {
  return 1 - player;
}

/* ---------- The pieces ----------
   The chess pieces have base spikes (their level 1) and gain or lose one spike on every spiked side per level,
   so a level 0 pawn has no spikes at all. The rare stones list their spikes for each level instead.
   Powers: goldenShields, poisonous, curesPoison, mayCollapse, thickFur, swarm, isPope.
   hasNoLevels: the stone is always the same (the king, rubble). */

// prettier-ignore
const PIECES = {
  P: { name: 'Tiny Tim',       chess: 'pawn',   baseSpikes: [1, 0, 0, 0], variants: ['Tiny Tim', 'Tiny Tony', 'Tiny Tom', 'Tiny Ted'],
       description: 'a single spike' },
  N: { name: 'Neigh Nigel',    chess: 'knight', baseSpikes: [2, 0, 0, 2], variants: ['Neigh Nigel', 'Neigh Newman', 'Neigh Nathan', 'Neigh Nolan'],
       description: 'two sides of one corner' },
  B: { name: 'Bishop Bailey',  chess: 'bishop', baseSpikes: [2, 0, 2, 0], description: 'spikes up and down' },
  R: { name: 'Castle Carl',    chess: 'rook',   baseSpikes: [0, 2, 0, 2], description: 'spikes left and right' },
  Q: { name: 'Duchess Dagger', chess: 'queen',  baseSpikes: [2, 2, 2, 2], description: 'spikes on every side' },
  K: { name: 'King Kobe',      chess: 'king',   baseSpikes: [0, 0, 0, 0], goldenShields: true, hasNoLevels: true,
       description: 'golden shields on every side: every spike that touches him breaks, and he can never be taken' },

  //                                                         level 0       level 1       level 2       level 3       level 4       level 5
  S: { name: 'Venom Veronica',        poisonous: true,   levelSpikes: [[1, 0, 0, 0], [2, 0, 0, 0], [2, 1, 0, 0], [3, 1, 0, 0], [3, 1, 0, 1], [4, 1, 0, 1]],
       description: 'poisons every stone her spikes hit' },
  W: { name: 'Experienced Edna',      curesPoison: true, levelSpikes: [[0, 1, 0, 0], [0, 1, 0, 1], [1, 1, 0, 1], [1, 1, 1, 1], [2, 1, 1, 1], [2, 2, 1, 1]],
       description: 'cures her poisoned neighbours, and becomes Empress Edna the first time she does' },
  E: { name: 'Empress Edna',          poisonous: true,   levelSpikes: [[2, 1, 1, 2], [3, 2, 2, 3], [4, 3, 3, 4], [5, 4, 4, 5], [5, 5, 5, 5], [5, 5, 5, 5]],
       description: 'knight, queen and serpent in one: her spikes poison' },
  J: { name: 'Brittle Bernard',       mayCollapse: true, levelSpikes: [[2, 1, 1, 0], [3, 1, 2, 0], [3, 2, 2, 0], [4, 2, 3, 0], [4, 3, 3, 0], [5, 3, 4, 0]],
       description: 'every time he changes colour, a 1 in 3 chance he collapses into debris' },
  G: { name: 'Hairy Harambe',         thickFur: true,    levelSpikes: [[2, 1, 0, 1], [3, 1, 0, 1], [4, 1, 0, 1], [4, 2, 0, 1], [5, 2, 0, 2], [5, 2, 1, 2]],
       description: 'thick fur: he loses at most one spike in a fight' },
  H: { name: 'Buzzy Beatrice',        swarm: true,       levelSpikes: [[0, 0, 0, 0], [1, 0, 0, 0], [1, 0, 1, 0], [1, 1, 1, 0], [2, 1, 1, 0], [2, 1, 1, 1]],
       description: 'when placed, her swarm breaks one spike on every enemy side around her and grounds His Hovering Holiness' },
  O: { name: 'His Hovering Holiness', isPope: true,      levelSpikes: [[0, 1, 0, 1], [0, 2, 0, 2], [1, 2, 0, 2], [1, 3, 1, 2], [2, 3, 1, 3], [2, 4, 2, 3]],
       description: 'flies on a jet pack until a swarm grounds him, and whoever loses him loses the match' },

  X: { name: 'Debris', baseSpikes: [0, 0, 0, 0], hasNoLevels: true, description: "what is left of Brittle Bernard, nobody's stone" },
};

/* ---------- Stones ---------- */

// The spike pattern turned clockwise by a number of quarter turns.
function rotate(spikes, quarterTurns) {
  return spikes.map((_, side) => spikes[(((side - quarterTurns) % 4) + 4) % 4]);
}

function spikesAt(type, level) {
  const piece = PIECES[type];
  if (piece.levelSpikes) return piece.levelSpikes[level].slice();
  return piece.baseSpikes.map((base) => (base === 0 ? 0 : Math.min(MAX_LEVEL, base + level - 1)));
}

// A stone can go up a level while that changes its spikes: a queen already at MAX_LEVEL spikes a side stops at level 4.
function canLevelUp(type, level) {
  if (PIECES[type].hasNoLevels || level >= MAX_LEVEL) return false;
  return spikesAt(type, level + 1).join() !== spikesAt(type, level).join();
}

// The opponent's stones face down the board, so their pattern is turned half way round.
// Only pieces that come in four turns have a variant.
function makeStone(type, level, facing, variant = 0) {
  if (!PIECES[type].variants) variant = 0;
  const quarterTurns = variant + 2 * facing;
  return { type, level, facing, variant, spikes: rotate(spikesAt(type, level), quarterTurns) };
}

function nameOf(stone) {
  const piece = PIECES[stone.type];
  return piece.variants ? piece.variants[stone.variant] : piece.name;
}

function spikeCount(stone) {
  return stone.spikes.reduce((sum, count) => sum + count, 0);
}

// The king can never be taken, and His Hovering Holiness not while he flies.
function takeable(stone) {
  const piece = PIECES[stone.type];
  if (piece.goldenShields) return false;
  if (piece.isPope && !stone.grounded) return false;
  return true;
}

// Hands are written as stone codes: piece letter, level, and for a turned stone its direction.
// For example N2 (Neigh Nigel, level 2), P1> (a pawn turned to point right) or N1v.
const DIRECTIONS = '^>v<';

function parseCode(code) {
  const [, type, level, direction] = /^([A-Z])(\d)([\^>v<]?)$/.exec(code);
  return { type, level: Number(level), variant: direction ? DIRECTIONS.indexOf(direction) : 0 };
}

function fromCode(code, facing) {
  const { type, level, variant } = parseCode(code);
  return makeStone(type, level, facing, variant);
}

/* ---------- The board ---------- */

function rowOf(size, cell) {
  return Math.floor(cell / size);
}
function columnOf(size, cell) {
  return cell % size;
}

// The square next to `cell` on `side`, or -1 when that is off the board.
function neighbourOf(size, cell, side) {
  const [dx, dy] = STEPS[side];
  const x = columnOf(size, cell) + dx;
  const y = rowOf(size, cell) + dy;
  const onBoard = x >= 0 && y >= 0 && x < size && y < size;
  return onBoard ? y * size + x : -1;
}

function distanceBetween(size, a, b) {
  return Math.abs(columnOf(size, a) - columnOf(size, b)) + Math.abs(rowOf(size, a) - rowOf(size, b));
}

/* ---------- A game ---------- */

function newGame(size, hands, first) {
  return {
    size,
    owners: new Int8Array(size * size).fill(EMPTY),
    stones: new Array(size * size).fill(null),
    hands,
    turn: first,
    first,
    moveCount: 0,
  };
}

// A match ends when the board is full or His Hovering Holiness was taken.
function isOver(game) {
  return game.popeWinner !== undefined || !game.owners.includes(EMPTY);
}

function emptySquares(game) {
  const squares = [];
  for (let cell = 0; cell < game.owners.length; cell++) {
    if (game.owners[cell] === EMPTY) squares.push(cell);
  }
  return squares;
}

// One point for every stone a player owns.
function pointsOf(game, player) {
  let points = 0;
  for (let cell = 0; cell < game.owners.length; cell++) {
    if (game.owners[cell] === player) points++;
  }
  return points;
}

function spikesLeft(game, player) {
  let spikes = 0;
  for (let cell = 0; cell < game.owners.length; cell++) {
    if (game.owners[cell] === player) spikes += spikeCount(game.stones[cell]);
  }
  return spikes;
}

// Who wins a finished match: His Hovering Holiness, then points, then spikes left, then whoever placed first
// (the other player had the last move).
function winnerOf(game) {
  if (game.popeWinner !== undefined) return game.popeWinner;
  const pointsAhead = pointsOf(game, YOU) - pointsOf(game, OPPONENT);
  const spikesAhead = spikesLeft(game, YOU) - spikesLeft(game, OPPONENT);
  const lead = pointsAhead || spikesAhead;
  if (lead > 0) return YOU;
  if (lead < 0) return OPPONENT;
  return game.first;
}

/* ---------- One fight ----------
   Facing spikes break off one for one, and a spike that hits is used up: the winner always spends at least one.
   So 2 against 1 ends 1 against 0, 1 against 0 ends 0 against 0, and 2 against 2 ends 0 against 0.
   A golden shield breaks every spike that touches it, and Hairy Harambe loses at most one spike in a fight. */

function spent(mine, theirs) {
  if (mine > theirs) return Math.max(theirs, 1);
  return Math.min(mine, theirs);
}

function breakSpikes(game, cell, side, count, step) {
  if (PIECES[game.stones[cell].type].thickFur) count = Math.min(count, 1);
  if (count === 0) return;
  const spikes = game.stones[cell].spikes.slice();
  spikes[side] -= count;
  game.stones[cell] = { ...game.stones[cell], spikes };
  game.breaks.push({ cell, side, count, step });
}

// A poisonous stone that hits with at least one spike poisons the other stone, win or lose. Two moves later
// that stone goes over to the poisoner, unless Experienced Edna of its own colour cures it first.
function poisonHit(game, attackerCell, targetCell, spikesThatHit) {
  if (spikesThatHit === 0) return;
  if (!PIECES[game.stones[attackerCell].type].poisonous) return;
  if (!takeable(game.stones[targetCell])) return;
  const poison = { byPlayer: game.owners[attackerCell], dueAtMove: game.moveCount + 2 };
  game.stones[targetCell] = { ...game.stones[targetCell], poison };
}

// The stones on `cell` and `neighbour` meet across one line. Returns the spikes each had on that line before
// the fight, and the square of the winner (or -1 for no winner): the winner takes the other stone if it can.
function fight(game, cell, side, neighbour, step) {
  const otherSide = opposite(side);
  const stone = game.stones[cell];
  const enemy = game.stones[neighbour];
  const spikesHere = stone.spikes[side];
  const spikesThere = enemy.spikes[otherSide];
  poisonHit(game, cell, neighbour, spikesHere);
  poisonHit(game, neighbour, cell, spikesThere);

  const stoneShielded = PIECES[stone.type].goldenShields;
  const enemyShielded = PIECES[enemy.type].goldenShields;
  if (stoneShielded || enemyShielded) {
    if (stoneShielded) breakSpikes(game, neighbour, otherSide, spikesThere, step);
    if (enemyShielded) breakSpikes(game, cell, side, spikesHere, step);
    return { spikesHere, spikesThere, winner: -1 };
  }

  breakSpikes(game, cell, side, spent(spikesHere, spikesThere), step);
  breakSpikes(game, neighbour, otherSide, spent(spikesThere, spikesHere), step);
  let winner = -1;
  if (spikesHere > spikesThere) winner = cell;
  if (spikesThere > spikesHere) winner = neighbour;
  return { spikesHere, spikesThere, winner };
}

/* ---------- One move ----------
   play() returns the game after the player to move puts a stone from their hand on an empty square.
   luck() decides Brittle Bernard's collapses; without it (the computer's search, the preview) he never collapses.
   Besides the board, the result records everything that happened, step by step: step 0 is the new stone's
   own fights, then one step per fight of the chain. The animation replays these records.
     fights:     { from, to, spikesFrom, spikesTo, step }
     flips:      { cell, owner, step, collapsed }  (collapsed: Brittle Bernard's stone, when he turns to debris)
     breaks:     { cell, side, count, step }
     promotions: { cell, step }  Experienced Edna who became Empress Edna */

function play(game, move, luck) {
  const player = game.turn;
  const after = {
    size: game.size,
    owners: game.owners.slice(),
    stones: game.stones.slice(),
    hands: game.hands.slice(),
    turn: other(player),
    first: game.first,
    moveCount: game.moveCount + 1,
    popeWinner: game.popeWinner,
    fights: [],
    flips: [],
    breaks: [],
    promotions: [],
    luck,
  };
  const stone = game.hands[player][move.handIndex];
  after.hands[player] = game.hands[player].filter((_, index) => index !== move.handIndex);
  after.owners[move.cell] = player;
  after.stones[move.cell] = stone;

  if (PIECES[stone.type].swarm) sting(after, move.cell);
  clash(after, move.cell);
  let step = chain(after, move.cell, 1);
  step = cure(after, step); // Experienced Edna cures before the poison takes effect
  step = poisonStrikes(after, step);
  step = cure(after, step);

  delete after.luck;
  return after;
}

// Buzzy Beatrice's swarm stings the eight squares around her: one spike off every spiked enemy side,
// and His Hovering Holiness is grounded.
function sting(game, cell) {
  const size = game.size;
  const enemy = other(game.owners[cell]);
  const centreRow = rowOf(size, cell);
  const centreColumn = columnOf(size, cell);
  for (let row = centreRow - 1; row <= centreRow + 1; row++) {
    for (let column = centreColumn - 1; column <= centreColumn + 1; column++) {
      const onBoard = row >= 0 && column >= 0 && row < size && column < size;
      const square = row * size + column;
      if (!onBoard || square === cell || game.owners[square] !== enemy) continue;
      for (const side of SIDES) {
        if (game.stones[square].spikes[side] > 0) breakSpikes(game, square, side, 1, 0);
      }
      if (PIECES[game.stones[square].type].isPope) game.stones[square] = { ...game.stones[square], grounded: true };
    }
  }
}

// Step 0: the new stone fights every enemy neighbour at once. Each fight it wins takes that stone,
// and losing any of these fights gets the new stone taken.
function clash(game, cell) {
  const enemy = other(game.owners[cell]);
  const taken = [];
  let lost = false;
  for (const side of SIDES) {
    const neighbour = neighbourOf(game.size, cell, side);
    if (neighbour < 0 || game.owners[neighbour] !== enemy) continue;
    const { spikesHere, spikesThere, winner } = fight(game, cell, side, neighbour, 0);
    if (spikesHere === 0 && spikesThere === 0) continue;
    game.fights.push({ from: cell, to: neighbour, spikesFrom: spikesHere, spikesTo: spikesThere, step: 0 });
    if (winner === cell) taken.push(neighbour);
    if (winner === neighbour) lost = true;
  }
  for (const neighbour of taken) take(game, neighbour, 0);
  if (lost) take(game, cell, 0);
}

// The chain: as long as two stones of different colours touch with a spike between them, the line closest
// to the origin fights. Every fight uses up at least one spike, so the chain always ends, and when it does
// no two stones of different colours touch with a spike between them. Returns the next free step number.
function chain(game, origin, step) {
  for (;;) {
    const line = closestOpenLine(game, origin);
    if (line === null) return step;
    const { cell, side, neighbour } = line;
    const { spikesHere, spikesThere, winner } = fight(game, cell, side, neighbour, step);
    game.fights.push({ from: cell, to: neighbour, spikesFrom: spikesHere, spikesTo: spikesThere, step });
    if (winner === cell) take(game, neighbour, step);
    if (winner === neighbour) take(game, cell, step);
    step++;
  }
}

// An open line: two stones of different colours side by side, with a spike between them.
function isOpen(game, cell, side, neighbour) {
  if (neighbour < 0) return false;
  const owner = game.owners[cell];
  const neighbourOwner = game.owners[neighbour];
  if (!isPlayer(owner) || !isPlayer(neighbourOwner) || owner === neighbourOwner) return false;
  return game.stones[cell].spikes[side] > 0 || game.stones[neighbour].spikes[opposite(side)] > 0;
}

// Lines are checked to the right of and below every stone, so each line is seen once. Of equally close lines
// the first one found wins, which is row by row from the top left.
function closestOpenLine(game, origin) {
  let closest = null;
  for (let cell = 0; cell < game.owners.length; cell++) {
    if (game.owners[cell] === EMPTY) continue;
    for (const side of [RIGHT, BOTTOM]) {
      const neighbour = neighbourOf(game.size, cell, side);
      if (!isOpen(game, cell, side, neighbour)) continue;
      const distance = Math.min(
        distanceBetween(game.size, cell, origin),
        distanceBetween(game.size, neighbour, origin),
      );
      if (closest === null || distance < closest.distance) closest = { distance, cell, side, neighbour };
    }
  }
  return closest;
}

// Poison that is due: the stone goes over to the poisoner, and a chain spreads from it.
function poisonStrikes(game, step) {
  for (let cell = 0; cell < game.owners.length; cell++) {
    const poison = game.stones[cell] && game.stones[cell].poison;
    if (!poison || poison.dueAtMove > game.moveCount) continue;
    game.stones[cell] = { ...game.stones[cell], poison: undefined };
    const owner = game.owners[cell];
    if (!isPlayer(owner) || owner === poison.byPlayer) continue;
    if (take(game, cell, step)) step = chain(game, cell, step + 1);
  }
  return step;
}

// Experienced Edna cures every poisoned stone of her colour that touches her, and the first cure makes her
// Empress Edna. Her new spikes fight at once, in a chain from her square. Returns the next free step number.
function cure(game, step) {
  for (let cell = 0; cell < game.owners.length; cell++) {
    const stone = game.stones[cell];
    if (!stone || !stone.poison || !isPlayer(game.owners[cell])) continue;
    for (const side of SIDES) {
      const neighbour = neighbourOf(game.size, cell, side);
      if (neighbour < 0 || game.owners[neighbour] !== game.owners[cell]) continue;
      if (!PIECES[game.stones[neighbour].type].curesPoison) continue;
      game.stones[cell] = { ...game.stones[cell], poison: undefined };
      const oldWoman = game.stones[neighbour];
      game.stones[neighbour] = { ...makeStone('E', oldWoman.level, oldWoman.facing), poison: oldWoman.poison };
      game.promotions.push({ cell: neighbour, step });
      step = chain(game, neighbour, step);
      break;
    }
  }
  return step;
}

// The stone on `cell` changes colour, unless it cannot be taken. Returns whether it did.
// His Hovering Holiness changing colour loses the match for his side, and Brittle Bernard may collapse into debris.
function take(game, cell, step) {
  const stone = game.stones[cell];
  const owner = other(game.owners[cell]);
  if (!takeable(stone)) return false;
  if (PIECES[stone.type].isPope && game.popeWinner === undefined) game.popeWinner = owner;
  if (PIECES[stone.type].mayCollapse && game.luck && game.luck() < 1 / 3) {
    game.owners[cell] = RUBBLE;
    game.stones[cell] = makeStone('X', 1, YOU);
    game.flips.push({ cell, owner: RUBBLE, step, collapsed: stone });
    return true;
  }
  game.owners[cell] = owner;
  game.stones[cell] = { ...stone, poison: undefined };
  game.flips.push({ cell, owner, step });
  return true;
}
