import { createElement } from 'react';
import { version } from 'react-dom/package.json';
import StaticHtml from './static-html.js';

const usingReact18 = version.startsWith('18.');

// Import the correct hydration method based on the version of React.
const hydrateFn = (
	async () => usingReact18
		? (await import('react-dom/client.js')).hydrateRoot
		: (await import('react-dom')).hydrate
)();

export default (element) => async (Component, props, children) => {
	const args = [
		createElement(
			Component,
			{ ...props, suppressHydrationWarning: true },
			children != null ? createElement(StaticHtml, { value: children, suppressHydrationWarning: true }) : children
		),
		element,
	];
	
	// `hydrateRoot` expects [container, component] instead of [component, container].
	if (usingReact18) args.reverse();
	
	return (await hydrateFn)(...args);
};
