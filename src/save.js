/* =====================================================================
   SAVED DATA  (builds on settings.js)
   Progress and settings in localStorage.
   ===================================================================== */

/* ---------- Saved data ----------
   Settings and progress live in localStorage, under their old keys so earlier saves carry over.
   save: { version, startingHand (stone codes, kept between runs), bestMatch, runsPlayed, crowns, run }
   run:  { match, hand (stone codes), opponentOrder, changedSlots (hand slots that got a new stone),
           difficulty, decks (each opponent's stone codes, see settings.js), over } */

const SAVE_KEY = 'chainstones-run';
const SETTINGS_KEY = 'chainstones-cfg';
const SAVE_VERSION = 3;

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
    startingHand: STARTER_HAND.split(' '),
    bestMatch: 0,
    runsPlayed: 0,
    crowns: 0,
    run: null,
  };
}

// Version 3 gave the saved fields their full names; a version 2 save is converted.
// Saves from before version 2 (before the rare stones and the golden king) start over.
function loadSave() {
  const stored = readStorage(SAVE_KEY);
  if (stored && stored.version === SAVE_VERSION) return stored;
  if (!stored || stored.version !== 2) return newSave();
  const oldRun = stored.run;
  return {
    version: SAVE_VERSION,
    startingHand: stored.meta,
    bestMatch: stored.best,
    runsPlayed: stored.runs,
    crowns: stored.champs,
    run: oldRun && {
      match: oldRun.m,
      hand: oldRun.deck,
      opponentOrder: oldRun.order,
      changedSlots: oldRun.changed,
      difficulty: oldRun.level,
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
