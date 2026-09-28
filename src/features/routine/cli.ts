import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { Resvg } from '@resvg/resvg-js';
import {
  applyDay,
  berlinDate,
  bottleSprite,
  bottleWish,
  checkSprite,
  checkTile,
  checkWish,
  createGenesis,
  dawnOf,
  findBottle,
  isIsoDate,
  isKind,
  NEAR,
  parseSprite,
  pickTile,
  repeatName,
  spriteStats,
  validateWorld,
  WorldRuleError,
  type Near,
  type Star,
  type WishInput,
  type World,
} from '@/features/island';
import { renderSpriteSvg } from '@/features/render';
import { abs, PATHS, readWorld, staleFiles, worldExists, writeWorld } from './files';
import {
  commitMessage,
  commitTitle,
  declinedComment,
  DECLINE_REASONS,
  grantedComment,
  isDeclineReason,
  plan,
  prBody,
  status,
  waitingComment,
} from './report';

/**
 * The daily routine's toolbox. Claude calls these commands; the code guarantees the rules.
 *
 *   npm run day -- status                 is today's wish already there?
 *   npm run day -- plan                   the island at dawn, room per kind, bottles, a fallback
 *   npm run day -- try --kind … --name … --sprite-file …   would this wish fit today? (no changes)
 *   npm run day -- sprite-preview --sprite-file …           render a sprite to look at (PNG)
 *   npm run day -- apply --action wish --issue 12 --wisher octo-cat --votes 5 --kind light
 *                        --name "…" --sprite-file tmp/wish-12.txt --lore "…" [--near well] [--stars "15:3,18:1"]
 *   npm run day -- apply --action bottle --bottle lantern [--lore "…"] [--stars …]
 *   npm run day -- auto [--stars …]       the director picks a message in a bottle
 *   npm run day -- check | render | pr-body | commit-title | commit-message [--wisher-id n]
 *   npm run day -- comment granted [--pr-url …] | waiting --reason "…" | declined --why <reason>
 *   npm run day -- genesis --date YYYY-MM-DD   create the island (once)
 */

const EXIT_RULE = 2;
const EXIT_ALREADY_DONE = 3;
const EXIT_WAIT = 4;

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    date: { type: 'string' },
    action: { type: 'string' },
    bottle: { type: 'string' },
    issue: { type: 'string' },
    wisher: { type: 'string' },
    'wisher-id': { type: 'string' },
    votes: { type: 'string' },
    kind: { type: 'string' },
    name: { type: 'string' },
    'sprite-file': { type: 'string' },
    near: { type: 'string' },
    x: { type: 'string' },
    y: { type: 'string' },
    title: { type: 'string' },
    lore: { type: 'string' },
    stars: { type: 'string' },
    out: { type: 'string' },
    reason: { type: 'string' },
    why: { type: 'string' },
    'image-url': { type: 'string' },
    'pr-url': { type: 'string' },
    verify: { type: 'string' },
    force: { type: 'boolean', default: false },
  },
});

/** Pretty JSON, but short number lists ([x, y] tiles) stay on one line. */
const json = (value: unknown) =>
  JSON.stringify(value, null, 2).replace(
    /\[\s+(-?\d+(?:,\s+-?\d+)*)\s+\]/g,
    (_m, inner: string) => `[${inner.split(/,\s+/).join(', ')}]`,
  );
const print = (value: unknown) => process.stdout.write(`${typeof value === 'string' ? value : json(value)}\n`);
const fail = (message: string, code = 1): never => {
  process.stderr.write(`✗ ${message}\n`);
  process.exit(code);
};

function today(): string {
  const date = values.date ?? berlinDate();
  if (!isIsoDate(date)) fail(`--date must be YYYY-MM-DD, got "${date}"`);
  return date;
}

function int(name: 'x' | 'y' | 'issue' | 'votes' | 'wisher-id'): number | undefined {
  const raw = values[name];
  if (raw === undefined) return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) fail(`--${name} must be a whole number`);
  return n;
}

/** "12:5,15:3" → open wishes (issue:votes) that shine as stars tonight. */
function stars(): Star[] | undefined {
  if (!values.stars) return undefined;
  return values.stars
    .split(',')
    .filter(Boolean)
    .map((pair) => {
      const [issue, votes] = pair.split(':').map(Number);
      if (!Number.isInteger(issue) || !Number.isInteger(votes) || (issue ?? 0) < 1 || (votes ?? -1) < 0)
        fail(`--stars expects "issue:votes,issue:votes", got "${pair}"`);
      return { issue: issue as number, votes: votes as number };
    });
}

