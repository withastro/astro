import { renderToString, ssr, createComponent } from 'solid-js/web';

const slotName = str => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());

function check(Component, props, children) {
	if (typeof Component !== 'function') return false;
	const { html } = renderToStaticMarkup(Component, props, children);
	return typeof html === 'string';
}

function renderToStaticMarkup(Component, props, { default: children, ...slotted }) {
	const slots = {};
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName(key);
		slots[name] = ssr(`<astro-slot name="${name}">${value}</astro-slot>`);
	}
	// Note: create newProps to avoid mutating `props` before they are serialized
	const newProps = { 
		...props,
		...slots,
		// In Solid SSR mode, `ssr` creates the expected structure for `children`.
		children: children != null ? ssr(`<astro-slot>${children}</astro-slot>`) : children,
	}
	const html = renderToString(() => createComponent(Component, newProps));
	return { html }
}

export default {
	check,
	renderToStaticMarkup,
};
