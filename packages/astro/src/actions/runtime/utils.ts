import type * as z3 from 'zod/v3';
import type * as z4 from 'zod/v4/core';
import { AstroError } from '../../core/errors/errors.js';
import { ActionCalledFromServerError } from '../../core/errors/errors-data.js';
import type { APIContext } from '../../types/public/context.js';
import { checkZodSchemaCompatibility } from '../../vite-plugin-experimental-zod4/utils.js';
import {
	type ActionAccept,
	type ActionClient,
	type ActionHandler,
	callSafely,
	getFormServerHandler,
	getJsonServerHandler,
} from './server.js';
import type { SerializedActionResult } from './shared.js';

export type ActionPayload = {
	actionResult: SerializedActionResult;
	actionName: string;
};

export type Locals = {
	_actionPayload: ActionPayload;
};

export const ACTION_API_CONTEXT_SYMBOL = Symbol.for('astro.actionAPIContext');

export const formContentTypes = ['application/x-www-form-urlencoded', 'multipart/form-data'];

export function hasContentType(contentType: string, expected: string[]) {
	// Split off parameters like charset or boundary
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type#content-type_in_html_forms
	const type = contentType.split(';')[0].toLowerCase();

	return expected.some((t) => type === t);
}

export type ActionAPIContext = Pick<
	APIContext,
	| 'request'
	| 'url'
	| 'isPrerendered'
	| 'locals'
	| 'clientAddress'
	| 'cookies'
	| 'currentLocale'
	| 'generator'
	| 'routePattern'
	| 'site'
	| 'params'
	| 'preferredLocale'
	| 'preferredLocaleList'
	| 'originPathname'
	| 'session'
	| 'csp'
>;

export type MaybePromise<T> = T | Promise<T>;

/**
 * Used to preserve the input schema type in the error object.
 * This allows for type inference on the `fields` property
 * when type narrowed to an `ActionInputError`.
 *
 * Example: Action has an input schema of `{ name: z.string() }`.
 * When calling the action and checking `isInputError(result.error)`,
 * `result.error.fields` will be typed with the `name` field.
 */
export type ErrorInferenceObject = Record<string, any>;

export function isActionAPIContext(ctx: ActionAPIContext): boolean {
	const symbol = Reflect.get(ctx, ACTION_API_CONTEXT_SYMBOL);
	return symbol === true;
}

export function createDefineAction(experimentalZod4: boolean) {
	return function defineAction<
		TOutput,
		TAccept extends ActionAccept | undefined = undefined,
		TInputSchema extends z3.ZodType | z4.$ZodType | undefined = TAccept extends 'form'
			? // If `input` is omitted, default to `FormData` for forms and `any` for JSON.
				z3.ZodType<FormData>
			: undefined,
	>({
		accept,
		input: inputSchema,
		handler,
	}: {
		input?: TInputSchema;
		accept?: TAccept;
		handler: ActionHandler<TInputSchema, TOutput>;
	}): ActionClient<TOutput, TAccept, TInputSchema> & string {
		if (inputSchema) {
			const error = checkZodSchemaCompatibility(
				inputSchema,
				experimentalZod4,
				'content collections',
			);
			if (error) {
				throw error;
			}
		}

		const serverHandler =
			accept === 'form'
				? getFormServerHandler(handler, inputSchema)
				: getJsonServerHandler(handler, inputSchema);

		async function safeServerHandler(this: ActionAPIContext, unparsedInput: unknown) {
			// The ActionAPIContext should always contain the `params` property
			if (typeof this === 'function' || !isActionAPIContext(this)) {
				throw new AstroError(ActionCalledFromServerError);
			}
			return callSafely(() => serverHandler(unparsedInput, this));
		}

		Object.assign(safeServerHandler, {
			orThrow(this: ActionAPIContext, unparsedInput: unknown) {
				if (typeof this === 'function') {
					throw new AstroError(ActionCalledFromServerError);
				}
				return serverHandler(unparsedInput, this);
			},
		});

		return safeServerHandler as ActionClient<TOutput, TAccept, TInputSchema> & string;
	};
}
