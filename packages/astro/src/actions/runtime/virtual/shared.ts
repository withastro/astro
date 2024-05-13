import type { z } from 'zod';
import type { MaybePromise } from '../utils.js';

type ActionErrorCode =
	| 'BAD_REQUEST'
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'TIMEOUT'
	| 'CONFLICT'
	| 'PRECONDITION_FAILED'
	| 'PAYLOAD_TOO_LARGE'
	| 'UNSUPPORTED_MEDIA_TYPE'
	| 'UNPROCESSABLE_CONTENT'
	| 'TOO_MANY_REQUESTS'
	| 'CLIENT_CLOSED_REQUEST'
	| 'INTERNAL_SERVER_ERROR';

const codeToStatusMap: Record<ActionErrorCode, number> = {
	// Implemented from tRPC error code table
	// https://trpc.io/docs/server/error-handling#error-codes
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	TIMEOUT: 405,
	CONFLICT: 409,
	PRECONDITION_FAILED: 412,
	PAYLOAD_TOO_LARGE: 413,
	UNSUPPORTED_MEDIA_TYPE: 415,
	UNPROCESSABLE_CONTENT: 422,
	TOO_MANY_REQUESTS: 429,
	CLIENT_CLOSED_REQUEST: 499,
	INTERNAL_SERVER_ERROR: 500,
};

const statusToCodeMap: Record<number, ActionErrorCode> = Object.entries(codeToStatusMap).reduce(
	// reverse the key-value pairs
	(acc, [key, value]) => ({ ...acc, [value]: key }),
	{}
);

export type ErrorInferenceObject = Record<string, any>;

export class ActionError<T extends ErrorInferenceObject = ErrorInferenceObject> extends Error {
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

	static async fromResponse(res: Response) {
		const body = await res.clone().json();
		if (
			typeof body === 'object' &&
			body?.type === 'AstroActionInputError' &&
			Array.isArray(body.issues)
		) {
			return new ActionInputError(body.issues);
		}
		if (typeof body === 'object' && body?.type === 'AstroActionError') {
			return new ActionError(body);
		}
		return new ActionError({
			message: res.statusText,
			code: ActionError.statusToCode(res.status),
		});
	}
}

export function isInputError<T extends ErrorInferenceObject>(
	error?: ActionError<T>
): error is ActionInputError<T> {
	return error instanceof ActionInputError;
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

	issues: z.ZodIssue[];
	fields: z.ZodError<T>['formErrors']['fieldErrors'];

	constructor(issues: z.ZodIssue[]) {
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
	handler: () => MaybePromise<TOutput>
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

export function getActionProps<T extends (args: FormData) => MaybePromise<unknown>>(action: T) {
	return {
		type: 'hidden',
		name: '_astroAction',
		value: action.toString(),
	} as const;
}
