import { h, render } from 'preact';
import StaticHtml from './static-html.js';

export default (element) => (Component, props, { default: children, ...slotted }) => {
	if (!element.hasAttribute('ssr')) return;
	for (const [key, value] of Object.entries(slotted)) {
		props[key] = h(StaticHtml, { value, name: key });
	}
	render(
		h(Component, props, children != null ? h(StaticHtml, { value: children }) : children),
		element
	);
};
