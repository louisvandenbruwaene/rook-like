/* =====================================================================
   SAVED DATA  (builds on settings.js)
   Progress and settings in localStorage. Loading them makes the two globals the rest of the game reads and
   writes: save (your progress) and settings (slow motion). store() writes both back.

   Contents: reading and writing · converting older saves · loading
   ===================================================================== */

/* ---------- Reading and writing ----------
   Settings and progress live in localStorage, under their old keys so earlier saves carry over.
   save: { version, collection (stone codes you own for good),
           difficulty (chosen once for the whole game, every run plays it), bestMatch, runsPlayed, crowns, run }
   run:  { match, collection (stone codes owned this run), startSize (how many of them you started with),
           deck (indexes into the run's collection), opponentOrder, difficulty,
           decks (each opponent's stone codes, see settings.js), over } */

const SAVE_KEY = 'chainstones-run';
const SETTINGS_KEY = 'chainstones-cfg';
const SAVE_VERSION = 4;

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch (error) {
    return null;
  }
}

function newSave() {
  const starter = STARTER_COLLECTION.split(' ');
  return {
    version: SAVE_VERSION,
    collection: starter,
    difficulty: null,
    bestMatch: 0,
    runsPlayed: 0,
    crowns: 0,
    run: null,
  };
}

function loadSettings() {
  const stored = readStorage(SETTINGS_KEY) || {};
  return { slowMotion: Boolean(stored.slowMotion ?? stored.slow) };
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
  if (!stored || ![2, 3, 4].includes(stored.version)) return newSave();
  if (stored.version === 2) stored = fromVersion2(stored);
  if (stored.version === 3) stored = fromVersion3(stored);
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

// Runs from before opponent decks get them now: built for their difficulty, with one upgrade per match won.
function addMissingDecks() {
  const run = save.run;
  if (!run || run.over || run.decks) return;
  run.decks = newDecks(currentDifficulty());
  for (let won = 1; won < run.match; won++) upgradeAllDecks(run.decks, currentDifficulty());
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
