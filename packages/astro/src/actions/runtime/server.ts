import { stringify as devalueStringify } from 'devalue';
import { z } from 'zod';
import type { Pipeline } from '../../core/base-pipeline.js';
import { shouldAppendForwardSlash } from '../../core/build/util.js';
import { pipelineSymbol, REDIRECT_STATUS_CODES } from '../../core/constants.js';
import { AstroError } from '../../core/errors/errors.js';
import {
	ActionCalledFromServerError,
	ActionNotFoundError,
	ActionsReturnedInvalidDataError,
} from '../../core/errors/errors-data.js';
import { removeTrailingForwardSlash } from '../../core/path.js';
import type { APIContext } from '../../types/public/index.js';
import { ACTION_QUERY_PARAMS, ACTION_RPC_ROUTE_PATTERN } from '../consts.js';
import {
	ActionError,
	ActionInputError,
	actionResultErrorStack,
	deserializeActionResult,
} from './client.js';
import type {
	ActionAccept,
	ActionAPIContext,
	ActionClient,
	ActionHandler,
	ActionsLocals,
	MaybePromise,
	SafeResult,
	SerializedActionResult,
} from './types.js';

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
export function getActionContext(context: APIContext): AstroActionContext {
	const callerInfo = getCallerInfo(context);

	// Prevents action results from being handled on a rewrite.
	// Also prevents our *own* fallback middleware from running
	// if the user's middleware has already handled the result.
	const actionResultAlreadySet = Boolean((context.locals as ActionsLocals)._actionPayload);

	let action: AstroActionContext['action'] = undefined;

	if (callerInfo && context.request.method === 'POST' && !actionResultAlreadySet) {
		action = {
			calledFrom: callerInfo.from,
			name: callerInfo.name,
			handler: async () => {
				const pipeline: Pipeline = Reflect.get(context, pipelineSymbol);
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
		(context.locals as ActionsLocals)._actionPayload = {
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

export function astroCalledServerError(): AstroError {
	return new AstroError(ActionCalledFromServerError);
}

export const ACTION_API_CONTEXT_SYMBOL = Symbol.for('astro.actionAPIContext');

const formContentTypes = ['application/x-www-form-urlencoded', 'multipart/form-data'];

function hasContentType(contentType: string, expected: string[]) {
	// Split off parameters like charset or boundary
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type#content-type_in_html_forms
	const type = contentType.split(';')[0].toLowerCase();

	return expected.some((t) => type === t);
}

function isActionAPIContext(ctx: ActionAPIContext): boolean {
	const symbol = Reflect.get(ctx, ACTION_API_CONTEXT_SYMBOL);
	return symbol === true;
}

/** Transform form data to an object based on a Zod schema. */
export function formDataToObject<T extends z.AnyZodObject>(
	formData: FormData,
	schema: T,
): Record<string, unknown> {
	const obj: Record<string, unknown> =
		schema._def.unknownKeys === 'passthrough' ? Object.fromEntries(formData.entries()) : {};
	for (const [key, baseValidator] of Object.entries(schema.shape)) {
		let validator = baseValidator;

		while (
			validator instanceof z.ZodOptional ||
			validator instanceof z.ZodNullable ||
			validator instanceof z.ZodDefault
		) {
			// use default value when key is undefined
			if (validator instanceof z.ZodDefault && !formData.has(key)) {
				obj[key] = validator._def.defaultValue();
			}
			validator = validator._def.innerType;
		}

		if (!formData.has(key) && key in obj) {
			// continue loop if form input is not found and default value is set
			continue;
		} else if (validator instanceof z.ZodBoolean) {
			const val = formData.get(key);
			obj[key] = val === 'true' ? true : val === 'false' ? false : formData.has(key);
		} else if (validator instanceof z.ZodArray) {
			obj[key] = handleFormDataGetAll(key, formData, validator);
		} else {
			obj[key] = handleFormDataGet(key, formData, validator, baseValidator);
		}
	}
	return obj;
}

function handleFormDataGetAll(
	key: string,
	formData: FormData,
	validator: z.ZodArray<z.ZodUnknown>,
) {
	const entries = Array.from(formData.getAll(key));
	const elementValidator = validator._def.type;
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

function unwrapBaseObjectSchema(schema: z.ZodType, unparsedInput: FormData) {
	while (schema instanceof z.ZodEffects || schema instanceof z.ZodPipeline) {
		if (schema instanceof z.ZodEffects) {
			schema = schema._def.schema;
		}
		if (schema instanceof z.ZodPipeline) {
			schema = schema._def.in;
		}
	}
	if (schema instanceof z.ZodDiscriminatedUnion) {
		const typeKey = schema._def.discriminator;
		const typeValue = unparsedInput.get(typeKey);
		if (typeof typeValue !== 'string') return schema;

		const objSchema = schema._def.optionsMap.get(typeValue);
		if (!objSchema) return schema;

		return objSchema;
	}
	return schema;
}

async function callSafely<TOutput>(
	handler: () => MaybePromise<TOutput>,
): Promise<SafeResult<z.ZodType, TOutput>> {
	try {
		const data = await handler();
		return { data, error: undefined };
	} catch (e) {
		if (e instanceof ActionError) {
			return { data: undefined, error: e };
		}
		return {
			data: undefined,
			error: new ActionError({
				message: e instanceof Error ? e.message : 'Unknown error',
				code: 'INTERNAL_SERVER_ERROR',
			}),
		};
	}
}

export function serializeActionResult(res: SafeResult<any, any>): SerializedActionResult {
	if (res.error) {
		if (import.meta.env?.DEV) {
			actionResultErrorStack.set(res.error.stack);
		}

		let body: Record<string, any>;
		if (res.error instanceof ActionInputError) {
			body = {
				type: res.error.type,
				issues: res.error.issues,
				fields: res.error.fields,
			};
		} else {
			body = {
				...res.error,
				message: res.error.message,
			};
		}

		return {
			type: 'error',
			status: res.error.status,
			contentType: 'application/json',
			body: JSON.stringify(body),
		};
	}
	if (res.data === undefined) {
		return {
			type: 'empty',
			status: 204,
		};
	}
	let body;
	try {
		body = devalueStringify(res.data, {
			// Add support for URL objects
			URL: (value) => value instanceof URL && value.href,
		});
	} catch (e) {
		let hint = ActionsReturnedInvalidDataError.hint;
		if (res.data instanceof Response) {
			hint = REDIRECT_STATUS_CODES.includes(res.data.status as any)
				? 'If you need to redirect when the action succeeds, trigger a redirect where the action is called. See the Actions guide for server and client redirect examples: https://docs.astro.build/en/guides/actions.'
				: 'If you need to return a Response object, try using a server endpoint instead. See https://docs.astro.build/en/guides/endpoints/#server-endpoints-api-routes';
		}
		throw new AstroError({
			...ActionsReturnedInvalidDataError,
			message: ActionsReturnedInvalidDataError.message(String(e)),
			hint,
		});
	}
	return {
		type: 'data',
		status: 200,
		contentType: 'application/json+devalue',
		body,
	};
}
