import { escape } from 'html-escaper';
import { streamAsyncIterator } from './util.js';

// Leverage the battle-tested `html-escaper` npm package.
export const escapeHTML = escape;

/**
 * A "blessed" extension of String that tells Astro that the string
 * has already been escaped. This helps prevent double-escaping of HTML.
 */
export class HTMLString extends String {
	get [Symbol.toStringTag]() {
		return 'HTMLString';
	}
}

type BlessedType = string | ArrayBufferView;

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
		return new HTMLString(value);
	}
	// Return all other values (`number`, `null`, `undefined`) as-is.
	// The compiler will recursively stringify these correctly at a later stage.
	return value;
};

/**
 * @deprecated Use `value instanceof HTMLString` instead. Can't remove as used by `@astrojs/markdoc` v0.8.x.
 * TODO: Remove this when releasing a new `@astrojs/markdoc` major.
 */
export function isHTMLString(value: any): value is HTMLString {
	return Object.prototype.toString.call(value) === '[object HTMLString]';
}

function hasGetReader(obj: unknown): obj is ReadableStream {
	return typeof (obj as any).getReader === 'function';
}

async function* unescapeChunksAsync(iterable: ReadableStream | string): any {
	if (hasGetReader(iterable)) {
		for await (const chunk of streamAsyncIterator(iterable)) {
			yield unescapeHTML(chunk as BlessedType);
		}
	} else {
		for await (const chunk of iterable) {
			yield unescapeHTML(chunk as BlessedType);
		}
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
			return str;
		}
		// If a response, stream out the chunks
		else if (str instanceof Response && str.body) {
			const body = str.body;
			return unescapeChunksAsync(body);
		}
		// If a promise, await the result and mark that.
		else if (typeof str.then === 'function') {
			return Promise.resolve(str).then((value) => {
				return unescapeHTML(value);
			});
		} else if (Symbol.iterator in str) {
			return unescapeChunks(str);
		} else if (Symbol.asyncIterator in str || hasGetReader(str)) {
			return unescapeChunksAsync(str);
		}
	}
	return markHTMLString(str);
}
