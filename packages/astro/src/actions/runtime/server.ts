import * as z3 from 'zod/v3';
import * as z4 from 'zod/v4/core';
import type { Pipeline } from '../../core/base-pipeline.js';
import { shouldAppendForwardSlash } from '../../core/build/util.js';
import { ActionNotFoundError } from '../../core/errors/errors-data.js';
import { removeTrailingForwardSlash } from '../../core/path.js';
import { apiContextRoutesSymbol } from '../../core/render-context.js';
import type { APIContext } from '../../types/public/index.js';
import { ACTION_RPC_ROUTE_PATTERN } from '../consts.js';
import {
	ACTION_QUERY_PARAMS,
	ActionError,
	ActionInputError,
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
	type MaybePromise,
} from './utils.js';

export * from './shared.js';

export type ActionAccept = 'form' | 'json';

export type ActionHandler<TInputSchema, TOutput> = TInputSchema extends z3.ZodType
	? (input: z3.infer<TInputSchema>, context: ActionAPIContext) => MaybePromise<TOutput>
	: TInputSchema extends z4.$ZodType
		? (input: z4.infer<TInputSchema>, context: ActionAPIContext) => MaybePromise<TOutput>
		: (input: any, context: ActionAPIContext) => MaybePromise<TOutput>;

export type ActionReturnType<T extends ActionHandler<any, any>> = Awaited<ReturnType<T>>;

export type ActionClient<
	TOutput,
	TAccept extends ActionAccept | undefined,
	TInputSchema extends z3.ZodType | z4.$ZodType | undefined,
> = TInputSchema extends z3.ZodType
	? ((
			input: TAccept extends 'form' ? FormData : z3.input<TInputSchema>,
		) => Promise<
			SafeResult<
				z3.input<TInputSchema> extends ErrorInferenceObject
					? z3.input<TInputSchema>
					: ErrorInferenceObject,
				Awaited<TOutput>
			>
		>) & {
			queryString: string;
			orThrow: (
				input: TAccept extends 'form' ? FormData : z3.input<TInputSchema>,
			) => Promise<Awaited<TOutput>>;
		}
	: TInputSchema extends z4.$ZodType
		? ((
				input: TAccept extends 'form' ? FormData : z4.input<TInputSchema>,
			) => Promise<
				SafeResult<
					z4.input<TInputSchema> extends ErrorInferenceObject
						? z4.input<TInputSchema>
						: ErrorInferenceObject,
					Awaited<TOutput>
				>
			>) & {
				queryString: string;
				orThrow: (
					input: TAccept extends 'form' ? FormData : z4.input<TInputSchema>,
				) => Promise<Awaited<TOutput>>;
			}
		: ((input?: any) => Promise<SafeResult<never, Awaited<TOutput>>>) & {
				orThrow: (input?: any) => Promise<Awaited<TOutput>>;
			};

export function getFormServerHandler<TOutput, TInputSchema extends z3.ZodType | z4.$ZodType>(
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

		let parsed;
		if ('_zod' in inputSchema) {
			const baseSchema = unwrapBaseZ4ObjectSchema(inputSchema, unparsedInput);
			parsed = await z4.safeParseAsync(
				inputSchema,
				baseSchema instanceof z4.$ZodObject
					? formDataToZ4Object(unparsedInput, baseSchema)
					: unparsedInput,
			);
		} else {
			const baseSchema = unwrapBaseZ3ObjectSchema(inputSchema, unparsedInput);
			parsed = await inputSchema.safeParseAsync(
				baseSchema instanceof z3.ZodObject
					? formDataToZ3Object(unparsedInput, baseSchema)
					: unparsedInput,
			);
		}

		if (!parsed.success) {
			throw new ActionInputError(parsed.error.issues);
		}
		return await handler(parsed.data, context);
	};
}

export function getJsonServerHandler<TOutput, TInputSchema extends z3.ZodType | z4.$ZodType>(
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
		const parsed =
			'_zod' in inputSchema
				? await z4.safeParseAsync(inputSchema, unparsedInput)
				: await inputSchema.safeParseAsync(unparsedInput);
		if (!parsed.success) {
			throw new ActionInputError(parsed.error.issues);
		}
		return await handler(parsed.data, context);
	};
}

/** Transform form data to an object based on a Zod schema. */
export function formDataToZ3Object<T extends z3.AnyZodObject>(
	formData: FormData,
	schema: T,
): Record<string, unknown> {
	const obj: Record<string, unknown> =
		schema._def.unknownKeys === 'passthrough' ? Object.fromEntries(formData.entries()) : {};
	for (const [key, baseValidator] of Object.entries(schema.shape)) {
		let validator = baseValidator;

		while (
			validator instanceof z3.ZodOptional ||
			validator instanceof z3.ZodNullable ||
			validator instanceof z3.ZodDefault
		) {
			// use default value when key is undefined
			if (validator instanceof z3.ZodDefault && !formData.has(key)) {
				obj[key] = validator._def.defaultValue();
			}
			validator = validator._def.innerType;
		}

		if (!formData.has(key) && key in obj) {
			// continue loop if form input is not found and default value is set
			continue;
		} else if (validator instanceof z3.ZodBoolean) {
			const val = formData.get(key);
			obj[key] = val === 'true' ? true : val === 'false' ? false : formData.has(key);
		} else if (validator instanceof z3.ZodArray) {
			obj[key] = handleZ3FormDataGetAll(key, formData, validator);
		} else {
			obj[key] = handleZ3FormDataGet(key, formData, validator, baseValidator);
		}
	}
	return obj;
}

