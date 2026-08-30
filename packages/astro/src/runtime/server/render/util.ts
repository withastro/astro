import { clsx } from 'clsx';
import type { SSRElement } from '../../../types/public/internal.js';
import { HTMLString, markHTMLString, stringifyForScript } from '../escape.js';
import { isPromise } from '../util.js';
import type { RenderDestination, RenderDestinationChunk, RenderFunction } from './common.js';

export const voidElementNames =
	/^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;
const htmlBooleanAttributes =
	/^(?:allowfullscreen|async|autofocus|autoplay|checked|controls|default|defer|disabled|disablepictureinpicture|disableremoteplayback|formnovalidate|inert|loop|muted|nomodule|novalidate|open|playsinline|readonly|required|reversed|scoped|seamless|selected|itemscope)$/i;

const AMPERSAND_REGEX = /&/g;
const DOUBLE_QUOTE_REGEX = /"/g;

const STATIC_DIRECTIVES = new Set(['set:html', 'set:text']);

// Per the HTML spec, attribute names must not contain ASCII whitespace, ", ', >, /, or =.
export const INVALID_ATTR_NAME_CHAR = /[\s"'>/=]/;

// converts (most) arbitrary strings to valid JS identifiers
const toIdent = (k: string) =>
	k.trim().replace(/(?!^)\b\w|\s+|\W+/g, (match, index) => {
		if (/\W/.test(match)) return '';
		return index === 0 ? match : match.toUpperCase();
	});

export const toAttributeString = (value: any, shouldEscape = true) => {
	if (!shouldEscape) return value;
	const str = String(value);
	if (str.indexOf('&') === -1 && str.indexOf('"') === -1) return str;
	return str.replace(AMPERSAND_REGEX, '&amp;').replace(DOUBLE_QUOTE_REGEX, '&quot;');
};

const kebab = (k: string) =>
	k.toLowerCase() === k ? k : k.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);

export const toStyleString = (obj: Record<string, any>) => {
	let output = '';
	for (const key of Object.keys(obj)) {
		const value = obj[key];
		if (!((typeof value === 'string' && value.trim()) || typeof value === 'number')) continue;
		if (output) output += ';';
		output += key[0] !== '-' && key[1] !== '-' ? `${kebab(key)}:${value}` : `${key}:${value}`;
	}
	return output;
};

// Adds variables to an inline script.
export function defineScriptVars(vars: Record<any, any>) {
	let output = '';
	for (const [key, value] of Object.entries(vars)) {
		// Use const instead of let as let global unsupported with Safari
		// https://stackoverflow.com/questions/29194024/cant-use-let-keyword-in-safari-javascript
		output += `const ${toIdent(key)} = ${stringifyForScript(value)};\n`;
	}
	return markHTMLString(output);
}

export function formatList(values: string[]): string {
	if (values.length === 1) {
		return values[0];
	}
	return `${values.slice(0, -1).join(', ')} or ${values[values.length - 1]}`;
}

function isCustomElement(tagName: string) {
	return tagName.includes('-');
}

function handleBooleanAttribute(
	key: string,
	value: any,
	shouldEscape: boolean,
	tagName?: string,
): string {
	// The Popover API only accepts "auto", "manual", or the attribute being absent.
	// There's no valid string value for "off", so it must always be rendered as a
	// boolean attribute, even on custom elements.
	if (key === 'popover') {
		return markHTMLString(value ? ` ${key}` : '');
	}
	// For custom elements, always render as string attributes
	if (tagName && isCustomElement(tagName)) {
		return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
	}
	// For regular HTML elements, use boolean attribute logic
	return markHTMLString(value ? ` ${key}` : '');
}

const ATTRIBUTE_ORDINARY = 0;
const ATTRIBUTE_INVALID_NAME = 1;
const ATTRIBUTE_STATIC_DIRECTIVE = 2;
const ATTRIBUTE_CLASS_LIST = 3;
const ATTRIBUTE_STYLE = 4;
const ATTRIBUTE_CLASS_NAME = 5;
const ATTRIBUTE_BOOLEAN = 6;
// `popover`, `download` and `hidden` accept strings too, so they are only boolean when the value is.
const ATTRIBUTE_BOOLEAN_IF_BOOLEAN = 7;

