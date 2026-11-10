import type { RenderContextExtension } from '@astrojs/vite-plugin-router';
import type { APIContext } from '../../types/public/context.js';
import { deserializeActionResult } from '../runtime/client.js';
import { createGetActionResult, hasActionPayload } from '../utils.js';

/**
 * `Astro.getActionResult()` / `context.getActionResult()`.
 *
 * Also applies the status of a failed action whose result arrived with the request's `locals`
 * (results set during the request through `setActionResult()` apply their status there), and
 * provides `actionResult`, the result renderers read from `SSRResult.actionResult`.
 */
const getActionResult: RenderContextExtension<APIContext['getActionResult']> = (state) => {
	if (hasActionPayload(state.locals) && state.locals._actionPayload.actionResult.type === 'error') {
		const { error } = deserializeActionResult(state.locals._actionPayload.actionResult);
		if (error) {
			state.status = error.status;
			state.statusText = error.type;
		}
	}
	state.provide('actionResult', {
		create: () =>
			hasActionPayload(state.locals)
				? deserializeActionResult(state.locals._actionPayload.actionResult)
				: undefined,
	});
	return { create: () => createGetActionResult(state.locals) };
};
export default getActionResult;
