// Separate import from the rest so it doesn't get re-organized after other imports
import './server-shim.js';

import { LitElementRenderer } from '@lit-labs/ssr/lib/lit-element-renderer.js';
import * as parse5 from 'parse5';

function isCustomElementTag(name) {
	return typeof name === 'string' && name.includes('-');
}

function getCustomElementConstructor(name) {
	if (typeof customElements !== 'undefined' && isCustomElementTag(name)) {
		return customElements.get(name) || null;
	} else if (typeof name === 'function') {
		return name;
	}
	return null;
}

async function isLitElement(Component) {
	const Ctr = getCustomElementConstructor(Component);
	return !!Ctr?._$litElement$;
}

async function check(Component) {
	// Lit doesn't support getting a tagName from a Constructor at this time.
	// So this must be a string at the moment.
	return !!(await isLitElement(Component));
}

function* render(Component, attrs, slots) {
	let tagName = Component;
	if (typeof tagName !== 'string') {
		tagName = Component[Symbol.for('tagName')];
	}
	const instance = new LitElementRenderer(tagName);

	// LitElementRenderer creates a new element instance, so copy over.
	const Ctr = getCustomElementConstructor(tagName);
	let shouldDeferHydration = false;

	if (attrs) {
		for (let [name, value] of Object.entries(attrs)) {
			const isReactiveProperty = name in Ctr.prototype;
			const isReflectedReactiveProperty = Ctr.elementProperties.get(name)?.reflect;

			// Only defer hydration if we are setting a reactive property that cannot
			// be reflected / serialized as a property.
			shouldDeferHydration ||= isReactiveProperty && !isReflectedReactiveProperty;

			if (isReactiveProperty) {
				instance.setProperty(name, value);
			} else {
				instance.setAttribute(name, value);
			}
		}
	}

	instance.connectedCallback();

	yield `<${tagName}${shouldDeferHydration ? ' defer-hydration' : ''}`;
	yield* instance.renderAttributes();
	yield `>`;
	const shadowContents = instance.renderShadow({
		elementRenderers: [LitElementRenderer],
		customElementInstanceStack: [instance],
		customElementHostStack: [instance],
		deferHydration: false,
	});
	if (shadowContents !== undefined) {
		const { mode = 'open', delegatesFocus } = instance.shadowRootOptions ?? {};
		// `delegatesFocus` is intentionally allowed to coerce to boolean to
		// match web platform behavior.
		const delegatesfocusAttr = delegatesFocus ? ' shadowrootdelegatesfocus' : '';
		yield `<template shadowroot="${mode}" shadowrootmode="${mode}"${delegatesfocusAttr}>`;
		yield* shadowContents;
		yield '</template>';
	}
	if (slots) {
		for (let [slot, value = ''] of Object.entries(slots)) {
			if (slot !== 'default' && value) {
				// Parse the value as a concatenated string
				const fragment = parse5.parseFragment(`${value}`);

				// Add the missing slot attribute to child Element nodes
				for (const node of fragment.childNodes) {
					if (node.tagName && !node.attrs.some(({ name }) => name === 'slot')) {
						node.attrs.push({ name: 'slot', value: slot });
					}
				}

				value = parse5.serialize(fragment);
			}

			yield value;
		}
	}
	yield `</${tagName}>`;
}

async function renderToStaticMarkup(Component, props, slots) {
	let tagName = Component;

	let out = '';
	for (let chunk of render(tagName, props, slots)) {
		out += chunk;
	}

	return {
		html: out,
	};
}

export default {
	name: '@astrojs/lit',
	check,
	renderToStaticMarkup,
};
