import type { ZodError } from 'zod';
import type { MaybePromise } from '../utils.js';

type ActionErrorStatus =
	| 'BAD_REQUEST'
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'INTERNAL_SERVER_ERROR';

export class ActionError extends Error {
	type = 'AstroActionError';
	status: ActionErrorStatus = 'INTERNAL_SERVER_ERROR';

	constructor(params: { message?: string; status: ActionErrorStatus }) {
		super(params.message);
		this.status = params.status;
	}
}

export class ValidationError extends ActionError {
	type = 'AstroValidationError';
	fieldErrors: ZodError;

	constructor(fieldErrors: ZodError) {
		super({ message: 'Failed to validate', status: 'BAD_REQUEST' });
		this.fieldErrors = fieldErrors;
	}
}

export async function safe<T>(
	actionResult: Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: ActionError }> {
	try {
		const data = await actionResult;
		return { success: true, data };
	} catch (e) {
		if (e instanceof ActionError) {
			return { success: false, error: e };
		}
		return {
			success: false,
			error: new ActionError({
				message: e instanceof Error ? e.message : 'Unknown error',
				status: 'INTERNAL_SERVER_ERROR',
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
