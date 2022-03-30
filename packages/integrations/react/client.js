import { createElement } from 'react';
import StaticHtml from './static-html.js';

const usingReact18 = process.env.REACT_HYDRATION_ENTRYPOINT === 'react-dom/client';

// Import the correct hydration method based on the version of React.
const hydrateFn = (async () => {
	const mod = await import(process.env.REACT_HYDRATION_ENTRYPOINT);
	return mod[usingReact18 ? 'hydrateRoot' : 'hydrate'];
})();

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
