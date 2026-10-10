/* =====================================================================
   A MOVE ON SCREEN  (builds on screen.js and computer.js)
   How a move plays out: timers, effects over the board, the step-by-step animation, and whose turn is next.
   After a move it hands over to tutorial.js (loaded later): lessonMoved in a lesson, introduce for a new rare stone.

   Contents: timers · effects over the board · a move
   ===================================================================== */

/* ---------- Timers ---------- */

// Every delay goes through scaled(), so slow motion stretches the whole move SLOW_MOTION_FACTOR times
// (style.css stretches the animations by the same factor, as --time-scale).
// Timers are kept so that giving up a run can cancel the move that is playing.
const SLOW_MOTION_FACTOR = 4;
let timers = [];

function scaled(ms) {
  return settings.slowMotion ? ms * SLOW_MOTION_FACTOR : ms;
}

function after(ms, callback) {
  timers.push(setTimeout(callback, scaled(ms)));
}

function cancelTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

/* ---------- Effects over the board ---------- */

function centreOf(cell) {
  const square = find('#board').children[cell];
  return {
    x: square.offsetLeft + square.offsetWidth / 2,
    y: square.offsetTop + square.offsetHeight / 2,
    size: square.offsetHeight,
  };
}

// Puts an effect element over the board at (x, y), and removes it again after `lifetimeMs`.
function overlay(effect, x, y, lifetimeMs) {
  effect.style.left = `${x}px`;
  effect.style.top = `${y}px`;
  find('.board-frame').appendChild(effect);
  timers.push(setTimeout(() => effect.remove(), lifetimeMs));
}

// A short text over a square: the name of a stone just placed, or the points a move won or lost.
function popUp(cell, text, className, lifetimeMs, raise = 0) {
  const { x, y } = centreOf(cell);
  const label = document.createElement('div');
  label.className = className;
  label.textContent = text;
  overlay(label, x, y + raise, lifetimeMs);
}

// Buzzy Beatrice's swarm: BEE_COUNT bees fly out in a circle, just past the squares around her, and back.
const BEE_COUNT = 12;
const BEE_REACH = 1.1; // how far the bees fly, in squares
const BEE_STAGGER_MS = 25; // each bee leaves this much after the one before
const BEE_FLIGHT_MS = 1100;
function releaseBees(cell) {
  const { x, y, size } = centreOf(cell);
  for (let index = 0; index < BEE_COUNT; index++) {
    const angle = (index / BEE_COUNT) * 2 * Math.PI;
    const bee = document.createElement('div');
    bee.className = 'bee';
    bee.style.setProperty('--bee-x', `${Math.cos(angle) * size * BEE_REACH}px`);
    bee.style.setProperty('--bee-y', `${Math.sin(angle) * size * BEE_REACH}px`);
    bee.style.animationDelay = `${index * BEE_STAGGER_MS}ms`;
    overlay(bee, x, y, scaled(BEE_FLIGHT_MS));
  }
}

// Restarts a one-off animation of the board: "thump" when a stone lands, "shake" for a big capture.
function bump(className) {
  const board = find('#board');
  board.classList.remove('thump', 'shake');
  void board.offsetWidth; // a reflow, so the same animation can play again
  board.classList.add(className);
}

/* ---------- A move ----------
   A move plays out step by step: step 0 is the new stone's own fights, then every fight of the chain in turn. */

const PAUSE_BEFORE_FIRST_STEP_MS = 260;
const BEES_BEFORE_FIRST_STEP_MS = 200; // Buzzy Beatrice's bees fly out this long before the first step
const STEP_MS = 240;
const STEP_WITH_TURNOVER_MS = 440;
const NAME_TAG_MS = 1300; // the name of the stone just placed, shown above it
const NAME_TAG_RAISE = 0.62; // how far above the centre of its square, in squares
const PAUSE_AFTER_MOVE_MS = 300; // after the last step, before the next turn
const PAUSE_AFTER_TURNOVER_MS = 560; // the same, when a stone turned over: it needs a moment to land
const POINTS_POP_DELAY_MS = 140; // the +2 or −1 after a move shows this long after the last step
const POINTS_POP_MS = 1200;
const PAUSE_BEFORE_RESULT_MS = 500; // the board stays in view this long before the result card
const COMPUTER_PAUSE_MS = 350; // the computer waits this long before it starts thinking
const COMPUTER_PAUSE_AFTER_TURNOVER_MS = 700;
const LONGEST_UNHURRIED_CHAIN = 12; // a longer chain plays faster, so a move never drags
const BIG_CAPTURE = 3; // a move that wins this many points or more shakes the board

function makeMove(move) {
  if (ui.waiting && game.turn === YOU) return;
  ui.waiting = true;
  const mover = game.turn;
  const stone = game.hands[mover][move.handIndex];
  const result = play(game, move, Math.random);
  if (!tutorial) history.push({ before: game, move, result, mover, stone });
  const endTime = playOut(move.cell, result, mover, stone);

  const anyTurnedOver = result.flips.length > 0;
  after(endTime + (anyTurnedOver ? PAUSE_AFTER_TURNOVER_MS : PAUSE_AFTER_MOVE_MS), () => {
    endReplay();
    render();
    if (tutorial) {
      lessonMoved();
      return;
    }
    introduce(stonesMetIn(stone, result), () => {
      ui.waiting = false;
      render();
      nextTurn(anyTurnedOver);
    });
  });
}

