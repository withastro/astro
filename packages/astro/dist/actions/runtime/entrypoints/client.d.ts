export { ACTION_QUERY_PARAMS } from '../../consts.js';
export { ActionError, isActionError, isInputError } from '../client.js';
export type {
	ActionAPIContext,
	ActionClient,
	ActionErrorCode,
	ActionInputSchema,
	ActionReturnType,
	SafeResult,
} from '../types.js';
export declare function defineAction(): void;
export declare function getActionContext(): void;
export declare const getActionPath: (
	action: import('../types.js').ActionClient<any, any, any>,
) => string;
export declare const actions: Record<string | symbol, any>;
