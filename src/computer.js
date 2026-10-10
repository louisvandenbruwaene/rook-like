/* =====================================================================
   COMPUTER PLAYER  (builds on rules.js)
   Negamax search with alpha-beta pruning and iterative deepening: it looks one move further ahead each round,
   until its thinking time is up or it reaches maxDepth (the difficulty).

   A position is worth, for the player to move:
     points ahead x 2000
     + spikes ahead x 2   (at most 640, so one point always outweighs every spike)
     + 1 for having placed first
   which is the same order of tiebreaks as winnerOf. Taking His Hovering Holiness is worth more than any score.
   A move is { handIndex, cell }.

   Contents: moves and how good they are · the search
   ===================================================================== */

const POINT_VALUE = 2000;
const SPIKE_VALUE = 2;
const HOLINESS_VALUE = 1_000_000;
const NEXT_CAPTURE_VALUE = 1200; // most of a point for each stone the player to move can take next
const WORST = -1_000_000_000; // lower than any position can be worth
const MOVES_BETWEEN_CLOCK_CHECKS = 256; // reading the clock is slow, so the search only looks now and then

/* ---------- Moves and how good they are ---------- */

// The points a move wins for the player making it.
function gain(game, move) {
  return pointsOf(play(game, move), game.turn) - pointsOf(game, game.turn);
}

// Every move of the player to move. Stones of the same piece, level and direction play alike,
// so only the first of each kind in the hand is tried.
function legalMoves(game) {
  const kindsTried = new Set();
  const moves = [];
  game.hands[game.turn].forEach((stone, handIndex) => {
    const kind = stone.type + stone.level + stone.direction;
    if (kindsTried.has(kind)) return;
    kindsTried.add(kind);
    for (let cell = 0; cell < game.owners.length; cell++) {
      if (game.owners[cell] === EMPTY) moves.push({ handIndex, cell });
    }
  });
  return moves;
}

// How good the position is for the player to move.
function score(game) {
  const me = game.turn;
  const them = other(me);
  if (game.holinessWinner !== undefined) return game.holinessWinner === me ? HOLINESS_VALUE : -HOLINESS_VALUE;
  const pointsAhead = pointsOf(game, me) - pointsOf(game, them);
  const spikesAhead = spikesLeft(game, me) - spikesLeft(game, them);
  const placedFirst = game.first === me ? 1 : -1;
  return pointsAhead * POINT_VALUE + spikesAhead * SPIKE_VALUE + placedFirst;
}

// Moves sorted best capture first, which lets alpha-beta skip far more of the search.
function sortedMoves(game) {
  const rated = legalMoves(game).map((move) => ({ move, gain: gain(game, move) }));
  rated.sort((a, b) => b.gain - a.gain);
  return rated.map((entry) => entry.move);
}

// At the end of the search: the position, plus most of the best capture the player to move can make next.
function estimate(game) {
  if (isOver(game)) return score(game);
  let bestCapture = 0;
  for (const move of legalMoves(game)) bestCapture = Math.max(bestCapture, gain(game, move));
  return score(game) + NEXT_CAPTURE_VALUE * bestCapture;
}

/* ---------- The search ---------- */

// The search in progress: it stops when the clock passes the deadline, checked every MOVES_BETWEEN_CLOCK_CHECKS positions.
const search = {
  deadline: 0, // in now() milliseconds
  aborted: false, // the time ran out: every value found since is worthless
  positions: 0, // positions looked at in this round
};

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

// How good `game` is for the player to move, looking `depth` moves ahead. Negamax: my best move is the one that
// leaves my opponent worst off, so each level is the opposite (minus) of the level below.
// Alpha-beta: alpha is the least the player to move already knows they can get, beta the most the opponent
// will allow. Once a move reaches beta the opponent would never let this position happen, so the other moves
// need not be looked at.
function negamax(game, depth, alpha, beta) {
  search.positions++;
  if (search.positions % MOVES_BETWEEN_CLOCK_CHECKS === 0 && now() > search.deadline) search.aborted = true;
  if (search.aborted) return 0;
  if (isOver(game)) return score(game);
  if (depth === 0) return estimate(game);
  let best = WORST;
  for (const move of sortedMoves(game)) {
    const value = -negamax(play(game, move), depth - 1, -beta, -alpha);
    if (search.aborted) return 0;
    best = Math.max(best, value);
    alpha = Math.max(alpha, value);
    if (alpha >= beta) break;
  }
  return best;
}

// The move to play. Starts from the greedy move, then searches one move further ahead each round.
// Among equally good moves it picks at random, so it does not always play the same game.
function bestMove(game, thinkingTimeMs, random = Math.random, maxDepth = 99) {
  const pickOne = (list) => list[Math.floor(random() * list.length)];
  const moves = sortedMoves(game);
  const gains = moves.map((move) => gain(game, move));
  const bestGain = Math.max(...gains);
  let best = pickOne(moves.filter((_, index) => gains[index] === bestGain));

  search.deadline = now() + thinkingTimeMs;
  const depthLimit = Math.min(maxDepth, emptySquares(game).length);
  for (let depth = 1; depth <= depthLimit; depth++) {
    search.aborted = false;
    search.positions = 0;
    let alpha = WORST;
    const rated = [];
    for (const move of [best, ...moves.filter((move) => move !== best)]) {
      // beta just above alpha keeps the values of equally good moves exact, so we can pick among them
      const value = -negamax(play(game, move), depth - 1, WORST, -(alpha - 1));
      if (search.aborted) break;
      rated.push({ move, value });
      alpha = Math.max(alpha, value);
    }
    if (search.aborted) break;
    best = pickOne(rated.filter((entry) => entry.value >= alpha).map((entry) => entry.move));
  }
  return best;
}
