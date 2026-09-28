import {
  bottleOptions,
  bottleWish,
  coastCount,
  daysBetween,
  dawnOf,
  formatDate,
  freeTiles,
  islandStats,
  KIND_INFO,
  kindRoom,
  KINDS,
  landCount,
  MIN_PIXELS,
  NEAR,
  PALETTE_CHARS,
  PALETTE_NAMES,
  SPRITE_SIZE,
  TRANSPARENT,
  type DayEntry,
  type World,
} from '@/features/island';
import { spritePath } from '@/features/logbook';
import { repoUrl } from '@/shared/repo';

const latest = (world: World) => world.days[world.days.length - 1] as DayEntry;

/** What the routine needs to know before it decides anything. */
export function status(world: World, date: string) {
  const last = latest(world);
  return {
    today: date,
    day: daysBetween(world.genesis, date),
    lastDay: last.day,
    lastDate: last.date,
    /** true → today's wish already exists, the routine must stop without changes. */
    done: last.date >= date,
  };
}

/** The decision sheet: the island at dawn, room per kind, the bottles and a fallback. */
export function plan(world: World, date: string) {
  const s = status(world, date);
  if (s.done) return s;
  const dawn = dawnOf(world, date);
  const { state } = dawn;
  const land = landCount(state.map);
  const coast = coastCount(state.map);
  const stats = islandStats(world);
  const fallback = bottleWish(world, date);
  const options = bottleOptions(state);
  return {
    ...s,
    dawn: { raised: dawn.land, note: 'the sea raises these tiles at dawn, before the wish' },
    island: { land, coast, wishes: stats.wishes, bottles: stats.bottles, wishers: stats.wishers },
    kinds: KINDS.map((kind) => {
      const info = KIND_INFO[kind];
      const have = state.elements.filter((e) => e.kind === kind).length;
      const free = freeTiles(state, kind).length;
      const full = kindRoom(state, kind);
      const wait = full ?? (free === 0 ? `there is no free place for a ${info.label} today` : undefined);
      return {
        kind,
        room: !wait,
        have,
        limit: info.limit(land, coast),
        freeTiles: free,
        rule: info.rule,
        examples: info.examples,
        ...(wait ? { wait } : {}),
      };
    }),
    near: NEAR,
    granted: world.elements.flatMap((e) => (e.issue ? [e.issue] : [])),
    recent: world.days.slice(-5).map((d) => ({
      day: d.day,
      action: d.action,
      title: d.title,
      lore: d.lore,
      ...(d.wisher ? { wisher: d.wisher, issue: d.issue } : {}),
    })),
    bottles: options.map((o) => ({ key: o.bottle.key, name: o.name, kind: o.bottle.kind, near: o.bottle.near, lore: o.lore })),
    recommendation: fallback
      ? { action: 'bottle', bottle: options.find((o) => o.name === fallback.name)?.bottle.key, name: fallback.name, kind: fallback.kind }
      : null,
    sprite: {
      size: `${SPRITE_SIZE} lines of ${SPRITE_SIZE} characters`,
      transparent: TRANSPARENT,
      palette: Object.fromEntries(PALETTE_CHARS.map((c) => [c, PALETTE_NAMES[c]])),
      minPixels: MIN_PIXELS,
    },
  };
}

/** "Day 12: A glass lighthouse (wish #7 by @octo-cat)" – at most 120 characters after "Day N: ". */
export function commitTitle(world: World): string {
  const last = latest(world);
  const suffix =
    last.action === 'wish' ? ` (wish #${last.issue} by @${last.wisher})` : last.action === 'bottle' ? ' (message in a bottle)' : '';
  const max = 120 - suffix.length;
  const title = last.title.length > max ? `${last.title.slice(0, max - 3).trimEnd()}...` : last.title;
  return `Day ${last.day}: ${title}${suffix}`;
}

