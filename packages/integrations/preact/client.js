import { h, render } from 'preact';
import StaticHtml from './static-html.js';

export default (element) => (Component, props, { default: children, ...slotted }) => {
	if (!element.hasAttribute('ssr')) return;
	const slots = {};
	for (const [key, value] of Object.entries(slotted)) {
		slots[key] = h(StaticHtml, { value, name: key });
	}
	render(
		h(Component, { ...props, slots }, children != null ? h(StaticHtml, { value: children }) : children),
		element
	);
};
