import type { APIContext } from '../@types/astro.js';
import type { Locals } from './runtime/middleware.js';
import { type ActionAPIContext } from './runtime/utils.js';
import { deserializeActionResult, getActionQueryString } from './runtime/virtual/shared.js';

export function hasActionsInternal(locals: APIContext['locals']): locals is Locals {
	return '_actionsInternal' in locals;
}

export function createGetActionResult(locals: APIContext['locals']): APIContext['getActionResult'] {
	return (actionFn): any => {
		if (
			!hasActionsInternal(locals) ||
			actionFn.toString() !== getActionQueryString(locals._actionsInternal.actionName)
		) {
			return undefined;
		}
		return deserializeActionResult(locals._actionsInternal.actionResult);
	};
}

export function createCallAction(context: ActionAPIContext): APIContext['callAction'] {
	return (baseAction, input) => {
		const action = baseAction.bind(context);
		return action(input) as any;
	};
}
