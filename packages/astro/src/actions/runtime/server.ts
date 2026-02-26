import { stringify as devalueStringify } from 'devalue';
import * as z from 'zod/v4/core';
import type { Pipeline } from '../../core/base-pipeline.js';
import { shouldAppendForwardSlash } from '../../core/build/util.js';
import { pipelineSymbol, REDIRECT_STATUS_CODES } from '../../core/constants.js';
import {
	ActionCalledFromServerError,
	ActionNotFoundError,
	ActionsReturnedInvalidDataError,
} from '../../core/errors/errors-data.js';
import { AstroError } from '../../core/errors/errors.js';
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
	TInputSchema extends z.$ZodType | undefined = TAccept extends 'form'
		? // If `input` is omitted, default to `FormData` for forms and `any` for JSON.
			z.$ZodType<FormData>
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

function getFormServerHandler<TOutput, TInputSchema extends z.$ZodType>(
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

		const parsed = await parseFormInput(inputSchema, unparsedInput);

		if (!parsed.success) {
			throw new ActionInputError(parsed.error.issues);
		}
		return await handler(parsed.data, context);
	};
}

async function parseFormInput(inputSchema: z.$ZodType, unparsedInput: FormData) {
	const baseSchema = unwrapBaseZ4ObjectSchema(inputSchema, unparsedInput);
	const input =
		baseSchema instanceof z.$ZodObject
			? formDataToObject(unparsedInput, baseSchema)
			: unparsedInput;

	const parsed = await z.safeParseAsync(inputSchema, input);
	return parsed;
}

function getJsonServerHandler<TOutput, TInputSchema extends z.$ZodType>(
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
		const parsed = await z.safeParseAsync(inputSchema, unparsedInput);
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

				const bodySizeLimit = pipeline.manifest.actionBodySizeLimit;
				let input;
				try {
					input = await parseRequestBody(context.request, bodySizeLimit);
				} catch (e) {
					if (e instanceof ActionError) {
						return { data: undefined, error: e };
					}
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

async function parseRequestBody(request: Request, bodySizeLimit: number) {
	const contentType = request.headers.get('content-type');
	const contentLengthHeader = request.headers.get('content-length');
	const contentLength = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : undefined;
	const hasContentLength = typeof contentLength === 'number' && Number.isFinite(contentLength);

	if (!contentType) return undefined;
	if (hasContentLength && contentLength > bodySizeLimit) {
		throw new ActionError({
			code: 'CONTENT_TOO_LARGE',
			message: `Request body exceeds ${bodySizeLimit} bytes`,
		});
	}
	if (hasContentType(contentType, formContentTypes)) {
		if (!hasContentLength) {
			const body = await readRequestBodyWithLimit(request.clone(), bodySizeLimit);
			const formRequest = new Request(request.url, {
				method: request.method,
				headers: request.headers,
				body: toArrayBuffer(body),
			});
			return await formRequest.formData();
		}
		return await request.clone().formData();
	}
	if (hasContentType(contentType, ['application/json'])) {
		if (contentLength === 0) return undefined;
		if (!hasContentLength) {
			const body = await readRequestBodyWithLimit(request.clone(), bodySizeLimit);
			if (body.byteLength === 0) return undefined;
			return JSON.parse(new TextDecoder().decode(body));
		}
		return await request.clone().json();
	}
	throw new TypeError('Unsupported content type');
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
export function formDataToObject<T extends z.$ZodObject>(
	formData: FormData,
	schema: T,
): Record<string, unknown> {
	const obj: Record<string, unknown> = schema._zod.def.catchall
		? Object.fromEntries(formData.entries())
		: {};
	for (const [key, baseValidator] of Object.entries(schema._zod.def.shape)) {
		let validator = baseValidator;

		while (
			validator instanceof z.$ZodOptional ||
			validator instanceof z.$ZodNullable ||
			validator instanceof z.$ZodDefault
		) {
			// use default value when key is undefined
			if (validator instanceof z.$ZodDefault && !formData.has(key)) {
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
		} else if (validator instanceof z.$ZodBoolean) {
			const val = formData.get(key);
			obj[key] = val === 'true' ? true : val === 'false' ? false : formData.has(key);
		} else if (validator instanceof z.$ZodArray) {
			obj[key] = handleFormDataGetAll(key, formData, validator);
		} else {
			obj[key] = handleFormDataGet(key, formData, validator, baseValidator);
		}
	}
	return obj;
}

function handleFormDataGetAll(key: string, formData: FormData, validator: z.$ZodArray) {
	const entries = Array.from(formData.getAll(key));
	const elementValidator = validator._zod.def.element;
	if (elementValidator instanceof z.$ZodNumber) {
		return entries.map(Number);
	} else if (elementValidator instanceof z.$ZodBoolean) {
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
		return baseValidator instanceof z.$ZodOptional ? undefined : null;
	}
	return validator instanceof z.$ZodNumber ? Number(value) : value;
}

function unwrapBaseZ4ObjectSchema(schema: z.$ZodType, unparsedInput: FormData) {
	if (schema instanceof z.$ZodPipe) {
		return unwrapBaseZ4ObjectSchema(schema._zod.def.in, unparsedInput);
	}
	if (schema instanceof z.$ZodDiscriminatedUnion) {
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

async function callSafely<TOutput>(
	handler: () => MaybePromise<TOutput>,
): Promise<SafeResult<z.$ZodType, TOutput>> {
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
async function readRequestBodyWithLimit(request: Request, limit: number): Promise<Uint8Array> {
	if (!request.body) return new Uint8Array();
	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let received = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		if (value) {
			received += value.byteLength;
			if (received > limit) {
				throw new ActionError({
					code: 'CONTENT_TOO_LARGE',
					message: `Request body exceeds ${limit} bytes`,
				});
			}
			chunks.push(value);
		}
	}
	const buffer = new Uint8Array(received);
	let offset = 0;
	for (const chunk of chunks) {
		buffer.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return buffer;
}

function toArrayBuffer(buffer: Uint8Array): ArrayBuffer {
	const copy = new Uint8Array(buffer.byteLength);
	copy.set(buffer);
	return copy.buffer;
}
