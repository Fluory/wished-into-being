# Evals – the routine's guard rails

The routine is an AI agent with write access to this repository that reads text written by strangers
(add-on KI/RAG, SYSTEM.md §10). Its *creative* output – the drawing, the line of lore – is judged by people
reading the logbook. Its *guard rails* are fixed and tested on every pull request: each known risk has cases
that fail when the protection weakens.

## Wishes that try to break the routine – `wishes.json`

Fifteen cases: prompt injection in the description, in the name and in the drawing, fake JSON, links and
mentions, claimed votes, unknown kinds – and wishes that must be declined (brands, politics, real people,
violence, rule changes). Each case has two halves:

- **`code`** – what the checks in code must do with it (verdict, cleaned description, flags). Runs in every
  `npm run verify` through `src/features/routine/evals.test.ts`.
- **`routine`** – the decision ROUTINE.md expects from the agent. Reviewed whenever `ROUTINE.md` or
  `.claude/agents/wish-reader.md` change: run the routine on a scratch branch with the case as the only wish
  (`npm run day -- wishes --from <case>`), compare, and note the result in the pull request.

## Layers against untrusted wishes

| Layer | What it guarantees | Covered by |
|---|---|---|
| `wish-reader` agent | issue text is read by a scout with read-only GitHub tools, no shell, no write tools; it answers with fixed JSON and reports its repository | `.claude/agents/wish-reader.md`; repository check in `wishes.test.ts` – "must come from this repository" |
| `npm run day -- wishes` | every field is schema-checked; names without links, mentions, markup or emoji; descriptions cleaned and cut to 300 characters; votes only from GitHub's count | `wishes.test.ts`, `evals.test.ts` |
| Island engine | a wish can only ever add one element on a legal tile, with a valid sprite and plain text – however it is asked | `island.test.ts` – ground, room, text, sprite, issue and username checks |
| CLI text checks | titles and lore are plain text; nothing a wish says reaches the logbook as a link | `lore.ts`, `island.test.ts` – "needs an issue, a real username and plain text" |
| `world:check` | the whole history replays: every dawn, every wish legal on its day, nothing edited by hand | `island.test.ts` – "detects tampering"; runs in `npm run verify` |
| CI `daily-merge` | only world files, exactly one commit, a `Day N:` title – anything else is not merged | `.github/workflows/ci.yml` |

## Other risks

| Risk | Expected behaviour | Covered by |
|---|---|---|
| Second wish on the same day (routine runs twice) | refused, island unchanged | `island.test.ts` – "refuses a second wish on the same day"; CLI `status.done` (exit 3) |
| The same wish granted twice | refused | `island.test.ts`; `wishes.test.ts` – "knows wishes that already came true" |
| A kind without room | the wish waits (exit 4), a bottle comes instead | `island.test.ts` – "tells a wish to wait" |
| The island locks itself up | impossible: room grows faster than wishes | `island.test.ts` – "never locks up" (a full simulated year) |
| Derived files out of sync with `world.json` | `world:check` fails | CLI `check` (in `npm run verify`) |
| PR body without the plain-language section or proof | CI red | `scripts/pr-check.sh`; `report.test.ts` – PR body |

**Fail-closed:** every CLI error aborts with a non-zero exit code; nothing writes the island silently. The only
fallbacks – a message in a bottle and `npm run day -- auto` – are rule-checked like any wish and marked in the
logbook. A prompt change (`ROUTINE.md`, the wish-reader) is a normal pull request and reviewed like code.
