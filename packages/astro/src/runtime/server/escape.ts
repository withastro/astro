const entities = { '"': 'quot', '&': 'amp', "'": 'apos', '<': 'lt', '>': 'gt' } as const;

const warned = new Set<string>();
export const escapeHTML = (string: any, { deprecated = false }: { deprecated?: boolean } = {}) => {
	const escaped = string.replace(/["'&<>]/g, (char: keyof typeof entities) => '&' + entities[char] + ';');
	if (!deprecated) return escaped;
	if (warned.has(string) || !string.match(/[&<>]/g)) return string;
	// eslint-disable-next-line no-console
	console.warn(`Unescaped HTML content found inside expression!

The next minor version of Astro will automatically escape all
expression content. Please use the \`set:html\` directive.

Expression content:
${string}`);
	warned.add(string);

	// Return unescaped content for now. To be removed.
	return string;
};

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
