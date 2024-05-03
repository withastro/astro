import type { z } from 'zod';
import type { MaybePromise } from '../utils.js';
import { ZodError } from 'zod';

type ActionErrorCode =
	| 'BAD_REQUEST'
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'UNSUPPORTED_MEDIA_TYPE'
	| 'INTERNAL_SERVER_ERROR';

export type ErrorInferenceObject = Record<string, any>;

export class ActionError<T extends ErrorInferenceObject = ErrorInferenceObject> extends Error {
	type = 'AstroActionError';
	code: ActionErrorCode = 'INTERNAL_SERVER_ERROR';
	status = 500;

	constructor(params: { message?: string; code: ActionErrorCode }) {
		super(params.message);
		this.code = params.code;
		this.status = ActionError.codeToStatus(params.code);
	}

	static codeToStatus(code: ActionErrorCode): number {
		switch (code) {
			case 'BAD_REQUEST':
				return 400;
			case 'UNAUTHORIZED':
				return 401;
			case 'FORBIDDEN':
				return 403;
			case 'NOT_FOUND':
				return 404;
			case 'UNSUPPORTED_MEDIA_TYPE':
				return 415;
			case 'INTERNAL_SERVER_ERROR':
				return 500;
		}
	}

	static statusToCode(status: number): ActionErrorCode {
		switch (status) {
			case 400:
				return 'BAD_REQUEST';
			case 401:
				return 'UNAUTHORIZED';
			case 403:
				return 'FORBIDDEN';
			case 404:
				return 'NOT_FOUND';
			case 415:
				return 'UNSUPPORTED_MEDIA_TYPE';
			case 500:
				return 'INTERNAL_SERVER_ERROR';
			default:
				return 'INTERNAL_SERVER_ERROR';
		}
	}

	static async fromResponse(res: Response) {
		if (res.status === 400 && res.headers.get('Content-Type')?.startsWith('application/json')) {
			const body = await res.json();
			if (
				typeof body === 'object' &&
				body?.type === 'AstroActionInputError' &&
				Array.isArray(body.issues)
			) {
				return new ActionInputError(body.issues);
			}
		}
		return new ActionError({
			message: res.statusText,
			code: this.statusToCode(res.status),
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
	fields: ZodError<T>['formErrors']['fieldErrors'];

	constructor(issues: z.ZodIssue[]) {
		super({ message: 'Failed to validate', code: 'BAD_REQUEST' });
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
	action: (input: any) => MaybePromise<TOutput>,
	input: any
): Promise<SafeResult<z.ZodType, TOutput>> {
	try {
		const data = await action(input);
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

export function getNameProps<T extends (args: any) => MaybePromise<unknown>>(action: T) {
	return {
		type: 'hidden',
		name: '_astroAction',
		value: action.toString(),
	} as const;
}
