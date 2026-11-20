import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { APIContext } from '../../types/public/index.js';
import type { ActionError, codeToStatusMap } from './client.js';

export type ActionErrorCode = keyof typeof codeToStatusMap;

export type ActionAccept = 'form' | 'json';

export type ActionHandler<TInputSchema, TOutput> = TInputSchema extends StandardSchemaV1
	? (
			input: StandardSchemaV1.InferOutput<TInputSchema>,
			context: ActionAPIContext,
		) => MaybePromise<TOutput>
	: (input: any, context: ActionAPIContext) => MaybePromise<TOutput>;

export type ActionReturnType<T extends ActionHandler<any, any>> = Awaited<ReturnType<T>>;

type InferKey = '__internalInfer';

/**
 * Infers the type of an action's input based on its schema
 *
 * @see https://docs.astro.build/en/reference/modules/astro-actions/#actioninputschema
 */
export type ActionInputSchema<T extends ActionClient<any, any, any>> = T extends {
	[key in InferKey]: any;
}
	? T[InferKey]
	: never;

export type ActionClient<
	TOutput,
	TAccept extends ActionAccept | undefined,
	TInputSchema extends StandardSchemaV1 | undefined,
> = TInputSchema extends StandardSchemaV1
	? ((
			input: TAccept extends 'form' ? FormData : StandardSchemaV1.InferInput<TInputSchema>,
		) => Promise<
			SafeResult<
				StandardSchemaV1.InferInput<TInputSchema> extends ErrorInferenceObject
					? StandardSchemaV1.InferInput<TInputSchema>
					: ErrorInferenceObject,
				Awaited<TOutput>
			>
		>) & {
			queryString: string;
			orThrow: (
				input: TAccept extends 'form' ? FormData : StandardSchemaV1.InferInput<TInputSchema>,
			) => Promise<Awaited<TOutput>>;
		} & {
			[key in InferKey]: TInputSchema;
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

export interface ActionsLocals {
	_actionPayload: {
		actionResult: SerializedActionResult;
		actionName: string;
	};
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
	| 'cache'
	| 'csp'
	| 'logger'
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
