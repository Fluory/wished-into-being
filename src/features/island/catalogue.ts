import type { Near } from './rules';
import type { Kind } from './schema';
import { BOTTLE_SPRITES } from './sprites';

/**
 * Messages in a bottle: what the islanders wish for themselves on days when no wish from
 * outside fits. The routine picks one (or the director does); the logbook credits "the
 * islanders". Names start with "A"/"An" so a second one can be "Another …"; each bottle has a
 * few lore lines so a repeat does not repeat the story.
 */
export interface BottleWish {
  key: keyof typeof BOTTLE_SPRITES;
  name: string;
  kind: Kind;
  near: Near;
  lore: readonly string[];
}

export const BOTTLE_WISHES: readonly BottleWish[] = [
  {
    key: 'lantern',
    name: 'A lantern for the path',
    kind: 'light',
    near: 'well',
    lore: [
      'Someone kept tripping on the way home. Now the path remembers where it goes.',
      'One lantern was not enough for all the walking home that happens here.',
      'It is lit every evening by nobody in particular.',
    ],
  },
  {
    key: 'pine',
    name: 'A young pine',
    kind: 'plant',
    near: 'anywhere',
    lore: [
      'It smells of winter even in summer, and the owls already argue about it.',
      'The first pine looked lonely, so the island grew it a friend.',
      'It leans a little towards the well, as if it wants to hear the wishes.',
    ],
  },
  {
    key: 'bench',
    name: 'A bench for stargazing',
    kind: 'object',
    near: 'water',
    lore: [
      'Two people fit on it, three if one of them is the cat.',
      'This one faces the other half of the sky.',
      'Carved into the back: a list of every star that came true.',
    ],
  },
  {
    key: 'cat',
    name: 'A grey cat',
    kind: 'creature',
    near: 'well',
    lore: [
      'Nobody wished for a cat. The cat does not care.',
      'The first cat invited a second one. Nobody was asked.',
      'It sleeps on whatever was wished for most recently.',
    ],
  },
  {
    key: 'flowers',
    name: 'A bed of night flowers',
    kind: 'plant',
    near: 'anywhere',
    lore: [
      'They open when the lanterns do and close before anyone wakes.',
      'Seeds from the first bed travelled in the fur of the cat.',
      'They glow faintly, which the bees have decided to ignore.',
    ],
  },
  {
    key: 'rowboat',
    name: 'A small rowboat',
    kind: 'water',
    near: 'water',
    lore: [
      'It never goes far, but it always comes back with a story.',
      'Tied to the shore with a knot nobody remembers learning.',
      'It is painted the colour of the sky just after a wish.',
    ],
  },
  {
    key: 'owl',
    name: 'An owl',
    kind: 'creature',
    near: 'quiet',
    lore: [
      'She counts the wishes every night and has not lost track once.',
      "He checks the first owl's counting and has found no mistake yet.",
      'It only says one word, and nobody agrees which word it is.',
    ],
  },
  {
    key: 'signpost',
    name: 'A signpost',
    kind: 'object',
    near: 'well',
    lore: [
      'One arrow points home, the other points at the next wish.',
      'It points to places the island has not grown yet.',
      'Every arrow on it says the same thing: here.',
    ],
  },
  {
    key: 'campfire',
    name: 'A campfire',
    kind: 'light',
    near: 'water',
    lore: [
      'Wishes are easier to say out loud next to a fire.',
      'The smoke drifts toward the stars that are still waiting.',
      'Somebody always brings too many marshmallows.',
    ],
  },
  {
    key: 'cottage',
    name: 'A cottage with warm windows',
    kind: 'building',
    near: 'well',
    lore: [
      'The first house on the island. The door is never locked.',
      'A second chimney, a second kettle, a second set of warm windows.',
      'Built from wood the sea brought, one plank per wish.',
    ],
  },
  {
    key: 'fish',
    name: 'A golden fish',
    kind: 'water',
    near: 'water',
    lore: [
      'It grants no wishes. It only listens, which is sometimes better.',
      'It follows the rowboat around like a small bright shadow.',
      'On full moons it circles the island exactly once.',
    ],
  },
  {
    key: 'telescope',
    name: 'A telescope',
    kind: 'object',
    near: 'water',
    lore: [
      'Pointed at the stars that are still wishes – to see which one is next.',
      'This one is pointed at the sea, to watch for bottles.',
      'Its lens is slightly scratched, which makes every star look like a comet.',
    ],
  },
  {
    key: 'mushrooms',
    name: 'A ring of mushrooms',
    kind: 'plant',
    near: 'quiet',
    lore: [
      'They appeared overnight, which is exactly what mushrooms like to do.',
      'Another ring, as if the first one had been practice.',
      'Step inside the ring and the waves go very quiet.',
    ],
  },
  {
    key: 'tent',
    name: 'A violet tent',
    kind: 'building',
    near: 'quiet',
    lore: [
      'For guests who come to see the island and forget to leave.',
      'The guests from the first tent told their friends.',
      'It smells of rain and of cocoa, in that order.',
    ],
  },
  {
    key: 'kite',
    name: 'A red kite',
    kind: 'object',
    near: 'water',
    lore: [
      'Tied to a stone, because the wind here has ideas of its own.',
      'The kites play tag with the gulls and usually lose.',
      'On a clear day you can see it from the next island.',
    ],
  },
  {
    key: 'crystal',
    name: 'A glowing crystal',
    kind: 'light',
    near: 'quiet',
    lore: [
      'Nobody knows where it came from. It hums when a new wish arrives.',
      'It hums in harmony with the first one, a third lower.',
      'Moths come from miles away just to look at it.',
    ],
  },
  {
    key: 'snail',
    name: 'A snail with a golden shell',
    kind: 'creature',
    near: 'quiet',
    lore: [
      'The slowest islander. It will reach the well by next spring.',
      'It is racing the first snail. Nobody has noticed yet.',
      'It leaves a silver line that the moon likes to follow.',
    ],
  },
  {
    key: 'birdhouse',
    name: 'A birdhouse',
    kind: 'object',
    near: 'anywhere',
    lore: [
      'Built for birds that have not arrived yet. They will.',
      'The first one filled up, so now there is a waiting list.',
      'It has a tiny sign on it that says: wishes welcome.',
    ],
  },
];

export function bottleSprite(key: BottleWish['key']): string[] {
  return [...(BOTTLE_SPRITES[key] ?? [])];
}

export function findBottle(key: string): BottleWish | undefined {
  return BOTTLE_WISHES.find((b) => b.key === key);
}

const ORDINALS = [
  'Another',
  'A third',
  'A fourth',
  'A fifth',
  'A sixth',
  'A seventh',
  'An eighth',
  'A ninth',
  'A tenth',
  'An eleventh',
  'A twelfth',
];

/** The name of the n-th bottle of one kind: "A grey cat", "Another grey cat", "A third grey cat" … */
export function repeatName(name: string, n: number): string {
  if (n <= 1) return name;
  const base = name.replace(/^(an?|the)\s+/i, '');
  const prefix = ORDINALS[n - 2];
  if (prefix) return `${prefix} ${base}`;
  return `${base.charAt(0).toUpperCase()}${base.slice(1)} no. ${n}`;
}
