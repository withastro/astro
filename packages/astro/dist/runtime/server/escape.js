import { escape } from 'html-escaper';
import { streamAsyncIterator } from './util.js';
const escapeHTML = escape;
function stringifyForScript(value) {
	return JSON.stringify(value)?.replace(/</g, '\\u003c');
}
class HTMLBytes extends Uint8Array {}
Object.defineProperty(HTMLBytes.prototype, Symbol.toStringTag, {
	get() {
		return 'HTMLBytes';
	},
});
const htmlStringSymbol = /* @__PURE__ */ Symbol.for('astro:html-string');
class HTMLString extends String {
	[htmlStringSymbol] = true;
}
const markHTMLString = (value) => {
	if (isHTMLString(value)) {
		return value;
	}
	if (typeof value === 'string') {
		return new HTMLString(value);
	}
	return value;
};
function isHTMLString(value) {
	return !!value?.[htmlStringSymbol];
}
function markHTMLBytes(bytes) {
	return new HTMLBytes(bytes);
}
function isHTMLBytes(value) {
	return Object.prototype.toString.call(value) === '[object HTMLBytes]';
}
function hasGetReader(obj) {
	return typeof obj.getReader === 'function';
}
async function* unescapeChunksAsync(iterable) {
	if (hasGetReader(iterable)) {
		for await (const chunk of streamAsyncIterator(iterable)) {
			yield unescapeHTML(chunk);
		}
	} else {
		for await (const chunk of iterable) {
			yield unescapeHTML(chunk);
		}
	}
}
function* unescapeChunks(iterable) {
	for (const chunk of iterable) {
		yield unescapeHTML(chunk);
	}
}
function unescapeHTML(str) {
	if (!!str && typeof str === 'object') {
		if (str instanceof Uint8Array) {
			return markHTMLBytes(str);
		} else if (str instanceof Response && str.body) {
			const body = str.body;
			return unescapeChunksAsync(body);
		} else if (typeof str.then === 'function') {
			return Promise.resolve(str).then((value) => {
				return unescapeHTML(value);
			});
		} else if (str[/* @__PURE__ */ Symbol.for('astro:slot-string')]) {
			return str;
		} else if (Symbol.iterator in str) {
			return unescapeChunks(str);
		} else if (Symbol.asyncIterator in str || hasGetReader(str)) {
			return unescapeChunksAsync(str);
		}
	}
	return markHTMLString(str);
}
export {
	HTMLBytes,
	HTMLString,
	escapeHTML,
	isHTMLBytes,
	isHTMLString,
	markHTMLString,
	stringifyForScript,
	unescapeHTML,
};
