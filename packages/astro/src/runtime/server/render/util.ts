import type { SSRElement } from '../../../@types/astro';
import type { RenderDestination, RenderDestinationChunk, RenderFunction } from './common.js';

import { clsx } from 'clsx';
import { HTMLString, markHTMLString } from '../escape.js';

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
		const listValue = toAttributeString(clsx(value), shouldEscape);
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

/**
 * Executes the `bufferRenderFunction` to prerender it into a buffer destination, and return a promise
 * with an object containing the `renderToFinalDestination` function to flush the buffer to the final
 * destination.
 *
 * @example
 * ```ts
 * // Render components in parallel ahead of time
 * const finalRenders = [ComponentA, ComponentB].map((comp) => {
 *   return renderToBufferDestination(async (bufferDestination) => {
 *     await renderComponentToDestination(bufferDestination);
 *   });
 * });
 * // Render array of components serially
 * for (const finalRender of finalRenders) {
 *   await finalRender.renderToFinalDestination(finalDestination);
 * }
 * ```
 */
export function renderToBufferDestination(bufferRenderFunction: RenderFunction): {
	renderToFinalDestination: RenderFunction;
} {
	// Keep chunks in memory
	const bufferChunks: RenderDestinationChunk[] = [];
	const bufferDestination: RenderDestination = {
		write: (chunk) => bufferChunks.push(chunk),
	};

	// Don't await for the render to finish to not block streaming
	const renderPromise = bufferRenderFunction(bufferDestination);

	// Return a closure that writes the buffered chunk
	return {
		async renderToFinalDestination(destination) {
			// Write the buffered chunks to the real destination
			for (const chunk of bufferChunks) {
				destination.write(chunk);
			}

			// NOTE: We don't empty `bufferChunks` after it's written as benchmarks show
			// that it causes poorer performance, likely due to forced memory re-allocation,
			// instead of letting the garbage collector handle it automatically.
			// (Unsure how this affects on limited memory machines)

			// Re-assign the real destination so `instance.render` will continue and write to the new destination
			bufferDestination.write = (chunk) => destination.write(chunk);

			// Wait for render to finish entirely
			await renderPromise;
		},
	};
}
