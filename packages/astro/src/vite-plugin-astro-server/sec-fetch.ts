import type { RemotePattern } from '@astrojs/internal-helpers/remote';
import type * as vite from 'vite';
import { BaseApp } from '../core/app/base.js';
import type { Logger } from '../core/logger/core.js';

/**
 * Middleware that validates Sec-Fetch metadata headers on incoming requests
 * to block cross-origin subresource requests (e.g. `<script>` tags from
 * another origin loading dev server modules).
 *
 * Navigation requests (`Sec-Fetch-Mode: navigate`) are always allowed through
 * because browsers enforce their own security model for top-level navigations.
 *
 * Requests without `Sec-Fetch-Site` (e.g. from non-browser clients like curl,
 * or older browsers that don't send Fetch Metadata) are also allowed through
 * to avoid breaking legitimate development workflows.
 *
 * When `security.allowedDomains` is configured, requests whose `Origin` header
 * matches one of the allowed patterns are also permitted. This supports proxied
 * dev server setups (e.g. ngrok, Cloudflare Tunnel) where the browser sees a
 * different origin than the dev server itself.
 */
export function secFetchMiddleware(
	logger: Logger,
	allowedDomains?: Partial<RemotePattern>[],
): vite.Connect.NextHandleFunction {
	return function devSecFetch(req, res, next) {
		const secFetchSite = req.headers['sec-fetch-site'];
		const secFetchMode = req.headers['sec-fetch-mode'];

		// If the browser didn't send Sec-Fetch-Site, allow the request through.
		// This covers non-browser clients (curl, Postman, etc.) and older browsers.
		if (!secFetchSite) {
			return next();
		}

		// Same-origin, same-site, and "none" (e.g. direct address-bar navigation)
		// are always safe.
		if (secFetchSite === 'same-origin' || secFetchSite === 'same-site' || secFetchSite === 'none') {
			return next();
		}

		// Cross-site or cross-origin requests:
		// Allow top-level navigation (clicking a link, typing in the address bar).
		// The browser will handle any security concerns for navigations.
		if (secFetchMode === 'navigate' || secFetchMode === 'nested-navigate') {
			return next();
		}

		// Allow WebSocket upgrade requests (used by HMR).
		if (secFetchMode === 'websocket') {
			return next();
		}

		// If allowedDomains is configured, check whether the request's Origin
		// matches one of the allowed patterns. This allows proxied setups where
		// the browser's origin differs from the dev server.
		const origin = req.headers['origin'];
		if (typeof origin === 'string') {
			try {
				const originUrl = new URL(origin);
				const protocol = originUrl.protocol.slice(0, -1); // remove trailing ':'
				if (BaseApp.validateForwardedHost(originUrl.host, allowedDomains, protocol)) {
					return next();
				}
			} catch {
				// Invalid origin URL, fall through to block
			}
		}

		// Block all other cross-site/cross-origin subresource requests.
		// This prevents `<script src="http://localhost:4321/...">` from another
		// origin from loading transformed source code.
		logger.warn(
			'router',
			`Blocked cross-origin request to ${req.url} (Sec-Fetch-Site: ${secFetchSite}, Sec-Fetch-Mode: ${secFetchMode}). Cross-origin subresource requests are not allowed on the dev server for security reasons.`,
		);
		res.statusCode = 403;
		res.setHeader('Content-Type', 'text/plain');
		res.end('Cross-origin request blocked');
	};
}
