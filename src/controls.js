/* =====================================================================
   RULES PANEL, INPUT AND START  (builds on everything else: it is loaded last)
   The rules layer, mouse, touch and keys, and what happens when the page opens.

   Contents: rules · input · start
   ===================================================================== */

/* ---------- Rules ---------- */

// Every piece at level 1 and 3 (the king has no levels), with what it does. Debris is not a piece you play.
function pieceGuide() {
  return Object.keys(PIECES)
    .filter((type) => type !== 'debris')
    .map((type) => {
      const piece = PIECES[type];
      const kind = piece.chess ? `The ${piece.chess}` : 'Rare stone';
      const levels = piece.hasNoLevels ? '' : ', level 1 and 3';
      const turns = piece.namesByDirection ? ` Comes in four turns: ${piece.namesByDirection.join(', ')}.` : '';
      let pictures = drawStone(makeStone(type, 1, YOU), YOU, { className: '' });
      if (!piece.hasNoLevels) pictures += drawStone(makeStone(type, 3, YOU), YOU, { className: '' });
      return `<div>${pictures}<p style="margin:0"><b>${piece.name}</b><span>${kind}${levels}: ${piece.description}.${turns}</span></p></div>`;
    })
    .join('');
}

// The rules sit on their own layer, over the board or over a card between matches.
function showRules() {
  find('#rules-card').innerHTML = find('#rules-template').innerHTML;
  find('#rules-modal').hidden = false;
  find('#piece-guide').innerHTML = pieceGuide();
  renderLadder();
  find('#close-rules-button').onclick = () => {
    find('#rules-modal').hidden = true;
  };
  // In the tutorial only the way back is offered, and the tutorial does not start while a move plays out.
  for (const id of ['#give-up-button', '#new-game-button']) find(id).hidden = Boolean(tutorial);
  find('#tutorial-button').hidden = !canStartTutorial();
  find('#tutorial-button').onclick = () => {
    find('#rules-modal').hidden = true;
    startTutorial();
  };
  find('#give-up-button').onclick = () => {
    if (!confirm('Give up this run? You still get to keep one upgraded stone.')) return;
    find('#rules-modal').hidden = true;
    cancelTimers();
    ui.waiting = true;
    endRun(false, 'You gave up.');
  };
  find('#new-game-button').onclick = () => {
    if (!confirm('Start a new game? Your collection and difficulty start over. Your records stay.')) return;
    find('#rules-modal').hidden = true;
    startNewGame();
  };
}

/* ---------- Input ---------- */

const board = find('#board');
let fingerTap = false; // a finger has no hover: the first tap on a square previews, a second tap places

function squareUnder(event) {
  const square = event.target.closest('.square');
  return square ? Number(square.dataset.cell) : -1;
}

function hover(cell) {
  if (cell === ui.hovered || !game) return;
  ui.hovered = cell;
  if (ui.selected >= 0 && !ui.waiting) renderBoard();
  renderInfo();
}

board.addEventListener('click', (event) => {
  const cell = squareUnder(event);
  if (cell < 0 || !isYourTurn() || game.owners[cell] !== EMPTY || ui.selected < 0) return;
  if (fingerTap && ui.hovered !== cell) {
    ui.hovered = cell;
    renderBoard();
    return;
  }
  makeMove({ handIndex: ui.selected, cell });
});
board.addEventListener('pointerdown', (event) => {
  fingerTap = event.pointerType !== 'mouse';
});
// Phones send a fake hover with every tap, so only a mouse hovers.
board.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'mouse') hover(squareUnder(event));
});
board.addEventListener('pointerleave', (event) => {
  if (event.pointerType === 'mouse') hover(-1);
});

// On a card the arrow keys move between its buttons by where they sit: left and right along a row, up and down to the
// nearest button in the row above or below, wrapping at the ends of a row. Enter or Space presses the one in focus.
function moveFocusOnCard(key) {
  const buttons = [...document.querySelectorAll('#card button')].filter((button) => button.offsetParent !== null);
  if (buttons.length === 0) return;
  const centre = (button) => {
    const box = button.getBoundingClientRect();
    return { button, x: box.left + box.width / 2, y: box.top + box.height / 2, height: box.height };
  };
  const all = buttons.map(centre);
  const from = all.find((spot) => spot.button === document.activeElement);
  if (!from) {
    all[0].button.focus();
    return;
  }
  const sideways = key === 'ArrowLeft' || key === 'ArrowRight';
  const sign = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;
  const along = (spot) => (sideways ? spot.x - from.x : spot.y - from.y) * sign;
  const across = (spot) => Math.abs(sideways ? spot.y - from.y : spot.x - from.x);
  const sameRow = (spot) => !sideways || across(spot) < Math.max(from.height, spot.height) / 2;
  const ahead = all.filter((spot) => spot !== from && along(spot) > 1 && sameRow(spot));
  const behind = all.filter((spot) => spot !== from && along(spot) < -1 && sameRow(spot));
  const byDistance = (a, b) => along(a) + 3 * across(a) - (along(b) + 3 * across(b));
  const to = ahead.sort(byDistance)[0] || behind.sort((a, b) => along(a) + across(a) - (along(b) + across(b)))[0];
  if (to) to.button.focus();
}

// S toggles slow motion, M the sound, Escape drops the selected stone, the number keys pick a stone from your hand.
addEventListener('keydown', (event) => {
  if (!find('#card-modal').hidden && event.key.startsWith('Arrow')) {
    event.preventDefault();
    moveFocusOnCard(event.key);
    return;
  }
  const aCardIsOpen = !find('#card-modal').hidden || !find('#rules-modal').hidden;
  if (aCardIsOpen) return;
  const isS = event.key === 's' || event.key === 'S';
  const plainKey = !event.metaKey && !event.ctrlKey && !event.altKey;
  if (isS && plainKey) setSlow(!settings.slowMotion);
  if ((event.key === 'm' || event.key === 'M') && plainKey) setMuted(!settings.muted);
  if (event.key === 'Escape' && ui.selected >= 0) select(-1);
  const number = Number(event.key);
  if (game && isYourTurn() && number >= 1 && number <= game.hands[YOU].length) select(number - 1);
});

function setSlow(on) {
  settings.slowMotion = on;
  document.body.classList.toggle('slow', on);
  find('#slow-button').setAttribute('aria-pressed', on);
  store();
}

find('#slow-button').onclick = () => setSlow(!settings.slowMotion);
find('#sound-button').onclick = () => setMuted(!settings.muted);
find('#rules-button').onclick = showRules;

/* ---------- Start ---------- */

setSlow(settings.slowMotion);
setMuted(settings.muted);
const needsNewRun = !save.run || save.run.over;
if (needsNewRun) newRun();
opponent = opponentFor(save.run.match);
game = newGame(SIZE, [[], []], YOU);
render();
const carryOn = () => (save.run.decks ? intro() : chooseDifficulty());
if (save.tutorialDone) carryOn();
else startTutorial(carryOn);
