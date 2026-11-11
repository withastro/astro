import type { FetchPipelineHandler } from '@astrojs/vite-plugin-router';
import { handleAction } from './handler.js';

/**
 * The `actions` pipeline step. Runs after user middleware: answers RPC action requests and runs
 * form actions, then continues to route dispatch. Skipped while rendering an error page without
 * middleware.
 */
const actionsHandler: FetchPipelineHandler = (state, next) => {
	if (!state.skipMiddleware) {
		const actionResult = handleAction(state.getAPIContext(), state);
		if (actionResult) {
			return actionResult.then((response) => response ?? next(state));
		}
	}
	return next(state);
};
export default actionsHandler;
