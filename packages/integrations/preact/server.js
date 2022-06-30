import { h, Component as BaseComponent } from 'preact';
import render from 'preact-render-to-string';
import StaticHtml from './static-html.js';

const slotName = (str) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());

let originalConsoleError;
let consoleFilterRefs = 0;

function check(Component, props, children) {
	if (typeof Component !== 'function') return false;

	if (Component.prototype != null && typeof Component.prototype.render === 'function') {
		return BaseComponent.isPrototypeOf(Component);
	}

	useConsoleFilter();

	try {
		try {
			const { html } = renderToStaticMarkup(Component, props, children);
			if (typeof html !== 'string') {
				return false;
			}

			// There are edge cases (SolidJS) where Preact *might* render a string,
			// but components would be <undefined></undefined>

			return !/\<undefined\>/.test(html);
		} catch (err) {
			return false;
		}
	} finally {
		finishUsingConsoleFilter();
	}
}

function renderToStaticMarkup(Component, props, { default: children, ...slotted }) {
	const slots = {};
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName(key);
		slots[name] = h(StaticHtml, { value, name });
	}
	// Note: create newProps to avoid mutating `props` before they are serialized
	const newProps = { ...props, ...slots };
	const html = render(
		h(Component, newProps, children != null ? h(StaticHtml, { value: children }) : children)
	);
	return { html };
}

/**
 * Reduces console noise by filtering known non-problematic errors.
 * 
 * Performs reference counting to allow parallel usage from async code.
 * 
 * To stop filtering, please ensure that there always is a matching call
 * to `finishUsingConsoleFilter` afterwards.
 */
function useConsoleFilter() {
	consoleFilterRefs++;

	if (!originalConsoleError) {
		// eslint-disable-next-line no-console
		originalConsoleError = console.error;

		try {
			// eslint-disable-next-line no-console
			console.error = filteredConsoleError;
		} catch (error) {
			// If we're unable to hook `console.error`, just accept it
		}
	}
}

/**
 * Indicates that the filter installed by `useConsoleFilter`
 * is no longer needed by the calling code.
 */
function finishUsingConsoleFilter() {
	consoleFilterRefs--;

	// Note: Instead of reverting `console.error` back to the original
	// when the reference counter reaches 0, we leave our hook installed
	// to prevent potential race conditions once `check` is made async
}

/**
 * Hook/wrapper function for the global `console.error` function.
 * 
 * Ignores known non-problematic errors while any code is using the console filter.
 * Otherwise, simply forwards all arguments to the original function.
 */
function filteredConsoleError(msg, ...rest) {
	if (consoleFilterRefs > 0 && typeof msg === 'string') {
		// In `check`, we attempt to render JSX components through Preact.
		// When attempting this on a React component, React may output
		// the following error, which we can safely filter out:
		const isKnownReactHookError =
			msg.includes('Warning: Invalid hook call.') &&
			msg.includes('https://reactjs.org/link/invalid-hook-call');
		if (isKnownReactHookError)
			return;
	}
	originalConsoleError(msg, ...rest);
}

export default {
	check,
	renderToStaticMarkup,
};
