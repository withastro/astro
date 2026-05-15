import * as z from 'zod/v4/core';
import type { APIContext } from '../../types/public/index.js';
import { deserializeActionResult } from './client.js';
import type {
	ActionAccept,
	ActionClient,
	ActionHandler,
	SafeResult,
	SerializedActionResult,
} from './types.js';
export declare function defineAction<
	TOutput,
	TAccept extends ActionAccept | undefined = undefined,
	TInputSchema extends z.$ZodType | undefined = TAccept extends 'form'
		? z.$ZodType<FormData>
		: undefined,
>({
	accept,
	input: inputSchema,
	handler,
}: {
	input?: TInputSchema;
	accept?: TAccept;
	handler: ActionHandler<TInputSchema, TOutput>;
}): ActionClient<TOutput, TAccept, TInputSchema> & string;
interface AstroActionContext {
	/** Information about an incoming action request. */
	action?: {
		/** Whether an action was called using an RPC function or by using an HTML form action. */
		calledFrom: 'rpc' | 'form';
		/** The name of the action. Useful to track the source of an action result during a redirect. */
		name: string;
		/** Programmatically call the action to get the result. */
		handler: () => Promise<SafeResult<any, any>>;
	};
	/**
	 * Manually set the action result accessed via `getActionResult()`.
	 * Calling this function from middleware will disable Astro's own action result handling.
	 */
	setActionResult(actionName: string, actionResult: SerializedActionResult): void;
	/**
	 * Serialize an action result to stored in a cookie or session.
	 * Also used to pass a result to Astro templates via `setActionResult()`.
	 */
	serializeActionResult: typeof serializeActionResult;
	/**
	 * Deserialize an action result to access data and error objects.
	 */
	deserializeActionResult: typeof deserializeActionResult;
}
/**
 * Access information about Action requests from middleware.
 */
export declare function getActionContext(context: APIContext): AstroActionContext;
export declare const ACTION_API_CONTEXT_SYMBOL: unique symbol;
/** Transform form data to an object based on a Zod schema. */
export declare function formDataToObject<T extends z.$ZodObject>(
	formData: FormData,
	schema: T,
	/** @internal */
	prefix?: string,
): Record<string, unknown>;
export declare function serializeActionResult(res: SafeResult<any, any>): SerializedActionResult;
export {};
