import { createElement } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import StaticHtml from './static-html.js';

function isAlreadyHydrated(element) {
	for (const key in element) {
		if (key.startsWith('__reactContainer')) {
			return key;
		}
	}
}

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
		const rootKey = isAlreadyHydrated(element);
		// HACK: delete internal react marker for nested components to suppress agressive warnings
		if (rootKey) {
			delete element[rootKey];
		}
		return hydrateRoot(element, componentEl);
	};
