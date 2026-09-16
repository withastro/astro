import type { SSRManifest } from '../app/types.js';
import { getEnvironment } from '../environment/index.js';
import { FetchState } from '../fetch/fetch-state.js';
import { handleMiddleware } from '../middleware/astro-middleware.js';
import { handlePages } from '../pages/handler.js';
import { isRoute3xx } from './internal/route-errors.js';
import { getRouteTable } from './route-table.js';

/** Props handed to `src/pages/3xx.astro` for the redirect it stands in for. */
export interface RedirectPageProps {
	/** The pathname being redirected away from. */
	from: string;
	/** The redirect destination, as it appears in the `Location` header. */
	to: string;
	/** The HTTP status code of the redirect. */
	status: number;
	/**
	 * Seconds Astro's built-in page would wait before refreshing. A short delay
	 * makes search engines read the redirect as temporary, so `302` gets `2` and
	 * everything else gets `0`.
	 *
	 * https://developers.google.com/search/docs/crawling-indexing/301-redirects#metarefresh
	 */
	delay: number;
}

/** The delay Astro's built-in redirect page uses for `status`. */
export function redirectDelayFor(status: number): number {
	return status === 302 ? 2 : 0;
}

/**
 * Renders the project's `src/pages/3xx.astro` as the body of a redirect,
 * returning its HTML.
 *
 * Returns `undefined` when the project has no `3xx.astro`, or when rendering it
 * fails — the caller falls back to Astro's built-in redirect page so a broken
 * custom page degrades to a working redirect instead of failing the build.
 *
 * Middleware is skipped: it already ran for the request that produced the
 * redirect, and re-running it around a template render would let a middleware
 * that redirects recurse.
 */
export async function renderRedirectPage(
	manifest: SSRManifest,
	request: Request,
	props: RedirectPageProps,
): Promise<string | undefined> {
	const route = getRouteTable(manifest).routes.find((candidate) => isRoute3xx(candidate.route));
	if (!route) {
		return undefined;
	}

	const state = new FetchState(manifest, request);
	try {
		state.skipMiddleware = true;
		state.routeData = route;
		state.pathname = route.route;
		// The page renders as an ordinary 200; the caller re-applies the redirect
		// status to the response it builds around this HTML.
		state.status = 200;
		state.componentInstance = await getEnvironment(manifest).getComponentByRoute(manifest, route);
		state.initialProps = { ...props };

		const response = await handleMiddleware(state, handlePages);
		return await response.text();
	} catch (err) {
		state.logger.error(
			'redirects',
			`Failed to render \`src/pages/3xx.astro\` for the redirect from \`${props.from}\` to \`${props.to}\`. Falling back to the built-in redirect page.\n${
				err instanceof Error ? (err.stack ?? err.message) : String(err)
			}`,
		);
		return undefined;
	} finally {
		// Swallow a rejecting finalizer rather than let it replace the `undefined`
		// returned above: the caller reads that as "fall back to the built-in
		// redirect page", and a failure to clean up should not turn a broken
		// custom page into a failed build.
		try {
			const finalize = state.finalizeAll();
			if (finalize) await finalize;
		} catch (err) {
			state.logger.error(
				'redirects',
				`Failed to finalize the \`src/pages/3xx.astro\` render for the redirect from \`${props.from}\` to \`${props.to}\`.\n${
					err instanceof Error ? (err.stack ?? err.message) : String(err)
				}`,
			);
		}
	}
}
