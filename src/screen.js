/* =====================================================================
   SCREEN  (builds on rules.js and art.js)
   What is on the page: the state of the match, and the render...() functions that draw it.
   Naming: render...() updates the page, draw...() (in art.js) returns an SVG string.

   Contents: finding things · the match being played · a move playing out · drawing the page ·
             under the board and your hand · the board
   ===================================================================== */

/* ---------- Finding things on the page ---------- */

function find(selector) {
  return document.querySelector(selector);
}

/* ---------- The match being played ----------
   game and opponent are set by run.js when a match starts, and game is replaced after every move. */

let game = null;
let opponent = null;
// Every move of the match: { before, move, result, mover, stone }, for the loss card to show the move that hurt most.
let history = [];

// What you are doing.
const ui = {
  selected: -1, // index in your hand, or -1
  hovered: -1, // the square under the mouse, or -1
  lastMove: -1, // the square of the last move, marked on the board
  waiting: true, // while a move plays out or the computer thinks: your input is ignored
};

function isYourTurn() {
  return !ui.waiting && !isOver(game) && game.turn === YOU;
}

/* ---------- A move playing out ---------- */

// While a move plays out, the board shows replay.owners instead of the final owners,
// and steps through the move's records one step at a time.
const replay = {
  owners: null, // owners as they look right now, or null when no move is playing
  before: null, // the game before the move, or null when no move is playing
  pending: [], // the move's broken spikes: drawn whole until their step comes
  step: -1, // the step on screen
  placed: new Set(), // the new stone, which drops in
  turning: new Map(), // squares turning over this step, mapped to the owner they turn from
  breaking: new Map(), // spikes breaking this step, per square: [top, right, bottom, left]
  effects: new Map(), // one-off effects this step, per square: a CSS class
};

// A move starts playing: `result` becomes the game, but the board keeps showing the colours from before the move,
// plus the new stone, until each step of the move is shown.
function startReplay(cell, result) {
  replay.before = game;
  replay.owners = game.owners.slice();
  replay.owners[cell] = game.turn;
  replay.placed.add(cell);
  replay.pending = result.breaks;
  replay.step = -1;
  game = result;
}

// The move has played out: the board shows the game itself again.
function endReplay() {
  replay.owners = null;
  replay.before = null;
  replay.pending = [];
  replay.step = -1;
}

// Broken spike records counted per square and side.
function breaksBySquare(breaks) {
  const perSquare = new Map();
  for (const { cell, side, count } of breaks) {
    if (!perSquare.has(cell)) perSquare.set(cell, [0, 0, 0, 0]);
    perSquare.get(cell)[side] += count;
  }
  return perSquare;
}

// The stone on a square as it looks right now. While a move plays out: its spikes that break in a later step
// are still whole, Experienced Edna stays Edna until her promotion, and Brittle Bernard stays Bernard until he collapses.
function shownStone(cell) {
  let stone = game.stones[cell];
  if (replay.before) {
    for (const promotion of game.promotions) {
      if (promotion.cell === cell && promotion.step > replay.step) {
        stone = { ...makeStone('experienced_edna', stone.level, stone.facing), poison: stone.poison };
      }
    }
    for (const flip of game.flips) {
      if (flip.cell === cell && flip.owner === DEBRIS && flip.step > replay.step) stone = flip.collapsed;
    }
  }
  const spikes = stone.spikes.slice();
  let changed = false;
  for (const broken of replay.pending) {
    if (broken.cell === cell && broken.step > replay.step) {
      spikes[broken.side] += broken.count;
      changed = true;
    }
  }
  return changed ? { ...stone, spikes } : stone;
}

/* ---------- Drawing the page ---------- */

function render() {
  renderOpponent();
  renderScores();
  renderHand();
  renderBoard();
}

// The twenty rungs of the run, the match number and the difficulty.
function renderLadder() {
  const run = save.run;
  let rungs = '';
  for (let match = 1; match <= RUN_LENGTH; match++) {
    const classes = [];
    if (match === RUN_LENGTH) classes.push('boss');
    if (match < run.match) classes.push('won');
    if (match === run.match) classes.push('current');
    rungs += `<i class="${classes.join(' ')}"></i>`;
  }
  find('#ladder').innerHTML = rungs;
  const chosen = run.difficulty || run.decks; // a new run has neither until you pick a difficulty
  const difficulty = chosen ? ` · ${currentDifficulty().name}` : '';
  find('#run-line').textContent = `${run.match} / ${RUN_LENGTH}${difficulty}`;
  const record = find('#record');
  if (record) {
    const best = save.bestMatch ? `match ${save.bestMatch}` : 'none';
    record.textContent = `Runs: ${save.runsPlayed}. Best: ${best}. Crowns: ${save.crowns}.`;
  }
}

