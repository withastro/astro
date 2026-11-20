/**
 * Whether `text` holds only HTML whitespace: spaces, tabs, line feeds, form feeds and carriage
 * returns. Unlike `String.prototype.trim()`, it treats a non-breaking space (U+00A0) as text.
 */
export function isHtmlWhitespace(text: string): boolean {
	return /^[\t\n\f\r ]*$/.test(text);
}
