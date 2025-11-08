import type { EndpointContext } from '../../types/public/context.js';
import type { SerializedActionResult } from './shared.js';

export type ActionPayload = {
	actionResult: SerializedActionResult;
	actionName: string;
};

export type Locals = {
	_actionPayload: ActionPayload;
};

export const ACTION_ENDPOINT_CONTEXT_SYMBOL = Symbol.for('astro.actionEndpointContext');
/** @deprecated Use ACTION_ENDPOINT_CONTEXT_SYMBOL instead. This will be removed in Astro 7.0. */
export const ACTION_API_CONTEXT_SYMBOL = ACTION_ENDPOINT_CONTEXT_SYMBOL;

export const formContentTypes = ['application/x-www-form-urlencoded', 'multipart/form-data'];

export function hasContentType(contentType: string, expected: string[]) {
	// Split off parameters like charset or boundary
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type#content-type_in_html_forms
	const type = contentType.split(';')[0].toLowerCase();

	return expected.some((t) => type === t);
}

export type ActionEndpointContext = Pick<
	EndpointContext,
	| 'rewrite'
	| 'request'
	| 'url'
	| 'isPrerendered'
	| 'locals'
	| 'clientAddress'
	| 'cookies'
	| 'currentLocale'
	| 'generator'
	| 'routePattern'
	| 'site'
	| 'params'
	| 'preferredLocale'
	| 'preferredLocaleList'
	| 'originPathname'
	| 'session'
	| 'csp'
>;

/** @deprecated Use ActionEndpointContext instead. This type will be removed in Astro 7.0. */
export type ActionAPIContext = ActionEndpointContext;

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

export function isActionEndpointContext(ctx: ActionEndpointContext): boolean {
	const symbol = Reflect.get(ctx, ACTION_ENDPOINT_CONTEXT_SYMBOL);
	return symbol === true;
}

/** @deprecated Use isActionEndpointContext instead. This function will be removed in Astro 7.0. */
export const isActionAPIContext = isActionEndpointContext;
