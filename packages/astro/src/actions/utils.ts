import type { APIContext } from '../types/public/context.js';
import { deserializeActionResult, getActionQueryString } from './runtime/client.js';
import { ACTION_API_CONTEXT_SYMBOL } from './runtime/server.js';
import type { ActionAPIContext, ActionsLocals } from './runtime/types.js';

export function hasActionPayload(locals: APIContext['locals']): locals is ActionsLocals {
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
		Reflect.set(context, ACTION_API_CONTEXT_SYMBOL, true);
		const action = baseAction.bind(context);
		return action(input) as any;
	};
}
