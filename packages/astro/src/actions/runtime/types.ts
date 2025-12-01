import type z from 'zod';
import type { APIContext } from '../../types/public/index.js';
import type { ActionError } from './client.js';

export type ActionErrorCode =
	| 'BAD_REQUEST'
	| 'UNAUTHORIZED'
	| 'PAYMENT_REQUIRED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'METHOD_NOT_ALLOWED'
	| 'NOT_ACCEPTABLE'
	| 'PROXY_AUTHENTICATION_REQUIRED'
	| 'REQUEST_TIMEOUT'
	| 'CONFLICT'
	| 'GONE'
	| 'LENGTH_REQUIRED'
	| 'PRECONDITION_FAILED'
	| 'CONTENT_TOO_LARGE'
	| 'URI_TOO_LONG'
	| 'UNSUPPORTED_MEDIA_TYPE'
	| 'RANGE_NOT_SATISFIABLE'
	| 'EXPECTATION_FAILED'
	| 'MISDIRECTED_REQUEST'
	| 'UNPROCESSABLE_CONTENT'
	| 'LOCKED'
	| 'FAILED_DEPENDENCY'
	| 'TOO_EARLY'
	| 'UPGRADE_REQUIRED'
	| 'PRECONDITION_REQUIRED'
	| 'TOO_MANY_REQUESTS'
	| 'REQUEST_HEADER_FIELDS_TOO_LARGE'
	| 'UNAVAILABLE_FOR_LEGAL_REASONS'
	| 'INTERNAL_SERVER_ERROR'
	| 'NOT_IMPLEMENTED'
	| 'BAD_GATEWAY'
	| 'SERVICE_UNAVAILABLE'
	| 'GATEWAY_TIMEOUT'
	| 'HTTP_VERSION_NOT_SUPPORTED'
	| 'VARIANT_ALSO_NEGOTIATES'
	| 'INSUFFICIENT_STORAGE'
	| 'LOOP_DETECTED'
	| 'NETWORK_AUTHENTICATION_REQUIRED';

export type ActionAccept = 'form' | 'json';

export type ActionHandler<TInputSchema, TOutput> = TInputSchema extends z.ZodType
	? (input: z.infer<TInputSchema>, context: ActionAPIContext) => MaybePromise<TOutput>
	: (input: any, context: ActionAPIContext) => MaybePromise<TOutput>;

export type ActionReturnType<T extends ActionHandler<any, any>> = Awaited<ReturnType<T>>;

const inferSymbol = Symbol('#infer');

/**
 * Infers the type of an action's input based on its Zod schema
 *
 * @see https://docs.astro.build/en/reference/modules/astro-actions/#actioninputschema
 */
export type ActionInputSchema<T extends ActionClient<any, any, any>> = T extends {
	[inferSymbol]: any;
}
	? T[typeof inferSymbol]
	: never;

export type ActionClient<
	TOutput,
	TAccept extends ActionAccept | undefined,
	TInputSchema extends z.ZodType | undefined,
> = TInputSchema extends z.ZodType
	? ((
			input: TAccept extends 'form' ? FormData : z.input<TInputSchema>,
		) => Promise<
			SafeResult<
				z.input<TInputSchema> extends ErrorInferenceObject
					? z.input<TInputSchema>
					: ErrorInferenceObject,
				Awaited<TOutput>
			>
		>) & {
			queryString: string;
			orThrow: (
				input: TAccept extends 'form' ? FormData : z.input<TInputSchema>,
			) => Promise<Awaited<TOutput>>;
			[inferSymbol]: TInputSchema;
		}
	: ((input?: any) => Promise<SafeResult<never, Awaited<TOutput>>>) & {
			orThrow: (input?: any) => Promise<Awaited<TOutput>>;
		};

export type SafeResult<TInput extends ErrorInferenceObject, TOutput> =
	| {
			data: TOutput;
			error: undefined;
	  }
	| {
			data: undefined;
			error: ActionError<TInput>;
	  };

export type SerializedActionResult =
	| {
			type: 'data';
			contentType: 'application/json+devalue';
			status: 200;
			body: string;
	  }
	| {
			type: 'error';
			contentType: 'application/json';
			status: number;
			body: string;
	  }
	| {
			type: 'empty';
			status: 204;
	  };

export interface ActionPayload {
	actionResult: SerializedActionResult;
	actionName: string;
}

export interface ActionsLocals {
	_actionPayload: ActionPayload;
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
