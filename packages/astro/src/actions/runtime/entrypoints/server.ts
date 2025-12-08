import type { Pipeline } from '../../../core/base-pipeline.js';
import { pipelineSymbol } from '../../../core/constants.js';
import { ActionCalledFromServerError } from '../../../core/errors/errors-data.js';
import { AstroError } from '../../../core/errors/errors.js';
import { createGetActionPath, createActionsProxy } from '../client.js';
import { shouldAppendTrailingSlash } from 'virtual:astro:actions/options';

export { ACTION_QUERY_PARAMS } from '../../consts.js';
export {
	ActionError,
	isActionError,
	isInputError,
} from '../client.js';
export {
	defineAction,
	getActionContext,
} from '../server.js';
export type {
	ActionAPIContext,
	ActionClient,
	ActionErrorCode,
	ActionInputSchema,
	ActionReturnType,
	SafeResult,
} from '../types.js';

export const getActionPath = createGetActionPath({
	baseUrl: import.meta.env.BASE_URL,
	shouldAppendTrailingSlash,
});

export const actions = createActionsProxy({
	handleAction: async (param, path, context) => {
		const pipeline: Pipeline | undefined = context
			? Reflect.get(context, pipelineSymbol)
			: undefined;
		if (!pipeline) {
			throw new AstroError(ActionCalledFromServerError);
		}
		const action = await pipeline.getAction(path);
		if (!action) throw new Error(`Action not found: ${path}`);
		return action.bind(context)(param);
	},
});
