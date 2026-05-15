import { clsx } from 'clsx';
import { HTMLString, markHTMLString, stringifyForScript } from '../escape.js';
import { isPromise } from '../util.js';
const voidElementNames =
	/^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;
const htmlBooleanAttributes =
	/^(?:allowfullscreen|async|autofocus|autoplay|checked|controls|default|defer|disabled|disablepictureinpicture|disableremoteplayback|formnovalidate|inert|loop|muted|nomodule|novalidate|open|playsinline|readonly|required|reversed|scoped|seamless|selected|itemscope)$/i;
const AMPERSAND_REGEX = /&/g;
const DOUBLE_QUOTE_REGEX = /"/g;
const STATIC_DIRECTIVES = /* @__PURE__ */ new Set(['set:html', 'set:text']);
const toIdent = (k) =>
	k.trim().replace(/(?!^)\b\w|\s+|\W+/g, (match, index) => {
		if (/\W/.test(match)) return '';
		return index === 0 ? match : match.toUpperCase();
	});
const toAttributeString = (value, shouldEscape = true) =>
	shouldEscape
		? String(value).replace(AMPERSAND_REGEX, '&amp;').replace(DOUBLE_QUOTE_REGEX, '&quot;')
		: value;
const kebab = (k) =>
	k.toLowerCase() === k ? k : k.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
const toStyleString = (obj) =>
	Object.entries(obj)
		.filter(([_, v]) => (typeof v === 'string' && v.trim()) || typeof v === 'number')
		.map(([k, v]) => {
			if (k[0] !== '-' && k[1] !== '-') return `${kebab(k)}:${v}`;
			return `${k}:${v}`;
		})
		.join(';');
function defineScriptVars(vars) {
	let output = '';
	for (const [key, value] of Object.entries(vars)) {
		output += `const ${toIdent(key)} = ${stringifyForScript(value)};
`;
	}
	return markHTMLString(output);
}
function formatList(values) {
	if (values.length === 1) {
		return values[0];
	}
	return `${values.slice(0, -1).join(', ')} or ${values[values.length - 1]}`;
}
function isCustomElement(tagName) {
	return tagName.includes('-');
}
function handleBooleanAttribute(key, value, shouldEscape, tagName) {
	if (tagName && isCustomElement(tagName)) {
		return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
	}
	return markHTMLString(value ? ` ${key}` : '');
}
function addAttribute(value, key, shouldEscape = true, tagName = '') {
	if (value == null) {
		return '';
	}
	if (STATIC_DIRECTIVES.has(key)) {
		console.warn(`[astro] The "${key}" directive cannot be applied dynamically at runtime. It will not be rendered as an attribute.

Make sure to use the static attribute syntax (\`${key}={value}\`) instead of the dynamic spread syntax (\`{...{ "${key}": value }}\`).`);
		return '';
	}
	if (key === 'class:list') {
		const listValue = toAttributeString(clsx(value), shouldEscape);
		if (listValue === '') {
			return '';
		}
		return markHTMLString(` ${key.slice(0, -5)}="${listValue}"`);
	}
	if (key === 'style' && !(value instanceof HTMLString)) {
		if (Array.isArray(value) && value.length === 2) {
			return markHTMLString(
				` ${key}="${toAttributeString(`${toStyleString(value[0])};${value[1]}`, shouldEscape)}"`,
			);
		}
		if (typeof value === 'object') {
			return markHTMLString(` ${key}="${toAttributeString(toStyleString(value), shouldEscape)}"`);
		}
	}
	if (key === 'className') {
		return markHTMLString(` class="${toAttributeString(value, shouldEscape)}"`);
	}
	if (htmlBooleanAttributes.test(key)) {
		return handleBooleanAttribute(key, value, shouldEscape, tagName);
	}
	if (value === '') {
		return markHTMLString(` ${key}`);
	}
	if (key === 'popover' && typeof value === 'boolean') {
		return handleBooleanAttribute(key, value, shouldEscape, tagName);
	}
	if (key === 'download' && typeof value === 'boolean') {
		return handleBooleanAttribute(key, value, shouldEscape, tagName);
	}
	if (key === 'hidden' && typeof value === 'boolean') {
		return handleBooleanAttribute(key, value, shouldEscape, tagName);
	}
	return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
}
function internalSpreadAttributes(values, shouldEscape = true, tagName) {
	let output = '';
	for (const [key, value] of Object.entries(values)) {
		output += addAttribute(value, key, shouldEscape, tagName);
	}
	return markHTMLString(output);
}
function renderElement(name, { props: _props, children = '' }, shouldEscape = true) {
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
class BufferedRenderer {
	chunks = [];
	renderPromise;
	destination;
	/**
	 * Determines whether buffer has been flushed
	 * to the final destination.
	 */
	flushed = false;
	constructor(destination, renderFunction) {
		this.destination = destination;
		this.renderPromise = renderFunction(this);
		if (isPromise(this.renderPromise)) {
			Promise.resolve(this.renderPromise).catch(noop);
		}
	}
	write(chunk) {
		if (this.flushed) {
			this.destination.write(chunk);
		} else {
			this.chunks.push(chunk);
		}
	}
	flush() {
		if (this.flushed) {
			throw new Error('The render buffer has already been flushed.');
		}
		this.flushed = true;
		for (const chunk of this.chunks) {
			this.destination.write(chunk);
		}
		return this.renderPromise;
	}
}
function createBufferedRenderer(destination, renderFunction) {
	return new BufferedRenderer(destination, renderFunction);
}
const isNode =
	typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]';
const isDeno = typeof Deno !== 'undefined';
function promiseWithResolvers() {
	let resolve, reject;
	const promise = new Promise((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	});
	return {
		promise,
		resolve,
		reject,
	};
}
export {
	addAttribute,
	createBufferedRenderer,
	defineScriptVars,
	formatList,
	internalSpreadAttributes,
	isDeno,
	isNode,
	promiseWithResolvers,
	renderElement,
	toAttributeString,
	toStyleString,
	voidElementNames,
};
