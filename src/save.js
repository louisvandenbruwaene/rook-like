/* =====================================================================
   SAVED DATA  (builds on settings.js)
   Progress and settings in localStorage. Loading them makes the two globals the rest of the game reads and
   writes: save (your progress) and settings (slow motion, sound off). store() writes both back.

   Contents: reading and writing · converting older saves · loading
   ===================================================================== */

/* ---------- Reading and writing ----------
   Settings and progress live in localStorage, under their old keys so earlier saves carry over.
   save: { version, collection (stone codes you own for good),
           difficulty (chosen once for the whole game, every run plays it), bestMatch, runsPlayed, crowns, run,
           tutorialDone, explained (the rare stones whose power you have been told, see tutorial.js),
           lastDeck (the codes of the deck you last fought with; the next run starts with the same stones) }
   run:  { match, collection (stone codes owned this run), startSize (how many of them you started with),
           deck (indexes into the run's collection), opponentOrder, difficulty, lives (hearts left),
           decks (each opponent's stone codes, see settings.js), over,
           fresh ([{ code, upgraded }] for each stone you got after the last match, shown with a badge until the next) } */

const SAVE_KEY = 'chainstones-run';
const SETTINGS_KEY = 'chainstones-cfg';
const SAVE_VERSION = 9;

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch (error) {
    return null;
  }
}

function newSave() {
  return {
    version: SAVE_VERSION,
    collection: STARTER_COLLECTION.slice(),
    difficulty: null,
    bestMatch: 0,
    runsPlayed: 0,
    crowns: 0,
    run: null,
    tutorialDone: false,
    explained: [],
    lastDeck: [],
  };
}

function loadSettings() {
  const stored = readStorage(SETTINGS_KEY) || {};
  return { slowMotion: Boolean(stored.slowMotion ?? stored.slow), muted: Boolean(stored.muted) };
}

function store() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    // private browsing: progress lasts until the page closes
  }
}

// Runs from before difficulties were added play on Very hard, which is how they always played.
function currentDifficulty() {
  return DIFFICULTIES[save.run.difficulty || 'veryHard'];
}

/* ---------- Converting older saves ---------- */

// Older saves are converted step by step. Saves from before version 2 (before the rare stones) start over.
function loadSave() {
  let stored = readStorage(SAVE_KEY);
  if (!stored || ![2, 3, 4, 5, 6, 7, 8, 9].includes(stored.version)) return newSave();
  if (stored.version === 2) stored = fromVersion2(stored);
  if (stored.version === 3) stored = fromVersion3(stored);
  if (stored.version === 4) stored = fromVersion4(stored);
  if (stored.version === 5) stored = fromVersion5(stored);
  if (stored.version === 6) stored = fromVersion6(stored);
  if (stored.version === 7) stored = fromVersion7(stored);
  if (stored.version === 8) stored = fromVersion8(stored);
  return stored;
}

// Version 3 gave the saved fields their full names.
function fromVersion2(old) {
  const oldRun = old.run;
  return {
    version: 3,
    startingHand: old.meta,
    bestMatch: old.best,
    runsPlayed: old.runs,
    crowns: old.champs,
    run: oldRun && {
      match: oldRun.m,
      hand: oldRun.deck,
      opponentOrder: oldRun.order,
      difficulty: oldRun.level,
      over: oldRun.over,
    },
  };
}

// Version 4 replaced the fixed hand of 8 with a collection you pick a deck of 8 from.
function fromVersion3(old) {
  const oldRun = old.run;
  return {
    version: 4,
    collection: old.startingHand.slice(),
    deck: old.startingHand.slice(),
    bestMatch: old.bestMatch,
    runsPlayed: old.runsPlayed,
    crowns: old.crowns,
    run: oldRun && {
      match: oldRun.match,
      collection: oldRun.hand.slice(),
      startSize: oldRun.hand.length,
      deck: oldRun.hand.map((_, index) => index),
      opponentOrder: oldRun.opponentOrder,
      difficulty: oldRun.difficulty,
      decks: oldRun.decks,
      over: oldRun.over,
    },
  };
}

// Version 5 writes stone codes in full: N2 became knight_level_2, P1> pawn_level_1_right.
// prettier-ignore
const OLD_PIECE_LETTERS = {
  P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', K: 'king', S: 'venom_veronica', W: 'experienced_edna',
  E: 'empress_edna', J: 'brittle_bernard', G: 'hairy_harambe', H: 'buzzy_beatrice', O: 'his_hovering_holiness',
};

