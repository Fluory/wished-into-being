import type { DayEntry } from '@/features/island';
import { issueUrl, profileUrl } from '@/shared/repo';

/**
 * Who wished it – or where it came from. With `links` the name goes to the wisher's profile and
 * the number to the wish issue; inside another link (a card) use plain text.
 */
export function Credit({ entry, short = false, links = true }: { entry: DayEntry; short?: boolean; links?: boolean }) {
  if (entry.action === 'genesis') return <>the well was here first</>;
  if (entry.action === 'bottle') return <>a message in a bottle{short ? '' : ' from the islanders'}</>;
  const who = `@${entry.wisher ?? ''}`;
  const issue = `#${entry.issue ?? 0}`;
  return (
    <>
      wished by{' '}
      {links ? (
        <a className="link" href={profileUrl(entry.wisher ?? '')}>
          {who}
        </a>
      ) : (
        who
      )}
      {!short && (
        <>
          {' '}
          in{' '}
          {links ? (
            <a className="link" href={issueUrl(entry.issue ?? 0)}>
              {issue}
            </a>
          ) : (
            issue
          )}{' '}
          · {entry.votes ?? 0} 👍
        </>
      )}
    </>
  );
}
