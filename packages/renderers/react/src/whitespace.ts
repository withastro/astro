/**
 * Whether `text` holds only HTML whitespace: spaces, tabs, line feeds, form feeds and carriage
 * returns. Unlike `String.prototype.trim()`, it treats a non-breaking space (U+00A0) as text.
 */
export function isHtmlWhitespace(text: string): boolean {
	return /^[\t\n\f\r ]*$/.test(text);
}

/**
 * Whether a text node among a component's top-level children is skipped: whitespace at either end
 * of the children, or whitespace that holds a line break. A space between two inline elements on
 * one line, as in `<b>a</b> <i>b</i>`, is kept.
 */
export function isSkippedTopLevelText(text: string, isFirst: boolean, isLast: boolean): boolean {
	return isHtmlWhitespace(text) && (isFirst || isLast || /[\n\r]/.test(text));
}
