import { escape } from 'html-escaper';

// Leverage the battle-tested `html-escaper` npm package.
export const escapeHTML = escape;

/**
 * A "blessed" extension of String that tells Astro that the string
 * has already been escaped. This helps prevent double-escaping of HTML.
 */
export class HTMLString extends String {}

/**
 * markHTMLString marks a string as raw or "already escaped" by returning
 * a `HTMLString` instance. This is meant for internal use, and should not
 * be returned through any public JS API.
 */
export const markHTMLString = (value: any) => {
	// If value is already marked as an HTML string, there is nothing to do.
	if (value instanceof HTMLString) {
		return value;
	}
	// Cast to `HTMLString` to mark the string as valid HTML. Any HTML escaping
	// and sanitization should have already happened to the `value` argument.
	// NOTE: `unknown as string` is necessary for TypeScript to treat this as `string`
	if (typeof value === 'string') {
		return new HTMLString(value) as unknown as string;
	}
	// Return all other values (`number`, `null`, `undefined`) as-is.
	// The compiler will recursively stringify these correctly at a later stage.
	return value;
};