function spriteFromFile(): string[] {
  const file = values['sprite-file'];
  if (!file) return fail('--sprite-file is required (16 lines of 16 palette characters)');
  return parseSprite(readFileSync(file, 'utf8'));
}

function near(): Near | undefined {
  const value = values.near;
  if (value === undefined) return undefined;
  if (!(NEAR as readonly string[]).includes(value)) fail(`--near must be one of ${NEAR.join(', ')}`);
  return value as Near;
}

/** The wish described by the command line (wish, catalogue bottle or the islanders' own bottle). */
function wishInput(world: World): WishInput {
  const action = values.action ?? 'wish';
  if (action !== 'wish' && action !== 'bottle') return fail('--action must be "wish" or "bottle"');
  const x = int('x');
  const y = int('y');
  const place = x !== undefined && y !== undefined ? { x, y } : {};
  if (action === 'bottle' && values.bottle) {
    const bottle = findBottle(values.bottle);
    if (!bottle) return fail(`unknown bottle "${values.bottle}" – see "bottles" in the plan`);
    const names = new Set(world.elements.map((e) => e.name.toLowerCase()));
    let n = 1;
    while (names.has(repeatName(bottle.name, n).toLowerCase())) n++;
    return {
      action: 'bottle',
      kind: bottle.kind,
      name: values.name ?? repeatName(bottle.name, n),
      sprite: bottleSprite(bottle.key),
      lore: values.lore ?? bottle.lore[(n - 1) % bottle.lore.length] ?? '',
      near: near() ?? bottle.near,
      ...(values.title ? { title: values.title } : {}),
      ...place,
      stars: stars(),
      source: 'claude',
    };
  }
  const kind = values.kind ?? '';
  if (!isKind(kind)) fail(`--kind must be one of building, plant, creature, object, light, water`);
  if (!values.name) fail('--name is required');
  if (!values.lore) fail('--lore is required (one or two short sentences)');
  return {
    action,
    kind: kind as WishInput['kind'],
    name: values.name as string,
    sprite: spriteFromFile(),
    lore: values.lore as string,
    ...(action === 'wish' ? { issue: int('issue'), wisher: values.wisher, votes: int('votes') ?? 0 } : {}),
    ...(values.title ? { title: values.title } : {}),
    near: near() ?? 'anywhere',
    ...place,
    stars: stars(),
    source: 'claude',
  };
}

function commit(input: WishInput, date: string) {
  const world = readWorld();
  if (status(world, date).done) fail(`Day for ${date} is already recorded – nothing to do.`, EXIT_ALREADY_DONE);
  try {
    const result = applyDay(world, input, date);
    const files = writeWorld(result.world);
    print({
      day: result.entry.day,
      date: result.entry.date,
      action: result.entry.action,
      element: result.element.id,
      kind: result.element.kind,
      tile: [result.element.x, result.element.y],
      title: result.entry.title,
      lore: result.entry.lore,
      ...(result.entry.issue ? { issue: result.entry.issue, wisher: result.entry.wisher } : {}),
      raised: result.entry.land ?? [],
      commitTitle: commitTitle(result.world),
      files,
    });
  } catch (error) {
    if (error instanceof WorldRuleError) fail(`rule: ${error.message}`, error.wait ? EXIT_WAIT : EXIT_RULE);
    throw error;
  }
}

const command = positionals[0] ?? 'help';

