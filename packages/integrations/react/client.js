import StaticHtml from './static-html.js';
import { createElement } from 'react';
import { hydrateRoot } from 'react-dom/client';

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