const PLAYER_IDS = ['you', 'opponent']; // the scoreboard's element ids end in these, for YOU and OPPONENT

// The opponent's portrait and name, and the backs of the stones still in their hand. The portrait is only
// redrawn when the opponent changes, since it is redrawn otherwise at every step of a move.
let portraitShown = null;
function renderOpponent() {
  if (portraitShown !== opponent) {
    find('#opponent-portrait').innerHTML = drawPortrait(opponent);
    find('#opponent-name').textContent = opponent.name;
    portraitShown = opponent;
  }
  const left = game.hands[OPPONENT].length;
  find('#opponent-hand').innerHTML = `<div class="hidden-stone">${drawHiddenStone()}</div>`.repeat(left);
  find('#opponent-hand-count').textContent = left > 0 ? `${left} left` : '';
}

// Points, spikes left and the tug of war, counted from the colours on screen while a move plays out.
function renderScores() {
  const shown = replay.owners ? { owners: replay.owners, stones: game.stones } : game;
  for (const who of [YOU, OPPONENT]) {
    const id = PLAYER_IDS[who];
    const points = pointsOf(shown, who);
    find(`#points-${id}`).textContent = points;
    find(`#spikes-${id}`).textContent = `▲${spikesLeft(shown, who)}`;
    find(`#tug-${id}`).style.width = `${(100 * points) / game.owners.length}%`;
    find(`#player-${id}`).classList.toggle('to-move', !isOver(game) && game.turn === who);
  }
}

/* ---------- Under the board, and your hand ---------- */

// Under the board: the name and level of the stone under the mouse, or else of the stone you selected,
// or else whose move it is.
function renderInfo() {
  const stone = stoneToDescribe();
  let html = '';
  if (stone) {
    const level = PIECES[stone.type].hasNoLevels ? '' : ` <span class="level">Lv ${stone.level}</span>`;
    html = `<b>${nameOf(stone)}</b>${level}`;
  } else if (isYourTurn()) {
    html = '<span class="status you">Your move: pick a stone</span>';
  } else if (!isOver(game) && !replay.before && game.turn === OPPONENT && game.hands[OPPONENT].length > 0) {
    html = `<span class="status opponent">${opponent.name} is thinking…</span>`;
  }
  find('#stone-info').innerHTML = html;
}

function stoneToDescribe() {
  if (ui.hovered >= 0 && game.owners[ui.hovered] !== EMPTY) return game.stones[ui.hovered];
  if (ui.selected >= 0) return game.hands[YOU][ui.selected];
  return null;
}

function select(handIndex) {
  ui.selected = handIndex;
  renderHand();
  renderBoard();
  renderInfo();
}

function renderHand() {
  const hand = find('#your-hand');
  hand.classList.toggle('active', !isOver(game) && game.turn === YOU);
  hand.innerHTML = '';
  game.hands[YOU].forEach((stone, handIndex) => {
    const button = document.createElement('button');
    button.className = 'hand-stone';
    if (isYourTurn() && ui.selected === handIndex) button.classList.add('selected');
    button.disabled = !isYourTurn();
    button.setAttribute('aria-label', `${nameOf(stone)}, level ${stone.level}`);
    button.innerHTML = drawStone(stone, YOU);
    button.onclick = () => select(ui.selected === handIndex ? -1 : handIndex);
    hand.appendChild(button);
  });
}

/* ---------- The board ---------- */

// One square of the board: its CSS classes and its contents. `preview` is the game after the selected stone is
// placed on the hovered square (or null), and previewBreaks the spikes that placing it would break, per square.
function squareView(cell, preview, previewBreaks, canPlace) {
  const owner = (replay.owners || game.owners)[cell];
  let stone = null;
  if (owner !== EMPTY) stone = previewBreaks.has(cell) ? preview.stones[cell] : shownStone(cell);
  const breakingSpikes = previewBreaks.get(cell) || replay.breaking.get(cell);
  return {
    classes: squareClasses(cell, owner, stone, preview, previewBreaks, canPlace).join(' '),
    contents: squareContents(cell, owner, stone, breakingSpikes, preview, previewBreaks),
  };
}

