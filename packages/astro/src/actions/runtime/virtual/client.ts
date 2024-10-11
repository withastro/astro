export * from './shared.js';

export function defineAction() {
	throw new Error('[astro:action] `defineAction()` unexpectedly used on the client.');
}