/** Transform form data to an object based on a Zod schema. */
export function formDataToZ4Object<T extends z4.$ZodObject>(
	formData: FormData,
	schema: T,
): Record<string, unknown> {
	const obj: Record<string, unknown> = schema._zod.def.catchall
		? Object.fromEntries(formData.entries())
		: {};
	for (const [key, baseValidator] of Object.entries(schema._zod.def.shape)) {
		let validator = baseValidator;

		while (
			validator instanceof z4.$ZodOptional ||
			validator instanceof z4.$ZodNullable ||
			validator instanceof z4.$ZodDefault
		) {
			// use default value when key is undefined
			if (validator instanceof z4.$ZodDefault && !formData.has(key)) {
				obj[key] =
					validator._zod.def.defaultValue instanceof Function
						? validator._zod.def.defaultValue()
						: validator._zod.def.defaultValue;
			}
			validator = validator._zod.def.innerType;
		}

		if (!formData.has(key) && key in obj) {
			// continue loop if form input is not found and default value is set
			continue;
		} else if (validator instanceof z4.$ZodBoolean) {
			const val = formData.get(key);
			obj[key] = val === 'true' ? true : val === 'false' ? false : formData.has(key);
		} else if (validator instanceof z4.$ZodArray) {
			obj[key] = handleZ4FormDataGetAll(key, formData, validator);
		} else {
			obj[key] = handleZ4FormDataGet(key, formData, validator, baseValidator);
		}
	}
	return obj;
}

function handleZ3FormDataGetAll(
	key: string,
	formData: FormData,
	validator: z3.ZodArray<z3.ZodUnknown>,
) {
	const entries = Array.from(formData.getAll(key));
	const elementValidator = validator._def.type;
	if (elementValidator instanceof z3.ZodNumber) {
		return entries.map(Number);
	} else if (elementValidator instanceof z3.ZodBoolean) {
		return entries.map(Boolean);
	}
	return entries;
}

function handleZ4FormDataGetAll(key: string, formData: FormData, validator: z4.$ZodArray) {
	const entries = Array.from(formData.getAll(key));
	const elementValidator = validator._zod.def.element;
	if (elementValidator instanceof z4.$ZodNumber) {
		return entries.map(Number);
	} else if (elementValidator instanceof z4.$ZodBoolean) {
		return entries.map(Boolean);
	}
	return entries;
}

function handleZ3FormDataGet(
	key: string,
	formData: FormData,
	validator: unknown,
	baseValidator: unknown,
) {
	const value = formData.get(key);
	if (!value) {
		return baseValidator instanceof z3.ZodOptional ? undefined : null;
	}
	return validator instanceof z3.ZodNumber ? Number(value) : value;
}

function handleZ4FormDataGet(
	key: string,
	formData: FormData,
	validator: unknown,
	baseValidator: unknown,
) {
	const value = formData.get(key);
	if (!value) {
		return baseValidator instanceof z4.$ZodOptional ? undefined : null;
	}
	return validator instanceof z4.$ZodNumber ? Number(value) : value;
}

function unwrapBaseZ3ObjectSchema(schema: z3.ZodType, unparsedInput: FormData) {
	while (schema instanceof z3.ZodEffects || schema instanceof z3.ZodPipeline) {
		if (schema instanceof z3.ZodEffects) {
			schema = schema._def.schema;
		}
		if (schema instanceof z3.ZodPipeline) {
			schema = schema._def.in;
		}
	}
	if (schema instanceof z3.ZodDiscriminatedUnion) {
		const typeKey = schema._def.discriminator;
		const typeValue = unparsedInput.get(typeKey);
		if (typeof typeValue !== 'string') return schema;

		const objSchema = schema._def.optionsMap.get(typeValue);
		if (!objSchema) return schema;

		return objSchema;
	}
	return schema;
}

function unwrapBaseZ4ObjectSchema(schema: z4.$ZodType, unparsedInput: FormData) {
	if (schema instanceof z4.$ZodPipe) {
		return schema._zod.def.in;
	}
	if (schema instanceof z4.$ZodDiscriminatedUnion) {
		const typeKey = schema._zod.def.discriminator;
		const typeValue = unparsedInput.get(typeKey);
		if (typeof typeValue !== 'string') return schema;

		const objSchema = schema._zod.def.options.find((option) =>
			(option as any).def.shape[typeKey].values.has(typeValue),
		);
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
