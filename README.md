# Rook-like: how the code works

Rook-like is a roguelike of spiked chess stones. You and the computer take turns placing stones on a 4 × 4 board. Facing spikes fight, the winner takes the other stone, and one move can set off a chain of fights. A run is twenty matches against opponents who grow stronger with every win, and the last one is the boss.

The page is [`index.html`](index.html) (layout and rules text) with [`style.css`](style.css) and nine small scripts in [`src/`](src/), loaded in this order. They share one global scope, so a later file can use everything from an earlier one. The diagrams below use the function names from the code, so you can search for any box.

| File | Lines | What it holds |
|---|---|---|
| [`src/rules.js`](src/rules.js) | 454 | the pieces, stones, the board, one fight, one move. Pure logic, never touches the page |
| [`src/computer.js`](src/computer.js) | 117 | the computer player |
| [`src/art.js`](src/art.js) | 240 | every stone and portrait as an SVG string (120 lines are drawing data) |
| [`src/settings.js`](src/settings.js) | 130 | board size, run length, difficulties, the opponents and their decks |
| [`src/save.js`](src/save.js) | 120 | progress and settings in localStorage |
| [`src/screen.js`](src/screen.js) | 255 | the state of a match and the `render…()` functions |
| [`src/move.js`](src/move.js) | 202 | how a move plays out on screen, step by step |
| [`src/run.js`](src/run.js) | 289 | the cards between matches, from difficulty to the end of a run |
| [`src/controls.js`](src/controls.js) | 109 | the rules panel, mouse, touch and keys, and the start |

## How the files fit together

```mermaid
flowchart LR
    subgraph logic["logic (no page)"]
        rules["<b>rules.js</b><br/>pieces, board,<br/>fight, move"]
        computer["<b>computer.js</b><br/>bestMove"]
    end
    art["<b>art.js</b><br/>drawStone,<br/>drawPortrait"]
    subgraph page["the page"]
        settings["<b>settings.js</b> · <b>save.js</b><br/>opponents, saves"]
        screen["<b>screen.js</b><br/>render…()"]
        move["<b>move.js</b><br/>makeMove, animate"]
        run["<b>run.js</b><br/>cards between matches"]
        controls["<b>controls.js</b><br/>input, start"]
    end
    sheet["stone-sheet.js<br/>(printable sheet)"]

    computer --> rules
    art --> rules
    screen --> art
    screen --> rules
    move --> screen
    move --> computer
    run --> settings
    run --> move
    controls --> run
    sheet --> rules
    sheet --> art
```

| Part | What it knows | Never does |
|---|---|---|
| **rules + computer** | the pieces, the board, one fight, one move, the computer player | touch the page |
| **art** | how every stone, spike, shield and portrait looks | know the rules |
| **the page** | what is on screen, how a move plays out, the run, saving | decide who wins a fight |

Naming: `render…()` updates the page, `draw…()` returns an SVG string. The rules use the words of the rules: a move is a **clash**, then a **chain**, and stones get **taken**.

## The data

```mermaid
classDiagram
    class Game {
        size = 4
        owners[16] : EMPTY · YOU · OPPONENT · RUBBLE
        stones[16] : Stone or null
        hands : [your stones, their stones]
        turn : YOU or OPPONENT
        first : who placed first
        moveCount
        popeWinner : set when a Pope is taken
    }
    class Stone {
        type : piece letter, P N B R Q K ...
        level : 0 to 5, only opponents start at 0
        facing : YOU or OPPONENT
        variant : 0 to 3, the quarter turn
        spikes : [top, right, bottom, left]
        poison : byPlayer, dueAtMove
        grounded : a Pope without his jet pack
    }
    class Piece {
        name, chess, description
        baseSpikes or levelSpikes
        variants : four names, for pieces that turn
        powers : goldenShields, poisonous, curesPoison,
        mayCollapse, thickFur, swarm, isPope
    }
    class Move {
        handIndex
        cell
    }
    class MoveResult {
        a Game, plus what happened:
        fights : from, to, spikesFrom, spikesTo, step
        flips : cell, owner, step, collapsed
        breaks : cell, side, count, step
        promotions : cell, step
    }
    Game "1" o-- "0..16" Stone : on the board and in hands
    Stone --> Piece : PIECES[type]
    Move ..> Game : play(game, move)
    MoveResult --|> Game : is a
```

