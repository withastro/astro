import type { APIContext } from '../@types/astro.js';
import type { Locals } from './runtime/middleware.js';
import type { ActionAPIContext } from './runtime/utils.js';
import { deserializeActionResult, getActionQueryString } from './runtime/virtual/shared.js';

export function hasActionPayload(locals: APIContext['locals']): locals is Locals {
	return '_actionPayload' in locals;
}

export function createGetActionResult(locals: APIContext['locals']): APIContext['getActionResult'] {
	return (actionFn): any => {
		if (
			!hasActionPayload(locals) ||
			actionFn.toString() !== getActionQueryString(locals._actionPayload.actionName)
		) {
			return undefined;
		}
		return deserializeActionResult(locals._actionPayload.actionResult);
	};
}

export function createCallAction(context: ActionAPIContext): APIContext['callAction'] {
	return (baseAction, input) => {
		const action = baseAction.bind(context);
		return action(input) as any;
	};
}
