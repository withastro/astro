// TODO: shouldn't live here
import { shouldAppendTrailingSlash } from 'virtual:astro:actions/options';
import { parse as devalueParse, stringify as devalueStringify } from 'devalue';
import type * as z3 from 'zod/v3';
import type * as z4 from 'zod/v4/core';
import { REDIRECT_STATUS_CODES } from '../../core/constants.js';
import { AstroError } from '../../core/errors/errors.js';
import {
	ActionCalledFromServerError,
	ActionsReturnedInvalidDataError,
} from '../../core/errors/errors-data.js';
import { appendForwardSlash as _appendForwardSlash } from '../../core/path.js';
import type { APIContext } from '../../types/public/context.js';
import { ACTION_QUERY_PARAMS as _ACTION_QUERY_PARAMS } from '../consts.js';
import type { ActionClient } from './server.js';
import type {
	ActionAPIContext as _ActionAPIContext,
	ErrorInferenceObject,
	MaybePromise,
} from './utils.js';

export type ActionAPIContext = _ActionAPIContext;
export const ACTION_QUERY_PARAMS = _ACTION_QUERY_PARAMS;

export const appendForwardSlash = _appendForwardSlash;

export const ACTION_ERROR_CODES = [
	'BAD_REQUEST',
	'UNAUTHORIZED',
	'PAYMENT_REQUIRED',
	'FORBIDDEN',
	'NOT_FOUND',
	'METHOD_NOT_ALLOWED',
	'NOT_ACCEPTABLE',
	'PROXY_AUTHENTICATION_REQUIRED',
	'REQUEST_TIMEOUT',
	'CONFLICT',
	'GONE',
	'LENGTH_REQUIRED',
	'PRECONDITION_FAILED',
	'CONTENT_TOO_LARGE',
	'URI_TOO_LONG',
	'UNSUPPORTED_MEDIA_TYPE',
	'RANGE_NOT_SATISFIABLE',
	'EXPECTATION_FAILED',
	'MISDIRECTED_REQUEST',
	'UNPROCESSABLE_CONTENT',
	'LOCKED',
	'FAILED_DEPENDENCY',
	'TOO_EARLY',
	'UPGRADE_REQUIRED',
	'PRECONDITION_REQUIRED',
	'TOO_MANY_REQUESTS',
	'REQUEST_HEADER_FIELDS_TOO_LARGE',
	'UNAVAILABLE_FOR_LEGAL_REASONS',
	'INTERNAL_SERVER_ERROR',
	'NOT_IMPLEMENTED',
	'BAD_GATEWAY',
	'SERVICE_UNAVAILABLE',
	'GATEWAY_TIMEOUT',
	'HTTP_VERSION_NOT_SUPPORTED',
	'VARIANT_ALSO_NEGOTIATES',
	'INSUFFICIENT_STORAGE',
	'LOOP_DETECTED',
	'NETWORK_AUTHENTICATION_REQUIRED',
] as const;

export type ActionErrorCode = (typeof ACTION_ERROR_CODES)[number];

const codeToStatusMap: Record<ActionErrorCode, number> = {
	// Implemented from IANA HTTP Status Code Registry
	// https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	PAYMENT_REQUIRED: 402,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	METHOD_NOT_ALLOWED: 405,
	NOT_ACCEPTABLE: 406,
	PROXY_AUTHENTICATION_REQUIRED: 407,
	REQUEST_TIMEOUT: 408,
	CONFLICT: 409,
	GONE: 410,
	LENGTH_REQUIRED: 411,
	PRECONDITION_FAILED: 412,
	CONTENT_TOO_LARGE: 413,
	URI_TOO_LONG: 414,
	UNSUPPORTED_MEDIA_TYPE: 415,
	RANGE_NOT_SATISFIABLE: 416,
	EXPECTATION_FAILED: 417,
	MISDIRECTED_REQUEST: 421,
	UNPROCESSABLE_CONTENT: 422,
	LOCKED: 423,
	FAILED_DEPENDENCY: 424,
	TOO_EARLY: 425,
	UPGRADE_REQUIRED: 426,
	PRECONDITION_REQUIRED: 428,
	TOO_MANY_REQUESTS: 429,
	REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
	UNAVAILABLE_FOR_LEGAL_REASONS: 451,
	INTERNAL_SERVER_ERROR: 500,
	NOT_IMPLEMENTED: 501,
	BAD_GATEWAY: 502,
	SERVICE_UNAVAILABLE: 503,
	GATEWAY_TIMEOUT: 504,
	HTTP_VERSION_NOT_SUPPORTED: 505,
	VARIANT_ALSO_NEGOTIATES: 506,
	INSUFFICIENT_STORAGE: 507,
	LOOP_DETECTED: 508,
	NETWORK_AUTHENTICATION_REQUIRED: 511,
};

