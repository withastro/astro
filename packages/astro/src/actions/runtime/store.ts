import { AsyncLocalStorage } from 'node:async_hooks';
import type { APIContext } from '../../@types/astro.js';
import { AstroError } from '../../core/errors/errors.js';

export type ActionAPIContext = Omit<APIContext, 'getActionResult' | 'props'>;
export const ApiContextStorage = new AsyncLocalStorage<ActionAPIContext>();

export function getApiContext(): ActionAPIContext {
	const context = ApiContextStorage.getStore();
	if (!context) {
		throw new AstroError({
			name: 'AstroActionError',
			message: 'Unable to get API context.',
			hint: 'If you attempted to call this action from server code, trying using `Astro.getActionResult()` instead.',
		});
	}
	return context;
}
