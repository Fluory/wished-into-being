import { LOGIN } from './schema';

/** Plain-text checks for everything that ends up in world.json, the logbook and commits. */

const FORBIDDEN = /(https?:\/\/|www\.|@\w)/i;

export function checkText(kind: 'title' | 'lore' | 'name', value: string): string | null {
  const text = value.trim();
  const max = kind === 'title' ? 80 : kind === 'name' ? 40 : 200;
  if (text.length < 3) return `${kind} is too short`;
  if (text.length > max) return `${kind} is longer than ${max} characters`;
  if (/[\r\n\t]/.test(text)) return `${kind} must be a single line`;
  if (/[<>`|*_\\[\]{}#]/.test(text)) return `${kind} must be plain text (no markdown, HTML or issue references)`;
  if (FORBIDDEN.test(text)) return `${kind} must not contain links or @mentions`;
  if (/\p{Extended_Pictographic}/u.test(text)) return `${kind} must not contain emoji`;
  return null;
}

export function checkLogin(login: string): string | null {
  return LOGIN.test(login) ? null : `"${login}" is not a GitHub username`;
}

/** "A glass lighthouse" → "A glass lighthouse" (title case of the first letter only). */
export function tidyName(name: string): string {
  const t = name.trim().replace(/\s+/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}
