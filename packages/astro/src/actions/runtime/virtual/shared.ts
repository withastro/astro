import type { z } from 'zod';
import type { MaybePromise } from '../utils.js';

type ActionErrorCode =
	| 'BAD_REQUEST'
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'UNSUPPORTED_MEDIA_TYPE'
	| 'INTERNAL_SERVER_ERROR';

export class ActionError extends Error {
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
			case 'BAD_REQUEST': return 400;
			case 'UNAUTHORIZED': return 401;
			case 'FORBIDDEN': return 403;
			case 'NOT_FOUND': return 404;
			case 'UNSUPPORTED_MEDIA_TYPE': return 415;
			case 'INTERNAL_SERVER_ERROR': return 500;
		}
	}

	static statusToCode(status: number): ActionErrorCode {
		switch (status) {
			case 400: return 'BAD_REQUEST';
			case 401: return 'UNAUTHORIZED';
			case 403: return 'FORBIDDEN';
			case 404: return 'NOT_FOUND';
			case 415: return 'UNSUPPORTED_MEDIA_TYPE';
			case 500: return 'INTERNAL_SERVER_ERROR';
			default: return 'INTERNAL_SERVER_ERROR';
		}
	}

	static async fromResponse(res: Response) {
		if (res.status === 400 && res.headers.get('Content-Type')?.startsWith('application/json')) {
			const body = await res.json();
			if (typeof body === 'object' && body?.inputError) {
				return new ActionInputError(body.inputError);
			}
		}
		return new ActionError({
			message: res.statusText,
			code: this.statusToCode(res.status),
		});
	}
}

export type SafeResult<TInput, TOutput> = {
	data: TOutput;
	actionError: undefined;
	inputError: undefined;
} | {
	data: undefined;
	actionError: ActionError;
	inputError: undefined;
} | {
	data: undefined;
	actionError: undefined;
	inputError: z.ZodError<TInput>;
};

export class ActionInputError<T extends Record<string, any>> extends ActionError {
	type = 'AstroActionInputError';
	inputError: z.ZodError<T>;

	constructor(inputError: z.ZodError<T>) {
		super({ message: 'Failed to validate', code: 'BAD_REQUEST' });
		this.inputError = inputError;
	}
}

export async function callSafely<TInput, TOutput>(
	action: (input: TInput) => MaybePromise<TOutput>,
	input: TInput,
): Promise<SafeResult<TInput, TOutput>> {
	try {
		const data = await action(input);
		return { data, actionError: undefined, inputError: undefined };
	} catch (e) {
		if (e instanceof ActionInputError) {
			return { data: undefined, actionError: undefined, inputError: e.inputError };
		}
		if (e instanceof ActionError) {
			return { data: undefined, actionError: e, inputError: undefined };
		}
		return {
			data: undefined,
			inputError: undefined,
			actionError: new ActionError({
				message: e instanceof Error ? e.message : 'Unknown error',
				code: 'INTERNAL_SERVER_ERROR',
			}),
		};
	}
}

export function getNameProps<T extends (...args: unknown[]) => MaybePromise<unknown>>(
	action: T
) {
	return {
		type: 'hidden',
		name: '_astroAction',
		value: action.toString(),
	} as const;
}
