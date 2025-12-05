export { ACTION_QUERY_PARAMS } from '../../consts.js';
export {
	ActionError,
	isActionError,
	isInputError,
} from '../client.js';
export type {
	ActionAPIContext,
	ActionClient,
	ActionErrorCode,
	ActionInputSchema,
	ActionReturnType,
	SafeResult,
} from '../types.js';
export { actions, getActionPath } from '../virtual.js';

export function defineAction() {
	throw new Error('[astro:action] `defineAction()` unexpectedly used on the client.');
}

export function getActionContext() {
	throw new Error('[astro:action] `getActionContext()` unexpectedly used on the client.');
}
