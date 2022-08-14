import { createElement, startTransition } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import StaticHtml from './static-html.js';

/**requestIdleCallback pollyfill https://developer.chrome.com/blog/using-requestidlecallback/#checking-for-requestidlecallback */
window?.requestIdleCallback = window?.requestIdleCallback || function (cb) {
	var start = Date.now();
	return setTimeout(function () {
		cb({
			didTimeout: false,
			timeRemaining: function () {
				return Math.max(0, 50 - (Date.now() - start));
			}
		});
	}, 1);
}

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
		for (const [key, value] of Object.entries(slotted)) {
			props[key] = createElement(StaticHtml, { value, name: key });
		}
		const componentEl = createElement(
			Component,
			props,
			children != null ? createElement(StaticHtml, { value: children }) : children
		);
		const rootKey = isAlreadyHydrated(element);
		// HACK: delete internal react marker for nested components to suppress agressive warnings
		if (rootKey) {
			delete element[rootKey];
		}
		if (client === 'only') {
			return startTransition(() => {
				createRoot(element).render(componentEl);
			})
		}
		return window?.requestIdleCallback(() => {
			startTransition(() => {
				hydrateRoot(element, componentEl);
			})
		})
	};
