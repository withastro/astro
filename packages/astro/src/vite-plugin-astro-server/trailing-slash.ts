import {
	collapseDuplicateTrailingSlashes,
	hasFileExtension,
	isInternalPath,
} from '@astrojs/internal-helpers/path';
import type * as vite from 'vite';
import { trailingSlashMismatchTemplate } from '../template/4xx.js';
import type { AstroSettings } from '../types/astro.js';
import { writeHtmlResponse, writeRedirectResponse } from './response.js';

/**
 * Outcome of the trailing-slash evaluation for a dev-server request.
 *
 * - **`next`** — The URL is acceptable. Pass the request through to the next
 *   middleware / route handler unchanged.
 * - **`redirect`** — The URL contains duplicate trailing slashes (e.g.
 *   `/about//`). The client should be permanently redirected (301) to the
 *   collapsed form (`/about/`) so crawlers and browsers update their links.
 * - **`reject`** — The URL's trailing-slash style conflicts with the project's
 *   `trailingSlash` config (`'always'` or `'never'`). The dev server responds
 *   with a 404 and a human-readable error page explaining the mismatch, giving
 *   the developer immediate feedback that their link is wrong before it reaches
 *   production.
 */
export type TrailingSlashDecision =
	| { action: 'next' }
	| { action: 'redirect'; status: 301; location: string }
	| { action: 'reject'; status: 404; pathname: string };

/**
 * Pure decision function for trailing-slash dev-server behavior.
 *
 * Evaluates a decoded `pathname`, the query-string portion (including leading
 * `?`), and the project's `trailingSlash` config and returns the action the
 * middleware should take. The middleware is responsible for translating the
 * decision into an HTTP response.
 */
export function evaluateTrailingSlash(
	pathname: string,
	search: string,
	trailingSlash: 'always' | 'never' | 'ignore',
): TrailingSlashDecision {
	if (isInternalPath(pathname)) {
		return { action: 'next' };
	}

	const collapsed = collapseDuplicateTrailingSlashes(pathname, true);
	if (pathname && collapsed !== pathname) {
		return { action: 'redirect', status: 301, location: `${collapsed}${search}` };
	}

	if (
		(trailingSlash === 'never' && pathname.endsWith('/') && pathname !== '/') ||
		(trailingSlash === 'always' && !pathname.endsWith('/') && !hasFileExtension(pathname))
	) {
		return { action: 'reject', status: 404, pathname };
	}

	return { action: 'next' };
}

/**
 * Returns a predicate that tells whether a request URL is handled by Vite's
 * `server.proxy`, using the same key matching as Vite: keys starting with `^`
 * are regular expressions, all other keys are URL prefixes.
 */
export function createProxyMatcher(
	proxy: Record<string, unknown> | undefined,
): (url: string) => boolean {
	const matchers = Object.keys(proxy ?? {}).map((context) => {
		if (context[0] === '^') {
			const regex = new RegExp(context);
			return (url: string) => regex.test(url);
		}
		return (url: string) => url.startsWith(context);
	});
	return (url) => matchers.some((match) => match(url));
}

export function trailingSlashMiddleware(
	settings: AstroSettings,
	proxy?: Record<string, unknown>,
): vite.Connect.NextHandleFunction {
	const { trailingSlash } = settings.config;
	const isProxied = createProxyMatcher(proxy);

	return function devTrailingSlash(req, res, next) {
		// Proxied requests are not Astro routes; let Vite's proxy middleware forward them as-is.
		if (req.url && isProxied(req.url)) {
			return next();
		}
		const url = new URL(`http://localhost${req.url}`);
		let pathname: string;
		try {
			pathname = decodeURI(url.pathname);
		} catch (e) {
			/* malformed uri */
			return next(e);
		}

		const decision = evaluateTrailingSlash(pathname, url.search, trailingSlash);

		switch (decision.action) {
			case 'redirect':
				return writeRedirectResponse(res, decision.status, decision.location);
			case 'reject': {
				const html = trailingSlashMismatchTemplate(decision.pathname, trailingSlash);
				return writeHtmlResponse(res, decision.status, html);
			}
			case 'next':
				return next();
		}
	};
}
