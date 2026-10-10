/* =====================================================================
   SETTINGS AND OPPONENTS
   The fixed numbers of the game, the difficulties, the opponents and their decks,
   and two helpers for stone codes.
   ===================================================================== */

const SIZE = 4;
const RUN_LENGTH = 20; // the last match is against the boss
const DECK_SIZE = 8; // the stones you take into a match, chosen from your collection
const ONE_PER_DECK = 'KQ'; // a deck holds at most one king and one queen
const UPGRADE_CHOICES = 5; // after a win, you pick one of this many stones from your deck to upgrade
const STARTER_COLLECTION = 'P1^ P1> P1< N1 B1 R1 Q1 K1'; // Tiny Tim, Tony and Ted; Tiny Tom comes from the opponents
const THINK_MS = 1000;
const BOSS_THINK_MS = 1600;

// Difficulty, picked at the start of a run.
//   lookAhead     how many moves ahead the opponent looks (its own move counts as one). 99 is as far as it can
//                 in its thinking time, which in the last moves of a match is to the very end.
//   startLevel    the level of every opponent stone at the start of a run
//   upgradeOrder  which stones the opponents upgrade first after your wins, as groups of piece letters, with
//                 every other piece as one last group (see upgradeOne). null: any stone, at random.
// prettier-ignore
const DIFFICULTIES = {
  easy:     { name: 'Easy',      lookAhead: 2,  startLevel: 0, upgradeOrder: ['P'] },
  normal:   { name: 'Normal',    lookAhead: 99, startLevel: 0, upgradeOrder: ['PNBR'] },
  hard:     { name: 'Hard',      lookAhead: 2,  startLevel: 1, upgradeOrder: null },
  veryHard: { name: 'Very hard', lookAhead: 99, startLevel: 1, upgradeOrder: null },
};

/* ---------- Opponents ----------
   Each opponent brings the same stones in every run, their rare stone included.
   The levels in these codes are replaced by the difficulty's startLevel when a run begins. */

// prettier-ignore
const OPPONENTS = [
  { name: 'Pawnbroker Pete', portrait: 'pete',   deck: 'P1^ P1> P1v P1< N1 B1 G1 K1', line: 'Everything has a price. My Harambe collects.' },
  { name: 'Sir Neighsalot',  portrait: 'neigh',  deck: 'N1 N1> N1v P1^ P1> H1 R1 K1', line: 'Hold your horses. All of them.' },
  { name: 'Madame Swerve',   portrait: 'swerve', deck: 'B1 B1 S1 P1^ P1> P1v N1 K1',  line: 'Darling, I never take the straight road.' },
  { name: 'Blocky Barb',     portrait: 'barb',   deck: 'R1 R1 P1^ P1> P1v P1< N1 K1', line: 'Square deal. Square face. Square loss.' },
  { name: 'Lady Lux',        portrait: 'lux',    deck: 'Q1 W1 B1 P1^ P1> P1v N1 K1',  line: 'I brought my sisters. You brought Tiny Tims.' },
  { name: 'Uncle Gambit',    portrait: 'gambit', deck: 'N1 B1 R1 J1 P1^ P1> P1v K1',  line: 'I sacrifice. You suffer.' },
];
// prettier-ignore
const BOSS = { name: 'The Obsidian Monarch', portrait: 'boss', isBoss: true, deck: 'O1 Q1 Q1 R1 B1 N1 N1> K1', line: 'Nineteen boards behind you. One crown ahead.' };

// Lady Lux's Experienced Edna cures the poison of Madame Swerve's Venom Veronica, so Lady Lux always comes first.
const LADY_LUX = 4;
const MADAME_SWERVE = 2;

/* ---------- Opponent decks ----------
   Every opponent keeps one deck for the whole run, kept in save.run.decks under their portrait name.
   After each match you win, every deck upgrades one stone by one level, so they all grow, even the ones
   you are not facing: you only notice when you meet them again. The king never changes.
   The boss starts with BOSS_HEAD_START extra upgrades. */

const BOSS_HEAD_START = 6;

function withLevel(code, level) {
  return code[0] + level + code.slice(2);
}

function newDecks(difficulty) {
  const decks = {};
  for (const opponent of [...OPPONENTS, BOSS]) {
    decks[opponent.portrait] = opponent.deck.split(' ').map((code) => {
      return PIECES[code[0]].hasNoLevels ? code : withLevel(code, difficulty.startLevel);
    });
  }
  for (let i = 0; i < BOSS_HEAD_START; i++) decks[BOSS.portrait] = upgradeOne(decks[BOSS.portrait], difficulty);
  return decks;
}

function upgradeAllDecks(decks, difficulty) {
  for (const name of Object.keys(decks)) decks[name] = upgradeOne(decks[name], difficulty);
}

// The group of a piece in the upgrade order: its place in the list, or one past the end for every other piece.
function groupOf(type, order) {
  const index = order.findIndex((group) => group.includes(type));
  return index < 0 ? order.length : index;
}

// One stone of the deck goes up one level. With an upgrade order it is one of the lowest-level stones, from the
// first group that has one: every tiny goes up a level, then the next group does, and so on, one level at a time.
// Without one it is any stone that can still grow, at random.
function upgradeOne(deck, difficulty) {
  const growing = deck
    .map((code, index) => ({ index, ...parseCode(code) }))
    .filter((stone) => !PIECES[stone.type].hasNoLevels && stone.level < MAX_LEVEL);
  if (growing.length === 0) return deck;
  let candidates = growing;
  const order = difficulty.upgradeOrder;
  if (order) {
    const lowest = Math.min(...growing.map((stone) => stone.level));
    const atLowest = growing.filter((stone) => stone.level === lowest);
    const firstGroup = Math.min(...atLowest.map((stone) => groupOf(stone.type, order)));
    candidates = atLowest.filter((stone) => groupOf(stone.type, order) === firstGroup);
  }
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  return deck.map((code, index) => (index === chosen.index ? withLevel(code, chosen.level + 1) : code));
}

function deckOf(opponent) {
  return save.run.decks[opponent.portrait];
}

function opponentFor(match) {
  if (match === RUN_LENGTH) return BOSS;
  return OPPONENTS[save.run.opponentOrder[match - 1]];
}

// You place first in odd matches; the boss always places first.
function firstFor(match) {
  if (match === RUN_LENGTH) return OPPONENT;
  return match % 2 === 1 ? YOU : OPPONENT;
}

/* ---------- Small helpers ---------- */

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// "Neigh Nigel Lv 2", or just the name for a stone without levels.
function titleOf(code) {
  const stone = fromCode(code, YOU);
  if (PIECES[stone.type].hasNoLevels) return nameOf(stone);
  return `${nameOf(stone)} Lv ${stone.level}`;
}
