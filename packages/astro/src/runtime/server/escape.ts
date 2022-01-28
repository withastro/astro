const entities = { '"': 'quot', '&': 'amp', "'": 'apos', '<': 'lt', '>': 'gt' } as const;

export const escapeHTML = (string: any) => string.replace(/["'&<>]/g, (char: keyof typeof entities) => '&' + entities[char] + ';');

/**
 * RawString is a "blessed" version of a String
 * that is not subject to escaping.
 */
export class UnescapedString extends String {}

export const unescapeHTML = (str: any) => new UnescapedString(str);
