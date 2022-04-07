import StaticHtml from './static-html.js';
import { createElement } from 'react';
import { hydrate } from 'react-dom';

export default (element) => (Component, props, children) =>
	hydrate(
		createElement(
			Component,
			{ ...props, suppressHydrationWarning: true },
			children != null
				? createElement(StaticHtml, { value: children, suppressHydrationWarning: true })
				: children
		),
		element
	);
