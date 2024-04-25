export * from './shared.js';

export function defineAction() {
	throw new Error('`defineAction()` unexpectedly used on the client.');
}
