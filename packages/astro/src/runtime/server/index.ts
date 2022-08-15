export { createAstro } from './astro-global.js';
export { renderEndpoint } from './endpoint.js';
export {
	escapeHTML,
	HTMLString,
	markHTMLString,
	markHTMLString as unescapeHTML,
} from './escape.js';
export type { Metadata } from './metadata';
export { createMetadata } from './metadata.js';
export {
	addAttribute,
	defineScriptVars,
	Fragment,
	maybeRenderHead,
	renderAstroComponent,
	renderComponent,
	Renderer as Renderer,
	renderHead,
	renderHTMLElement,
	renderPage,
	renderSlot,
	renderTemplate as render,
	renderTemplate,
	renderToString,
	stringifyChunk,
	voidElementNames,
} from './render/index.js';
export type { AstroComponentFactory } from './render/index.js';
import type { AstroComponentFactory } from './render/index.js';

import { markHTMLString } from './escape.js';
import { Renderer } from './render/index.js';

import { addAttribute } from './render/index.js';

// Used in creating the component. aka the main export.
export function createComponent(cb: AstroComponentFactory) {
	// Add a flag to this callback to mark it as an Astro component
	// INVESTIGATE does this need to cast
	(cb as any).isAstroComponentFactory = true;
	return cb;
}

export function mergeSlots(...slotted: unknown[]) {
	const slots: Record<string, () => any> = {};
	for (const slot of slotted) {
		if (!slot) continue;
		if (typeof slot === 'object') {
			Object.assign(slots, slot);
		} else if (typeof slot === 'function') {
			Object.assign(slots, mergeSlots(slot()));
		}
	}
	return slots;
}

/** @internal Assosciate JSX components with a specific renderer (see /src/vite-plugin-jsx/tag.ts) */
export function __astro_tag_component__(Component: unknown, rendererName: string) {
	if (!Component) return;
	if (typeof Component !== 'function') return;
	Object.defineProperty(Component, Renderer, {
		value: rendererName,
		enumerable: false,
		writable: false,
	});
}

// Adds support for `<Component {...value} />
export function spreadAttributes(
	values: Record<any, any>,
	_name?: string,
	{ class: scopedClassName }: { class?: string } = {}
) {
	let output = '';
	// If the compiler passes along a scoped class, merge with existing props or inject it
	if (scopedClassName) {
		if (typeof values.class !== 'undefined') {
			values.class += ` ${scopedClassName}`;
		} else if (typeof values['class:list'] !== 'undefined') {
			values['class:list'] = [values['class:list'], scopedClassName];
		} else {
			values.class = scopedClassName;
		}
	}
	for (const [key, value] of Object.entries(values)) {
		output += addAttribute(value, key, true);
	}
	return markHTMLString(output);
}

// Adds CSS variables to an inline style tag
export function defineStyleVars(defs: Record<any, any> | Record<any, any>[]) {
	let output = '';
	let arr = !Array.isArray(defs) ? [defs] : defs;
	for (const vars of arr) {
		for (const [key, value] of Object.entries(vars)) {
			if (value || value === 0) {
				output += `--${key}: ${value};`;
			}
		}
	}
	return markHTMLString(output);
}
