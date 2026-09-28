# Contributing

Thanks for stopping by the island! There are two ways to add something – and they work very differently.

## Wish for something (no code needed)

Open a [wish](https://github.com/Fluory/wished-into-being/issues/new?template=wish.yml): one thing for the island,
a name, a few words about it and – if you like – a drawing of 16 × 16 pixels. Vote for other wishes with a 👍.
Every morning at 08:59 (Europe/Berlin) the routine grants the most-wanted wish that fits the
[rules](../RULES.md). If yours comes true, you are in the logbook and a co-author of that day's commit.

## Change the code

- **Code** – the island engine (`src/features/island`), the renderer (`src/features/render`), the routine's
  toolbox (`src/features/routine`), the website (`src/app`, `src/features/*`), tests and docs. Open an issue
  first for anything bigger than a small fix, so we can agree on the goal.
- **Rules** – new kinds, room, the sea: proposals are welcome. A rule change needs a test in
  `src/features/island/*.test.ts`; RULES.md is generated from the code.

## What you cannot change by hand

`world/world.json`, `world/isle.svg`, `world/sprites/` and `LOGBOOK.md` change exactly once a day, through the
routine described in [ROUTINE.md](../ROUTINE.md). Pull requests that edit them by hand are closed.

## Workflow

1. Fork, create a branch, make the change.
2. `npm ci`, then `npm run verify` (format, lint, types, tests, world check, build) must be green.
3. Open a pull request with a clear description. Maintainers fill in the project's PR template (Klartext,
   Nachweis, Doku-Entscheidung) before merging – you do not have to.

## Development

```bash
npm ci
npm run dev                  # website on http://localhost:3000
npm run day -- plan          # what the routine would see today
npm run day -- status        # is today already done?
npm run day -- sprite-preview --sprite-file my-drawing.txt   # look at a drawing
npm test                     # unit tests and the eval set
```

By contributing you agree that your code is released under the MIT license and any island content under
CC BY 4.0. Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).
