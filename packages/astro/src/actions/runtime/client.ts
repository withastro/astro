// It's safe to import this file on both server and client

import { parse as devalueParse } from 'devalue';
import type * as z from 'zod/v4/core';
import { ACTION_QUERY_PARAMS } from '../consts.js';
import type {
	ActionClient,
	ActionErrorCode,
	ErrorInferenceObject,
	SafeResult,
	SerializedActionResult,
} from './types.js';
import { appendForwardSlash } from '../../core/path.js';
import type { APIContext } from '../../types/public/context.js';

export const codeToStatusMap = {
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
} satisfies Record<string, number>;

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

export class ActionInputError<T extends ErrorInferenceObject> extends ActionError {
	type = 'AstroActionInputError';

	// We don't expose all ZodError properties.
	// Not all properties will serialize from server to client,
	// and we don't want to import the full ZodError object into the client.

	issues: z.$ZodIssue[];
	fields: { [P in keyof T]?: string[] | undefined };

	constructor(issues: z.$ZodIssue[]) {
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
export const actionResultErrorStack = (function actionResultErrorStackFn() {
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

export function getActionQueryString(name: string) {
	const searchParams = new URLSearchParams({ [ACTION_QUERY_PARAMS.actionName]: name });
	return `?${searchParams.toString()}`;
}

export function getActionPathFromString({
	baseUrl,
	shouldAppendTrailingSlash,
	path: input,
}: {
	baseUrl: string;
	shouldAppendTrailingSlash: boolean;
	path: string;
}) {
	let path = `${baseUrl.replace(/\/$/, '')}/_actions/${new URLSearchParams(input).get(ACTION_QUERY_PARAMS.actionName)}`;
	if (shouldAppendTrailingSlash) {
		path = appendForwardSlash(path);
	}
	return path;
}

export function createGetActionPath(
	options: Pick<
		Parameters<typeof getActionPathFromString>[0],
		'baseUrl' | 'shouldAppendTrailingSlash'
	>,
) {
	return function getActionPath(action: ActionClient<any, any, any>) {
		return getActionPathFromString({
			baseUrl: options.baseUrl,
			shouldAppendTrailingSlash: options.shouldAppendTrailingSlash,
			path: action.toString(),
		});
	};
}

const ENCODED_DOT = '%2E';

export function createActionsProxy({
	actionCallback = {},
	aggregatedPath = '',
	handleAction,
}: {
	actionCallback?: Record<string | symbol, any>;
	aggregatedPath?: string;
	handleAction: (
		param: any,
		path: string,
		context: APIContext | undefined,
	) => Promise<SafeResult<any, any>>;
}) {
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
			return createActionsProxy({
				actionCallback: action,
				aggregatedPath: path + '.',
				handleAction,
			});
		},
	});
}
