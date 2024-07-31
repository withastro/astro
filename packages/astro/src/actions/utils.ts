import type { APIContext } from '../@types/astro.js';
import type { Locals } from './runtime/middleware.js';
import { getActionQueryString } from './runtime/virtual/shared.js';

export function hasActionsInternal(locals: APIContext['locals']): locals is Locals {
	return '_actionsInternal' in locals;
}

export function createGetActionResult(locals: APIContext['locals']): APIContext['getActionResult'] {
	return (actionFn) => {
		if (
			!hasActionsInternal(locals) ||
			actionFn.toString() !== getActionQueryString(locals._actionsInternal.actionName)
		) {
			return Promise.resolve(undefined);
		}
		return locals._actionsInternal.actionResult as any;
	};
}

export function createCallAction(context: APIContext): APIContext['callAction'] {
	return (baseAction, input) => {
		const action = baseAction.bind(context);
		return action(input) as any;
	};
}