const attributeKinds = new Map<string, number>();

function classifyAttribute(key: string): number {
	if (INVALID_ATTR_NAME_CHAR.test(key)) return ATTRIBUTE_INVALID_NAME;
	if (STATIC_DIRECTIVES.has(key)) return ATTRIBUTE_STATIC_DIRECTIVE;
	if (key === 'class:list') return ATTRIBUTE_CLASS_LIST;
	if (key === 'style') return ATTRIBUTE_STYLE;
	if (key === 'className') return ATTRIBUTE_CLASS_NAME;
	if (htmlBooleanAttributes.test(key)) return ATTRIBUTE_BOOLEAN;
	if (key === 'popover' || key === 'download' || key === 'hidden') {
		return ATTRIBUTE_BOOLEAN_IF_BOOLEAN;
	}
	return ATTRIBUTE_ORDINARY;
}

function attributeKind(key: string): number {
	let kind = attributeKinds.get(key);
	if (kind === undefined) {
		kind = classifyAttribute(key);
		// Spreads can carry attribute names from user data, so the cache is capped.
		if (attributeKinds.size < 1024) attributeKinds.set(key, kind);
	}
	return kind;
}

// A helper used to turn expressions into attribute key/value
// In the compiler, addAttribute is only printed to process attributes of elements
// that may contain dynamic values. We don't need to pass tagName to addAttribute
// on the compiler side because it is used only for custom elements
export function addAttribute(value: any, key: string, shouldEscape = true, tagName = '') {
	if (value == null) {
		return '';
	}

	switch (attributeKind(key)) {
		// Attribute names with characters that could break out of the attribute context.
		case ATTRIBUTE_INVALID_NAME:
			return '';

		// compiler directives cannot be applied dynamically, log a warning and ignore.
		case ATTRIBUTE_STATIC_DIRECTIVE:
			console.warn(`[astro] The "${key}" directive cannot be applied dynamically at runtime. It will not be rendered as an attribute.

Make sure to use the static attribute syntax (\`${key}={value}\`) instead of the dynamic spread syntax (\`{...{ "${key}": value }}\`).`);
			return '';

		// support "class" from an expression passed into an element (#782)
		case ATTRIBUTE_CLASS_LIST: {
			const listValue = toAttributeString(clsx(value), shouldEscape);
			if (listValue === '') {
				return '';
			}
			return markHTMLString(` class="${listValue}"`);
		}

		// support object styles for better JSX compat
		case ATTRIBUTE_STYLE:
			if (!(value instanceof HTMLString)) {
				if (Array.isArray(value) && value.length === 2) {
					return markHTMLString(
						` style="${toAttributeString(`${toStyleString(value[0])};${value[1]}`, shouldEscape)}"`,
					);
				}
				if (typeof value === 'object') {
					return markHTMLString(` style="${toAttributeString(toStyleString(value), shouldEscape)}"`);
				}
			}
			break;

		// support `className` for better JSX compat
		case ATTRIBUTE_CLASS_NAME:
			return markHTMLString(` class="${toAttributeString(value, shouldEscape)}"`);

		// Boolean values only need the key
		case ATTRIBUTE_BOOLEAN:
			return handleBooleanAttribute(key, value, shouldEscape, tagName);

		case ATTRIBUTE_BOOLEAN_IF_BOOLEAN:
			if (typeof value === 'boolean') {
				return handleBooleanAttribute(key, value, shouldEscape, tagName);
			}
			break;
	}

	// Other attributes with an empty string value can omit rendering the value
	if (value === '') {
		return markHTMLString(` ${key}`);
	}

	return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
}

export function spreadElementAttributes(values: Record<string, any>): string {
	let output = '';
	const keys = Object.keys(values);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		if (key === 'children') continue;
		output += addAttribute(values[key], key, true);
	}
	return output;
}

