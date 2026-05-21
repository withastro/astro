import { getFetchStateFromAPIContext } from '../core/fetch/fetch-state.js';
import type { SSRManifest } from '../core/app/types.js';
import { I18n } from '../core/i18n/handler.js';
import type { MiddlewareHandler } from '../types/public/common.js';

/**
 * Builds a `MiddlewareHandler` that post-processes the rendered response
 * against the given i18n configuration. This is a thin wrapper around
 * `core/i18n/handler.ts#I18n` that preserves the middleware-shaped API
 * exposed to users via `astro:i18n.middleware(...)` for the manual
 * routing strategy.
 *
 * Internal request handling no longer uses this — `AstroHandler.render`
 * invokes `I18n.finalize` directly as an explicit post-processing step.
 */
export function createI18nMiddleware(
	i18n: SSRManifest['i18n'],
	base: SSRManifest['base'],
	trailingSlash: SSRManifest['trailingSlash'],
	format: SSRManifest['buildFormat'],
): MiddlewareHandler {
	if (!i18n) return (_, next) => next();

	const handler = new I18n(i18n, base, trailingSlash, format);

	return async (context, next) => {
		const response = await next();
		return handler.finalize(getFetchStateFromAPIContext(context), response);
	};
}
