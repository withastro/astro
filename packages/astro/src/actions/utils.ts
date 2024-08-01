import type { APIContext } from '../@types/astro.js';
import type { Locals } from './runtime/middleware.js';
import type { ActionAPIContext } from './runtime/utils.js';
import { ActionError, getActionQueryString, type SafeResult } from './runtime/virtual/shared.js';

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

/**
 * Serialize the action result for edge environments.
 */
export function serializeActionResult(
	res: SafeResult<any, any>
): Locals['_actionsInternal']['actionResult'] {
	if (res.error) {
		return {
			error: JSON.stringify({
				...res.error,
				message: res.error.message,
				stack: import.meta.env.PROD ? undefined : res.error.stack,
			}),
		};
	}
	if (res.data === undefined) {
		// `undefined` is not serializable. Special case this value.
		return { data: '$$undefined' };
	}
	return { data: JSON.stringify(res.data) };
}

export function deserializeActionResult(
	res: Locals['_actionsInternal']['actionResult']
): SafeResult<any, any> {
	if ('error' in res) {
		return { error: ActionError.fromJson(JSON.parse(res.error)), data: undefined };
	}
	if (res.data === '$$undefined') {
		return { data: undefined, error: undefined };
	}
	return { data: JSON.parse(res.data), error: undefined };
}

export function createCallAction(context: ActionAPIContext): APIContext['callAction'] {
	return (baseAction, input) => {
		const action = baseAction.bind(context);
		return action(input) as any;
	};
}
