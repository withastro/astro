import type { APIContext } from '../../@types/astro.js';
import { AsyncLocalStorage } from 'node:async_hooks';

export type ActionAPIContext = Omit<APIContext, 'getActionResult' | 'props'>;
export const ApiContextStorage = new AsyncLocalStorage<ActionAPIContext>();

export function getApiContext(): ActionAPIContext {
	const context = ApiContextStorage.getStore();
	if (!context) {
		throw new Error(
			'Unable to get API context. If you attempted to call this action from server code, trying using the "fallback" pattern instead.'
		);
	}
	return context;
}
