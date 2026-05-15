import { stringify as devalueStringify } from 'devalue';
import * as z from 'zod/v4/core';
import { shouldAppendForwardSlash } from '../../core/build/util.js';
import { pipelineSymbol, REDIRECT_STATUS_CODES } from '../../core/constants.js';
import {
	ActionCalledFromServerError,
	ActionNotFoundError,
	ActionsReturnedInvalidDataError,
} from '../../core/errors/errors-data.js';
import { AstroError } from '../../core/errors/errors.js';
import { removeTrailingForwardSlash } from '../../core/path.js';
import { BodySizeLimitError, readBodyWithLimit } from '../../core/request-body.js';
import { ACTION_QUERY_PARAMS, ACTION_RPC_ROUTE_PATTERN } from '../consts.js';
import {
	ActionError,
	ActionInputError,
	actionResultErrorStack,
	deserializeActionResult,
} from './client.js';
function defineAction({ accept, input: inputSchema, handler }) {
	const serverHandler =
		accept === 'form'
			? getFormServerHandler(handler, inputSchema)
			: getJsonServerHandler(handler, inputSchema);
	async function safeServerHandler(unparsedInput) {
		if (typeof this === 'function' || !isActionAPIContext(this)) {
			throw new AstroError(ActionCalledFromServerError);
		}
		return callSafely(() => serverHandler(unparsedInput, this));
	}
	Object.assign(safeServerHandler, {
		orThrow(unparsedInput) {
			if (typeof this === 'function') {
				throw new AstroError(ActionCalledFromServerError);
			}
			return serverHandler(unparsedInput, this);
		},
	});
	return safeServerHandler;
}
function getFormServerHandler(handler, inputSchema) {
	return async (unparsedInput, context) => {
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
async function parseFormInput(inputSchema, unparsedInput) {
	const baseSchema = unwrapBaseZ4ObjectSchema(inputSchema, unparsedInput);
	const input =
		baseSchema instanceof z.$ZodObject
			? formDataToObject(unparsedInput, baseSchema)
			: unparsedInput;
	const parsed = await z.safeParseAsync(inputSchema, input);
	return parsed;
}
function getJsonServerHandler(handler, inputSchema) {
	return async (unparsedInput, context) => {
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
function getActionContext(context) {
	const callerInfo = getCallerInfo(context);
	const actionResultAlreadySet = Boolean(context.locals._actionPayload);
	let action = void 0;
	if (callerInfo && context.request.method === 'POST' && !actionResultAlreadySet) {
		action = {
			calledFrom: callerInfo.from,
			name: callerInfo.name,
			handler: async () => {
				const pipeline = Reflect.get(context, pipelineSymbol);
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
					if (
						error instanceof Error &&
						'name' in error &&
						typeof error.name === 'string' &&
						error.name === ActionNotFoundError.name
					) {
						return { data: void 0, error: new ActionError({ code: 'NOT_FOUND' }) };
					}
					throw error;
				}
				const bodySizeLimit = pipeline.manifest.actionBodySizeLimit;
				let input;
				try {
					input = await parseRequestBody(context.request, bodySizeLimit);
				} catch (e) {
					if (e instanceof ActionError) {
						return { data: void 0, error: e };
					}
					if (e instanceof TypeError) {
						return { data: void 0, error: new ActionError({ code: 'UNSUPPORTED_MEDIA_TYPE' }) };
					}
					throw e;
				}
				const omitKeys = ['props', 'getActionResult', 'callAction', 'redirect'];
				const actionAPIContext = Object.create(
					Object.getPrototypeOf(context),
					Object.fromEntries(
						Object.entries(Object.getOwnPropertyDescriptors(context)).filter(
							([key]) => !omitKeys.includes(key),
						),
					),
				);
				Reflect.set(actionAPIContext, ACTION_API_CONTEXT_SYMBOL, true);
				const handler = baseAction.bind(actionAPIContext);
				return handler(input);
			},
		};
	}
	function setActionResult(actionName, actionResult) {
		context.locals._actionPayload = {
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
function getCallerInfo(ctx) {
	if (ctx.routePattern === ACTION_RPC_ROUTE_PATTERN) {
		return { from: 'rpc', name: ctx.url.pathname.replace(/^.*\/_actions\//, '') };
	}
	const queryParam = ctx.url.searchParams.get(ACTION_QUERY_PARAMS.actionName);
	if (queryParam) {
		return { from: 'form', name: queryParam };
	}
	return void 0;
}
async function parseRequestBody(request, bodySizeLimit) {
	const contentType = request.headers.get('content-type');
	const contentLengthHeader = request.headers.get('content-length');
	const contentLength = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : void 0;
	const hasContentLength = typeof contentLength === 'number' && Number.isFinite(contentLength);
	if (!contentType) return void 0;
	if (hasContentLength && contentLength > bodySizeLimit) {
		throw new ActionError({
			code: 'CONTENT_TOO_LARGE',
			message: `Request body exceeds ${bodySizeLimit} bytes`,
		});
	}
	try {
		if (hasContentType(contentType, formContentTypes)) {
			if (!hasContentLength) {
				const body = await readBodyWithLimit(request.clone(), bodySizeLimit);
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
			if (contentLength === 0) return void 0;
			if (!hasContentLength) {
				const body = await readBodyWithLimit(request.clone(), bodySizeLimit);
				if (body.byteLength === 0) return void 0;
				return JSON.parse(new TextDecoder().decode(body));
			}
			return await request.clone().json();
		}
	} catch (e) {
		if (e instanceof BodySizeLimitError) {
			throw new ActionError({
				code: 'CONTENT_TOO_LARGE',
				message: `Request body exceeds ${bodySizeLimit} bytes`,
			});
		}
		throw e;
	}
	throw new TypeError('Unsupported content type');
}
const ACTION_API_CONTEXT_SYMBOL = /* @__PURE__ */ Symbol.for('astro.actionAPIContext');
const formContentTypes = ['application/x-www-form-urlencoded', 'multipart/form-data'];
function hasContentType(contentType, expected) {
	const type = contentType.split(';')[0].toLowerCase();
	return expected.some((t) => type === t);
}
function isActionAPIContext(ctx) {
	const symbol = Reflect.get(ctx, ACTION_API_CONTEXT_SYMBOL);
	return symbol === true;
}
function formDataToObject(formData, schema, prefix = '') {
	const formKeys = [...formData.keys()];
	const obj = schema._zod.def.catchall
		? Object.fromEntries(
				[...formData.entries()]
					.filter(([k]) => k.startsWith(prefix))
					.map(([k, v]) => [k.slice(prefix.length), v]),
			)
		: {};
	for (const [key, baseValidator] of Object.entries(schema._zod.def.shape)) {
		const prefixedKey = prefix + key;
		let validator = baseValidator;
		while (
			validator instanceof z.$ZodOptional ||
			validator instanceof z.$ZodNullable ||
			validator instanceof z.$ZodDefault
		) {
			if (validator instanceof z.$ZodDefault && !formDataHasKeyOrPrefix(formKeys, prefixedKey)) {
				obj[key] =
					validator._zod.def.defaultValue instanceof Function
						? validator._zod.def.defaultValue()
						: validator._zod.def.defaultValue;
			}
			validator = validator._zod.def.innerType;
		}
		while (validator instanceof z.$ZodPipe) {
			validator = validator._zod.def.in;
		}
		if (validator instanceof z.$ZodDiscriminatedUnion) {
			const typeKey = validator._zod.def.discriminator;
			const typeValue = formData.get(prefixedKey + '.' + typeKey);
			if (typeof typeValue === 'string') {
				const match = validator._zod.def.options.find((option) =>
					option.def.shape[typeKey].values.has(typeValue),
				);
				if (match) {
					validator = match;
				}
			}
		}
		if (validator instanceof z.$ZodObject) {
			const nestedPrefix = prefixedKey + '.';
			const hasNestedKeys = formKeys.some((k) => k.startsWith(nestedPrefix));
			if (hasNestedKeys) {
				obj[key] = formDataToObject(formData, validator, nestedPrefix);
			} else if (!(key in obj)) {
				obj[key] = baseValidator instanceof z.$ZodNullable ? null : void 0;
			}
		} else if (!formData.has(prefixedKey) && key in obj) {
			continue;
		} else if (validator instanceof z.$ZodBoolean) {
			const val = formData.get(prefixedKey);
			obj[key] = val === 'true' ? true : val === 'false' ? false : formData.has(prefixedKey);
		} else if (validator instanceof z.$ZodArray) {
			obj[key] = handleFormDataGetAll(prefixedKey, formData, validator);
		} else {
			obj[key] = handleFormDataGet(prefixedKey, formData, validator, baseValidator);
		}
	}
	return obj;
}
function formDataHasKeyOrPrefix(formKeys, key) {
	const prefix = key + '.';
	return formKeys.some((k) => k === key || k.startsWith(prefix));
}
function handleFormDataGetAll(key, formData, validator) {
	const entries = Array.from(formData.getAll(key));
	const elementValidator = validator._zod.def.element;
	if (elementValidator instanceof z.$ZodNumber) {
		return entries.map(Number);
	} else if (elementValidator instanceof z.$ZodBoolean) {
		return entries.map((v) => (v === 'true' ? true : v === 'false' ? false : Boolean(v)));
	}
	return entries;
}
function handleFormDataGet(key, formData, validator, baseValidator) {
	const value = formData.get(key);
	if (!value) {
		return baseValidator instanceof z.$ZodOptional ? void 0 : null;
	}
	return validator instanceof z.$ZodNumber ? Number(value) : value;
}
function unwrapBaseZ4ObjectSchema(schema, unparsedInput) {
	if (schema instanceof z.$ZodPipe) {
		return unwrapBaseZ4ObjectSchema(schema._zod.def.in, unparsedInput);
	}
	if (schema instanceof z.$ZodDiscriminatedUnion) {
		const typeKey = schema._zod.def.discriminator;
		const typeValue = unparsedInput.get(typeKey);
		if (typeof typeValue !== 'string') return schema;
		const objSchema = schema._zod.def.options.find((option) =>
			option.def.shape[typeKey].values.has(typeValue),
		);
		if (!objSchema) return schema;
		return objSchema;
	}
	return schema;
}
async function callSafely(handler) {
	try {
		const data = await handler();
		return { data, error: void 0 };
	} catch (e) {
		if (e instanceof ActionError) {
			return { data: void 0, error: e };
		}
		return {
			data: void 0,
			error: new ActionError({
				message: e instanceof Error ? e.message : 'Unknown error',
				code: 'INTERNAL_SERVER_ERROR',
			}),
		};
	}
}
function serializeActionResult(res) {
	if (res.error) {
		if (import.meta.env?.DEV) {
			actionResultErrorStack.set(res.error.stack);
		}
		let body2;
		if (res.error instanceof ActionInputError) {
			body2 = {
				type: res.error.type,
				issues: res.error.issues,
				fields: res.error.fields,
			};
		} else {
			body2 = {
				...res.error,
				message: res.error.message,
			};
		}
		return {
			type: 'error',
			status: res.error.status,
			contentType: 'application/json',
			body: JSON.stringify(body2),
		};
	}
	if (res.data === void 0) {
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
			hint = REDIRECT_STATUS_CODES.includes(res.data.status)
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
function toArrayBuffer(buffer) {
	const copy = new Uint8Array(buffer.byteLength);
	copy.set(buffer);
	return copy.buffer;
}
export {
	ACTION_API_CONTEXT_SYMBOL,
	defineAction,
	formDataToObject,
	getActionContext,
	serializeActionResult,
};
