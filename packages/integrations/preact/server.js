import { h, Component as BaseComponent } from 'preact';
import render from 'preact-render-to-string';
import StaticHtml from './static-html.js';

const slotName = (str) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());

let originalConsoleError;
let runningChecks = 0;

function check(Component, props, children) {
	if (typeof Component !== 'function') return false;

	if (Component.prototype != null && typeof Component.prototype.render === 'function') {
		return BaseComponent.isPrototypeOf(Component);
	}

	installConsoleErrorFilter();

	runningChecks++;
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
		runningChecks--;
	}
}

/**
 * Attempts to filter `console.error` by passing all calls through
 * the `filteredConsoleError` function.
 */
function installConsoleErrorFilter() {
	// If we already tried to hook `console.error`,
	// there is no need to do it again
	if (originalConsoleError)
		return;
	// eslint-disable-next-line no-console
	originalConsoleError = console.error;

	try {
		// eslint-disable-next-line no-console
		console.error = filteredConsoleError;
	} catch (error) {
		// If we're unable to hook `console.error`, just accept it
	}
}

/**
 * Reduces console noise by filtering known non-problematic errors
 * while any calls to the `check` function are running.
 */
function filteredConsoleError(msg, ...rest) {
	if (runningChecks > 0 && typeof msg === 'string') {
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

export default {
	check,
	renderToStaticMarkup,
};
