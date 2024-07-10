export const formContentTypes = ['application/x-www-form-urlencoded', 'multipart/form-data'];

export function hasContentType(contentType: string, expected: string[]) {
	// Split off parameters like charset or boundary
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type#content-type_in_html_forms
	const type = contentType.split(';')[0].toLowerCase();

	return expected.some((t) => type === t);
}

export type MaybePromise<T> = T | Promise<T>;

/**
 * Get server-side action based on the route path.
 * Imports from `import.meta.env.ACTIONS_PATH`, which maps to
 * the user's `src/actions/index.ts` file at build-time.
 */
export async function getAction(
	path: string
): Promise<((param: unknown) => MaybePromise<unknown>) | undefined> {
	const pathKeys = path.replace('/_actions/', '').split('.');
	let { server: actionLookup } = await import(import.meta.env.ACTIONS_PATH);
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
