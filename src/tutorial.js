/* =====================================================================
   TUTORIAL AND FIRST MEETINGS  (builds on screen.js, move.js and run.js)
   The coach line under the board. The first time the game opens it runs four small practice boards, one move each.
   And the first time you meet a rare stone it says what the stone does: on the card before the match, with a demo
   board worked out by the real rules, or on the board when it first shows up there (Empress Edna, debris).

   Contents: the coach · lessons · playing the lessons · first meetings · power demos
   ===================================================================== */

/* ---------- The coach ---------- */

// The coach line: a few words and its buttons, [{ label, onClick, quiet }]. A quiet button is a text link.
// coach('') hides it.
function coach(html, buttons = []) {
  const box = find('#coach');
  box.hidden = !html;
  const buttonHtml = buttons
    .map((button) => `<button class="${button.quiet ? 'text-button' : 'primary'}">${button.label}</button>`)
    .join('');
  box.innerHTML = html && `<p>${html}</p><div class="coach-buttons">${buttonHtml}</div>`;
  box.querySelectorAll('button').forEach((element, index) => {
    element.onclick = buttons[index].onClick;
  });
  const main = box.querySelector('.primary');
  if (main) main.focus();
}

/* ---------- Lessons ----------
   Each lesson is a 3 × 3 board with red stones already on it and one stone in your hand.
     board  [square, stone code, owner] for every stone already placed (squares 0 to 8, row by row)
     hand   your stone
     goal   whether your move did it
     task   what to do, hint after a move that missed, done after one that worked */

// prettier-ignore
const LESSONS = [
  {
    board: [[4, 'rook_level_1', OPPONENT]],
    hand: 'pawn_level_1_up',
    goal: (game) => game.owners[4] === YOU,
    task: 'Take the red rook. Pick Tiny Tim, then point at a square: a <span class="take">yellow ring</span> means you would take that stone, a <span class="lose">red ring</span> that you would lose yours.',
    hint: "Tim's spike points up. The rook's spikes point left and right.",
    done: 'Taken: your spike hit a side with no spikes. The rook is yours now, worth one point.',
  },
  {
    board: [[1, 'pawn_level_1_up', OPPONENT]],
    hand: 'bishop_level_1',
    goal: (game) => game.owners[1] === YOU,
    task: 'Spikes that face each other break off one for one, and the side with spikes left over wins. Take the red Tiny with Bishop Bob.',
    hint: "The red Tiny's spike points down. Meet it with more spikes.",
    done: '2 against 1: you win, but a spike that hits is used up. Your bishop has 1 spike left on top.',
  },
  {
    board: [[3, 'pawn_level_0_up', OPPONENT], [4, 'rook_level_1', OPPONENT], [5, 'pawn_level_0_up', OPPONENT]],
    hand: 'pawn_level_1_up',
    goal: (game) => pointsOf(game, YOU) === 4,
    task: 'A stone you take fights on with its own spikes. Take all three red stones with one Tiny.',
    hint: 'Take the rook first: its spikes point at the other two.',
    done: 'A chain: the rook turned blue, and its spikes took both its neighbours.',
  },
  {
    board: [[4, 'queen_level_1', OPPONENT]],
    hand: 'king_level_1',
    goal: (game) => spikeCount(game.stones[4]) < spikeCount(fromCode('queen_level_1', OPPONENT)),
    task: 'Duchess Dagger has spikes on every side. Put King Kobe right next to her.',
    hint: 'A corner square does not touch her. Pick a square beside her.',
    done: 'Every spike that touches his golden shields breaks, and he can never be taken.',
  },
];
const LESSON_SIZE = 3;
const LAST_WORD =
  'A real match is the same on a 4 × 4 board, 8 stones each, taking turns. When the board is full, most stones wins. A run is 20 matches, and every win makes your stones stronger.';
const PRACTICE_PARTNER = OPPONENTS[0];

/* ---------- Playing the lessons ----------
   tutorial is set while the lessons run: the lesson on the board, what to do at the end, and the match, opponent,
   input state and card from before, which come back when the tutorial ends. */

let tutorial = null;

