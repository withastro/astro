import type { RendererContext, SignalLike } from './types';
import { h, Component as BaseComponent } from 'preact';
import render from 'preact-render-to-string';
import StaticHtml from './static-html.js';
import { getContext, incrementId } from './context.js';

const slotName = (str: string) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());

let originalConsoleError: typeof console.error;
let consoleFilterRefs = 0;

function check(this: RendererContext, Component: any, props: Record<string, any>, children: any) {
	if (typeof Component !== 'function') return false;

	if (Component.prototype != null && typeof Component.prototype.render === 'function') {
		return BaseComponent.isPrototypeOf(Component);
	}

	useConsoleFilter();

	try {
		try {
			const { html } = renderToStaticMarkup.call(this, Component, props, children);
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

function isSignal(x: any): x is SignalLike {
	return x != null && typeof x === 'object' && typeof x.peek === 'function' && 'value' in x;
}

function renderToStaticMarkup(this: RendererContext, Component: any, props: Record<string, any>, { default: children, ...slotted }: Record<string, any>) {
	const ctx = getContext(this.result);

	const slots: Record<string, ReturnType<typeof h>> = {};
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName(key);
		slots[name] = h(StaticHtml, { value, name });
	}
	// Note: create newProps to avoid mutating `props` before they are serialized
	const newProps = { ...props, ...slots };

	// Check for signals
	const signals: Record<string, string> = {};
	for(const [key, value] of Object.entries(props)) {
		if(isSignal(value)) {
			// Set the value to the current signal value
			newProps[key] = value.peek();

			let id: string;
			if(ctx.signals.has(value)) {
				id = ctx.signals.get(value)!;
			} else {
				id = incrementId(ctx);
				ctx.signals.set(value, id);
			}
			signals[key] = id;
		}
	}
	const attrs: { ['data-preact-signals']?: string } = {};
	if(Object.keys(signals).length) {
		attrs['data-preact-signals'] = JSON.stringify(signals);
	}

	const html = render(
		h(Component, newProps, children != null ? h(StaticHtml, { value: children }) : children)
	);
	return {
		attrs,
		html
	};
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
function filteredConsoleError(msg: string, ...rest: any[]) {
	if (consoleFilterRefs > 0 && typeof msg === 'string') {
		// In `check`, we attempt to render JSX components through Preact.
		// When attempting this on a React component, React may output
		// the following error, which we can safely filter out:
		const isKnownReactHookError =
			msg.includes('Warning: Invalid hook call.') &&
			msg.includes('https://reactjs.org/link/invalid-hook-call');
		if (isKnownReactHookError) return;
	}
	originalConsoleError(msg, ...rest);
}

export default {
	check,
	renderToStaticMarkup,
};