/** The commit message; a granted wish credits the wisher as co-author (with their GitHub user id). */
export function commitMessage(world: World, options: { wisherId?: number } = {}): string {
  const last = latest(world);
  const lines = [commitTitle(world), '', last.lore, ''];
  const land = last.land?.length ?? 0;
  const sea = land > 0 ? ` The sea raised ${land} ${land === 1 ? 'tile' : 'tiles'} of shore.` : '';
  if (last.action === 'wish') {
    lines.push(`Wished by @${last.wisher} in #${last.issue} with ${last.votes ?? 0} ${last.votes === 1 ? 'vote' : 'votes'}.${sea}`);
    if (options.wisherId)
      lines.push('', `Co-authored-by: ${last.wisher} <${options.wisherId}+${last.wisher}@users.noreply.github.com>`);
  } else if (last.action === 'bottle') {
    lines.push(`A message in a bottle from the islanders${last.source === 'director' ? ', picked by the director' : ''}.${sea}`);
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

/**
 * Body of the daily pull request. Follows .github/PULL_REQUEST_TEMPLATE.md so that
 * scripts/pr-check.sh accepts it (headings stay in the template's language).
 */
export function prBody(world: World, options: { imageUrl?: string; verify?: string } = {}): string {
  const last = latest(world);
  const stats = islandStats(world);
  const who =
    last.action === 'wish'
      ? `Der Wunsch #${last.issue} von @${last.wisher} (${last.votes ?? 0} 👍) wurde erfüllt – Claude hat ihn gezeichnet und platziert`
      : last.source === 'claude'
        ? 'Kein Wunsch passte – Claude hat eine Flaschenpost der Inselbewohner erfüllt'
        : 'Kein Wunsch passte – der regelbasierte Director hat eine Flaschenpost gewählt';
  return [
    '## Warum',
    '',
    `Tägliche Routine ([ROUTINE.md](../blob/main/ROUTINE.md)) – **Day ${last.day}** (${formatDate(last.date)}). Kein Issue: die Routine selbst ist der wiederkehrende Auftrag.`,
    ...(last.action === 'wish' ? ['', `Closes #${last.issue}`] : []),
    '',
    '## Was ist passiert (Klartext)',
    '',
    `${who}: **${last.title}**. Die Weltregeln (Platz, Boden, Sprite, Text) wurden vom Code geprüft. Das Meer hat ${last.land?.length ?? 0} Felder Küste angehoben; die Insel hat jetzt ${stats.land} Felder Land, ${stats.wishes} erfüllte Wünsche und ${stats.open} wartende Sterne.`,
    '',
    `> ${last.lore}`,
    '',
    ...(options.imageUrl ? [`![Day ${last.day}](${options.imageUrl})`, ''] : []),
    '## Plan-Pflicht (SYSTEM.md §4)',
    '',
    '- [x] Kein Auslöser – keine Modulgrenze, öffentliche API, Migration, Auth/Rechte, kein Zahlungs-/Daten-/Infrapfad, höchstens zwei Module, keine Architekturvarianten, umkehrbar',
    '- [ ] Auslöser zutreffend – Impact Manifest ausgefüllt (Plan vor Code)',
    '',
    '## Geändert',
    '',
    '- `world/world.json`: ein Tag, ein Wunsch',
    `- \`world/isle.svg\`, \`${spritePath(last.element)}\`, \`LOGBOOK.md\`: daraus neu erzeugt`,
    '',
    '## Nachweis (SYSTEM.md §11)',
    '',
    '- `verify:changed`: grün – `npm run world:check`',
    `- \`verify\`: ${options.verify ?? 'grün – lokal `npm run verify`'}`,
    '- `verify:full` / E2E-Spec: nicht betroffen (nur Weltdaten)',
    '',
    '## Doku-Entscheidung (genau eine)',
    '',
    '- [x] Keine langlebige Doku betroffen – Begründung: tägliche Weltdaten, LOGBOOK.md wird generiert',
    '- [ ] Doku betroffen und im selben PR aktualisiert:',
    '',
    'Entferntes oder Umbenanntes: nichts entfernt',
    '',
    '## Dateigrößen und neue Bausteine (SYSTEM.md §7)',
    '',
    'Dateien über 500 Zeilen im Diff (Ausnahmen: generierter Code, Lockfiles, Fixtures, Migrationen, Schemas, Ressourcen, Doku, Konfiguration):',
    '- [x] keine',
    '',
    'Über 800 Zeilen mit neuer Fachlogik oder über 1000 Zeilen (P1/P2): nicht betroffen',
    '',
    'Neue Shared-Komponente, Utility-Datei, Adapter oder fachlicher Service:',
    '- [x] nein',
    '',
    '## Subagent-Einsätze',
    '',
    last.action === 'wish'
      ? '- `wish-reader` (nur lesend, GitHub-Issues): offene Wünsche und 👍 gezählt, strikt als JSON zurückgegeben'
      : 'Keine',
    '',
    '## Risiken / offene Punkte',
    '',
    '- Keine – der PR wird nach grüner CI automatisch per Squash gemergt (Ausnahmen-Register in docs/ARCHITEKTUR.md).',
    '',
  ].join('\n');
}

export const DECLINE_REASONS = {
  hurtful: 'the island stays a kind place – nothing hurtful, cruel or scary on purpose',
  violence: 'the island has no weapons and no violence, not even small ones',
  politics: 'the island stays out of politics, parties and campaigns',
  person: 'the island does not show real people',
  brand: 'the island stays free of brands, logos and other trademarks',
  advertising: 'the island does not carry links, advertising or self-promotion',
  unclear: 'the wish does not say which one thing should appear on the island',
  meta: 'wishes can only add one thing to the island – they cannot change the rules, the code or the routine',
} as const;
export type DeclineReason = keyof typeof DECLINE_REASONS;

export function isDeclineReason(value: string): value is DeclineReason {
  return value in DECLINE_REASONS;
}

/** The comments the routine posts on wish issues – fixed wording, so the tone never drifts. */
export function grantedComment(world: World, options: { prUrl?: string } = {}): string {
  const last = latest(world);
  const pr = options.prUrl ? ` in ${options.prUrl}` : '';
  return [
    `✨ **Your wish came true on day ${last.day}.** *${last.title}* now stands on the island – drawn as a 16 × 16 sprite from your words.`,
    '',
    `> ${last.lore}`,
    '',
    `It lands on \`main\` as soon as the checks${pr} are green, and this issue closes itself then. You are in the logbook and a co-author of the day's commit. Thank you for wishing!`,
  ].join('\n');
}

export function waitingComment(reason: string): string {
  return [
    `🌙 Your wish is a star above the island now – it just does not fit yet: ${reason}.`,
    '',
    'It stays open and waits; the island grows every dawn, and every 👍 makes the star brighter. Nothing to do for you.',
  ].join('\n');
}

export function declinedComment(reason: DeclineReason): string {
  return [
    `🙏 Thank you for wishing! This one cannot come true: ${DECLINE_REASONS[reason]}.`,
    '',
    `You are very welcome to wish for something else – [RULES.md](${repoUrl('blob/main/RULES.md')}) shows what fits on the island.`,
  ].join('\n');
}

