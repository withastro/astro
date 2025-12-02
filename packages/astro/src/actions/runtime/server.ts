import { z } from 'zod';
import type { Pipeline } from '../../core/base-pipeline.js';
import { shouldAppendForwardSlash } from '../../core/build/util.js';
import { AstroError } from '../../core/errors/errors.js';
import { ActionCalledFromServerError, ActionNotFoundError } from '../../core/errors/errors-data.js';
import { removeTrailingForwardSlash } from '../../core/path.js';
import { apiContextRoutesSymbol } from '../../core/render-context.js';
import type { APIContext } from '../../types/public/index.js';
import { ACTION_RPC_ROUTE_PATTERN } from '../consts.js';
import {
	ACTION_QUERY_PARAMS,
	ActionError,
	ActionInputError,
	callSafely,
	deserializeActionResult,
	type SafeResult,
	type SerializedActionResult,
	serializeActionResult,
} from './shared.js';
import type { Locals } from './utils.js';
import {
	ACTION_API_CONTEXT_SYMBOL,
	type ActionAPIContext,
	type ErrorInferenceObject,
	formContentTypes,
	hasContentType,
	isActionAPIContext,
	type MaybePromise,
} from './utils.js';

export * from './shared.js';

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

export function defineAction<
	TOutput,
	TAccept extends ActionAccept | undefined = undefined,
	TInputSchema extends z.ZodType | undefined = TAccept extends 'form'
		? // If `input` is omitted, default to `FormData` for forms and `any` for JSON.
			z.ZodType<FormData>
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
}

function getFormServerHandler<TOutput, TInputSchema extends z.ZodType>(
	handler: ActionHandler<TInputSchema, TOutput>,
	inputSchema?: TInputSchema,
) {
	return async (unparsedInput: unknown, context: ActionAPIContext): Promise<Awaited<TOutput>> => {
		if (!(unparsedInput instanceof FormData)) {
			throw new ActionError({
				code: 'UNSUPPORTED_MEDIA_TYPE',
				message: 'This action only accepts FormData.',
			});
		}

		if (!inputSchema) return await handler(unparsedInput, context);

		const baseSchema = unwrapBaseObjectSchema(inputSchema, unparsedInput);
		const parsed = await inputSchema.safeParseAsync(
			baseSchema instanceof z.ZodObject
				? formDataToObject(unparsedInput, baseSchema)
				: unparsedInput,
		);
		if (!parsed.success) {
			throw new ActionInputError(parsed.error.issues);
		}
		return await handler(parsed.data, context);
	};
}

function getJsonServerHandler<TOutput, TInputSchema extends z.ZodType>(
	handler: ActionHandler<TInputSchema, TOutput>,
	inputSchema?: TInputSchema,
) {
	return async (unparsedInput: unknown, context: ActionAPIContext): Promise<Awaited<TOutput>> => {
		if (unparsedInput instanceof FormData) {
			throw new ActionError({
				code: 'UNSUPPORTED_MEDIA_TYPE',
				message: 'This action only accepts JSON.',
			});
		}

		if (!inputSchema) return await handler(unparsedInput, context);
		const parsed = await inputSchema.safeParseAsync(unparsedInput);
		if (!parsed.success) {
			throw new ActionInputError(parsed.error.issues);
		}
		return await handler(parsed.data, context);
	};
}

/** Transform form data to an object based on a Zod schema. */
export function formDataToObject<T extends z.ZodObject<any>>(
	formData: FormData,
	schema: T,
): Record<string, unknown> {
	// In Zod 4, passthrough() adds a 'catchall' property to _def
	const catchall = (schema._def as any).catchall;
	const isLooseObject = catchall !== undefined && catchall !== null;
	const obj: Record<string, unknown> = isLooseObject ? Object.fromEntries(formData.entries()) : {};
	for (const [key, baseValidator] of Object.entries(schema.shape)) {
		let validator = baseValidator as z.ZodTypeAny;

		while (
			validator instanceof z.ZodOptional ||
			validator instanceof z.ZodNullable ||
			validator instanceof z.ZodDefault
		) {
			// use default value when key is undefined
			if (validator instanceof z.ZodDefault && !formData.has(key)) {
				const defaultValue = validator._def.defaultValue;
				obj[key] = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
			}
			validator = (validator._def as any).innerType;
		}

		if (!formData.has(key) && key in obj) {
			// continue loop if form input is not found and default value is set
			continue;
		} else if (validator instanceof z.ZodBoolean) {
			const val = formData.get(key);
			obj[key] = val === 'true' ? true : val === 'false' ? false : formData.has(key);
		} else if (validator instanceof z.ZodArray) {
			obj[key] = handleFormDataGetAll(key, formData, validator as z.ZodArray<any>);
		} else {
			obj[key] = handleFormDataGet(key, formData, validator, baseValidator);
		}
	}
	return obj;
}

function handleFormDataGetAll(key: string, formData: FormData, validator: z.ZodArray<any>) {
	const entries = Array.from(formData.getAll(key));
	// In Zod 4, array elements are in _def.element instead of _def.type
	const elementValidator = (validator._def as any).element as z.ZodTypeAny;
	if (elementValidator instanceof z.ZodNumber) {
		return entries.map(Number);
	} else if (elementValidator instanceof z.ZodBoolean) {
		return entries.map(Boolean);
	}
	return entries;
}