Stones in hands, saves and opponents are written as short **codes**: piece letter, level, and for a turned piece its direction. `N2` is Sir Gallops at level 2, `P1>` a pawn turned to point right. `fromCode(code, facing)` turns a code into a Stone.

The squares are numbered row by row:

```
 0  1  2  3
 4  5  6  7
 8  9 10 11
12 13 14 15
```

## One move: `play(game, move, luck)`

`play` never changes the game it gets. It returns a new game plus a record of everything that happened, step by step, so the page can replay it.

```mermaid
flowchart TD
    start(["play(game, move)"]) --> place["put the stone on the square"]
    place --> bee{"a Beekeeper?"}
    bee -- yes --> sting["<b>sting</b><br/>one spike off every enemy side<br/>in the 8 squares around, Popes grounded"]
    bee -- no --> clash
    sting --> clash["<b>clash</b> · step 0<br/>the new stone fights every enemy neighbour<br/>wins take them, one loss gets it taken"]
    clash --> chain["<b>chain</b> · steps 1, 2, 3 ...<br/>fight the open line closest to the new stone,<br/>until no open line is left"]
    chain --> cure1["<b>cure</b><br/>Old Women cure poisoned neighbours<br/>and become the Grand Empress"]
    cure1 --> poison["<b>poisonStrikes</b><br/>poison that is due: the stone goes<br/>over to the poisoner, and a chain follows"]
    poison --> cure2["<b>cure</b> again"]
    cure2 --> done(["the new game + its records"])
```

### One fight: `fight(game, cell, side, neighbour, step)`

Two stones meet across one line. The spikes facing each other break off one for one, and a spike that hits is used up, so the winner always spends at least one: 2 against 1 ends 1 against 0.

```mermaid
flowchart LR
    f(["fight"]) --> p["<b>poisonHit</b><br/>a poisonous stone that hits<br/>poisons the other, win or lose"]
    p --> s{"golden shield<br/>on either side?"}
    s -- yes --> sh["every spike touching the shield breaks<br/>nobody wins"]
    s -- no --> b["<b>breakSpikes</b> on both sides<br/>(a Gorilla loses at most one)"]
    b --> w{"more spikes?"}
    w -- "this side" --> t1["<b>take</b> the other stone"]
    w -- "that side" --> t2["<b>take</b> this stone"]
    w -- equal --> none["no winner"]
```

`take` turns a stone over to the other colour, unless it is the king or a flying Pope. A Pope that is taken ends the match. Prince Joey has a 1 in 3 chance to collapse into rubble instead.

### The chain

```mermaid
flowchart TD
    a(["chain(game, origin)"]) --> b["<b>closestOpenLine</b><br/>two stones of different colours side by side<br/>with a spike between them, closest to origin"]
    b --> c{"found one?"}
    c -- no --> e(["done: no open line is left"])
    c -- yes --> d["<b>fight</b> it, record it as the next step"]
    d --> b
```

Every fight uses up at least one spike, so the chain always ends.

## The computer player: `bestMove(game, thinkingTimeMs, random, maxDepth)`

```mermaid
flowchart TD
    a(["bestMove"]) --> g["start from the greedy move<br/>(the one that takes the most stones now)"]
    g --> d["depth = 1"]
    d --> n["<b>negamax</b> every move, depth moves deep<br/>moves tried best capture first (<b>sortedMoves</b>),<br/>alpha-beta skips moves that cannot matter"]
    n --> leaf["at the bottom: <b>estimate</b> =<br/><b>score</b> + most of the best next capture"]
    leaf --> pick["best = a random one of the equally best moves"]
    pick --> more{"time left and<br/>depth < maxDepth?"}
    more -- yes --> deeper["depth + 1"] --> n
    more -- no --> r(["play best"])
```

`score` rates a position for the player to move, with the same order of tiebreaks as `winnerOf`:

