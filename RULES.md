# Rules of the island

> Generated from `src/features/island/` – the code enforces every rule on this page; the daily routine only
> chooses within them. Change the rules in code, then run `npm run world:render`.

## How a wish comes true

1. Anyone opens a [wish](https://github.com/Fluory/wished-into-being/issues/new?template=wish.yml): one thing for the island, a name, a line about it – and, if you like, a drawing.
2. Everyone can vote with a 👍 reaction on the issue.
3. Every morning the routine grants the wish with the most 👍 (at least one) that fits the rules below. On a tie the older wish wins.
4. The wish is drawn as a 16 × 16 sprite (yours, or Claude draws one from your words), placed on the island and
   written into the logbook with your name. The issue is closed with a comment and you are credited as co-author of that day’s commit.
5. A wish that does not fit *yet* stays open with a note saying what is missing – usually room. Every open wish shines as a star
   above the island; the more 👍, the brighter.

## One wish, one tile

Every wish is one of six kinds. How many of a kind the island can hold grows with the island:

| Kind | Where and how many | For example |
|---|---|---|
| **building** | stands on grass; one building for every 6 tiles of land, plus one | a cottage, a tower, a tent, a tiny library |
| **plant** | grows on grass; one plant for every 3 tiles of land, plus two | a tree, a flower bed, mushrooms, a hedge |
| **creature** | lives on land; one creature for every 5 tiles of land, plus one | a cat, an owl, a snail, a fox |
| **object** | stands on land; one object for every 4 tiles of land, plus two | a bench, a telescope, a signpost, a kite |
| **light** | stands on land and glows at night; one light for every 6 tiles of land, plus one | a lantern, a campfire, a glowing crystal |
| **water wish** | floats in the water next to the shore; one for every 4 tiles of shore, plus one | a rowboat, a golden fish, a buoy |

A wish can ask to stand somewhere: **anywhere** (wherever there is room), **well** (close to the wishing well, in the middle of things), **water** (close to the shore), **quiet** (as far from everything else as possible). The exact tile is chosen by the code.

## The sea

Every dawn the sea raises **2 tiles** of shore, before the day's wish. Land with land on all four sides turns to grass,
the rest is beach – buildings and plants need grass. The sea keeps 2 tiles of open water around every boat or fish,
so no water wish is ever locked into a pond. Together the room for all kinds grows faster than one per tile, so the island never fills up.

## Wishes that are declined

A wish is closed without being granted when it asks for something that does not belong on a small, kind island: anything
hurtful or violent, politics, real people, brands, logos or other trademarks, links or advertising. The routine says why in one friendly
comment. Everything else simply waits its turn.

## Messages in a bottle

On a day when no wish fits, the islanders wish for something themselves – a lantern, a cat, a rowboat (18 ideas in
`catalogue.ts`), or something Claude draws for them. The logbook marks these days as messages in a bottle.

## Drawing a sprite

A sprite is 16 lines of 16 characters. `.` is transparent; every other character is one colour of the palette.
It needs at least 20 coloured pixels and at least two colours (an outline and a fill), and it may not fill the whole tile.
Draw it standing on the bottom rows – the island is seen from above, the things on it from the front.

| Character | Colour | Hex | |
|---|---|---|---|
| `k` | ink | `#1b1330` |  |
| `n` | navy | `#2b2d5c` |  |
| `v` | violet | `#5b3f8c` |  |
| `p` | lilac | `#b86ad8` |  |
| `r` | red | `#d9534f` |  |
| `o` | orange | `#f28c38` | glows at night |
| `y` | gold | `#ffd45e` | glows at night |
| `c` | cream | `#fff3c4` | glows at night |
| `w` | white | `#f5f5f5` |  |
| `g` | green | `#5fb35f` |  |
| `d` | dark green | `#2f6b3f` |  |
| `b` | blue | `#4aa3df` |  |
| `t` | teal | `#7fdcd0` |  |
| `u` | brown | `#8b5a3c` |  |
| `e` | grey | `#9aa0b5` |  |

A lantern, for example:

```text
................
.......kk.......
......kyyk......
.....kyccyk.....
.....kyccyk.....
.....kyccyk.....
......kyyk......
.......kk.......
.......uu.......
.......uu.......
.......uu.......
.......uu.......
.......uu.......
......uuuu......
.....kkkkkk.....
................
```
