import type * as vite from 'vite';

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
 */
export function secFetchMiddleware(): vite.Connect.NextHandleFunction {
	return function devSecFetch(req, res, next) {
		const secFetchSite = req.headers['sec-fetch-site'] as string | undefined;
		const secFetchMode = req.headers['sec-fetch-mode'] as string | undefined;

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

		// Block all other cross-site/cross-origin subresource requests.
		// This prevents `<script src="http://localhost:4321/...">` from another
		// origin from loading transformed source code.
		res.statusCode = 403;
		res.setHeader('Content-Type', 'text/plain');
		res.end('Cross-origin request blocked');
	};
}
