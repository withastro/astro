import { createElement, startTransition } from 'react';
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
	(Component, props, { default: children, ...slotted }, { client }) => {
		if (!element.hasAttribute('ssr')) return;
		const renderOptions = {
			identifierPrefix: element.getAttribute('prefix'),
		};
		for (const [key, value] of Object.entries(slotted)) {
			props[key] = createElement(StaticHtml, { value, name: key });
		}
		const componentEl = createElement(
			Component,
			props,
			children != null ? createElement(StaticHtml, { value: children }) : children
		);
		const rootKey = isAlreadyHydrated(element);
		// HACK: delete internal react marker for nested components to suppress aggressive warnings
		if (rootKey) {
			delete element[rootKey];
		}
		if (client === 'only') {
			return startTransition(() => {
				const root = createRoot(element);
				root.render(componentEl);
				element.addEventListener('astro:unmount', () => root.unmount(), { once: true });
			});
		}
		startTransition(() => {
			const root = hydrateRoot(element, componentEl, renderOptions);
			root.render(componentEl);
			element.addEventListener('astro:unmount', () => root.unmount(), { once: true });
		});
	};
