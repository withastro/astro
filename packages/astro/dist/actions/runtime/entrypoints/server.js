import { pipelineSymbol } from '../../../core/constants.js';
import { ActionCalledFromServerError } from '../../../core/errors/errors-data.js';
import { AstroError } from '../../../core/errors/errors.js';
import { createGetActionPath, createActionsProxy } from '../client.js';
import { shouldAppendTrailingSlash } from 'virtual:astro:actions/options';
import { ACTION_QUERY_PARAMS } from '../../consts.js';
import { ActionError, isActionError, isInputError } from '../client.js';
import { defineAction, getActionContext } from '../server.js';
const getActionPath = createGetActionPath({
	baseUrl: import.meta.env.BASE_URL,
	shouldAppendTrailingSlash,
});
const actions = createActionsProxy({
	handleAction: async (param, path, context) => {
		const pipeline = context ? Reflect.get(context, pipelineSymbol) : void 0;
		if (!pipeline) {
			throw new AstroError(ActionCalledFromServerError);
		}
		const action = await pipeline.getAction(path);
		if (!action) throw new Error(`Action not found: ${path}`);
		return action.bind(context)(param);
	},
});
export {
	ACTION_QUERY_PARAMS,
	ActionError,
	actions,
	defineAction,
	getActionContext,
	getActionPath,
	isActionError,
	isInputError,
};
