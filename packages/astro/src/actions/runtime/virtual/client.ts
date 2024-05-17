export * from './shared.js';

export function defineAction() {
	throw new Error('[astro:action] `defineAction()` unexpectedly used on the client.');
}

export function getApiContext() {
	throw new Error('[astro:action] `getApiContext()` unexpectedly used on the client.');
}

export const z = new Proxy(
	{},
	{
		get() {
			throw new Error('[astro:action] `z` unexpectedly used on the client.');
		},
	}
);