| What | Worth |
|---|---|
| taking the Pope | 1 000 000 |
| each point ahead | 2 000 |
| each spike ahead | 2 (at most 640 in total, so one point always counts more) |
| having placed first | 1 |

The difficulty sets two things: `maxDepth`, how many moves ahead the computer may look, and how strong its stones are.

| Difficulty | Looks ahead | Opponent stones start at | After each of your wins, every deck upgrades one stone |
|---|---|---|---|
| Easy | 2 moves | level 0 | tinies first, then everything else, one level at a time |
| Normal | as far as it can | level 0 | tinies, knights, bishops and rooks, then everything else, one level at a time |
| Hard | 2 moves | level 1 | any stone, at random |
| Very hard | as far as it can | level 1 | any stone, at random |

"As far as it can" means one second of thinking (1.6 for the boss). Near the end of a match that reaches the very last move. A level 0 stone has one spike fewer on every spiked side, so a level 0 tiny has none.

## A turn on screen

```mermaid
sequenceDiagram
    actor You
    participant Page as the page
    participant Engine as rules + computer
    participant Draw as art.js

    You->>Page: pick a stone, hover a square
    Page->>Engine: play(game, move) without luck
    Engine-->>Page: preview: what you would take and lose
    Page->>Draw: drawStone for the ghost and the rings
    You->>Page: click the square
    Page->>Engine: makeMove → play(game, move, luck)
    Engine-->>Page: new game + records
    loop animate: one step at a time
        Page->>Page: showStep → spikes shatter, stones turn over
        Page->>Draw: repaint the squares that changed
    end
    Page->>Page: popGain (+2, −1 ...)
    Page->>Engine: nextTurn → bestMove(game, …)
    Engine-->>Page: the computer's move
    Page->>Page: makeMove again, the same way
    Note over Page: board full or Pope taken → finishMatch
```

While a move plays out the board shows `replay.owners`, the colours as they are at that step, and `shownStone` keeps spikes whole until the step in which they break. When the last step is over the page draws the real game again.

## A run

```mermaid
stateDiagram-v2
    [*] --> chooseDifficulty
    chooseDifficulty --> intro : Easy · Normal · Hard · Very hard
    intro --> startMatch : pick 8 from your collection, Fight
    startMatch --> finishMatch : board full or Pope taken
    finishMatch --> offerRewards : you won, every opponent deck upgrades one stone
    offerRewards --> nextMatch : upgrade one of 5 stones (+ a new stone)
    nextMatch --> intro
    finishMatch --> endRun : you lost, or won match 20
    endRun --> chooseDifficulty : keep one gain, new run
```

- **Opponent decks** (`newDecks`, `upgradeOne`, `upgradeAllDecks` in `settings.js`): every opponent keeps one deck for the whole run, starting at the difficulty's level. After each match you win, every deck upgrades one stone, so they all grow, even the ones you are not facing. The boss starts with 6 extra upgrades. 
- **Your collection** (`run.collection`, `deckFrom`, `renderCollection` in `run.js`): every stone you own this run, at every level you have had it. Before each match you pick 8 of them as your deck.
- **Rewards** (`offerRewards`): after a win you upgrade one of five random stones from your deck by one level. The upgraded stone takes its place in the deck and the old one stays in the collection. If the opponent played a stone (piece and turn) that you do not own, you also get one of those, at level 1.
- **The end of a run** (`endRun`): keep one gain, an upgrade or a new stone, in your collection for good.
- **Who places first** (`firstFor`): you in odd matches, the opponent in even ones, the boss always.
- **Winning a match** (`winnerOf`): taking the Pope, else most points (stones), else most spikes left, else whoever placed first.
- **Saves** (`loadSave`, `store`) keep your starting hand, records and the run in localStorage. Older saves are converted when they load.

## Checking a change

The code is checked by behaviour, not by tests in the repo:

- `node stone-sheet.js` prints every stone's rating and writes `stones.html`. Its output should not change unless you meant to change a stone.
- For rule changes, play a few seeded games in node with `src/rules.js` and `src/computer.js` (see how `stone-sheet.js` loads them) and compare the move records before and after.
