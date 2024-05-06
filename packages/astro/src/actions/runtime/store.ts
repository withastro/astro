import type { APIContext } from '../../@types/astro.js';
import { AsyncLocalStorage } from 'node:async_hooks';

export const ApiContextStorage = new AsyncLocalStorage<APIContext>();

export function getApiContext(): APIContext {
	const context = ApiContextStorage.getStore();
	if (!context) {
		throw new Error(
			'Unable to get API context. If you attempted to call this action from server code, trying using the "fallback" pattern instead.'
		);
	}
	return context;
}