function fullCode(oldCode) {
  const [, letter, level, direction] = /^([A-Z])(\d)([\^>v<]?)$/.exec(oldCode);
  const turn = direction ? `_${DIRECTIONS['^>v<'.indexOf(direction)]}` : '';
  return `${OLD_PIECE_LETTERS[letter]}_level_${level}${turn}`;
}

function fromVersion4(old) {
  const { deck, ...rest } = old; // the deck you last played is no longer kept
  const run = old.run;
  const decks = run && run.decks;
  return {
    ...rest,
    version: 5,
    collection: old.collection.map(fullCode),
    run: run && {
      ...run,
      collection: run.collection.map(fullCode),
      decks: decks && Object.fromEntries(Object.entries(decks).map(([name, codes]) => [name, codes.map(fullCode)])),
    },
  };
}

// Version 6 added the tutorial and the first meetings with rare stones: an older save sees both once.
function fromVersion5(old) {
  return { ...old, version: 6, tutorialDone: false, explained: [] };
}

// Version 7 took His Hovering Holiness out of the game: in the boss's deck he becomes a rook at his level,
// and anywhere else he is dropped.
const WITHOUT_HOLINESS = (code) => pieceOf(code) !== 'his_hovering_holiness';
function fromVersion6(old) {
  const run = old.run;
  const decks = run && run.decks;
  const asRook = (code) => (WITHOUT_HOLINESS(code) ? code : withLevel('rook_level_1', parseCode(code).level));
  const runCollection = run && run.collection && run.collection.filter(WITHOUT_HOLINESS);
  const keptIndex = (index) => (runCollection ? runCollection.indexOf(run.collection[index]) : -1);
  return {
    ...old,
    version: 7,
    collection: old.collection.filter(WITHOUT_HOLINESS),
    explained: (old.explained || []).filter((type) => type !== 'his_hovering_holiness'),
    run: run && {
      ...run,
      collection: runCollection,
      deck: run.deck && run.deck.map(keptIndex).filter((index) => index >= 0),
      decks: decks && Object.fromEntries(Object.entries(decks).map(([name, codes]) => [name, codes.map(asRook)])),
    },
  };
}

// Version 8 remembers the deck you last fought with, starting from the run's deck.
function fromVersion7(old) {
  const run = old.run;
  const lastDeck = run && run.deck && run.collection ? run.deck.map((index) => run.collection[index]) : [];
  return { ...old, version: 8, lastDeck };
}

// Version 9 gave runs hearts: a run in progress gets its difficulty's full lives.
function fromVersion8(old) {
  const run = old.run;
  if (run && run.difficulty && !run.over) run.lives = DIFFICULTIES[run.difficulty].lives;
  return { ...old, version: 9 };
}

// Saves from before the one of each stone rule may own a stone twice, and saves from before the one queen rule
// may own two queens: keep one (the highest level queen), and point the run's deck at it.
function dropCopies(save) {
  save.collection = onePerOwned(save.collection);
  const run = save.run;
  if (!run || !run.collection) return;
  const collection = onePerOwned(run.collection);
  const keptIndex = (code) => collection.indexOf(keptCode(run.collection, code));
  run.deck = [...new Set(run.deck.map((index) => keptIndex(run.collection[index])))];
  run.collection = collection;
}

// The code that stays of this one: the highest level of its piece for an ONLY_ONE_OWNED piece, else itself.
function keptCode(codes, code) {
  if (!ONLY_ONE_OWNED.includes(pieceOf(code))) return code;
  const same = codes.filter((owned) => pieceOf(owned) === pieceOf(code));
  return same.reduce((best, owned) => (parseCode(owned).level > parseCode(best).level ? owned : best));
}

function onePerOwned(codes) {
  return [...new Set(codes.map((code) => keptCode(codes, code)))];
}

// Runs from before opponent decks get them now: built for their difficulty, grown for every match won.
function addMissingDecks() {
  const run = save.run;
  if (!run || run.over || run.decks) return;
  run.decks = newDecks(currentDifficulty());
  for (let won = 1; won < run.match; won++) upgradeAllDecks(run.decks, currentDifficulty(), won);
  store();
}

// Saves from before the difficulty belonged to the game take the one of their run.
function adoptRunDifficulty() {
  if (!save.difficulty && save.run && save.run.difficulty) save.difficulty = save.run.difficulty;
}

/* ---------- Loading ----------
   Runs once, when the page opens. */

const save = loadSave();
dropCopies(save);
const settings = loadSettings();
addMissingDecks();
adoptRunDifficulty();
