/* =====================================================================
   A RUN
   The cards between matches, from choosing a difficulty to the end of the run.
   ===================================================================== */

/* ---------- Cards between matches ----------
   A run goes: chooseDifficulty, then for every match intro (pick your deck), startMatch, finishMatch and
   offerRewards, until endRun. */

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

// Each of the six regular opponents comes three times in a random order, plus one extra, then the boss.
// You start with your collection and the deck you last played.
function newRun() {
  const order = shuffle([0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, Math.floor(Math.random() * 6)]);
  const luxIndex = order.indexOf(LADY_LUX);
  const swerveIndex = order.indexOf(MADAME_SWERVE);
  if (swerveIndex < luxIndex) [order[swerveIndex], order[luxIndex]] = [order[luxIndex], order[swerveIndex]];
  const collection = save.collection.slice();
  const deck = deckFrom(collection, save.deck);
  save.run = { match: 1, collection, startSize: collection.length, deck, opponentOrder: order };
  save.runsPlayed++;
  store();
}

// The indexes of a deck of DECK_SIZE stones from the collection: the preferred codes where it has them,
// then the first stones not yet taken, keeping to one of each stone.
function deckFrom(collection, preferredCodes) {
  const deck = [];
  const fits = (i) => !deck.includes(i) && sameStoneInDeck(collection, deck, i) === undefined;
  for (const code of preferredCodes) {
    const index = collection.findIndex((owned, i) => owned === code && fits(i));
    if (index >= 0 && deck.length < DECK_SIZE) deck.push(index);
  }
  for (let i = 0; i < collection.length && deck.length < DECK_SIZE; i++) {
    if (fits(i)) deck.push(i);
  }
  return deck;
}

// The deck index of the same stone as collection[index] at any level, or undefined. A deck holds one of each
// stone (piece and turn), and one king and one queen whatever their turn.
function sameStoneInDeck(collection, deck, index) {
  const stoneOf = (code) => (ONE_PER_DECK.includes(code[0]) ? code[0] : withoutLevel(code));
  const stone = stoneOf(collection[index]);
  return deck.find((i) => stoneOf(collection[i]) === stone);
}

function deckCodes(run) {
  return run.deck.map((index) => run.collection[index]);
}

// "Looks 2 moves ahead · stones from Lv 0", with one pip per step up in difficulty.
function difficultyTile(difficulty, rank) {
  const looks = difficulty.lookAhead >= 99 ? 'Looks as far ahead as it can' : `Looks ${difficulty.lookAhead} moves ahead`;
  const pips = '●'.repeat(rank + 1) + '○'.repeat(Object.keys(DIFFICULTIES).length - rank - 1);
  return `<span class="pips">${pips}</span><span class="difficulty">${difficulty.name}</span>
<span class="difficulty-detail">${looks} · stones from Lv ${difficulty.startLevel}</span>`;
}

function chooseDifficulty() {
  const choices = Object.entries(DIFFICULTIES).map(([key, difficulty], rank) => ({
    html: difficultyTile(difficulty, rank),
    onPick: () => {
      save.run.difficulty = key;
      save.run.decks = newDecks(difficulty);
      store();
      renderLadder();
      intro();
    },
  }));
  showCard('New run', '<h2>Choose a difficulty</h2>', { choices, layout: 'difficulties' });
}

// The next opponent, and your collection to pick a deck from.
function intro() {
  const run = save.run;
  // A run saved before the one of each stone rule may hold two: keep the first, the gap is yours to fill.
  run.deck = run.deck.filter((index, n) => sameStoneInDeck(run.collection, run.deck.slice(0, n), index) === undefined);
  opponent = opponentFor(run.match);
  save.bestMatch = Math.max(save.bestMatch, run.match);
  store();
  renderLadder();
  const label = run.match === RUN_LENGTH ? 'Boss' : `${run.match} / ${RUN_LENGTH}`;
  const portraitClass = opponent.isBoss ? 'big-portrait boss' : 'big-portrait';
  const content = `<div class="${portraitClass}">${drawPortrait(opponent)}</div><h2>${opponent.name}</h2><q>${opponent.line}</q>
<div class="collection" id="collection"></div><p class="deck-count" id="deck-count"></p>`;
  showCard(label, content, { button: { label: 'Fight', onClick: startMatch } });
  renderCollection();
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

// Tapping a stone takes it out of your deck or puts it in. The same stone at another level swaps with the one in the deck.
function toggleInDeck(index) {
  const { deck, collection } = save.run;
  const rival = sameStoneInDeck(collection, deck, index);
  if (deck.includes(index)) deck.splice(deck.indexOf(index), 1);
  else if (rival !== undefined) deck[deck.indexOf(rival)] = index;
  else if (deck.length < DECK_SIZE) deck.push(index);
  store();
  renderCollection();
}

// Stones are shown pawns first, then by piece, turn and level; the king last.
function handOrder(a, b) {
  const pieceOrder = 'PNBRQSWEJGHOK';
  return pieceOrder.indexOf(a.type) - pieceOrder.indexOf(b.type) || a.variant - b.variant || a.level - b.level;
}

function startMatch() {
  const run = save.run;
  const yourStones = deckCodes(run)
    .map((code) => fromCode(code, YOU))
    .sort(handOrder);
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
    const text =
      pope === OPPONENT ? `${opponent.name} took His Hovering Holiness.` : `${opponent.name} wins ${tally()}.`;
    endRun(false, text);
    return;
  }
  if (run.match === RUN_LENGTH) {
    save.crowns++;
    const text =
      pope === YOU ? `You took His Hovering Holiness from ${opponent.name}.` : `You beat ${opponent.name} ${tally()}.`;
    endRun(true, text);
    return;
  }
  const deckPlayed = deckOf(opponent).slice();
  upgradeAllDecks(run.decks, currentDifficulty());
  store();
  offerRewards(pope === YOU ? 'Took His Holiness' : `Won ${tally()}`, deckPlayed);
}

