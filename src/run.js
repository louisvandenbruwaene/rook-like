/* =====================================================================
   A RUN  (builds on settings.js, save.js, screen.js and move.js)
   Everything between matches, from choosing a difficulty to the end of the run. A run goes:

     (chooseDifficulty, once a game) -> intro (pick your deck) -> startMatch -> ... -> finishMatch -> offerRewards -> nextMatch -> intro
                                                                                   \-> endRun (lost, gave up, or won the last match)

   Contents: cards · the run, match by match · your deck · rewards · a new game · the end of a run
   ===================================================================== */

/* ---------- Cards ----------
   Every screen between matches is one card over the board. */

function closeCard() {
  find('#card-modal').hidden = true;
}

// A card: a small label on top, its content, then choices to pick from and/or one main button.
// choices: [{ html, onPick }], button: { label, onClick }, layout: an extra class for the choices,
// 'compact' (smaller choices, for long lists) or 'difficulties'
function showCard(label, contentHtml, { choices = [], button, layout = '' } = {}) {
  let html = `<div class="card-label">${label}</div>${contentHtml}`;
  if (choices.length > 0) {
    html += `<div class="choices ${layout}">${choices.map((choice) => `<button class="choice">${choice.html}</button>`).join('')}</div>`;
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

// The old stone, an arrow, the new stone.
function swapPicture(oldCode, newCode) {
  return `<span class="swap">${picture(oldCode)}<span>→</span>${picture(newCode)}</span>`;
}

/* ---------- The run, match by match ---------- */

// Each of the six regular opponents comes three times in a random order, plus one extra, then the boss.
// You start with your collection and the game's difficulty. Your deck is picked in intro.
function newRun() {
  const order = shuffle([0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, Math.floor(Math.random() * 6)]);
  const luxIndex = order.indexOf(LADY_LUX);
  const swerveIndex = order.indexOf(MADAME_SWERVE);
  if (swerveIndex < luxIndex) [order[swerveIndex], order[luxIndex]] = [order[luxIndex], order[swerveIndex]];
  const collection = save.collection.slice();
  save.run = { match: 1, collection, startSize: collection.length, deck: [], opponentOrder: order };
  if (save.difficulty) setRunDifficulty(save.difficulty);
  save.runsPlayed++;
  store();
}

function setRunDifficulty(key) {
  save.run.difficulty = key;
  save.run.decks = newDecks(DIFFICULTIES[key]);
}

// A new run, which asks for a difficulty only when the game has none yet: losing a run does not start a new game.
function beginRun() {
  newRun();
  if (save.difficulty) intro();
  else chooseDifficulty();
}

// "Looks 2 moves ahead · stones from Lv 0", with one pip per step up in difficulty.
function difficultyTile(difficulty, rank) {
  const looks =
    difficulty.lookAhead >= 99 ? 'Looks as far ahead as it can' : `Looks ${difficulty.lookAhead} moves ahead`;
  const pips = '●'.repeat(rank + 1) + '○'.repeat(Object.keys(DIFFICULTIES).length - rank - 1);
  return `<span class="pips">${pips}</span><span class="difficulty">${difficulty.name}</span>
<span class="difficulty-detail">${looks} · stones from Lv ${difficulty.startLevel}</span>`;
}

function chooseDifficulty() {
  const choices = Object.entries(DIFFICULTIES).map(([key, difficulty], rank) => ({
    html: difficultyTile(difficulty, rank),
    onPick: () => {
      save.difficulty = key;
      setRunDifficulty(key);
      store();
      renderLadder();
      intro();
    },
  }));
  showCard('New game', '<h2>Choose a difficulty</h2>', { choices, layout: 'difficulties' });
}

// The next opponent and the stones they bring, a word on each rare stone you have not met yet, and your collection
// to pick a deck from, with the spikiest deck already picked.
function intro() {
  const run = save.run;
  run.deck = spikiestDeck(run.collection);
  opponent = opponentFor(run.match);
  save.bestMatch = Math.max(save.bestMatch, run.match);
  store();
  renderLadder();
  const label = run.match === RUN_LENGTH ? 'Boss' : `${run.match} / ${RUN_LENGTH}`;
  const portraitClass = opponent.isBoss ? 'big-portrait boss' : 'big-portrait';
  const theirDeck = deckOf(opponent);
  const newStones = newStonesIn(theirDeck);
  const content = `<div class="${portraitClass}">${drawPortrait(opponent)}</div><h2>${opponent.name}</h2><q>${opponent.line}</q>
<p class="card-label quiet">They bring</p><div class="hand-row their-deck">${drawTheirDeck(theirDeck)}</div>
${newStones.map(meetingHtml).join('')}
<p class="card-label quiet">You bring</p><div class="collection" id="collection"></div><p class="deck-count" id="deck-count"></p>`;
  const fight = () => {
    markExplained(newStones);
    startMatch();
  };
  showCard(label, content, { button: { label: 'Fight', onClick: fight } });
  renderCollection();
}

// The opponent's stones as they will look on the board: red, turned round.
function drawTheirDeck(codes) {
  return codes
    .map((code) => fromCode(code, OPPONENT))
    .sort(handOrder)
    .map((stone) => drawStone(stone, OPPONENT, { className: '' }))
    .join('');
}

function startMatch() {
  const run = save.run;
  const yourStones = deckCodes(run)
    .map((code) => fromCode(code, YOU))
    .sort(handOrder);
  const theirStones = shuffle(deckOf(opponentFor(run.match)).map((code) => fromCode(code, OPPONENT)));
  game = newGame(SIZE, [yourStones, theirStones], firstFor(run.match));
  history = [];
  Object.assign(ui, { selected: -1, hovered: -1, lastMove: -1, waiting: false });
  endReplay();
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
  if (winnerOf(game) !== YOU) {
    endRun(false, `${opponent.name} wins ${tally()}.`, worstMove());
    return;
  }
  if (run.match === RUN_LENGTH) {
    save.crowns++;
    endRun(true, `You beat ${opponent.name} ${tally()}.`);
    return;
  }
  const deckPlayed = deckOf(opponent).slice();
  upgradeAllDecks(run.decks, currentDifficulty());
  store();
  offerRewards(`Won ${tally()}`, deckPlayed);
}

// The opponent's move that took the most of your stones (the later one of equals), or null if none took any.
function worstMove() {
  let worst = null;
  for (const entry of history.filter((entry) => entry.mover === OPPONENT)) {
    const taken = stonesTaken(entry);
    if (taken > 0 && (!worst || taken >= worst.taken)) worst = { ...entry, taken };
  }
  return worst;
}

// How many of your stones a move turned red.
function stonesTaken({ before, result }) {
  let taken = 0;
  for (let cell = 0; cell < before.owners.length; cell++) {
    if (before.owners[cell] === YOU && result.owners[cell] === OPPONENT) taken++;
  }
  return taken;
}

function nextMatch() {
  save.run.match++;
  store();
  intro();
}

/* ---------- Your deck ----------
   save.run.collection holds every stone code you own this run, save.run.deck the indexes of the DECK_SIZE of them
   you take into the next match. */

// The indexes of a deck of DECK_SIZE stones from the collection: the preferred codes where it has them,
// then the first stones not yet taken, keeping to one king and one queen.
function deckFrom(collection, preferredCodes) {
  const deck = [];
  const fits = (i) => !deck.includes(i) && sameLimitedPiece(collection, deck, i) === undefined;
  for (const code of preferredCodes) {
    const index = collection.findIndex((owned, i) => owned === code && fits(i));
    if (index >= 0 && deck.length < DECK_SIZE) deck.push(index);
  }
  for (let i = 0; i < collection.length && deck.length < DECK_SIZE; i++) {
    if (fits(i)) deck.push(i);
  }
  return deck;
}

// The indexes of a deck of DECK_SIZE stones: the king, then the stones with the most spikes, keeping to one queen.
// Level on spikes, the stone listed first in the collection goes in.
function spikiestDeck(collection) {
  const isKing = (code) => pieceOf(code) === 'king';
  const preferred = collection
    .map((code) => ({ code, king: isKing(code), spikes: spikeCount(fromCode(code, YOU)) }))
    .sort((a, b) => b.king - a.king || b.spikes - a.spikes);
  return deckFrom(
    collection,
    preferred.map(({ code }) => code),
  );
}

// The deck index of a king or queen of the same piece as collection[index], or undefined. A deck holds one king
// and one queen whatever their turn. Other stones may come in at several levels (a level 4 and a level 5 rook):
// the collection never holds the same code twice, so a deck never holds two identical stones.
function sameLimitedPiece(collection, deck, index) {
  const piece = pieceOf(collection[index]);
  if (!ONE_PER_DECK.includes(piece)) return undefined;
  return deck.find((i) => pieceOf(collection[i]) === piece);
}

function deckCodes(run) {
  return run.deck.map((index) => run.collection[index]);
}

// Every stone you own this run; the ones in your deck are lit. Fight needs exactly DECK_SIZE.
function renderCollection() {
  const run = save.run;
  const stones = run.collection
    .map((code, index) => ({ code, index, stone: fromCode(code, YOU) }))
    .sort((a, b) => handOrder(a.stone, b.stone));
  find('#collection').innerHTML = stones
    .map(({ code, index }) => {
      const inDeck = run.deck.includes(index) ? ' in-deck' : '';
      return `<button class="owned${inDeck}" data-index="${index}" title="${titleOf(code)}">${picture(code)}</button>`;
    })
    .join('');
  find('#collection')
    .querySelectorAll('.owned')
    .forEach((button) => {
      button.onclick = () => toggleInDeck(Number(button.dataset.index));
    });
  find('#deck-count').textContent = `${run.deck.length} / ${DECK_SIZE}`;
  find('#card .primary').disabled = run.deck.length !== DECK_SIZE;
}

// Tapping a stone takes it out of your deck or puts it in. A second king or queen swaps with the one in the deck.
function toggleInDeck(index) {
  const { deck, collection } = save.run;
  const rival = sameLimitedPiece(collection, deck, index);
  if (deck.includes(index)) deck.splice(deck.indexOf(index), 1);
  else if (rival !== undefined) deck[deck.indexOf(rival)] = index;
  else if (deck.length < DECK_SIZE) deck.push(index);
  store();
  renderCollection();
}

// Stones are shown pawns first, then by piece, turn and level; the king last.
function handOrder(a, b) {
  const pieceOrder = [
    'pawn',
    'knight',
    'bishop',
    'rook',
    'queen',
    'venom_veronica',
    'experienced_edna',
    'empress_edna',
    'brittle_bernard',
    'hairy_harambe',
    'buzzy_beatrice',
    'king',
  ];
  return pieceOrder.indexOf(a.type) - pieceOrder.indexOf(b.type) || a.direction - b.direction || a.level - b.level;
}

/* ---------- Rewards ----------
   After a win you upgrade one of UPGRADE_CHOICES random stones from your deck by one level. Only your highest level of a
   stone is offered, and only while it can still grow, so an upgrade never gives a level you already own. The upgraded stone takes its
   place in your deck, and the old one stays in your collection, except a queen, who is replaced. And if the opponent
   played a stone (piece and turn) that is not in your collection, you get one of those too, at level 1. */

function offerRewards(label, opponentDeck) {
  const run = save.run;
  const gift = newStoneFrom(opponentDeck);
  if (gift) run.collection.push(gift);
  store();
  const giftHtml = gift
    ? `<p class="card-label quiet">New</p><div class="hand-row">${picture(gift)}</div><p>${titleOf(gift)}</p>`
    : '';

  const options = shuffle(run.deck.filter((index) => canUpgrade(run.collection, index))).slice(0, UPGRADE_CHOICES);
  if (options.length === 0) {
    showCard(label, giftHtml, { button: { label: 'Next', onClick: nextMatch } });
    return;
  }
  const choices = options.map((index) => {
    const code = run.collection[index];
    return {
      html: swapPicture(code, upgraded(code)) + titleOf(upgraded(code)),
      onPick: () => {
        upgradeInDeck(index);
        nextMatch();
      },
    };
  });
  showCard(label, giftHtml + '<h2>Upgrade one</h2>', { choices });
}

// collection[index] is offered as an upgrade when it can grow and you own no higher level of the same stone.
function canUpgrade(collection, index) {
  const code = collection[index];
  const level = parseCode(code).level;
  const stone = withoutLevel(code);
  return canGrow(code) && !collection.some((other) => withoutLevel(other) === stone && parseCode(other).level > level);
}

// One stone from the opponent's deck that you do not own at any level, at level 1, or null.
function newStoneFrom(opponentDeck) {
  const owned = new Set(save.run.collection.map(withoutLevel));
  const oneOfEach = new Map(opponentDeck.map((code) => [withoutLevel(code), code]));
  const missing = [...oneOfEach.values()].filter((code) => !owned.has(withoutLevel(code)));
  if (missing.length === 0) return null;
  return withLevel(missing[Math.floor(Math.random() * missing.length)], 1);
}

function upgradeInDeck(index) {
  const run = save.run;
  const code = upgraded(run.collection[index]);
  if (ONLY_ONE_OWNED.includes(pieceOf(code))) {
    run.collection[index] = code;
    return;
  }
  let newIndex = run.collection.indexOf(code);
  if (newIndex < 0) newIndex = run.collection.push(code) - 1;
  run.deck[run.deck.indexOf(index)] = newIndex;
}

/* ---------- A new game ----------
   Starts over from the starter collection, and asks for a difficulty again. Your records stay. */

function startNewGame() {
  cancelTimers();
  save.collection = STARTER_COLLECTION.slice();
  save.difficulty = null;
  newRun();
  opponent = opponentFor(save.run.match);
  game = newGame(SIZE, [[], []], YOU);
  endReplay();
  render();
  renderLadder();
  chooseDifficulty();
}

/* ---------- The end of a run ----------
   Offers every stone you owned this run that you do not own for good yet. The one you pick joins your collection
   for good, and a queen replaces the queen you had. The next run keeps the game's difficulty.
   A lost match also names the opponent's move that hurt most, and can play it again in slow motion. */

function endRun(won, text, worst = null) {
  const run = save.run;
  const gains = [...new Set(run.collection)]
    .filter((code) => !save.collection.includes(code))
    .sort((a, b) => handOrder(fromCode(a, YOU), fromCode(b, YOU)));
  run.over = true;
  store();

  const label = won ? 'Champion' : `Run over at match ${run.match}`;
  const heading = `<h2>${won ? 'You took the crown!' : 'Defeated'}</h2><p>${text}</p>${worst ? worstMoveHtml(worst) : ''}`;
  if (gains.length === 0) {
    showCard(label, heading, { button: { label: 'New run', onClick: beginRun } });
  } else {
    const choices = gains.map((code) => ({
      html: `<span class="swap">${picture(code)}</span>${titleOf(code)}`,
      onPick: () => {
        if (ONLY_ONE_OWNED.includes(pieceOf(code))) {
          save.collection = save.collection.filter((owned) => pieceOf(owned) !== pieceOf(code));
        }
        save.collection.push(code);
        beginRun();
      },
    }));
    showCard(label, heading + '<p class="card-label quiet">Keep one</p>', { choices, layout: 'compact' });
  }
  if (worst) find('#watch-again').onclick = () => watchAgain(worst);
}

function worstMoveHtml(worst) {
  const stones = `${worst.taken} of your stone${worst.taken === 1 ? '' : 's'}`;
  return `<p class="worst-move">The move that hurt most: their <b>${nameOf(worst.stone)}</b> took ${stones}.
<button class="text-button" id="watch-again">Watch it again</button></p>`;
}

// The card steps aside while the move plays again.
function watchAgain(worst) {
  find('#card-modal').hidden = true;
  replayMove(worst, () => {
    find('#card-modal').hidden = false;
  });
}
