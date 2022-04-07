import { createElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import StaticHtml from './static-html.js';

export default (element) => (Component, props, children) =>
	hydrateRoot(
		element,
		createElement(
			Component,
			{ ...props, suppressHydrationWarning: true },
			children != null
				? createElement(StaticHtml, { value: children, suppressHydrationWarning: true })
				: children
		)
	);