function handleFormDataGet(
	key: string,
	formData: FormData,
	validator: unknown,
	baseValidator: unknown,
) {
	const value = formData.get(key);
	if (!value) {
		return baseValidator instanceof z.ZodOptional ? undefined : null;
	}
	return validator instanceof z.ZodNumber ? Number(value) : value;
}

function unwrapBaseObjectSchema(schema: z.ZodTypeAny, unparsedInput: FormData): z.ZodTypeAny {
	// Zod 4 doesn't export ZodEffects/ZodPipeline, so check via _def.type string
	while ((schema._def as any).type === 'effects' || (schema._def as any).type === 'pipeline') {
		const defType = (schema._def as any).type;
		if (defType === 'effects') {
			schema = (schema._def as any).schema;
		} else if (defType === 'pipeline') {
			schema = (schema._def as any).in;
		}
	}
	if ((schema._def as any).type === 'discriminatedUnion') {
		const discriminatorDef = schema._def as any;
		const typeKey = discriminatorDef.discriminator;
		const typeValue = unparsedInput.get(typeKey);
		if (typeof typeValue !== 'string') return schema;

		// In Zod 4, discriminated unions use 'optionsParsers' instead of 'optionsMap'
		const optionsParsers = discriminatorDef.optionsParsers || discriminatorDef.optionsMap;
		const objSchema = optionsParsers?.get?.(typeValue);
		if (!objSchema) return schema;

		return objSchema;
	}
	return schema;
}

export type AstroActionContext = {
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
};

/**
 * Access information about Action requests from middleware.
 */
export function getActionContext(context: APIContext): AstroActionContext {
	const callerInfo = getCallerInfo(context);

	// Prevents action results from being handled on a rewrite.
	// Also prevents our *own* fallback middleware from running
	// if the user's middleware has already handled the result.
	const actionResultAlreadySet = Boolean((context.locals as Locals)._actionPayload);

	let action: AstroActionContext['action'] = undefined;

	if (callerInfo && context.request.method === 'POST' && !actionResultAlreadySet) {
		action = {
			calledFrom: callerInfo.from,
			name: callerInfo.name,
			handler: async () => {
				const pipeline: Pipeline = Reflect.get(context, apiContextRoutesSymbol);
				const callerInfoName = shouldAppendForwardSlash(
					pipeline.manifest.trailingSlash,
					pipeline.manifest.buildFormat,
				)
					? removeTrailingForwardSlash(callerInfo.name)
					: callerInfo.name;

				let baseAction;
				try {
					baseAction = await pipeline.getAction(callerInfoName);
				} catch (error) {
					// Check if this is an ActionNotFoundError by comparing the name property
					// We use this approach instead of instanceof because the error might be
					// a different instance of the AstroError class depending on the environment
					if (
						error instanceof Error &&
						'name' in error &&
						typeof error.name === 'string' &&
						error.name === ActionNotFoundError.name
					) {
						return { data: undefined, error: new ActionError({ code: 'NOT_FOUND' }) };
					}
					throw error;
				}

				let input;
				try {
					input = await parseRequestBody(context.request);
				} catch (e) {
					if (e instanceof TypeError) {
						return { data: undefined, error: new ActionError({ code: 'UNSUPPORTED_MEDIA_TYPE' }) };
					}
					throw e;
				}

				const omitKeys = ['props', 'getActionResult', 'callAction', 'redirect'];

				// Clones the context, preserving accessors and methods but omitting
				// the properties that are not needed in the action handler.
				const actionAPIContext = Object.create(
					Object.getPrototypeOf(context),
					Object.fromEntries(
						Object.entries(Object.getOwnPropertyDescriptors(context)).filter(
							([key]) => !omitKeys.includes(key),
						),
					),
				);

				Reflect.set(actionAPIContext, ACTION_API_CONTEXT_SYMBOL, true);
				const handler = baseAction.bind(actionAPIContext satisfies ActionAPIContext);
				return handler(input);
			},
		};
	}

	function setActionResult(actionName: string, actionResult: SerializedActionResult) {
		(context.locals as Locals)._actionPayload = {
			actionResult,
			actionName,
		};
	}
	return {
		action,
		setActionResult,
		serializeActionResult,
		deserializeActionResult,
	};
}

function getCallerInfo(ctx: APIContext) {
	if (ctx.routePattern === ACTION_RPC_ROUTE_PATTERN) {
		return { from: 'rpc', name: ctx.url.pathname.replace(/^.*\/_actions\//, '') } as const;
	}
	const queryParam = ctx.url.searchParams.get(ACTION_QUERY_PARAMS.actionName);
	if (queryParam) {
		return { from: 'form', name: queryParam } as const;
	}
	return undefined;
}

async function parseRequestBody(request: Request) {
	const contentType = request.headers.get('content-type');
	const contentLength = request.headers.get('Content-Length');

	if (!contentType) return undefined;
	if (hasContentType(contentType, formContentTypes)) {
		return await request.clone().formData();
	}
	if (hasContentType(contentType, ['application/json'])) {
		return contentLength === '0' ? undefined : await request.clone().json();
	}
	throw new TypeError('Unsupported content type');
}
