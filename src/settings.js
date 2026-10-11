/* =====================================================================
   SETTINGS AND OPPONENTS
   The fixed numbers of the game, the difficulties, the opponents and their decks.

   Contents: the game's numbers · difficulties · opponents · opponent decks · small helpers
   ===================================================================== */

/* ---------- The game's numbers ---------- */

const SIZE = 4;
const RUN_LENGTH = 20; // the last match is against the boss
const DECK_SIZE = 8; // the stones you take into a match, chosen from your collection
const ONE_PER_DECK = ['king', 'queen']; // a deck holds at most one king and one queen, whatever their turn
const ONLY_ONE_OWNED = ['queen']; // you own one queen: an upgraded or newly kept queen replaces the old one
const UPGRADE_CHOICES = 3; // after a win, you pick one of this many stones from your deck to upgrade
// Every turn of the pawn and the knight: after a win, a turn you do not own yet may be your new stone.
const TURNED_STONES = [
  'pawn_level_1_up',
  'pawn_level_1_right',
  'pawn_level_1_down',
  'pawn_level_1_left',
  'knight_level_1',
  'knight_level_1_right',
  'knight_level_1_down',
  'knight_level_1_left',
];
// Tiny Tim, Tony and Ted; Tiny Tom and the other horses come as rewards
const STARTER_COLLECTION = [
  'pawn_level_1_up',
  'pawn_level_1_right',
  'pawn_level_1_left',
  'knight_level_1',
  'bishop_level_1',
  'rook_level_1',
  'queen_level_1',
  'king_level_1',
];
const THINK_MS = 1000;
const BOSS_THINK_MS = 1600;

/* ---------- Difficulties ---------- */

// Difficulty, picked at the start of a run.
//   lookAhead     how many moves ahead the opponent looks (its own move counts as one). 99 is as far as it can
//                 in its thinking time, which in the last moves of a match is to the very end.
//   startLevel    the level of every opponent stone at the start of a run
//   growth        how many levels every opponent deck gains per match you win (a fraction spreads them out:
//                 1.5 is 1, 2, 1, 2, ...), so the opponents pull further ahead the longer the run goes
//   bossBehind    how many of those upgrades the boss misses, at the start of the run
//   upgradeOrder  which stones the opponents upgrade first after your wins, as groups of pieces, with
//                 every other piece as one last group (see upgradeOne). null: any stone, at random.
// prettier-ignore
const DIFFICULTIES = {
  easy:     { name: 'Easy',      lookAhead: 2,  startLevel: 0, growth: 1,    bossBehind: 0,  upgradeOrder: [['pawn']] },
  normal:   { name: 'Normal',    lookAhead: 99, startLevel: 0, growth: 1.5,  bossBehind: 4,  upgradeOrder: [['pawn', 'knight', 'bishop', 'rook']] },
  hard:     { name: 'Hard',      lookAhead: 2,  startLevel: 0, growth: 2,    bossBehind: 12, upgradeOrder: null },
  veryHard: { name: 'Very hard', lookAhead: 99, startLevel: 0, growth: 2.25, bossBehind: 17, upgradeOrder: null },
};

/* ---------- Opponents ----------
   Each opponent brings the same stones in every run, their rare stone included.
   The levels in these codes are replaced by the difficulty's startLevel when a run begins. */

const OPPONENTS = [
  {
    name: 'Pawnbroker Pete',
    portrait: 'pete',
    deck: [
      'pawn_level_1_up',
      'pawn_level_1_right',
      'pawn_level_1_down',
      'pawn_level_1_left',
      'knight_level_1',
      'bishop_level_1',
      'hairy_harambe_level_1',
      'king_level_1',
    ],
  },
  {
    name: 'Sir Neighsalot',
    portrait: 'neigh',
    deck: [
      'knight_level_1',
      'knight_level_1_right',
      'knight_level_1_down',
      'pawn_level_1_up',
      'pawn_level_1_right',
      'buzzy_beatrice_level_1',
      'rook_level_1',
      'king_level_1',
    ],
  },
  {
    name: 'Madame Swerve',
    portrait: 'swerve',
    deck: [
      'bishop_level_1',
      'bishop_level_1',
      'venom_veronica_level_1',
      'pawn_level_1_up',
      'pawn_level_1_right',
      'pawn_level_1_down',
      'knight_level_1',
      'king_level_1',
    ],
  },
  {
    name: 'Blocky Barb',
    portrait: 'barb',
    deck: [
      'rook_level_1',
      'rook_level_1',
      'pawn_level_1_up',
      'pawn_level_1_right',
      'pawn_level_1_down',
      'pawn_level_1_left',
      'knight_level_1',
      'king_level_1',
    ],
  },
  {
    name: 'Lady Lux',
    portrait: 'lux',
    deck: [
      'queen_level_1',
      'experienced_edna_level_1',
      'bishop_level_1',
      'pawn_level_1_up',
      'pawn_level_1_right',
      'pawn_level_1_down',
      'knight_level_1',
      'king_level_1',
    ],
  },
  {
    name: 'Uncle Gambit',
    portrait: 'gambit',
    deck: [
      'knight_level_1',
      'bishop_level_1',
      'rook_level_1',
      'brittle_bernard_level_1',
      'pawn_level_1_up',
      'pawn_level_1_right',
      'pawn_level_1_down',
      'king_level_1',
    ],
  },
];
const BOSS = {
  name: 'The Obsidian Monarch',
  portrait: 'boss',
  isBoss: true,
  deck: [
    'queen_level_1',
    'queen_level_1',
    'rook_level_1',
    'rook_level_1',
    'bishop_level_1',
    'knight_level_1',
    'knight_level_1_right',
    'king_level_1',
  ],
};

// Lady Lux's Experienced Edna cures the poison of Madame Swerve's Venom Veronica, so Lady Lux always comes first.
const LADY_LUX = 4;
const MADAME_SWERVE = 2;

/* ---------- Opponent decks ----------
   Every opponent keeps one deck for the whole run, kept in save.run.decks under their portrait name.
   After each match you win, every deck gains the difficulty's growth in levels, one stone one level at a time, so
   they all grow, even the ones you are not facing: you only notice when you meet them again. The king never changes.
   The boss misses the difficulty's first bossBehind upgrades: with two queens and placing first, it needs no more. */

function newDecks(difficulty) {
  const decks = {};
  for (const opponent of [...OPPONENTS, BOSS]) {
    decks[opponent.portrait] = opponent.deck.map((code) => {
      return PIECES[pieceOf(code)].hasNoLevels ? code : withLevel(code, difficulty.startLevel);
    });
  }
  return decks;
}

// After winning match number `match`, the decks make the upgrades numbered from the growth reached one match earlier
// up to the growth reached now, so a growth of 1.5 makes 1, then 2, then 1, ...
function upgradeAllDecks(decks, difficulty, match) {
  const first = Math.floor((match - 1) * difficulty.growth) + 1;
  const last = Math.floor(match * difficulty.growth);
  for (let upgrade = first; upgrade <= last; upgrade++) {
    for (const name of Object.keys(decks)) {
      if (name === BOSS.portrait && upgrade <= difficulty.bossBehind) continue;
      decks[name] = upgradeOne(decks[name], difficulty);
    }
  }
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
    .filter((stone) => canLevelUp(stone.type, stone.level));
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