function nextMatch() {
  save.run.match++;
  store();
  intro();
}

/* ---------- Rewards ----------
   After a win you upgrade one of UPGRADE_CHOICES random stones from your deck by one level. The upgraded stone takes its
   place in your deck, and the old one stays in your collection, except a queen, who is replaced. And if the opponent played a stone (piece and turn)
   that is not in your collection, you get one of those too, at level 1. */

function canGrow(code) {
  const { type, level } = parseCode(code);
  return canLevelUp(type, level);
}

function upgraded(code) {
  return withLevel(code, parseCode(code).level + 1);
}

// A stone is the same stone at any level: its piece letter and its turn.
function withoutLevel(code) {
  return code[0] + code.slice(2);
}

// One stone from the opponent's deck that you do not own at any level, at level 1, or null.
function newStoneFrom(opponentDeck) {
  const owned = new Set(save.run.collection.map(withoutLevel));
  const missing = [...new Set(opponentDeck.map(withoutLevel))].filter((stone) => !owned.has(stone));
  if (missing.length === 0) return null;
  const stone = missing[Math.floor(Math.random() * missing.length)];
  return stone[0] + '1' + stone.slice(1);
}

function offerRewards(label, opponentDeck) {
  const run = save.run;
  const gift = newStoneFrom(opponentDeck);
  if (gift) run.collection.push(gift);
  store();
  const giftHtml = gift
    ? `<p class="card-label quiet">New</p><div class="hand-row">${picture(gift)}</div><p>${titleOf(gift)}</p>`
    : '';

  const options = shuffle(run.deck.filter((index) => canGrow(run.collection[index]))).slice(0, UPGRADE_CHOICES);
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

function upgradeInDeck(index) {
  const run = save.run;
  const code = upgraded(run.collection[index]);
  if (code[0] === 'Q') {
    run.collection[index] = code;
    return;
  }
  let newIndex = run.collection.indexOf(code);
  if (newIndex < 0) newIndex = run.collection.push(code) - 1;
  run.deck[run.deck.indexOf(index)] = newIndex;
}

/* ---------- The end of a run ----------
   Offers every stone you owned this run that you do not own for good yet. The one you pick joins your collection
   for good, and a queen replaces the queen you had. Your next run starts with the deck you played last, as far as
   you still own it. */

function endRun(won, text) {
  const run = save.run;
  const gains = [...new Set(run.collection)]
    .filter((code) => !save.collection.includes(code))
    .sort((a, b) => handOrder(fromCode(a, YOU), fromCode(b, YOU)));
  run.over = true;
  save.deck = deckCodes(run);
  store();

  const beginAgain = () => {
    newRun();
    chooseDifficulty();
  };
  const label = won ? 'Champion' : `Run over at match ${run.match}`;
  const heading = `<h2>${won ? 'You took the crown!' : 'Defeated'}</h2><p>${text}</p>`;
  if (gains.length === 0) {
    showCard(label, heading, { button: { label: 'New run', onClick: beginAgain } });
    return;
  }
  const choices = gains.map((code) => ({
    html: `<span class="swap">${picture(code)}</span>${titleOf(code)}`,
    onPick: () => {
      if (code[0] === 'Q') save.collection = save.collection.filter((owned) => owned[0] !== 'Q');
      save.collection.push(code);
      beginAgain();
    },
  }));
  showCard(label, heading + '<p class="card-label quiet">Keep one</p>', { choices, layout: 'compact' });
}