// The tutorial can start at any calm moment: on your turn, or over a card between matches.
function canStartTutorial() {
  return !tutorial && (isYourTurn() || !find('#card-modal').hidden);
}

function startTutorial(onDone) {
  tutorial = { lesson: 0, onDone, before: { game, opponent, ui: { ...ui }, cardOpen: !find('#card-modal').hidden } };
  find('#card-modal').hidden = true;
  playLesson();
}

function playLesson() {
  const lesson = LESSONS[tutorial.lesson];
  game = newGame(LESSON_SIZE, [[fromCode(lesson.hand, YOU)], []], YOU);
  for (const [cell, code, owner] of lesson.board) {
    game.owners[cell] = owner;
    game.stones[cell] = fromCode(code, owner);
  }
  opponent = PRACTICE_PARTNER;
  Object.assign(ui, { selected: -1, hovered: -1, lastMove: -1, waiting: false });
  endReplay();
  render();
  renderInfo();
  find('#run-line').textContent = `Tutorial ${tutorial.lesson + 1} / ${LESSONS.length}`;
  coach(lesson.task, [{ label: 'Skip the tutorial', onClick: endTutorial, quiet: true }]);
}

// After your move in a lesson: on to the next one, or try this one again.
function lessonMoved() {
  const lesson = LESSONS[tutorial.lesson];
  ui.waiting = true;
  renderInfo();
  if (!lesson.goal(game)) {
    coach(`Not quite. ${lesson.hint}`, [{ label: 'Try again', onClick: playLesson }]);
    return;
  }
  const isLast = tutorial.lesson === LESSONS.length - 1;
  coach(lesson.done, [{ label: 'Next', onClick: isLast ? lastWord : nextLesson }]);
}

function nextLesson() {
  tutorial.lesson++;
  playLesson();
}

function lastWord() {
  coach(LAST_WORD, [{ label: 'Play', onClick: endTutorial }]);
}

// The match, opponent and card from before come back, and the tutorial is not shown on its own again.
function endTutorial() {
  const { before, onDone } = tutorial;
  tutorial = null;
  save.tutorialDone = true;
  store();
  coach('');
  game = before.game;
  opponent = before.opponent;
  Object.assign(ui, before.ui);
  endReplay();
  render();
  renderInfo();
  renderLadder();
  find('#card-modal').hidden = !before.cardOpen;
  if (onDone) onDone();
}

/* ---------- First meetings ----------
   save.explained lists every rare stone whose power you have been told. Experienced Edna is explained with the
   Empress she becomes, and Brittle Bernard with the debris he leaves. */

const EXPLAINED_WITH = { experienced_edna: ['empress_edna'], brittle_bernard: ['debris'] };

function isRare(type) {
  return !PIECES[type].chess;
}

function isNew(type) {
  return isRare(type) && !save.explained.includes(type);
}

function markExplained(types) {
  for (const type of types) {
    for (const explained of [type, ...(EXPLAINED_WITH[type] || [])]) {
      if (!save.explained.includes(explained)) save.explained.push(explained);
    }
  }
  store();
}

// The rare stones in an opponent's deck that you have not been told about yet, one of each.
function newStonesIn(codes) {
  return [...new Set(codes.map(pieceOf))].filter(isNew);
}

// The stones a move brought onto the board: the stone placed, an Empress Edna, debris.
function stonesMetIn(stone, result) {
  const types = [stone.type];
  if (result.promotions.length > 0) types.push('empress_edna');
  if (result.flips.some((flip) => flip.owner === DEBRIS)) types.push('debris');
  return types;
}

// A stone you have not been told about stops the game on the coach line until you tap Got it.
function introduce(types, then) {
  const fresh = [...new Set(types)].filter(isNew);
  if (fresh.length === 0) {
    then();
    return;
  }
  markExplained(fresh);
  const lines = fresh.map((type) => `<b>${PIECES[type].name}:</b> ${PIECES[type].description}.`);
  const gotIt = () => {
    coach('');
    then();
  };
  coach(lines.join('<br>'), [{ label: 'Got it', onClick: gotIt }]);
}

