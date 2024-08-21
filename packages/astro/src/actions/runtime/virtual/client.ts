export * from './shared.js';

export function defineAction() {
	throw new Error('[astro:action] `defineAction()` unexpectedly used on the client.');
}

// TODO: remove for stable.
export const z = new Proxy(
	{},
	{
		get() {
			throw new Error('[astro:action] `z` unexpectedly used on the client.');
		},
	},
);