// Adds support for `<Component {...value} />
export function internalSpreadAttributes(
	values: Record<any, any>,
	shouldEscape = true,
	tagName: string,
) {
	let output = '';
	const keys = Object.keys(values);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		output += addAttribute(values[key], key, shouldEscape, tagName);
	}
	return markHTMLString(output);
}

export function renderElement(
	name: string,
	{ props: _props, children = '' }: SSRElement,
	shouldEscape = true,
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
	if ((children == null || children === '') && voidElementNames.test(name)) {
		return `<${name}${internalSpreadAttributes(props, shouldEscape, name)}>`;
	}
	return `<${name}${internalSpreadAttributes(props, shouldEscape, name)}>${children}</${name}>`;
}

const noop = () => {};

/**
 * Renders into a buffer until `flush` is called (which
 * flushes the buffer)
 */
class BufferedRenderer implements RenderDestination, RendererFlusher {
	private chunks: RenderDestinationChunk[] = [];
	private renderPromise: Promise<void> | void;
	private destination: RenderDestination;

	/**
	 * Determines whether buffer has been flushed
	 * to the final destination.
	 */
	private flushed = false;

	public constructor(destination: RenderDestination, renderFunction: RenderFunction) {
		this.destination = destination;
		this.renderPromise = renderFunction(this);

		if (isPromise(this.renderPromise)) {
			// Catch here in case it throws before `flush` is called,
			// to prevent an unhandled rejection.
			Promise.resolve(this.renderPromise).catch(noop);
		}
	}

	public write(chunk: RenderDestinationChunk): void {
		// Before the buffer has been flushed, we want to
		// append to the buffer, afterwards we'll write
		// to the underlying destination if subsequent
		// writes arrive.

		if (this.flushed) {
			this.destination.write(chunk);
		} else {
			this.chunks.push(chunk);
		}
	}

	public flush(): void | Promise<void> {
		if (this.flushed) {
			throw new Error('The render buffer has already been flushed.');
		}

		this.flushed = true;

		// Write the buffered chunks to the real destination
		for (const chunk of this.chunks) {
			this.destination.write(chunk);
		}

		// NOTE: We don't empty `this.chunks` after it's written as benchmarks show
		// that it causes poorer performance, likely due to forced memory re-allocation,
		// instead of letting the garbage collector handle it automatically.
		// (Unsure how this affects on limited memory machines)

		return this.renderPromise;
	}
}

/**
 * Executes the `bufferRenderFunction` to prerender it into a buffer destination, and return a promise
 * with an object containing the `flush` function to flush the buffer to the final
 * destination.
 *
 * @example
 * ```ts
 * // Render components in parallel ahead of time
 * const finalRenders = [ComponentA, ComponentB].map((comp) => {
 *   return createBufferedRenderer(finalDestination, async (bufferDestination) => {
 *     await renderComponentToDestination(bufferDestination);
 *   });
 * });
 * // Render array of components serially
 * for (const finalRender of finalRenders) {
 *   await finalRender.flush();
 * }
 * ```
 */
export function createBufferedRenderer(
	destination: RenderDestination,
	renderFunction: RenderFunction,
): RendererFlusher {
	return new BufferedRenderer(destination, renderFunction);
}

export interface RendererFlusher {
	/**
	 * Flushes the current renderer to the underlying renderer.
	 *
	 * See example of `createBufferedRenderer` for usage.
	 */
	flush(): void | Promise<void>;
}

export const isNode =
	typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]';
// @ts-expect-error: Deno is not part of the types.
export const isDeno = typeof Deno !== 'undefined';

// We can get rid of this when Promise.withResolvers() is ready
export type PromiseWithResolvers<T> = {
	promise: Promise<T>;
	resolve: (value: T) => void;
	reject: (reason?: any) => void;
};

// This is an implementation of Promise.withResolvers(), which we can't yet rely on.
// We can remove this once the native function is available in Node.js
export function promiseWithResolvers<T = any>(): PromiseWithResolvers<T> {
	let resolve: any, reject: any;
	const promise = new Promise<T>((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	});
	return {
		promise,
		resolve,
		reject,
	};
}