// The panel on the card before a match for each new rare stone the opponent brings.
function meetingHtml(type) {
  const demo = DEMOS[type];
  const demoHtml = demo ? demoBoards(demo) : '';
  const caption = demo ? `<p class="demo-caption">${demo.caption}</p>` : '';
  return `<div class="meeting"><p class="card-label">New stone</p>
<p><b>${PIECES[type].name}:</b> ${PIECES[type].description}.</p>${demoHtml}${caption}</div>`;
}

/* ---------- Power demos ----------
   A small board before and after one move of yours, worked out by play() itself, so a demo always shows the
   rules as they are. board: [square, code, owner, extra fields for the stone], place: [square, code],
   collapse: Brittle Bernard collapses when he changes colour (luck always says yes). */

const POISONED_SOON = { poison: { byPlayer: OPPONENT, dueAtMove: 2 } };

// prettier-ignore
const DEMOS = {
  venom_veronica: {
    size: 2, board: [[0, 'bishop_level_2', OPPONENT]], place: [2, 'venom_veronica_level_1'],
    caption: 'Veronica loses this fight, but she poisoned the bishop: two moves later it turns blue.',
  },
  experienced_edna: {
    size: 2, board: [[0, 'rook_level_1', YOU, POISONED_SOON], [3, 'pawn_level_0_up', OPPONENT]], place: [1, 'experienced_edna_level_1'],
    caption: 'She cures the poisoned rook and becomes Empress Edna, who takes the red Tiny at once.',
  },
  brittle_bernard: {
    size: 2, board: [[0, 'brittle_bernard_level_1', OPPONENT]], place: [1, 'pawn_level_1_left'], collapse: true,
    caption: 'Taken, and this time he crumbled: debris belongs to nobody and scores for nobody.',
  },
  hairy_harambe: {
    size: 2, board: [[0, 'bishop_level_1', OPPONENT]], place: [2, 'hairy_harambe_level_1'],
    caption: '3 against 2 would cost 2 spikes. His fur means he loses only 1.',
  },
  buzzy_beatrice: {
    size: 3, board: [[0, 'knight_level_1', OPPONENT], [2, 'rook_level_1', OPPONENT], [6, 'bishop_level_1', OPPONENT]], place: [4, 'buzzy_beatrice_level_1'],
    caption: 'The swarm reaches the corners too: one spike off every spiked red side.',
  },
};

function demoGames(demo) {
  const [cell, code] = demo.place;
  const before = newGame(demo.size, [[fromCode(code, YOU)], []], YOU);
  for (const [square, stoneCode, owner, extra] of demo.board) {
    before.owners[square] = owner;
    before.stones[square] = { ...fromCode(stoneCode, owner), ...extra };
  }
  const after = play(before, { handIndex: 0, cell }, demo.collapse ? () => 0 : undefined);
  return { before, after, cell };
}

// Before, with the stone about to be placed as a ghost, an arrow, and after.
function demoBoards(demo) {
  const { before, after, cell } = demoGames(demo);
  const ghost = before.hands[YOU][0];
  return `<div class="demo">${drawMiniBoard(before, cell, ghost)}<span class="demo-arrow">→</span>${drawMiniBoard(after, cell)}</div>`;
}

function drawMiniBoard(state, placedCell, ghost) {
  let squares = '';
  for (let cell = 0; cell < state.owners.length; cell++) {
    const owner = state.owners[cell];
    const stone = state.stones[cell];
    const classes = ['square'];
    if (cell === placedCell) classes.push('placed');
    if (isPoisoned(stone, owner)) classes.push('poisoned');
    let contents = '';
    if (stone) contents = drawStone(stone, owner);
    if (isPoisoned(stone, owner)) {
      contents += `<div class="poison-countdown">${stone.poison.dueAtMove - state.moveCount}</div>`;
    }
    if (ghost && cell === placedCell) contents = `<div class="preview-stone">${drawStone(ghost, YOU)}</div>`;
    squares += `<div class="${classes.join(' ')}">${contents}</div>`;
  }
  return `<div class="mini-board" style="--board-size:${state.size}">${squares}</div>`;
}
