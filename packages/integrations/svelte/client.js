const noop = () => {};

let originalConsoleWarning;
let consoleFilterRefs = 0;

export default (element) => {
	return (Component, props, slotted, { client }) => {
		if (!element.hasAttribute('ssr')) return;
		const slots = {};
		for (const [key, value] of Object.entries(slotted)) {
			slots[key] = createSlotDefinition(key, value);
		}

		try {
			if (import.meta.env.DEV) useConsoleFilter();

			const component = new Component({
				target: element,
				props: {
					...props,
					$$slots: slots,
					$$scope: { ctx: [] },
				},
				hydrate: client !== 'only',
				$$inline: true,
			});

			element.addEventListener('astro:unmount', () => component.$destroy(), { once: true });
		} finally {
			if (import.meta.env.DEV) finishUsingConsoleFilter();
		}
	};
};

function createSlotDefinition(key, children) {
	let parent;
	return [
		() => ({
			// mount
			m(target) {
				parent = target;
				target.insertAdjacentHTML(
					'beforeend',
					`<astro-slot${key === 'default' ? '' : ` name="${key}"`}>${children}</astro-slot>`
				);
			},
			// create
			c: noop,
			// hydrate
			l: noop,
			// destroy
			d() {
				if (!parent) return;
				const slot = parent.querySelector(
					`astro-slot${key === 'default' ? ':not([name])' : `[name="${key}"]`}`
				);
				if (slot) slot.remove();
			},
		}),
		noop,
		noop,
	];
}

/**
 * Reduces console noise by filtering known non-problematic warnings.
 *
 * Performs reference counting to allow parallel usage from async code.
 *
 * To stop filtering, please ensure that there always is a matching call
 * to `finishUsingConsoleFilter` afterwards.
 */
function useConsoleFilter() {
	consoleFilterRefs++;

	if (!originalConsoleWarning) {
		originalConsoleWarning = console.warn;
		try {
			console.warn = filteredConsoleWarning;
		} catch (error) {
			// If we're unable to hook `console.warn`, just accept it
		}
	}
}

/**
 * Indicates that the filter installed by `useConsoleFilter`
 * is no longer needed by the calling code.
 */
function finishUsingConsoleFilter() {
	consoleFilterRefs--;

	// Note: Instead of reverting `console.warning` back to the original
	// when the reference counter reaches 0, we leave our hook installed
	// to prevent potential race conditions once `check` is made async
}

/**
 * Hook/wrapper function for the global `console.warning` function.
 *
 * Ignores known non-problematic errors while any code is using the console filter.
 * Otherwise, simply forwards all arguments to the original function.
 */
function filteredConsoleWarning(msg, ...rest) {
	if (consoleFilterRefs > 0 && typeof msg === 'string') {
		// Astro passes `class` and `data-astro-cid` props to the Svelte component, which
		// outputs the following warning, which we can safely filter out.

		// NOTE: In practice data-astro-cid props have a hash suffix. Hence the use of a
		// quoted prop name string without a closing quote.

		const isKnownSvelteError =
			msg.endsWith("was created with unknown prop 'class'") ||
			msg.includes("was created with unknown prop 'data-astro-cid");
		if (isKnownSvelteError) return;
	}
	originalConsoleWarning(msg, ...rest);
}
