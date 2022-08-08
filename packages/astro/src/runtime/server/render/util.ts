import type { SSRElement } from '../../../@types/astro';

import { markHTMLString, HTMLString } from '../escape.js';
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
	k.trim().replace(/(?:(?<!^)\b\w|\s+|[^\w]+)/g, (match, index) => {
		if (/[^\w]|\s/.test(match)) return '';
		return index === 0 ? match : match.toUpperCase();
	});

export const toAttributeString = (value: any, shouldEscape = true) =>
	shouldEscape ? String(value).replace(/&/g, '&#38;').replace(/"/g, '&#34;') : value;

const kebab = (k: string) =>
	k.toLowerCase() === k ? k : k.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
const toStyleString = (obj: Record<string, any>) =>
	Object.entries(obj)
		.map(([k, v]) => `${kebab(k)}:${v}`)
		.join(';');

// Adds variables to an inline script.
export function defineScriptVars(vars: Record<any, any>) {
	let output = '';
	for (const [key, value] of Object.entries(vars)) {
		output += `let ${toIdent(key)} = ${JSON.stringify(value)};\n`;
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
		const listValue = toAttributeString(serializeListValue(value));
		if (listValue === '') {
			return '';
		}
		return markHTMLString(` ${key.slice(0, -5)}="${listValue}"`);
	}

	// support object styles for better JSX compat
	if (key === 'style' && !(value instanceof HTMLString) && typeof value === 'object') {
		return markHTMLString(` ${key}="${toStyleString(value)}"`);
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
