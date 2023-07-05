import type { SSRElement } from '../../../@types/astro';

import { HTMLString, markHTMLString } from '../escape.js';
import { serializeListValue } from '../util.js';

export const voidElementNames =
	/^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;
const htmlBooleanAttributes =
	/^(allowfullscreen|async|autofocus|autoplay|controls|default|defer|disabled|disablepictureinpicture|disableremoteplayback|formnovalidate|hidden|loop|nomodule|novalidate|open|playsinline|readonly|required|reversed|scoped|seamless|itemscope)$/i;
const htmlEnumAttributes = /^(contenteditable|draggable|spellcheck|value)$/i;
// Note: SVG is case-sensitive!
const svgEnumAttributes = /^(autoReverse|externalResourcesRequired|focusable|preserveAlpha)$/i;

const STATIC_DIRECTIVES = new Set(['set:html', 'set:text']);

// converts (most) arbitrary strings to valid JS identifiers
const toIdent = (k: string) =>
	k.trim().replace(/(?:(?!^)\b\w|\s+|[^\w]+)/g, (match, index) => {
		if (/[^\w]|\s/.test(match)) return '';
		return index === 0 ? match : match.toUpperCase();
	});

export const toAttributeString = (value: any, shouldEscape = true) =>
	shouldEscape ? String(value).replace(/&/g, '&#38;').replace(/"/g, '&#34;') : value;

const kebab = (k: string) =>
	k.toLowerCase() === k ? k : k.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
const toStyleString = (obj: Record<string, any>) =>
	Object.entries(obj)
		.map(([k, v]) => {
			if (k[0] !== '-' && k[1] !== '-') return `${kebab(k)}:${v}`;
			// TODO: Remove in v3! See #6264
			// We need to emit --kebab-case AND --camelCase for backwards-compat in v2,
			// but we should be able to remove this workaround in v3.
			if (kebab(k) !== k) return `${kebab(k)}:var(${k});${k}:${v}`;
			return `${k}:${v}`;
		})
		.join(';');

// Adds variables to an inline script.
export function defineScriptVars(vars: Record<any, any>) {
	let output = '';
	for (const [key, value] of Object.entries(vars)) {
		// Use const instead of let as let global unsupported with Safari
		// https://stackoverflow.com/questions/29194024/cant-use-let-keyword-in-safari-javascript
		output += `const ${toIdent(key)} = ${JSON.stringify(value)?.replace(
			/<\/script>/g,
			'\\x3C/script>'
		)};\n`;
	}
	return markHTMLString(output);
}

export function formatList(values: string[]): string {
	if (values.length === 1) {
		return values[0];
	}
	return `${values.slice(0, -1).join(', ')} or ${values[values.length - 1]}`;
}

// A helper used to turn expressions into attribute key/value
export function addAttribute(value: any, key: string, shouldEscape = true) {
	if (value == null) {
		return '';
	}

	if (value === false) {
		if (htmlEnumAttributes.test(key) || svgEnumAttributes.test(key)) {
			return markHTMLString(` ${key}="false"`);
		}
		return '';
	}

	// compiler directives cannot be applied dynamically, log a warning and ignore.
	if (STATIC_DIRECTIVES.has(key)) {
		// eslint-disable-next-line no-console
		console.warn(`[astro] The "${key}" directive cannot be applied dynamically at runtime. It will not be rendered as an attribute.

Make sure to use the static attribute syntax (\`${key}={value}\`) instead of the dynamic spread syntax (\`{...{ "${key}": value }}\`).`);
		return '';
	}

	// support "class" from an expression passed into an element (#782)
	if (key === 'class:list') {
		const listValue = toAttributeString(serializeListValue(value), shouldEscape);
		if (listValue === '') {
			return '';
		}
		return markHTMLString(` ${key.slice(0, -5)}="${listValue}"`);
	}

	// support object styles for better JSX compat
	if (key === 'style' && !(value instanceof HTMLString)) {
		if (Array.isArray(value) && value.length === 2) {
			return markHTMLString(
				` ${key}="${toAttributeString(`${toStyleString(value[0])};${value[1]}`, shouldEscape)}"`
			);
		}
		if (typeof value === 'object') {
			return markHTMLString(` ${key}="${toAttributeString(toStyleString(value), shouldEscape)}"`);
		}
	}

	// support `className` for better JSX compat
	if (key === 'className') {
		return markHTMLString(` class="${toAttributeString(value, shouldEscape)}"`);
	}

	// Boolean values only need the key
	if (value === true && (key.startsWith('data-') || htmlBooleanAttributes.test(key))) {
		return markHTMLString(` ${key}`);
	} else {
		return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
	}
}

// Adds support for `<Component {...value} />
export function internalSpreadAttributes(values: Record<any, any>, shouldEscape = true) {
	let output = '';
	for (const [key, value] of Object.entries(values)) {
		output += addAttribute(value, key, shouldEscape);
	}
	return markHTMLString(output);
}

export function renderElement(
	name: string,
	{ props: _props, children = '' }: SSRElement,
	shouldEscape = true
) {
	// Do not print `hoist`, `lang`, `is:global`
	const { lang: _, 'data-astro-id': astroId, 'define:vars': defineVars, ...props } = _props;
	if (defineVars) {
		if (name === 'style') {
			delete props['is:global'];
			delete props['is:scoped'];
		}
		if (name === 'script') {
			delete props.hoist;
			children = defineScriptVars(defineVars) + '\n' + children;
		}
	}
	if ((children == null || children == '') && voidElementNames.test(name)) {
		return `<${name}${internalSpreadAttributes(props, shouldEscape)} />`;
	}
	return `<${name}${internalSpreadAttributes(props, shouldEscape)}>${children}</${name}>`;
}

const iteratorQueue: EagerAsyncIterableIterator[][] = [];

/**
 * Takes an array of iterators and adds them to a list of iterators to start buffering
 * as soon as the execution flow is suspended for the first time. We expect a lot
 * of calls to this function before the first suspension, so to reduce the number
 * of calls to setTimeout we batch the buffering calls.
 * @param iterators
 */
function queueIteratorBuffers(iterators: EagerAsyncIterableIterator[]) {
	if (iteratorQueue.length === 0) {
		setTimeout(() => {
			// buffer all iterators that haven't started yet
			iteratorQueue.forEach((its) => its.forEach((it) => !it.isStarted() && it.buffer()));
			iteratorQueue.length = 0; // fastest way to empty an array
		});
	}
	iteratorQueue.push(iterators);
}

/**
 * This will take an array of async iterables and start buffering them eagerly.
 * To avoid useless buffering, it will only start buffering the next tick, so the
 * first sync iterables won't be buffered.
 */
export function bufferIterators<T>(iterators: AsyncIterable<T>[]): AsyncIterable<T>[] {
	// all async iterators start running in non-buffered mode to avoid useless caching
	const eagerIterators = iterators.map((it) => new EagerAsyncIterableIterator(it));
	// once the execution of the next for loop is suspended due to an async component,
	// this timeout triggers and we start buffering the other iterators
	queueIteratorBuffers(eagerIterators);
	return eagerIterators;
}

// This wrapper around an AsyncIterable can eagerly consume its values, so that
// its values are ready to yield out ASAP. This is used for list-like usage of
// Astro components, so that we don't have to wait on earlier components to run
// to even start running those down in the list.
export class EagerAsyncIterableIterator {
	#iterable: AsyncIterable<any>;
	#queue = new Queue<IteratorResult<any, any>>();
	#error: any = undefined;
	#next: Promise<IteratorResult<any, any>> | undefined;
	/**
	 * Whether the proxy is running in buffering or pass-through mode
	 */
	#isBuffering = false;
	#gen: AsyncIterator<any> | undefined = undefined;
	#isStarted = false;

	constructor(iterable: AsyncIterable<any>) {
		this.#iterable = iterable;
	}

	/**
	 * Starts to eagerly fetch the inner iterator and cache the results.
	 * Note: This might not be called after next() has been called once, e.g. the iterator is started
	 */
	async buffer() {
		if (this.#gen) {
			// If this called as part of rendering, please open a bug report.
			// Any call to buffer() should verify that the iterator isn't running
			throw new Error('Cannot not switch from non-buffer to buffer mode');
		}
		this.#isBuffering = true;
		this.#isStarted = true;
		this.#gen = this.#iterable[Symbol.asyncIterator]();
		let value: IteratorResult<any, any> | undefined = undefined;
		do {
			this.#next = this.#gen.next();
			try {
				value = await this.#next;
				this.#queue.push(value);
			} catch (e) {
				this.#error = e;
			}
		} while (value && !value.done);
	}

	async next() {
		if (this.#error) {
			throw this.#error;
		}
		// for non-buffered mode, just pass through the next result
		if (!this.#isBuffering) {
			if (!this.#gen) {
				this.#isStarted = true;
				this.#gen = this.#iterable[Symbol.asyncIterator]();
			}
			return await this.#gen.next();
		}
		if (!this.#queue.isEmpty()) {
			return this.#queue.shift()!;
		}
		await this.#next;
		// the previous statement will either put an element in the queue or throw,
		// so we can safely assume we have something now
		return this.#queue.shift()!;
	}

	isStarted() {
		return this.#isStarted;
	}

	[Symbol.asyncIterator]() {
		return this;
	}
}

interface QueueItem<T> {
	item: T;
	next?: QueueItem<T>;
}

/**
 * Basis Queue implementation with a linked list
 */
class Queue<T> {
	head: QueueItem<T> | undefined = undefined;
	tail: QueueItem<T> | undefined = undefined;

	push(item: T) {
		if (this.head === undefined) {
			this.head = { item };
			this.tail = this.head;
		} else {
			this.tail!.next = { item };
			this.tail = this.tail!.next;
		}
	}

	isEmpty() {
		return this.head === undefined;
	}

	shift(): T | undefined {
		const val = this.head?.item;
		this.head = this.head?.next;
		return val;
	}
}
