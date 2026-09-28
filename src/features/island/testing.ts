import type { WishInput } from './apply';
import { BOTTLE_SPRITES } from './sprites';

/** A valid wish for tests – override what the test is about. */
export function wish(over: Partial<WishInput> = {}): WishInput {
  return {
    action: 'wish',
    kind: 'light',
    name: 'A glass lantern',
    sprite: [...(BOTTLE_SPRITES.lantern ?? [])],
    issue: 7,
    wisher: 'octo-cat',
    votes: 3,
    lore: 'It glows a little brighter whenever someone reads the logbook.',
    source: 'claude',
    ...over,
  };
}