const statusToCodeMap: Record<number, ActionErrorCode> = Object.entries(codeToStatusMap).reduce(
	// reverse the key-value pairs
	(acc, [key, value]) => ({ ...acc, [value]: key }),
	{},
);

// T is used for error inference with SafeInput -> isInputError.
// See: https://github.com/withastro/astro/pull/11173/files#r1622767246
export class ActionError<_T extends ErrorInferenceObject = ErrorInferenceObject> extends Error {
	type = 'AstroActionError';
	code: ActionErrorCode = 'INTERNAL_SERVER_ERROR';
	status = 500;

	constructor(params: { message?: string; code: ActionErrorCode; stack?: string }) {
		super(params.message);
		this.code = params.code;
		this.status = ActionError.codeToStatus(params.code);
		if (params.stack) {
			this.stack = params.stack;
		}
	}

	static codeToStatus(code: ActionErrorCode): number {
		return codeToStatusMap[code];
	}

	static statusToCode(status: number): ActionErrorCode {
		return statusToCodeMap[status] ?? 'INTERNAL_SERVER_ERROR';
	}

	static fromJson(body: any) {
		if (isInputError(body)) {
			return new ActionInputError(body.issues);
		}
		if (isActionError(body)) {
			return new ActionError(body);
		}
		return new ActionError({
			code: 'INTERNAL_SERVER_ERROR',
		});
	}
}

export function isActionError(error?: unknown): error is ActionError {
	return (
		typeof error === 'object' &&
		error != null &&
		'type' in error &&
		error.type === 'AstroActionError'
	);
}

export function isInputError<T extends ErrorInferenceObject>(
	error?: ActionError<T>,
): error is ActionInputError<T>;
export function isInputError(error?: unknown): error is ActionInputError<ErrorInferenceObject>;
export function isInputError<T extends ErrorInferenceObject>(
	error?: unknown | ActionError<T>,
): error is ActionInputError<T> {
	return (
		typeof error === 'object' &&
		error != null &&
		'type' in error &&
		error.type === 'AstroActionInputError' &&
		'issues' in error &&
		Array.isArray(error.issues)
	);
}

export type SafeResult<TInput extends ErrorInferenceObject, TOutput> =
	| {
			data: TOutput;
			error: undefined;
	  }
	| {
			data: undefined;
			error: ActionError<TInput>;
	  };

export class ActionInputError<T extends ErrorInferenceObject> extends ActionError {
	type = 'AstroActionInputError';

	// We don't expose all ZodError properties.
	// Not all properties will serialize from server to client,
	// and we don't want to import the full ZodError object into the client.

	issues: z3.ZodIssue[] | z4.$ZodIssue[];
	fields: { [P in keyof T]?: string[] | undefined };

	constructor(issues: z3.ZodIssue[] | z4.$ZodIssue[]) {
		super({
			message: `Failed to validate: ${JSON.stringify(issues, null, 2)}`,
			code: 'BAD_REQUEST',
		});
		this.issues = issues;
		this.fields = {};
		for (const issue of issues) {
			if (issue.path.length > 0) {
				const key = issue.path[0].toString() as keyof typeof this.fields;
				this.fields[key] ??= [];
				this.fields[key]?.push(issue.message);
			}
		}
	}
}

