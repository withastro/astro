import type { APIContext } from '../../@types/astro.js';

export const formContentTypes = ['application/x-www-form-urlencoded', 'multipart/form-data'];

export function hasContentType(contentType: string, expected: string[]) {
	// Split off parameters like charset or boundary
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type#content-type_in_html_forms
	const type = contentType.split(';')[0].toLowerCase();

	return expected.some((t) => type === t);
}

export type ActionAPIContext = Omit<
	APIContext,
	'getActionResult' | 'callAction' | 'props' | 'redirect'
>;
export type MaybePromise<T> = T | Promise<T>;

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

/**
 * Clone a request from an already consumed body.
 * This avoids the cost of cloning of a readable stream with `request.clone()`.
 */
export function cloneRequestFromConsumedBody(request: Request, consumedBody?: BodyInit) {
	if (consumedBody instanceof FormData) {
		// Consuming the body of a urlencoded form request will create a FormData object.
		// Reset the Content-Type header to 'multipart/form-data' to match this.
		request.headers.delete('Content-Type');
	}
	return new Request(request.url, {
		method: request.method,
		headers: request.headers,
		body: consumedBody,
		mode: request.mode,
		credentials: request.credentials,
		cache: request.cache,
		redirect: request.redirect,
		referrer: request.referrer,
		integrity: request.integrity,
	});
}
