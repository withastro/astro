export {
	ACTION_QUERY_PARAMS,
	type ActionAPIContext,
	type ActionClient,
	ActionError,
	type ActionErrorCode,
	type ActionInputSchema,
	type ActionReturnType,
	isActionError,
	isInputError,
	type SafeResult,
} from '../shared.js';
export { actions, getActionPath } from '../virtual.js';

export function defineAction() {
	throw new Error('[astro:action] `defineAction()` unexpectedly used on the client.');
}

export function getActionContext() {
	throw new Error('[astro:action] `getActionContext()` unexpectedly used on the client.');
}
