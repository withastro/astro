import type { SSRManifest } from '../app/types.js';
import type { FetchState } from '../fetch/fetch-state.js';
/**
 * Post-processes a rendered `Response` against the app's i18n
 * configuration. This is the logic that previously ran as the internal
 * `createI18nMiddleware` middleware — lifted out of the middleware layer
 * so it runs as an explicit step in `AstroHandler.render` after the
 * middleware chain returns.
 *
 * Public entry points in `astro:i18n` (`createMiddleware`) preserve the
 * middleware-shaped API by wrapping an `I18n` instance in a
 * `MiddlewareHandler` closure.
 */
export declare class I18n {
	#private;
	constructor(
		i18n: NonNullable<SSRManifest['i18n']>,
		base: SSRManifest['base'],
		trailingSlash: SSRManifest['trailingSlash'],
		format: SSRManifest['buildFormat'],
	);
	finalize(state: FetchState, response: Response): Promise<Response>;
}
