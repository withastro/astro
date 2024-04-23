import type { APIContext } from 'astro';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { ZodError } from 'zod';

export const ApiContextStorage = new AsyncLocalStorage<APIContext>();

export const formContentTypes = ['application/x-www-form-urlencoded', 'multipart/form-data'];

export async function getAction(pathKeys: string[]): Promise<Function> {
	let { default: actionLookup } = await import(import.meta.env.ACTIONS_PATH);
	for (const key of pathKeys) {
		if (!(key in actionLookup)) {
			throw new Error('Action not found');
		}
		actionLookup = actionLookup[key];
	}
	if (typeof actionLookup !== 'function') {
		throw new Error('Action not found');
	}
	return actionLookup;
}

export class ActionError extends Error {
	constructor(message: string) {
		super(message);
	}
}

export class ValidationError extends ActionError {
	error: ZodError;

	constructor(error: ZodError) {
		super('Failed to validate');
		this.error = error;
	}
}