export async function callSafely<TOutput>(
	handler: () => MaybePromise<TOutput>,
): Promise<SafeResult<z3.ZodType | z4.$ZodType, TOutput>> {
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

export function getActionQueryString(name: string) {
	const searchParams = new URLSearchParams({ [_ACTION_QUERY_PARAMS.actionName]: name });
	return `?${searchParams.toString()}`;
}

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

export function deserializeActionResult(res: SerializedActionResult): SafeResult<any, any> {
	if (res.type === 'error') {
		let json;
		try {
			json = JSON.parse(res.body);
		} catch {
			return {
				data: undefined,
				error: new ActionError({
					message: res.body,
					code: 'INTERNAL_SERVER_ERROR',
				}),
			};
		}
		if (import.meta.env?.PROD) {
			return { error: ActionError.fromJson(json), data: undefined };
		} else {
			const error = ActionError.fromJson(json);
			error.stack = actionResultErrorStack.get();
			return {
				error,
				data: undefined,
			};
		}
	}
	if (res.type === 'empty') {
		return { data: undefined, error: undefined };
	}
	return {
		data: devalueParse(res.body, {
			URL: (href) => new URL(href),
		}),
		error: undefined,
	};
}

// in-memory singleton to save the stack trace
const actionResultErrorStack = (function actionResultErrorStackFn() {
	let errorStack: string | undefined;
	return {
		set(stack: string | undefined) {
			errorStack = stack;
		},
		get() {
			return errorStack;
		},
	};
})();

export function astroCalledServerError(): AstroError {
	return new AstroError(ActionCalledFromServerError);
}

const apiContextRoutesSymbol = Symbol.for('context.routes');
const ENCODED_DOT = '%2E';

function toActionProxy(actionCallback: Record<string | symbol, any> = {}, aggregatedPath = '') {
	return new Proxy(actionCallback, {
		get(target, objKey) {
			if (target.hasOwnProperty(objKey) || typeof objKey === 'symbol') {
				return target[objKey];
			}
			// Add the key, encoding dots so they're not interpreted as nested properties.
			const path =
				aggregatedPath + encodeURIComponent(objKey.toString()).replaceAll('.', ENCODED_DOT);
			function action(this: APIContext | undefined, param: any) {
				return handleAction(param, path, this);
			}

			Object.assign(action, {
				queryString: getActionQueryString(path),
				toString: () => (action as any).queryString,
				// redefine prototype methods as the object's own property, not the prototype's
				bind: action.bind,
				valueOf: () => action.valueOf,
				// Progressive enhancement info for React.
				$$FORM_ACTION: function () {
					const searchParams = new URLSearchParams(action.toString());
					return {
						method: 'POST',
						// `name` creates a hidden input.
						// It's unused by Astro, but we can't turn this off.
						// At least use a name that won't conflict with a user's formData.
						name: '_astroAction',
						action: '?' + searchParams.toString(),
					};
				},
				// Note: `orThrow` does not have progressive enhancement info.
				// If you want to throw exceptions,
				//  you must handle those exceptions with client JS.
				async orThrow(this: APIContext | undefined, param: any) {
					const { data, error } = await handleAction(param, path, this);
					if (error) throw error;
					return data;
				},
			});

			// recurse to construct queries for nested object paths
			// ex. actions.user.admins.auth()
			return toActionProxy(action, path + '.');
		},
	});
}

function _getActionPath(toString: () => string) {
	let path = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/_actions/${new URLSearchParams(toString()).get(ACTION_QUERY_PARAMS.actionName)}`;
	if (shouldAppendTrailingSlash) {
		path = appendForwardSlash(path);
	}
	return path;
}

export function getActionPath(action: ActionClient<any, any, any>) {
	return _getActionPath(action.toString);
}

async function handleAction(
	param: any,
	path: string,
	context: APIContext | undefined,
): Promise<SafeResult<any, any>> {
	// When running server-side, import the action and call it.
	if (import.meta.env.SSR && context) {
		const pipeline = Reflect.get(context, apiContextRoutesSymbol);
		if (!pipeline) {
			throw astroCalledServerError();
		}
		const action = await pipeline.getAction(path);
		if (!action) throw new Error(`Action not found: ${path}`);
		return action.bind(context)(param);
	}

	// When running client-side, make a fetch request to the action path.
	const headers = new Headers();
	headers.set('Accept', 'application/json');
	let body = param;
	if (!(body instanceof FormData)) {
		try {
			body = JSON.stringify(param);
		} catch (e) {
			throw new ActionError({
				code: 'BAD_REQUEST',
				message: `Failed to serialize request body to JSON. Full error: ${(e as Error).message}`,
			});
		}
		if (body) {
			headers.set('Content-Type', 'application/json');
		} else {
			headers.set('Content-Length', '0');
		}
	}
	const rawResult = await fetch(
		_getActionPath(() => getActionQueryString(path)),
		{
			method: 'POST',
			body,
			headers,
		},
	);

	if (rawResult.status === 204) {
		return deserializeActionResult({ type: 'empty', status: 204 });
	}

	const bodyText = await rawResult.text();

	if (rawResult.ok) {
		return deserializeActionResult({
			type: 'data',
			body: bodyText,
			status: 200,
			contentType: 'application/json+devalue',
		});
	}

	return deserializeActionResult({
		type: 'error',
		body: bodyText,
		status: rawResult.status,
		contentType: 'application/json',
	});
}

export const actions = toActionProxy();
