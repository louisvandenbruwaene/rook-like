/* =====================================================================
   A RUN
   The cards between matches, from choosing a difficulty to the end of the run.
   ===================================================================== */

/* ---------- Cards between matches ----------
   A run goes: chooseDifficulty, then for every match intro, startMatch, finishMatch and offerRewards, until endRun. */

function closeCard() {
  find('#card-modal').hidden = true;
}

// A card: a small label on top, its content, then choices to pick from and/or one main button.
// choices: [{ html, onPick }], button: { label, onClick }
function showCard(label, contentHtml, { choices = [], button } = {}) {
  let html = `<div class="card-label">${label}</div>${contentHtml}`;
  if (choices.length > 0) {
    html += `<div class="choices">${choices.map((choice) => `<button class="choice">${choice.html}</button>`).join('')}</div>`;
  }
  if (button) html += `<div><button class="primary">${button.label}</button></div>`;
  find('#card').innerHTML = html;
  find('#card-modal').hidden = false;

  document.querySelectorAll('#card .choice').forEach((choiceButton, index) => {
    choiceButton.onclick = () => {
      closeCard();
      choices[index].onPick();
    };
  });
  if (button) {
    const mainButton = find('#card .primary');
    mainButton.onclick = () => {
      closeCard();
      button.onClick();
    };
    mainButton.focus();
  }
}

function picture(code) {
  return drawStone(fromCode(code, YOU), YOU, { className: '' });
}

function handRow(codes) {
  return codes.map(picture).join('');
}

// The old stone, an arrow, the new stone.
function swapPicture(oldCode, newCode) {
  return `<span class="swap">${picture(oldCode)}<span>→</span>${picture(newCode)}</span>`;
}

// Each of the six regular opponents comes three times in a random order, plus one extra, then the boss.
function newRun() {
  const order = shuffle([0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, Math.floor(Math.random() * 6)]);
  const luxIndex = order.indexOf(LADY_LUX);
  const swerveIndex = order.indexOf(MADAME_SWERVE);
  if (swerveIndex < luxIndex) [order[swerveIndex], order[luxIndex]] = [order[luxIndex], order[swerveIndex]];
  save.run = { match: 1, hand: save.startingHand.slice(), opponentOrder: order, changedSlots: [] };
  save.runsPlayed++;
  store();
}

function chooseDifficulty() {
  const choices = Object.entries(DIFFICULTIES).map(([key, difficulty]) => ({
    html: difficulty.name,
    onPick: () => {
      save.run.difficulty = key;
      save.run.decks = newDecks(difficulty);
      store();
      renderLadder();
      intro();
    },
  }));
  showCard('New run', '', { choices });
}

// The next opponent, and your stones.
function intro() {
  const run = save.run;
  opponent = opponentFor(run.match);
  save.bestMatch = Math.max(save.bestMatch, run.match);
  store();
  renderLadder();
  const label = run.match === RUN_LENGTH ? 'Boss' : `${run.match} / ${RUN_LENGTH}`;
  const portraitClass = opponent.isBoss ? 'big-portrait boss' : 'big-portrait';
  const content = `<div class="${portraitClass}">${drawPortrait(opponent)}</div><h2>${opponent.name}</h2><q>${opponent.line}</q>
<div class="hand-row">${handRow(run.hand)}</div>`;
  showCard(label, content, { button: { label: 'Fight', onClick: startMatch } });
}

// Your hand is shown pawns first, then by piece, turn and level.
function handOrder(a, b) {
  const pieceOrder = 'PNBRQK';
  return pieceOrder.indexOf(a.type) - pieceOrder.indexOf(b.type) || a.variant - b.variant || a.level - b.level;
}

function startMatch() {
  const run = save.run;
  const yourStones = run.hand.map((code) => fromCode(code, YOU)).sort(handOrder);
  const theirStones = shuffle(deckOf(opponentFor(run.match)).map((code) => fromCode(code, OPPONENT)));
  game = newGame(SIZE, [yourStones, theirStones], firstFor(run.match));
  Object.assign(ui, { selected: -1, hovered: -1, lastMove: -1, waiting: false });
  replay.owners = null;
  render();
  renderInfo();
  nextTurn();
}

