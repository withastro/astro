import { h } from 'preact';
import { createPortal } from 'preact/compat';
import StaticHtml from './static-html.js';

export default (element) =>
	(Component, props, { default: children, ...slotted }) => {
		if (!element.hasAttribute('ssr')) return;
		const { addChild } = globalThis['@astrojs/preact'];
		while (!!element.firstElementChild) {
			element.firstElementChild.remove();
		}
		for (const [key, value] of Object.entries(slotted)) {
			props[key] = h(StaticHtml, { value, name: key });
		}
		const Portal = createPortal(h(Component, props, children != null ? h(StaticHtml, { value: children }) : children), element)
		addChild(Portal);
	};
