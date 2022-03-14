const entities = { '"': 'quot', '&': 'amp', "'": 'apos', '<': 'lt', '>': 'gt' } as const;

// This util is only ever run on expression values that we already know are of type `string`
export const escapeHTML = (str: string) => str.replace(/["'&<>]/g, (char: string) => '&' + entities[char as keyof typeof entities] + ';');

/**
 * RawString is a "blessed" version of String
 * that is not subject to escaping.
 */
export class UnescapedString extends String {}

/**
 * unescapeHTML marks a string as raw, unescaped HTML.
 * This should only be generated internally, not a public API.
 */
export const unescapeHTML = (value: any) => {
	// Cast any `string` values to `UnescapedString` to mark them as ignored
	// The `as unknown as string` is necessary for TypeScript to treat this as `string`
	if (typeof value === 'string') {
		return new UnescapedString(value) as unknown as string;
	}
	// Just return values that are `number`, `null`, `undefined` etc
	// The compiler will recursively stringify these correctly
	return value;
};
