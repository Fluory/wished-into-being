import { REPO, repoUrl, WISH_URL } from '@/shared/repo';

/** Site-wide constants. The repository is the product – every page links back to it. */
export const SITE = {
  name: 'Wished into Being',
  short: 'wished-into-being',
  owner: 'Fluory',
  repo: REPO,
  wishUrl: WISH_URL,
  description:
    'An island in a public GitHub repository where everything was wished for by someone. Open a wish, gather thumbs-ups – every morning a Claude routine draws the most-wanted wish as pixel art and places it on the island. One commit a day.',
  routineTime: '08:59',
  timeZone: 'Europe/Berlin',
  siblings: [
    {
      name: 'One Tile a Day',
      repo: 'Fluory/one-tile-a-day',
      tagline: 'A pixel island that grows by exactly one tile every day.',
      image: 'https://raw.githubusercontent.com/Fluory/one-tile-a-day/main/world/isle.svg',
      site: process.env.NEXT_PUBLIC_TILE_URL,
    },
    {
      name: 'Grow',
      repo: 'Fluory/Grow',
      tagline: 'A garden that grows with the real weather in Heilbronn.',
      image: 'https://raw.githubusercontent.com/Fluory/Grow/main/world/garden.svg',
      site: process.env.NEXT_PUBLIC_GROW_URL,
    },
  ],
} as const;

export { repoUrl };

/** Absolute site URL: explicit env var, else the Vercel production domain, else localhost. */
export function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (explicit) return new URL(explicit);
  if (vercel) return new URL(`https://${vercel}`);
  return new URL('http://localhost:3000');
}