// How the match was decided: points, or spikes left when level on points, or who placed first when level on both.
function tally() {
  const versus = (a, b) => `${Math.max(a, b)} to ${Math.min(a, b)}`;
  const yourPoints = pointsOf(game, YOU);
  const theirPoints = pointsOf(game, OPPONENT);
  const yourSpikes = spikesLeft(game, YOU);
  const theirSpikes = spikesLeft(game, OPPONENT);
  if (yourPoints !== theirPoints) return versus(yourPoints, theirPoints);
  if (yourSpikes !== theirSpikes) return `on spikes, ${versus(yourSpikes, theirSpikes)}`;
  return 'level on spikes, by placing first';
}

function finishMatch() {
  ui.waiting = true;
  render();
  const run = save.run;
  const pope = game.popeWinner;
  if (winnerOf(game) !== YOU) {
    const text = pope === OPPONENT ? `${opponent.name} took your Pope.` : `${opponent.name} wins ${tally()}.`;
    endRun(false, text);
    return;
  }
  if (run.match === RUN_LENGTH) {
    save.crowns++;
    const text = pope === YOU ? `You took the Pope of ${opponent.name}.` : `You beat ${opponent.name} ${tally()}.`;
    endRun(true, text);
    return;
  }
  const deckPlayed = deckOf(opponent).slice();
  upgradeAllDecks(run.decks, currentDifficulty());
  store();
  offerRewards(pope === YOU ? 'Took the Pope' : `Won ${tally()}`, deckPlayed);
}

function nextMatch() {
  save.run.match++;
  store();
  intro();
}

// After a win the opponent shows three random stones from the deck they just played. Take one, or skip.
// A level 0 stone is offered at level 1, so a reward is never weaker than your own stones.
function offerRewards(label, deckPlayed) {
  const atLeastLevelOne = (code) => (code[1] === '0' ? withLevel(code, 1) : code);
  const offer = shuffle([...new Set(deckPlayed.map(atLeastLevelOne))]).slice(0, 3);
  const choices = offer.map((code) => ({
    html: `<span class="swap">${picture(code)}</span>${titleOf(code)}`,
    onPick: () => swapIn(label, code),
  }));
  showCard(label, '<h2>Take one</h2>', { choices, button: { label: 'Skip', onClick: nextMatch } });
}

// The new stone takes the place of a stone you choose, for the rest of the run.
function swapIn(label, newCode) {
  const choices = save.run.hand.map((oldCode, slot) => ({
    html: swapPicture(oldCode, newCode) + titleOf(oldCode),
    onPick: () => {
      putInHand(slot, newCode);
      nextMatch();
    },
  }));
  showCard(label, '<h2>Swap for</h2>', { choices });
}

function putInHand(slot, code) {
  const run = save.run;
  run.hand[slot] = code;
  if (!run.changedSlots.includes(slot)) run.changedSlots.push(slot);
}

// The end of a run. Offers every stone you gained; the one you pick replaces its slot in your starting hand for good.
function endRun(won, text) {
  const run = save.run;
  const gainedSlots = run.changedSlots.filter((slot) => run.hand[slot] !== save.startingHand[slot]);
  run.over = true;
  store();

  const beginAgain = () => {
    newRun();
    chooseDifficulty();
  };
  const label = won ? 'Champion' : `Run over at match ${run.match}`;
  const heading = `<h2>${won ? 'You took the crown!' : 'Defeated'}</h2><p>${text}</p>`;
  if (gainedSlots.length === 0) {
    showCard(label, heading, { button: { label: 'New run', onClick: beginAgain } });
    return;
  }
  const choices = gainedSlots.map((slot) => ({
    html: swapPicture(save.startingHand[slot], run.hand[slot]) + titleOf(run.hand[slot]),
    onPick: () => {
      save.startingHand[slot] = run.hand[slot];
      beginAgain();
    },
  }));
  showCard(label, heading + '<p class="card-label quiet">Keep one</p>', { choices });
}
