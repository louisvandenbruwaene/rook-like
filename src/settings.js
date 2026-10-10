/* =====================================================================
   SETTINGS AND OPPONENTS
   The fixed numbers of the game, the difficulties, the opponents and how they grow,
   and two helpers for stone codes.
   ===================================================================== */

const SIZE = 4;
const RUN_LENGTH = 20; // the last match is against the boss
const STARTER_HAND = 'P1^ P1> P1< N1 B1 R1 Q1 K1'; // Tiny Tim, Tony and Ted; Tiny Tom comes from the first opponents
const THINK_MS = 1000;
const BOSS_THINK_MS = 1600;

// Difficulty, picked at the start of a run: how many moves ahead the opponent looks (its own move counts as one).
// Hard looks as far ahead as it can in its thinking time, which in the last moves of a match is to the very end.
const DIFFICULTIES = {
  easy: { name: 'Easy', lookAhead: 1 },
  normal: { name: 'Normal', lookAhead: 2 },
  hard: { name: 'Hard', lookAhead: 99 },
};

/* ---------- Opponents ----------
   Each opponent always plays the same hand of stones, their rare stone included.
   Every match you have won adds LEVELS_PER_WIN levels to their stones: the most valuable piece first
   (in the order of GROWTH_ORDER), then the next, round and round, never above MAX_LEVEL.
   The king and rubble never change. The boss plays the last match and starts BOSS_HEAD_START levels ahead. */

// prettier-ignore
const OPPONENTS = [
  { name: 'Pawnbroker Pete', portrait: 'pete',   hand: 'P1^ P1> P1v P1< N1 B1 G1 K1', line: 'Everything has a price. My gorilla collects.' },
  { name: 'Sir Neighsalot',  portrait: 'neigh',  hand: 'N1 N1> N1v P1^ P1> H1 R1 K1', line: 'Hold your horses. All of them.' },
  { name: 'Madame Swerve',   portrait: 'swerve', hand: 'B1 B1 S1 P1^ P1> P1v N1 K1',  line: 'Darling, I never take the straight road.' },
  { name: 'Blocky Barb',     portrait: 'barb',   hand: 'R1 R1 P1^ P1> P1v P1< N1 K1', line: 'Square deal. Square face. Square loss.' },
  { name: 'Lady Lux',        portrait: 'lux',    hand: 'Q1 W1 B1 P1^ P1> P1v N1 K1',  line: 'I brought my sisters. You brought Tiny Tims.' },
  { name: 'Uncle Gambit',    portrait: 'gambit', hand: 'N1 B1 R1 J1 P1^ P1> P1v K1',  line: 'I sacrifice. You suffer.' },
];
// prettier-ignore
const BOSS = { name: 'The Obsidian Monarch', portrait: 'boss', isBoss: true, hand: 'O1 Q1 Q1 R1 B1 N1 N1> K1', line: 'Nineteen boards behind you. One crown ahead.' };

// Lady Lux's Old Woman cures the poison of Madame Swerve's Serpent, so Lady Lux always comes first.
const LADY_LUX = 4;
const MADAME_SWERVE = 2;

const LEVELS_PER_WIN = 1;
const BOSS_HEAD_START = 6;
const GROWTH_ORDER = 'OEQGJRBSNHWP';

function levelUp(handCodes, extraLevels) {
  const stones = handCodes.split(' ').map((code) => ({ ...parseCode(code), direction: code.slice(2) }));
  const growing = stones
    .filter((stone) => GROWTH_ORDER.includes(stone.type))
    .sort((a, b) => GROWTH_ORDER.indexOf(a.type) - GROWTH_ORDER.indexOf(b.type));
  let added = 0;
  for (let round = 0; round < MAX_LEVEL && added < extraLevels; round++) {
    for (const stone of growing) {
      if (added < extraLevels && stone.level < MAX_LEVEL) {
        stone.level++;
        added++;
      }
    }
  }
  return stones.map((stone) => stone.type + stone.level + stone.direction).join(' ');
}

function handOf(opponent, matchesWon) {
  const extraLevels = matchesWon * LEVELS_PER_WIN + (opponent.isBoss ? BOSS_HEAD_START : 0);
  return levelUp(opponent.hand, extraLevels);
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

// "Sir Gallops Lv 2", or just the name for a stone without levels.
function titleOf(code) {
  const stone = fromCode(code, YOU);
  if (PIECES[stone.type].hasNoLevels) return nameOf(stone);
  return `${nameOf(stone)} Lv ${stone.level}`;
}
