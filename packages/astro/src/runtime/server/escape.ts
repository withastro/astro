const entities = { '"': 'quot', '&': 'amp', "'": 'apos', '<': 'lt', '>': 'gt' } as const;

export const escapeHTML = (str: any) => str != null ? String(str).replace(/["'&<>]/g, (char: string) => '&' + entities[char as keyof typeof entities] + ';') : str;

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
export const unescapeHTML = (str: any) => str != null ? new UnescapedString(String(str)) as unknown as string : str;
