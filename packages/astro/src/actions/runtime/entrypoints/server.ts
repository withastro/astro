import type { Pipeline } from '../../../core/base-pipeline.js';
import { pipelineSymbol } from '../../../core/constants.js';
import {
	ActionCalledFromServerError,
	ActionNotFoundError,
} from '../../../core/errors/errors-data.js';
import { AstroError } from '../../../core/errors/errors.js';
import { createGetActionPath, createActionsProxy } from '../client.js';
import { ACTION_API_CONTEXT_SYMBOL } from '../server.js';
import { shouldAppendTrailingSlash } from 'virtual:astro:actions/options';

export { ACTION_QUERY_PARAMS } from '../../consts.js';
export { ActionError, isActionError, isInputError } from '../client.js';
export { defineAction, getActionContext } from '../server.js';
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

		let action;
		if (pipeline) {
			action = await pipeline.getAction(path);
		} else if (context && Reflect.get(context, ACTION_API_CONTEXT_SYMBOL)) {
			// Fallback for contexts without a pipeline (e.g., createContext from astro/middleware).
			// Resolve the action handler directly from the actions entrypoint module.
			const { server } = await import('virtual:astro:actions/entrypoint');
			const pathKeys = path.split('.').map((key) => decodeURIComponent(key));
			let resolved: any = server;
			for (const key of pathKeys) {
				if (!(key in resolved)) {
					throw new AstroError({
						...ActionNotFoundError,
						message: ActionNotFoundError.message(pathKeys.join('.')),
					});
				}
				resolved = resolved[key];
			}
			action = resolved;
		}

		if (!action) {
			throw new AstroError(ActionCalledFromServerError);
		}
		return action.bind(context)(param);
	},
});
