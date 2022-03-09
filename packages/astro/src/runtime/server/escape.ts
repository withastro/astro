const entities = { '"': 'quot', '&': 'amp', "'": 'apos', '<': 'lt', '>': 'gt' } as const;

export const escapeHTML = (string: any) => string.replace(/["'&<>]/g, (char: keyof typeof entities) => '&' + entities[char] + ';');

/**
 * RawString is a "blessed" version of String
 * that is not subject to escaping.
 */
export class UnescapedString extends String {}

/**
 * unescapeHTML marks a string as raw, unescaped HTML.
 * This should only be generated internally, not a public API.
 *
 * Need to cast the return value `as unknown as string` so TS doesn't yell at us.
 */
export const unescapeHTML = (str: any) => new UnescapedString(str) as unknown as string;
