/* =====================================================================
   A MOVE ON SCREEN  (builds on screen.js and computer.js)
   How a move plays out: timers, effects over the board, the step-by-step animation, and whose turn is next.

   Contents: timers · effects over the board · a move
   ===================================================================== */

/* ---------- Timers ---------- */

// Every delay goes through scaled(), so slow motion stretches the whole move four times.
// Timers are kept so that giving up a run can cancel the move that is playing.
let timers = [];

function scaled(ms) {
  return settings.slowMotion ? ms * 4 : ms;
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

// Buzzy Beatrice's swarm: twelve bees fly out to the squares around her and back.
function releaseBees(cell) {
  const { x, y, size } = centreOf(cell);
  for (let index = 0; index < 12; index++) {
    const angle = (index * 30 * Math.PI) / 180;
    const bee = document.createElement('div');
    bee.className = 'bee';
    bee.style.setProperty('--dx', `${Math.cos(angle) * size * 1.1}px`);
    bee.style.setProperty('--dy', `${Math.sin(angle) * size * 1.1}px`);
    bee.style.animationDelay = `${index * 25}ms`;
    overlay(bee, x, y, scaled(1100));
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
const STEP_MS = 240;
const STEP_WITH_TURNOVER_MS = 440;
const LONGEST_UNHURRIED_CHAIN = 12; // a longer chain plays faster, so a move never drags
const BIG_CAPTURE = 3; // a move that wins this many points or more shakes the board

function makeMove(move) {
  if (ui.waiting && game.turn === YOU) return;
  ui.waiting = true;
  const mover = game.turn;
  const stone = game.hands[mover][move.handIndex];
  const result = play(game, move, Math.random);

  startReplay(move.cell, result);
  ui.selected = -1;
  ui.hovered = -1;
  ui.lastMove = move.cell;
  render();
  renderInfo();
  bump('thump');

  const nameTagClass = mover === YOU ? 'name-tag you' : 'name-tag opponent';
  popUp(move.cell, nameOf(stone), nameTagClass, scaled(1300), -centreOf(move.cell).size * 0.62);
  const endTime = animate(result, move.cell);
  popGain(replay.before, result, move.cell, mover, endTime);

  const anyTurnedOver = result.flips.length > 0;
  after(endTime + (anyTurnedOver ? 560 : 300), () => {
    endReplay();
    ui.waiting = false;
    render();
    nextTurn(anyTurnedOver);
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
    after(PAUSE_BEFORE_FIRST_STEP_MS - 200, () => releaseBees(placedCell));
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
    if (flip.owner === RUBBLE) replay.effects.set(flip.cell, 'crumbling');
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
  after(endTime + 140, () => {
    popUp(cell, text, className, scaled(1200));
    if (net >= BIG_CAPTURE) bump('shake');
  });
}

// After a move: the end of the match, the computer's turn, or yours.
function nextTurn(somethingJustTurned) {
  if (isOver(game)) {
    after(500, finishMatch);
    return;
  }
  if (game.turn === OPPONENT) {
    ui.waiting = true;
    renderHand();
    renderInfo();
    const thinkingTime = opponent.isBoss ? BOSS_THINK_MS : THINK_MS;
    after(somethingJustTurned ? 700 : 350, () => {
      makeMove(bestMove(game, thinkingTime, Math.random, currentDifficulty().lookAhead));
    });
    return;
  }
  ui.waiting = false;
  renderHand();
  renderBoard();
  renderInfo();
}
