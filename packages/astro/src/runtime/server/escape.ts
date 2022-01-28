import { defaultLogOptions, warn } from '../../core/logger.js';

const entities = { '"': 'quot', '&': 'amp', "'": 'apos', '<': 'lt', '>': 'gt' } as const;

const warned = new Set<string>();
export const escapeHTML = (string: any, { deprecated = false }: { deprecated?: boolean } = {}) => {
	const escaped = string.replace(/["'&<>]/g, (char: keyof typeof entities) => '&' + entities[char] + ';');
	if (!deprecated) return escaped;
	if (warned.has(string) || !string.match(/[&<>]/g)) return string;
	warn(defaultLogOptions, 'warning', `Unescaped HTML content found inside expression!

The next minor version of Astro will automatically escape all
expression content. See https://err.astro.build/0001 for more info.

Expression:
${string}`);
	warned.add(string);

	// Return unescaped content for now. To be removed.
	return string;
}

/**
 * RawString is a "blessed" version of String
 * that is not subject to escaping.
 */
export class UnescapedString extends String {}

export const unescapeHTML = (str: any) => new UnescapedString(str);
