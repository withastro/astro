import { REROUTABLE_STATUS_CODES } from '../constants.js';
import { renderErrorFromState } from '../errors/handler.js';
import type { FetchState } from '../fetch/fetch-state.js';
import { type CompiledI18n, finalizeI18n } from './handler.js';

/**
 * Runs {@link finalizeI18n} and, when it replaces the response with a
 * null-body 404/500 (e.g. a locale-less path under `pathname-prefix-always`),
 * renders the error page for it — the reroute `handleRequest` performs after
 * `finalizeI18n` on the standard path. Responses passed through unchanged
 * are returned as-is.
 *
 * Used by the composable `astro/fetch` `i18n()` entry point, where there is
 * no surrounding `handleRequest` to supply this fallback. Kept out of
 * `handler.ts` because that module is reachable from the client-importable
 * `astro:i18n` virtual module, which must not pull in error-page rendering.
 */
export async function handleI18nWithErrorFallback(
	compiled: CompiledI18n,
	state: FetchState,
	response: Response,
): Promise<Response> {
	const result = await finalizeI18n(compiled, state, response);
	if (
		result !== response &&
		result.body === null &&
		REROUTABLE_STATUS_CODES.includes(result.status) &&
		!state.skipErrorReroute
	) {
		return renderErrorFromState(state, state.request, {
			...state.renderOptions,
			response: result,
			status: result.status as 404 | 500,
			error: result.status === 500 ? null : undefined,
			pathname: state.pathname,
		});
	}
	return result;
}
