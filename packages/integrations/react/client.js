import { createElement } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import StaticHtml from './static-html.js';

export default (element) =>
	(Component, props, children, { client }) => {
		const componentEl = createElement(
			Component,
			props,
			children != null ? createElement(StaticHtml, { value: children }) : children
		);
		if (client === 'only') {
			return createRoot(element).render(componentEl);
		}
		return hydrateRoot(element, componentEl);
	};
