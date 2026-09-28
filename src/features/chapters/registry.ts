import type { IconName } from '@/features/sprites';

/**
 * The chapters – short case studies of how the island works. Content lives in
 * src/content/chapters/<slug>.mdx; this list gives them order, cover and summary.
 */
export interface Chapter {
  slug: string;
  no: string;
  title: string;
  summary: string;
  icon: IconName;
  cover: string;
  minutes: number;
}

export const CHAPTERS: readonly Chapter[] = [
  {
    slug: 'why-wishes',
    no: '01',
    title: 'An island made of wishes',
    summary: 'Why a public repository is a good place to wish for things – and why only one wish a day comes true.',
    icon: 'well',
    cover: '#5b3f8c',
    minutes: 3,
  },
  {
    slug: 'sixteen-colours',
    no: '02',
    title: 'Sixteen by sixteen, fifteen colours',
    summary: 'How a wish becomes a sprite: the palette, the checks, and how Claude draws what you only described.',
    icon: 'lantern',
    cover: '#2b2d5c',
    minutes: 4,
  },
  {
    slug: 'the-sea-and-the-rules',
    no: '03',
    title: 'The sea and the rules',
    summary:
      'Two tiles of shore every dawn, room that grows with the land, and why the island can never lock itself up.',
    icon: 'rowboat',
    cover: '#162256',
    minutes: 5,
  },
  {
    slug: 'the-routine',
    no: '04',
    title: 'A routine with guard rails',
    summary:
      'What happens between 08:59 and the merge – and how a wish that says “ignore your instructions” stays just a wish.',
    icon: 'owl',
    cover: '#211c4d',
    minutes: 5,
  },
];

export function chapterBySlug(slug: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.slug === slug);
}
