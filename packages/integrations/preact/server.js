import { h, Component as BaseComponent } from 'preact';
import render from 'preact-render-to-string';
import StaticHtml from './static-html.js';

const slotName = str => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());

function check(Component, props, children) {
	if (typeof Component !== 'function') return false;

	if (Component.prototype != null && typeof Component.prototype.render === 'function') {
		return BaseComponent.isPrototypeOf(Component);
	}

	try {
		const { html } = renderToStaticMarkup(Component, props, children);
		if (typeof html !== 'string') {
			return false;
		}

		// There are edge cases (SolidJS) where Preact *might* render a string,
		// but components would be <undefined></undefined>

		return !/\<undefined\>/.test(html);
	} catch (err) {
		return false;
	}
}

function renderToStaticMarkup(Component, props, { default: children, ...slotted }) {
	const slots = {};
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName(key);
		slots[name] = h(StaticHtml, { value, name });
	}
	// Note: create newProps to avoid mutating `props` before they are serialized
	const newProps = { ...props, ...slots }
	const html = render(
		h(Component, newProps, children != null ? h(StaticHtml, { value: children }) : children)
	);
	return { html };
}

export default {
	check,
	renderToStaticMarkup,
};
