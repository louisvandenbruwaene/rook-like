/* =====================================================================
   SAVED DATA  (builds on settings.js)
   Progress and settings in localStorage.
   ===================================================================== */

/* ---------- Saved data ----------
   Settings and progress live in localStorage, under their old keys so earlier saves carry over.
   save: { version, collection (stone codes you own for good), deck (the 8 codes you last played),
           bestMatch, runsPlayed, crowns, run }
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
    deck: starter.slice(),
    bestMatch: 0,
    runsPlayed: 0,
    crowns: 0,
    run: null,
  };
}

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

function loadSettings() {
  const stored = readStorage(SETTINGS_KEY) || {};
  return { slowMotion: Boolean(stored.slowMotion ?? stored.slow) };
}

const save = loadSave();
const settings = loadSettings();

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

// Runs from before opponent decks get them now: built for their difficulty, with one upgrade per match won.
function addMissingDecks() {
  const run = save.run;
  if (!run || run.over || run.decks) return;
  run.decks = newDecks(currentDifficulty());
  for (let won = 1; won < run.match; won++) upgradeAllDecks(run.decks, currentDifficulty());
  store();
}
addMissingDecks();