function isPoisoned(stone, owner) {
  return Boolean(stone && stone.poison && owner !== DEBRIS);
}

function isFlying(stone) {
  return Boolean(stone && PIECES[stone.type].isHisHoliness && !stone.grounded);
}

// Every class is styled in style.css: the preview rings, the steps of a move, and the rare stones' looks.
function squareClasses(cell, owner, stone, preview, previewBreaks, canPlace) {
  const wouldTake = preview && game.owners[cell] === OPPONENT && preview.owners[cell] === YOU;
  const yours = game.owners[cell] === YOU || cell === ui.hovered;
  const wouldLose = preview && yours && preview.owners[cell] === OPPONENT;
  const classes = ['square'];
  if (owner === EMPTY && canPlace) classes.push('playable');
  if (wouldTake) classes.push('would-take');
  if (wouldLose) classes.push('would-lose');
  if (previewBreaks.has(cell)) classes.push('preview');
  if (cell === ui.lastMove && !ui.waiting) classes.push('last-move');
  if (replay.placed.has(cell)) classes.push('just-placed');
  if (replay.turning.has(cell)) classes.push('turning-over');
  if (replay.effects.has(cell)) classes.push(replay.effects.get(cell));
  if (isPoisoned(stone, owner)) classes.push('poisoned');
  if (isFlying(stone)) classes.push('flying');
  return classes;
}

// The stone (turning over, while it changes colour), His Hovering Holiness's jet flames, the poison countdown,
// or the ghost of the stone you are about to place.
function squareContents(cell, owner, stone, breakingSpikes, preview, previewBreaks) {
  if (preview && cell === ui.hovered) {
    const ghost = drawStone(preview.stones[cell], YOU, { breakingSpikes: previewBreaks.get(cell) });
    return `<div class="preview-stone">${ghost}</div>`;
  }
  if (owner === EMPTY) return '';

  let contents = drawStone(stone, owner, { breakingSpikes });
  if (replay.turning.has(cell)) {
    // A collapsing Brittle Bernard turns over from Bernard himself; any other stone from itself in its old colour.
    let front = stone;
    if (owner === DEBRIS && stone.type === 'debris') {
      front = game.flips.find((flip) => flip.cell === cell && flip.owner === DEBRIS).collapsed;
    }
    const frontFace = drawStone(front, replay.turning.get(cell), { breakingSpikes });
    contents = `<div class="flip-card"><div class="front">${frontFace}</div><div class="back-face">${contents}</div></div>`;
  }
  if (isFlying(stone)) contents = `<div class="jet-flames"><i></i><i></i></div>` + contents;
  if (isPoisoned(stone, owner)) {
    const movesLeft = Math.max(1, stone.poison.dueAtMove - game.moveCount);
    contents += `<div class="poison-countdown" title="poisoned">${movesLeft}</div>`;
  }
  return contents;
}

// The whole board. With a stone selected and a square hovered it shows the preview:
// yellow rings on stones you would take, red on stones you would lose, faded spikes that would break.
function renderBoard() {
  const canPlace = isYourTurn() && ui.selected >= 0;
  let preview = null;
  if (canPlace && ui.hovered >= 0 && game.owners[ui.hovered] === EMPTY) {
    preview = play(game, { handIndex: ui.selected, cell: ui.hovered });
  }
  const previewBreaks = preview ? breaksBySquare(preview.breaks) : new Map();
  let html = '';
  for (let cell = 0; cell < game.owners.length; cell++) {
    const { classes, contents } = squareView(cell, preview, previewBreaks, canPlace);
    html += `<div class="${classes}" data-cell="${cell}">${contents}</div>`;
  }
  const board = find('#board');
  board.style.setProperty('--board-size', game.size);
  board.innerHTML = html;
  replay.placed.clear();
  clearEffects();
}

// Redraws only these squares, so animations running on the other squares are not cut off.
function repaint(cells) {
  const squares = find('#board').children;
  for (const cell of cells) {
    const { classes, contents } = squareView(cell, null, new Map(), false);
    squares[cell].className = classes;
    squares[cell].innerHTML = contents;
  }
  clearEffects();
}

function clearEffects() {
  replay.turning.clear();
  replay.breaking.clear();
  replay.effects.clear();
}
