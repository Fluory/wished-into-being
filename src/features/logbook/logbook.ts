import { formatDate, formatMonth, islandStats, type DayEntry, type World } from '@/features/island';
import { issueUrl, profileUrl } from '@/shared/repo';

/**
 * LOGBOOK.md – the island's chronicle, newest day first: every wish with its sprite, who wished
 * it and the line of lore it came with. Generated from world.json; never edit it by hand.
 */

export function spritePath(elementId: string): string {
  return `world/sprites/${elementId}.svg`;
}

/** "wished by @octo-cat in #12 · 5 votes" as Markdown links, or where the day came from. */
export function creditMarkdown(entry: DayEntry): string {
  if (entry.action === 'genesis') return 'the beginning';
  if (entry.action === 'bottle')
    return entry.source === 'director'
      ? 'a message in a bottle from the islanders · picked by the director'
      : 'a message in a bottle from the islanders';
  const votes = entry.votes ?? 0;
  return `wished by [@${entry.wisher}](${profileUrl(entry.wisher ?? '')}) in [#${entry.issue}](${issueUrl(entry.issue ?? 0)}) · ${votes} ${votes === 1 ? 'vote' : 'votes'}`;
}

function block(entry: DayEntry): string[] {
  return [
    `### <img src="${spritePath(entry.element)}" width="40" height="40" alt=""> Day ${entry.day} · ${entry.title}`,
    '',
    `<sub>${formatDate(entry.date)} · ${creditMarkdown(entry)}</sub>`,
    '',
    `> ${entry.lore}`,
    '',
  ];
}

export function renderLogbook(world: World): string {
  const stats = islandStats(world);
  const out: string[] = [
    '# Logbook',
    '',
    `> The chronicle of **${world.name}**, newest day first – one wish per day, granted by the daily routine`,
    '> ([ROUTINE.md](ROUTINE.md)). The single source of truth is [`world/world.json`](world/world.json);',
    '> this file is generated from it.',
    '',
    `**Day ${stats.day}** · ${stats.wishes} ${stats.wishes === 1 ? 'wish' : 'wishes'} granted for ${stats.wishers} ${stats.wishers === 1 ? 'person' : 'people'} · ${stats.bottles} ${stats.bottles === 1 ? 'message' : 'messages'} in a bottle · ${stats.land} tiles of land · ${stats.open} ${stats.open === 1 ? 'star' : 'stars'} still waiting · founded ${formatDate(world.genesis)}`,
  ];
  let month = '';
  for (const entry of [...world.days].reverse()) {
    const m = formatMonth(entry.date);
    if (m !== month) {
      month = m;
      out.push('', `## ${m}`, '');
    }
    out.push(...block(entry));
  }
  while (out[out.length - 1] === '') out.pop();
  out.push('');
  return out.join('\n');
}
