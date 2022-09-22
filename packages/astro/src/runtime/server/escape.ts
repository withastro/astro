import { escape } from 'html-escaper';

// Leverage the battle-tested `html-escaper` npm package.
export const escapeHTML = escape;

export class HTMLBytes extends Uint8Array {
	// @ts-ignore
	get [Symbol.toStringTag]() {
		return 'HTMLBytes';
	}
}

/**
 * A "blessed" extension of String that tells Astro that the string
 * has already been escaped. This helps prevent double-escaping of HTML.
 */
export class HTMLString extends String {
	get [Symbol.toStringTag]() {
		return 'HTMLString';
	}
}

type BlessedType = string | HTMLBytes;

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

export function isHTMLString(value: any): value is HTMLString {
	return Object.prototype.toString.call(value) === '[object HTMLString]';
}

function markHTMLBytes(bytes: Uint8Array) {
	return new HTMLBytes(bytes);
}

export function isHTMLBytes(value: any): value is HTMLBytes {
	return Object.prototype.toString.call(value) === '[object HTMLBytes]';
}

async function* unescapeChunksAsync(iterable: AsyncIterable<Uint8Array>): any {
	for await (const chunk of iterable) {
		yield unescapeHTML(chunk as BlessedType);
	}
}

function* unescapeChunks(iterable: Iterable<any>): any {
	for (const chunk of iterable) {
		yield unescapeHTML(chunk);
	}
}

export function unescapeHTML(
	str: any
):
	| BlessedType
	| Promise<BlessedType | AsyncGenerator<BlessedType, void, unknown>>
	| AsyncGenerator<BlessedType, void, unknown> {
	if (!!str && typeof str === 'object') {
		if (str instanceof Uint8Array) {
			return markHTMLBytes(str);
		}
		// If a response, stream out the chunks
		else if (str instanceof Response && str.body) {
			const body = str.body as unknown as AsyncIterable<Uint8Array>;
			return unescapeChunksAsync(body);
		}
		// If a promise, await the result and mark that.
		else if (typeof str.then === 'function') {
			return Promise.resolve(str).then((value) => {
				return unescapeHTML(value);
			});
		} else if (Symbol.iterator in str) {
			return unescapeChunks(str);
		} else if (Symbol.asyncIterator in str) {
			return unescapeChunksAsync(str);
		}
	}
	return markHTMLString(str);
}
