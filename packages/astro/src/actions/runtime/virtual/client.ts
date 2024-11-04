export * from './shared.js';

export function defineAction() {
	throw new Error('[astro:action] `defineAction()` unexpectedly used on the client.');
}

export function getMiddlewareContext() {
	throw new Error('[astro:action] `getMiddlewareContext()` unexpectedly used on the client.');
}