switch (command) {
  case 'status':
    print(status(readWorld(), today()));
    break;

  case 'plan':
    print(plan(readWorld(), today()));
    break;

  case 'try': {
    const date = today();
    const world = readWorld();
    if (status(world, date).done) fail(`Day for ${date} is already recorded – nothing to do.`, EXIT_ALREADY_DONE);
    const input = wishInput(world);
    const { state } = dawnOf(world, date);
    const problem = checkWish(state, input);
    if (problem) {
      print({ fits: false, wait: problem.wait, reason: problem.reason });
      break;
    }
    const tile =
      input.x !== undefined && input.y !== undefined
        ? checkTile(state, input.kind, input.x, input.y) === null
          ? [input.x, input.y]
          : null
        : pickTile(state, input.kind, input.near ?? 'anywhere', date);
    print(
      tile
        ? { fits: true, tile }
        : {
            fits: false,
            wait: input.x === undefined,
            reason:
              input.x === undefined
                ? 'no free place for this kind today'
                : checkTile(state, input.kind, input.x, input.y ?? 0),
          },
    );
    break;
  }

  case 'sprite-preview': {
    const sprite = spriteFromFile();
    const out = values.out ?? 'tmp/sprite-preview.png';
    const problem = checkSprite(sprite);
    const svg = renderSpriteSvg(
      sprite.length === 16 ? sprite : [...sprite, ...Array(16).fill('.'.repeat(16))].slice(0, 16),
    );
    mkdirSync(dirname(abs(out)), { recursive: true });
    writeFileSync(abs(out), new Resvg(svg, { fitTo: { mode: 'width', value: 900 } }).render().asPng());
    print({ ok: problem === null, ...(problem ? { problem } : {}), ...spriteStats(sprite), png: out });
    break;
  }

  case 'apply': {
    const date = today();
    commit(wishInput(readWorld()), date);
    break;
  }

  case 'auto': {
    const date = today();
    const world = readWorld();
    if (status(world, date).done) fail(`Day for ${date} is already recorded – nothing to do.`, EXIT_ALREADY_DONE);
    const bottle = bottleWish(world, date, stars());
    if (!bottle) fail('no message in a bottle fits the island today');
    commit(bottle as WishInput, date);
    break;
  }

  case 'render': {
    const files = writeWorld(readWorld());
    print(files.length ? `updated: ${files.join(', ')}` : 'everything up to date');
    break;
  }

  case 'check': {
    if (!worldExists()) fail(`${PATHS.world} is missing – run "npm run day -- genesis --date YYYY-MM-DD" once`);
    const raw: unknown = JSON.parse(readFileSync(abs(PATHS.world), 'utf8'));
    const problems = validateWorld(raw);
    if (problems.length === 0) {
      const stale = staleFiles(readWorld());
      if (stale.length) problems.push(`out of date: ${stale.join(', ')} – run "npm run world:render"`);
    }
    if (problems.length) fail(`world check failed:\n  - ${problems.join('\n  - ')}`);
    const world = readWorld();
    print(
      `world ok – day ${world.days[world.days.length - 1]?.day}, ${world.elements.length} on the island, generated files up to date`,
    );
    break;
  }

  case 'pr-body':
    print(prBody(readWorld(), { imageUrl: values['image-url'], verify: values.verify }));
    break;

  case 'commit-title':
    print(commitTitle(readWorld()));
    break;

  case 'commit-message':
    print(commitMessage(readWorld(), { wisherId: int('wisher-id') }).trimEnd());
    break;

  case 'comment': {
    const kind = positionals[1];
    if (kind === 'granted') print(grantedComment(readWorld(), { prUrl: values['pr-url'] }));
    else if (kind === 'waiting') print(waitingComment(values.reason ?? fail('--reason is required (from "try")')));
    else if (kind === 'declined') {
      const why = values.why ?? '';
      if (!isDeclineReason(why)) fail(`--why must be one of ${Object.keys(DECLINE_REASONS).join(', ')}`);
      print(declinedComment(why as keyof typeof DECLINE_REASONS));
    } else fail('usage: comment granted [--pr-url …] | waiting --reason "…" | declined --why <reason>');
    break;
  }

  case 'genesis': {
    if (worldExists() && !values.force)
      fail(`${PATHS.world} already exists – genesis happens only once (use --force to overwrite)`);
    const date = today();
    const files = writeWorld(createGenesis(date));
    print({ genesis: date, files });
    break;
  }

  default:
    print(
      [
        'usage: npm run day -- <command> [options]',
        '',
        '  status | plan | try | sprite-preview | apply | auto | check | render',
        '  pr-body | commit-title | commit-message | comment | genesis',
        '',
        '  --date YYYY-MM-DD   pretend it is this day (default: today in Europe/Berlin)',
        '  apply --action wish --issue <n> --wisher <login> --votes <n> --kind <kind> --name "<name>"',
        '        --sprite-file <file> --lore "<text>" [--title "…"] [--near anywhere|well|water|quiet] [--x n --y n]',
        '  apply --action bottle --bottle <key> [--lore "…"]   or   --action bottle --kind … --name … --sprite-file …',
        '  --stars "12:5,15:3"  open wishes (issue:votes) that shine above the island tonight',
      ].join('\n'),
    );
    if (command !== 'help') process.exit(1);
}
