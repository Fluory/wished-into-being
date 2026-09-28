/** The repository is the product: every page, the logbook and the routine link back to it. */
export const REPO = 'Fluory/wished-into-being';

export function repoUrl(path = ''): string {
  return `https://github.com/${REPO}${path ? `/${path}` : ''}`;
}

/** The issue form for a new wish. */
export const WISH_URL = repoUrl('issues/new?template=wish.yml');

export function issueUrl(issue: number): string {
  return repoUrl(`issues/${issue}`);
}

export function profileUrl(login: string): string {
  return `https://github.com/${login}`;
}
