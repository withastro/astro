import type { ZodType } from 'zod';
import type { APIContext } from '../../@types/astro.js';
import type { ActionAccept, ActionClient } from './virtual/server.js';

export const formContentTypes = ['application/x-www-form-urlencoded', 'multipart/form-data'];

export function hasContentType(contentType: string, expected: string[]) {
	// Split off parameters like charset or boundary
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type#content-type_in_html_forms
	const type = contentType.split(';')[0].toLowerCase();

	return expected.some((t) => type === t);
}

export type ActionAPIContext = Omit<APIContext, 'getActionResult' | 'callAction' | 'props'>;
export type MaybePromise<T> = T | Promise<T>;

/**
 * Get server-side action based on the route path.
 * Imports from the virtual module `astro:internal-actions`, which maps to
 * the user's `src/actions/index.ts` file at build-time.
 */
export async function getAction(
	path: string
): Promise<ActionClient<unknown, ActionAccept, ZodType> | undefined> {
	const pathKeys = path.replace('/_actions/', '').split('.');
	// @ts-expect-error virtual module
	let { server: actionLookup } = await import('astro:internal-actions');

	for (const key of pathKeys) {
		if (!(key in actionLookup)) {
			return undefined;
		}
		actionLookup = actionLookup[key];
	}
	if (typeof actionLookup !== 'function') {
		return undefined;
	}
	return actionLookup;
}

/**
 * Used to preserve the input schema type in the error object.
 * This allows for type inference on the `fields` property
 * when type narrowed to an `ActionInputError`.
 *
 * Example: Action has an input schema of `{ name: z.string() }`.
 * When calling the action and checking `isInputError(result.error)`,
 * `result.error.fields` will be typed with the `name` field.
 */
export type ErrorInferenceObject = Record<string, any>;