// The move on screen: the stone drops in with its name over it, then every step of the move plays out, then
// the points it won or lost pop up. `result` becomes the game. Returns the time at which the last step ends.
function playOut(cell, result, mover, stone) {
  startReplay(cell, result);
  ui.selected = -1;
  ui.hovered = -1;
  ui.lastMove = cell;
  render();
  renderInfo();
  bump('thump');

  const nameTagClass = mover === YOU ? 'name-tag you' : 'name-tag opponent';
  popUp(cell, nameOf(stone), nameTagClass, scaled(NAME_TAG_MS), -centreOf(cell).size * NAME_TAG_RAISE);
  const endTime = animate(result, cell);
  popGain(replay.before, result, cell, mover, endTime);
  return endTime;
}

// A move of the match played again in slow motion, from the board as it was before it, then the board goes back to
// how the match ended.
function replayMove({ before, move, result, mover, stone }, then) {
  const end = game;
  const wasSlow = settings.slowMotion;
  settings.slowMotion = true;
  document.body.classList.add('slow');
  game = before;
  const endTime = playOut(move.cell, result, mover, stone);
  after(endTime + PAUSE_AFTER_TURNOVER_MS, () => {
    settings.slowMotion = wasSlow;
    document.body.classList.toggle('slow', wasSlow);
    endReplay();
    game = end;
    render();
    then();
  });
}

// Schedules the steps one after another: spikes that break shatter, and a stone turns over when it changes colour.
// A stone can change colour more than once in a chain, so every flip says which owner it turns to.
// Returns the time at which the last step ends.
function animate(result, placedCell) {
  const lastStep = Math.max(
    0,
    ...result.fights.map((fight) => fight.step),
    ...result.flips.map((flip) => flip.step),
    ...result.promotions.map((promotion) => promotion.step),
  );
  const pace = Math.min(1, LONGEST_UNHURRIED_CHAIN / (lastStep + 1));
  find('#board').style.setProperty('--pace', pace);

  const placedStone = result.stones[placedCell];
  if (PIECES[placedStone.type].swarm || PIECES[shownStone(placedCell).type].swarm) {
    after(PAUSE_BEFORE_FIRST_STEP_MS - BEES_BEFORE_FIRST_STEP_MS, () => releaseBees(placedCell));
  }

  let time = PAUSE_BEFORE_FIRST_STEP_MS;
  for (let step = 0; step <= lastStep; step++) {
    const fights = result.fights.filter((fight) => fight.step === step);
    const flips = result.flips.filter((flip) => flip.step === step);
    const breaks = result.breaks.filter((broken) => broken.step === step);
    const promotions = result.promotions.filter((promotion) => promotion.step === step);
    if (fights.length === 0 && flips.length === 0 && breaks.length === 0 && promotions.length === 0) continue;

    after(time, () => showStep(result, step, fights, flips, breaks, promotions));
    const somethingTurns = flips.length > 0 || promotions.length > 0;
    time += (somethingTurns ? STEP_WITH_TURNOVER_MS : STEP_MS) * pace;
  }
  return time;
}

function showStep(result, step, fights, flips, breaks, promotions) {
  replay.step = step;
  replay.breaking = breaksBySquare(breaks);
  // A golden shield that breaks spikes flashes gold, and a poisonous bite splashes green.
  for (const fight of fights) {
    const sides = [
      { cell: fight.from, target: fight.to, hit: fight.spikesFrom },
      { cell: fight.to, target: fight.from, hit: fight.spikesTo },
    ];
    for (const { cell, target, hit } of sides) {
      if (PIECES[result.stones[cell].type].goldenShields) replay.effects.set(cell, 'shield-hit');
      else if (hit && PIECES[shownStone(cell).type].poisonous) replay.effects.set(target, 'bitten');
    }
  }
  for (const flip of flips) {
    replay.turning.set(flip.cell, replay.owners[flip.cell]);
    replay.owners[flip.cell] = flip.owner;
    if (flip.owner === DEBRIS) replay.effects.set(flip.cell, 'crumbling');
  }
  for (const promotion of promotions) replay.effects.set(promotion.cell, 'crowned');

  const changed = new Set([
    ...flips.map((flip) => flip.cell),
    ...breaks.map((broken) => broken.cell),
    ...promotions.map((promotion) => promotion.cell),
    ...replay.effects.keys(),
  ]);
  repaint(changed);
  renderScores();
}

// The +/- pop after a move: the points it won or lost, not counting the new stone itself.
function popGain(before, result, cell, mover, endTime) {
  const net = pointsOf(result, mover) - pointsOf(before, mover) - 1;
  if (net === 0) return;
  const text = net > 0 ? `+${net}` : `−${-net}`;
  const className = net > 0 ? 'points-pop' : 'points-pop loss';
  after(endTime + POINTS_POP_DELAY_MS, () => {
    popUp(cell, text, className, scaled(POINTS_POP_MS));
    if (net >= BIG_CAPTURE) bump('shake');
  });
}

// After a move: the end of the match, the computer's turn, or yours.
function nextTurn(somethingJustTurned) {
  if (isOver(game)) {
    after(PAUSE_BEFORE_RESULT_MS, finishMatch);
    return;
  }
  if (game.turn === OPPONENT) {
    ui.waiting = true;
    renderHand();
    renderInfo();
    const thinkingTime = opponent.isBoss ? BOSS_THINK_MS : THINK_MS;
    after(somethingJustTurned ? COMPUTER_PAUSE_AFTER_TURNOVER_MS : COMPUTER_PAUSE_MS, () => {
      makeMove(bestMove(game, thinkingTime, Math.random, currentDifficulty().lookAhead));
    });
    return;
  }
  ui.waiting = false;
  if (game.hands[YOU].length === 1) ui.selected = 0; // your last stone is picked for you
  renderHand();
  renderBoard();
  renderInfo();
}
