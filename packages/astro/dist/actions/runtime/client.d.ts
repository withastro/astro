import type * as z from 'zod/v4/core';
import type {
	ActionClient,
	ActionErrorCode,
	ErrorInferenceObject,
	SafeResult,
	SerializedActionResult,
} from './types.js';
import type { APIContext } from '../../types/public/context.js';
export declare const codeToStatusMap: {
	BAD_REQUEST: number;
	UNAUTHORIZED: number;
	PAYMENT_REQUIRED: number;
	FORBIDDEN: number;
	NOT_FOUND: number;
	METHOD_NOT_ALLOWED: number;
	NOT_ACCEPTABLE: number;
	PROXY_AUTHENTICATION_REQUIRED: number;
	REQUEST_TIMEOUT: number;
	CONFLICT: number;
	GONE: number;
	LENGTH_REQUIRED: number;
	PRECONDITION_FAILED: number;
	CONTENT_TOO_LARGE: number;
	URI_TOO_LONG: number;
	UNSUPPORTED_MEDIA_TYPE: number;
	RANGE_NOT_SATISFIABLE: number;
	EXPECTATION_FAILED: number;
	MISDIRECTED_REQUEST: number;
	UNPROCESSABLE_CONTENT: number;
	LOCKED: number;
	FAILED_DEPENDENCY: number;
	TOO_EARLY: number;
	UPGRADE_REQUIRED: number;
	PRECONDITION_REQUIRED: number;
	TOO_MANY_REQUESTS: number;
	REQUEST_HEADER_FIELDS_TOO_LARGE: number;
	UNAVAILABLE_FOR_LEGAL_REASONS: number;
	INTERNAL_SERVER_ERROR: number;
	NOT_IMPLEMENTED: number;
	BAD_GATEWAY: number;
	SERVICE_UNAVAILABLE: number;
	GATEWAY_TIMEOUT: number;
	HTTP_VERSION_NOT_SUPPORTED: number;
	VARIANT_ALSO_NEGOTIATES: number;
	INSUFFICIENT_STORAGE: number;
	LOOP_DETECTED: number;
	NETWORK_AUTHENTICATION_REQUIRED: number;
};
export declare class ActionError<
	_T extends ErrorInferenceObject = ErrorInferenceObject,
> extends Error {
	type: string;
	code: ActionErrorCode;
	status: number;
	constructor(params: { message?: string; code: ActionErrorCode; stack?: string });
	static codeToStatus(code: ActionErrorCode): number;
	static statusToCode(status: number): ActionErrorCode;
	static fromJson(body: any): ActionError<ErrorInferenceObject>;
}
export declare function isActionError(error?: unknown): error is ActionError;
export declare function isInputError<T extends ErrorInferenceObject>(
	error?: ActionError<T>,
): error is ActionInputError<T>;
export declare function isInputError(
	error?: unknown,
): error is ActionInputError<ErrorInferenceObject>;
export declare class ActionInputError<T extends ErrorInferenceObject> extends ActionError {
	type: string;
	issues: z.$ZodIssue[];
	fields: {
		[P in keyof T]?: string[] | undefined;
	};
	constructor(issues: z.$ZodIssue[]);
}
export declare function deserializeActionResult(res: SerializedActionResult): SafeResult<any, any>;
export declare const actionResultErrorStack: {
	set(stack: string | undefined): void;
	get(): string | undefined;
};
export declare function getActionQueryString(name: string): string;
export declare function getActionPathFromString({
	baseUrl,
	shouldAppendTrailingSlash,
	path: input,
}: {
	baseUrl: string;
	shouldAppendTrailingSlash: boolean;
	path: string;
}): string;
export declare function createGetActionPath(
	options: Pick<
		Parameters<typeof getActionPathFromString>[0],
		'baseUrl' | 'shouldAppendTrailingSlash'
	>,
): (action: ActionClient<any, any, any>) => string;
export declare function createActionsProxy({
	actionCallback,
	aggregatedPath,
	handleAction,
}: {
	actionCallback?: Record<string | symbol, any>;
	aggregatedPath?: string;
	handleAction: (
		param: any,
		path: string,
		context: APIContext | undefined,
	) => Promise<SafeResult<any, any>>;
}): Record<string | symbol, any>;
